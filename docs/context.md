# dev-shortcuts — contexto do projeto

> Contexto primario para assistentes de IA (regra `ai-context.mdc`). Atualize este arquivo ao evoluir o produto.

**Pacote:** `dev-shortcuts` | **Publisher:** `RafaelVieira1720` | **Ano:** 2026

---

## Objetivo

Extensao para VS Code / Cursor que permite ao usuario criar e gerenciar **seus proprios snippets**, acessiveis pelo prefixo `!` em qualquer linguagem. Substitui a edicao manual de arquivos `.code-snippets` por uma UI dedicada (Activity Bar) e suporta import/export JSON. Inspirada no React Dev Snippets, mas com biblioteca de propriedade do usuario em vez de catalogo fixo.

Especificacao completa: [`docs/especificacao.md`](./especificacao.md).

---

## Stack

| Camada | Tecnologia / nota |
|--------|-------------------|
| Linguagem | TypeScript 5.8, target ES2024, module CommonJS |
| Runtime | Extension Host (Node embutido no VS Code) |
| API | `vscode` 1.100+, WebviewView na Activity Bar |
| Build | `tsc -p ./` -> `out/` |
| Lint | ESLint 9 + `typescript-eslint` + `@stylistic` |
| Persistencia | JSON em `ExtensionContext.globalStorageUri/snippets.json` (schemaVersion 1) |

---

## Estrutura

```
src/
  extension.ts                # activate/deactivate, wiring
  storage/snippetStore.ts     # CRUD + load/save JSON + onDidChange
  validation/snippetValidator.ts
  providers/completionProvider.ts
  import/importResolver.ts    # dedupe e insercao no topo
  views/snippetManagerView.ts # WebviewViewProvider (Activity Bar)
  commands/
    insertSnippet.ts
    openManager.ts
    importExport.ts
  types.ts
```

---

## Decisoes fixas

1. Prefixo `!` obrigatorio e unico por usuario; UI bloqueia duplicatas.
2. Armazenamento exclusivamente local (`globalStorageUri`), sem telemetria, sem chamadas de rede.
3. UI em **ingles**; documentacao tecnica em pt-BR fica restrita a `docs/` e `.issues/`.
4. Sem migracao de `devShortcuts.customSnippets` do prototipo; usuario reimporta via comando.
5. Galeria de sugestoes React fora do MVP; import/export entra no MVP.
6. Conflito com snippets nativos (`.code-snippets`) e tratado apenas via README.
7. Ativacao ampla (`onStartupFinished`) para o provider funcionar em qualquer linguagem.

---

## Comandos

| Command ID | Titulo |
|------------|--------|
| `devShortcuts.openManager` | Dev Shortcuts: Manage snippets |
| `devShortcuts.insert` | Dev Shortcuts: Insert snippet... |
| `devShortcuts.export` | Dev Shortcuts: Export snippets... |
| `devShortcuts.import` | Dev Shortcuts: Import snippets... |

---

## Links

| Tipo | URL |
|------|-----|
| Repositorio | https://github.com/RafaelHDSV/Dev-Shortcuts |
| Especificacao | `docs/especificacao.md` |
| Proposta de implementacao | `.issues/2026-05-20-dev-shortcuts-mvp.md` |
| Checklist de teste manual | `docs/manual-test-checklist.md` |

---

## Fora de escopo (MVP)

- Snippets por workspace ou projeto.
- Galeria de sugestoes embutidas.
- Testes automatizados (`@vscode/test-electron`).
- Telemetria ou sincronizacao em nuvem.

---

*Gerado com Vieira CLI (`vieira common` ou scaffold `front` / `full` / `extension`).*
