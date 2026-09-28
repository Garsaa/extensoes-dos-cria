const path = require('node:path');
const { spawn } = require('node:child_process');

const ALERT_FILE = path.join(__dirname, 'resources', 'quota-alert.mp3');
const COOLDOWN_MS = 15 * 60_000;

function shouldAlert(usedPercent, enabled, lastPlayedAt, now = Date.now()) {
  const used = Number(usedPercent);
  return enabled && usedPercent != null && Number.isFinite(used)
    && used >= 70 && used <= 80
    && (!Number.isFinite(lastPlayedAt) || now - lastPlayedAt >= COOLDOWN_MS);
}

function tryPlayer(command, args) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(command, args, { stdio: 'ignore', windowsHide: true });
    } catch {
      resolve(false);
      return;
    }
    const timeout = setTimeout(() => { child.kill(); resolve(false); }, 10_000);
    child.once('close', (code) => { clearTimeout(timeout); resolve(code === 0); });
    child.once('error', () => { clearTimeout(timeout); resolve(false); });
  });
}

async function playAlert() {
  const players = process.platform === 'darwin'
    ? [['afplay', [ALERT_FILE]]]
    : [];
  players.push(
    ['ffplay', ['-nodisp', '-autoexit', '-nostats', '-loglevel', 'quiet', ALERT_FILE]],
    ['mpv', ['--no-video', '--no-terminal', '--really-quiet', ALERT_FILE]],
  );
  for (const [command, args] of players) {
    if (await tryPlayer(command, args)) return true;
  }
  return false;
}

module.exports = { COOLDOWN_MS, shouldAlert, playAlert };
