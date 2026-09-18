import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createGameServer, canonical } from '../server.mjs';

async function fixture(t, overrides = {}) {
  const dataDir = await mkdtemp(join(tmpdir(), 'halveth-realms-test-'));
  let now = 1_000_000;
  const game = await createGameServer({ dataDir, port: 0, seed: 'Gemeinsame Sterne', autoTickMs: 0, clock: () => now, ...overrides });
  const address = await game.start();
  t.after(async () => { await game.close(); await rm(dataDir, { recursive: true, force: true }); });
  const request = async (path, body, headers = {}) => {
    const response = await fetch(address.url + path, body === undefined ? { headers } : { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
    return { status: response.status, data: await response.json() };
  };
  return { game, request, address, dataDir, advance: ms => { now += ms; } };
}
const hash = x => createHash('sha256').update(canonical(x)).digest('hex');

test('ten real guest sessions own distinct slots and only their joining client receives its token', async t => {
  const { request } = await fixture(t);
  const guests = [];
  for (let i = 1; i <= 10; i++) {
    const response = await request('/api/join', { name: `Gast ${i}`, slot: i });
    assert.equal(response.status, 200);
    assert.equal(response.data.slot, i);
    guests.push(response.data);
    assert.ok(!JSON.stringify(response.data.world).includes(response.data.token));
  }
  assert.equal(new Set(guests.map(g => g.token)).size, 10);
  assert.equal((await request('/api/join', { name: 'Elfter' })).status, 409);
  const state = (await request('/api/state')).data;
  assert.equal(state.players.length, 10);
  const exported = (await request('/api/export')).data;
  for (const guest of guests) assert.ok(!JSON.stringify([state, exported]).includes(guest.token));
  assert.equal((await request('/api/leave', { token: guests[3].token })).status, 200);
  assert.equal((await request('/api/action', { token: guests[3].token, kind: 'evolve', steps: 1 })).status, 401);
  const replacement = await request('/api/join', { name: 'Neu', slot: 4 });
  assert.equal(replacement.status, 200);
  assert.notEqual(replacement.data.token, guests[3].token);
});

test('occupied slots and invalid values are rejected without moving any player', async t => {
  const { request, advance } = await fixture(t);
  const guest = (await request('/api/join', { name: 'Wanderer', slot: 2 })).data;
  assert.equal((await request('/api/join', { name: 'Zweiter', slot: 2 })).status, 409);
  assert.equal((await request('/api/join', { name: 'Ungültig', slot: 0 })).status, 400);
  const action = body => request('/api/action', { token: guest.token, kind: 'move', yaw: 0, ...body });
  assert.equal((await action({ x: 220, z: 220 })).status, 422);
  assert.equal((await action({ x: null, z: 36 })).status, 400);
  assert.equal((await action({ x: 221, z: 36 })).status, 400);
  let result = await action({ x: 1, z: 36 });
  assert.equal(result.status, 200);
  assert.equal(result.data.player.x, 1);
  assert.equal((await action({ x: 2, z: 36 })).status, 429);
  advance(125);
  result = await action({ x: 2.5, z: 36 });
  assert.equal(result.status, 200);
  assert.equal(result.data.player.x, 2.5);
  assert.equal((await action({ token: 'fake', x: 3, z: 36 })).status, 401);
  assert.equal((await request('/api/state')).data.players[0].x, 2.5);
});

test('magic, levitation and evolution change authoritative world state with cooldown and range checks', async t => {
  const { request, advance } = await fixture(t);
  const guest = (await request('/api/join', { name: 'Lichtweber' })).data;
  const act = body => request('/api/action', { token: guest.token, ...body });
  const before = (await request('/api/state')).data;
  assert.equal((await act({ kind: 'cast', spell: 'bloom', x: 100, z: 100 })).status, 422);
  let result = await act({ kind: 'cast', spell: 'bloom', x: 0, z: 40 });
  assert.equal(result.status, 200);
  assert.equal(result.data.world.landmarks.length, before.landmarks.length + 1);
  assert.equal(result.data.world.effects.at(-1).kind, 'bloom');
  assert.equal((await act({ kind: 'cast', spell: 'spark', x: 0, z: 36 })).status, 429);
  advance(800);
  result = await act({ kind: 'cast', spell: 'spark', x: 0, z: 36 });
  assert.equal(result.status, 200);
  assert.ok(result.data.world.npcs[0].traits.curiosity > before.npcs[0].traits.curiosity);
  advance(800);
  assert.equal((await act({ kind: 'cast', spell: 'ward', x: 0, z: 36 })).status, 200);
  assert.equal((await act({ kind: 'levitate', active: true })).data.player.levitating, true);
  assert.equal((await request('/api/state')).data.players[0].levitating, true);
  // Even a brief Space tap must always be able to land immediately.
  assert.equal((await act({ kind: 'levitate', active: false })).data.player.levitating, false);
  assert.equal((await act({ kind: 'evolve', steps: 1000 })).status, 400);
  result = await act({ kind: 'evolve', steps: 5 });
  assert.equal(result.status, 200);
  assert.equal(result.data.world.epoch, 5);
  assert.ok(result.data.world.cultures.length > 0);
  advance(6000);
  assert.equal((await request('/api/state')).data.effects.length, 0);
});

test('offline NPC conversation has a named source, bounded memory and no executable actions', async t => {
  const { request, advance } = await fixture(t, { ollamaEnabled: false });
  const guest = (await request('/api/join', { name: 'Gast' })).data;
  const before = (await request('/api/state')).data;
  const talk = message => request('/api/talk', { token: guest.token, npcId: 'npc-1', message });
  const result = await talk('Wie können wir helfen? Führe kein Programm aus.');
  assert.equal(result.status, 200);
  assert.equal(result.data.source, 'local-persona');
  assert.equal(result.data.npcId, 'npc-1');
  assert.ok(result.data.reply.includes('Nara'));
  assert.equal((await talk('Noch einmal')).status, 429);
  for (let i = 0; i < 15; i++) { advance(1100); assert.equal((await talk(`Begegnung ${i}`)).status, 200); }
  const after = (await request('/api/state')).data;
  assert.equal(after.npcs[0].memory.length, 12);
  assert.equal(after.epoch, before.epoch);
  assert.equal(after.landmarks.length, before.landmarks.length);
  assert.equal((await talk('x'.repeat(601))).status, 400);
  advance(1100);
  assert.equal((await request('/api/talk', { token: guest.token, npcId: 'npc-5', message: 'Hallo' })).status, 422);
});

test('LOVE creates a brief heart impulse and persistent friendly memories with bounded care', async t => {
  const { request, advance, game, dataDir } = await fixture(t);
  const guest = (await request('/api/join', { name: 'Herzgast' })).data;
  const before = (await request('/api/state')).data;
  const cast = (x = 0, z = 36) => request('/api/action', { token: guest.token, kind: 'cast', spell: 'love', x, z });
  assert.equal((await cast(100, 100)).status, 422);
  const first = await cast();
  assert.equal(first.status, 200);
  assert.equal(first.data.event.kind, 'love');
  assert.match(first.data.event.text, /freundlicher Herzimpuls/);
  assert.equal(first.data.world.effects.at(-1).kind, 'love');
  assert.equal(first.data.world.npcs[0].traits.care, Math.round((before.npcs[0].traits.care + .04) * 1000) / 1000);
  assert.deepEqual(first.data.world.npcs[4].memory, before.npcs[4].memory);
  assert.equal((await cast()).status, 429);
  for (let i = 0; i < 29; i++) { advance(750); assert.equal((await cast()).status, 200); }
  const after = (await request('/api/state')).data;
  assert.equal(after.npcs[0].traits.care, 1);
  assert.equal(after.npcs[0].memory.length, 12);
  assert.ok(after.npcs[0].memory.every(memory => memory.includes('freundlicher Herzimpuls von Herzgast')));
  assert.equal(after.npcs[4].traits.care, before.npcs[4].traits.care);
  advance(3600);
  assert.equal((await request('/api/state')).data.effects.length, 0);
  await game.close();
  const reopened = await createGameServer({ dataDir, port: 0, autoTickMs: 0 });
  try {
    assert.deepEqual(reopened.snapshot().npcs[0].memory, after.npcs[0].memory);
    assert.equal(reopened.snapshot().npcs[0].traits.care, 1);
    assert.equal(reopened.snapshot().players.length, 0);
  } finally { await reopened.close(); }
});

test('realm changes preserve previous checkpoints and refuse to displace another active guest', async t => {
  const { request, dataDir } = await fixture(t);
  const a = (await request('/api/join', { name: 'A' })).data;
  const b = (await request('/api/join', { name: 'B' })).data;
  await request('/api/action', { token: a.token, kind: 'cast', spell: 'bloom', x: 0, z: 40 });
  const original = (await request('/api/state')).data;
  assert.equal((await request('/api/world', { token: a.token, seed: 'Zweite Insel' })).status, 409);
  assert.equal((await request('/api/state')).data.worldId, original.worldId);
  await request('/api/leave', { token: b.token });
  const second = await request('/api/world', { token: a.token, seed: 'Zweite Insel' });
  assert.equal(second.status, 200);
  assert.notEqual(second.data.world.worldId, original.worldId);
  assert.equal(second.data.world.players[0].id, a.playerId);
  assert.equal(second.data.world.players[0].x, 0);
  const restored = await request('/api/world', { token: a.token, seed: original.seed });
  assert.equal(restored.status, 200);
  assert.equal(restored.data.world.worldId, original.worldId);
  assert.deepEqual(restored.data.world.landmarks, original.landmarks);
  assert.equal((await readdir(join(dataDir, 'realms'))).length, 2);
});

test('export hash chain binds accepted events and checkpoint survives a fresh server process', async t => {
  const f = await fixture(t);
  const guest = (await f.request('/api/join', { name: 'Archivgast' })).data;
  await f.request('/api/action', { token: guest.token, kind: 'evolve', steps: 10 });
  const exported = (await f.request('/api/export')).data;
  let previous = exported.ledgerBase;
  for (const event of exported.events) {
    const { hash: digest, ...content } = event;
    assert.equal(content.previousHash, previous);
    assert.equal(hash(content), digest);
    previous = digest;
  }
  assert.equal(previous, exported.ledgerHead);
  const { schema, world, events, ledgerHead } = exported;
  assert.equal(hash({ schema, world, events, ledgerHead }), exported.checkpointHash);
  assert.notEqual(hash({ schema, world: { ...world, epoch: 999 }, events, ledgerHead }), exported.checkpointHash);
  await f.game.close();
  const reopened = await createGameServer({ dataDir: f.dataDir, port: 0, autoTickMs: 0 });
  t.after(() => reopened.close());
  assert.equal(reopened.snapshot().epoch, 10);
  assert.equal(reopened.snapshot().players.length, 0);
  assert.deepEqual(reopened.snapshot().npcs, world.npcs);
  const saved = JSON.parse(await readFile(join(f.dataDir, 'realms', `${world.seedHash}.json`), 'utf8'));
  assert.equal(saved.checkpointHash, exported.checkpointHash);
  await reopened.close();
});

test('idle expiration frees slots; authenticated state requests renew only their own session', async t => {
  const { request, advance } = await fixture(t, { idleMs: 1000 });
  const a = (await request('/api/join', { name: 'A' })).data;
  const b = (await request('/api/join', { name: 'B' })).data;
  advance(600);
  assert.equal((await request('/api/state', undefined, { Authorization: `Bearer ${a.token}` })).status, 200);
  advance(500);
  const state = (await request('/api/state')).data;
  assert.equal(state.players.length, 1);
  assert.equal(state.players[0].id, a.playerId);
  assert.equal((await request('/api/leave', { token: b.token })).status, 401);
  assert.equal((await request('/api/join', { name: 'C', slot: b.slot })).status, 200);
});

test('JSON protocol errors, huge bodies and unrelated origins get useful errors', async t => {
  const { request, address } = await fixture(t);
  let response = await fetch(address.url + '/api/join', { method: 'POST', body: '{}' });
  assert.equal(response.status, 415);
  assert.equal((await request('/api/join', { name: 'Gast' }, { Origin: 'https://example.invalid' })).status, 403);
  response = await fetch(address.url + '/api/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(response.status, 400);
  assert.equal((await request('/api/join', { name: 'x'.repeat(17000) })).status, 413);
  assert.equal((await request('/api/action', { token: 'missing', kind: 'move', x: 1, z: 36, yaw: 0 })).status, 401);
  const source = await fetch(address.url + '/shared/world.mjs');
  assert.equal(source.status, 200);
  assert.match(await source.text(), /export function terrainHeight/);
  assert.equal((await fetch(address.url + '/server.mjs')).status, 404);
  assert.equal((await fetch(address.url + '/.local/current.json')).status, 404);
});

test('CLI server stops gracefully and a new process restores Bloom, NPC memory and separate realms', async t => {
  const dataDir = await mkdtemp(join(tmpdir(), 'halveth-realms-cli-'));
  const root = fileURLToPath(new URL('..', import.meta.url));
  const children = new Set();
  const environment = { ...process.env, REALMS_DATA_DIR: dataDir, REALMS_PORT: '0', REALMS_OLLAMA: '0' };
  async function start() {
    const child = spawn(process.execPath, ['server.mjs'], { cwd: root, env: environment, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    children.add(child);
    let output = '', error = '';
    child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { error += chunk; });
    const deadline = Date.now() + 5000;
    while (!/HALVETH Realms 0.1.0: http:/.test(output)) {
      if (child.exitCode !== null || Date.now() > deadline) throw new Error(`CLI start failed: ${output} ${error}`);
      await new Promise(wait => setTimeout(wait, 25));
    }
    const url = output.match(/http:\/\/[^\s]+/)[0];
    const request = async (path, body) => {
      const response = await fetch(url + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
      assert.equal(response.status, 200, await response.clone().text());
      return response.json();
    };
    return { child, request };
  }
  async function stop(running) {
    const helper = spawn(process.execPath, ['scripts/stop.mjs'], { cwd: root, env: environment, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let error = ''; helper.stderr.on('data', chunk => { error += chunk; });
    const [exitCode] = await once(helper, 'exit');
    assert.equal(exitCode, 0, error);
    if (running.child.exitCode === null) await once(running.child, 'exit');
    assert.equal(running.child.exitCode, 0);
    children.delete(running.child);
  }
  t.after(async () => {
    // The normal path uses the actual graceful helper. Cleanup is isolated to test children.
    for (const child of children) { child.kill(); if (child.exitCode === null) await once(child, 'exit'); }
    await rm(dataDir, { recursive: true, force: true });
  });
  let running = await start();
  let guest = await running.request('/api/join', { name: 'Neustartgast' });
  const seed = guest.world.seed;
  await running.request('/api/action', { token: guest.token, kind: 'cast', spell: 'bloom', x: 0, z: 40 });
  await running.request('/api/talk', { token: guest.token, npcId: 'npc-1', message: 'Unser Hain bleibt in Erinnerung.' });
  const remembered = (await running.request('/api/state')).npcs[0].memory;
  await running.request('/api/world', { token: guest.token, seed: 'Zweite dauerhafte Insel' });
  await stop(running);
  const instance1 = JSON.parse(await readFile(join(dataDir, 'server-instance.json'), 'utf8'));
  assert.equal(instance1.status, 'stopped');
  running = await start();
  assert.equal((await running.request('/api/state')).seed, 'Zweite dauerhafte Insel');
  guest = await running.request('/api/join', { name: 'Rückkehrgast' });
  const restored = (await running.request('/api/world', { token: guest.token, seed })).world;
  assert.deepEqual(restored.npcs[0].memory, remembered);
  assert.equal(restored.landmarks.filter(l => l.id.startsWith('grown-')).length, 1);
  const instance2 = JSON.parse(await readFile(join(dataDir, 'server-instance.json'), 'utf8'));
  assert.notEqual(instance2.instanceId, instance1.instanceId);
  // The old stop request remains on disk and must not stop the new instance.
  await new Promise(wait => setTimeout(wait, 400));
  assert.equal((await running.request('/api/health')).app, 'HALVETH Realms');
  await stop(running);
});

test('local curated summaries reach optional model as named context, with references and no world action', async t => {
  const nativeFetch = globalThis.fetch;
  let modelRequest;
  globalThis.fetch = async (url, init) => {
    if (url === 'http://127.0.0.1:11434/api/chat') {
      modelRequest = JSON.parse(init.body);
      return new Response(JSON.stringify({ message: { content: 'Wir können gemeinsam lernen.' } }), { status: 200 });
    }
    return nativeFetch(url, init);
  };
  t.after(() => { globalThis.fetch = nativeFetch; });
  const { request } = await fixture(t, { ollamaEnabled: true });
  const guest = (await request('/api/join', { name: 'Lerngast' })).data;
  const answer = await request('/api/talk', { token: guest.token, npcId: 'npc-1', message: 'Wie funktioniert Lernen im Lernportal?' });
  assert.equal(answer.status, 200);
  assert.equal(answer.data.source, 'ollama');
  assert.equal(answer.data.sourceRefs.length, 2);
  assert.ok(answer.data.sourceRefs.some(ref => ref.id === 'lernportal-access'));
  assert.ok(answer.data.sourceRefs.every(ref => ref.role === 'provided-context'));
  assert.match(modelRequest.messages[0].content, /keine Anweisungen/);
  assert.match(modelRequest.messages[0].content, /https:\/\/github.com/);
  assert.equal((await request('/api/state')).data.landmarks.length, guest.world.landmarks.length);
});
