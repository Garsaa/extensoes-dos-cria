const test = require('node:test');
const assert = require('node:assert/strict');
const { isCompletedTurn } = require('../stop-hook');

test('plays only for a completed main turn', () => {
  assert.equal(isCompletedTurn('{bad json'), false);
  assert.equal(isCompletedTurn(JSON.stringify({ hook_event_name: 'Interrupt' })), false);
  assert.equal(isCompletedTurn(JSON.stringify({ hook_event_name: 'Stop', stop_hook_active: true })), false);
  assert.equal(isCompletedTurn(JSON.stringify({ hook_event_name: 'Stop', stop_hook_active: false })), true);
});
