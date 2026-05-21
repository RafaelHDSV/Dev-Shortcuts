import * as vscode from 'vscode';

const JS_LIKE = new Set([
  'javascript',
  'javascriptreact',
  'typescript',
  'typescriptreact',
  'vue',
  'svelte'
]);

const PYTHON_LIKE = new Set(['python']);

const GO_LIKE = new Set(['go']);

const RUST_LIKE = new Set(['rust']);

const JAVA_LIKE = new Set(['java', 'kotlin', 'scala']);

const CSHARP_LIKE = new Set(['csharp', 'fsharp']);

/**
 * Inserts missing import lines at the top of the active document.
 * Language-aware dedup: module paths, named bindings (JS/TS), and exact lines.
 */
export async function applyImports(
  editor: vscode.TextEditor,
  importLines: string[]
): Promise<boolean> {
  if (importLines.length === 0) {
    return false;
  }

  const document = editor.document;
  const existing = document.getText();
  const language = document.languageId;

  const missing = computeMissingImports(importLines, existing, language);
  if (missing.length === 0) {
    return false;
  }

  const insertionLine = findInsertionLine(document, language);
  const insertionPos = new vscode.Position(insertionLine, 0);

  const needsTrailingBlank =
    insertionLine < document.lineCount &&
    document.lineAt(insertionLine).text.trim() !== '';

  const textToInsert =
    missing.join('\n') + '\n' + (needsTrailingBlank ? '\n' : '');

  const edit = new vscode.WorkspaceEdit();
  edit.insert(document.uri, insertionPos, textToInsert);
  return vscode.workspace.applyEdit(edit);
}

function computeMissingImports(
  candidates: string[],
  source: string,
  language: string
): string[] {
  const seen = new Set<string>();
  const exactLines = buildExactLineSet(source);
  const index = buildImportIndex(source, language);

  const missing: string[] = [];
  for (const rawLine of candidates) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);

    if (exactLines.has(trimmed)) {
      continue;
    }
    if (isSemanticallyDuplicate(trimmed, index, language)) {
      continue;
    }
    missing.push(line);
  }
  return missing;
}

interface ImportIndex {
  jsModules: Map<string, JsImportInfo>;
  pythonModules: Set<string>;
  goPackages: Set<string>;
  rustPaths: Set<string>;
  javaPackages: Set<string>;
  csharpUsings: Set<string>;
}

interface JsImportInfo {
  defaultBinding?: string;
  namespace?: string;
  named: Set<string>;
  sideEffect: boolean;
}

function buildExactLineSet(source: string): Set<string> {
  return new Set(
    source
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
  );
}

function buildImportIndex(source: string, language: string): ImportIndex {
  const index: ImportIndex = {
    jsModules: new Map(),
    pythonModules: new Set(),
    goPackages: new Set(),
    rustPaths: new Set(),
    javaPackages: new Set(),
    csharpUsings: new Set()
  };

  const lines = source.split(/\r?\n/);

  if (JS_LIKE.has(language)) {
    for (const line of lines) {
      ingestJsLine(line.trim(), index.jsModules);
    }
    return index;
  }

  if (PYTHON_LIKE.has(language)) {
    for (const line of lines) {
      const mod = parsePythonModule(line.trim());
      if (mod) {
        index.pythonModules.add(mod);
      }
    }
    return index;
  }

  if (GO_LIKE.has(language)) {
    for (const line of lines) {
      const pkg = parseGoPackage(line.trim());
      if (pkg) {
        index.goPackages.add(pkg);
      }
    }
    return index;
  }

  if (RUST_LIKE.has(language)) {
    for (const line of lines) {
      const path = parseRustUse(line.trim());
      if (path) {
        index.rustPaths.add(path);
      }
    }
    return index;
  }

  if (JAVA_LIKE.has(language)) {
    for (const line of lines) {
      const pkg = parseJavaImport(line.trim());
      if (pkg) {
        index.javaPackages.add(pkg);
      }
    }
    return index;
  }

  if (CSHARP_LIKE.has(language)) {
    for (const line of lines) {
      const ns = parseCSharpUsing(line.trim());
      if (ns) {
        index.csharpUsings.add(ns);
      }
    }
  }

  return index;
}

function ingestJsLine(line: string, modules: Map<string, JsImportInfo>): void {
  if (!line.startsWith('import') && !line.startsWith('export')) {
    return;
  }

  const sideEffect = /^import\s+['"`]/.test(line);
  const module = parseJsModule(line);
  if (!module) {
    return;
  }

  const info = modules.get(module) ?? {
    named: new Set<string>(),
    sideEffect: false
  };

  if (sideEffect || /^import\s+['"`]/.test(line)) {
    info.sideEffect = true;
  }

  const defaultMatch = line.match(
    /import\s+(\w+)\s*,?\s*(?:\{[^}]*\})?\s*from/
  );
  if (defaultMatch && !line.includes('{')) {
    info.defaultBinding = defaultMatch[1];
  } else if (/import\s+(\w+)\s+from/.test(line) && !line.includes('{')) {
    const m = line.match(/import\s+(\w+)\s+from/);
    if (m) {
      info.defaultBinding = m[1];
    }
  }

  const nsMatch = line.match(/import\s+\*\s+as\s+(\w+)\s+from/);
  if (nsMatch) {
    info.namespace = nsMatch[1];
  }

  const namedBlock = line.match(/\{([^}]+)\}/);
  if (namedBlock) {
    for (const part of namedBlock[1].split(',')) {
      const binding = part
        .trim()
        .split(/\s+as\s+/)[0]
        .trim();
      if (binding) {
        info.named.add(binding);
      }
    }
  }

  modules.set(module, info);
}

function isSemanticallyDuplicate(
  importLine: string,
  index: ImportIndex,
  language: string
): boolean {
  if (JS_LIKE.has(language)) {
    return isJsDuplicate(importLine, index.jsModules);
  }
  if (PYTHON_LIKE.has(language)) {
    const mod = parsePythonModule(importLine);
    return mod ? index.pythonModules.has(mod) : false;
  }
  if (GO_LIKE.has(language)) {
    const pkg = parseGoPackage(importLine);
    return pkg ? index.goPackages.has(pkg) : false;
  }
  if (RUST_LIKE.has(language)) {
    const path = parseRustUse(importLine);
    return path ? index.rustPaths.has(path) : false;
  }
  if (JAVA_LIKE.has(language)) {
    const pkg = parseJavaImport(importLine);
    return pkg ? index.javaPackages.has(pkg) : false;
  }
  if (CSHARP_LIKE.has(language)) {
    const ns = parseCSharpUsing(importLine);
    return ns ? index.csharpUsings.has(ns) : false;
  }
  return false;
}

function isJsDuplicate(
  importLine: string,
  modules: Map<string, JsImportInfo>
): boolean {
  const module = parseJsModule(importLine);
  if (!module) {
    return false;
  }

  const existing = modules.get(module);
  if (!existing) {
    return false;
  }

  if (/^import\s+['"`]/.test(importLine.trim())) {
    return existing.sideEffect;
  }

  const wantsDefault = /^import\s+\w+\s+from/.test(importLine) &&
    !importLine.includes('{') &&
    !importLine.includes('*');
  if (wantsDefault && existing.defaultBinding) {
    const m = importLine.match(/import\s+(\w+)\s+from/);
    if (m && existing.defaultBinding === m[1]) {
      return true;
    }
  }

  const nsMatch = importLine.match(/import\s+\*\s+as\s+(\w+)\s+from/);
  if (nsMatch && existing.namespace === nsMatch[1]) {
    return true;
  }

  const namedBlock = importLine.match(/\{([^}]+)\}/);
  if (namedBlock) {
    const wanted = namedBlock[1]
      .split(',')
      .map((p) => p.trim().split(/\s+as\s+/)[0].trim())
      .filter(Boolean);
    if (wanted.length > 0 && wanted.every((n) => existing.named.has(n))) {
      return true;
    }
  }

  return existing.sideEffect && /^import\s+['"`]/.test(importLine.trim());
}

function parseJsModule(line: string): string | null {
  const fromMatch = line.match(/from\s+['"`]([^'"`]+)['"`]/);
  if (fromMatch) {
    return fromMatch[1];
  }
  const sideEffect = line.match(/^import\s+['"`]([^'"`]+)['"`]/);
  if (sideEffect) {
    return sideEffect[1];
  }
  const requireMatch = line.match(/require\(\s*['"`]([^'"`]+)['"`]\s*\)/);
  return requireMatch ? requireMatch[1] : null;
}

function parsePythonModule(line: string): string | null {
  const fromMatch = line.match(/^\s*from\s+([\w.]+)\s+import\b/);
  if (fromMatch) {
    return fromMatch[1];
  }
  const importMatch = line.match(/^\s*import\s+([\w.]+)/);
  return importMatch ? importMatch[1] : null;
}

function parseGoPackage(line: string): string | null {
  const quoted = line.match(/^\s*import\s+(?:\w+\s+)?"([^"]+)"/);
  if (quoted) {
    return quoted[1];
  }
  return null;
}

function parseRustUse(line: string): string | null {
  const m = line.match(/^\s*use\s+([\w:]+(?:::\{[^}]+\})?[\w:]*)\s*;/);
  return m ? m[1].replace(/\s+/g, '') : null;
}

function parseJavaImport(line: string): string | null {
  const m = line.match(/^\s*import\s+(?:static\s+)?([\w.]+)\s*;/);
  return m ? m[1] : null;
}

function parseCSharpUsing(line: string): string | null {
  const m = line.match(/^\s*using\s+(?:static\s+)?([\w.]+)\s*;/);
  return m ? m[1] : null;
}

function findInsertionLine(
  document: vscode.TextDocument,
  language: string
): number {
  let line = 0;
  if (document.lineCount === 0) {
    return 0;
  }

  const first = document.lineAt(0).text;
  if (first.startsWith('#!')) {
    line = 1;
  }

  if (GO_LIKE.has(language)) {
    while (line < document.lineCount) {
      const text = document.lineAt(line).text.trim();
      if (text.startsWith('package ') || text === '') {
        line += 1;
        continue;
      }
      break;
    }
    return line;
  }

  if (PYTHON_LIKE.has(language)) {
    while (line < document.lineCount) {
      const text = document.lineAt(line).text.trim();
      if (
        text.startsWith('#') ||
        text.startsWith('"""') ||
        text.startsWith("'''") ||
        text === ''
      ) {
        line += 1;
        continue;
      }
      break;
    }
    return line;
  }

  while (line < document.lineCount) {
    const text = document.lineAt(line).text.trim();
    if (
      text.startsWith('//') ||
      text.startsWith('/*') ||
      text.startsWith('*') ||
      text === ''
    ) {
      line += 1;
      continue;
    }
    break;
  }
  return line;
}
