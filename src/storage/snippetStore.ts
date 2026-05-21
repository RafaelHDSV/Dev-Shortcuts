import * as vscode from 'vscode';
import { randomUUID } from 'crypto';
import {
  CURRENT_SCHEMA_VERSION,
  Snippet,
  SnippetStoreFile
} from '../types';

const STORE_FILENAME = 'snippets.json';
const INIT_TIMEOUT_MS = 8000;

export class SnippetStore {
  private readonly _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  private readonly ready: Promise<void>;

  private snippets: Snippet[] = [];
  private fileUri!: vscode.Uri;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.ready = this.initializeWithTimeout();
  }

  whenReady(): Promise<void> {
    return this.ready;
  }

  getAll(): Snippet[] {
    return [...this.snippets];
  }

  getById(id: string): Snippet | undefined {
    return this.snippets.find((s) => s.id === id);
  }

  getByPrefix(prefix: string): Snippet | undefined {
    return this.snippets.find((s) => s.prefix === prefix);
  }

  async upsert(input: Omit<Snippet, 'createdAt' | 'updatedAt'> & {
    createdAt?: string
    updatedAt?: string
  }): Promise<Snippet> {
    await this.whenReady();
    const now = new Date().toISOString();
    const existing = this.snippets.find((s) => s.id === input.id);

    const snippet: Snippet = {
      id: input.id || randomUUID(),
      name: input.name,
      prefix: input.prefix,
      body: input.body,
      imports: input.imports,
      description: input.description,
      createdAt: existing?.createdAt ?? input.createdAt ?? now,
      updatedAt: now
    };

    if (existing) {
      this.snippets = this.snippets.map((s) =>
        s.id === snippet.id ? snippet : s
      );
    } else {
      this.snippets = [...this.snippets, snippet];
    }

    await this.save();
    this._onDidChange.fire();
    return snippet;
  }

  async remove(id: string): Promise<void> {
    await this.whenReady();
    const before = this.snippets.length;
    this.snippets = this.snippets.filter((s) => s.id !== id);
    if (this.snippets.length !== before) {
      await this.save();
      this._onDidChange.fire();
    }
  }

  async replaceAll(snippets: Snippet[]): Promise<void> {
    await this.whenReady();
    this.snippets = snippets.map((s) => ({ ...s }));
    await this.save();
    this._onDidChange.fire();
  }

  toFileContent(): SnippetStoreFile {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      snippets: this.getAll()
    };
  }

  private async initializeWithTimeout(): Promise<void> {
    const init = this.initialize();
    const timeout = new Promise<void>((_, reject) => {
      setTimeout(
        () => reject(new Error('Snippet store init timed out')),
        INIT_TIMEOUT_MS
      );
    });
    try {
      await Promise.race([init, timeout]);
    } catch (err) {
      console.error('[Dev Shortcuts] Store init failed, starting empty:', err);
      this.snippets = [];
      if (!this.fileUri) {
        this.fileUri = vscode.Uri.joinPath(
          this.context.globalStorageUri,
          STORE_FILENAME
        );
      }
    }
  }

  private async initialize(): Promise<void> {
    await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);
    this.fileUri = vscode.Uri.joinPath(
      this.context.globalStorageUri,
      STORE_FILENAME
    );
    await this.load();
  }

  private async load(): Promise<void> {
    try {
      const raw = await vscode.workspace.fs.readFile(this.fileUri);
      const text = new TextDecoder('utf-8').decode(raw);
      const parsed = JSON.parse(text) as SnippetStoreFile;
      this.snippets = this.migrate(parsed);
    } catch (err) {
      if (isFileNotFound(err)) {
        this.snippets = [];
        return;
      }
      console.error('[Dev Shortcuts] Failed to read snippets store:', err);
      this.snippets = [];
    }
  }

  private async save(): Promise<void> {
    const file: SnippetStoreFile = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      snippets: this.snippets
    };
    const bytes = new TextEncoder().encode(JSON.stringify(file, null, 2));
    await vscode.workspace.fs.writeFile(this.fileUri, bytes);
  }

  private migrate(file: Partial<SnippetStoreFile>): Snippet[] {
    if (!file || !Array.isArray(file.snippets)) {
      return [];
    }
    const normalized = file.snippets
      .map((s) => normalizeSnippet(s))
      .filter((s): s is Snippet => s !== null);
    return normalized;
  }
}

function normalizeSnippet(input: unknown): Snippet | null {
  if (!input || typeof input !== 'object') {
    return null;
  }
  const record = input as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name : null;
  const prefix = typeof record.prefix === 'string' ? record.prefix : null;
  if (!name || !prefix) {
    return null;
  }

  const rawBody = record.body;
  const body = Array.isArray(rawBody)
    ? rawBody.filter((l): l is string => typeof l === 'string')
    : typeof rawBody === 'string'
      ? rawBody.split(/\r?\n/)
      : [];
  if (body.length === 0) {
    return null;
  }

  const importsRaw = record.imports;
  const imports = Array.isArray(importsRaw)
    ? importsRaw.filter((l): l is string => typeof l === 'string')
    : undefined;

  const id = typeof record.id === 'string' && record.id ? record.id : randomUUID();
  const now = new Date().toISOString();

  return {
    id,
    name,
    prefix,
    body,
    imports: imports && imports.length > 0 ? imports : undefined,
    description:
      typeof record.description === 'string' ? record.description : undefined,
    createdAt:
      typeof record.createdAt === 'string' ? record.createdAt : now,
    updatedAt:
      typeof record.updatedAt === 'string' ? record.updatedAt : now
  };
}

function isFileNotFound(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }
  const code = (err as { code?: string }).code;
  return code === 'FileNotFound' || code === 'ENOENT';
}
