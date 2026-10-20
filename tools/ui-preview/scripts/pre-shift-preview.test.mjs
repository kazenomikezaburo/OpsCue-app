import { createStaticHarness } from "./static-component-harness.mjs";
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkBoundary } from './check-boundary.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const relative = 'src/components/PreviewPreShiftStatusBadge.tsx';
const source = fs.readFileSync(path.join(root, relative), 'utf8');
const harness=createStaticHarness();
const exports=harness.load(relative);
const badge = exports.PreviewPreShiftStatusBadge;
for (const [state,label,tone] of [
  ['not_open','受付前','not-open'], ['pending','未確認','pending'], ['confirmed','確認済み','confirmed'],
]) {
  test('display contract: '+state, () => {
    const node = badge({children:state});
    assert.equal(node.type,'span');
    assert.equal(node.props.children,label);
    assert.equal(node.props.className,'pre-shift-badge pre-shift-badge--'+tone);
  });
}
for (const state of ['other', undefined, null, '', 1, {}]) {
  test('unknown input is not confirmed: '+String(state), () => {
    const node=badge({children:state});
    assert.equal(node.props.children,'状態不明');
    assert.equal(node.props.className,'pre-shift-badge pre-shift-badge--unknown');
  });
}
test('synthetic fixtures match the three official values', () => {
  const text=fs.readFileSync(path.join(root,'src/fixtures/pre-shift.ts'),'utf8');
  const fixture=harness.load("src/fixtures/pre-shift.ts");
  assert.deepEqual(fixture.preShift,{before:'not_open',waiting:'pending',done:'confirmed'});
});
test('normal preview boundary', () => assert.equal(checkBoundary().ok,true));
const key='tools/ui-preview/'+relative;
for (const [label,mutation] of [
  ['production type','import type { PreShiftConfirmationState } from "../../../../lib/domain/pre-shift-confirmation";\n'],
  ['production component','import { PreShiftStatusBadge } from "../../../../components/worker/pre-shift-status-badge";\n'],
  ['Auth','import { auth } from "../../../../lib/auth/get-current-profile";\n'],
  ['Server Action','import { submitPreShiftConfirmation } from "../../../../app/actions/pre-shift-confirmations";\n'],
  ['API','fetch("/api/example");\n'],
  ['WebSocket','new WebSocket("ws://example.invalid");\n'],
  ['EventSource','new EventSource("https://example.invalid");\n'],
  ['environment','const secret = process.env.SYNTHETIC_SECRET;\n'],
  ['computed access','const label = ({ confirmed: "確認済み" })["confirmed"];\n'],
  ['dynamic import','import("../../../../app/page");\n'],
  ['require','require("../../../../app/page");\n'],
]) {
  test('boundary rejects '+label,()=>assert.equal(checkBoundary({[key]:mutation+source}).ok,false));
}
test('boundary rejects alias into production', () => {
  const tc=JSON.parse(fs.readFileSync(path.join(root,'tsconfig.json'),'utf8'));
  tc.compilerOptions.paths={'@production/*':['../../app/*']};
  assert.equal(checkBoundary({
    'tools/ui-preview/tsconfig.json':JSON.stringify(tc),
    [key]:'import { page } from "@production/page";\n'+source,
  }).ok,false);
});
