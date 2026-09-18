import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAnchorIntent } from '../shared/anchor.mjs';

const usage = 'node scripts/anchor-intent.mjs --input <export.json> --chain-id <positive Zahl> --contract-address <0xAdresse> --output <neuer Pfad.json>';
export async function runAnchorCli(args) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) return usage;
  const allowed = ['--input', '--chain-id', '--contract-address', '--output'];
  const values = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!allowed.includes(args[i]) || values[args[i]] !== undefined || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(usage);
    values[args[i]] = args[i + 1];
  }
  if (allowed.some(key => !values[key])) throw new Error(usage);
  if (!/^[1-9]\d*$/.test(values['--chain-id'])) throw new Error('Chain-ID muss eine ausdrücklich gewählte positive Ganzzahl sein.');
  const inputPath = resolve(values['--input']);
  const outputPath = resolve(values['--output']);
  const info = await stat(inputPath);
  if (!info.isFile() || info.size > 2_000_000) throw new Error('Eingabe muss eine JSON-Datei mit höchstens 2 MB sein.');
  const checkpoint = JSON.parse(await readFile(inputPath, 'utf8'));
  const intent = await createAnchorIntent(checkpoint, { chainId: Number(values['--chain-id']), contractAddress: values['--contract-address'] });
  await mkdir(dirname(outputPath), { recursive: true });
  try { await writeFile(outputPath, JSON.stringify(intent, null, 2) + '\n', { encoding: 'utf8', flag: 'wx', mode: 0o600 }); }
  catch (error) { if (error.code === 'EEXIST') throw new Error('Ausgabedatei existiert bereits. Bitte einen neuen Pfad wählen; vorhandene Dateien bleiben erhalten.'); throw error; }
  return `UNSENT: ${outputPath}\nExport geprüft. Keine Transaktion signiert oder gesendet.`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(await runAnchorCli(process.argv.slice(2))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
