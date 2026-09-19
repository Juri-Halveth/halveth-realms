'use strict';
const defaults = Object.freeze({ schemaVersion: 1, resolutionScale: 1, shadowSize: 2048, frameLimit: 60, showFps: false });
function validatePreferences(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).length !== 5 || Object.keys(value).some(key => !Object.hasOwn(defaults, key))
    || value.schemaVersion !== 1 || typeof value.resolutionScale !== 'number'
    || !Number.isFinite(value.resolutionScale) || value.resolutionScale < .5 || value.resolutionScale > 1.25
    || Math.abs(value.resolutionScale * 20 - Math.round(value.resolutionScale * 20)) > 1e-8
    || ![0, 1024, 2048, 4096].includes(value.shadowSize) || ![0, 30, 60, 120].includes(value.frameLimit)
    || typeof value.showFps !== 'boolean') throw new TypeError('Ungültige Grafikeinstellungen.');
  return { schemaVersion: 1, resolutionScale: value.resolutionScale, shadowSize: value.shadowSize, frameLimit: value.frameLimit, showFps: value.showFps };
}
module.exports = { defaults, validatePreferences };
