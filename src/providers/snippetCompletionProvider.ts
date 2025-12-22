import * as vscode from 'vscode'
import { defaultSnippets } from '../snippets/defaults'
import { CustomSnippet } from '../types'

export function registerSnippetCompletion(context: vscode.ExtensionContext) {
  const provider = vscode.languages.registerCompletionItemProvider(
    ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
    {
      provideCompletionItems(document, position) {
        const line = document.lineAt(position)
        const linePrefix = line.text.substring(0, position.character)

        const bangIndex = linePrefix.lastIndexOf('!')
        if (bangIndex === -1) return []

        const range = new vscode.Range(
          position.line,
          bangIndex,
          position.line,
          position.character
        )

        const config = vscode.workspace.getConfiguration('devShortcuts')
        const customSnippets =
          config.get<CustomSnippet[]>('customSnippets') || []

        const allSnippets = [...defaultSnippets, ...customSnippets]

        return allSnippets.map((snippet) => {
          const item = new vscode.CompletionItem(
            snippet.prefix,
            vscode.CompletionItemKind.Snippet
          )

          item.detail = 'Dev Shortcuts'
          item.range = range
          item.insertText = new vscode.SnippetString(snippet.body.join('\n'))

          return item
        })
      }
    },
    '!'
  )

  context.subscriptions.push(provider)
}
