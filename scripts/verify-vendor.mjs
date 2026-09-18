import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const dir=resolve(dirname(fileURLToPath(import.meta.url)),'../public/vendor');
const manifest=JSON.parse(await readFile(resolve(dir,'manifest.json'),'utf8'));
if(manifest.name!=='three'||manifest.version!=='0.180.0')throw Error('Unexpected renderer version.');
for(const [name,expected]of Object.entries(manifest.files)){
  if(!['three.module.js','three.core.js','THREE-LICENSE.txt'].includes(name))throw Error('Unexpected vendor entry.');
  const bytes=await readFile(resolve(dir,name));
  if(bytes.length!==expected.bytes||createHash('sha256').update(bytes).digest('hex')!==expected.sha256)throw Error('Renderer file mismatch: '+name);
}
console.log('Three.js 0.180.0: all three vendored files match the pinned manifest.');
