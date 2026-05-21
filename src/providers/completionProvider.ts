import * as vscode from 'vscode';
import { SnippetStore } from '../storage/snippetStore';
import { applyImports } from '../import/importResolver';
import { setLastSnippetId } from '../storage/lastSnippet';
import { Snippet } from '../types';

const ON_SNIPPET_ACCEPTED = 'devShortcuts.internal.onSnippetAccepted';

export function registerCompletionProvider(
  context: vscode.ExtensionContext,
  store: SnippetStore
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      ON_SNIPPET_ACCEPTED,
      async (snippetId: string) => {
        const snippet = store.getById(snippetId);
        const editor = vscode.window.activeTextEditor;
        if (!snippet || !editor) {
          return;
        }
        if (snippet.imports?.length) {
          await applyImports(editor, snippet.imports);
        }
        await setLastSnippetId(context, snippet.id);
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
    const lineText = document.lineAt(position).text.substring(0, position.character);
    const bangIndex = lineText.lastIndexOf('!');
    if (bangIndex === -1) {return [];}

    const typed = lineText.substring(bangIndex);
    if (!/^![\w-]*$/.test(typed)) {return [];}

    const range = new vscode.Range(
      position.line,
      bangIndex,
      position.line,
      position.character
    );

    const snippets = this.store.getAll();
    return snippets.map((snippet) => this.buildItem(snippet, range));
  }

  private buildItem(snippet: Snippet, range: vscode.Range): vscode.CompletionItem {
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

    item.command = {
      command: ON_SNIPPET_ACCEPTED,
      title: 'Prepare Dev Shortcuts snippet',
      arguments: [snippet.id]
    };

    return item;
  }
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
