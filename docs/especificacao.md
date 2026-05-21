# Dev Shortcuts

**Versão:** 1.0 (implementada)  
**Última atualização:** 2026-05-21  
**Status:** Release **1.0.0** publicável (Marketplace / Open VSX). Detalhes de entrega em `CHANGELOG.md` e `.issues/`.

> **Idioma deste documento:** português do Brasil (pt-BR).  
> **README, Marketplace, CHANGELOG e textos da extensão (UI, notificações, webview):** inglês.

---

## 1. Resumo

**Dev Shortcuts** é uma extensão para VS Code / Cursor que permite definir **trechos de código personalizados vinculados a atalhos** (prefixos). Em vez de digitar um bloco inteiro de boilerplate, o usuário digita um gatilho curto (ex.: `!ef`) e aceita a sugestão para inserir o código configurado — fluxo parecido com o [React Dev Snippets](https://marketplace.visualstudio.com/items?itemName=FernandaKipper.reactcodesnippets), porém com **snippets editáveis e de propriedade do usuário**, e não um catálogo fixo do autor.

| Aspecto | React Dev Snippets (referência) | Dev Shortcuts (alvo) |
|--------|--------------------------------|----------------------|
| Origem dos snippets | Fixos pelo autor da extensão | Definidos por cada usuário (escopo máquina) |
| Convenção de prefixo | Atalhos com `!` (`!ef`, `!rus`, …) | Prefixo `!` **obrigatório** em todos os snippets da extensão |
| Configuração | Nenhuma (só o pacote embutido) | Gestão visual + import/export opcional |
| Linguagens | JS/TS/JSX/TSX | **Qualquer** linguagem suportada pelo editor |

**Distribuição:** [Visual Studio Marketplace](https://marketplace.visualstudio.com/) e [Open VSX](https://open-vsx.org/) (Cursor e outros editores compatíveis com VS Code).

**Publisher / nome:** `dev-shortcuts` (nome de exibição: **Dev Shortcuts**).

---

## 2. Problema e objetivos

### 2.1 Problema

Desenvolvedores repetem diariamente a mesma estrutura de código (componentes, hooks, testes, handlers). Snippets nativos do editor e pacotes de terceiros ajudam, mas:

- Convenções de time ou pessoais divergem.
- Editar `settings.json` ou vários arquivos `.code-snippets` é trabalhoso e sujeito a erro.
- Catálogos fixos (ex.: só React) não servem para todo stack ou estilo.

### 2.2 Objetivos

1. **Inserção rápida:** digitar `!` → ver sugestões → filtrar continuando a digitar → **Enter** ou **Space** para expandir.
2. **Autonomia do usuário:** nenhum snippet embutido obrigatório; templates **sugeridos** só se a UX permitir.
3. **Experiência centralizada:** snippets deste produto vivem e são geridos pelo **Dev Shortcuts**, sem misturar com arquivos `.code-snippets` avulsos (ver §6).
4. **Configuração polida:** priorizar **interface visual** em vez de editar `settings.json` manualmente.
5. **Multi-editor:** o mesmo pacote roda em **VS Code** e **Cursor** (mesmo modelo do [Deprecated Finder](https://github.com/RafaelHDSV/Deprecated-Finder)).

### 2.3 Fora do escopo (atual)

- Conjuntos de snippets por workspace ou projeto (apenas usuário/máquina).
- Escopo por linguagem por snippet na configuração.
- Suite de testes automatizados como gate de release (opcional depois).
- Cronograma fixo de releases.

---

## 3. Experiência do usuário

### 3.1 Fluxo principal (inserção)

1. O usuário foca um editor em **qualquer** linguagem.
2. Digita `!` (início de um prefixo Dev Shortcuts).
3. O **IntelliSense** abre listando **todos** os snippets Dev Shortcuts (cada item exibe ao menos: prefixo, nome de exibição).
4. Continua digitando (ex.: `!ef`) → a lista **restringe** aos prefixos correspondentes (filtro padrão de completion).
5. Seleciona um item e pressiona **Enter** ou **Space** → o corpo do snippet é inserido no cursor com semântica de snippet do editor (tab stops, placeholders).
6. Se o snippet declarar **imports**, estes são inseridos no **topo do arquivo** (ver §3.4), sem duplicar imports existentes quando possível.

Esse fluxo espelha a extensão de referência; **não** se limita a abrir a paleta de comandos (isso pode existir como entrada secundária).

### 3.2 Regras de prefixo

| Regra | Detalhe |
|------|---------|
| `!` obrigatório | Todo prefixo Dev Shortcuts **deve** começar com `!` (ex.: `!component`, `!ef`). |
| Unicidade | Dois snippets não podem compartilhar o mesmo prefixo para o mesmo usuário. |
| Distinção | Prefixos com `!` indicam “pertence ao Dev Shortcuts” em relação a outras sugestões do editor. |
| `prefix` vs `name` | **`prefix`** = gatilho digitado no editor (`!hook`). **`name`** = rótulo legível em listas/UI (“React Hook with useState”). Ambos obrigatórios; `name` **nunca** substitui `prefix`. |

### 3.3 Fluxos secundários (opcionais, recomendados)

| Fluxo | Finalidade |
|------|------------|
| Paleta de comandos | “Dev Shortcuts: Insert snippet…” quando o usuário preferir escolher na lista sem digitar `!`. |
| Atalho de teclado (opcional) | Atalho configurável para abrir o seletor ou o último snippet usado. |
| Galeria de sugestões | Catálogo sob demanda (React + genérico) que o usuário pode **adicionar** à biblioteca — não embutido como padrão sempre ativo. |

### 3.4 Inserção de imports

Snippets podem declarar uma ou mais **linhas de import** separadas do corpo principal (schema recomendado no §5).

**Comportamento:**

1. Resolver linguagem do arquivo / sistema de módulos quando viável (ESM `import`, etc.).
2. Inserir imports faltantes no **topo** do arquivo (após shebang, comentários de arquivo ou bloco de “cabeçalho” detectável — detalhe de implementação).
3. **Não duplicar** import já existente (mesmo módulo + mesma especificação named/default).
4. O `body` principal insere no **cursor**; imports são efeito colateral, não ficam para o usuário recortar/colar.

**Fora do escopo na v1:** reescrita avançada (barrel files, re-exports, resolução automática de path aliases). Registrar no roadmap se necessário.

### 3.5 Snippets sugeridos (recurso opcional)

Se implementado:

- Exibido no onboarding ou em “Browse suggestions” (sidebar/webview).
- Categorias: **React** (componentes, hooks, páginas) e **Genérico** (função, classe, try/catch, etc.).
- Um único corpo por sugestão (sem variantes separadas JS vs TS).
- Ação do usuário: **Add to my snippets** (copia para o armazenamento do usuário, editável depois).
- Se o custo de UX for alto para o MVP, lançar sem sugestões; o usuário começa com biblioteca vazia ou importa arquivo.

**Não permitido:** snippets embutidos silenciosos e sempre ativos que só saem com desinstalação.

---

## 4. Configuração e armazenamento

### 4.1 Escopo

| Escopo | Suportado |
|--------|-----------|
| Usuário (máquina / global) | **Sim** — armazenamento principal |
| Workspace / pasta | **Não** |
| Snippets fixos embutidos | **Não** |

Persistência via `ExtensionContext.globalState` do VS Code e/ou arquivo dedicado no perfil do usuário (escolha de implementação). A UI de configuração **não** pode exigir edição manual de JSON para o CRUD normal.

### 4.2 UI de gestão (necessária para boa UX)

Superfície **dedicada** de gestão (mínimo viável: **Webview** na sidebar ou em aba do editor):

| Ação | Requisito |
|------|-----------|
| Listar snippets | Tabela ou lista: prefixo, nome, prévia |
| Criar | Formulário: nome, prefixo (`!…`), editor do body, imports opcionais |
| Editar | Mesmo formulário |
| Excluir | Confirmação ou desfazer amigável |
| Validar | Em tempo real ou ao salvar (§4.3) |
| Exportar (desejável) | Baixar JSON com todos os snippets do usuário |
| Importar (desejável) | Enviar/mesclar JSON com tratamento de duplicatas |

`settings.json` pode expor JSON avançado/bruto para power users, mas **não** pode ser o único caminho.

### 4.3 Validação

| Verificação | Em caso de falha |
|-------------|------------------|
| Prefixo vazio ou sem `!` inicial | Bloquear salvamento + mensagem inline |
| Prefixo duplicado | Bloquear salvamento + mensagem |
| Body vazio | Bloquear salvamento |
| Sintaxe de snippet inválida (formato VS Code) | Avisar ou bloquear com link para documentação |
| Linhas de import malformadas | Avisar |

### 4.4 Import / export (opcional)

- **Formato:** array JSON conforme schema do §5 (campo de versão recomendado).
- **Política de merge na importação:** se o prefixo existir → **avisar** e oferecer ignorar / sobrescrever / duplicar com novo prefixo.
- **Escopo:** apenas máquina do usuário (alinhado ao §4.1).

---

## 5. Modelo de dados

### 5.1 Entidade Snippet

```json
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
  ],
  "createdAt": "2026-05-17T12:00:00.000Z",
  "updatedAt": "2026-05-17T12:00:00.000Z"
}
```

| Campo | Obrigatório | Notas |
|-------|-------------|-------|
| `id` | Sim | Identidade estável para editar/excluir/merge na importação |
| `name` | Sim | Apenas rótulo na UI |
| `prefix` | Sim | Deve começar com `!`; único por usuário |
| `body` | Sim | Array de linhas ou string única (normalizar internamente) |
| `imports` | Não | Linhas inseridas no topo conforme §3.4 |
| `description` | Não | Não exigido pelo produto; pode ajudar tooltips depois |

### 5.2 Sintaxe do corpo do snippet (decisão)

**Recomendação:** usar nativamente o **formato de snippet do VS Code** (`$1`, `${1:Placeholder}`, `$0`, `$TM_FILENAME`, etc.) porque:

- `editor.insertSnippet(SnippetString)` já suporta.
- Quem conhece arquivos `.code-snippets` mantém o mesmo modelo mental.
- A documentação pública (em inglês) pode linkar para [Snippet syntax](https://code.visualstudio.com/docs/editor/userdefinedsnippets#_snippet-syntax).

A UI de gestão deve incluir um **guia rápido de sintaxe** (em inglês, alinhado à UI do produto) e **prévia** com tab stops.

### 5.3 Versionamento do armazenamento

```json
{
  "schemaVersion": 1,
  "snippets": [ /* Snippet entity[] */ ]
}
```

Incrementar `schemaVersion` em mudanças breaking; incluir migração única na extensão.

---

## 6. Relação com snippets nativos do VS Code

### 6.1 Centralização

O Dev Shortcuts é o **lar pretendido** para atalhos `!` definidos pelo usuário:

- Não exigir manutenção paralela de arquivos `.code-snippets` para os mesmos prefixos.
- A extensão não precisa desabilitar snippets do VS Code globalmente; ela **adota** a convenção `!` e o completion provider dos prefixos registrados.

### 6.2 Conflitos

| Cenário | Comportamento |
|----------|---------------|
| Usuário adiciona snippet com prefixo já existente no Dev Shortcuts | **Erro de validação** (§4.3) |
| Importação de JSON com prefixo duplicado | **Aviso** + escolha (ignorar / sobrescrever / renomear) |
| Mesmo `!xyz` em snippets nativos do VS Code | **Aviso** ao detectar (ao salvar ou no primeiro completion); ambos podem aparecer na lista — documentar que o usuário deve remover o snippet nativo para evitar ambiguidade |

---

## 7. Arquitetura técnica

### 7.1 Manifest da extensão (baseline)

Alinhar ao setup validado no [Deprecated Finder](https://github.com/RafaelHDSV/Deprecated-Finder):

```json
"engines": { "vscode": "^1.100.0" }
```

- **Ativação:** preferir `onStartupFinished` ou ativação ampla para o completion provider e o store ficarem prontos em qualquer linguagem — não só `onLanguage:typescript` (protótipo atual é estreito demais).
- **Categorias:** `Snippets`, `Other` (Marketplace).
- **Main:** `./out/extension.js` (compilação TypeScript).

### 7.2 Componentes (alvo)

```
src/
  extension.ts              # activate/deactivate, registrar providers
  storage/
    snippetStore.ts         # leitura/escrita global, migrações
  providers/
    completionProvider.ts   # gatilho em '!', filtro por prefixo, insert SnippetString
  commands/
    insertSnippet.ts        # quick pick opcional
    importExport.ts         # opcional
  views/
    snippetManagerWebview.ts
  snippets/
    suggestions.ts          # catálogo opcional (não carregado automaticamente)
  import/
    importResolver.ts       # dedupe + inserção no topo
  validation/
    snippetValidator.ts
  types.ts
```

### 7.3 Completion provider

- Registrar com **`{ pattern: /!\\w*/ }`** ou caractere gatilho `!`, de modo que, ao digitar `!`, ofereça **todos** os snippets do usuário; restringindo conforme o restante do prefixo.
- `CompletionItem.insertText` = `SnippetString` a partir de `body.join('\n')`.
- `filterText` / `sortText` = prefixo para ordenação correta.
- Ao aceitar: executar **import resolver** e depois **inserção do body** (ordem: imports primeiro, depois body, ou `WorkspaceEdit` atômico).

### 7.4 Import resolver (v1)

Abordagem pragmática:

1. Interpretar strings de `imports` como linhas completas.
2. Varrer imports existentes no arquivo (regex ou AST simples para TS/JS; fallback por linha em outras linguagens).
3. Antepor apenas linhas ausentes.
4. Em linguagens desconhecidas, ainda antepor na linha 0 salvo arquivo binário.

### 7.5 Protótipo vs especificação

O repositório atual é um **spike**, não o contrato:

| Tópico | Protótipo hoje | Alvo da spec |
|--------|----------------|--------------|
| Lista de completion | Mostra todos os snippets ao aparecer `!`; itens custom com tag `Deprecated` incorreta | Mostrar todos em `!`, filtrar ao digitar; sem tags deprecated enganosas |
| `prefix` / `name` | `settings.json` permitia snippet sem `prefix` | `prefix` sempre obrigatório, sempre `!…`; `name` só exibição |
| Snippets embutidos | `defaultSnippets` no código | **Remover** do runtime; `suggestions.ts` opcional apenas |
| Linguagens | Só TS/JS/JSX/TSX | Todas |
| Config | `devShortcuts.customSnippets` em settings | UI dedicada + store global |

---

## 8. Comandos e contribution points (planejados)

Títulos expostos ao usuário em **inglês** (requisito de produto):

| Command ID | Título (inglês) | Notas |
|------------|-----------------|-------|
| `devShortcuts.openManager` | Dev Shortcuts: Manage snippets | Abre a UI de gestão |
| `devShortcuts.insert` | Dev Shortcuts: Insert snippet… | Fallback via quick pick |
| `devShortcuts.export` | Dev Shortcuts: Export snippets… | Opcional |
| `devShortcuts.import` | Dev Shortcuts: Import snippets… | Opcional |
| `devShortcuts.addFromSuggestion` | Dev Shortcuts: Add suggested snippet… | Opcional |

**Views:** activity bar ou painel “Dev Shortcuts” com a webview de gestão.

**Keybindings:** nenhum por padrão; o usuário pode associar comandos opcionais.

---

## 9. Compatibilidade e release

### 9.1 Editores

| Editor | Suporte |
|--------|---------|
| VS Code | `>= 1.100.0` |
| Cursor | Mesmo formato VSIX / Open VSX |

### 9.2 Publicação

| Canal | Ação |
|-------|------|
| VS Marketplace | `vsce publish` (conta publisher, README, ícone, CHANGELOG) |
| Open VSX | `ovsx publish` para usuários Cursor |

**Documentação e cópia voltadas ao usuário final:** **inglês** (README, descrição no Marketplace, rótulos da webview, notificações). **Esta especificação** permanece em **pt-BR**.

### 9.3 Qualidade

- Checklist de testes manuais antes do release (inserção, dedupe de imports, CRUD, aviso de conflito).
- Testes automatizados: **não obrigatórios** na v1; `@vscode/test-electron` pode entrar depois.

---

## 10. MVP vs depois

### 10.1 MVP (mínimo publicável)

- [ ] Armazenamento global de snippets com CRUD via webview
- [ ] Completion em `!` com filtro por prefixo; Enter/Space para inserir
- [ ] Sintaxe de snippet do VS Code no `body`
- [ ] Imports no topo com deduplicação (melhor esforço em JS/TS)
- [ ] Validação de prefixo (`!`, único)
- [ ] Todas as linguagens (registro amplo de completion)
- [ ] Strings da UI em inglês
- [ ] README + CHANGELOG; publicar Marketplace + Open VSX
- [ ] Remover `defaultSnippets` hardcoded do caminho de ativação

### 10.2 Pós-MVP

- Import/export JSON
- Galeria de snippets sugeridos (React + genérico)
- Atalho de teclado padrão opcional
- AST de imports mais robusta para mais linguagens
- Prévia do snippet com simulação de tab stops na webview
- Dicas de uso locais, sem telemetria

---

## 11. Segurança e privacidade

- Snippets permanecem **locais** (`globalState` / arquivo do usuário); sem chamadas de rede nas funcionalidades principais.
- Import JSON: validar tamanho e estrutura para evitar payload grande derrubando a webview.
- Não executar código arbitrário além da inserção normal do editor a partir do corpo do snippet.

---

## 12. Critérios de sucesso

1. Usuário novo cria `!ef`, digita em `.py` ou `.tsx` e insere o corpo em **menos de 30 segundos** sem editar `settings.json`.
2. O prefixo `!` distingue de forma confiável os itens Dev Shortcuts na lista de completion.
3. Template sugerido orientado a React (se existir) é **somente opt-in**.
4. A extensão instala e roda em **VS Code 1.100+** e **Cursor** sem codebases separados.
5. Tentativas de prefixo duplicado são bloqueadas com mensagem clara em **inglês** (UI do produto).

---

## 13. Referências

- [React Dev Snippets (Marketplace)](https://marketplace.visualstudio.com/items?itemName=FernandaKipper.reactcodesnippets)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [User-defined snippets syntax](https://code.visualstudio.com/docs/editor/userdefinedsnippets)
- [Deprecated Finder](https://github.com/RafaelHDSV/Deprecated-Finder) — fluxo de publicação, `engines.vscode`, alvo VS Code / Cursor
- [Open VSX](https://open-vsx.org/)

---

## Apêndice A — Exemplos de templates sugeridos (não vinculante)

Se a galeria existir, exemplos possíveis:

| Prefixo | Nome (exibição) | Foco |
|---------|-----------------|------|
| `!rfc` | Function component | React |
| `!rus` | useState hook | React |
| `!fn` | Named function | Genérico |
| `!tc` | Test case skeleton | Genérico |

O usuário copia para a biblioteca; prefixos permanecem editáveis após adicionar.

---

## Apêndice B — Histórico do documento

| Versão | Data | Alterações |
|--------|------|------------|
| 0.1 | 2026-05-17 | Especificação inicial a partir do Q&A de produto e revisão do código |
| 0.1.1 | 2026-05-17 | Documento traduzido para pt-BR; política de idiomas README/UI em inglês |
