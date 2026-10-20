import path from 'node:path';
import ts from 'typescript';
// Shared, filesystem-free resolver for the limited TS/TSX snapshot language.
// Ambiguity is refused rather than depending on resolver search order.
export function resolveSnapshotImport(sources, importer, spec) {
 if(typeof spec!=='string' || !spec.startsWith('.') || /[\\?#\0]/.test(spec))throw new Error('runtime dependency denied');
 const base=path.posix.normalize(path.posix.join(path.posix.dirname(importer),spec));
 if(!base.startsWith('src/') || base.split('/').some(p=>['dist','.vite-cache','node_modules','.git','.next'].includes(p)))throw new Error('runtime dependency denied');
 const extension=path.posix.extname(base);
 const candidates=extension ? (/^\.tsx?$/.test(extension)?[base]:[]) :
  [base+'.ts',base+'.tsx',base+'/index.ts',base+'/index.tsx'];
 const matches=candidates.filter(p=>Object.hasOwn(sources,p));
 if(matches.length!==1)throw new Error('runtime dependency denied: missing or ambiguous');
 return matches[0];
}

export function assertGalleryImports(snapshot) {
 for(const [key,record]of Object.entries(snapshot)){
  if(!key.startsWith('src/'))continue;
  if(/\.(?:js|jsx|mjs|cjs|mts|cts)$/.test(key))throw new Error('gallery requires TS/TSX sources');
  if(!/\.tsx?$/.test(key))continue;
  const ast=ts.createSourceFile(key,record.text,ts.ScriptTarget.Latest,true);
  if(ast.parseDiagnostics.length)throw new Error('gallery source parse error');
  function visit(n){
   if(ts.isImportDeclaration(n)||ts.isExportDeclaration(n)){
    if(n.moduleSpecifier){
     if(!ts.isStringLiteral(n.moduleSpecifier))throw new Error('opaque gallery import');
     const spec=n.moduleSpecifier.text;
     // main is inspected but not interpreted; these two runtime packages are
     // its fixed, separately checked React entry imports.
     if(key==='src/main.tsx' && ['react','react-dom/client','./styles.css'].includes(spec)){}
     else resolveSnapshotImport(snapshot,key,spec);
    }
   }
   if(ts.isImportEqualsDeclaration(n)||ts.isImportTypeNode(n) ||
      ts.isCallExpression(n)&&(n.expression.kind===ts.SyntaxKind.ImportKeyword || ts.isIdentifier(n.expression)&&n.expression.text==='require'))throw new Error('unsupported gallery dependency form');
   ts.forEachChild(n,visit);
  }
  visit(ast);
 }
 return true;
}
