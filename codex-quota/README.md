# Codex Quota

Veja seus limites do Codex sem sair do VS Code.

O painel **Limites** fica ao lado do chat do Codex e mostra o uso restante nas janelas de **5 horas** e **1 semana**, os horários de reset e os resets guardados. Uma barra de status resume os percentuais.

> O código do painel nesta versão foi adaptado do fork de [Art-Camargo/codex-quota-panel](https://github.com/Art-Camargo/codex-quota-panel).

## Recursos

- Barras de progresso para os limites de 5 horas e semanal.
- Cores configuráveis para as barras e os textos pelo botão de aparência no painel.
- Horário e contagem regressiva para cada reset.
- Saldo de resets guardados, com link para Usage & Billing quando disponível.
- Atualização automática a cada minuto e atualização manual pelo botão **Atualizar**.
- Consulta feita pelo app-server local da extensão oficial do Codex.

## Requisitos

- Visual Studio Code **1.96.2** ou mais recente.
- Extensão oficial **Codex** (openai.chatgpt) instalada e autenticada.

## Instalar pelo VSIX

Baixe o arquivo [codex-quota-panel-0.3.4.vsix](dist/codex-quota-panel-0.3.4.vsix) ou, na raiz do repositório, execute:

~~~sh
code --install-extension codex-quota/dist/codex-quota-panel-0.3.4.vsix --force
~~~

No VS Code, também é possível usar **Extensions** → **…** → **Install from VSIX…**. Depois, recarregue a janela e abra **Limites** junto ao chat do Codex.

## Empacotar

Com Node.js e npm instalados, execute dentro desta pasta:

~~~sh
npm exec --yes --package=@vscode/vsce --call "vsce package --no-dependencies -o dist/codex-quota-panel-0.3.4.vsix"
~~~

Ao preparar uma nova versão, atualize version no package.json e o nome do arquivo VSIX para a mesma versão.

## Privacidade e compatibilidade

A extensão lê as cotas através do app-server local da extensão oficial do Codex. Ela não armazena credenciais nem envia os dados de cota a serviços de terceiros. O link para **Usage & Billing** só é aberto quando clicado.

A documentação do fork informa validação em Linux x64. No Windows e macOS, os caminhos do executável ainda podem exigir validação ou ajustes conforme a versão instalada do Codex.
