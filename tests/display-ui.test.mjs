import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/game.mjs', import.meta.url), 'utf8');
const defaults = { schemaVersion: 1, resolutionScale: 1, shadowSize: 2048, frameLimit: 60, showFps: false };
function functions(names, state = {}) {
  const context = vm.createContext(state);
  for (const name of names) {
    const start = source.search(new RegExp(`(?:async )?function ${name}\\(`));
    assert.ok(start >= 0, `${name} exists`);
    const rest = source.slice(start), end = rest.slice(1).search(/\n(?:async )?function /);
    vm.runInContext(end < 0 ? rest : rest.slice(0, end + 1), context);
  }
  return context;
}
const plain = value => JSON.parse(JSON.stringify(value));

test('display preferences accept supported values and isolate invalid saved fields', () => {
  const c = functions(['normalizePreferences'], { displayDefaults: defaults });
  const saved = { ...defaults, resolutionScale: .8, shadowSize: 4096, frameLimit: 120, showFps: true };
  assert.deepEqual(plain(c.normalizePreferences(saved)), saved);
  assert.deepEqual(plain(c.normalizePreferences({ ...saved, schemaVersion: 9 })), defaults);
  assert.deepEqual(plain(c.normalizePreferences({ schemaVersion: 1, resolutionScale: 100, shadowSize: '4096', frameLimit: 240, showFps: 'yes' })), defaults);
});

test('desktop display profile uses the preload store instead of a changing HTTP origin', async () => {
  const fields = { 'preferences-status': {} }, writes = [], badge = {};
  const c = functions(['normalizePreferences', 'loadPreferences', 'savePreferences'], {
    displayDefaults: defaults, preferencesKey: 'display-test', preferences: { ...defaults }, preferenceSaveChain: Promise.resolve(),
    window: { halvethDesktop: { isDesktop: true, getPreferences: async () => ({ ...defaults, frameLimit: 30 }), setPreferences: async value => writes.push(plain(value)) } },
    document: { querySelectorAll: () => [badge] }, $: id => fields[id],
    localStorage: { getItem() { throw new Error('Browser storage must not be used'); }, setItem() { throw new Error('Browser storage must not be used'); } }
  });
  await c.loadPreferences(); assert.equal(c.preferences.frameLimit, 30); assert.equal(badge.textContent, 'DESKTOP EDITION');
  c.savePreferences(); await c.preferenceSaveChain;
  assert.equal(writes.length, 1); assert.equal(writes[0].frameLimit, 30);
});

test('browser display profile persists only the display schema', async () => {
  const writes = [], fields = { 'preferences-status': {} };
  const c = functions(['savePreferences'], { preferences: { ...defaults }, preferencesKey: 'display-test', preferenceSaveChain: Promise.resolve(), window: {}, $: id => fields[id], localStorage: { setItem: (...args) => writes.push(args) } });
  c.savePreferences(); await c.preferenceSaveChain;
  assert.deepEqual(writes, [['display-test', JSON.stringify(defaults)]]);
});

test('graphics settings change the actual renderer ratio and shadow allocation within GPU limits', () => {
  let disposed = 0, dirty = false, ratio = 0;
  const renderer = { capabilities: { maxTextureSize: 2048 }, shadowMap: { enabled: true }, getContext: () => ({ MAX_RENDERBUFFER_SIZE: 1, getParameter: () => 4096 }), setPixelRatio: value => { ratio = value; }, setSize: (w, h) => assert.deepEqual([w, h], [1920, 1080]) };
  const sun = { castShadow: true, shadow: { map: { dispose: () => disposed++ }, mapPass: { dispose: () => disposed++ }, mapSize: { x: 4096, set(x, y) { this.x = x; this.y = y; } } } };
  const material = { set needsUpdate(value) { dirty = value; } };
  const c = functions(['applyGraphics'], { preferences: { ...defaults, resolutionScale: .5, shadowSize: 4096 }, renderer, sun, devicePixelRatio: 2, innerWidth: 1920, innerHeight: 1080, updateGraphicsUI() {}, updateGraphicsReadout() {}, scene: { traverse: fn => fn({ material }) } });
  c.applyGraphics(); assert.equal(ratio, 1); assert.equal(sun.shadow.mapSize.x, 2048); assert.equal(disposed, 2); assert.equal(renderer.shadowMap.enabled, true);
  c.preferences.shadowSize = 0; c.applyGraphics(); assert.equal(renderer.shadowMap.enabled, false); assert.equal(sun.castShadow, false); assert.equal(dirty, true);
});

function frameFixture(limit = 60) {
  let draws = 0;
  const c = functions(['animate'], {
    requestAnimationFrame() {}, world: { epoch: 0 }, session: {}, document: { hidden: false }, windowFocused: true, paused: false, needsSingleFrame: false, hasRenderedFrame: true,
    preferences: { frameLimit: limit }, nextRenderAt: 0, fpsFrames: 0, fpsSince: 0, measuredFps: null, lastFrame: 0, elapsed: 0, lastMapUI: Infinity,
    isPaused: () => true, altitude: 0, flight: false, player: { x: 0, z: 36 }, yaw: 0, pitch: 0, height: () => 0,
    THREE: { MathUtils: { damp: () => 0 }, Color: class { lerp() { return this; } } }, camera: { position: { set() {} }, rotation: { set() {} } }, portal: null,
    ocean: { material: { uniforms: { time: {}, daylight: {} } } }, sun: {}, skyLight: {}, scene: { background: { copy() {} }, fog: { color: { copy() {} } } },
    environment: { getObjectByName: () => null }, npcModels: new Map(), guestModels: new Map(), effectModels: new Map(), fireflies: [], birds: null,
    renderer: { render() { draws++; } }, updateGraphicsReadout() {}
  });
  return { c, draws: () => draws };
}

test('30 FPS limit reduces real render invocations while measured FPS follows the renders', () => {
  const { c, draws } = frameFixture(30);
  for (let i = 0; i <= 120; i++) c.animate(1 + i * 1000 / 60);
  assert.ok(draws() >= 59 && draws() <= 62, `${draws()} renders in two seconds`);
  assert.ok(c.measuredFps >= 29 && c.measuredFps <= 31, `measured ${c.measuredFps}`);
});

test('pause, hidden window and lost focus stop render calls and retain the world', () => {
  for (const mode of ['pause', 'hidden', 'blur']) {
    const { c, draws } = frameFixture(); const world = c.world;
    if (mode === 'pause') c.paused = true;
    if (mode === 'hidden') c.document.hidden = true;
    if (mode === 'blur') c.windowFocused = false;
    for (let i = 0; i < 60; i++) c.animate(i * 17);
    assert.equal(draws(), 0, mode); assert.equal(c.world, world); assert.deepEqual(plain(c.player), { x: 0, z: 36 });
  }
});

test('a user graphics change may redraw one paused frame, then rendering rests again', () => {
  const { c, draws } = frameFixture(); c.paused = true; c.needsSingleFrame = true;
  c.animate(1); c.animate(18); c.animate(35);
  assert.equal(draws(), 1);
});
