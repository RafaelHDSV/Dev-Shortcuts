# dev-shortcuts — contexto do projeto

> Contexto primario para assistentes de IA (regra `ai-context.mdc`). Atualize este arquivo ao evoluir o produto.

**Pacote:** `dev-shortcuts` | **Publisher:** `RafaelVieira1720` | **Versao:** 0.2.1 | **Ano:** 2026

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
  extension.ts
  types.ts
  storage/
    snippetStore.ts
    lastSnippet.ts
  validation/snippetValidator.ts
  providers/completionProvider.ts
  import/importResolver.ts
  snippets/suggestions.ts
  views/snippetManagerView.ts
  commands/
    openManager.ts
    insertSnippet.ts
    insertLastSnippet.ts
    importExport.ts
    addFromSuggestion.ts
```

---

## Decisoes fixas

1. Prefixo `!` obrigatorio e unico por usuario; UI bloqueia duplicatas.
2. Armazenamento exclusivamente local (`globalStorageUri`), sem telemetria, sem chamadas de rede.
3. UI em **ingles**; documentacao tecnica em pt-BR fica restrita a `docs/` e `.issues/`.
4. Sem migracao de `devShortcuts.customSnippets` do prototipo; usuario reimporta via comando.
5. Galeria de sugestoes opt-in (v0.2+); nada do catalogo entra em completion ate Add to library.
6. Conflito com snippets nativos (`.code-snippets`) e tratado apenas via README.
7. Ativacao: `onStartupFinished` + `onView:devShortcuts.snippetManager`.
8. Onboarding na webview removido (v0.2.1); guia no README (Reference).

---

## Comandos

| Command ID | Titulo |
|------------|--------|
| `devShortcuts.openManager` | Dev Shortcuts: Manage snippets |
| `devShortcuts.insert` | Dev Shortcuts: Insert snippet... |
| `devShortcuts.insertLast` | Dev Shortcuts: Insert last used snippet |
| `devShortcuts.export` | Dev Shortcuts: Export snippets... |
| `devShortcuts.import` | Dev Shortcuts: Import snippets... |
| `devShortcuts.addFromSuggestion` | Dev Shortcuts: Add suggested snippet... |

Atalhos padrao: `Ctrl+Alt+S` insert, `Ctrl+Alt+Shift+S` insert last, `Ctrl+Alt+M` manager (macOS `Cmd`).

---

## Links

| Tipo | URL |
|------|-----|
| Repositorio | https://github.com/RafaelHDSV/Dev-Shortcuts |
| Especificacao | `docs/especificacao.md` |
| Proposta MVP | `.issues/2026-05-20-dev-shortcuts-mvp.md` |
| Incrementos | `.issues/README.md` |
| Checklist de teste manual | `docs/manual-test-checklist.md` |

---

## Versao 0.2.x (entregue)

- Galeria **Suggestions** (`src/snippets/suggestions.ts`) — React + generic.
- Preview ao vivo na webview; clique na linha inteira na lista de sugestoes.
- `insertLast` + `lastSnippet.ts`; import resolver ampliado.
- v0.2.1: sem welcome/tips na UI; README Reference; limpeza de fontes legado.

## Fora de escopo

- Snippets por workspace ou projeto.
- AST completo / path aliases para imports.
- Testes automatizados (`@vscode/test-electron`) — ver `.issues/2026-05-21-increment-testes-automatizados.md`.
- Telemetria ou sincronizacao em nuvem.

---

*Gerado com Vieira CLI; atualizado no incremento release polish v0.2.1.*
