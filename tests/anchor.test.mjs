import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameServer, canonical } from '../server.mjs';
import { createAnchorIntent, verifyCheckpoint, WORLD_ANCHOR_COMPILER } from '../shared/anchor.mjs';
import { runAnchorCli } from '../scripts/anchor-intent.mjs';

const hash = value => createHash('sha256').update(canonical(value)).digest('hex');
// Synthetic destination used only as local JSON; no claim about a deployed contract.
const destination = { chainId: 31337, contractAddress: '0x1111111111111111111111111111111111111111' };
async function sample(t) {
  const dataDir = await mkdtemp(join(tmpdir(), 'halveth-anchor-test-'));
  const game = await createGameServer({ dataDir, seed: 'Checkpoint-Test', port: 0, autoTickMs: 0, clock: () => 12345678 });
  const { url } = await game.start();
  t.after(async () => { await game.close(); await rm(dataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); });
  const response = await fetch(url + '/api/export');
  return response.json();
}

test('real server export becomes a deterministic unsigned intent without leaking world contents', async t => {
  const checkpoint = await sample(t);
  const verified = await verifyCheckpoint(checkpoint);
  const intent = await createAnchorIntent(checkpoint, destination);
  assert.equal(intent.status, 'UNSENT');
  assert.equal(intent.chainId, 31337);
  assert.equal(intent.contractAddress, destination.contractAddress);
  assert.equal(intent.worldId, checkpoint.world.worldId);
  assert.equal(intent.checkpointHash, checkpoint.checkpointHash);
  assert.deepEqual(intent.call.arguments, [checkpoint.world.worldId, `0x${checkpoint.checkpointHash}`, '0']);
  assert.equal(intent.transaction, null);
  assert.equal(intent.signature, null);
  assert.equal(intent.receipt, null);
  assert.equal(verified.historyBeforeLedgerBaseIncluded, true);
  const encoded = JSON.stringify(intent);
  assert.ok(!encoded.includes(checkpoint.world.seed));
  assert.ok(!encoded.includes('npc-1'));
  assert.ok(!encoded.includes('calldata'));
  assert.deepEqual(await createAnchorIntent(checkpoint, destination), intent);
});

test('modified checkpoint, event contents, chain link and destination are rejected', async t => {
  const checkpoint = await sample(t);
  const modified = structuredClone(checkpoint);
  modified.world.epoch += 1;
  await assert.rejects(createAnchorIntent(modified, destination), /Checkpoint-Hash/);
  const alteredEvent = structuredClone(checkpoint);
  alteredEvent.events[0].text = 'Different history';
  alteredEvent.checkpointHash = hash({ schema: alteredEvent.schema, world: alteredEvent.world, events: alteredEvent.events, ledgerHead: alteredEvent.ledgerHead });
  await assert.rejects(createAnchorIntent(alteredEvent, destination), /Ereignis-Hash/);
  const wrongBase = structuredClone(checkpoint);
  wrongBase.ledgerBase = '1'.repeat(64);
  await assert.rejects(createAnchorIntent(wrongBase, destination), /unterbrochen/);
  for (const target of [undefined, {}, { chainId: -1, contractAddress: destination.contractAddress },
    { chainId: 1, contractAddress: '0x' + '0'.repeat(40) }, { chainId: 1, contractAddress: 'YOUR_ADDRESS' },
    { ...destination, privateKey: 'not-accepted' }, { ...destination, recoveryPhrase: 'not-accepted' }]) {
    await assert.rejects(createAnchorIntent(checkpoint, target));
  }
});

test('a bounded export states when earlier history is absent', async t => {
  const checkpoint = await sample(t);
  const event = checkpoint.events[0];
  event.previousHash = '2'.repeat(64);
  const { hash: ignored, ...content } = event;
  event.hash = hash(content);
  checkpoint.ledgerBase = event.previousHash;
  checkpoint.ledgerHead = event.hash;
  checkpoint.world.ledgerHead = event.hash;
  checkpoint.checkpointHash = hash({ schema: checkpoint.schema, world: checkpoint.world, events: checkpoint.events, ledgerHead: checkpoint.ledgerHead });
  const intent = await createAnchorIntent(checkpoint, destination);
  assert.equal(intent.verification.historyBeforeLedgerBaseIncluded, false);
  assert.equal(intent.verification.checkedEventCount, 1);
});

test('compiler metadata remains bound to the exact contract source used in the recorded compilation', async () => {
  const source = await readFile(new URL('../chain/WorldAnchor.sol', import.meta.url));
  assert.equal(createHash('sha256').update(source).digest('hex'), WORLD_ANCHOR_COMPILER.sourceSha256);
  assert.equal(WORLD_ANCHOR_COMPILER.signature, 'anchor(string,bytes32,uint64)');
  assert.equal(WORLD_ANCHOR_COMPILER.methodSelector, '0xb5581648');
});

test('user CLI writes a verified UNSENT artifact and refuses to replace an existing file', async t => {
  const checkpoint = await sample(t);
  const dir = await mkdtemp(join(tmpdir(), 'halveth-anchor-cli-'));
  t.after(() => rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }));
  const input = join(dir, 'export.json'), output = join(dir, 'intent.json');
  await writeFile(input, JSON.stringify(checkpoint));
  const args = ['--input', input, '--chain-id', '31337', '--contract-address', destination.contractAddress, '--output', output];
  assert.match(await runAnchorCli(args), /^UNSENT:/);
  const original = await readFile(output, 'utf8');
  assert.equal(JSON.parse(original).status, 'UNSENT');
  await assert.rejects(runAnchorCli(args), /existiert bereits/);
  assert.equal(await readFile(output, 'utf8'), original);
  await assert.rejects(runAnchorCli(['--input', input]), /chain-id/);
});
