import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { inspectSnapshot } from './static-component-harness.mjs';
import { createHtmlRenderer,escapeHtml,checkStaticCss } from './static-html-renderer.mjs';
import { previewRoot,checkBoundary } from './check-boundary.mjs';
import { captureInputs } from './build-input-boundary.mjs';
import { buildStaticGallery,inspectGallery,validateOutputDirectory,writeStaticGallery,checkStaticGalleryDirectory } from './generate-static-gallery.mjs';
const ast=source=>inspectSnapshot({'src/a.ts':source},()=>({ok:true})).load('src/a.ts');
test('if true uses consequent',()=>assert.equal(ast('export function f({value}){if(value === "yes")return "then";else return "else";}').f({value:'yes'}),'then'));
test('if false uses alternate',()=>assert.equal(ast('export function f({value}){if(value === "yes")return "then";else return "else";}').f({value:'no'}),'else'));
test('else if selects matching branch',()=>assert.equal(ast('export function f({value}){if(value === "a")return "a";else if(value === "b")return "b";else return "c";}').f({value:'b'}),'b'));
test('else if falls through to else',()=>assert.equal(ast('export function f({value}){if(value === "a")return "a";else if(value === "b")return "b";else return "c";}').f({value:'other'}),'c'));
test('nonboolean condition refused',()=>assert.throws(()=>ast('export function f({value}){if(value)return "yes";else return "no";}').f({value:'yes'})));
test('unknown condition refused',()=>assert.throws(()=>ast('export function f({value}){if(unknown)return "yes";return "no";}').f({value:'yes'})));
test('private variable remains internally available only',()=>{
 const m=ast('const hidden="synthetic";export function f({value}){return hidden;}');assert.equal(Object.hasOwn(m,'hidden'),false);assert.equal(m.f({value:0}),'synthetic');
});
test('private function not exported',()=>assert.equal(Object.hasOwn(ast('function hidden({value}){return value;}export const visible="synthetic";'),'hidden'),false));
test('missing private export import refused',()=>assert.throws(()=>inspectSnapshot({
 'src/a.ts':'const hidden="synthetic";','src/b.ts':'import { hidden } from "./a";export const value=hidden;',
},()=>({ok:true})).load('src/b.ts')));
for(const source of ['export default "synthetic";','const value="synthetic";export { value };','export * from "./b";'])test('unsupported export refused '+source,()=>assert.throws(()=>ast(source)));
const render=createHtmlRenderer();
const node=(type,children,extra={})=>({type,props:{...extra,children}});
test('escape all five characters',()=>assert.equal(escapeHtml('&<>"\''),'&amp;&lt;&gt;&quot;&#39;'));
test('text escaped, never inserted as markup',()=>assert.equal(render(node('p','<script>synthetic</script>')),'<p>&lt;script&gt;synthetic&lt;/script&gt;</p>'));
test('attribute escaped',()=>assert.equal(render(node('span','synthetic',{className:'a"&<>\''})),'<span class="a&quot;&amp;&lt;&gt;&#39;">synthetic</span>'));
for(const tag of ['script','iframe','object','embed','form','input','button','a','img','unknown'])test('reject tag '+tag,()=>assert.throws(()=>render(node(tag,'synthetic'))));
for(const name of ['onclick','onClick','style','href','src','dangerouslySetInnerHTML','unknown'])test('reject attribute '+name,()=>assert.throws(()=>render(node('span','synthetic',{[name]:'javascript:synthetic'}))));
test('unknown component not invoked',()=>{let calls=0;const fn=()=>{calls++;return node('p','synthetic');};assert.throws(()=>render({type:fn,props:{children:'synthetic'}}));assert.equal(calls,0);});
test('getter rejected without invocation',()=>{let calls=0;const props={};Object.defineProperty(props,'children',{enumerable:true,get(){calls++;return 'synthetic';}});assert.throws(()=>render({type:'p',props}));assert.equal(calls,0);});
test('recursive display tree refused',()=>{const n=node('p',[]);n.props.children.push(n);assert.throws(()=>render(n),/depth/);});
for(const css of ['@import "https://example.invalid/style.css";','@import "./local.css";','p {background:url(https://example.invalid/a)}','p {background:url(./a.png)}','p {behavior: synthetic}','p {color:expression(synthetic)}','p {color:var(--unknown)}','@font-face { font-family: synthetic }','p { background: u\\72l(synthetic) }'])test('CSS refuses '+css,()=>assert.throws(()=>checkStaticCss(css)));
test('fixed local CSS parser accepts known declarations',()=>assert.equal(checkStaticCss('p { color: #123; }'),'p { color: #123; }'));
const gallery=buildStaticGallery();
test('gallery structure has three badges and six cards',()=>assert.deepEqual(inspectGallery(gallery.html,gallery.css,gallery.examples),{badges:3,cards:6}));
test('no JS entry or script in gallery',()=>{assert.doesNotMatch(gallery.html,/<script|\ssrc=|\son[a-z]+=/i);assert.ok(gallery.html.includes('合成データ'));});
test('CSS output is fixed inspected text',()=>assert.equal(gallery.css,gallery.snapshot['src/styles.css'].text));
test('manifest records source and emitted hashes',()=>assert.equal(gallery.manifest.outputSha256['index.html'],crypto.createHash('sha256').update(gallery.html).digest('hex')));
test('wrong badge label rejected',()=>assert.throws(()=>inspectGallery(gallery.html.replace('受付前','確認済み'),gallery.css,gallery.examples)));
test('script injection rejected before writing',()=>assert.throws(()=>inspectGallery(gallery.html.replace('</body>','<script>synthetic</script></body>'),gallery.css,gallery.examples)));
test('event attribute rejected',()=>assert.throws(()=>inspectGallery(gallery.html.replace('<body>','<body onclick="synthetic">'),gallery.css,gallery.examples)));
test('external stylesheet rejected',()=>assert.throws(()=>inspectGallery(gallery.html.replace('href="styles.css"','href="https://example.invalid/style.css"'),gallery.css,gallery.examples)));
test('unknown output tag rejected',()=>assert.throws(()=>inspectGallery(gallery.html.replace('<body>','<body><unknown></unknown>'),gallery.css,gallery.examples)));
test('boundary failure stops interpretation/generation',()=>assert.throws(()=>buildStaticGallery({inspect:()=>({ok:false})})));
test('snapshot mismatch stops generation',()=>{
 const s=captureInputs(previewRoot);const bad={...s,'src/styles.css':{...s['src/styles.css'],text:'changed'}};
 assert.throws(()=>buildStaticGallery({snapshot:bad}));
});
test('outside output path rejected',()=>assert.throws(()=>validateOutputDirectory(path.join(previewRoot,'../static-gallery-output'))));
const temporary=()=>path.join(previewRoot,'.vite-cache/test-tmp','static-gallery-output-test-'+crypto.randomUUID());
function cleanup(dir){const base=path.join(previewRoot,'.vite-cache/test-tmp')+path.sep;if(!dir.startsWith(base))throw new Error('cleanup outside test area');fs.rmSync(dir,{recursive:true,force:true});}
test('invalid gallery creates no directory',()=>{
 const dir=temporary();try{assert.throws(()=>writeStaticGallery(dir,{...gallery,html:gallery.html+'<script>synthetic</script>'}));assert.equal(fs.existsSync(dir),false);}finally{cleanup(dir);}
});
test('historical write/readback route now refuses output',()=>{
 // Historical writing is no longer authorized. Preserve this regression as refusal.
 assert.throws(()=>writeStaticGallery(temporary(),gallery),/STATIC_GALLERY_OUTPUT_UNVERIFIED/);
});
test('output hash mismatch detected',()=>{
 assert.throws(()=>writeStaticGallery(temporary(),{...gallery,css:'changed'}),/STATIC_GALLERY_OUTPUT_UNVERIFIED/);
});
test('unsupported AST in untaken branch refused before invocation',()=>assert.throws(()=>ast('export function f({value}){if(value === "yes")return "yes";else while(false){}return "no";}')));
test('unsupported AST after return refused',()=>assert.throws(()=>ast('export function f({value}){return value;while(false){}}')));
test('async function is not silently treated as synchronous',()=>assert.throws(()=>ast('export async function f({value}){return value;}')));
test('generator function refused',()=>assert.throws(()=>ast('export function* f({value}){return value;}')));
test('other state label outside valid badge span refused',()=>assert.throws(()=>inspectGallery(gallery.html.replace('未確認</span>','未確認</span><p>確認済み</p>'),gallery.css,gallery.examples)));
test('empty card cannot include a confirmation state label',()=>assert.throws(()=>inspectGallery(gallery.html.replace('id="card-empty">','id="card-empty"><p>確認済み</p>'),gallery.css,gallery.examples)));
test('local CSS source-map annotation refused without file read',()=>assert.throws(()=>checkStaticCss('p {color:red}/*# sourceMappingURL=synthetic-not-a-file.map */')));
test('source boundary refuses CSS source-map annotation',()=>assert.equal(checkBoundary({'tools/ui-preview/src/styles.css':'p {color:red}/*# sourceMappingURL=synthetic-not-a-file.map */'}).ok,false));