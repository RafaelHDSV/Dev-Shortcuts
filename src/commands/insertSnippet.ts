import * as vscode from 'vscode'
import { defaultSnippets } from '../snippets/defaults'

interface CustomSnippet {
  name: string
  prefix: string
  body: string[]
}

export async function insertSnippet() {
  const editor = vscode.window.activeTextEditor
  if (!editor) return

  const config = vscode.workspace.getConfiguration('devShortcuts')
  const customSnippets = config.get<CustomSnippet[]>('customSnippets') || []

  const allSnippets: {
    label: string
    description: string
    body: string[]
  }[] = [
    ...defaultSnippets.map((s) => ({
      label: s.name,
      description: 'Default',
      body: s.body
    })),
    ...customSnippets.map((s) => ({
      label: s.name,
      description: 'Custom',
      body: s.body
    }))
  ]

  const selected = await vscode.window.showQuickPick(allSnippets, {
    placeHolder: 'Selecione um snippet do Dev Shortcuts'
  })

  if (!selected) return

  editor.insertSnippet(new vscode.SnippetString(selected.body.join('\n')))
}
