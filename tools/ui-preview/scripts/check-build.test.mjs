import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const asset=fs.readdirSync(path.join(root,'dist/assets')).find(file=>file.endsWith('.js'));
const js='assets/'+asset;
function probe(overrides, expected) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'OpsCue-build-275-'));
  try {
    const fixture=path.join(dir,'fixture.json');fs.writeFileSync(fixture,JSON.stringify(overrides));
    const env={};for(const key of ['SystemRoot','WINDIR','TEMP','TMP'])if(process.env[key])env[key]=process.env[key];
    const r=spawnSync(process.execPath,['scripts/check-build.mjs','--probe',fixture],{cwd:root,env,encoding:'utf8',timeout:20000});
    assert.equal(r.error,undefined);assert.equal(r.signal,null);
    assert.equal(r.status,expected,r.stdout+r.stderr);
    assert.match(r.stdout,expected===0?/STATIC_BUILD_PASS/:/STATIC_BUILD_FAIL/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
}
test('normal emitted bundle including React namespaces passes',()=>probe({},0));
test('reject emitted network call',()=>probe({[js]:'fetch("https://example.invalid");'},1));
test('reject emitted environment secret reference',()=>probe({[js]:'process.env.SECRET;'},1));
test('reject emitted dynamic import',()=>probe({[js]:'import("./external.js");'},1));
test('reject emitted unknown URL',()=>probe({[js]:'const external="https://example.invalid/";'},1));
test('reject emitted external HTML resource',()=>probe({'index.html':'<!doctype html><html><head><title>x</title></head><body><script type="module" src="https://example.invalid/a.js"></script></body></html>'},1));
test('reject emitted external CSS resource',()=>{
 const css=fs.readdirSync(path.join(root,'dist/assets')).find(file=>file.endsWith('.css'));
 probe({['assets/'+css]:'body{background:url(https://example.invalid/a)}'},1);
});
test('reject emitted graph with dynamic imports',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(root,'dist/.vite/manifest.json'),'utf8'));
 m['index.html'].dynamicImports=['unknown.js'];
 probe({'.vite/manifest.json':JSON.stringify(m)},1);
});
