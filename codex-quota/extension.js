const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const vscode = require('vscode');
const { panelHtml } = require('./panel');

// A leitura periódica consulta o app-server local da extensão oficial do Codex.
const POLL_INTERVAL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 15_000;
const USAGE_URL = 'https://chatgpt.com/codex/settings/usage';
const APPEARANCE_KEY = 'codexQuota.appearance';

function appearanceColors(value) {
  const color = (candidate) => /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : null;
  return { bar: color(value?.bar), text: color(value?.text) };
}

function codexBinary() {
  const extension = vscode.extensions.getExtension('openai.chatgpt');
  if (!extension) throw new Error('A extensão oficial do Codex não está instalada.');

  const platforms = {
    win32: ['windows', 'win32'],
    darwin: ['macos', 'darwin'],
    linux: ['linux'],
  }[process.platform] ?? [process.platform];
  const arches = {
    x64: ['x86_64', 'x64', 'amd64'],
    arm64: ['aarch64', 'arm64'],
  }[process.arch] ?? [process.arch];
  const executable = process.platform === 'win32' ? 'codex.exe' : 'codex';
  const candidates = platforms.flatMap((platform) => arches.map((arch) =>
    path.join(extension.extensionPath, 'bin', `${platform}-${arch}`, executable)));
  const binary = candidates.find((candidate) => fs.existsSync(candidate));
  if (!binary) throw new Error('Executável local do Codex não encontrado.');
  return binary;
}

class CodexAppServer {
  constructor() {
    this.child = null;
    this.starting = null;
    this.pending = new Map();
    this.nextId = 1;
    this.buffer = '';
  }

  async start() {
    if (this.child && this.child.exitCode === null) return;
    if (this.starting) return this.starting;

    this.starting = (async () => {
      this.child = spawn(codexBinary(), ['app-server', '--stdio'], {
        stdio: ['pipe', 'pipe', 'ignore'],
        windowsHide: true,
      });
      this.buffer = '';
      this.child.stdout.on('data', (chunk) => this.onData(chunk));
      this.child.on('error', (error) => this.onClosed(error));
      this.child.on('close', () => this.onClosed(new Error('Conexão com o Codex encerrada.')));

      await this.request('initialize', {
        clientInfo: { name: 'codex-quota-panel', title: 'Codex Quota', version: '0.3.4' },
        capabilities: null,
      });
      this.child.stdin.write(JSON.stringify({ method: 'initialized', params: {} }) + '\n');
    })();

    try {
      await this.starting;
    } finally {
      this.starting = null;
    }
  }

  request(method, params = {}) {
    const child = this.child;
    if (!child || child.exitCode !== null || child.stdin.destroyed) {
      return Promise.reject(new Error('Codex local indisponível.'));
    }

    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('Tempo esgotado ao consultar os limites.'));
      }, REQUEST_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, timer });
      child.stdin.write(JSON.stringify({ id, method, params }) + '\n', (error) => {
        if (error) this.rejectPending(id, error);
      });
    });
  }

  rejectPending(id, error) {
    const pending = this.pending.get(id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(id);
    pending.reject(error);
  }

  onData(chunk) {
    this.buffer += chunk.toString('utf8');
    for (;;) {
      const newline = this.buffer.indexOf('\n');
      if (newline < 0) break;
      const line = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (!line) continue;

      let message;
      try { message = JSON.parse(line); } catch { continue; }
      if (typeof message.id !== 'number') continue;
      const pending = this.pending.get(message.id);
      if (!pending) continue;
      clearTimeout(pending.timer);
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message || 'Falha na consulta.'));
      else pending.resolve(message.result);
    }
  }

  onClosed(error) {
    this.child = null;
    for (const id of this.pending.keys()) this.rejectPending(id, error);
  }

  dispose() {
    this.child?.kill();
    this.onClosed(new Error('Painel encerrado.'));
  }
}

function formatReset(seconds) {
  if (seconds === null || seconds === undefined || !Number.isFinite(Number(seconds))) {
    return 'horário indisponível';
  }
  const date = new Date(Number(seconds) * 1000);
  if (Number.isNaN(date.getTime())) return 'horário indisponível';
  return date.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function timeUntilReset(seconds) {
  if (seconds === null || seconds === undefined || !Number.isFinite(Number(seconds))) return '';
  const date = new Date(Number(seconds) * 1000);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 60_000));
  if (minutes === 0) return 'agora';
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  if (days) return `em ${days}d ${hours}h`;
  if (hours) return `em ${hours}h ${rest}min`;
  return `em ${rest}min`;
}

function remaining(window) {
  if (!window || !Number.isFinite(Number(window.usedPercent))) return null;
  return Math.max(0, Math.min(100, Math.round(100 - Number(window.usedPercent))));
}

function normalize(result) {
  const rate = result?.rateLimitsByLimitId?.codex ?? result?.rateLimits ?? {};
  const windows = [rate.primary, rate.secondary].filter(Boolean);
  return {
    fiveHours: windows.find((window) => window.windowDurationMins === 300)
      ?? (rate.primary?.windowDurationMins == null ? rate.primary : null),
    week: windows.find((window) => window.windowDurationMins === 10080)
      ?? (rate.secondary?.windowDurationMins == null ? rate.secondary : null),
    resets: result?.rateLimitResetCredits?.availableCount ?? null,
    updatedAt: new Date(),
  };
}

class QuotaViewProvider {
  constructor(onAction, appearance) {
    this.onAction = onAction;
    this.appearance = appearance;
    this.views = new Set();
    this.snapshot = null;
    this.error = null;
  }

  resolveWebviewView(view) {
    view.webview.options = { enableScripts: true };
    view.webview.html = panelHtml();
    this.views.add(view);
    view.onDidDispose(() => this.views.delete(view));
    view.webview.onDidReceiveMessage((message) => {
      if (message.type === 'ready') {
        this.sendAppearance(view);
        this.send(view);
      } else if (['refresh', 'usage', 'appearance'].includes(message.type)) {
        this.onAction(message);
      }
    });
  }

  updateAppearance(appearance) {
    this.appearance = appearance;
    for (const view of this.views) this.sendAppearance(view);
  }

  sendAppearance(view) {
    void view.webview.postMessage({ type: 'appearance', ...this.appearance });
  }

  update(snapshot, error = null) {
    this.snapshot = snapshot;
    this.error = error;
    for (const view of this.views) this.send(view);
  }

  send(view) {
    const data = this.snapshot;
    const windowData = (window) => ({
      remaining: remaining(window),
      reset: window?.resetsAt == null ? null
        : `Reinicia ${timeUntilReset(window.resetsAt)} · ${formatReset(window.resetsAt)}`,
    });
    void view.webview.postMessage({
      type: 'snapshot',
      five: windowData(data?.fiveHours),
      week: windowData(data?.week),
      resets: data?.resets ?? null,
      updated: data?.updatedAt?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) ?? null,
      error: this.error,
    });
  }
}

function updateStatusBar(statusBar, snapshot, error) {
  if (!snapshot) {
    statusBar.text = '$(dashboard) Codex: limites indisponíveis';
    statusBar.tooltip = error || 'Consultando os limites do Codex…';
    return;
  }

  const five = remaining(snapshot.fiveHours);
  const week = remaining(snapshot.week);
  statusBar.text = `$(dashboard) 5h ${five ?? '—'}% · 7d ${week ?? '—'}%`;
  statusBar.tooltip = [
    `5h: ${five ?? '—'}% restante; reinicia ${formatReset(snapshot.fiveHours?.resetsAt)}`,
    `Semana: ${week ?? '—'}% restante; reinicia ${formatReset(snapshot.week?.resetsAt)}`,
    `Resets guardados: ${snapshot.resets ?? 'indisponível'}`,
    `Atualizado: ${snapshot.updatedAt.toLocaleTimeString('pt-BR')}`,
    ...(error ? [`Falha na última atualização: ${error}`] : []),
    'Clique para atualizar.',
  ].join('\n');
}

function activate(context) {
  const provider = new QuotaViewProvider((message) => {
    if (message.type === 'refresh') refresh();
    if (message.type === 'usage') vscode.env.openExternal(vscode.Uri.parse(USAGE_URL));
    if (message.type === 'appearance') {
      const appearance = appearanceColors(message);
      provider.updateAppearance(appearance);
      void context.globalState.update(APPEARANCE_KEY, appearance);
    }
  }, appearanceColors(context.globalState.get(APPEARANCE_KEY)));
  const server = new CodexAppServer();
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.command = 'codexQuota.refresh';
  statusBar.show();

  context.subscriptions.push(
    statusBar,
    vscode.window.registerWebviewViewProvider('codexQuotaSidebarView', provider),
    vscode.window.registerWebviewViewProvider('codexQuotaSecondaryView', provider),
    { dispose: () => server.dispose() },
  );

  let snapshot = null;
  let inFlight = null;
  const refresh = () => {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        await server.start();
        snapshot = normalize(await server.request('account/rateLimits/read', {
          excludeResetCreditDetails: true,
        }));
        provider.update(snapshot);
        updateStatusBar(statusBar, snapshot, null);
      } catch (error) {
        const message = error?.message || 'Falha desconhecida.';
        provider.update(snapshot, message);
        updateStatusBar(statusBar, snapshot, message);
      }
    })().finally(() => { inFlight = null; });
    return inFlight;
  };

  context.subscriptions.push(vscode.commands.registerCommand('codexQuota.refresh', refresh));
  context.subscriptions.push(vscode.commands.registerCommand('codexQuota.openUsage', () => {
    return vscode.env.openExternal(vscode.Uri.parse(USAGE_URL));
  }));
  const timer = setInterval(refresh, POLL_INTERVAL_MS);
  context.subscriptions.push({ dispose: () => clearInterval(timer) });
  refresh();
}

module.exports = { activate };
