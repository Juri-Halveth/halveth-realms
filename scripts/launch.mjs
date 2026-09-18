import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, openSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.REALMS_PORT||18770);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('PORT must be 1024..65535.');
const url=`http://127.0.0.1:${port}`;
async function health(){try{const r=await fetch(url+'/api/health',{signal:AbortSignal.timeout(1000)});return r.ok?await r.json():null}catch{return null}}
let status=await health();
if(status && status.app !== 'HALVETH Realms')throw new Error('This port belongs to another application.');
if(!status){
  mkdirSync(join(root,'.local'),{recursive:true});
  const log=openSync(join(root,'.local','server.log'),'a');
  const environment={...process.env};
  if(environment.REALMS_OLLAMA===undefined && !process.argv.includes('--offline')){
    try{
      const r=await fetch('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(1000)});
      const tags=await r.json();
      if(tags.models?.some(m=>m.name==='hermes3:8b'))environment.REALMS_OLLAMA='1';
    }catch{/* The procedural game and local persona replies remain available. */}
  }
  if(process.argv.includes('--offline'))environment.REALMS_OLLAMA='0';
  const child=spawn(process.execPath,[join(root,'server.mjs')],{cwd:root,env:environment,detached:true,windowsHide:true,stdio:['ignore',log,log]});
  child.unref();writeFileSync(join(root,'.local','server.pid'),String(child.pid));
  for(let i=0;i<40&&!status;i++){await new Promise(r=>setTimeout(r,250));status=await health()}
  if(!status)throw new Error('Server did not start. See .local/server.log.');
}
console.log(`HALVETH Realms: ${url}`);
if(!process.argv.includes('--no-browser')){
  let command,args;
  if(process.platform==='win32'){
    const chrome=[process.env.PROGRAMFILES,process.env['PROGRAMFILES(X86)'],process.env.LOCALAPPDATA].filter(Boolean).map(p=>join(p,'Google/Chrome/Application/chrome.exe')).find(existsSync);
    command=chrome||'rundll32.exe';args=chrome?[url]:['url.dll,FileProtocolHandler',url];
  }else{command=process.platform==='darwin'?'open':'xdg-open';args=[url]}
  const browser=spawn(command,args,{detached:true,stdio:'ignore',windowsHide:true});
  browser.on('error',()=>console.log('Open this address in your browser: '+url));browser.unref();
}
