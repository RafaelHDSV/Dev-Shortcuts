# Dev Shortcuts

User-owned snippet shortcuts for VS Code and Cursor, triggered by the `!` prefix in **any** language.

Instead of memorizing fixed snippet packs, you build your own library: every snippet is created, edited, and stored by you, and shows up whenever you type `!` in an editor.

## Features

- **`!`-prefix completion** in any language. Type `!`, see your snippets, keep typing to filter, press `Enter` or `Space` to insert.
- **VS Code snippet syntax** (`$1`, `${1:placeholder}`, `$0`, ...) inside snippet bodies.
- **Auto imports**: declare import lines per snippet; missing ones are inserted at the top of the file (best-effort dedup for JS/TS/Python).
- **Activity Bar manager**: dedicated sidebar with a webview for creating, editing, and deleting snippets without touching `settings.json`.
- **Import / Export JSON**: back up or share your library; duplicate prefixes can be skipped, overwritten, or renamed on import.
- **Local-only**: snippets are stored in the extension's global storage; no telemetry, no network calls.

## Quick start

1. Install the extension (VS Code Marketplace or Open VSX).
2. Open the **Dev Shortcuts** view from the Activity Bar.
3. Click **New snippet**, fill in:
   - **Name**: human-readable label, e.g. `Export function component`.
   - **Prefix**: must start with `!`, e.g. `!ef`.
   - **Body**: VS Code snippet syntax, multi-line allowed.
   - **Imports** (optional): one line per missing import.
4. Save. In any editor, type the prefix (e.g. `!ef`) and accept the suggestion.

## Commands

| Command | What it does |
|---------|--------------|
| `Dev Shortcuts: Manage snippets` | Opens the Activity Bar manager |
| `Dev Shortcuts: Insert snippet...` | Quick pick to insert a snippet without typing `!` |
| `Dev Shortcuts: Export snippets...` | Saves your library to a JSON file |
| `Dev Shortcuts: Import snippets...` | Loads snippets from JSON, with duplicate handling |

## Snippet JSON format

```json
{
  "schemaVersion": 1,
  "snippets": [
    {
      "id": "uuid-v4",
      "name": "Export function component",
      "prefix": "!ef",
      "body": [
        "export function ${1:Component}() {",
        "  $0",
        "}"
      ],
      "imports": [
        "import { useState } from 'react'"
      ]
    }
  ]
}
```

`id`, `createdAt`, and `updatedAt` are generated when missing. Top-level arrays (no envelope) are also accepted on import.

## Prefix rules

- Must start with `!`.
- Letters, digits, `_`, and `-` are allowed after `!`.
- Must be unique within your library. Conflicts are blocked at save time.

## Coexistence with VS Code native snippets

VS Code's built-in `.code-snippets` files also support `!`-style prefixes. If you have the same prefix in both Dev Shortcuts and a native snippet file, both will show up in IntelliSense. To avoid the duplicate, remove the snippet from the native `.code-snippets` file.

## Requirements

- VS Code `>= 1.100.0` or any compatible editor (Cursor included).

## Development

```bash
npm install
npm run compile
# Press F5 in VS Code to launch the Extension Development Host
```

## Roadmap (post-MVP)

- Optional gallery of suggested snippets (React + generic).
- AST-based import resolution for more languages.
- Snippet preview with simulated tab stops in the manager.
- Optional default keybinding.

## License

[MIT](./LICENSE)
