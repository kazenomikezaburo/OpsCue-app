import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { checkBoundary, previewRoot } from './check-boundary.mjs';
import { captureInputs,verifyInputs,assertLocalResolution } from './build-input-boundary.mjs';
const sample=fs.readFileSync(path.join(previewRoot,'src/PreviewApp.tsx'),'utf8');
const key='tools/ui-preview/src/PreviewApp.tsx';
test('existing local dependency chain, CSS and React pass',()=>assert.equal(checkBoundary().ok,true));
for(const spec of ['./dist/Hidden.tsx','./.vite-cache/Hidden.tsx','./node_modules/Hidden.tsx','./.next/Hidden.tsx','./.git/Hidden.tsx','./absent','../../../../app/page','./fixtures/sample.json','virtual:synthetic','@unknown']) {
 test('refuse local dependency '+spec,()=>assert.equal(checkBoundary({[key]:'import type { Hidden } from '+JSON.stringify(spec)+';\n'+sample}).ok,false));
}
test('uninspected snapshot rejected',()=>assert.equal(checkBoundary({'tools/ui-preview/src/dist/Hidden.tsx':'export const hidden=1;'}).ok,false));
for(const source of ['export * from "./dist/Hidden";','import("./fixtures/sample");','require("./fixtures/sample");']) {
 test('refuse export or runtime loading '+source,()=>assert.equal(checkBoundary({[key]:source+'\n'+sample}).ok,false));
}
function fixture(run) {
 const dir=fs.mkdtempSync(path.join(previewRoot,'.vite-cache/test-tmp/input-'));
 try {
  fs.mkdirSync(path.join(dir,'src'));
  for(const name of ['index.html','vite.config.ts','tsconfig.json','package.json','package-lock.json'])fs.writeFileSync(path.join(dir,name),'synthetic');
  fs.writeFileSync(path.join(dir,'src/a.ts'),'export const value="synthetic";');
  run(dir,captureInputs(dir));
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
}
test('unchanged bytes and membership pass',()=>fixture((dir,s)=>assert.equal(verifyInputs(dir,s),true)));
test('file changed rejected',()=>fixture((dir,s)=>{fs.writeFileSync(path.join(dir,'src/a.ts'),'changed');assert.throws(()=>verifyInputs(dir,s));}));
test('file added rejected',()=>fixture((dir,s)=>{fs.writeFileSync(path.join(dir,'src/b.ts'),'synthetic');assert.throws(()=>verifyInputs(dir,s));}));
test('file deleted rejected',()=>fixture((dir,s)=>{fs.unlinkSync(path.join(dir,'src/a.ts'));assert.throws(()=>verifyInputs(dir,s));}));
test('excluded directory rejected',()=>fixture((dir,s)=>{fs.mkdirSync(path.join(dir,'src/dist'));assert.throws(()=>verifyInputs(dir,s));}));
test('resolved target mismatch rejected',()=>fixture((dir,s)=>assert.throws(()=>assertLocalResolution(dir,s,path.join(dir,'src/a.ts'),path.join(dir,'src/b.ts')))));
test('manifest resolver returns inspected text',()=>fixture((dir,s)=>assert.equal(assertLocalResolution(dir,s,path.join(dir,'src/a.ts'),path.join(dir,'src/a.ts')),'export const value="synthetic";')));
test('virtual target rejected',()=>fixture((dir,s)=>assert.throws(()=>assertLocalResolution(dir,s,'\0virtual:synthetic','\0virtual:synthetic'))));
test('uninspected target rejected',()=>fixture((dir,s)=>assert.throws(()=>assertLocalResolution(dir,s,path.join(dir,'src/b.ts'),path.join(dir,'src/b.ts')))));
test('directory symlink outside root rejected without execution',()=>fixture((dir,s)=>{
 // Windows directory junction creation needs no file-symlink privilege.
 fs.mkdirSync(path.join(dir,'outside'));
 fs.symlinkSync(path.join(dir,'outside'),path.join(dir,'src/link'),process.platform==='win32'?'junction':'dir');
 assert.throws(()=>verifyInputs(dir,s));
}));

test('noncanonical inspection key rejected',()=>assert.equal(checkBoundary({
 'tools/ui-preview/src/fixtures/../fixtures/sample.ts':'export const sample={};',
}).ok,false));