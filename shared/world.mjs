// Original HALVETH Realms world rules. Browser-safe: no I/O, clock or dependencies.
export const WORLD_LIMIT = 220;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const rounded = n => Math.round(n * 1000) / 1000;

export function seedIntFromString(seed) {
  let hash = 2166136261;
  for (const ch of String(seed)) {
    hash ^= ch.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  return (hash ^ (hash >>> 13)) >>> 0;
}

function randomFor(seed, key) {
  return seedIntFromString(`${seed}:${key}`) / 4294967296;
}

export function terrainHeight(x, z, seedInt) {
  const p = (seedInt % 10007) / 977;
  const radius = Math.hypot(x, z);
  const island = 8.5 - Math.pow(radius / 100, 2) * 2.1;
  const waves = Math.sin(x * .025 + p) * 3.4 + Math.cos(z * .029 - p) * 2.8
    + Math.sin((x + z) * .049 + p) * 1.1;
  // Broad buildable terraces keep the start and settlements above the sea.
  const terraces = [[0, 0, 39, 9], [-85, 42, 30, 8], [84, 48, 30, 8], [2, -104, 33, 9]];
  let y = island + waves;
  for (const [cx, cz, r, height] of terraces) {
    const influence = clamp(1 - Math.hypot(x - cx, z - cz) / r, 0, 1);
    y += (Math.max(y, height) - y) * Math.sin(influence * Math.PI / 2);
  }
  return y;
}

const PEOPLE = [
  ['Nara', 'Sternenkartografin', 'curiosity'], ['Elion', 'Kristallforscher', 'curiosity'],
  ['Suri', 'Chronistin', 'curiosity'], ['Tarin', 'Brückenbauer', 'courage'],
  ['Mira', 'Gärtnerin', 'care'], ['Oren', 'Wasserhüter', 'care'],
  ['Liora', 'Heilerin', 'care'], ['Ren', 'Geschichtensammler', 'curiosity'],
  ['Anouk', 'Lichtweberin', 'care'], ['Vey', 'Wegfinder', 'courage'],
  ['Sela', 'Baumeisterin', 'courage'], ['Iven', 'Fährmann', 'courage'],
  ['Neris', 'Musikerin', 'care'], ['Amaro', 'Sternengärtner', 'curiosity'],
  ['Yara', 'Keramikerin', 'courage'], ['Noel', 'Bibliothekar', 'curiosity'],
  ['Mavi', 'Köchin', 'care'], ['Ari', 'Botenläufer', 'courage'],
];
const CULTURE_STYLE = {
  curiosity: ['Sternenleser', '#80e8f4'],
  care: ['Gemeinschaft des hellen Hains', '#8df2b1'],
  courage: ['Bund der offenen Wege', '#ffbe77'],
};

export function createWorld(seed) {
  if (typeof seed !== 'string' || !seed.trim() || seed.length > 160) throw new TypeError('Seed: 1–160 Zeichen.');
  const seedInt = seedIntFromString(seed);
  const landmarks = [
    { id: 'scarlet-citadel', name: 'Scharlachstadt', x: 0, z: 0, kind: 'citadel', color: '#ff557b' },
    { id: 'morning-harbor', name: 'Morgenhafen', x: -85, z: 42, kind: 'village', color: '#ffc777' },
    { id: 'light-village', name: 'Lichterrund', x: 84, z: 48, kind: 'village', color: '#78ecd9' },
    { id: 'star-village', name: 'Sternwacht', x: 2, z: -104, kind: 'village', color: '#b1a1ff' },
    { id: 'bright-grove', name: 'Heller Hain', x: -48, z: -40, kind: 'grove', color: '#82ffc8' },
    { id: 'cosmic-ruin', name: 'Kosmische Ruinen', x: 105, z: -64, kind: 'ruin', color: '#c5a5ff' },
  ];
  const homes = [[-9, 26], [11, 23], [-85, 42], [84, 48], [2, -104], [-48, -40]];
  const npcs = PEOPLE.map(([name, role, interest], i) => {
    const home = homes[i % homes.length];
    const angle = randomFor(seedInt, `home${i}`) * Math.PI * 2;
    const x = rounded(home[0] + Math.cos(angle) * (i < 2 ? 1 : 8));
    const z = rounded(home[1] + Math.sin(angle) * (i < 2 ? 1 : 8));
    const traits = Object.fromEntries(['curiosity', 'care', 'courage'].map(trait => [trait,
      rounded(trait === interest ? .71 + randomFor(seedInt, `${i}-${trait}`) * .23
        : .25 + randomFor(seedInt, `${i}-${trait}`) * .32)]));
    return { id: `npc-${i + 1}`, name, role, x, z, homeX: x, homeZ: z,
      color: CULTURE_STYLE[interest][1], culture: null, traits,
      // Fictional adults explicitly opt into a shared-interest guild; abstention remains possible.
      joinsGuilds: randomFor(seedInt, `consent${i}`) > .14,
      memory: [`${name} arbeitet als ${role} und lebt freiwillig in dieser Welt.`] };
  });
  return { seed, epoch: 0, revision: 0, terrain: { size: 480, seedInt }, landmarks,
    npcs, cultures: [], players: [], effects: [], recentEvents: [] };
}

function remember(npc, text) {
  npc.memory.push(text);
  if (npc.memory.length > 12) npc.memory.splice(0, npc.memory.length - 12);
}

export function evolveWorld(world, steps = 1) {
  if (!Number.isInteger(steps) || steps < 1 || steps > 10) throw new RangeError('1–10 Epochen pro Schritt.');
  for (let step = 0; step < steps; step++) {
    world.epoch += 1;
    for (const npc of world.npcs) {
      const angle = randomFor(world.terrain.seedInt, npc.id) * Math.PI * 2 + world.epoch * .075;
      npc.x = rounded(clamp(npc.homeX + Math.cos(angle) * 3.5, -WORLD_LIMIT, WORLD_LIMIT));
      npc.z = rounded(clamp(npc.homeZ + Math.sin(angle) * 3.5, -WORLD_LIMIT, WORLD_LIMIT));
    }
    if (world.epoch >= 3) {
      for (const [interest, [name, color]] of Object.entries(CULTURE_STYLE)) {
        const members = world.npcs.filter(npc => npc.joinsGuilds && npc.culture === null
          && Object.entries(npc.traits).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0] === interest)
          .map(npc => npc.id);
        if (members.length < 3) continue;
        const id = `guild-${interest}`;
        let culture = world.cultures.find(item => item.id === id);
        if (!culture) {
          culture = { id, name, color, members: [], formedAt: world.epoch };
          world.cultures.push(culture);
        }
        for (const id of members) {
          const npc = world.npcs.find(n => n.id === id);
          npc.culture = culture.id;
          culture.members.push(id);
          remember(npc, `Epoche ${world.epoch}: Ich trete aus eigenem Interesse ${name} bei.`);
        }
      }
    }
    world.revision += 1;
  }
  return world;
}
