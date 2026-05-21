import * as vscode from 'vscode';
import { SnippetStore } from '../storage/snippetStore';
import { applyImports } from '../import/importResolver';
import { getLastSnippetId, setLastSnippetId } from '../storage/lastSnippet';
import { createInsertSnippetCommand } from './insertSnippet';

export function createInsertLastSnippetCommand(
  context: vscode.ExtensionContext,
  store: SnippetStore
) {
  const insertPicker = createInsertSnippetCommand(context, store);

  return async function insertLastSnippet(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage(
        'Open an editor to insert a Dev Shortcuts snippet.'
      );
      return;
    }

    const lastId = getLastSnippetId(context);
    if (!lastId) {
      await insertPicker();
      return;
    }

    const snippet = store.getById(lastId);
    if (!snippet) {
      await insertPicker();
      return;
    }

    if (snippet.imports && snippet.imports.length > 0) {
      await applyImports(editor, snippet.imports);
    }
    await editor.insertSnippet(
      new vscode.SnippetString(snippet.body.join('\n'))
    );
    await setLastSnippetId(context, snippet.id);
  };
}
