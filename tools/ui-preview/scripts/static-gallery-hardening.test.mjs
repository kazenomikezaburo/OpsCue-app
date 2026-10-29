import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import ts from 'typescript';
import {resolveSnapshotImport} from './snapshot-import-resolver.mjs';
import {inspectSnapshot} from './static-component-harness.mjs';
import {previewRoot,checkBoundary} from './check-boundary.mjs';
import {buildStaticGallery,inspectGallery,writeStaticGallery,validateMemoryGallery} from './generate-static-gallery.mjs';
const g=buildStaticGallery();
test('memory-only gallery contract',()=>assert.deepEqual(validateMemoryGallery(g),{ok:true,badges:3,cards:6,outputWritten:false}));
for(const [label,dir]of [
 ['ordinary',path.join(previewRoot,'.vite-cache/test-tmp/static-gallery-output-never-created')],
 ['outside',path.resolve(previewRoot,'../outside')],
 ['existing',path.join(previewRoot,'.vite-cache/static-gallery-output')],
 ['symlink-risk','synthetic-symlink-path'],['junction-risk','synthetic-junction-path'],
])test('unconditional refusal '+label,()=>{
 let accesses=0;const trap=new Proxy({}, {get(){accesses++;throw Error('must not access');}});
 assert.throws(()=>writeStaticGallery(dir,trap),/STATIC_GALLERY_OUTPUT_UNVERIFIED/);assert.equal(accesses,0);
});
test('writer AST consists only of the unconditional refusal',()=>{
 const source=fs.readFileSync(path.join(previewRoot,'scripts/generate-static-gallery.mjs'),'utf8');
 const ast=ts.createSourceFile('generator.mjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 const writer=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='writeStaticGallery');
 assert.equal(writer.body.statements.length,1);
 const refusal=writer.body.statements[0];assert.ok(ts.isThrowStatement(refusal));
 assert.ok(ts.isNewExpression(refusal.expression));
 assert.equal(refusal.expression.expression.text,'Error');
 assert.equal(refusal.expression.arguments[0].text,'STATIC_GALLERY_OUTPUT_UNVERIFIED');
});
test('mock junction swap cannot reach path resolution or writing',()=>{
 let resolutions=0,writes=0;
 const mockPath={toString(){resolutions++;return 'synthetic-redirected-path';}};
 assert.throws(()=>writeStaticGallery(mockPath,g,{write(){writes++;}}),/STATIC_GALLERY_OUTPUT_UNVERIFIED/);
 assert.equal(resolutions,0);assert.equal(writes,0);
});
test('caller supplied mock backend cannot authorize writing',()=>{
 let writes=0;assert.throws(()=>writeStaticGallery('synthetic',g,{verified:true,write(){writes++;}}),/STATIC_GALLERY_OUTPUT_UNVERIFIED/);assert.equal(writes,0);
});
for(const [label,sources,spec,expected]of [
 ['ts',{'src/a.ts':1},'./a','src/a.ts'],
 ['tsx',{'src/a.tsx':1},'./a','src/a.tsx'],
 ['explicit ts',{'src/a.ts':1,'src/a.tsx':1},'./a.ts','src/a.ts'],
 ['explicit tsx',{'src/a.ts':1,'src/a.tsx':1},'./a.tsx','src/a.tsx'],
 ['index',{'src/a/index.ts':1},'./a','src/a/index.ts'],
])test('shared resolution '+label,()=>assert.equal(resolveSnapshotImport(sources,'src/main.tsx',spec),expected));
for(const [label,sources,spec]of [
 ['ts tsx collision',{'src/a.ts':1,'src/a.tsx':1},'./a'],
 ['file index collision',{'src/a.ts':1,'src/a/index.ts':1},'./a'],
 ['missing',{},'./a'],['escape',{'app/page.ts':1},'../../app/page'],
 ['alias',{'src/a.ts':1},'@/a'],['query',{'src/a.ts':1},'./a.ts?x'],
])test('resolution refuses '+label,()=>assert.throws(()=>resolveSnapshotImport(sources,'src/main.tsx',spec)));
test('interpreter uses shared index resolution',()=>{
 const h=inspectSnapshot({'src/a/index.ts':'export const v="fixed";','src/main.ts':'import { v } from "./a"; export const result=v;'},()=>({ok:true}));
 assert.equal(h.load('src/main.ts').result,'fixed');
});
test('interpreter refuses ambiguous snapshot before selecting either module',()=>assert.throws(()=>inspectSnapshot({
 'src/a.ts':'export const v="ts";','src/a.tsx':'export const v="tsx";','src/main.ts':'import { v } from "./a";export const result=v;'
},()=>({ok:true})).load('src/main.ts')));
test('boundary explicit typed local resolution agrees',()=>assert.equal(checkBoundary().ok,true));
test('tools have canonical paths and exact hashes',()=>{
 for(const [key,record]of Object.entries(g.manifest.toolEvidence)){
  assert.equal(record.canonicalPath,path.join(previewRoot,key));
  assert.equal(record.sha256,crypto.createHash('sha256').update(fs.readFileSync(record.canonicalPath)).digest('hex'));
 }
 assert.ok(g.manifest.toolEvidence['scripts/snapshot-import-resolver.mjs']);
});
for(const [label,change]of [
 ['version',m=>m.schemaVersion=1],['method',m=>m.generationMethod='unknown'],
 ['tool hash',m=>m.toolEvidence['scripts/static-component-harness.mjs'].sha256='0'.repeat(64)],
 ['tool path',m=>m.toolEvidence['scripts/static-component-harness.mjs'].canonicalPath='synthetic'],
 ['missing tool',m=>delete m.toolEvidence['scripts/static-html-renderer.mjs']],
 ['input hash',m=>m.inputSha256['src/styles.css']='0'.repeat(64)],
 ['output hash',m=>m.outputSha256['index.html']='0'.repeat(64)],
])test('memory manifest refuses '+label,()=>{
 const manifest=structuredClone(g.manifest);change(manifest);assert.throws(()=>validateMemoryGallery({...g,manifest}));
});
for(const [label,old,replacement]of [
 ['badge class','pre-shift-badge--not-open','pre-shift-badge--confirmed'],
 ['badge label','受付前</span>','確認済み</span>'],
 ['badge extra child','id="badge-not-open">','id="badge-not-open"><p>extra</p>'],
 ['badge tag','<article id="badge-not-open">','<div id="badge-not-open">'],
 ['error role','role="alert"','role="status"'],
 ['missing error role',' role="alert"',''],
 ['empty paragraph','合成データによる空状態です。','different'],
 ['ready card class','class="next-shift-card"','class="other"'],
 ['date class','class="next-shift-date"','class="other"'],
 ['job unexpected element','<p>架空の展示準備</p>','<div>架空の展示準備</div>'],
 ['confirmation children','<p>前日確認</p>','<p>前日確認</p><p>extra</p>'],
 ['notice','Preview only。すべて合成データです。','Preview only。'],
 ['long project','架空のとても長いプロジェクト名','altered'],
 ['script','</body>','<script>synthetic</script></body>'],
 ['event','<body>','<body onclick="synthetic">'],
 ['external CSS','href="styles.css"','href="https://example.invalid/style.css"'],
])test('strict structure refuses '+label,()=>{
 assert.ok(g.html.includes(old));assert.throws(()=>inspectGallery(g.html.replace(old,replacement),g.css,g.examples));
});
test('existing historical output hashes unchanged by memory operations',()=>{
 const expected={'index.html':'bbf2d97599a24a6b781c1b66c016f0982ca6f0741a586447994258295fcc06a0','styles.css':'23a25360c6ea920db6ed79811a73552f99fb7931ed6ecd08e03a06ecc15fcc23','manifest.json':'01d0ba4cf62a7ee68c8bb6a8b33e439476c8c13a3f810db8ae62c7d02d3f8169'};
 for(const [name,hash]of Object.entries(expected))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(previewRoot,'.vite-cache/static-gallery-output',name))).digest('hex'),hash);
});
