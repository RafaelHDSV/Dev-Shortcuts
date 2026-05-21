import * as vscode from 'vscode';
import { resetOnboarding } from '../utils/usageTips';
import { SnippetManagerViewProvider } from '../views/snippetManagerView';

export function createResetOnboardingCommand(
  context: vscode.ExtensionContext,
  viewProvider: SnippetManagerViewProvider
) {
  return async function resetOnboardingCommand(): Promise<void> {
    await resetOnboarding(context);
    viewProvider.refreshAfterOnboardingReset();
    vscode.window.showInformationMessage(
      'Dev Shortcuts: legacy onboarding state cleared. Snippets were kept. Reload the window if the sidebar was already open.'
    );
  };
}
