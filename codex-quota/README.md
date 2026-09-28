# Codex Quota

Veja seus limites do Codex sem sair do VS Code.

O painel **Limites** fica ao lado do chat do Codex e mostra o uso restante nas janelas de **5 horas** e **1 semana**, os horários de reset e os resets guardados. Uma barra de status resume os percentuais.

> O código do painel nesta versão foi adaptado do fork de [Art-Camargo/codex-quota-panel](https://github.com/Art-Camargo/codex-quota-panel).

## Recursos

- Barras de progresso para os limites de 5 horas e semanal.
- Cores configuráveis para as barras e os textos pelo botão de aparência no painel.
- Alerta de áudio opcional entre 70% e 80% de uso da janela de 5 horas, com intervalo mínimo de 15 minutos entre reproduções.
- Som separado ao concluir um turno do Codex, usando o evento oficial `agent-turn-complete`.
- Horário e contagem regressiva para cada reset.
- Saldo de resets guardados, com link para Usage & Billing quando disponível.
- Atualização automática a cada minuto e atualização manual pelo botão **Atualizar**.
- Consulta feita pelo app-server local da extensão oficial do Codex.

## Requisitos

- Visual Studio Code **1.96.2** ou mais recente.
- Extensão oficial **Codex** (openai.chatgpt) instalada e autenticada.

## Instalar pelo VSIX

Baixe o arquivo [codex-quota-panel-0.3.6.vsix](dist/codex-quota-panel-0.3.6.vsix) ou, na raiz do repositório, execute:

~~~sh
code --install-extension codex-quota/dist/codex-quota-panel-0.3.6.vsix --force
~~~

No VS Code, também é possível usar **Extensions** → **…** → **Install from VSIX…**. Depois, recarregue a janela e abra **Limites** junto ao chat do Codex.

## Alerta de áudio

No botão de aparência (⚙), ative **Tocar áudio**. O switch começa desligado. O arquivo `resources/quota-alert.mp3` toca quando o uso da janela de 5 horas estiver entre 70% e 80%, inclusive. Enquanto o uso permanecer nessa faixa, o alerta pode repetir após 15 minutos; fora dela, não toca. O intervalo é preservado ao recarregar o VS Code.

A reprodução roda fora do painel para funcionar mesmo quando ele estiver fechado. No Linux, requer `ffplay` ou `mpv`; no macOS, usa `afplay` ou um desses reprodutores. No Windows, requer `ffplay` ou `mpv` no PATH.

## Som ao concluir um prompt

O arquivo `resources/prompt-complete.mp3` pode tocar ao terminar um turno do Codex no IDE ou CLI. O Codex chama `notify-turn-complete.js` pelo evento `agent-turn-complete`; não é necessário manter o painel aberto. Adicione ao **config.toml do usuário** (`~/.codex/config.toml`, ou `$CODEX_HOME/config.toml`) uma linha de nível superior, antes de qualquer seção `[... ]`:

~~~toml
notify = ["node", "/caminho/absoluto/para/codex-quota/notify-turn-complete.js"]
~~~

Troque o caminho pelo desta pasta e reinicie o Codex/VS Code. O comando requer Node.js e um reprodutor de áudio da seção anterior. Se já houver um `notify` configurado, combine os comandos num wrapper em vez de substituir a configuração existente. Para desligar esse som, remova ou comente a linha `notify`.

## Empacotar

Com Node.js e npm instalados, execute dentro desta pasta:

~~~sh
npm exec --yes --package=@vscode/vsce --call "vsce package --no-dependencies -o dist/codex-quota-panel-0.3.6.vsix"
~~~

Ao preparar uma nova versão, atualize version no package.json e o nome do arquivo VSIX para a mesma versão.

## Privacidade e compatibilidade

A extensão lê as cotas através do app-server local da extensão oficial do Codex. Ela não armazena credenciais nem envia os dados de cota a serviços de terceiros. O link para **Usage & Billing** só é aberto quando clicado.

A documentação do fork informa validação em Linux x64. No Windows e macOS, os caminhos do executável ainda podem exigir validação ou ajustes conforme a versão instalada do Codex.
