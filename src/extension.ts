import * as vscode from 'vscode'
import { insertSnippet } from './commands/insertSnippet'

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'extension.devShortcuts',
    insertSnippet
  )

  context.subscriptions.push(disposable)
}
