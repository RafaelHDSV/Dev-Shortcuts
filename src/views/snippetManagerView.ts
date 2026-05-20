import * as vscode from 'vscode';
import { randomUUID } from 'crypto';
import { SnippetStore } from '../storage/snippetStore';
import { validateSnippet } from '../validation/snippetValidator';
import { Snippet } from '../types';

export const VIEW_ID = 'devShortcuts.snippetManager';

type WebviewInbound =
  | { type: 'ready' }
  | { type: 'requestList' }
  | { type: 'save'; snippet: SnippetDraft }
  | { type: 'delete'; id: string }
  | { type: 'export' }
  | { type: 'import' };

type WebviewOutbound =
  | { type: 'snippets'; data: Snippet[] }
  | { type: 'saved'; id: string }
  | { type: 'validationError'; field: string; message: string }
  | { type: 'info'; message: string };

interface SnippetDraft {
  id?: string
  name: string
  prefix: string
  body: string
  imports?: string
  description?: string
}

export class SnippetManagerViewProvider
  implements vscode.WebviewViewProvider
{
  private view?: vscode.WebviewView;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly store: SnippetStore
  ) {
    this.context.subscriptions.push(
      this.store.onDidChange(() => this.pushSnippets())
    );
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri]
    };
    view.webview.html = renderHtml(view.webview);

    view.webview.onDidReceiveMessage((msg: WebviewInbound) =>
      this.handleMessage(msg)
    );

    view.onDidDispose(() => {
      this.view = undefined;
    });
  }

  reveal(): void {
    if (this.view) {
      this.view.show?.(true);
    } else {
      vscode.commands.executeCommand(`${VIEW_ID}.focus`);
    }
  }

  private async handleMessage(msg: WebviewInbound): Promise<void> {
    switch (msg.type) {
      case 'ready':
      case 'requestList':
        this.pushSnippets();
        return;
      case 'save':
        await this.saveSnippet(msg.snippet);
        return;
      case 'delete':
        await this.store.remove(msg.id);
        return;
      case 'export':
        await vscode.commands.executeCommand('devShortcuts.export');
        return;
      case 'import':
        await vscode.commands.executeCommand('devShortcuts.import');
        return;
    }
  }

  private async saveSnippet(draft: SnippetDraft): Promise<void> {
    const body = splitLines(draft.body);
    const imports = draft.imports
      ? splitLines(draft.imports).filter((l) => l.trim().length > 0)
      : undefined;

    const candidate = {
      id: draft.id,
      name: (draft.name ?? '').trim(),
      prefix: (draft.prefix ?? '').trim(),
      body,
      imports: imports && imports.length > 0 ? imports : undefined,
      description: (draft.description ?? '').trim() || undefined
    };

    const result = validateSnippet(
      candidate,
      this.store.getAll(),
      draft.id
    );
    if (!result.ok) {
      this.post({
        type: 'validationError',
        field: result.field,
        message: result.message
      });
      return;
    }

    const saved = await this.store.upsert({
      id: candidate.id || randomUUID(),
      name: candidate.name,
      prefix: candidate.prefix,
      body: candidate.body,
      imports: candidate.imports,
      description: candidate.description
    });

    this.post({ type: 'saved', id: saved.id });
  }

  private pushSnippets(): void {
    this.post({ type: 'snippets', data: this.store.getAll() });
  }

  private post(message: WebviewOutbound): void {
    this.view?.webview.postMessage(message);
  }
}

function splitLines(text: string): string[] {
  if (!text) {return [];}
  return text.replace(/\r\n/g, '\n').split('\n');
}

function renderHtml(webview: vscode.Webview): string {
  const nonce = generateNonce();
  const csp = [
    "default-src 'none'",
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
    `img-src ${webview.cspSource} https: data:`
  ].join('; ');

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="${csp}" />
<title>Dev Shortcuts</title>
<style>
  :root { color-scheme: light dark; }
  body {
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    background: var(--vscode-sideBar-background);
    margin: 0;
    padding: 12px;
    font-size: var(--vscode-font-size);
  }
  h1, h2 { margin: 0 0 8px; font-size: 1.05em; }
  h2 { font-size: 0.95em; opacity: 0.85; }
  .toolbar { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
  button {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: 1px solid transparent;
    padding: 4px 10px;
    border-radius: 2px;
    cursor: pointer;
    font: inherit;
  }
  button:hover { background: var(--vscode-button-hoverBackground); }
  button.secondary {
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
  }
  button.secondary:hover {
    background: var(--vscode-button-secondaryHoverBackground);
  }
  button.danger {
    background: var(--vscode-errorForeground);
    color: var(--vscode-button-foreground);
  }
  ul.snippets { list-style: none; padding: 0; margin: 0 0 12px; }
  ul.snippets li {
    padding: 6px 8px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 3px;
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
  }
  ul.snippets li.active {
    border-color: var(--vscode-focusBorder);
    background: var(--vscode-list-activeSelectionBackground);
    color: var(--vscode-list-activeSelectionForeground);
  }
  ul.snippets li .meta { display: flex; flex-direction: column; }
  ul.snippets li .prefix { font-family: var(--vscode-editor-font-family); font-weight: 600; }
  ul.snippets li .name { font-size: 0.85em; opacity: 0.85; }
  form { display: flex; flex-direction: column; gap: 8px; }
  label { display: flex; flex-direction: column; gap: 2px; font-size: 0.85em; opacity: 0.85; }
  input, textarea {
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, transparent);
    padding: 4px 6px;
    border-radius: 2px;
    font: inherit;
    font-family: var(--vscode-editor-font-family);
  }
  textarea { resize: vertical; min-height: 100px; }
  .row { display: flex; gap: 6px; flex-wrap: wrap; }
  .row button { flex: 0 0 auto; }
  .status {
    margin-top: 6px;
    padding: 6px 8px;
    border-radius: 2px;
    font-size: 0.85em;
    min-height: 1.2em;
  }
  .status.error {
    background: var(--vscode-inputValidation-errorBackground);
    color: var(--vscode-inputValidation-errorForeground, var(--vscode-foreground));
    border: 1px solid var(--vscode-inputValidation-errorBorder, transparent);
  }
  .status.info {
    background: var(--vscode-inputValidation-infoBackground);
    color: var(--vscode-inputValidation-infoForeground, var(--vscode-foreground));
    border: 1px solid var(--vscode-inputValidation-infoBorder, transparent);
  }
  .hint { font-size: 0.8em; opacity: 0.7; }
  .empty { font-style: italic; opacity: 0.75; margin-bottom: 12px; }
</style>
</head>
<body>
  <h1>Dev Shortcuts</h1>
  <div class="toolbar">
    <button id="new-btn">New snippet</button>
    <button id="export-btn" class="secondary">Export</button>
    <button id="import-btn" class="secondary">Import</button>
  </div>

  <h2>Library</h2>
  <ul id="snippet-list" class="snippets"></ul>
  <div id="empty-state" class="empty" hidden>No snippets yet. Click "New snippet" to add one.</div>

  <h2 id="editor-title">New snippet</h2>
  <form id="editor">
    <input type="hidden" id="snippet-id" />
    <label>Name
      <input type="text" id="name" placeholder="Export function component" required />
    </label>
    <label>Prefix
      <input type="text" id="prefix" placeholder="!ef" required />
      <span class="hint">Must start with "!" (letters, digits, "_" or "-").</span>
    </label>
    <label>Description (optional)
      <input type="text" id="description" />
    </label>
    <label>Body
      <textarea id="body" placeholder="export function \${1:Component}() {&#10;  $0&#10;}" required></textarea>
      <span class="hint">VS Code snippet syntax: \${1:placeholder}, $0, etc.</span>
    </label>
    <label>Imports (optional, one per line)
      <textarea id="imports" placeholder="import { useState } from 'react'"></textarea>
    </label>
    <div class="row">
      <button type="submit">Save</button>
      <button type="button" id="reset-btn" class="secondary">Clear</button>
      <button type="button" id="delete-btn" class="danger" hidden>Delete</button>
    </div>
    <div id="status" class="status" aria-live="polite"></div>
  </form>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const state = { snippets: [], editingId: null };
    const els = {
      list: document.getElementById('snippet-list'),
      empty: document.getElementById('empty-state'),
      editor: document.getElementById('editor'),
      title: document.getElementById('editor-title'),
      id: document.getElementById('snippet-id'),
      name: document.getElementById('name'),
      prefix: document.getElementById('prefix'),
      description: document.getElementById('description'),
      body: document.getElementById('body'),
      imports: document.getElementById('imports'),
      status: document.getElementById('status'),
      deleteBtn: document.getElementById('delete-btn')
    };

    function clearStatus() {
      els.status.textContent = '';
      els.status.className = 'status';
    }

    function showStatus(message, kind) {
      els.status.textContent = message;
      els.status.className = 'status ' + (kind || 'info');
    }

    function resetForm() {
      state.editingId = null;
      els.id.value = '';
      els.name.value = '';
      els.prefix.value = '';
      els.description.value = '';
      els.body.value = '';
      els.imports.value = '';
      els.title.textContent = 'New snippet';
      els.deleteBtn.hidden = true;
      clearStatus();
      renderList();
    }

    function fillFromSnippet(snippet) {
      state.editingId = snippet.id;
      els.id.value = snippet.id;
      els.name.value = snippet.name;
      els.prefix.value = snippet.prefix;
      els.description.value = snippet.description || '';
      els.body.value = (snippet.body || []).join('\\n');
      els.imports.value = (snippet.imports || []).join('\\n');
      els.title.textContent = 'Edit snippet';
      els.deleteBtn.hidden = false;
      clearStatus();
      renderList();
    }

    function renderList() {
      els.list.innerHTML = '';
      if (state.snippets.length === 0) {
        els.empty.hidden = false;
        return;
      }
      els.empty.hidden = true;
      for (const snippet of state.snippets) {
        const li = document.createElement('li');
        if (snippet.id === state.editingId) li.classList.add('active');
        const meta = document.createElement('span');
        meta.className = 'meta';
        const prefix = document.createElement('span');
        prefix.className = 'prefix';
        prefix.textContent = snippet.prefix;
        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = snippet.name;
        meta.appendChild(prefix);
        meta.appendChild(name);
        li.appendChild(meta);
        li.addEventListener('click', () => fillFromSnippet(snippet));
        els.list.appendChild(li);
      }
    }

    els.editor.addEventListener('submit', (e) => {
      e.preventDefault();
      const draft = {
        id: state.editingId || undefined,
        name: els.name.value,
        prefix: els.prefix.value,
        body: els.body.value,
        imports: els.imports.value,
        description: els.description.value
      };
      vscode.postMessage({ type: 'save', snippet: draft });
    });

    document.getElementById('reset-btn').addEventListener('click', resetForm);
    document.getElementById('new-btn').addEventListener('click', resetForm);
    document.getElementById('export-btn').addEventListener('click', () => {
      vscode.postMessage({ type: 'export' });
    });
    document.getElementById('import-btn').addEventListener('click', () => {
      vscode.postMessage({ type: 'import' });
    });
    els.deleteBtn.addEventListener('click', () => {
      if (!state.editingId) return;
      vscode.postMessage({ type: 'delete', id: state.editingId });
      resetForm();
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg) return;
      switch (msg.type) {
        case 'snippets':
          state.snippets = msg.data || [];
          renderList();
          if (state.editingId) {
            const stillThere = state.snippets.find((s) => s.id === state.editingId);
            if (!stillThere) resetForm();
          }
          return;
        case 'saved':
          showStatus('Snippet saved.', 'info');
          return;
        case 'validationError':
          showStatus(msg.message, 'error');
          return;
        case 'info':
          showStatus(msg.message, 'info');
          return;
      }
    });

    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
}

function generateNonce(): string {
  return randomUUID().replace(/-/g, '');
}
