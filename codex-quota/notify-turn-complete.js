const path = require('path');
const { playAudio } = require('./audio-alert');

const SOUND_FILE = path.join(__dirname, 'resources', 'prompt-complete.mp3');

function isTurnComplete(payload) {
  try {
    const notification = JSON.parse(payload);
    return notification && notification.type === 'agent-turn-complete';
  } catch {
    return false;
  }
}

async function main(payload) {
  if (!isTurnComplete(payload)) return 0;
  return await playAudio(SOUND_FILE) ? 0 : 1;
}

if (require.main === module) {
  main(process.argv[2]).then(
    (code) => { process.exitCode = code; },
    () => { process.exitCode = 1; },
  );
}

module.exports = { isTurnComplete, main };
