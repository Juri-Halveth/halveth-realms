// Optional offline adapter. No RPC, wallet, key handling, filesystem or transaction submission.
const HEX256 = /^[0-9a-f]{64}$/;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const encoder = new TextEncoder();
const ZERO_HASH = '0'.repeat(64);

export const WORLD_ANCHOR_COMPILER = Object.freeze({
  compiler: '0.8.30+commit.73712a01.Emscripten.clang',
  sourceSha256: 'c6c99ee70ccdef8bbc78e29d07cca386ba8f2c9957cbea9edabd62c6690395ae',
  evmVersion: 'paris',
  signature: 'anchor(string,bytes32,uint64)',
  // Taken from solc output evm.methodIdentifiers; not from NIST SHA3-256.
  methodSelector: '0xb5581648',
});

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
async function sha256(value) {
  const data = encoder.encode(canonical(value));
  const hash = await globalThis.crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
function requireValue(condition, message) { if (!condition) throw new TypeError(message); }

export async function verifyCheckpoint(checkpoint) {
  requireValue(checkpoint !== null && typeof checkpoint === 'object' && !Array.isArray(checkpoint), 'Ein Welt-Export ist erforderlich.');
  requireValue(encoder.encode(JSON.stringify(checkpoint)).length <= 2_000_000, 'Der Welt-Export überschreitet 2 MB.');
  requireValue(checkpoint.schema === 'halveth-realms-checkpoint-v1', 'Unbekanntes Checkpoint-Schema.');
  const { world, events, ledgerHead, checkpointHash } = checkpoint;
  requireValue(world && typeof world.worldId === 'string' && /^realm-[0-9a-f]{20}$/.test(world.worldId), 'Die Welt-ID ist ungültig.');
  requireValue(Number.isSafeInteger(world.epoch) && world.epoch >= 0, 'Die Epoche ist ungültig.');
  requireValue(HEX256.test(checkpointHash) && checkpointHash !== ZERO_HASH, 'Der Checkpoint-Hash ist ungültig.');
  requireValue(HEX256.test(ledgerHead) && world.ledgerHead === ledgerHead, 'Der Ledger-Kopf ist ungültig.');
  requireValue(Array.isArray(events) && events.length > 0 && events.length <= 1024, 'Der Export benötigt 1–1024 gebundene Ereignisse.');
  requireValue(HEX256.test(checkpoint.ledgerBase), 'Die Basis der exportierten Ereigniskette fehlt.');
  const bound = { schema: checkpoint.schema, world, events, ledgerHead };
  requireValue(await sha256(bound) === checkpointHash, 'Checkpoint-Hash passt nicht zu den Exportdaten.');
  let previousHash = checkpoint.ledgerBase;
  for (const event of events) {
    requireValue(event && typeof event === 'object' && HEX256.test(event.hash), 'Ungültiger Ereignis-Hash.');
    const { hash, ...content } = event;
    requireValue(content.previousHash === previousHash, 'Die exportierte Ereigniskette ist unterbrochen.');
    requireValue(await sha256(content) === hash, 'Ereignis-Hash passt nicht zu seinem Inhalt.');
    previousHash = hash;
  }
  requireValue(previousHash === ledgerHead, 'Der Ledger-Kopf passt nicht zum letzten Ereignis.');
  return Object.freeze({ worldId: world.worldId, checkpointHash, epoch: world.epoch, ledgerHead,
    checkedEventCount: events.length, historyBeforeLedgerBaseIncluded: checkpoint.ledgerBase === ZERO_HASH });
}

export async function createAnchorIntent(checkpoint, destination) {
  requireValue(destination !== null && typeof destination === 'object' && !Array.isArray(destination), 'Konkrete Chain-ID und Vertragsadresse sind erforderlich.');
  requireValue(Object.keys(destination).every(key => ['chainId', 'contractAddress'].includes(key)), 'Erlaubte Zielangaben sind ausschließlich chainId und contractAddress.');
  const { chainId, contractAddress } = destination;
  requireValue(Number.isSafeInteger(chainId) && chainId > 0, 'chainId muss eine ausdrücklich gewählte positive Ganzzahl sein.');
  requireValue(typeof contractAddress === 'string' && ADDRESS.test(contractAddress) && !/^0x0{40}$/i.test(contractAddress), 'Eine konkrete, von Null verschiedene EVM-Vertragsadresse ist erforderlich.');
  const verified = await verifyCheckpoint(checkpoint);
  return {
    schema: 'halveth-realms-anchor-intent-v1',
    status: 'UNSENT',
    chainId,
    contractAddress,
    worldId: verified.worldId,
    checkpointHash: verified.checkpointHash,
    epoch: verified.epoch,
    call: { signature: WORLD_ANCHOR_COMPILER.signature,
      arguments: [verified.worldId, `0x${verified.checkpointHash}`, String(verified.epoch)] },
    verification: { exportHash: 'MATCH', exportedEventChain: 'MATCH', checkedEventCount: verified.checkedEventCount,
      historyBeforeLedgerBaseIncluded: verified.historyBeforeLedgerBaseIncluded,
      contractAtAddress: 'NOT_CHECKED', chainConnection: 'NOT_REQUESTED' },
    transaction: null,
    signature: null,
    receipt: null,
    note: 'Transportneutraler lokaler Vorschlag. Nicht signiert, nicht gesendet, keine On-Chain-Bestätigung.',
  };
}
