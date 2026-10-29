import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { previewRoot, checkBoundary } from './check-boundary.mjs';
import { inspectSnapshot, createStaticHarness } from './static-component-harness.mjs';
const main=fs.readFileSync(path.join(previewRoot,'src/main.tsx'),'utf8');
const key='tools/ui-preview/src/main.tsx';
test('official entry binding and call pass',()=>assert.equal(checkBoundary().ok,true));
for(const [label,text]of [
 ['export alias',main.replace('import { createRoot } from "react-dom/client";','import { createElement as createRoot } from "react";')],
 ['other module',main.replace('"react-dom/client"','"react"')],
 ['local variable',main+'\nconst createRoot = 1;'],
 ['shadow parameter',main+'\nfunction shadow(createRoot: unknown) { return createRoot; }'],
 ['local function',main+'\nfunction createRoot() {}'],
 ['wrong position',main.replace('createRoot(element).render','if (element) createRoot(element).render')],
 ['wrong argument',main.replace('createRoot(element)','createRoot("iframe")')],
 ['computed access',main+'\nconst x = ({a:1})["a"];'],
 ['dynamic import',main+'\nimport("react-dom/client");'],
 ['require alternative',main+'\nrequire("react-dom/client");'],
 ['indirect call',main+'\n(() => {})();'],
])test('entry rejects '+label,()=>assert.equal(checkBoundary({[key]:text}).ok,false));
test('createRoot binding outside entry rejected',()=>assert.equal(checkBoundary({
 'tools/ui-preview/src/fixtures/sample.ts':'import { createRoot } from "react-dom/client"; export const sample = {};',
}).ok,false));
const plain={'src/fixtures/plain.ts':'export const value = "synthetic";'};
test('boundary PASS permits only AST interpretation',()=>assert.equal(inspectSnapshot(plain,()=>({ok:true})).load('src/fixtures/plain.ts').value,'synthetic'));
test('boundary FAIL prevents interpretation',()=>assert.throws(()=>inspectSnapshot(plain,()=>({ok:false})),/before interpretation/));
test('boundary exception prevents interpretation',()=>assert.throws(()=>inspectSnapshot(plain,()=>{throw new Error('synthetic');}),/inspection error/));
test('missing check result refused',()=>assert.throws(()=>inspectSnapshot(plain,()=>null),/before interpretation/));
test('inspection/evaluation content mismatch refused',()=>assert.throws(()=>inspectSnapshot(plain,()=>({ok:true}),{'src/fixtures/plain.ts':'export const value="different";'}),/mismatch/));
test('snapshot does not follow later mutation',()=>{const input={...plain};const h=inspectSnapshot(input,()=>({ok:true}));input['src/fixtures/plain.ts']='export const value="changed";';assert.equal(h.load('src/fixtures/plain.ts').value,'synthetic');});
test('unknown runtime dependency has no resolver',()=>assert.throws(()=>inspectSnapshot({'src/a.ts':'import x from "node:fs";'},()=>({ok:true})).load('src/a.ts'),/dependency denied/));
test('call AST never executes',()=>assert.throws(()=>inspectSnapshot({'src/a.ts':'export const value=unknownCall();'},()=>({ok:true})).load('src/a.ts'),/unsupported AST/));
for(const [label,source]of [
 ['production','import X from "../../../../app/page";'],
 ['Auth','import X from "../../../../lib/auth/require-worker";'],
 ['DB','import X from "../../../../lib/supabase/server";'],
 ['Server Action','import X from "../../../../app/actions/pre-shift-confirmations";'],
 ['API','fetch("/api/example");'],
 ['environment','const value=process.env.SYNTHETIC;'],
 ['require','require("node:fs");'],
])test('unsafe snapshot rejected before interpretation: '+label,()=>assert.throws(()=>inspectSnapshot({
 'src/components/PreviewPreShiftStatusBadge.tsx':source,
}),/before interpretation/));
test('real frozen graph can interpret the badge',()=>assert.equal(createStaticHarness().load('src/components/PreviewPreShiftStatusBadge.tsx').PreviewPreShiftStatusBadge({children:'pending'}).props.children,'未確認'));
