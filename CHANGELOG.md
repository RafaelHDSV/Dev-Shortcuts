# Changelog

All notable changes to **Dev Shortcuts** are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-05-21

### Added

- Improved extension logo in this version.

## [1.0.1] - 2026-05-21

### Added

- Marketplace / Open VSX extension icon (`media/icon.png`, 128×128).
- `media/demo.gif` for README and Marketplace (generated from `demo.mp4`).

### Fixed

- Extension listing logo missing: `package.json` now sets `"icon": "media/icon.png"` (required by VS Code Marketplace and Open VSX; SVG activity bar icon alone is not used for store listings).

## [1.0.0] - 2026-05-21

### Added

- First stable public release: user-owned `!` snippets in any language, Activity Bar manager, import/export JSON, opt-in Suggestions gallery, live preview, default keybindings, and extended import deduplication.

### Changed

- Version **1.0.0** marks the product ready for Visual Studio Marketplace and Open VSX (replaces pre-release 0.1.x–0.2.x lines).

### Notes

- Snippet data format remains `schemaVersion: 1`; upgrading from 0.2.x requires no migration.
- See `docs/manual-test-checklist.md` before publishing a VSIX.

## [0.2.1] - 2026-05-21

### Removed

- Welcome panel, usage tip cards, and dev-only reset onboarding from the manager UI. Usage guidance lives in **README.md** (Reference section).
- Legacy source files `snippetCompletionProvider.ts` and `defaults.ts` (pre-MVP prototypes).

### Changed

- Release polish: `docs/context.md` synced with v0.2 commands and layout; publishing steps documented in README.

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
