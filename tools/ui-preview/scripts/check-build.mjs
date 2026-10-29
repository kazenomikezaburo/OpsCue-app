import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import postcss from 'postcss';
import values from 'postcss-value-parser';
import { parse as parseHtml } from 'parse5';
import { checkBoundary, previewRoot } from './check-boundary.mjs';

let overrides = {};
if (process.argv.length > 2) {
  if (process.argv[2] !== '--probe' || process.argv.length !== 4) throw new Error('unsupported fixture arguments');
  overrides = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
  if (!overrides || Array.isArray(overrides) || Object.entries(overrides).some(([key,value]) =>
    key.startsWith('/') || key.includes('..') || key.includes('\\') || typeof value !== 'string')) throw new Error('invalid build fixtures');
}
const readOutput = file => overrides[path.relative(path.join(previewRoot, 'dist'), file).split(path.sep).join('/')] ?? fs.readFileSync(file,'utf8');
const result = checkBoundary();
if (!result.ok) { console.error('Source boundary failed'); process.exitCode = 1; }
else {
  const errors = [];
  const dist = path.join(previewRoot, 'dist');
  const paths = [];
  function inside(file) {
    const rel = path.relative(dist, file);
    return rel !== '..' && !rel.startsWith('..' + path.sep) && !path.isAbsolute(rel);
  }
  function local(file, value) {
    if (!value || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value) || value.includes('\\') || /[?#]/.test(value)) { errors.push('external/opaque emitted resource'); return; }
    const target = value.startsWith('/') ? path.join(dist, value.slice(1)) : path.resolve(path.dirname(file), value);
    if (!inside(target) || !fs.existsSync(target) || !fs.lstatSync(target).isFile() || path.resolve(fs.realpathSync(target)) !== target) errors.push('missing/redirected emitted resource');
  }
  let documentationStrings = 0;
  const allowedNonResourceUrls = [
    'http://www.w3.org/1999/xhtml', 'http://www.w3.org/2000/svg', 'http://www.w3.org/1998/Math/MathML',
    'http://www.w3.org/1999/xlink', 'http://www.w3.org/XML/1998/namespace',
  ];
  const denied = new Set(['fetch','WebSocket','EventSource','XMLHttpRequest','sendBeacon','importScripts']);
  function inspectJs(file, text) {
    const ast=ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    if(ast.parseDiagnostics.length) errors.push('emitted JS parse error');
    function visit(node) {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier) errors.push('unexpected emitted dependency');
      }
      if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && ['require','eval','Function'].includes(node.expression.text)))) errors.push('unknown emitted dynamic capability');
      if (ts.isIdentifier(node) && denied.has(node.text)) errors.push('emitted network capability');
      if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) &&
          node.expression.text === 'process' && node.name.text === 'env') errors.push('emitted environment reference');
      if (ts.isMetaProperty(node)) errors.push('emitted meta/environment reference');
      if (ts.isStringLiteral(node) && /(?:https?:\/\/|\/\/[a-z])/i.test(node.text)) {
        if (allowedNonResourceUrls.includes(node.text) || node.text.startsWith('https://react.dev/errors/') ||
            node.text.startsWith('https://react.dev/link/')) documentationStrings++;
        else errors.push('unexpected URL in emitted JS');
      }
      ts.forEachChild(node,visit);
    }
    visit(ast);
  }
  function walk(dir) {
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
      const file=path.join(dir,entry.name);
      if(entry.isSymbolicLink()) {errors.push('emitted symlink');continue;}
      if(entry.isDirectory()) {walk(file);continue;}
      paths.push(path.relative(dist,file).split(path.sep).join('/'));
      const text=readOutput(file);
      if(file.endsWith('.js')) inspectJs(file,text);
      else if(file.endsWith('.css')) {
        const css=postcss.parse(text,{from:file,map:false});
        css.walkComments(comment=>{if(/sourceMappingURL|sourceURL/i.test(comment.text))errors.push('source-map annotation refused');});
        css.walkAtRules(rule=>{if(rule.name.toLowerCase()==='import')errors.push('unexpected emitted CSS import');});
        css.walkDecls(decl=>{
          if(decl.value.includes('\\'))errors.push('opaque emitted CSS');
          values(decl.value).walk(node=>{
            if(node.type==='function' && node.value.toLowerCase()==='url') {
              if(node.nodes.length!==1 || !['word','string'].includes(node.nodes[0].type))errors.push('opaque emitted URL');
              else local(file,node.nodes[0].value);
            }
          });
        });
      } else if(file.endsWith('.html')) {
        const ast=parseHtml(text,{onParseError:()=>errors.push('emitted HTML parse error')});
        function visit(node) {
          const attrs=Object.fromEntries((node.attrs??[]).map(attr=>[attr.name,attr.value]));
          if(node.tagName==='script' && attrs.type!=='module')errors.push('unexpected emitted script');
          for(const [key,value]of Object.entries(attrs)){
            if(['src','href'].includes(key))local(file,value);
            if(key.startsWith('on') || ['srcset','action','formaction'].includes(key))errors.push('unexpected emitted handler/resource');
          }
          for(const child of node.childNodes??[])visit(child);
        }
        visit(ast);
      } else if(path.basename(file)!=='manifest.json')errors.push('unexpected emitted file');
    }
  }
  try {
    walk(dist);
    const manifest=JSON.parse(readOutput(path.join(dist,'.vite/manifest.json')));
    const entries=Object.entries(manifest);
    if(entries.length!==1 || entries[0][0]!=='index.html' || !entries[0][1].isEntry ||
       (entries[0][1].imports?.length??0)!==0 || (entries[0][1].dynamicImports?.length??0)!==0)errors.push('unexpected bundle entry graph');
    const entry=entries[0][1];
    const approved=new Set(['index.html','.vite/manifest.json',entry.file,...(entry.css??[])]);
    if(paths.length!==approved.size || paths.some(file=>!approved.has(file)))errors.push('emitted files differ from manifest');
  } catch {errors.push('Build output inspection could not complete');}
  for(const message of [...new Set(errors)])console.error(message);
  console.log('Reviewed React diagnostic/namespace URL literals: '+documentationStrings);
  console.log(errors.length===0?'STATIC_BUILD_PASS (not runtime/network proof)':'STATIC_BUILD_FAIL');
  process.exitCode=errors.length===0?0:1;
}
