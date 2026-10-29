import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {buildStaticGallery,validateMemoryGallery,inspectGallery} from './generate-static-gallery.mjs';
import {validateSnapshot,verifyInputs} from './build-input-boundary.mjs';
import {assertGalleryImports} from './snapshot-import-resolver.mjs';
import {previewRoot} from './check-boundary.mjs';
const g=buildStaticGallery(), baseline=structuredClone(g.snapshot);
const sha=t=>crypto.createHash('sha256').update(Buffer.from(t,'utf8')).digest('hex');
test('standalone validation accepts fixed complete baseline',()=>assert.equal(validateMemoryGallery(g,{baseline}).ok,true));
for(const [label,change]of [
 ['CSS text only',s=>s['src/styles.css'].text+='\np {color:red;}'],
 ['TSX text only',s=>s['src/components/PreviewNextShiftCard.tsx'].text+='\n// changed'],
 ['text and hash together',s=>{s['src/styles.css'].text+='\np {color:red;}';s['src/styles.css'].hash=sha(s['src/styles.css'].text);}],
 ['target',s=>s['src/styles.css'].target=previewRoot+'/other.css'],
 ['noncanonical key',s=>{s['src/fixtures/../styles.css']=s['src/styles.css'];delete s['src/styles.css'];}],
 ['extra input',s=>s['src/extra.ts']={target:previewRoot+'/src/extra.ts',text:'export const x=1;',hash:sha('export const x=1;')}],
 ['missing input',s=>delete s['src/styles.css']],
 ['case collision',s=>s['src/Styles.css']={...s['src/styles.css'],target:previewRoot+'/src/Styles.css'}],
 ['text type',s=>s['src/styles.css'].text=1],
 ['hash format',s=>s['src/styles.css'].hash='invalid'],
 ['extra record field',s=>s['src/styles.css'].unknown='x'],
 ['unknown extension',s=>s['src/a.json']={target:previewRoot+'/src/a.json',text:'{}',hash:sha('{}')}],
])test('snapshot refuses '+label,()=>{
 const snapshot=structuredClone(baseline);change(snapshot);
 assert.throws(()=>validateMemoryGallery({...g,snapshot},{baseline}));
 assert.throws(()=>verifyInputs(previewRoot,snapshot));
});
test('duplicate-entry array refused instead of silently collapsing',()=>assert.throws(()=>validateSnapshot(previewRoot,[['src/styles.css',baseline['src/styles.css']],['src/styles.css',baseline['src/styles.css']]])));
test('text hash equality alone does not establish trusted baseline equality',()=>{
 const s=structuredClone(baseline);s['src/styles.css'].text+='\np {color:red;}';s['src/styles.css'].hash=sha(s['src/styles.css'].text);
 assert.equal(validateSnapshot(previewRoot,s),true);
 assert.throws(()=>validateSnapshot(previewRoot,s,baseline));
});
test('stale hash cannot authorize self-consistent changed output',()=>{
 const s=structuredClone(baseline);s['src/styles.css'].text+='\np {color:red;}';
 const manifest=structuredClone(g.manifest),css=s['src/styles.css'].text;manifest.outputSha256['styles.css']=sha(css);
 assert.throws(()=>validateMemoryGallery({...g,snapshot:s,css,manifest},{baseline}));
});
for(const [label,change]of [
 ['missing input canonical path',m=>delete m.inputEvidence['src/styles.css'].canonicalPath],
 ['substituted canonical path',m=>m.inputEvidence['src/styles.css'].canonicalPath='synthetic'],
 ['input evidence hash',m=>m.inputEvidence['src/styles.css'].sha256='0'.repeat(64)],
 ['input ID',m=>m.inputEvidence['src/styles.css'].inputId='other'],
 ['missing evidence entry',m=>delete m.inputEvidence['src/styles.css']],
 ['HTML hash',m=>m.outputSha256['index.html']='0'.repeat(64)],
 ['CSS hash',m=>m.outputSha256['styles.css']='0'.repeat(64)],
 ['old schema',m=>m.schemaVersion=2],
])test('manifest refuses '+label,()=>{
 const manifest=structuredClone(g.manifest);change(manifest);
 assert.throws(()=>validateMemoryGallery({...g,manifest},{baseline}));
});
test('schema 3 input evidence records every canonical identity',()=>{
 assert.equal(g.manifest.schemaVersion,3);
 for(const [key,s]of Object.entries(baseline))assert.deepEqual(g.manifest.inputEvidence[key],{inputId:key,canonicalPath:s.target,sha256:s.hash});
});
for(const [label,snapshot]of [
 ['TS',{'src/a.ts':{text:'export const x=1;'}}],
 ['TSX',{'src/a.tsx':{text:'export const x=1;'}}],
 ['relative import',{'src/a.ts':{text:'import { x } from "./b";'},'src/b.ts':{text:'export const x=1;'}}],
])test('gallery graph accepts '+label,()=>assert.equal(assertGalleryImports(snapshot),true));
for(const [label,snapshot]of [
 ['JS',{'src/a.js':{text:'export const x=1;'}}],
 ['JSX',{'src/a.jsx':{text:'export const x=1;'}}],
 ['alias',{'src/a.ts':{text:'import { x } from "@fixture";'}}],
 ['type alias',{'src/a.ts':{text:'import type { X } from "@fixture";'}}],
 ['re-export alias',{'src/a.ts':{text:'export * from "@fixture";'}}],
 ['missing import',{'src/a.ts':{text:'import { x } from "./missing";'}}],
 ['ambiguous import',{'src/a.ts':{text:'import { x } from "./b";'},'src/b.ts':{text:''},'src/b.tsx':{text:''}}],
 ['explicit JS',{'src/a.ts':{text:'import { x } from "./b.js";'},'src/b.ts':{text:''}}],
])test('gallery graph refuses '+label,()=>assert.throws(()=>assertGalleryImports(snapshot)));

test('section headings belong outside the card layout containers',()=>{
 assert.ok(g.html.includes('<section class="pre-shift-section"><h2>前日確認の状態例</h2><div class="pre-shift-examples">'));
 assert.ok(g.html.includes('<section class="next-shift-section"><h2>次の勤務の表示例</h2><div class="next-shift-grid">'));
});
test('missing section heading refuses complete-looking cards',()=>{
 const html=g.html.replace('<h2>前日確認の状態例</h2>','');
 const manifest=structuredClone(g.manifest);manifest.outputSha256['index.html']=sha(html);
 assert.throws(()=>validateMemoryGallery({...g,html,manifest},{baseline}));
});
test('hidden extra snapshot entry is refused',()=>{
 const s=structuredClone(baseline);
 Object.defineProperty(s,'src/hidden.ts',{value:baseline['src/styles.css'],enumerable:false});
 assert.throws(()=>validateSnapshot(previewRoot,s,baseline));
});
test('hidden record field is refused rather than omitted from identity',()=>{
 const s=structuredClone(baseline);
 Object.defineProperty(s['src/styles.css'],'hidden',{value:'synthetic',enumerable:false});
 assert.throws(()=>validateSnapshot(previewRoot,s,baseline));
});

// STEP 300: assert exact refusal stages; no disk input or output is modified.
test('freeze A: valid HTML whitespace and matching hash reach final derivation refusal',()=>{
 const html=g.html.replace('<body>','<body>\n');
 assert.notEqual(html,g.html);
 assert.equal(validateSnapshot(previewRoot,g.snapshot,baseline),true);
 assert.equal(verifyInputs(previewRoot,g.snapshot),true);
 assert.deepEqual(inspectGallery(html,g.css,g.examples),{badges:3,cards:6});
 const manifest=structuredClone(g.manifest);manifest.outputSha256['index.html']=sha(html);
 assert.equal(manifest.outputSha256['index.html'],sha(html));
 assert.throws(()=>validateMemoryGallery({...g,html,manifest},{baseline}),
  {message:'output differs from inspected input'});
});
test('freeze B: valid changed CSS is refused before final derivation by snapshot CSS equality',()=>{
 const css=g.css+'\n';
 assert.equal(validateSnapshot(previewRoot,g.snapshot,baseline),true);
 assert.equal(verifyInputs(previewRoot,g.snapshot),true);
 assert.deepEqual(inspectGallery(g.html,css,g.examples),{badges:3,cards:6});
 const manifest=structuredClone(g.manifest);manifest.outputSha256['styles.css']=sha(css);
 assert.equal(manifest.outputSha256['styles.css'],sha(css));
 assert.notEqual(css,g.snapshot['src/styles.css'].text);
 assert.throws(()=>validateMemoryGallery({...g,css,manifest},{baseline}),
  {message:'memory manifest mismatch'});
});
test('freeze C: unchanged HTML CSS pass complete derivation validation',()=>{
 assert.equal(validateMemoryGallery(g,{baseline}).ok,true);
});
test('freeze D: matching substituted baseline cannot bypass current disk identity',()=>{
 const snapshot=structuredClone(baseline);
 snapshot['src/styles.css'].text+='\n';
 snapshot['src/styles.css'].hash=sha(snapshot['src/styles.css'].text);
 const substituted=structuredClone(snapshot),manifest=structuredClone(g.manifest);
 manifest.inputEvidence['src/styles.css'].sha256=snapshot['src/styles.css'].hash;
 manifest.inputSha256['src/styles.css']=snapshot['src/styles.css'].hash;
 manifest.outputSha256['styles.css']=snapshot['src/styles.css'].hash;
 assert.equal(validateSnapshot(previewRoot,snapshot),true);
 assert.equal(validateSnapshot(previewRoot,snapshot,substituted),true);
 assert.throws(()=>verifyInputs(previewRoot,snapshot),{message:'input content or target changed'});
 assert.throws(()=>validateMemoryGallery({...g,snapshot,css:snapshot['src/styles.css'].text,manifest},
  {baseline:substituted}),{message:'input content or target changed'});
});
test('freeze E: stale hash is refused at UTF-8 rehash with correct baseline',()=>{
 const snapshot=structuredClone(baseline);snapshot['src/styles.css'].text+='\n';
 assert.throws(()=>validateSnapshot(previewRoot,snapshot,baseline),
  {message:'snapshot content or target mismatch'});
 assert.throws(()=>validateMemoryGallery({...g,snapshot},{baseline}),
  {message:'snapshot content or target mismatch'});
});
test('freeze F: disk matching snapshot and explicit correct baseline pass',()=>{
 assert.equal(validateSnapshot(previewRoot,g.snapshot,baseline),true);
 assert.equal(verifyInputs(previewRoot,g.snapshot),true);
 assert.deepEqual(validateMemoryGallery(g,{baseline}),{ok:true,badges:3,cards:6,outputWritten:false});
});
