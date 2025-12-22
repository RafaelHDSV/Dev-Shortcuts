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

          item.detail = `${snippet.name} — ${snippet.source}`
          item.documentation = new vscode.MarkdownString(
            `**${snippet.source} Snippet**\n\n${snippet.name}`
          )

          item.range = range
          item.insertText = new vscode.SnippetString(snippet.body.join('\n'))

          item.kind =
            snippet.source === 'Custom'
              ? vscode.CompletionItemKind.Function
              : vscode.CompletionItemKind.Snippet
          item.tags =
            snippet.source === 'Custom'
              ? [vscode.CompletionItemTag.Deprecated] // só para destacar
              : []

          return item
        })
      }
    },
    '!'
  )

  context.subscriptions.push(provider)
}
