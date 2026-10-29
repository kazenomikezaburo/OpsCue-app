import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const checker = path.join(root, 'scripts/check-boundary.mjs');
const prefix = 'tools/ui-preview/';
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const sample = read('src/PreviewApp.tsx');
function probe(overrides, expected) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'OpsCue-boundary-275-'));
  const fixture = path.join(dir, 'mutation.json');
  try {
    fs.writeFileSync(fixture, JSON.stringify(overrides));
    const env = {};
    for (const key of ['SystemRoot','WINDIR','TEMP','TMP']) if (process.env[key]) env[key] = process.env[key];
    const result = spawnSync(process.execPath, [checker, '--probe', fixture], { cwd: root, env, encoding: 'utf8', timeout: 20000 });
    assert.equal(result.error, undefined);
    assert.equal(result.signal, null);
    assert.equal(result.status, expected, result.stdout + result.stderr);
    assert.match(result.stdout, expected === 0 ? /STATIC_BOUNDARY_PASS/ : /STATIC_BOUNDARY_FAIL/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
test('normal independent fixture, React exports, configuration, CSS and HTML pass', () => probe({}, 0));
test('normal fixed synthetic values pass', () => probe({ [prefix+'src/fixtures/sample.ts']: 'export const sample = { status: "架空", count: 0, emptyMessage: "空" } as const;' }, 0));
test('normal local CSS import passes', () => probe({ [prefix+'src/styles.css']: '@import "./styles.css";\n'+read('src/styles.css') }, 0));
test('normal local tsconfig alias resolves', () => {
  const tc = JSON.parse(read('tsconfig.json'));
  tc.compilerOptions.baseUrl = '.';
  tc.compilerOptions.paths = { '@fixture': ['src/fixtures/sample.ts'] };
  probe({[prefix+'tsconfig.json']: JSON.stringify(tc), [prefix+'src/PreviewApp.tsx']: sample.replace('./fixtures/sample','@fixture')}, 0);
});
const imports = [
  ['production app','../../../../app/page'],
  ['Supabase','../../../../lib/supabase/server'],
  ['Auth','../../../../lib/auth/get-current-profile'],
  ['DB','../../../../lib/line/delivery-db'],
  ['AWS SDK','@aws-sdk/client-s3'],
  ['LINE','../../../../lib/line/provider'],
  ['Server Action','../../../../app/actions/auth'],
  ['unapproved package export','react-dom/server'],
  ['unresolved source','./absent'],
];
for (const [name, spec] of imports) test('reject import: '+name, () =>
  probe({[prefix+'src/PreviewApp.tsx']: 'import x from '+JSON.stringify(spec)+';\n'+sample}, 1));
test('reject re-export production', () => probe({[prefix+'src/fixtures/sample.ts']: 'export * from "../../../../app/page";'}, 1));
test('reject type-only production import', () => probe({[prefix+'src/PreviewApp.tsx']: 'import type { X } from "../../../../lib/auth/types";\n'+sample}, 1));
test('reject dynamic import literal', () => probe({[prefix+'src/PreviewApp.tsx']: 'import("react");\n'+sample}, 1));
test('reject dynamic import unknown', () => probe({[prefix+'src/PreviewApp.tsx']: 'const x = "react"; import(x);\n'+sample}, 1));
test('reject require production', () => probe({[prefix+'src/PreviewApp.tsx']: 'require("../../../../app/page");\n'+sample}, 1));
test('reject TypeScript import equals', () => probe({[prefix+'src/fixtures/sample.ts']: 'import x = require("@supabase/supabase-js");'}, 1));
test('reject server directive', () => probe({[prefix+'src/PreviewApp.tsx']: '"use server";\n'+sample}, 1));
for (const name of ['fetch','WebSocket','EventSource']) test('reject network API '+name, () => probe({[prefix+'src/PreviewApp.tsx']: name+'("https://example.invalid");\n'+sample}, 1));
test('reject aliased fetch', () => probe({[prefix+'src/PreviewApp.tsx']: 'const send = fetch; send("https://example.invalid");\n'+sample}, 1));
test('reject computed global capability', () => probe({[prefix+'src/PreviewApp.tsx']: 'globalThis["fe"+"tch"]("x");\n'+sample}, 1));
test('reject environment secret reference', () => probe({[prefix+'src/PreviewApp.tsx']: 'process.env.SUPABASE_SERVICE_ROLE_KEY;\n'+sample}, 1));
test('reject import.meta environment', () => probe({[prefix+'src/PreviewApp.tsx']: 'import.meta.env.SECRET;\n'+sample}, 1));
test('reject CSS external import', () => probe({[prefix+'src/styles.css']: '@import "https://example.invalid/style.css";'}, 1));
test('reject CSS external url', () => probe({[prefix+'src/styles.css']: 'body { background: url(https://example.invalid/a); }'}, 1));
test('reject CSS escaped URL', () => probe({[prefix+'src/styles.css']: 'body { background: u\\72l(https://example.invalid/a); }'}, 1));
test('reject HTML external script', () => probe({[prefix+'index.html']: read('index.html').replace('/src/main.tsx','https://example.invalid/a.js')}, 1));
test('reject HTML encoded external script', () => probe({[prefix+'index.html']: read('index.html').replace('/src/main.tsx','https&#58;//example.invalid/a.js')}, 1));
test('reject HTML external link', () => probe({[prefix+'index.html']: read('index.html').replace('</head>','<link rel="stylesheet" href="https://example.invalid/a.css"></head>')}, 1));
test('reject production reverse import', () => probe({'app/page.tsx': 'import x from "../tools/ui-preview/src/PreviewApp";'}, 1));
test('reject production reverse alias', () => probe({'app/page.tsx': 'export * from "@/tools/ui-preview/src/fixtures/sample";'}, 1));
test('reject source alias to production', () => {
  const tc=JSON.parse(read('tsconfig.json'));
  tc.compilerOptions.paths={'@safe':['../../app/page.tsx']};
  probe({[prefix+'tsconfig.json']:JSON.stringify(tc), [prefix+'src/PreviewApp.tsx']:'import x from "@safe";\n'+sample},1);
});
test('reject unknown Vite config capability', () => probe({[prefix+'vite.config.ts']: read('vite.config.ts')+'\nfetch("https://example.invalid");'},1));
test('reject tsconfig extends', () => {
  const tc=JSON.parse(read('tsconfig.json'));tc.extends='../../tsconfig.json';
  probe({[prefix+'tsconfig.json']:JSON.stringify(tc)},1);
});
test('reject duplicate JSON key', () => probe({[prefix+'tsconfig.json']:'{"compilerOptions":{},"compilerOptions":{},"include":["src"]}'},1));
test('reject JSX resource', () => probe({[prefix+'src/PreviewApp.tsx']: sample.replace('<main>','<main><img src="https://example.invalid/a" />')},1));
test('reject malformed script', () => probe({[prefix+'src/PreviewApp.tsx']:'import {'},1));

test('reject import type expression', () => probe({[prefix+'src/fixtures/sample.ts']: 'type X = import("../../../../lib/auth/types").AccountType;'},1));
test('reject triple slash external reference', () => probe({[prefix+'src/fixtures/sample.ts']: '/// <reference path="../../../../lib/auth/types.ts" />\nexport const sample = {};'},1));
test('reject JSX spread resource', () => probe({[prefix+'src/PreviewApp.tsx']: sample.replace('<main>','<main {...{dangerouslySetInnerHTML: {__html: "x"}}}>')},1));
test('reject iframe capability', () => probe({[prefix+'src/PreviewApp.tsx']: sample.replace('<main>','<main><iframe />')},1));
test('reject alternate JSX resource attribute', () => probe({[prefix+'src/PreviewApp.tsx']: sample.replace('<main>','<main srcDoc="x">')},1));
