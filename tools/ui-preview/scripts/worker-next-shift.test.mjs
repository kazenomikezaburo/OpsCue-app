import { createStaticHarness } from "./static-component-harness.mjs";
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkBoundary } from './check-boundary.mjs';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const harness=createStaticHarness();
const load=p=>harness.load(p);
const badge=load('src/components/PreviewPreShiftStatusBadge.tsx');
const card=load('src/components/PreviewNextShiftCard.tsx',{'./PreviewPreShiftStatusBadge':badge}).PreviewNextShiftCard;
const examples=load('src/fixtures/worker-next-shift.ts').nextShiftExamples;
function rendered(node) {
 if(node===null||node===undefined||typeof node==='boolean')return '';
 if(typeof node==='string'||typeof node==='number')return String(node);
 if(Array.isArray(node))return node.map(rendered).join(' ');
 if(typeof node.type==='function')return rendered(node.type(node.props));
 return rendered(node.props.children);
}
for(const [name,label]of [['before','受付前'],['pending','未確認'],['confirmed','確認済み']]){
 test('ready fields and badge: '+name,()=>{
 const view=examples[name];const node=card({children:view});const text=rendered(node);
 assert.equal(node.type,'article');assert.equal(node.props.className,'next-shift-card');
 for(const key of ['projectLabel','jobLabel','workplaceLabel','dateLabel','timeLabel'])assert.ok(text.includes(view.shift[key]));
 assert.ok(text.includes(label));
 });
}
test('empty fixed message',()=>assert.match(rendered(card({children:examples.empty})),/勤務予定はありません/));
test('error fixed message and alert',()=>{const n=card({children:examples.error});assert.equal(n.props.role,'alert');assert.match(rendered(n),/通信は行っていません/);});
test('long labels remain complete',()=>{const v=examples.long;const t=rendered(card({children:v}));assert.ok(t.includes(v.shift.projectLabel));assert.ok(t.includes(v.shift.workplaceLabel));});
test('unknown confirmation is not confirmed',()=>{const v={kind:'ready',shift:{...examples.before.shift,preShift:'unknown'}};const t=rendered(card({children:v}));assert.match(t,/状態不明/);assert.ok(!t.includes('確認済み'));});
test('unknown view is not a ready card',()=>assert.match(rendered(card({children:{kind:'unknown'}})),/表示状態不明/));
test('wrap rules are present, not a browser proof',()=>{const css=read('src/styles.css');assert.match(css,/overflow-wrap:\s*anywhere/);assert.match(css,/min-width:\s*0/);assert.match(css,/grid-template-columns:\s*1fr/);});
test('normal boundary',()=>assert.equal(checkBoundary().ok,true));
const relative='src/components/PreviewNextShiftCard.tsx';
for(const [name,prefix]of [
 ['production','import X from "../../../../components/worker/home/worker-home";'],
 ['type','import type { WorkerAssignment } from "../../../../lib/worker/worker-assignment-types";'],
 ['Auth','import X from "../../../../lib/auth/require-worker";'],
 ['Server Action','import X from "../../../../app/actions/pre-shift-confirmations";'],
 ['API','fetch("/api/example");'],
 ['WebSocket','new WebSocket("ws://example.invalid");'],
 ['EventSource','new EventSource("https://example.invalid");'],
 ['environment','const x=process.env.SYNTHETIC;'],
 ['computed','const x=({a:1})["a"];'],
 ['dynamic','import("../../../../app/page");'],
 ['require','require("../../../../app/page");'],
]){
 test('reject '+name,()=>assert.equal(checkBoundary({['tools/ui-preview/'+relative]:prefix+'\n'+read(relative)}).ok,false));
}
test('reject production alias',()=>{const tc=JSON.parse(read('tsconfig.json'));tc.compilerOptions.paths={'@production/*':['../../app/*']};assert.equal(checkBoundary({'tools/ui-preview/tsconfig.json':JSON.stringify(tc),['tools/ui-preview/'+relative]:'import X from "@production/page";\n'+read(relative)}).ok,false);});
