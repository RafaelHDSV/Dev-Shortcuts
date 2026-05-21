import * as vscode from 'vscode';
import { randomUUID } from 'crypto';
import { SnippetStore } from '../storage/snippetStore';
import { validateSnippet } from '../validation/snippetValidator';
import {
  getSuggestionByCatalogId,
  SUGGESTION_CATALOG
} from '../snippets/suggestions';
import { Snippet, SuggestedSnippet } from '../types';

export function createAddFromSuggestionCommand(store: SnippetStore) {
  return async function addFromSuggestion(
    catalogId?: string
  ): Promise<void> {
    const suggestion = catalogId
      ? getSuggestionByCatalogId(catalogId)
      : await pickSuggestion();
    if (!suggestion) {
      return;
    }
    await addSuggestionToStore(store, suggestion);
  };
}

export interface AddSuggestionOptions {
  /** When true (webview), auto-suffix duplicate prefix instead of prompting. */
  silentRename?: boolean;
}

export async function addSuggestionToStore(
  store: SnippetStore,
  suggestion: SuggestedSnippet,
  options?: AddSuggestionOptions
): Promise<Snippet | undefined> {
  let prefix = suggestion.prefix;
  const existing = store.getByPrefix(prefix);
  if (existing) {
    if (options?.silentRename) {
      prefix = findFreePrefix(prefix, store);
    } else {
      const rename = await vscode.window.showQuickPick(
        [
          {
            label: 'Rename imported prefix',
            description: `Suggest ${prefix}2, ${prefix}3, ...`,
            value: 'rename' as const
          },
          {
            label: 'Cancel',
            value: 'cancel' as const
          }
        ],
        {
          title: `Prefix "${prefix}" already exists`,
          placeHolder: 'Choose an action'
        }
      );
      if (rename?.value !== 'rename') {
        return undefined;
      }
      prefix = findFreePrefix(prefix, store);
    }
  }

  const snippet = {
    id: randomUUID(),
    name: suggestion.name,
    prefix,
    body: [...suggestion.body],
    imports: suggestion.imports ? [...suggestion.imports] : undefined,
    description: suggestion.description
  };

  const validation = validateSnippet(snippet, store.getAll());
  if (!validation.ok) {
    if (!options?.silentRename) {
      vscode.window.showErrorMessage(validation.message);
    }
    return undefined;
  }

  const saved = await store.upsert(snippet);
  if (!options?.silentRename) {
    vscode.window.showInformationMessage(
      `Added "${suggestion.name}" as ${prefix}. You can edit it in the manager.`
    );
  }
  return saved;
}

async function pickSuggestion(): Promise<SuggestedSnippet | undefined> {
  const items = SUGGESTION_CATALOG.map((s) => ({
    label: s.prefix,
    description: s.name,
    detail: `${s.category} — ${s.description ?? ''}`,
    suggestion: s
  }));

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: 'Choose a suggested snippet to add to your library',
    matchOnDescription: true,
    matchOnDetail: true
  });
  return picked?.suggestion;
}

function findFreePrefix(base: string, store: SnippetStore): string {
  const used = new Set(store.getAll().map((s) => s.prefix));
  let n = 2;
  let candidate = `${base}${n}`;
  while (used.has(candidate)) {
    n += 1;
    candidate = `${base}${n}`;
  }
  return candidate;
}
