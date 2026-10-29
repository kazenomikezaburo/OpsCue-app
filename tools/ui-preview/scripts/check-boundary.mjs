import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import ts from 'typescript';
import { resolveSnapshotImport } from './snapshot-import-resolver.mjs';
import postcss from 'postcss';
import values from 'postcss-value-parser';
import { parse as parseHtml } from 'parse5';

export const previewRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const repoRoot = path.resolve(previewRoot, '../..');
const sourceRoot = path.join(previewRoot, 'src');
const scriptExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts']);
const dependencies = ['react', 'react-dom'];
const forbiddenIdentifiers = new Set([
  'fetch', 'WebSocket', 'EventSource', 'XMLHttpRequest', 'Worker', 'SharedWorker',
  'navigator', 'process', 'globalThis', 'window', 'self', 'global', 'location',
  'eval', 'Function', 'Reflect', 'importScripts', 'Image', 'Audio',
]);
const forbiddenProperties = new Set([
  'constructor', '__proto__', 'prototype', 'defaultView', 'ownerDocument',
  'sendBeacon', 'fetch', 'WebSocket', 'EventSource', 'env',
]);
const expectedConfig = "import { defineConfig } from \"vite\";\nimport { fileURLToPath } from \"node:url\";\nconst root = fileURLToPath(new URL(\".\", import.meta.url));\nexport default defineConfig({\n  root, envDir: false, publicDir: false, cacheDir: \".vite-cache\",\n  css: { postcss: { plugins: [] } },\n  server: {\n    host: \"127.0.0.1\", port: 5178, strictPort: true,\n    cors: false, allowedHosts: [\"127.0.0.1\"],\n    fs: { strict: true, allow: [root] }\n  },\n  preview: { host: \"127.0.0.1\", port: 5178, strictPort: true },\n  build: {\n    outDir: \"dist\", emptyOutDir: true,\n    modulePreload: { polyfill: false },\n    manifest: true, sourcemap: false\n  },\n  esbuild: { jsx: \"automatic\" }\n});\n";
const normalize = text => text.replace(/\r\n/g, '\n');
const digest = text => crypto.createHash('sha256').update(normalize(text)).digest('hex');
function inside(root, file) {
  const rel = path.relative(root, file);
  return rel === '' || (!path.isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + path.sep));
}
function readJson(file, read) {
  const text = read(file);
  const ast = ts.parseJsonText(file, text);
  if (ast.parseDiagnostics.length) throw new Error('invalid JSON');
  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const keys = new Set();
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property) || !property.name) throw new Error('unsupported JSON property');
        const key = property.name.text;
        if (keys.has(key)) throw new Error('duplicate JSON key');
        keys.add(key);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return JSON.parse(text);
}
function collect(root, errors, skipPreview = false) {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.git', '.next', 'dist', '.vite-cache'].includes(entry.name)) continue;
      const file = path.join(dir, entry.name);
      if (skipPreview && inside(previewRoot, file)) continue;
      if (entry.isSymbolicLink()) { errors.push('symlink: ' + path.relative(repoRoot, file)); continue; }
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile()) files.push(file);
      else errors.push('unsupported filesystem entry');
    }
  }
  walk(root);
  return files;
}

export function checkBoundary(overrides = {}) {
  const errors = [];
  const fail = (file, message) => errors.push(path.relative(repoRoot, file) + ': ' + message);
  const read = file => overrides[path.relative(repoRoot, file).split(path.sep).join('/')] ?? fs.readFileSync(file, 'utf8');
  try {
    // Trusted tooling is not imported into the preview/browser graph. It requires
    // separate review; these inspectors parse source and never execute fixtures.
    if (fs.lstatSync(previewRoot).isSymbolicLink() || fs.realpathSync(previewRoot) !== previewRoot) {
      throw new Error('preview root redirected');
    }
    const pkg = readJson(path.join(previewRoot, 'package.json'), read);
    const lock = readJson(path.join(previewRoot, 'package-lock.json'), read);
    if (!pkg.private || pkg.type !== 'module' || pkg.engines.node !== '22.23.3' ||
        pkg.engines.npm !== '10.9.9' || pkg.packageManager !== 'npm@10.9.9') throw new Error('package policy');
    const expectedScripts = {
      'check:boundary': 'node scripts/check-boundary.mjs',
      'test:boundary': 'node --test scripts/check-boundary.test.mjs',
      typecheck: 'tsc --noEmit', build: 'node scripts/check-build-input.mjs',
    };
    if (JSON.stringify(pkg.scripts) !== JSON.stringify(expectedScripts)) throw new Error('unexpected executable script');
    const approvedNames = new Set(['react', 'react-dom', 'vite', 'typescript', '@types/react',
      '@types/react-dom', 'postcss', 'postcss-value-parser', 'parse5']);
    for (const group of ['dependencies', 'devDependencies']) {
      for (const [name, version] of Object.entries(pkg[group] ?? {})) {
        if (!approvedNames.has(name) || !/^\d+\.\d+\.\d+$/.test(version) ||
            lock.packages[''][group]?.[name] !== version ||
            lock.packages['node_modules/' + name]?.version !== version) throw new Error('dependency/lock policy');
      }
    }
    if (lock.lockfileVersion !== 3) throw new Error('lock version');
    for (const item of Object.values(lock.packages)) {
      if (item.link) throw new Error('linked dependency');
      if (item.resolved && new URL(item.resolved).origin !== 'https://registry.npmjs.org') throw new Error('external dependency');
      if (item.resolved && !item.integrity?.startsWith('sha512-')) throw new Error('missing package integrity');
    }
    const configFile = path.join(previewRoot, 'vite.config.ts');
    if (digest(read(configFile)) !== digest(expectedConfig)) fail(configFile, 'configuration differs from reviewed allowlist');
    const configAst = ts.createSourceFile(configFile, read(configFile), ts.ScriptTarget.Latest, true);
    if (configAst.parseDiagnostics.length) fail(configFile, 'invalid configuration syntax');
    for (const name of ['.env', '.env.local', '.env.development', '.env.development.local', '.npmrc']) {
      if (fs.existsSync(path.join(previewRoot, name))) fail(previewRoot, 'unapproved environment/config file');
    }
    const tc = readJson(path.join(previewRoot, 'tsconfig.json'), read);
    if (tc.extends || tc.references || JSON.stringify(tc.include) !== '["src"]') throw new Error('tsconfig scope');
    const permittedOptions = new Set(['target','module','moduleResolution','jsx','strict','noEmit','skipLibCheck','paths','baseUrl']);
    if (Object.keys(tc.compilerOptions).some(key => !permittedOptions.has(key))) throw new Error('unsupported compiler option');
    if (tc.compilerOptions.baseUrl && tc.compilerOptions.baseUrl !== '.') throw new Error('alias base outside preview');
    for (const key of Object.keys(tc.compilerOptions.paths ?? {})) { if (/^(react|react-dom)(\/|$)/.test(key)) throw new Error('package alias override'); }
    for (const targets of Object.values(tc.compilerOptions.paths ?? {})) {
      if (!Array.isArray(targets) || targets.length !== 1 || !targets[0].startsWith('src/') ||
          !inside(sourceRoot, path.resolve(previewRoot, targets[0].replaceAll('*', 'placeholder')))) throw new Error('alias outside src');
    }
    const parsed = ts.parseJsonConfigFileContent(tc, ts.sys, previewRoot);
    if (parsed.errors.length) throw new Error('tsconfig cannot resolve');
    const require = createRequire(path.join(previewRoot, 'package.json'));
    const sourceFiles = collect(sourceRoot, errors);
    const inspectedSources = new Set(sourceFiles.map(file => path.resolve(file)));
    // Overrides are inspection fixtures, never a way to approve unenumerated files.
    for (const key of Object.keys(overrides)) {
      const file = path.resolve(repoRoot, key);
      if (inside(sourceRoot, file) && (!inspectedSources.has(file) || key !== path.relative(repoRoot, file).split(path.sep).join('/'))) fail(file, 'uninspected or noncanonical snapshot source');
    }
    // Unknown code/resource/config files are not implicitly approved.
    const approvedRootFiles = new Set(['package.json','package-lock.json','vite.config.ts','tsconfig.json','index.html','.gitignore','README.md']);
    for (const file of collect(previewRoot, errors)) {
      const rel = path.relative(previewRoot, file).split(path.sep).join('/');
      if (!inside(sourceRoot, file) && !rel.startsWith('scripts/') && !approvedRootFiles.has(rel)) fail(file, 'unreviewed file');
    }
    const resolvedHost = { ...ts.sys, readFile: file => {
      try { return read(file); } catch { return undefined; }
    }};
    function localResource(file, reference) {
      if (!reference || reference.includes('\\') || /[?#]/.test(reference) ||
          /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference)) { fail(file, 'external/opaque resource'); return; }
      const target = reference.startsWith('/') ? path.join(previewRoot, reference.slice(1)) : path.resolve(path.dirname(file), reference);
      if (!inside(sourceRoot, target) || !inspectedSources.has(path.resolve(target)) || !fs.existsSync(target) ||
          !fs.lstatSync(target).isFile() || fs.realpathSync(target) !== target) fail(file, 'resource outside reviewed source');
    }
    function moduleReference(file, spec, production = false) {
      if (production) {
        const target = spec.startsWith('.') ? path.resolve(path.dirname(file), spec) :
          spec.startsWith('@/') ? path.resolve(repoRoot, spec.slice(2)) : undefined;
        if ((target && inside(previewRoot, target)) || spec.includes('ui-preview')) fail(file, 'production reverse import');
        const rootOptions = { baseUrl: repoRoot, paths: { '@/*': ['./*'] }, moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext };
        const found = ts.resolveModuleName(spec, file, rootOptions, resolvedHost).resolvedModule;
        if (found && (inside(previewRoot, found.resolvedFileName) || (fs.existsSync(found.resolvedFileName) && inside(previewRoot, fs.realpathSync(found.resolvedFileName))))) fail(file, 'resolved reverse import');
        return;
      }
      if (spec === 'react' || spec === 'react-dom/client') {
        // createRequire resolves package exports without executing the package.
        const runtime = require.resolve(spec);
        const packageName = spec === 'react' ? 'react' : 'react-dom';
        const allowed = path.join(previewRoot, 'node_modules', packageName);
        if (!inside(allowed, runtime) || fs.realpathSync(runtime) !== runtime) fail(file, 'package export redirected');
        return;
      }
      if (spec.endsWith('.css')) { localResource(file, spec); return; }
      const found = ts.resolveModuleName(spec, file, parsed.options, resolvedHost).resolvedModule;
      if (spec.startsWith('.') && found && /\.tsx?$/.test(found.resolvedFileName)) {
        const files=Object.fromEntries(sourceFiles.map(p=>[path.relative(previewRoot,p).split(path.sep).join('/'),true]));
        try {
          const selected=resolveSnapshotImport(files,path.relative(previewRoot,file).split(path.sep).join('/'),spec);
          if(path.resolve(previewRoot,selected)!==path.resolve(found.resolvedFileName))fail(file,'divergent snapshot resolution');
        } catch { fail(file,'missing or ambiguous snapshot resolution'); }
      }
      if (!found || !inside(sourceRoot, found.resolvedFileName) ||
          !inspectedSources.has(path.resolve(found.resolvedFileName)) ||
          !scriptExtensions.has(path.extname(found.resolvedFileName)) ||
          !fs.existsSync(found.resolvedFileName) || path.resolve(fs.realpathSync(found.resolvedFileName)) !== path.resolve(found.resolvedFileName)) {
        fail(file, 'unresolved or unapproved module');
      }
    }
    function inspectScript(file, production = false) {
      const ast = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
      if (ast.parseDiagnostics.length) { fail(file, 'script syntax uninspectable'); return; }
      function ref(expression) {
        if (!expression || !ts.isStringLiteral(expression)) { fail(file, 'unknown module reference'); return; }
        moduleReference(file, expression.text, production);
      }
      if (!production && (ast.referencedFiles.length || ast.typeReferenceDirectives.length || ast.libReferenceDirectives.length)) fail(file, 'external type/reference directive');
      const isMain = path.resolve(file) === path.join(sourceRoot, 'main.tsx');
      const expectedMain = 'import { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport { PreviewApp } from "./PreviewApp";\nimport "./styles.css";\nconst element = document.getElementById("root");\nif (!element) throw new Error("Preview root missing");\ncreateRoot(element).render(<StrictMode><PreviewApp /></StrictMode>);';
      // Exact AST allowlist binds the export, import, declarations, position and arguments.
      // Extra scopes, aliases and redefinitions cannot match this reviewed entry.
      const printer = ts.createPrinter();
      if (!production && isMain && printer.printFile(ast) !== printer.printFile(ts.createSourceFile('main.tsx', expectedMain, ts.ScriptTarget.Latest, true))) fail(file, 'entry binding/call differs from reviewed AST');
      function visit(node) {
        if (ts.isImportTypeNode(node)) {
          if (ts.isLiteralTypeNode(node.argument)) ref(node.argument.literal);
          else fail(file, 'unknown type import');
        }
        if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
          if (node.moduleSpecifier) ref(node.moduleSpecifier);
          if (!production && node.attributes) fail(file, 'import attributes unsupported');
        }
        if (ts.isImportEqualsDeclaration(node)) {
          if (ts.isExternalModuleReference(node.moduleReference)) ref(node.moduleReference.expression);
          else fail(file, 'import alias unsupported');
        }
        if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
            (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
          ref(node.arguments[0]);
          if (!production) fail(file, 'dynamic import/require forbidden');
        }
        if (!production) {
          if (ts.isJsxSpreadAttribute(node) || ts.isSpreadAssignment(node)) fail(file, 'opaque spread unsupported');
          if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
            if (!ts.isIdentifier(node.tagName)) fail(file, 'opaque JSX component');
            else if (/^[a-z]/.test(node.tagName.text) && !['main','header','h1','h2','p','section','article','small','div','span'].includes(node.tagName.text)) fail(file, 'unapproved HTML capability');
          }
          if (ts.isJsxAttribute(node) && !['className','id','aria-label','role'].includes(node.name.getText(ast))) fail(file, 'unapproved JSX attribute');
          if (ts.isIdentifier(node) && forbiddenIdentifiers.has(node.text)) fail(file, 'forbidden global/API reference');
          if (ts.isIdentifier(node) && forbiddenProperties.has(node.text)) fail(file, 'forbidden property/capability');
          if (ts.isElementAccessExpression(node)) fail(file, 'computed access unsupported');
          if (ts.isMetaProperty(node)) fail(file, 'meta/environment reference unsupported');
          if (ts.isStringLiteral(node) && node.text === 'use server') fail(file, 'server action');
          if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) &&
              node.expression.text === 'document' && node.name.text !== 'getElementById') fail(file, 'unapproved DOM capability');
          if (ts.isJsxAttribute(node) && /^(?:action|formAction|src|href|srcSet|dangerouslySetInnerHTML)$/i.test(node.name.getText(ast))) {
            fail(file, 'interactive/resource JSX capability');
          }
          if (!isMain && ts.isCallExpression(node)) fail(file, 'runtime call outside reviewed entry');
          if (!isMain && ts.isIdentifier(node) && node.text === 'createRoot') fail(file, 'entry binding outside main');
          if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
              !['getElementById', 'render'].includes(node.expression.name.text)) fail(file, 'unapproved member invocation');
          if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text !== 'createRoot') {
            fail(file, 'unapproved function invocation');
          }
          if (ts.isNewExpression(node) && (!ts.isIdentifier(node.expression) || node.expression.text !== 'Error')) fail(file, 'unapproved constructor');
        }
        ts.forEachChild(node, visit);
      }
      visit(ast);
    }
    function inspectCss(file) {
      const ast = postcss.parse(read(file), { from: file, map: false });
      function inspectValue(value, isImport = false) {
        const tree = values(value);
        if (value.includes('\\')) fail(file, 'CSS escapes unsupported');
        tree.walk(node => {
          if (node.type === 'function' && ['url','src','image-set','-webkit-image-set'].includes(node.value.toLowerCase())) {
            if (node.value.toLowerCase() !== 'url' || node.nodes.length !== 1 ||
                !['word','string'].includes(node.nodes[0].type)) { fail(file, 'opaque CSS resource'); return false; }
            localResource(file, node.nodes[0].value);
          }
        });
        if (isImport) {
          const first = tree.nodes.find(node => node.type !== 'space' && node.type !== 'comment');
          if (first?.type === 'string') localResource(file, first.value);
          else if (first?.type !== 'function' || first.value.toLowerCase() !== 'url') fail(file, 'unknown CSS import');
        }
      }
      ast.walkComments(comment => { if (/sourceMappingURL|sourceURL/i.test(comment.text)) fail(file, 'source-map annotation refused'); });
      ast.walkAtRules(rule => {
        if (!['media','import','supports','keyframes','font-face','layer','charset'].includes(rule.name.toLowerCase())) fail(file, 'unsupported CSS at-rule');
        inspectValue(rule.params, rule.name.toLowerCase() === 'import');
      });
      ast.walkDecls(decl => inspectValue(decl.value));
    }
    function inspectHtml(file) {
      const parseErrors = [];
      const ast = parseHtml(read(file), { onParseError: error => parseErrors.push(error.code) });
      if (parseErrors.length) fail(file, 'HTML parser error');
      let entries = 0;
      function visit(node) {
        if (node.tagName && !['html','head','meta','title','body','div','script'].includes(node.tagName)) fail(file, 'unapproved HTML element');
        const attrs = Object.fromEntries((node.attrs ?? []).map(attr => [attr.name, attr.value]));
        if (node.tagName === 'script') {
          if (attrs.type !== 'module' || attrs.src !== '/src/main.tsx' || Object.keys(attrs).length !== 2) fail(file, 'unapproved script entry');
          else entries++;
          if ((node.childNodes ?? []).some(child => child.nodeName === '#text' && child.value.trim())) fail(file, 'inline script');
        }
        for (const [name, value] of Object.entries(attrs)) {
          if (name.startsWith('on') || ['href','srcset','action','formaction','style'].includes(name)) fail(file, 'unapproved HTML resource/handler');
          if (name === 'src') localResource(file, value);
          if (name === 'http-equiv' && value.toLowerCase() !== 'content-security-policy') fail(file, 'HTML redirect/unknown policy');
        }
        for (const child of node.childNodes ?? []) visit(child);
        if (node.content) visit(node.content);
      }
      visit(ast);
      if (entries !== 1) fail(file, 'missing/duplicate entry');
    }
    for (const file of sourceFiles) {
      if (scriptExtensions.has(path.extname(file))) inspectScript(file);
      else if (path.extname(file) === '.css') inspectCss(file);
      else fail(file, 'unapproved source file');
    }
    inspectHtml(path.join(previewRoot, 'index.html'));
    for (const file of collect(repoRoot, errors, true)) {
      if (scriptExtensions.has(path.extname(file))) inspectScript(file, true);
    }
  } catch { errors.push('Inspection could not complete (fail closed)'); }
  return { ok: errors.length === 0, errors };
}

function main() {
  let overrides = {};
  if (process.argv.length > 2) {
    // Test fixtures contain source text only: never imported or executed.
    if (process.argv[2] !== '--probe' || process.argv.length !== 4) throw new Error('unsupported arguments');
    overrides = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
    if (!overrides || Array.isArray(overrides) || Object.values(overrides).some(value => typeof value !== 'string')) throw new Error('invalid fixtures');
  }
  const result = checkBoundary(overrides);
  for (const message of result.errors) console.error(message);
  console.log(result.ok ? 'STATIC_BOUNDARY_PASS (not network isolation or startup authorization)' : 'STATIC_BOUNDARY_FAIL');
  process.exitCode = result.ok ? 0 : 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch { console.error('Boundary inspection failed'); process.exitCode = 1; }
}
