import * as vscode from 'vscode';
import { randomUUID } from 'crypto';
import { SnippetStore } from '../storage/snippetStore';
import { validateSnippet } from '../validation/snippetValidator';
import { addSuggestionToStore } from '../commands/addFromSuggestion';
import { SUGGESTION_CATALOG } from '../snippets/suggestions';
import {
  dismissTip,
  getActiveTips,
  hasSeenWelcome,
  markWelcomeSeen
} from '../utils/usageTips';
import { Snippet } from '../types';

export const VIEW_ID = 'devShortcuts.snippetManager';

type WebviewInbound =
  | { type: 'ready' }
  | { type: 'requestInit' }
  | { type: 'save'; snippet: SnippetDraft }
  | { type: 'delete'; id: string }
  | { type: 'export' }
  | { type: 'import' }
  | { type: 'addSuggestion'; catalogId: string }
  | { type: 'dismissTip'; tipId: string }
  | { type: 'dismissWelcome' };

type WebviewOutbound =
  | { type: 'init'; snippets: Snippet[]; suggestions: typeof SUGGESTION_CATALOG; tips: ReturnType<typeof getActiveTips>; showWelcome: boolean }
  | { type: 'snippets'; data: Snippet[] }
  | { type: 'tips'; data: ReturnType<typeof getActiveTips> }
  | { type: 'saved'; id: string }
  | { type: 'validationError'; field: string; message: string }
  | { type: 'info'; message: string };

interface SnippetDraft {
  id?: string;
  name: string;
  prefix: string;
  body: string;
  imports?: string;
  description?: string;
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
      this.store.onDidChange(() => {
        this.pushSnippets();
      })
    );
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri]
    };

    view.webview.onDidReceiveMessage((msg: WebviewInbound) => {
      void this.handleMessage(msg).catch((err) => {
        console.error('[Dev Shortcuts] webview message failed:', err);
        this.post({
          type: 'info',
          message: 'Something went wrong. Try reopening the Dev Shortcuts view.'
        });
      });
    });

    view.webview.html = renderHtml(view.webview);

    view.onDidChangeVisibility(() => {
      if (view.visible) {
        this.pushInit();
      }
    });

    view.onDidDispose(() => {
      this.view = undefined;
    });

    queueMicrotask(() => this.pushInit());
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
      case 'requestInit':
        this.pushInit();
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
      case 'addSuggestion': {
        const item = SUGGESTION_CATALOG.find(
          (s) => s.catalogId === msg.catalogId
        );
        if (item) {
          await addSuggestionToStore(this.store, item);
          this.post({
            type: 'info',
            message: `Added "${item.name}" to your library.`
          });
        }
        return;
      }
      case 'dismissTip':
        await dismissTip(this.context, msg.tipId);
        this.pushTips();
        return;
      case 'dismissWelcome':
        await markWelcomeSeen(this.context);
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

  private pushInit(): void {
    this.post({
      type: 'init',
      snippets: this.store.getAll(),
      suggestions: SUGGESTION_CATALOG,
      tips: getActiveTips(this.context),
      showWelcome: !hasSeenWelcome(this.context)
    });
  }

  private pushSnippets(): void {
    this.post({ type: 'snippets', data: this.store.getAll() });
  }

  private pushTips(): void {
    this.post({ type: 'tips', data: getActiveTips(this.context) });
  }

  private post(message: WebviewOutbound): void {
    this.view?.webview.postMessage(message);
  }
}

function splitLines(text: string): string[] {
  if (!text) {
    return [];
  }
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
  h1 { margin: 0 0 10px; font-size: 1.1em; }
  h2 { margin: 12px 0 6px; font-size: 0.95em; opacity: 0.9; }
  .tabs { display: flex; gap: 4px; margin-bottom: 10px; border-bottom: 1px solid var(--vscode-panel-border); }
  .tab {
    background: transparent;
    color: var(--vscode-foreground);
    border: none;
    border-bottom: 2px solid transparent;
    padding: 6px 10px;
    cursor: pointer;
    font: inherit;
    opacity: 0.75;
  }
  .tab.active {
    opacity: 1;
    border-bottom-color: var(--vscode-focusBorder);
    font-weight: 600;
  }
  .panel { display: none; }
  .panel.active { display: block; }
  .toolbar { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
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
  button.secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
  button.danger { background: var(--vscode-errorForeground); color: var(--vscode-button-foreground); }
  button.small { padding: 2px 8px; font-size: 0.85em; }
  ul.snippets, ul.suggestions { list-style: none; padding: 0; margin: 0 0 10px; }
  ul.snippets li, ul.suggestions li {
    padding: 6px 8px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 3px;
    margin-bottom: 4px;
    cursor: pointer;
  }
  ul.snippets li.active {
    border-color: var(--vscode-focusBorder);
    background: var(--vscode-list-activeSelectionBackground);
    color: var(--vscode-list-activeSelectionForeground);
  }
  ul.suggestions li { cursor: default; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  .meta .prefix { font-family: var(--vscode-editor-font-family); font-weight: 600; display: block; }
  .meta .name { font-size: 0.85em; opacity: 0.85; }
  .badge {
    font-size: 0.7em;
    text-transform: uppercase;
    opacity: 0.7;
    margin-left: 4px;
  }
  form { display: flex; flex-direction: column; gap: 8px; }
  label { display: flex; flex-direction: column; gap: 2px; font-size: 0.85em; opacity: 0.85; }
  input, textarea, select {
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, transparent);
    padding: 4px 6px;
    border-radius: 2px;
    font: inherit;
    font-family: var(--vscode-editor-font-family);
  }
  textarea { resize: vertical; min-height: 90px; }
  .preview-box {
    background: var(--vscode-textCodeBlock-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 3px;
    padding: 8px;
    font-family: var(--vscode-editor-font-family);
    font-size: 0.9em;
    white-space: pre-wrap;
    word-break: break-word;
    min-height: 48px;
  }
  .preview-box .ts {
    background: var(--vscode-editor-findMatchHighlightBackground);
    border-radius: 2px;
    padding: 0 2px;
  }
  .preview-box .end { opacity: 0.6; font-style: italic; }
  .row { display: flex; gap: 6px; flex-wrap: wrap; }
  .status {
    margin-top: 4px;
    padding: 6px 8px;
    border-radius: 2px;
    font-size: 0.85em;
    min-height: 1.2em;
  }
  .status.error {
    background: var(--vscode-inputValidation-errorBackground);
    color: var(--vscode-inputValidation-errorForeground, var(--vscode-foreground));
  }
  .status.info {
    background: var(--vscode-inputValidation-infoBackground);
    color: var(--vscode-inputValidation-infoForeground, var(--vscode-foreground));
  }
  .hint { font-size: 0.8em; opacity: 0.7; }
  .empty { font-style: italic; opacity: 0.75; margin-bottom: 8px; }
  .tips { margin-bottom: 12px; }
  .tip-card {
    border: 1px solid var(--vscode-panel-border);
    border-radius: 3px;
    padding: 8px;
    margin-bottom: 6px;
    position: relative;
  }
  .tip-card strong { display: block; margin-bottom: 4px; }
  .tip-card p { margin: 0; font-size: 0.9em; opacity: 0.9; }
  .welcome {
    border: 1px solid var(--vscode-focusBorder);
    background: var(--vscode-inputValidation-infoBackground);
    padding: 10px;
    border-radius: 3px;
    margin-bottom: 10px;
  }
  .filter-row { margin-bottom: 8px; }
</style>
</head>
<body>
  <h1>Dev Shortcuts</h1>

  <div id="welcome" class="welcome" hidden>
    <strong>Welcome</strong>
    <p>Type <code>!</code> in any editor to trigger your snippets. Nothing is pre-installed — browse <strong>Suggestions</strong> or create your own.</p>
    <button type="button" id="welcome-dismiss" class="small secondary">Got it</button>
  </div>

  <div id="tips" class="tips"></div>

  <div class="tabs" role="tablist">
    <button type="button" class="tab active" data-tab="library">Library</button>
    <button type="button" class="tab" data-tab="suggestions">Suggestions</button>
  </div>

  <div id="panel-library" class="panel active">
    <div class="toolbar">
      <button type="button" id="new-btn">New snippet</button>
      <button type="button" id="export-btn" class="secondary">Export</button>
      <button type="button" id="import-btn" class="secondary">Import</button>
    </div>
    <h2>Your snippets</h2>
    <ul id="snippet-list" class="snippets"></ul>
    <div id="empty-state" class="empty" hidden>No snippets yet.</div>

    <h2 id="editor-title">New snippet</h2>
    <form id="editor">
      <input type="hidden" id="snippet-id" />
      <label>Name <input type="text" id="name" placeholder="Export function component" required /></label>
      <label>Prefix
        <input type="text" id="prefix" placeholder="!ef" required />
        <span class="hint">Must start with "!"</span>
      </label>
      <label>Description (optional) <input type="text" id="description" /></label>
      <label>Body
        <textarea id="body" placeholder="export function \${1:Component}() {&#10;  $0&#10;}" required></textarea>
      </label>
      <label>Live preview</label>
      <div id="preview" class="preview-box" aria-live="polite"></div>
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
  </div>

  <div id="panel-suggestions" class="panel">
    <p class="hint">Templates are opt-in. Add copies to your library — they never auto-activate in completion.</p>
    <div class="filter-row">
      <label>Category
        <select id="suggestion-filter">
          <option value="all">All</option>
          <option value="react">React</option>
          <option value="generic">Generic</option>
        </select>
      </label>
    </div>
    <ul id="suggestion-list" class="suggestions"></ul>
  </div>

  <script nonce="${nonce}">
    (function () {
    const LINE_BREAK = String.fromCharCode(10);
    let vscode;
    try {
      vscode = acquireVsCodeApi();
    } catch (err) {
      document.body.innerHTML =
        '<p style="padding:12px">Dev Shortcuts failed to load. Reload the window (Developer: Reload Window).</p>';
      return;
    }
    const state = vscode.getState() || {
      snippets: [],
      suggestions: [],
      tips: [],
      editingId: null,
      tab: 'library'
    };

    const els = {
      welcome: document.getElementById('welcome'),
      tips: document.getElementById('tips'),
      list: document.getElementById('snippet-list'),
      empty: document.getElementById('empty-state'),
      suggestionList: document.getElementById('suggestion-list'),
      suggestionFilter: document.getElementById('suggestion-filter'),
      editor: document.getElementById('editor'),
      title: document.getElementById('editor-title'),
      id: document.getElementById('snippet-id'),
      name: document.getElementById('name'),
      prefix: document.getElementById('prefix'),
      description: document.getElementById('description'),
      body: document.getElementById('body'),
      imports: document.getElementById('imports'),
      preview: document.getElementById('preview'),
      status: document.getElementById('status'),
      deleteBtn: document.getElementById('delete-btn')
    };

    function escapeHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function renderSnippetPreview(text) {
      if (!text) return '<span class="end">(empty)</span>';
      const lines = text.split(LINE_BREAK);
      return lines.map((line) => {
        let out = escapeHtml(line);
        out = out.replace(/\\$\\{([0-9]+):([^}]+)\\}/g, '<span class="ts">$2</span>');
        out = out.replace(/\\$([0-9]+)/g, '<span class="ts">[tab $1]</span>');
        out = out.replace(/\\$TM_([A-Za-z0-9_]+)/g, '<span class="ts">TM_$1</span>');
        if (/\\$0/.test(line)) { out += ' <span class="end">(final cursor)</span>'; }
        return out;
      }).join('<br>');
    }

    function updatePreview() {
      els.preview.innerHTML = renderSnippetPreview(els.body.value);
    }

    function setTab(name) {
      state.tab = name;
      document.querySelectorAll('.tab').forEach((t) => {
        t.classList.toggle('active', t.dataset.tab === name);
      });
      document.querySelectorAll('.panel').forEach((p) => {
        p.classList.toggle('active', p.id === 'panel-' + name);
      });
    }

    document.querySelectorAll('.tab').forEach((btn) => {
      btn.addEventListener('click', () => setTab(btn.dataset.tab));
    });

    function renderTips() {
      els.tips.innerHTML = '';
      for (const tip of state.tips) {
        const card = document.createElement('div');
        card.className = 'tip-card';
        card.innerHTML = '<strong>' + escapeHtml(tip.title) + '</strong><p>' + escapeHtml(tip.body) + '</p>';
        const dismiss = document.createElement('button');
        dismiss.type = 'button';
        dismiss.className = 'small secondary';
        dismiss.textContent = 'Dismiss';
        dismiss.style.marginTop = '6px';
        dismiss.addEventListener('click', () => {
          vscode.postMessage({ type: 'dismissTip', tipId: tip.id });
        });
        card.appendChild(dismiss);
        els.tips.appendChild(card);
      }
    }

    function renderSuggestions() {
      const filter = els.suggestionFilter.value;
      els.suggestionList.innerHTML = '';
      const items = state.suggestions.filter((s) =>
        filter === 'all' || s.category === filter
      );
      if (items.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No suggestions in this category.';
        els.suggestionList.appendChild(li);
        return;
      }
      for (const s of items) {
        const li = document.createElement('li');
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML =
          '<span class="prefix">' + escapeHtml(s.prefix) +
          '<span class="badge">' + escapeHtml(s.category) + '</span></span>' +
          '<span class="name">' + escapeHtml(s.name) + '</span>';
        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'small';
        add.textContent = 'Add to library';
        add.addEventListener('click', () => {
          vscode.postMessage({ type: 'addSuggestion', catalogId: s.catalogId });
        });
        li.appendChild(meta);
        li.appendChild(add);
        els.suggestionList.appendChild(li);
      }
    }

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
      updatePreview();
      renderList();
    }

    function fillFromSnippet(snippet) {
      state.editingId = snippet.id;
      els.id.value = snippet.id;
      els.name.value = snippet.name;
      els.prefix.value = snippet.prefix;
      els.description.value = snippet.description || '';
      els.body.value = (snippet.body || []).join(LINE_BREAK);
      els.imports.value = (snippet.imports || []).join(LINE_BREAK);
      els.title.textContent = 'Edit snippet';
      els.deleteBtn.hidden = false;
      clearStatus();
      updatePreview();
      renderList();
      setTab('library');
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
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML =
          '<span class="prefix">' + escapeHtml(snippet.prefix) + '</span>' +
          '<span class="name">' + escapeHtml(snippet.name) + '</span>';
        li.appendChild(meta);
        li.addEventListener('click', () => fillFromSnippet(snippet));
        els.list.appendChild(li);
      }
    }

    els.body.addEventListener('input', updatePreview);
    els.editor.addEventListener('submit', (e) => {
      e.preventDefault();
      vscode.postMessage({
        type: 'save',
        snippet: {
          id: state.editingId || undefined,
          name: els.name.value,
          prefix: els.prefix.value,
          body: els.body.value,
          imports: els.imports.value,
          description: els.description.value
        }
      });
    });

    document.getElementById('reset-btn').addEventListener('click', resetForm);
    document.getElementById('new-btn').addEventListener('click', resetForm);
    document.getElementById('export-btn').addEventListener('click', () => vscode.postMessage({ type: 'export' }));
    document.getElementById('import-btn').addEventListener('click', () => vscode.postMessage({ type: 'import' }));
    els.deleteBtn.addEventListener('click', () => {
      if (!state.editingId) return;
      vscode.postMessage({ type: 'delete', id: state.editingId });
      resetForm();
    });
    document.getElementById('welcome-dismiss').addEventListener('click', () => {
      els.welcome.hidden = true;
      vscode.postMessage({ type: 'dismissWelcome' });
    });
    els.suggestionFilter.addEventListener('change', renderSuggestions);

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg) return;
      switch (msg.type) {
        case 'init':
          state.snippets = msg.snippets || [];
          state.suggestions = msg.suggestions || [];
          state.tips = msg.tips || [];
          if (msg.showWelcome) els.welcome.hidden = false;
          vscode.setState(state);
          renderTips();
          renderList();
          renderSuggestions();
          updatePreview();
          return;
        case 'snippets':
          state.snippets = msg.data || [];
          renderList();
          if (state.editingId && !state.snippets.find((s) => s.id === state.editingId)) resetForm();
          return;
        case 'tips':
          state.tips = msg.data || [];
          renderTips();
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
    })();
  </script>
</body>
</html>`;
}

function generateNonce(): string {
  return randomUUID().replace(/-/g, '');
}
