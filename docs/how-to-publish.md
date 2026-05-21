## Publishing (maintainers)

Do not commit Personal Access Tokens or publisher secrets.

**Package a VSIX (from repo root):**

```bash
npm install
npm run compile
npm run lint
npx @vscode/vsce package
```

Output: `dev-shortcuts-1.0.0.vsix` (name follows `version` in `package.json`).

**Visual Studio Marketplace** (publisher `RafaelVieira1720`):

```bash
npx @vscode/vsce publish
```

Requires a one-time `vsce login RafaelVieira1720` (or `VSCE_PAT` in the environment).

**Open VSX** (Cursor and other editors):

```bash
npx ovsx publish dev-shortcuts-1.0.0.vsix -p <YOUR_OPEN_VSX_TOKEN>
```

Install the [ovsx](https://www.npmjs.com/package/ovsx) CLI if needed: `npm install -g ovsx`.

Smoke-test before publishing: **Extensions: Install from VSIX...** and select the generated file.