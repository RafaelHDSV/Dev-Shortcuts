import * as vscode from 'vscode'
import { defaultSnippets } from '../snippets/defaults'

export function registerSnippetCompletion(context: vscode.ExtensionContext) {
  const provider = vscode.languages.registerCompletionItemProvider(
    ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
    {
      provideCompletionItems(document, position) {
        const linePrefix = document
          .lineAt(position)
          .text.substring(0, position.character)

        if (!linePrefix.includes('!')) return []

        return defaultSnippets.map((snippet) => {
          const item = new vscode.CompletionItem(
            snippet.prefix,
            vscode.CompletionItemKind.Snippet
          )

          item.detail = snippet.name
          item.insertText = new vscode.SnippetString(snippet.body.join('\n'))

          return item
        })
      }
    },
    '!' // caractere trigger
  )

  context.subscriptions.push(provider)
}
