import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const configuration = ['index.html','vite.config.ts','tsconfig.json','package.json','package-lock.json'];
const excluded = new Set(['dist','.vite-cache','node_modules','.git','.next']);
function inside(root,file) {
 const rel=path.relative(root,file);
 return rel==='' || (!path.isAbsolute(rel) && rel!=='..' && !rel.startsWith('..'+path.sep));
}
// Records bytes and canonical targets; does not execute configuration or source.
export function captureInputs(root) {
 root=path.resolve(root);
 const result={};
 function record(file) {
  const info=fs.lstatSync(file);
  if(info.isSymbolicLink() || fs.realpathSync(file)!==file || !info.isFile()) throw new Error('redirected input');
  const bytes=fs.readFileSync(file);
  const key=path.relative(root,file).split(path.sep).join('/');
  result[key]=Object.freeze({target:file,hash:crypto.createHash('sha256').update(bytes).digest('hex'),text:bytes.toString('utf8')});
 }
 function walk(dir) {
  if(fs.lstatSync(dir).isSymbolicLink() || fs.realpathSync(dir)!==dir)throw new Error('redirected directory');
  for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
   const file=path.join(dir,entry.name);
   if(entry.isSymbolicLink())throw new Error('redirected input');
   if(entry.isDirectory()) {
    if(excluded.has(entry.name))throw new Error('excluded source directory');
    walk(file);
   } else record(file);
  }
 }
 for(const name of configuration)record(path.join(root,name));
 walk(path.join(root,'src'));
 return Object.freeze(result);
}
export function validateSnapshot(root,snapshot,baseline) {
 root=path.resolve(root);
 function plain(value){if(!value || Object.getPrototypeOf(value)!==Object.prototype || Reflect.ownKeys(value).some(k=>typeof k!=='string') ||
 Object.values(Object.getOwnPropertyDescriptors(value)).some(d=>!d.enumerable || !Object.hasOwn(d,'value')))throw new Error('invalid snapshot structure');}
 function check(input){
  plain(input);const seen=new Set();
  for(const [key,item]of Object.entries(input)){
   plain(item);
   if(!configuration.includes(key) && (!key.startsWith('src/') || !/\.(?:ts|tsx|js|jsx|mjs|cjs|mts|cts|css)$/.test(key)))throw new Error('unknown snapshot entry');
   const target=path.resolve(root,key);
   if(key.includes('\\') || /[?#\0]/.test(key) || key!==path.relative(root,target).split(path.sep).join('/') ||
      !inside(root,target) || key.split('/').some(p=>excluded.has(p)))throw new Error('noncanonical snapshot key');
   const collision=process.platform==='win32'?target.toLowerCase():target;
   if(seen.has(collision))throw new Error('duplicate snapshot path');seen.add(collision);
   if(Object.keys(item).sort().join(',')!=='hash,target,text' || typeof item.text!=='string' ||
      typeof item.hash!=='string' || !/^[a-f0-9]{64}$/.test(item.hash) || item.target!==target ||
      crypto.createHash('sha256').update(Buffer.from(item.text,'utf8')).digest('hex')!==item.hash)throw new Error('snapshot content or target mismatch');
  }
 }
 check(snapshot);
 if(baseline!==undefined){
  check(baseline);const keys=Object.keys(snapshot).sort();
  if(JSON.stringify(keys)!==JSON.stringify(Object.keys(baseline).sort()))throw new Error('input membership changed');
  for(const key of keys){const a=snapshot[key],b=baseline[key];if(a.target!==b.target || a.hash!==b.hash || a.text!==b.text)throw new Error('input content or target changed');}
 }
 return true;
}

export function verifyInputs(root,snapshot) {
 const current=captureInputs(root);
 validateSnapshot(root,snapshot,current);
 return true;
}
export function assertLocalResolution(root,snapshot,resolved,expected) {
 root=path.resolve(root);
 if(!path.isAbsolute(resolved) || !inside(root,resolved) || /[?#\0]/.test(resolved))throw new Error('opaque resolution');
 const key=path.relative(root,resolved).split(path.sep).join('/');
 if(!Object.hasOwn(snapshot,key) || snapshot[key].target!==resolved || resolved!==expected)throw new Error('uninspected or divergent resolution');
 return snapshot[key].text;
}
// This is not a Vite load hook. Before/after checks cannot prevent transient swaps.
