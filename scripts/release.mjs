import { readFile, readdir, mkdir, writeFile, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
const dirs=new Set(['public','shared','scripts','data','docs','tests','chain','.github']);
const roots=new Set(['README.md','LICENSE','THIRD-PARTY-NOTICES.md','CONTRIBUTING.md','API-CONTRACT.md','package.json','server.mjs','START.cmd','STOP.cmd','.gitignore','.gitattributes','BUILD-RESULT.json']);
const suffix=/\.(mjs|js|css|html|json|md|txt|svg|sol|yml|yaml|cmd)$/i;
const rows=[];
async function walk(path){
  for(const name of (await readdir(path)).sort()){
    const file=resolve(path,name),rel=relative(root,file).replaceAll('\\','/'),info=await lstat(file);
    if(info.isSymbolicLink())continue;
    if(info.isDirectory()){
      if(path===root?!dirs.has(name):['.local','node_modules','.git','releases'].includes(name))continue;
      await walk(file);
    }else if((path===root&&roots.has(name))||(path!==root&&suffix.test(name))){
      const data=await readFile(file);
      rows.push({path:rel,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),data});
    }
  }
}
await walk(root);
const manifest={name:pkg.name,version:pkg.version,license:pkg.license,scope:'SOURCE_AND_OWN_GAME_WITH_LICENSED_RENDERER_NO_RUNTIME_STATE',files:rows.map(({data,...record})=>record)};
rows.push({path:'SOURCE-MANIFEST.json',data:Buffer.from(JSON.stringify(manifest,null,2)+'\n')});
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function crc32(data){let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
const locals=[],centrals=[];let offset=0;
for(const row of rows){
  const name=Buffer.from(`HALVETH-Realms/${row.path}`),packed=deflateRawSync(row.data,{level:9}),crc=crc32(row.data);
  const head=Buffer.alloc(30);head.writeUInt32LE(0x04034b50);head.writeUInt16LE(20,4);head.writeUInt16LE(0x800,6);head.writeUInt16LE(8,8);head.writeUInt16LE(33,12);head.writeUInt32LE(crc,14);head.writeUInt32LE(packed.length,18);head.writeUInt32LE(row.data.length,22);head.writeUInt16LE(name.length,26);
  locals.push(head,name,packed);
  const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(0x800,8);central.writeUInt16LE(8,10);central.writeUInt16LE(33,14);central.writeUInt32LE(crc,16);central.writeUInt32LE(packed.length,20);central.writeUInt32LE(row.data.length,24);central.writeUInt16LE(name.length,28);central.writeUInt32LE(offset,42);
  centrals.push(central,name);offset+=head.length+name.length+packed.length;
}
const central=Buffer.concat(centrals),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(rows.length,8);end.writeUInt16LE(rows.length,10);end.writeUInt32LE(central.length,12);end.writeUInt32LE(offset,16);
const archive=Buffer.concat([...locals,central,end]);
const dir=resolve(root,'releases');await mkdir(dir,{recursive:true});
const filename=`HALVETH-Realms-${pkg.version}.zip`,path=resolve(dir,filename),sha256=createHash('sha256').update(archive).digest('hex');
await writeFile(path,archive);await writeFile(path+'.sha256',sha256+'  '+filename+'\n');
console.log(JSON.stringify({file:path,bytes:archive.length,sha256,files:rows.length},null,2));
