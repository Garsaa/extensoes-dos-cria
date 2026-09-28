const path = require('path');
const { spawn } = require('child_process');

function isCompletedTurn(payload) {
  try {
    const event = JSON.parse(payload);
    return event && event.hook_event_name === 'Stop' && !event.stop_hook_active;
  } catch {
    return false;
  }
}

function playInBackground() {
  const player = spawn(process.execPath, [
    path.join(__dirname, 'notify-turn-complete.js'),
    JSON.stringify({ type: 'agent-turn-complete' }),
  ], { detached: true, stdio: 'ignore', windowsHide: true });
  player.unref();
}

if (require.main === module) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    if (isCompletedTurn(input)) playInBackground();
  });
}

module.exports = { isCompletedTurn };
