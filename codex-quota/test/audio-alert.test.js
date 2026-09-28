const test = require('node:test');
const assert = require('node:assert/strict');
const { COOLDOWN_MS, shouldAlert } = require('../audio-alert');

test('alerts only while enabled and inside the 70–80% used range', () => {
  const now = 1_000_000;
  assert.equal(shouldAlert(70, false, 0, now), false);
  assert.equal(shouldAlert(69.9, true, 0, now), false);
  assert.equal(shouldAlert(70, true, 0, now), true);
  assert.equal(shouldAlert(80, true, 0, now), true);
  assert.equal(shouldAlert(80.1, true, 0, now), false);
  assert.equal(shouldAlert(null, true, 0, now), false);
});

test('waits 15 minutes before repeating while usage stays in range', () => {
  const lastPlayedAt = 1_000_000;
  assert.equal(shouldAlert(75, true, lastPlayedAt, lastPlayedAt + COOLDOWN_MS - 1), false);
  assert.equal(shouldAlert(75, true, lastPlayedAt, lastPlayedAt + COOLDOWN_MS), true);
});
