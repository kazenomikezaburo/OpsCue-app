import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import { previewRoot,checkBoundary } from './check-boundary.mjs';
import { captureInputs,verifyInputs,validateSnapshot } from './build-input-boundary.mjs';
import { createStaticHarness } from './static-component-harness.mjs';
import { assertGalleryImports } from './snapshot-import-resolver.mjs';
import { createHtmlRenderer,checkStaticCss } from './static-html-renderer.mjs';
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
export const outputDirectory=path.join(previewRoot,'.vite-cache/static-gallery-output');
const CSP="default-src 'none'; style-src 'self'; base-uri 'none'; form-action 'none'; connect-src 'none'";
const badgeCases=[['not-open','not_open','受付前'],['pending','pending','未確認'],['confirmed','confirmed','確認済み']];
const cardCases=[['before','受付前'],['pending','未確認'],['confirmed','確認済み'],['empty',null],['error',null],['long','未確認']];
const element=(type,children,extra={})=>({type,props:{...extra,children}});
const bodyTags=new Set(['main','section','article','div','h1','h2','h3','p','span','small','dl','dt','dd']);
export function inspectGallery(html,css,examples) {
 checkStaticCss(css);
 const problems=[];const document=parse(html,{onParseError:e=>problems.push(e.code)});
 if(problems.length)throw new Error('invalid generated HTML');
 const ids=new Map();let sheets=0,csp=0,doctype=0;
 function visit(node) {
  if(node.nodeName==='#documentType'){if(node.name!=='html')throw new Error('doctype');doctype++;}
  if(node.tagName) {
   if(!bodyTags.has(node.tagName) && !['html','head','body','meta','title','link'].includes(node.tagName))throw new Error('prohibited output tag');
   const attrs=Object.fromEntries(node.attrs.map(a=>[a.name,a.value]));
   if(node.tagName==='link') {
    if(JSON.stringify(attrs)!==JSON.stringify({rel:'stylesheet',href:'styles.css'}))throw new Error('unknown output resource');sheets++;
   } else if(node.tagName==='meta') {
    if(attrs.charset==='UTF-8' && Object.keys(attrs).length===1) {}
    else if(attrs.name==='viewport' && attrs.content==='width=device-width, initial-scale=1' && Object.keys(attrs).length===2) {}
    else if(attrs['http-equiv']==='Content-Security-Policy' && attrs.content===CSP && Object.keys(attrs).length===2)csp++;
    else throw new Error('unknown metadata');
   } else {
    for(const [key,value]of Object.entries(attrs)) {
     if(key==='lang' && node.tagName==='html' && value==='ja')continue;
     if(!['class','role','id'].includes(key))throw new Error('unknown output attribute');
     if(key==='role' && !['alert','status'].includes(value))throw new Error('unknown output role');
     if(key==='id'){if(!/^[a-z][a-z0-9-]*$/.test(value) || ids.has(value))throw new Error('output id');ids.set(value,node);}
    }
   }
  }
  for(const child of node.childNodes??[])visit(child);
 }
 visit(document);
 if(sheets!==1 || csp!==1 || doctype!==1)throw new Error('missing output contract');
 const text=node=>node.nodeName==='#text'?node.value:(node.childNodes??[]).map(text).join('');
 const spans=node=>[...(node.tagName==='span'?[node]:[]),...(node.childNodes??[]).flatMap(spans)];
 for(const [id,,label]of badgeCases) {
  const node=ids.get('badge-'+id);if(!node)throw new Error('missing badge case');
  const badges=spans(node);if(badges.length!==1 || text(badges[0])!==label)throw new Error('wrong badge label');
  if(badgeCases.some(([, ,other])=>other!==label && text(node).includes(other)))throw new Error('mixed badge labels');
 }
 for(const [id,label]of cardCases) {
  const node=ids.get('card-'+id);if(!node)throw new Error('missing card case');
  const content=text(node),badges=spans(node);
  if(badgeCases.some(([, ,other])=>other!==label && content.includes(other)))throw new Error('mixed card labels');
  if(label) {
   if(badges.length!==1 || text(badges[0])!==label)throw new Error('wrong card badge');
   for(const field of ['projectLabel','jobLabel','workplaceLabel','dateLabel','timeLabel'])if(!content.includes(examples[id].shift[field]))throw new Error('missing card field');
  }else if(badges.length!==0 || !content.includes(id==='empty'?'勤務予定はありません':'勤務情報を取得できませんでした。'))throw new Error('wrong fixed state');
 }
 // Exact display contract, independently constructed from fixed fixture fields.
 const children=n=>(n.childNodes??[]).filter(c=>!(c.nodeName==='#text' && !c.value.trim()));
 function shape(n,tag,attrs={},expectedText) {
  if(n?.tagName!==tag || JSON.stringify(Object.fromEntries(n.attrs.map(a=>[a.name,a.value]).sort(([a],[b])=>a.localeCompare(b))))!==JSON.stringify(Object.fromEntries(Object.entries(attrs).sort(([a],[b])=>a.localeCompare(b)))))throw new Error('display structure or attributes');
  if(expectedText!==undefined && (children(n).some(c=>c.nodeName!=='#text') || text(n)!==expectedText))throw new Error('display text structure');
 }
 const classFor=label=>label==='受付前'?'not-open':label==='未確認'?'pending':'confirmed';
 function badgeShape(n,label){shape(n,'span',{class:'pre-shift-badge pre-shift-badge--'+classFor(label)},label);}
 for(const [id,,label]of badgeCases){
  const n=ids.get('badge-'+id);shape(n,'article',{id:'badge-'+id});const c=children(n);
  if(c.length!==1)throw new Error('badge children');badgeShape(c[0],label);
 }
 for(const [id,label]of cardCases){
  const wrapper=ids.get('card-'+id);shape(wrapper,'div',{id:'card-'+id});const w=children(wrapper);
  if(w.length!==1)throw new Error('card wrapper children');
  shape(w[0],'article',id==='error'?{class:'next-shift-card',role:'alert'}:{class:'next-shift-card'});
  const c=children(w[0]);shape(c[0],'h2',{},'次の勤務');
  if(!label){
   if(c.length!==3)throw new Error('fixed card children');
   shape(c[1],'p',{},id==='empty'?'勤務予定はありません':'勤務情報を取得できませんでした。');
   shape(c[2],'p',{},id==='empty'?'合成データによる空状態です。':'合成データによるエラー表示です。通信は行っていません。');
  }else{
   if(c.length!==6 || examples[id].kind!=='ready')throw new Error('ready card children');
   const s=examples[id].shift;
   shape(c[1],'p',{class:'next-shift-date'},s.dateLabel+'・'+s.timeLabel);
   shape(c[2],'p',{class:'next-shift-project'},s.projectLabel);
   shape(c[3],'p',{},s.jobLabel);shape(c[4],'p',{},s.workplaceLabel);
   shape(c[5],'div',{class:'next-shift-confirmation'});const b=children(c[5]);
   if(b.length!==2)throw new Error('confirmation children');shape(b[0],'p',{},'前日確認');badgeShape(b[1],label);
  }
 }
 const htmlNode=children(document).find(n=>n.tagName==='html'),htmlChildren=children(htmlNode);
 shape(htmlNode,'html',{lang:'ja'});
 if(htmlChildren.length!==2)throw new Error('document children');
 shape(htmlChildren[0],'head');shape(htmlChildren[1],'body');
 const body=children(htmlChildren[1]);if(body.length!==1)throw new Error('body children');
 shape(body[0],'main');const main=children(body[0]);if(main.length!==4)throw new Error('main children');
 shape(main[0],'h1',{},'OpsCue UI Preview — Static Gallery');
 shape(main[1],'p',{class:'notice'},'Preview only。すべて合成データです。React/Viteビルドではありません。');
 shape(main[2],'section',{class:'pre-shift-section'});shape(main[3],'section',{class:'next-shift-section'});
 const first=children(main[2]),second=children(main[3]);
 if(first.length!==2 || second.length!==2)throw new Error('section structure');
 shape(first[0],'h2',{},'前日確認の状態例');shape(second[0],'h2',{},'次の勤務の表示例');
 shape(first[1],'div',{class:'pre-shift-examples'});shape(second[1],'div',{class:'next-shift-grid'});
 if(children(first[1]).length!==3 || children(second[1]).length!==6 ||
 children(first[1]).some((n,i)=>n!==ids.get('badge-'+badgeCases[i][0])) ||
 children(second[1]).some((n,i)=>n!==ids.get('card-'+cardCases[i][0])))throw new Error('case placement');
 const head=children(htmlChildren[0]);
 if(head.length!==5 || head[0].tagName!=='meta' || head[1].tagName!=='meta' || head[2].tagName!=='meta' || head[3].tagName!=='title' || head[4].tagName!=='link')throw new Error('head structure');
 shape(head[0],'meta',{charset:'UTF-8'});shape(head[1],'meta',{name:'viewport',content:'width=device-width, initial-scale=1'});
 shape(head[2],'meta',{'http-equiv':'Content-Security-Policy',content:CSP});shape(head[3],'title',{},'OpsCue Static Gallery');
 shape(head[4],'link',{rel:'stylesheet',href:'styles.css'});

 if(ids.size!==9)throw new Error('unexpected gallery cases');
 return {badges:3,cards:6};
}
const toolNames=Object.freeze(['static-component-harness.mjs','static-html-renderer.mjs','generate-static-gallery.mjs','check-boundary.mjs','build-input-boundary.mjs','snapshot-import-resolver.mjs']);
function captureTools(){
 return Object.fromEntries(toolNames.map(name=>{
  const file=path.join(previewRoot,'scripts',name);
  if(fs.realpathSync(file)!==file || fs.lstatSync(file).isSymbolicLink() || !fs.lstatSync(file).isFile())throw new Error('tool path refused');
  return ['scripts/'+name,{canonicalPath:file,sha256:hash(fs.readFileSync(file))}];
 }));
}
export function validateMemoryGallery(gallery,{baseline=captureInputs(previewRoot)}={}) {
 validateSnapshot(previewRoot,gallery.snapshot,baseline);
 verifyInputs(previewRoot,gallery.snapshot);
 inspectGallery(gallery.html,gallery.css,gallery.examples);
 const m=gallery.manifest;
 if(m.schemaVersion!==3 || m.generationMethod!=='limited-ast-static-html-css-memory-v3' || m.kind!=='OpsCue-static-gallery' || m.badges!==3 || m.cards!==6 ||
 JSON.stringify(m.toolEvidence)!==JSON.stringify(captureTools()) ||
 JSON.stringify(m.inputEvidence)!==JSON.stringify(Object.fromEntries(Object.entries(gallery.snapshot).map(([p,s])=>[p,{inputId:p,canonicalPath:s.target,sha256:s.hash}]))) ||
 JSON.stringify(m.inputSha256)!==JSON.stringify(Object.fromEntries(Object.entries(gallery.snapshot).map(([p,s])=>[p,s.hash]))) ||
 JSON.stringify(m.outputSha256)!==JSON.stringify({'index.html':hash(gallery.html),'styles.css':hash(gallery.css)}) ||
 gallery.css!==gallery.snapshot['src/styles.css'].text)throw new Error('memory manifest mismatch');
 // Independently derive the complete display from the validated fixed input.
 // Caller supplied examples/output metadata are never the source of truth.
 const expected=assembleStaticGallery({snapshot:gallery.snapshot,inspect:checkBoundary});
 if(gallery.html!==expected.html || gallery.css!==expected.css || JSON.stringify(gallery.examples)!==JSON.stringify(expected.examples))throw new Error('output differs from inspected input');
 return {ok:true,badges:3,cards:6,outputWritten:false};
}
export function buildStaticGallery(options={}) {
 const gallery=assembleStaticGallery(options);
 validateMemoryGallery(gallery);
 return gallery;
}

function assembleStaticGallery({snapshot=captureInputs(previewRoot),inspect=checkBoundary}={}) {
 verifyInputs(previewRoot,snapshot);
 assertGalleryImports(snapshot);
 const tools=captureTools();
 const overrides=Object.fromEntries(Object.entries(snapshot).map(([key,item])=>['tools/ui-preview/'+key,item.text]));
 if(inspect(overrides)?.ok!==true)throw new Error('source boundary refused');
 const h=createStaticHarness({snapshot,inspect});
 const badge=h.load('src/components/PreviewPreShiftStatusBadge.tsx').PreviewPreShiftStatusBadge;
 const card=h.load('src/components/PreviewNextShiftCard.tsx').PreviewNextShiftCard;
 const examples=h.load('src/fixtures/worker-next-shift.ts').nextShiftExamples;
 const preShift=h.load('src/fixtures/pre-shift.ts').preShift;
 if(JSON.stringify(preShift)!==JSON.stringify({before:'not_open',waiting:'pending',done:'confirmed'}) ||
    JSON.stringify(Object.keys(examples))!==JSON.stringify(cardCases.map(([key])=>key)))throw new Error('fixture shape');
 const render=createHtmlRenderer({components:[badge,card],isComponent:h.isComponent});
 const tree=element('main',[
  element('h1','OpsCue UI Preview — Static Gallery'),
  element('p','Preview only。すべて合成データです。React/Viteビルドではありません。',{className:'notice'}),
  element('section',[element('h2','前日確認の状態例'),element('div',badgeCases.map(([id,state])=>element('article',{type:badge,props:{children:state}},{id:'badge-'+id})),{className:'pre-shift-examples'})],{className:'pre-shift-section'}),
  element('section',[element('h2','次の勤務の表示例'),element('div',cardCases.map(([id])=>element('div',{type:card,props:{children:examples[id]}},{id:'card-'+id})),{className:'next-shift-grid'})],{className:'next-shift-section'}),
 ]);
 const html='<!doctype html>\n<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="'+CSP+'"><title>OpsCue Static Gallery</title><link rel="stylesheet" href="styles.css"></head><body>'+render(tree)+'</body></html>\n';
 const css=checkStaticCss(snapshot['src/styles.css'].text);
 inspectGallery(html,css,examples);
 verifyInputs(previewRoot,snapshot);
 const manifest={schemaVersion:3,generationMethod:'limited-ast-static-html-css-memory-v3',toolEvidence:tools,kind:'OpsCue-static-gallery',badges:3,cards:6,
  inputEvidence:Object.fromEntries(Object.entries(snapshot).map(([p,s])=>[p,{inputId:p,canonicalPath:s.target,sha256:s.hash}])),
  inputSha256:Object.fromEntries(Object.entries(snapshot).map(([key,item])=>[key,item.hash])),
  outputSha256:{'index.html':hash(html),'styles.css':hash(css)}};
 const gallery=Object.freeze({html,css,manifest,snapshot,examples}); return gallery;
}
export function validateOutputDirectory(dir) {
 if(!path.isAbsolute(dir) || path.resolve(dir)!==dir)throw new Error('noncanonical output');
 const parent=path.dirname(dir), tmp=path.join(previewRoot,'.vite-cache/test-tmp');
 const relative=path.relative(tmp,parent);
 const underTmp=relative==='' || (!path.isAbsolute(relative) && relative!=='..' && !relative.startsWith('..'+path.sep));
 if(dir!==outputDirectory && (!underTmp || !path.basename(dir).startsWith('static-gallery-output-')))throw new Error('output outside approved area');
 if(fs.realpathSync(previewRoot)!==previewRoot || fs.realpathSync(parent)!==parent ||
    !fs.lstatSync(parent).isDirectory() || fs.lstatSync(parent).isSymbolicLink() ||
    fs.existsSync(dir))throw new Error('existing or redirected output');
 return dir;
}
export function writeStaticGallery() {
 // No path check, capability flag, callback or caller assertion authorizes writes.
 // Node standard APIs here do not establish handle-relative Windows containment.
 throw new Error('STATIC_GALLERY_OUTPUT_UNVERIFIED');
}
export function checkStaticGalleryDirectory(dir,gallery) {
 if(!path.isAbsolute(dir) || fs.realpathSync(dir)!==dir || fs.lstatSync(dir).isSymbolicLink())throw new Error('redirected output');
 if(JSON.stringify(fs.readdirSync(dir).sort())!==JSON.stringify(['index.html','manifest.json','styles.css']))throw new Error('output membership');
 for(const name of ['index.html','manifest.json','styles.css']) {
  const file=path.join(dir,name);
  if(!fs.lstatSync(file).isFile() || fs.lstatSync(file).isSymbolicLink() || fs.realpathSync(file)!==file)throw new Error('output redirected');
 }
 const html=fs.readFileSync(path.join(dir,'index.html'),'utf8'),css=fs.readFileSync(path.join(dir,'styles.css'),'utf8');
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
 if(JSON.stringify(manifest)!==JSON.stringify(gallery.manifest) || hash(html)!==manifest.outputSha256['index.html'] ||
    hash(css)!==manifest.outputSha256['styles.css'])throw new Error('output manifest mismatch');
 inspectGallery(html,css,gallery.examples);
 return {ok:true,badges:3,cards:6};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 try {
  if(process.version!=='v22.23.3')throw new Error('Node version refused');
  if(process.argv.length!==2)throw new Error('unknown generation arguments');
  const gallery=buildStaticGallery();writeStaticGallery(outputDirectory,gallery);
  console.log('STATIC_GALLERY_PASS: '+outputDirectory+' (no browser/runtime proof)');
 } catch(error) {console.error(error.message==='STATIC_GALLERY_OUTPUT_UNVERIFIED'?'STATIC_GALLERY_OUTPUT_UNVERIFIED':'STATIC_GALLERY_REFUSED');process.exitCode=1;}
}
