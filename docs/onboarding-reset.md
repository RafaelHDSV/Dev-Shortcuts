# Welcome, dicas e reset do onboarding

## Comportamento atual

O painel **Welcome** e os cards de **usage tips** aparecem **sempre** quando o manager Dev Shortcuts carrega ou atualiza (abrir a view, salvar snippet, voltar para a sidebar, etc.).

- **Got it** e **Dismiss** so escondem ate a proxima atualizacao da view (nao gravam mais estado permanente).
- Seus snippets em `snippets.json` **nunca** sao apagados por esses controles.

## Reset rapido (somente desenvolvimento / F5)

1. No repositorio: `npm run compile`.
2. Pressione **F5** (Extension Development Host).
3. Abra **Dev Shortcuts** na Activity Bar.
4. Na aba **Library**, clique **Reset onboarding** (botao com borda tracejada) ou na paleta: `Dev Shortcuts: Reset onboarding (dev only)`.
5. **Developer: Reload Window** (`Ctrl+Shift+P`).

Isso apaga chaves antigas de dismiss no `globalState` (versoes anteriores da extensao). O welcome e as dicas ja voltam sozinhos em todo `init`; o reload garante que a webview receba o pacote completo.

## Reset manual do estado legado (qualquer instalacao)

Use se voce instalou uma versao antiga que gravava "ja vi o welcome" / dicas dispensadas e quer limpar o disco. **Nao apague `snippets.json`.**

### Passo a passo (Windows)

1. Feche o VS Code ou Cursor (recomendado).
2. Abra o Explorer e cole na barra de endereco (ajuste **Code** ou **Cursor**):

   **VS Code**

   ```
   %APPDATA%\Code\User\globalStorage\rafaelvieira1720.dev-shortcuts
   ```

   **Cursor**

   ```
   %APPDATA%\Cursor\User\globalStorage\rafaelvieira1720.dev-shortcuts
   ```

   Se a pasta nao existir, procure em `globalStorage` por um diretorio que termine em `.dev-shortcuts`.

3. Na pasta, confirme que existe `snippets.json` (sua biblioteca). **Mantenha esse arquivo.**
4. Apague apenas o arquivo **`state.vscdb`** (estado da extensao, incluindo flags antigas de onboarding).
5. Reabra o editor.
6. Abra **Dev Shortcuts** na Activity Bar. Welcome + dicas devem aparecer no topo.

### Passo a passo (macOS)

1. Feche o editor.
2. Abra no Finder (**Code** ou **Cursor**):

   - VS Code: `~/Library/Application Support/Code/User/globalStorage/rafaelvieira1720.dev-shortcuts`
   - Cursor: `~/Library/Application Support/Cursor/User/globalStorage/rafaelvieira1720.dev-shortcuts`

3. Apague **`state.vscdb`**, mantenha **`snippets.json`**.
4. Reabra o editor e abra a view Dev Shortcuts.

### Passo a passo (Linux)

1. Feche o editor.
2. Pasta (Code):

   `~/.config/Code/User/globalStorage/rafaelvieira1720.dev-shortcuts`

   Cursor:

   `~/.config/Cursor/User/globalStorage/rafaelvieira1720.dev-shortcuts`

3. Apague **`state.vscdb`**, mantenha **`snippets.json`**.
4. Reabra o editor.

## Ainda nao ve o Welcome?

1. **Developer: Reload Window** apos recompilar (`npm run compile`) e F5.
2. Feche e reabra a view **Dev Shortcuts** (outra aba da sidebar e volte).
3. Output → canal **Dev Shortcuts** (erros de `refreshUi`).
4. Confirme que a extensao ativa e a do F5 (Development), nao uma copia antiga do Marketplace com o mesmo nome.

## Chaves legadas (referencia)

| Chave | Significado antigo |
|-------|-------------------|
| `devShortcuts.welcomeSeen` | Welcome oculto permanentemente |
| `devShortcuts.dismissedTips` | IDs de dicas dispensadas |

Essas chaves ficam dentro de `state.vscdb`. Versoes atuais nao as gravam ao clicar Got it / Dismiss.
