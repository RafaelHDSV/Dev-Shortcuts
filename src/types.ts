/**
 * Core domain types for Dev Shortcuts.
 * Schema is versioned via SnippetStoreFile.schemaVersion so future migrations
 * can be applied without breaking existing user libraries.
 */

export const CURRENT_SCHEMA_VERSION = 1 as const;

export interface Snippet {
  id: string
  name: string
  prefix: string
  body: string[]
  imports?: string[]
  description?: string
  createdAt: string
  updatedAt: string
}

export interface SnippetStoreFile {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION
  snippets: Snippet[]
}

export type ValidationField =
  | 'name'
  | 'prefix'
  | 'body'
  | 'imports'
  | 'description'
  | 'general';

export type ValidationResult =
  | { ok: true }
  | { ok: false; field: ValidationField; message: string };

export type DuplicatePolicy = 'skip' | 'overwrite' | 'rename';

export interface ImportConflict {
  incoming: Snippet
  existingId: string
}

export interface ImportSummary {
  added: number
  overwritten: number
  skipped: number
  renamed: number
}
