import * as vscode from 'vscode'
import { insertSnippet } from './commands/insertSnippet'
import { registerSnippetCompletion } from './providers/snippetCompletionProvider'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.devShortcuts', insertSnippet)
  )

  registerSnippetCompletion(context)
}
