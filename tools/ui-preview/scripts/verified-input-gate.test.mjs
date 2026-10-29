import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { previewRoot } from './check-boundary.mjs';
import { createVerifiedInputGate } from './verified-input-gate.mjs';
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
const record=(key,text)=>({target:path.join(previewRoot,key),text,hash:hash(text)});
const fixture={
 'src/a.tsx':record('src/a.tsx','export const value="synthetic";'),
 'src/b.ts':record('src/b.ts','export const data="synthetic";'),
 'src/styles.css':record('src/styles.css','body { color: black; }'),
 'index.html':record('index.html','<!doctype html><html></html>'),
};
const a=path.join(previewRoot,'src/a.tsx'), b=path.join(previewRoot,'src/b.ts');
const gate=()=>createVerifiedInputGate(previewRoot,fixture);
test('frozen inspected TSX load',()=>assert.equal(gate().load(a),fixture['src/a.tsx'].text));
test('frozen inspected CSS load',()=>assert.equal(gate().load(path.join(previewRoot,'src/styles.css')),fixture['src/styles.css'].text));
test('inspected local resolver matches',()=>assert.equal(gate().resolve('./b',a,b),b));
test('transform inspected dependency accepted',()=>assert.equal(gate().transformed('import { data } from "./b";',a,{'./b':b}),true));
for(const id of ['src/unknown.tsx','src/dist/Hidden.tsx','src/.vite-cache/Hidden.tsx','src/unknown.css','src/image.png','../outside.ts']) {
 test('reject unknown input '+id,()=>assert.throws(()=>gate().load(path.join(previewRoot,id))));
}
for(const spec of ['react-dom/server','react/jsx-runtime','virtual:unknown','@alias/value']) {
 test('no automatic package/virtual/alias approval '+spec,()=>assert.throws(()=>gate().resolve(spec,a,b)));
}
test('plugin-added input rejected',()=>assert.throws(()=>gate().load('\0plugin-generated')));
test('different resolved target rejected',()=>assert.throws(()=>gate().resolve('./b',a,a)));
test('transform-added uninspected import rejected',()=>assert.throws(()=>gate().transformed('import "./unknown";',a)));
test('transform-added dynamic dependency rejected',()=>assert.throws(()=>gate().transformed('import("./b");',a)));
test('transform-added require rejected',()=>assert.throws(()=>gate().transformed('require("./b");',a)));
test('changed snapshot hash rejected',()=>assert.throws(()=>createVerifiedInputGate(previewRoot,{...fixture,'src/a.tsx':{...fixture['src/a.tsx'],text:'changed'}})));
test('snapshot mutation cannot replace loaded content',()=>{
 const input={...fixture,'src/a.tsx':{...fixture['src/a.tsx']}};
 const g=createVerifiedInputGate(previewRoot,input);input['src/a.tsx'].text='changed';delete input['src/b.ts'];
 assert.equal(g.load(a),fixture['src/a.tsx'].text);assert.equal(g.load(b),fixture['src/b.ts'].text);
});
test('snapshot target substitution rejected',()=>assert.throws(()=>createVerifiedInputGate(previewRoot,{...fixture,'src/b.ts':{...fixture['src/b.ts'],target:a}})));
test('HTML transform not silently approved',()=>assert.throws(()=>gate().transformed('synthetic',path.join(previewRoot,'index.html'))));
test('CSS transform not silently approved',()=>assert.throws(()=>gate().transformed('synthetic',path.join(previewRoot,'src/styles.css'))));
test('ambiguous extension resolution rejected',()=>{
 const g=createVerifiedInputGate(previewRoot,{...fixture,'src/b.tsx':record('src/b.tsx','export const data="synthetic";')});
 assert.throws(()=>g.resolve('./b',a,b));
});
test('real UI component snapshots load without source execution',()=>{
 for(const key of ['src/components/PreviewPreShiftStatusBadge.tsx','src/components/PreviewNextShiftCard.tsx']) {
  const text=fs.readFileSync(path.join(previewRoot,key),'utf8');
  assert.equal(createVerifiedInputGate(previewRoot,{[key]:record(key,text)}).load(path.join(previewRoot,key)),text);
 }
});
test('real build entry refuses before Vite import',()=>{
 const env={};for(const key of ['SystemRoot','WINDIR','TEMP','TMP'])if(process.env[key])env[key]=process.env[key];
 const r=spawnSync(process.execPath,[path.join(previewRoot,'scripts/check-build-input.mjs')],{env,cwd:previewRoot,encoding:'utf8',timeout:30000});
 assert.equal(r.error,undefined);assert.equal(r.status,1);assert.match(r.stderr,/PREVIEW_BUILD_INPUT_UNVERIFIED/);
});
