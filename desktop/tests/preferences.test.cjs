'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { defaults, validatePreferences } = require('../preferences.cjs');
test('desktop graphics preferences preserve every supported UI choice', () => {
  for (const resolutionScale of [.5, .55, .8, 1, 1.25]) for (const shadowSize of [0, 1024, 2048, 4096]) for (const frameLimit of [0, 30, 60, 120]) {
    const candidate = { schemaVersion: 1, resolutionScale, shadowSize, frameLimit, showFps: true };
    assert.deepEqual(validatePreferences(candidate), candidate);
  }
});
test('invalid saved or renderer-provided graphics settings are not silently applied', () => {
  for (const change of [{ resolutionScale: NaN }, { resolutionScale: .51 }, { resolutionScale: 5 },
    { shadowSize: 99999 }, { frameLimit: 15 }, { showFps: 'true' }, { schemaVersion: 0 }, { extra: 'unexpected' }]) {
    assert.throws(() => validatePreferences({ ...defaults, ...change }));
  }
  assert.throws(() => validatePreferences(null));
  assert.throws(() => validatePreferences({}));
  const applied = validatePreferences(defaults); applied.showFps = true;
  assert.equal(defaults.showFps, false);
});
