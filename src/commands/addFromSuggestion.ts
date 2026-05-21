import * as vscode from 'vscode';
import { randomUUID } from 'crypto';
import { SnippetStore } from '../storage/snippetStore';
import { validateSnippet } from '../validation/snippetValidator';
import {
  getSuggestionByCatalogId,
  SUGGESTION_CATALOG
} from '../snippets/suggestions';
import { SuggestedSnippet } from '../types';

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

export async function addSuggestionToStore(
  store: SnippetStore,
  suggestion: SuggestedSnippet
): Promise<void> {
  let prefix = suggestion.prefix;
  const existing = store.getByPrefix(prefix);
  if (existing) {
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
      return;
    }
    prefix = findFreePrefix(prefix, store);
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
    vscode.window.showErrorMessage(validation.message);
    return;
  }

  await store.upsert(snippet);
  vscode.window.showInformationMessage(
    `Added "${suggestion.name}" as ${prefix}. You can edit it in the manager.`
  );
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
