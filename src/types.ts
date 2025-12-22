import * as vscode from 'vscode'

export type SnippetSource = 'Default' | 'Custom'

export interface CustomSnippet {
  id?: string
  name: string
  prefix: string
  body: string[]
  source: SnippetSource
  description?: string
}

export interface SnippetQuickPickItem extends vscode.QuickPickItem {
  body: string[]
  source: SnippetSource
}
