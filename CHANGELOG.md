# Changelog

All notable changes to **Dev Shortcuts** are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed

- Welcome panel, usage tip cards, and dev-only reset onboarding from the manager UI. Equivalent guidance lives in **README.md** (Reference section).

## [0.2.0] - 2026-05-20

### Added

- **Suggestions** tab in the manager: React + generic opt-in catalog (`!rfc`, `!rus`, `!fn`, `!tc`, ...).
- Command `Dev Shortcuts: Add suggested snippet...` with duplicate-prefix handling.
- **Live preview** in the editor form: highlights `${n:placeholder}`, `$n`, and `$0`.
- **Usage tips** cards in the manager (dismissible, stored locally).
- Welcome panel on first run when the library is empty.
- Command `Dev Shortcuts: Insert last used snippet` and tracking of the last inserted snippet.
- Default keybindings: `Ctrl+Alt+S` insert, `Ctrl+Alt+Shift+S` insert last, `Ctrl+Alt+M` manager (macOS uses `Cmd`).
- Richer import deduplication: JS/TS named/default/namespace bindings; Go, Rust, Java/Kotlin, C# `using`.

### Changed

- Completion always runs a prepare step (imports + last-snippet tracking) when a suggestion is accepted.

## [0.1.0] - 2026-05-20

### Added

- Activity Bar view "Dev Shortcuts" with a webview-based snippet manager (create / edit / delete) in English.
- Completion provider triggered by `!` in any language; `Enter` or `Space` inserts the snippet with VS Code snippet syntax (`$1`, `${1:placeholder}`, `$0`).
- JSON storage in the extension's global storage (`snippets.json`, schema version 1).
- Snippet validator: enforces non-empty name, `!`-prefixed unique prefix, non-empty body, body size limit, and well-formed import lines.
- Optional `imports` field per snippet: missing import lines are inserted at the top of the file with best-effort dedup for JS/TS/Python.
- Commands:
  - `Dev Shortcuts: Manage snippets`
  - `Dev Shortcuts: Insert snippet...`
  - `Dev Shortcuts: Export snippets...`
  - `Dev Shortcuts: Import snippets...`
- Import / export JSON with duplicate-handling policy (skip / overwrite / rename).

### Removed

- Hardcoded default snippets from the activation path (previously bundled as `defaultSnippets`).
- Legacy `devShortcuts.customSnippets` setting as the primary storage path.
- Legacy `extension.devShortcuts` command id.

### Notes

- No data migration from the previous `settings.json`-based prototype; use the import command to bring an existing library.
- No automated tests in this release; see `docs/manual-test-checklist.md`.
