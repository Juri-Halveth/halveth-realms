import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, evolveWorld, terrainHeight, seedIntFromString } from '../shared/world.mjs';

test('seed and action sequence reproduce terrain, people and emerging guilds', () => {
  const a = createWorld('Sterne über dem Hain 🌿');
  const b = createWorld('Sterne über dem Hain 🌿');
  assert.deepEqual(a, b);
  evolveWorld(a, 5); evolveWorld(b, 1); evolveWorld(b, 1); evolveWorld(b, 1); evolveWorld(b, 1); evolveWorld(b, 1);
  assert.deepEqual(a, b);
  assert.notEqual(a.terrain.seedInt, createWorld('Andere Sterne').terrain.seedInt);
  assert.notDeepEqual(a.npcs.map(n => n.traits), createWorld('Andere Sterne').npcs.map(n => n.traits));
  assert.ok(a.cultures.length >= 1);
});

test('guilds contain only willing NPCs sharing their leading interest', () => {
  const world = createWorld('Freie Zusammenarbeit');
  world.npcs[0].joinsGuilds = false;
  evolveWorld(world, 10);
  const seen = new Set();
  for (const guild of world.cultures) {
    assert.ok(guild.members.length >= 3);
    for (const id of guild.members) {
      assert.ok(!seen.has(id)); seen.add(id);
      const npc = world.npcs.find(n => n.id === id);
      assert.equal(npc.joinsGuilds, true);
      assert.equal(npc.culture, guild.id);
      const leading = Object.entries(npc.traits).sort((a, b) => b[1] - a[1])[0][0];
      assert.equal(guild.id, `guild-${leading}`);
    }
  }
  assert.equal(world.npcs[0].culture, null);
});

test('land and bounded evolution remain usable for long play', () => {
  for (const seed of ['HALVETH · Morgenlicht', 'Test', 'Sternenmeer', '🌿']) {
    const world = createWorld(seed);
    assert.ok(terrainHeight(0, 36, world.terrain.seedInt) > 3);
    for (const landmark of world.landmarks.filter(l => ['village', 'citadel'].includes(l.kind))) {
      assert.ok(terrainHeight(landmark.x, landmark.z, world.terrain.seedInt) >= 8 - 1e-10);
    }
    for (let i = 0; i < 200; i++) evolveWorld(world, 10);
    assert.ok(world.npcs.every(n => Math.abs(n.x) <= 220 && Math.abs(n.z) <= 220 && n.memory.length <= 12));
    assert.ok(world.cultures.length <= 3);
    for (let x = -240; x <= 240; x += 30) for (let z = -240; z <= 240; z += 30) assert.ok(Number.isFinite(terrainHeight(x, z, world.terrain.seedInt)));
  }
  assert.throws(() => evolveWorld(createWorld('A'), 100));
  assert.throws(() => createWorld(''));
  assert.equal(seedIntFromString('A'), seedIntFromString('A'));
});
