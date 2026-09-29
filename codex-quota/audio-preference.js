const fs = require('fs');
const os = require('os');
const path = require('path');

const CODEX_HOME = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
const PREFERENCE_FILE = path.join(CODEX_HOME, 'codex-quota-audio.json');

function readAudioEnabled(fallback = false) {
  try {
    return JSON.parse(fs.readFileSync(PREFERENCE_FILE, 'utf8')).enabled === true;
  } catch {
    return fallback;
  }
}

function writeAudioEnabled(enabled) {
  fs.mkdirSync(CODEX_HOME, { recursive: true });
  const temporary = `${PREFERENCE_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify({ enabled: enabled === true }) + '\n');
  fs.renameSync(temporary, PREFERENCE_FILE);
}

module.exports = { PREFERENCE_FILE, readAudioEnabled, writeAudioEnabled };
