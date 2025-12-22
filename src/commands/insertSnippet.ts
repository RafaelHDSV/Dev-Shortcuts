import * as vscode from 'vscode'
import { defaultSnippets } from '../snippets/defaults'
import { CustomSnippet, SnippetQuickPickItem } from '../types'

export async function insertSnippet() {
  const editor = vscode.window.activeTextEditor
  if (!editor) return

  const config = vscode.workspace.getConfiguration('devShortcuts')
  const customSnippets = config.get<CustomSnippet[]>('customSnippets') || []

  const items: SnippetQuickPickItem[] = [
    ...defaultSnippets.map((s) => ({
      label: s.name,
      description: s.source || 'Default',
      detail: s.description,
      body: s.body,
      source: s.source || 'Default'
    })),
    ...customSnippets.map((s) => ({
      label: s.name,
      description: s.source || 'Custom',
      detail: s.description ?? 'Snippet customizado',
      body: s.body,
      source: s.source || 'Custom'
    }))
  ]

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Selecione um snippet do Dev Shortcuts'
  })

  if (!selected || !selected.body) return

  editor.insertSnippet(new vscode.SnippetString(selected.body.join('\n')))
}
