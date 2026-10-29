import path from 'node:path';
import crypto from 'node:crypto';
import ts from 'typescript';
const extensions=new Set(['.ts','.tsx','.js','.jsx','.mjs','.cjs','.mts','.cts','.css']);
const forbiddenDirectories=new Set(['dist','.vite-cache','node_modules','.git','.next']);
const sha=text=>crypto.createHash('sha256').update(text,'utf8').digest('hex');

// Candidate resolver/load contract only. NOT registered with Vite: internal
// HTML/CSS/package/config reads and generated CommonJS modules remain unaudited.
export function createVerifiedInputGate(root,input) {
 root=path.resolve(root);
 const files=Object.freeze(Object.fromEntries(Object.entries(input).map(([key,item])=>{
  if(typeof item.text!=='string' || item.hash!==sha(item.text) ||
     item.target!==path.resolve(root,key) || key.includes('\\') ||
     path.relative(root,item.target).split(path.sep).join('/')!==key)throw new Error('invalid snapshot record');
  return [key,Object.freeze({...item})];
 })));
 function lookup(id) {
  if(typeof id!=='string' || !path.isAbsolute(id) || /[?#\0]/.test(id) || path.resolve(id)!==id)throw new Error('opaque input');
  const key=path.relative(root,id).split(path.sep).join('/');
  if(key!=='index.html' && (!key.startsWith('src/') || !extensions.has(path.extname(id))))throw new Error('unapproved input kind');
  if(key.split('/').some(part=>forbiddenDirectories.has(part)))throw new Error('excluded input');
  if(!Object.hasOwn(files,key) || files[key].target!==id)throw new Error('uninspected input');
  return files[key];
 }
 function resolve(spec,importer,actual) {
  lookup(importer);
  if(typeof spec!=='string' || !spec.startsWith('.') || /[?#\0\\]/.test(spec))throw new Error('unapproved export, alias or virtual module');
  const base=path.resolve(path.dirname(importer),spec);
  const candidates=path.extname(base)?[base]:[
   base,...['.ts','.tsx','.js','.jsx','.mjs','.mts'].map(ext=>base+ext),
   ...['.ts','.tsx','.js','.jsx'].map(ext=>path.join(base,'index'+ext)),
  ];
  const matches=candidates.filter(file=>{
   try{lookup(file);return true;}catch{return false;}
  });
  if(matches.length!==1 || actual!==matches[0])throw new Error('unresolved, ambiguous or divergent input');
  lookup(actual);
  return actual;
 }
 function transformed(code,id,actualResolutions={}) {
  lookup(id);
  if(path.extname(id)==='.css' || id===path.join(root,'index.html'))throw new Error('HTML/CSS transform route not audited');
  const ast=ts.createSourceFile(id,code,ts.ScriptTarget.Latest,true);
  if(ast.parseDiagnostics.length)throw new Error('uninspectable transform');
  function visit(node) {
   if(ts.isCallExpression(node) && (node.expression.kind===ts.SyntaxKind.ImportKeyword ||
      ts.isIdentifier(node.expression) && node.expression.text==='require'))throw new Error('dynamic or require transform dependency');
   if(ts.isImportDeclaration(node) || ts.isExportDeclaration(node) && node.moduleSpecifier) {
    if(!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier))throw new Error('opaque transform dependency');
    const spec=node.moduleSpecifier.text;
    resolve(spec,id,actualResolutions[spec]);
   }
   ts.forEachChild(node,visit);
  }
  visit(ast);
  return true;
 }
 return Object.freeze({
  resolve,
  load(id){return lookup(id).text;}, // Always frozen text; never rereads disk.
  transformed,
  executionAuthorized:false,
  unresolvedRoutes:Object.freeze(['Vite internal HTML/CSS/asset reads','browser package exports and JSX runtime',
   'ReactDOM scheduler dependency','CommonJS generated virtual modules','configuration and plugin execution']),
 });
}
