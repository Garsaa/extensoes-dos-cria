# Codex Quota

Veja seus limites do Codex sem sair do VS Code.

O painel **Limites** fica ao lado do chat do Codex e mostra o uso restante nas janelas de **5 horas** e **1 semana**, os horários de reset e os resets guardados. Uma barra de status resume os percentuais.

> O código do painel nesta versão foi adaptado do fork de [Art-Camargo/codex-quota-panel](https://github.com/Art-Camargo/codex-quota-panel).

## Recursos

- Barras de progresso para os limites de 5 horas e semanal.
- Cores configuráveis para as barras e os textos pelo botão de aparência no painel.
- Alerta de áudio opcional entre 70% e 80% de uso da janela de 5 horas, com intervalo mínimo de 15 minutos entre reproduções.
- Som separado ao concluir um turno local do Codex, com um monitor leve para o app desktop.
- Horário e contagem regressiva para cada reset.
- Saldo de resets guardados, com link para Usage & Billing quando disponível.
- Atualização automática a cada minuto e atualização manual pelo botão **Atualizar**.
- Consulta feita pelo app-server local da extensão oficial do Codex.

## Requisitos

- Visual Studio Code **1.96.2** ou mais recente.
- Extensão oficial **Codex** (openai.chatgpt) instalada e autenticada.

## Instalar pelo VSIX

Baixe o arquivo [codex-quota-panel-0.3.9.vsix](dist/codex-quota-panel-0.3.9.vsix) ou, na raiz do repositório, execute:

~~~sh
code --install-extension codex-quota/dist/codex-quota-panel-0.3.9.vsix --force
~~~

No VS Code, também é possível usar **Extensions** → **…** → **Install from VSIX…**. Depois, recarregue a janela e abra **Limites** junto ao chat do Codex.

## Alerta de áudio

No botão de aparência (⚙), ative **Tocar áudio**. O switch começa desligado e controla tanto o alerta do limite quanto o som de conclusão de prompt. O arquivo `resources/quota-alert.mp3` toca quando o uso da janela de 5 horas estiver entre 70% e 80%, inclusive. Enquanto o uso permanecer nessa faixa, o alerta pode repetir após 15 minutos; fora dela, não toca. O intervalo é preservado ao recarregar o VS Code.

A reprodução roda fora do painel para funcionar mesmo quando ele estiver fechado. No Linux, requer `ffplay` ou `mpv`; no macOS, usa `afplay` ou um desses reprodutores. No Windows, requer `ffplay` ou `mpv` no PATH.

## Som ao concluir um prompt

Quando **Tocar áudio** estiver ligado, o arquivo `resources/prompt-complete.mp3` toca ao terminar um turno local do Codex. No Linux, `watch-completed-turns.py` observa a mudança para `completed` no histórico local (`~/.codex/thread_history_1.sqlite`) a cada segundo e reproduz o áudio uma vez por turno. Ele usa cerca de 6 MB de memória e requer Python 3, Node.js e `ffplay` ou `mpv`. O painel não precisa estar aberto.

O **VSIX sozinho não ativa o monitor**. Depois de instalá-lo no Linux, rode `python3 ~/.vscode/extensions/garsa.codex-quota-panel-0.3.9/install-completion-sound.py`. Quem clonar ou baixar o código-fonte também pode rodar `python3 install-completion-sound.py` dentro de `codex-quota`. O instalador cria e inicia um serviço de usuário do systemd que aponta para a pasta da extensão; execute-o novamente após atualizar ou mover a extensão. Para desligar: `systemctl --user disable --now codex-prompt-sound.service`.

Desligar **Tocar áudio** silencia os dois sons, mesmo com o serviço em execução. O monitor usa um banco de dados interno do Codex; uma atualização do app pode mudar esse formato e exigir ajuste no script.

## Empacotar

Com Node.js e npm instalados, execute dentro desta pasta:

~~~sh
npm exec --yes --package=@vscode/vsce --call "vsce package --no-dependencies -o dist/codex-quota-panel-0.3.9.vsix"
~~~

Ao preparar uma nova versão, atualize version no package.json e o nome do arquivo VSIX para a mesma versão.

## Privacidade e compatibilidade

A extensão lê as cotas através do app-server local da extensão oficial do Codex. Ela não armazena credenciais nem envia os dados de cota a serviços de terceiros. O link para **Usage & Billing** só é aberto quando clicado.

A documentação do fork informa validação em Linux x64. No Windows e macOS, os caminhos do executável ainda podem exigir validação ou ajustes conforme a versão instalada do Codex.
