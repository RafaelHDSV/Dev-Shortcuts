import * as vscode from 'vscode'
import { defaultSnippets } from '../snippets/defaults'
import { CustomSnippet } from '../types'

export async function insertSnippet() {
  const editor = vscode.window.activeTextEditor
  if (!editor) return

  const config = vscode.workspace.getConfiguration('devShortcuts')
  const customSnippets = config.get<CustomSnippet[]>('customSnippets') || []

  const allSnippets = [
    ...defaultSnippets.map((s) => ({
      label: s.name,
      description: s.description,
      body: s.body
    })),
    ...customSnippets.map((s) => ({
      label: s.name,
      description: s.description ?? 'Snippet customizado',
      body: s.body
    }))
  ]

  const selected = await vscode.window.showQuickPick(allSnippets, {
    placeHolder: 'Selecione um snippet do Dev Shortcuts'
  })

  if (!selected) return

  editor.insertSnippet(new vscode.SnippetString(selected.body.join('\n')))
}
