// Offline proposals only: this script never edits the playable world or its code.
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createWorld, evolveWorld } from '../shared/world.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const seed = process.argv[2] || 'HALVETH · Morgenlicht';
const world = evolveWorld(createWorld(seed), 10);
const proposals = world.cultures.map(culture => ({
  id: `proposal-${culture.id}`,
  title: `${culture.name}: Ein gemeinsamer Ort`,
  state: 'Vorschlag',
  description: `${culture.members.length} freiwillige Mitglieder könnten ein öffentliches Projekt entwerfen. Die Entscheidung bleibt bei den Spielenden.`,
  choices: ['Garten gemeinsam pflegen', 'Sternenwissen sammeln', 'Eine offene Brücke bauen'],
  basis: { seedHash: createHash('sha256').update(seed).digest('hex'), simulatedEpoch: world.epoch, members: culture.members },
  appliesAutomatically: false,
}));
const output = { schema: 'halveth-realms-content-proposals-v1', seed, proposals,
  note: 'Deterministisch erzeugte lokale Spielideen. Kein Quellcode, kein Modellaufruf und keine automatische Übernahme.' };
const outputDir = resolve(root, '.local', 'proposals');
await mkdir(outputDir, { recursive: true });
const filename = resolve(outputDir, `${createHash('sha256').update(seed).digest('hex').slice(0, 20)}.json`);
await writeFile(filename, JSON.stringify(output, null, 2), 'utf8');
console.log(`Vorschläge gespeichert: ${filename}`);
