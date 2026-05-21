import * as vscode from 'vscode';
import { SnippetStore } from '../storage/snippetStore';
import { applyImports } from '../import/importResolver';
import { Snippet } from '../types';
import { setLastSnippetId } from '../storage/lastSnippet';

interface SnippetQuickPickItem extends vscode.QuickPickItem {
  snippet: Snippet
}

export function createInsertSnippetCommand(
  context: vscode.ExtensionContext,
  store: SnippetStore
) {
  return async function insertSnippet(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage(
        'Open an editor to insert a Dev Shortcuts snippet.'
      );
      return;
    }

    const snippets = store.getAll();
    if (snippets.length === 0) {
      const open = await vscode.window.showInformationMessage(
        'You have no snippets yet. Open the Dev Shortcuts manager to create one.',
        'Manage snippets'
      );
      if (open) {
        await vscode.commands.executeCommand('devShortcuts.openManager');
      }
      return;
    }

    const items: SnippetQuickPickItem[] = snippets
      .slice()
      .sort((a, b) => a.prefix.localeCompare(b.prefix))
      .map((snippet) => ({
        label: snippet.prefix,
        description: snippet.name,
        detail: snippet.description,
        snippet
      }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a Dev Shortcuts snippet to insert',
      matchOnDescription: true,
      matchOnDetail: true
    });
    if (!picked) {return;}

    if (picked.snippet.imports && picked.snippet.imports.length > 0) {
      await applyImports(editor, picked.snippet.imports);
    }
    await editor.insertSnippet(
      new vscode.SnippetString(picked.snippet.body.join('\n'))
    );
    await setLastSnippetId(context, picked.snippet.id);
  };
}
