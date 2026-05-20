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

/**
 * Inserts missing import lines at the top of the active document.
 * Best-effort dedup using regex per language family. For unknown languages
 * we still prepend missing lines verbatim.
 */
export async function applyImports(
  editor: vscode.TextEditor,
  importLines: string[]
): Promise<boolean> {
  if (importLines.length === 0) {return false;}

  const document = editor.document;
  const existing = document.getText();
  const language = document.languageId;

  const missing = computeMissingImports(importLines, existing, language);
  if (missing.length === 0) {return false;}

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
  const existingSet = new Set(
    source
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
  );

  const missing: string[] = [];
  for (const rawLine of candidates) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {continue;}
    if (seen.has(trimmed)) {continue;}
    seen.add(trimmed);
    if (existingSet.has(trimmed)) {continue;}
    if (isAlreadyImported(trimmed, source, language)) {continue;}
    missing.push(line);
  }
  return missing;
}

function isAlreadyImported(
  importLine: string,
  source: string,
  language: string
): boolean {
  if (JS_LIKE.has(language)) {
    const module = parseJsModule(importLine);
    if (!module) {return false;}
    const pattern = new RegExp(
      `(^|\\n)\\s*(?:import|export)\\s[^\\n;]*from\\s+['"\`]${escapeRegex(module)}['"\`]`,
      'm'
    );
    return pattern.test(source);
  }
  if (PYTHON_LIKE.has(language)) {
    const module = parsePythonModule(importLine);
    if (!module) {return false;}
    const pattern = new RegExp(
      `(^|\\n)\\s*(?:from\\s+${escapeRegex(module)}\\s+import|import\\s+${escapeRegex(module)})`,
      'm'
    );
    return pattern.test(source);
  }
  return false;
}

function parseJsModule(line: string): string | null {
  const match = line.match(/from\s+['"`]([^'"`]+)['"`]/);
  if (match) {return match[1];}
  const requireMatch = line.match(/require\(\s*['"`]([^'"`]+)['"`]\s*\)/);
  return requireMatch ? requireMatch[1] : null;
}

function parsePythonModule(line: string): string | null {
  const fromMatch = line.match(/^\s*from\s+([\w.]+)\s+import\b/);
  if (fromMatch) {return fromMatch[1];}
  const importMatch = line.match(/^\s*import\s+([\w.]+)/);
  return importMatch ? importMatch[1] : null;
}

function findInsertionLine(
  document: vscode.TextDocument,
  language: string
): number {
  let line = 0;
  if (document.lineCount === 0) {return 0;}

  const first = document.lineAt(0).text;
  if (first.startsWith('#!')) {line = 1;}

  if (PYTHON_LIKE.has(language)) {
    while (line < document.lineCount) {
      const text = document.lineAt(line).text.trim();
      if (text.startsWith('#') || text.startsWith('"""') || text === '') {
        line += 1;
        continue;
      }
      break;
    }
  } else {
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
  }
  return line;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
