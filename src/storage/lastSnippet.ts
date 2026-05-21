import * as vscode from 'vscode';

const LAST_SNIPPET_KEY = 'devShortcuts.lastSnippetId';

export function getLastSnippetId(
  context: vscode.ExtensionContext
): string | undefined {
  return context.globalState.get<string>(LAST_SNIPPET_KEY);
}

export async function setLastSnippetId(
  context: vscode.ExtensionContext,
  snippetId: string
): Promise<void> {
  await context.globalState.update(LAST_SNIPPET_KEY, snippetId);
}
