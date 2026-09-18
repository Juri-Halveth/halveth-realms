import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = resolve(process.env.REALMS_DATA_DIR || resolve(root, '.local'));
const instancePath = resolve(dataDir, 'server-instance.json');
async function main() {
  let instance;
  try { instance = JSON.parse(await readFile(instancePath, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') throw new Error('Keine steuerbare Serverinstanz gefunden. Ein älterer Server muss zunächst über seinen bisherigen Startweg beendet werden.'); throw error; }
  if (instance.app !== 'HALVETH Realms' || !/^[0-9a-f]{48}$/.test(instance.instanceId)
    || !Number.isInteger(instance.pid) || instance.pid < 1 || !Number.isInteger(instance.port) || instance.port < 1 || instance.port > 65535
    || !['127.0.0.1', '::1', 'localhost'].includes(instance.host)) throw new Error('Die lokale Instanzdatei ist ungültig; kein Prozess wird beendet.');
  if (instance.status === 'stopped') { console.log('HALVETH Realms ist bereits gespeichert und beendet.'); return; }
  if (instance.status !== 'running') throw new Error('Unbekannter Serverstatus; keine Stopanforderung geschrieben.');
  const host = instance.host.includes(':') ? `[${instance.host}]` : instance.host;
  const url = `http://${host}:${instance.port}/api/health`;
  const health = async () => {
    try { const response = await fetch(url, { signal: AbortSignal.timeout(1000) }); return response.ok ? await response.json() : null; }
    catch { return null; }
  };
  const current = await health();
  if (!current) { console.log('An dieser Adresse läuft kein erreichbarer Spielserver. Es wurde kein Prozess beendet.'); return; }
  if (current.app !== 'HALVETH Realms') throw new Error('Die Adresse gehört einer anderen Anwendung; keine Stopanforderung geschrieben.');
  const target = resolve(dataDir, 'stop-request.json');
  const temporary = `${target}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify({ action: 'stop', instanceId: instance.instanceId, pid: instance.pid, requestedAt: new Date().toISOString() }));
  await rename(temporary, target);
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    await new Promise(resolveWait => setTimeout(resolveWait, 250));
    const status = JSON.parse(await readFile(instancePath, 'utf8'));
    if (status.instanceId !== instance.instanceId) throw new Error('Inzwischen läuft eine neue Instanz. Sie wird nicht beendet.');
    if (status.status === 'stopped' && !await health()) { console.log('HALVETH Realms: Welt gespeichert, Server beendet.'); return; }
  }
  throw new Error('Der Server hat das geordnete Beenden noch nicht bestätigt. Keine erzwungene Prozessbeendigung; siehe .local/server.log.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
