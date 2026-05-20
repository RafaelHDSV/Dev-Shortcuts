# Manual test checklist — Dev Shortcuts MVP

Cenarios a executar no Extension Development Host (`F5`) antes de cada release.

## Preparacao

- [ ] `npm install`
- [ ] `npm run compile`
- [ ] F5 -> Extension Development Host abre nova janela.
- [ ] Activity Bar mostra o icone **Dev Shortcuts**.

## CRUD

- [ ] Library vazia: webview mostra "No snippets yet".
- [ ] **New snippet** -> formulario vazio, titulo "New snippet".
- [ ] Salvar com prefixo `ef` (sem `!`) -> mensagem de validacao em ingles, nada e gravado.
- [ ] Salvar com body vazio -> mensagem de validacao.
- [ ] Salvar `!ef` com body valido -> aparece na lista; status "Snippet saved.".
- [ ] Criar outro snippet com prefixo `!ef` -> bloqueio com mensagem de duplicata.
- [ ] Clicar em um item da lista -> formulario carregado em modo edicao; botao **Delete** visivel.
- [ ] Editar nome/body e salvar -> reflete na lista.
- [ ] Deletar -> some da lista e formulario reseta.

## Completion

- [ ] Abrir um `.ts`, `.tsx`, `.py` e `.md` (uma de cada vez).
- [ ] Digitar `!` -> IntelliSense lista os snippets do usuario.
- [ ] Continuar digitando `!e` -> lista filtra apenas prefixos compativeis.
- [ ] `Enter` insere o body com tab stops funcionais (`$1`, `$0`).
- [ ] `Space` tambem aceita (comportamento padrao de completion).
- [ ] Snippet com `imports`: primeira insercao adiciona linhas no topo; segunda insercao no mesmo arquivo nao duplica.
- [ ] Em arquivo Python, snippet com `from x import y` nao duplica se ja existir.
- [ ] Arquivo com shebang `#!/usr/bin/env node`: imports vao depois da primeira linha.

## Comandos

- [ ] Paleta -> `Dev Shortcuts: Manage snippets` abre a view.
- [ ] Paleta -> `Dev Shortcuts: Insert snippet...` mostra quick pick com prefixos do usuario; selecionar insere o body (sem listar nada de `defaults.ts`).
- [ ] Sem snippets: o quick pick informa e oferece abrir o manager.

## Import / export

- [ ] **Export snippets...** com lista vazia -> mensagem "No snippets to export.".
- [ ] **Export snippets...** com itens -> arquivo JSON gerado com `schemaVersion: 1`.
- [ ] **Import snippets...** apontando para o JSON anterior -> sem conflito, todos adicionados/ignorados conforme prefixo.
- [ ] Importar arquivo com prefixo duplicado -> dialogo pergunta `Skip / Overwrite / Rename`; resultado bate com o esperado.
- [ ] Importar JSON inválido -> mensagem clara de erro.
- [ ] Importar arquivo maior que 2 MB -> mensagem de erro de tamanho.

## Persistencia

- [ ] Fechar e reabrir a janela do Extension Host -> snippets continuam la.
- [ ] Inspecionar `globalStorage/RafaelVieira1720.dev-shortcuts/snippets.json` -> conteudo legivel.

## Regressao

- [ ] Nenhum snippet "Default" (`React Component`, `React Page`, `React Hook`) aparece no quick pick ou na completion.
- [ ] Itens custom NAO aparecem com tag `Deprecated`.
- [ ] `settings.json` nao tem mais a chave `devShortcuts.customSnippets` exigida (a antiga foi removida do contributes).
