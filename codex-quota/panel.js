const { randomBytes } = require('node:crypto');

function panelHtml() {
  const nonce = randomBytes(16).toString('base64');
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <style nonce="${nonce}">
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12px 14px 14px; background: var(--vscode-sideBar-background, var(--vscode-editor-background)); color: var(--vscode-foreground); font: 13px var(--vscode-font-family); }
    .top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
    .heading { margin: 0; font-size: 11px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: var(--vscode-descriptionForeground); }
    button { font: inherit; cursor: pointer; }
    .actions { display: flex; align-items: center; gap: 4px; }
    .action { border: 0; padding: 2px 6px; background: transparent; color: var(--vscode-textLink-foreground); border-radius: 4px; }
    .action:hover { background: var(--vscode-toolbar-hoverBackground); }
    .action:focus-visible, .default:focus-visible, input:focus-visible, .credits a:focus-visible { outline: 1px solid var(--vscode-focusBorder); outline-offset: 2px; }
    .settings { margin: 0 0 14px; padding: 10px; border: 1px solid var(--vscode-panel-border); border-radius: 6px; background: var(--vscode-input-background); }
    .setting { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 28px; }
    .setting + .setting { margin-top: 5px; }
    .setting-note { margin: 2px 0 0; color: var(--vscode-descriptionForeground); font-size: 10px; }
    input[type="color"] { width: 32px; height: 24px; padding: 2px; border: 1px solid var(--vscode-input-border, var(--vscode-panel-border)); border-radius: 4px; background: transparent; cursor: pointer; }
    .switch { appearance: none; position: relative; width: 30px; height: 17px; margin: 0 1px; border: 0; border-radius: 99px; background: rgba(128, 128, 128, .5); cursor: pointer; }
    .switch::before { content: ''; position: absolute; top: 3px; left: 3px; width: 11px; height: 11px; border-radius: 50%; background: #fff; transition: transform .15s ease; }
    .switch:checked { background: #e88952; }
    .switch:checked::before { transform: translateX(13px); }
    .default { margin-top: 7px; padding: 0; border: 0; background: transparent; color: var(--vscode-textLink-foreground); font-size: 11px; }
    .quota { color: var(--quota-text, var(--vscode-foreground)); }
    .quota + .quota { margin-top: 14px; }
    .line { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .label { font-weight: 600; }
    .value { font-size: 18px; line-height: 1.1; font-weight: 600; font-variant-numeric: tabular-nums; }
    .unit { font-size: 11px; font-weight: 400; color: var(--quota-text, var(--vscode-descriptionForeground)); }
    .track { height: 6px; overflow: hidden; margin-top: 6px; border-radius: 99px; background: rgba(128, 128, 128, .28); }
    .fill { height: 100%; width: 0; border-radius: inherit; background: var(--quota-bar, #e88952); transition: width .25s ease; }
    .reset { min-height: 14px; margin: 4px 0 0; color: var(--quota-text, var(--vscode-descriptionForeground)); font-size: 11px; }
    .footer { border-top: 1px solid var(--vscode-panel-border); margin-top: 14px; padding-top: 8px; color: var(--vscode-descriptionForeground); font-size: 11px; }
    .credits { display: flex; justify-content: space-between; gap: 10px; }
    .credits a { color: var(--vscode-textLink-foreground); text-decoration: none; }
    .credits a:hover { text-decoration: underline; }
    .updated { margin-top: 4px; }
    .notice { margin-top: 6px; color: var(--vscode-errorForeground); }
    [hidden] { display: none !important; }
  </style>
</head>
<body>
  <div class="top"><h1 class="heading">Limites do Codex</h1><div class="actions"><button class="action" id="settings-toggle" type="button" aria-label="Cores" aria-controls="settings" aria-expanded="false" title="Cores">⚙</button><button class="action" id="refresh" type="button" title="Atualizar limites">Atualizar</button></div></div>
  <div class="settings" id="settings" hidden>
    <div class="setting"><label for="bar-color">Barra</label><input id="bar-color" type="color" value="#e88952"></div>
    <div class="setting"><label for="text-color">Textos</label><input id="text-color" type="color" value="#cccccc"></div>
    <div class="setting"><label for="audio-enabled">Tocar áudio</label><input class="switch" id="audio-enabled" type="checkbox" role="switch" aria-describedby="audio-rule"></div>
    <p class="setting-note" id="audio-rule">Uso de 5h entre 70% e 80% · a cada 15 min</p>
    <button class="default" id="reset-colors" type="button">Restaurar cores padrão</button>
  </div>
  <main aria-live="polite">
    <section class="quota" aria-label="Limite de 5 horas">
      <div class="line"><span class="label">5 horas</span><span class="value"><span id="five-value">—</span><span class="unit"> restante</span></span></div>
      <div class="track" id="five-track" role="progressbar" aria-label="Limite restante em 5 horas" aria-valuemin="0" aria-valuemax="100"><div class="fill" id="five-fill"></div></div>
      <p class="reset" id="five-reset">Consultando…</p>
    </section>
    <section class="quota" aria-label="Limite semanal">
      <div class="line"><span class="label">Semana</span><span class="value"><span id="week-value">—</span><span class="unit"> restante</span></span></div>
      <div class="track" id="week-track" role="progressbar" aria-label="Limite semanal restante" aria-valuemin="0" aria-valuemax="100"><div class="fill" id="week-fill"></div></div>
      <p class="reset" id="week-reset">Consultando…</p>
    </section>
  </main>
  <footer class="footer">
    <div class="credits"><span>Resets guardados</span><span id="credits">—</span></div>
    <div class="updated" id="updated"></div>
    <div class="notice" id="notice" role="status" hidden></div>
  </footer>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const byId = (id) => document.getElementById(id);
    byId('refresh').addEventListener('click', () => vscode.postMessage({ type: 'refresh' }));
    byId('settings-toggle').addEventListener('click', () => {
      const settings = byId('settings');
      settings.hidden = !settings.hidden;
      byId('settings-toggle').setAttribute('aria-expanded', String(!settings.hidden));
    });
    function themeTextColor() {
      const channels = getComputedStyle(byId('five-value')).color.match(/\\d+/g);
      const hex = channels?.slice(0, 3).map((value) => Number(value).toString(16).padStart(2, '0')).join('');
      return hex?.length === 6 ? '#' + hex : '#cccccc';
    }
    function applyAppearance(appearance) {
      const root = document.documentElement.style;
      if (appearance.bar) root.setProperty('--quota-bar', appearance.bar);
      else root.removeProperty('--quota-bar');
      if (appearance.text) root.setProperty('--quota-text', appearance.text);
      else root.removeProperty('--quota-text');
      byId('bar-color').value = appearance.bar || '#e88952';
      byId('text-color').value = appearance.text || themeTextColor();
    }
    let appearance = { bar: null, text: null };
    function saveAppearance() { vscode.postMessage({ type: 'appearance', ...appearance }); }
    for (const [id, key] of [['bar-color', 'bar'], ['text-color', 'text']]) {
      byId(id).addEventListener('input', () => {
        appearance[key] = byId(id).value;
        applyAppearance(appearance);
      });
      byId(id).addEventListener('change', saveAppearance);
    }
    byId('reset-colors').addEventListener('click', () => {
      appearance = { bar: null, text: null };
      applyAppearance(appearance);
      saveAppearance();
    });
    byId('audio-enabled').addEventListener('change', () => {
      vscode.postMessage({ type: 'audioEnabled', enabled: byId('audio-enabled').checked });
    });
    byId('credits').addEventListener('click', (event) => {
      if (event.target.closest('a')) { event.preventDefault(); vscode.postMessage({ type: 'usage' }); }
    });
    function showWindow(prefix, data) {
      const percent = data?.remaining;
      byId(prefix + '-value').textContent = percent == null ? '—' : percent + '%';
      byId(prefix + '-fill').style.width = percent == null ? '0%' : percent + '%';
      const track = byId(prefix + '-track');
      if (percent == null) track.removeAttribute('aria-valuenow');
      else track.setAttribute('aria-valuenow', String(percent));
      byId(prefix + '-reset').textContent = data?.reset || 'Horário de reset indisponível';
    }
    window.addEventListener('message', ({ data }) => {
      if (data.type === 'preferences') {
        appearance = { bar: data.bar, text: data.text };
        applyAppearance(appearance);
        byId('audio-enabled').checked = data.audioEnabled === true;
        return;
      }
      if (data.type !== 'snapshot') return;
      showWindow('five', data.five);
      showWindow('week', data.week);
      const credits = byId('credits');
      credits.replaceChildren();
      if (data.resets > 0) {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = String(data.resets) + ' · Ver detalhes';
        credits.append(link);
      } else credits.textContent = data.resets == null ? '—' : String(data.resets);
      byId('updated').textContent = data.updated ? 'Atualizado às ' + data.updated : '';
      const notice = byId('notice');
      notice.textContent = data.error || '';
      notice.hidden = !data.error;
    });
    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
}

module.exports = { panelHtml };
