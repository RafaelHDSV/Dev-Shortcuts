import * as vscode from 'vscode';
import { SnippetStore } from './storage/snippetStore';
import { registerCompletionProvider } from './providers/completionProvider';
import { createInsertSnippetCommand } from './commands/insertSnippet';
import { createOpenManagerCommand } from './commands/openManager';
import {
  createExportCommand,
  createImportCommand
} from './commands/importExport';
import { createAddFromSuggestionCommand } from './commands/addFromSuggestion';
import { createInsertLastSnippetCommand } from './commands/insertLastSnippet';
import { createResetOnboardingCommand } from './commands/resetOnboarding';
import {
  SnippetManagerViewProvider,
  VIEW_ID
} from './views/snippetManagerView';
import { isDevExtension } from './utils/devMode';

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  const store = new SnippetStore(context);
  await store.initialize();

  const viewProvider = new SnippetManagerViewProvider(context, store);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(VIEW_ID, viewProvider)
  );

  registerCompletionProvider(context, store);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'devShortcuts.openManager',
      createOpenManagerCommand(viewProvider)
    ),
    vscode.commands.registerCommand(
      'devShortcuts.insert',
      createInsertSnippetCommand(context, store)
    ),
    vscode.commands.registerCommand(
      'devShortcuts.insertLast',
      createInsertLastSnippetCommand(context, store)
    ),
    vscode.commands.registerCommand(
      'devShortcuts.export',
      createExportCommand(store)
    ),
    vscode.commands.registerCommand(
      'devShortcuts.import',
      createImportCommand(store)
    ),
    vscode.commands.registerCommand(
      'devShortcuts.addFromSuggestion',
      createAddFromSuggestionCommand(store)
    )
  );

  if (isDevExtension(context)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        'devShortcuts.resetOnboarding',
        createResetOnboardingCommand(context, viewProvider)
      )
    );
  }
}

export function deactivate(): void {
  /* context.subscriptions handles cleanup */
}
