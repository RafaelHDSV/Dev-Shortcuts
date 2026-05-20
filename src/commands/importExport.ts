import * as vscode from 'vscode';
import { randomUUID } from 'crypto';
import { SnippetStore } from '../storage/snippetStore';
import { validateSnippet } from '../validation/snippetValidator';
import {
  CURRENT_SCHEMA_VERSION,
  ImportSummary,
  Snippet,
  SnippetStoreFile
} from '../types';

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

export function createExportCommand(store: SnippetStore) {
  return async function exportSnippets(): Promise<void> {
    const snippets = store.getAll();
    if (snippets.length === 0) {
      vscode.window.showInformationMessage('No snippets to export.');
      return;
    }

    const defaultName = `dev-shortcuts-${stamp()}.json`;
    const target = await vscode.window.showSaveDialog({
      title: 'Export Dev Shortcuts snippets',
      defaultUri: vscode.Uri.file(defaultName),
      filters: { JSON: ['json'] }
    });
    if (!target) {return;}

    const file: SnippetStoreFile = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      snippets
    };
    const bytes = new TextEncoder().encode(JSON.stringify(file, null, 2));
    await vscode.workspace.fs.writeFile(target, bytes);
    vscode.window.showInformationMessage(
      `Exported ${snippets.length} snippet(s) to ${target.fsPath}.`
    );
  };
}

export function createImportCommand(store: SnippetStore) {
  return async function importSnippets(): Promise<void> {
    const picked = await vscode.window.showOpenDialog({
      title: 'Import Dev Shortcuts snippets',
      canSelectMany: false,
      filters: { JSON: ['json'] }
    });
    if (!picked || picked.length === 0) {return;}

    const uri = picked[0];
    let raw: Uint8Array;
    try {
      raw = await vscode.workspace.fs.readFile(uri);
    } catch (err) {
      vscode.window.showErrorMessage(
        `Failed to read file: ${describeError(err)}`
      );
      return;
    }

    if (raw.byteLength > MAX_IMPORT_BYTES) {
      vscode.window.showErrorMessage(
        `Import file is too large (max ${MAX_IMPORT_BYTES / 1024 / 1024} MB).`
      );
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(new TextDecoder('utf-8').decode(raw));
    } catch (err) {
      vscode.window.showErrorMessage(`Invalid JSON: ${describeError(err)}`);
      return;
    }

    const candidates = extractSnippets(parsed);
    if (candidates.length === 0) {
      vscode.window.showWarningMessage(
        'No valid snippets found in the selected file.'
      );
      return;
    }

    const policy = await askPolicyIfNeeded(candidates, store);
    if (policy === undefined) {return;}

    const summary = await mergeSnippets(store, candidates, policy);
    vscode.window.showInformationMessage(
      `Import finished: ${summary.added} added, ${summary.overwritten} overwritten, ${summary.renamed} renamed, ${summary.skipped} skipped.`
    );
  };
}

function extractSnippets(payload: unknown): Snippet[] {
  if (!payload || typeof payload !== 'object') {return [];}
  const arr = Array.isArray(payload)
    ? payload
    : (payload as { snippets?: unknown[] }).snippets;
  if (!Array.isArray(arr)) {return [];}

  const out: Snippet[] = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') {continue;}
    const record = item as Record<string, unknown>;
    const name = typeof record.name === 'string' ? record.name : '';
    const prefix = typeof record.prefix === 'string' ? record.prefix : '';
    const rawBody = record.body;
    const body = Array.isArray(rawBody)
      ? rawBody.filter((l): l is string => typeof l === 'string')
      : typeof rawBody === 'string'
        ? rawBody.split(/\r?\n/)
        : [];
    if (!name || !prefix || body.length === 0) {continue;}

    const importsRaw = record.imports;
    const imports = Array.isArray(importsRaw)
      ? importsRaw.filter((l): l is string => typeof l === 'string')
      : undefined;

    const now = new Date().toISOString();
    out.push({
      id:
        typeof record.id === 'string' && record.id ? record.id : randomUUID(),
      name,
      prefix,
      body,
      imports: imports && imports.length > 0 ? imports : undefined,
      description:
        typeof record.description === 'string'
          ? record.description
          : undefined,
      createdAt:
        typeof record.createdAt === 'string' ? record.createdAt : now,
      updatedAt:
        typeof record.updatedAt === 'string' ? record.updatedAt : now
    });
  }
  return out;
}

async function askPolicyIfNeeded(
  incoming: Snippet[],
  store: SnippetStore
): Promise<'skip' | 'overwrite' | 'rename' | undefined> {
  const existingPrefixes = new Set(store.getAll().map((s) => s.prefix));
  const hasConflict = incoming.some((s) => existingPrefixes.has(s.prefix));
  if (!hasConflict) {return 'skip';}

  const choice = await vscode.window.showQuickPick(
    [
      {
        label: 'Skip duplicates',
        description: 'Keep current snippets, ignore duplicates',
        value: 'skip' as const
      },
      {
        label: 'Overwrite duplicates',
        description: 'Replace current snippets with imported ones',
        value: 'overwrite' as const
      },
      {
        label: 'Rename duplicates',
        description: 'Suffix imported prefix with a number',
        value: 'rename' as const
      }
    ],
    {
      title: 'Some prefixes already exist',
      placeHolder: 'Choose how to resolve duplicate prefixes'
    }
  );
  return choice?.value;
}

async function mergeSnippets(
  store: SnippetStore,
  incoming: Snippet[],
  policy: 'skip' | 'overwrite' | 'rename'
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    added: 0,
    overwritten: 0,
    skipped: 0,
    renamed: 0
  };

  for (const snippet of incoming) {
    const usedPrefixes = new Set(store.getAll().map((s) => s.prefix));
    const existing = store.getByPrefix(snippet.prefix);

    let toSave: Snippet = { ...snippet, id: snippet.id || randomUUID() };
    if (existing) {
      if (policy === 'skip') {
        summary.skipped += 1;
        continue;
      }
      if (policy === 'overwrite') {
        toSave = { ...toSave, id: existing.id, createdAt: existing.createdAt };
        summary.overwritten += 1;
      } else {
        const renamed = renamePrefix(snippet.prefix, usedPrefixes);
        toSave = { ...toSave, prefix: renamed, id: randomUUID() };
        summary.renamed += 1;
      }
    } else {
      summary.added += 1;
    }

    const validation = validateSnippet(toSave, store.getAll(), toSave.id);
    if (!validation.ok) {
      summary.skipped += 1;
      if (policy !== 'skip') {
        if (existing) {summary.overwritten = Math.max(0, summary.overwritten - 1);}
        else {summary.added = Math.max(0, summary.added - 1);}
        if (policy === 'rename') {summary.renamed = Math.max(0, summary.renamed - 1);}
      }
      continue;
    }

    await store.upsert(toSave);
  }
  return summary;
}

function renamePrefix(prefix: string, used: Set<string>): string {
  let n = 2;
  let candidate = `${prefix}${n}`;
  while (used.has(candidate)) {
    n += 1;
    candidate = `${prefix}${n}`;
  }
  return candidate;
}

function stamp(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function describeError(err: unknown): string {
  if (err instanceof Error) {return err.message;}
  return String(err);
}
