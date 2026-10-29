import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { resolveSnapshotImport } from './snapshot-import-resolver.mjs';
import crypto from 'node:crypto';
import { captureInputs, verifyInputs } from './build-input-boundary.mjs';
import { checkBoundary, previewRoot } from './check-boundary.mjs';

// AST interpretation only: no eval, Function, vm, require, or module execution.
export function createStaticHarness({ inspect = checkBoundary, snapshot = captureInputs(previewRoot) } = {}) {
 verifyInputs(previewRoot,snapshot);
 const records=Object.fromEntries(Object.entries(snapshot).map(([key,item])=>{
  if(item.target!==path.resolve(previewRoot,key) || item.hash!==crypto.createHash('sha256').update(item.text).digest('hex'))throw new Error('snapshot content mismatch');
  return [key,Object.freeze({...item})];
 }));
 const allOverrides=Object.fromEntries(Object.entries(records).map(([key,item])=>['tools/ui-preview/'+key,item.text]));
 const sources=Object.fromEntries(Object.entries(records).filter(([key])=>key.startsWith('src/') && /\.tsx?$/.test(key)).map(([key,item])=>[key,item.text]));
 const harness=inspectSnapshot(sources,overrides=>inspect({...allOverrides,...overrides}));
 verifyInputs(previewRoot,records);
 return harness;
}
export function inspectSnapshot(input, inspect = checkBoundary, compared = input) {
 const sources=Object.freeze({...input});
 if(JSON.stringify(sources)!==JSON.stringify(compared))throw new Error('inspection source mismatch');
 const overrides=Object.fromEntries(Object.entries(sources).map(([p,s])=>['tools/ui-preview/'+p,s]));
 let result;try{result=inspect(overrides);}catch{throw new Error('inspection error');}
 if(!result || result.ok!==true)throw new Error('boundary rejected before interpretation');
 const modules=new Map();const active=new Set();const interpretedFunctions=new WeakSet();
 function load(relative) {
  if(!Object.hasOwn(sources,relative))throw new Error('unknown dependency');
  if(active.has(relative))throw new Error('cyclic dependency');
  if(modules.has(relative))return modules.get(relative);
  const ast=ts.createSourceFile(relative,sources[relative],ts.ScriptTarget.Latest,true);
  if(ast.parseDiagnostics.length)throw new Error('uninspectable');
  const env={};const exported={};active.add(relative);
  try {
  function expression(n, scope) {
   if(ts.isParenthesizedExpression(n)||ts.isAsExpression(n)||ts.isSatisfiesExpression(n))return expression(n.expression,scope);
   if(n.kind===ts.SyntaxKind.TrueKeyword)return true;
   if(n.kind===ts.SyntaxKind.FalseKeyword)return false;
   if(ts.isStringLiteral(n)||ts.isNumericLiteral(n))return ts.isNumericLiteral(n)?Number(n.text):n.text;
   if(ts.isIdentifier(n)){if(n.text==='undefined')return undefined;if(!Object.hasOwn(scope,n.text))throw new Error('unknown binding');return scope[n.text];}
   if(ts.isObjectLiteralExpression(n)){const out={};for(const p of n.properties){if(!ts.isPropertyAssignment(p)||!ts.isIdentifier(p.name))throw new Error('opaque object');out[p.name.text]=expression(p.initializer,scope);}return out;}
   if(ts.isPropertyAccessExpression(n)){const value=expression(n.expression,scope);if(value===null||value===undefined||!Object.hasOwn(value,n.name.text))throw new Error('unknown property');return value[n.name.text];}
   if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.EqualsEqualsEqualsToken)return expression(n.left,scope)===expression(n.right,scope);
   if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)){
    const opening=ts.isJsxElement(n)?n.openingElement:n;
    if(!ts.isIdentifier(opening.tagName))throw new Error('opaque tag');
    const tag=opening.tagName.text;const props={};
    for(const a of opening.attributes.properties){if(!ts.isJsxAttribute(a)||!a.initializer||!ts.isStringLiteral(a.initializer))throw new Error('opaque attribute');props[a.name.text]=a.initializer.text;}
    const children=ts.isJsxElement(n)?n.children.map(c=>{
     if(ts.isJsxText(c))return c.text.replace(/\s+/g,' ').trim();
     if(ts.isJsxExpression(c))return c.expression?expression(c.expression,scope):'';
     return expression(c,scope);
    }).filter(c=>c!==''):[];
    props.children=children.length===1?children[0]:children;
    return {type:/^[a-z]/.test(tag)?tag:expression(opening.tagName,scope),props};
   }
   throw new Error('unsupported AST expression');
  }
  function validateExpression(n) {
   if(!n)throw new Error('missing AST expression');
   if(ts.isParenthesizedExpression(n)||ts.isAsExpression(n)||ts.isSatisfiesExpression(n))return validateExpression(n.expression);
   if(ts.isIdentifier(n)||ts.isStringLiteral(n)||ts.isNumericLiteral(n)||
      n.kind===ts.SyntaxKind.TrueKeyword||n.kind===ts.SyntaxKind.FalseKeyword)return;
   if(ts.isPropertyAccessExpression(n))return validateExpression(n.expression);
   if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.EqualsEqualsEqualsToken){
    validateExpression(n.left);validateExpression(n.right);return;
   }
   if(ts.isObjectLiteralExpression(n)){
    for(const p of n.properties){if(!ts.isPropertyAssignment(p)||!ts.isIdentifier(p.name))throw new Error('opaque object');validateExpression(p.initializer);}return;
   }
   if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)){
    const opening=ts.isJsxElement(n)?n.openingElement:n;
    if(!ts.isIdentifier(opening.tagName))throw new Error('opaque tag');
    for(const a of opening.attributes.properties)if(!ts.isJsxAttribute(a)||!a.initializer||!ts.isStringLiteral(a.initializer))throw new Error('opaque attribute');
    if(ts.isJsxElement(n))for(const c of n.children){
     if(ts.isJsxText(c))continue;
     if(ts.isJsxExpression(c)){if(c.expression)validateExpression(c.expression);}else validateExpression(c);
    }return;
   }
   throw new Error('unsupported AST expression');
  }
  function validateStatement(n) {
   if(ts.isReturnStatement(n)){validateExpression(n.expression);return;}
   if(ts.isIfStatement(n)){validateExpression(n.expression);validateStatement(n.thenStatement);if(n.elseStatement)validateStatement(n.elseStatement);return;}
   if(ts.isBlock(n)){for(const s of n.statements)validateStatement(s);return;}
   throw new Error('unsupported AST statement');
  }
  function statement(n,scope){
   if(ts.isReturnStatement(n))return {returned:true,value:expression(n.expression,scope)};
   if(ts.isIfStatement(n)){const condition=expression(n.expression,scope);if(typeof condition!=='boolean')throw new Error('condition must be boolean');if(condition)return statement(n.thenStatement,scope);return n.elseStatement?statement(n.elseStatement,scope):null;}
   if(ts.isBlock(n)){for(const s of n.statements){const r=statement(s,scope);if(r?.returned)return r;}return null;}
   throw new Error('unsupported AST statement');
  }
  for(const n of ast.statements){
   if(n.modifiers?.some(m=>m.kind===ts.SyntaxKind.DefaultKeyword))throw new Error('unsupported default export');
   if(ts.isImportDeclaration(n)){
    if(n.importClause?.isTypeOnly)continue;
    const spec=n.moduleSpecifier.text;
    if(!spec.startsWith('.'))throw new Error('runtime dependency denied');
    const base=path.posix.normalize(path.posix.join(path.posix.dirname(relative),spec));
    const target=resolveSnapshotImport(sources,relative,spec);
    if(!target)throw new Error('runtime dependency denied');
    const dependency=load(target);
    if(!n.importClause?.namedBindings||!ts.isNamedImports(n.importClause.namedBindings))throw new Error('import shape denied');
    for(const b of n.importClause.namedBindings.elements){if(b.isTypeOnly)continue;const key=(b.propertyName??b.name).text;if(!Object.hasOwn(dependency,key))throw new Error('missing export');env[b.name.text]=dependency[key];}
   } else if(ts.isTypeAliasDeclaration(n))continue;
   else if(ts.isVariableStatement(n)){for(const d of n.declarationList.declarations){if(!ts.isIdentifier(d.name)||!d.initializer)throw new Error('variable shape denied');env[d.name.text]=expression(d.initializer,env);if(n.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword))exported[d.name.text]=env[d.name.text];}}
   else if(ts.isFunctionDeclaration(n)){
    if(n.asteriskToken || n.modifiers?.some(m=>m.kind!==ts.SyntaxKind.ExportKeyword))throw new Error('unsupported function modifier');
    if(!n.name||n.parameters.length!==1||!ts.isObjectBindingPattern(n.parameters[0].name))throw new Error('function shape denied');
    validateStatement(n.body);
    const bindings=n.parameters[0].name.elements;
    const fn=props=>{const scope={...env};for(const b of bindings){if(!ts.isIdentifier(b.name)||b.initializer)throw new Error('parameter denied');scope[b.name.text]=props[(b.propertyName??b.name).text];}const r=statement(n.body,scope);if(!r?.returned)throw new Error('missing return');return r.value;};
    interpretedFunctions.add(fn);env[n.name.text]=fn;if(n.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword))exported[n.name.text]=fn;
   } else throw new Error('unsupported module statement');
  }
  active.delete(relative);Object.freeze(exported);modules.set(relative,exported);return exported;
  } catch(error){active.delete(relative);modules.delete(relative);throw error;}
 }
 return Object.freeze({load, source:relative=>sources[relative], isComponent:fn=>interpretedFunctions.has(fn)});
}
