import * as vscode from 'vscode';

/** True when running from Extension Development Host (F5), not Marketplace install. */
export function isDevExtension(context: vscode.ExtensionContext): boolean {
  return context.extensionMode === vscode.ExtensionMode.Development;
}
