import { Snippet, ValidationResult } from '../types';

const PREFIX_PATTERN = /^![\w-]+$/;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_IMPORT_LINES = 32;

export function validateSnippet(
  snippet: Partial<Snippet>,
  existing: Snippet[],
  editingId?: string
): ValidationResult {
  const name = (snippet.name ?? '').trim();
  if (!name) {
    return { ok: false, field: 'name', message: 'Name is required.' };
  }

  const prefix = (snippet.prefix ?? '').trim();
  if (!prefix) {
    return { ok: false, field: 'prefix', message: 'Prefix is required.' };
  }
  if (!prefix.startsWith('!')) {
    return {
      ok: false,
      field: 'prefix',
      message: 'Prefix must start with "!" (e.g. "!ef").'
    };
  }
  if (!PREFIX_PATTERN.test(prefix)) {
    return {
      ok: false,
      field: 'prefix',
      message:
        'Prefix must contain only letters, digits, underscore or hyphen after "!".'
    };
  }

  const duplicate = existing.find(
    (s) => s.prefix === prefix && s.id !== editingId
  );
  if (duplicate) {
    return {
      ok: false,
      field: 'prefix',
      message: `Prefix "${prefix}" is already used by another snippet.`
    };
  }

  const body = snippet.body ?? [];
  if (!Array.isArray(body) || body.length === 0) {
    return { ok: false, field: 'body', message: 'Body cannot be empty.' };
  }
  const joined = body.join('\n');
  if (joined.trim().length === 0) {
    return { ok: false, field: 'body', message: 'Body cannot be empty.' };
  }
  if (Buffer.byteLength(joined, 'utf8') > MAX_BODY_BYTES) {
    return {
      ok: false,
      field: 'body',
      message: `Body exceeds the ${MAX_BODY_BYTES / 1024} KB limit.`
    };
  }

  if (snippet.imports !== undefined) {
    if (!Array.isArray(snippet.imports)) {
      return {
        ok: false,
        field: 'imports',
        message: 'Imports must be a list of lines.'
      };
    }
    if (snippet.imports.length > MAX_IMPORT_LINES) {
      return {
        ok: false,
        field: 'imports',
        message: `Too many import lines (max ${MAX_IMPORT_LINES}).`
      };
    }
    for (const line of snippet.imports) {
      if (typeof line !== 'string') {
        return {
          ok: false,
          field: 'imports',
          message: 'Each import must be a string.'
        };
      }
      if (line.includes('\n') || line.includes('\r')) {
        return {
          ok: false,
          field: 'imports',
          message: 'Each import must be a single line.'
        };
      }
    }
  }

  return { ok: true };
}
