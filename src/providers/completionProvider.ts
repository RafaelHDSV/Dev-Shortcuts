import * as vscode from 'vscode';
import { SnippetStore } from '../storage/snippetStore';
import { buildImportTextEdit } from '../import/importResolver';
import { setLastSnippetId } from '../storage/lastSnippet';
import { Snippet } from '../types';

const TRACK_LAST_COMMAND = 'devShortcuts.internal.trackLastSnippet';

export function registerCompletionProvider(
  context: vscode.ExtensionContext,
  store: SnippetStore
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      TRACK_LAST_COMMAND,
      (snippetId: string) => {
        if (typeof snippetId === 'string' && snippetId) {
          void setLastSnippetId(context, snippetId);
        }
      }
    )
  );

  const provider = vscode.languages.registerCompletionItemProvider(
    { scheme: 'file' },
    new SnippetCompletionItemProvider(store),
    '!'
  );
  context.subscriptions.push(provider);

  const untitledProvider = vscode.languages.registerCompletionItemProvider(
    { scheme: 'untitled' },
    new SnippetCompletionItemProvider(store),
    '!'
  );
  context.subscriptions.push(untitledProvider);
}

class SnippetCompletionItemProvider
  implements vscode.CompletionItemProvider
{
  constructor(private readonly store: SnippetStore) {}

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const lineText = document
      .lineAt(position)
      .text.substring(0, position.character);
    const bangIndex = lineText.lastIndexOf('!');
    if (bangIndex === -1) {
      return [];
    }

    const typed = lineText.substring(bangIndex);
    if (!/^![\w-]*$/.test(typed)) {
      return [];
    }

    const range = new vscode.Range(
      position.line,
      bangIndex,
      position.line,
      position.character
    );

    return this.store
      .getAll()
      .map((snippet) => buildItem(document, snippet, range));
  }
}

function buildItem(
  document: vscode.TextDocument,
  snippet: Snippet,
  range: vscode.Range
): vscode.CompletionItem {
  const item = new vscode.CompletionItem(
    { label: snippet.prefix, description: snippet.name },
    vscode.CompletionItemKind.Snippet
  );
  item.detail = snippet.name;
  item.documentation = buildDocumentation(snippet);
  item.insertText = new vscode.SnippetString(snippet.body.join('\n'));
  item.range = range;
  item.filterText = snippet.prefix;
  item.sortText = snippet.prefix;

  if (snippet.imports?.length) {
    const importEdit = buildImportTextEdit(document, snippet.imports);
    if (importEdit) {
      item.additionalTextEdits = [importEdit];
    }
  }

  item.command = {
    command: TRACK_LAST_COMMAND,
    title: 'Track Dev Shortcuts snippet',
    arguments: [snippet.id]
  };

  return item;
}

function buildDocumentation(snippet: Snippet): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  md.appendMarkdown(`**${snippet.name}**\n\n`);
  if (snippet.description) {
    md.appendMarkdown(`${snippet.description}\n\n`);
  }
  md.appendCodeblock(snippet.body.join('\n'));
  if (snippet.imports && snippet.imports.length > 0) {
    md.appendMarkdown('\n_Adds imports:_\n');
    md.appendCodeblock(snippet.imports.join('\n'));
  }
  return md;
}
