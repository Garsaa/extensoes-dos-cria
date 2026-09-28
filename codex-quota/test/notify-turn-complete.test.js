const test = require('node:test');
const assert = require('node:assert/strict');
const { isTurnComplete, main } = require('../notify-turn-complete');

test('ignores other events and malformed payloads', async () => {
  assert.equal(isTurnComplete('{bad json'), false);
  assert.equal(isTurnComplete(JSON.stringify({ type: 'turn/started' })), false);
  assert.equal(await main(JSON.stringify({ type: 'turn/started' })), 0);
});

test('recognizes the Codex completed-turn notification', () => {
  assert.equal(isTurnComplete(JSON.stringify({ type: 'agent-turn-complete', 'turn-id': 'turn_123' })), true);
});
