import * as vscode from 'vscode'

interface CustomSnippet {
  name: string
  body: string[]
}

export async function insertSnippet() {
  const editor = vscode.window.activeTextEditor
  if (!editor) return

  const config = vscode.workspace.getConfiguration('devShortcuts')
  const customSnippets = config.get<CustomSnippet[]>('customSnippets') || []

  const items = customSnippets.map((snippet) => ({
    label: snippet.name,
    snippet
  }))

  if (!items.length) {
    vscode.window.showInformationMessage(
      'Nenhum snippet customizado configurado.'
    )
    return
  }

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Selecione um snippet para inserir'
  })

  if (!selected) return

  editor.insertSnippet(
    new vscode.SnippetString(selected.snippet.body.join('\n'))
  )
}
