import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { assertIntegrationTarget, IntegrationTargetError } from './assert-integration-target.mjs';

// Entirely invented fixture values. Nothing is read from env, Docker or DB.
function fixture() {
  const docker = {
    id: 'a'.repeat(64), name: 'supabase_db_opscue-app-dev', state: 'running',
    metadataContract: { status: 'confirmed', schemaId: 'synthetic-v1', projectLabelKey: 'fixture.project' },
    labels: { 'fixture.project': 'opscue-app-dev', 'fixture.component': 'db' },
    context: { name: 'fixture-local', endpoint: 'npipe://./pipe/fixture-docker' },
    networks: [{ id: 'b'.repeat(64), name: 'fixture-network' }],
    volumes: [{ name: 'fixture-volume', sourceIdentity: 'c'.repeat(64), destination: '/var/lib/postgresql/data', readOnly: false }],
    portBindings: [{ hostIp: '127.0.0.1', hostPort: '55322', containerPort: '5432', protocol: 'tcp' }],
  };
  const database = {
    environmentUuid: '00000000-0000-4000-8000-000000000001',
    clusterIdentifier: '1234567890123456789', databaseName: 'postgres',
    projectId: 'opscue-app-dev', purpose: 'disposable-integration-test',
  };
  return {
    approval: { schemaVersion: 1, scope: 'synthetic-only', status: 'approved', source: 'external-review', projectId: 'opscue-app-dev', docker: structuredClone(docker), database: structuredClone(database) },
    observation: { schemaVersion: 1, scope: 'synthetic-only', status: 'ok', source: 'synthetic-fixture', projectId: 'opscue-app-dev', apiUrl: 'http://127.0.0.1:55321', databaseUrl: 'postgresql://synthetic:fixture-only@127.0.0.1:55322/postgres', docker, database },
  };
}

function refuses(input, expectedCode) {
  assert.throws(() => assertIntegrationTarget(input), (error) => {
    assert.ok(error instanceof IntegrationTargetError);
    assert.match(error.code, /^INTEGRATION_TARGET_[A-Z]+$/);
    if (expectedCode) assert.equal(error.code, `INTEGRATION_TARGET_${expectedCode}`);
    return true;
  });
}

test('approved synthetic evidence matches without authorizing execution or returning identities', () => {
  const input = fixture();
  const before = structuredClone(input);
  const result = assertIntegrationTarget(input);
  assert.deepEqual(result, { scope: 'synthetic-only', verdict: 'matched', executionAuthorized: false });
  assert.ok(Object.isFrozen(result));
  assert.deepEqual(input, before);
});

test('explicit IPv6 local binding matches', () => {
  const input = fixture();
  input.observation.apiUrl = 'http://[::1]:55321/';
  input.observation.databaseUrl = 'postgresql://[::1]:55322/postgres';
  for (const item of [input.approval, input.observation]) item.docker.portBindings[0].hostIp = '::1';
  assert.equal(assertIntegrationTarget(input).executionAuthorized, false);
});

test('order of metadata keys and network entries does not change comparison', () => {
  const input = fixture();
  const extra = { id: 'd'.repeat(64), name: 'fixture-second-network' };
  input.approval.docker.networks.push(extra);
  input.observation.docker.networks.unshift(structuredClone(extra));
  input.observation.docker.labels = { 'fixture.component': 'db', 'fixture.project': 'opscue-app-dev' };
  assert.equal(assertIntegrationTarget(input).verdict, 'matched');
});

test('identical fabricated identities on both sides match but never establish authorization', () => {
  const input = fixture();
  for (const side of [input.approval, input.observation]) {
    side.docker.id = 'e'.repeat(64);
    side.docker.networks[0] = { id: 'f'.repeat(64), name: 'fabricated-network' };
    side.docker.volumes[0].name = 'fabricated-volume';
    side.docker.volumes[0].sourceIdentity = '1'.repeat(64);
    side.database.environmentUuid = '00000000-0000-4000-8000-000000000099';
    side.database.clusterIdentifier = '9876543210987654321';
  }
  const result = assertIntegrationTarget(input);
  assert.deepEqual(result, { scope: 'synthetic-only', verdict: 'matched', executionAuthorized: false });
  assert.ok(Object.isFrozen(result));
});

const jointlyForbidden = [
  ['old project ID', x => {
    for (const side of [x.approval, x.observation]) {
      side.projectId = 'dispatch-os'; side.database.projectId = 'dispatch-os';
      side.docker.labels['fixture.project'] = 'dispatch-os';
    }
  }, 'PROJECT'],
  ['old container', x => { for (const side of [x.approval, x.observation]) side.docker.name = 'supabase_db_dispatch-os'; }, 'DOCKER'],
  ['old database port and binding', x => {
    for (const side of [x.approval, x.observation]) side.docker.portBindings[0].hostPort = '54322';
    x.observation.databaseUrl = 'postgresql://127.0.0.1:54322/postgres';
  }, 'URL'],
  // API URL belongs only to observation; approval has no API URL field.
  ['old API port', x => { x.observation.apiUrl = 'http://127.0.0.1:54321'; }, 'URL'],
  ['old binding with valid URL', x => { for (const side of [x.approval, x.observation]) side.docker.portBindings[0].hostPort = '54322'; }, 'DOCKER'],
  ['short container ID', x => { for (const side of [x.approval, x.observation]) side.docker.id = 'e'.repeat(12); }, 'DOCKER'],
  ['unconfirmed metadata', x => { for (const side of [x.approval, x.observation]) side.docker.metadataContract.status = 'unconfirmed'; }, 'CONTRACT'],
  ['remote context', x => { for (const side of [x.approval, x.observation]) side.docker.context.endpoint = 'tcp://example.invalid:2375'; }, 'DOCKER'],
  ['invalid DB identity', x => { for (const side of [x.approval, x.observation]) side.database.environmentUuid = 'invalid'; }, 'DATABASE'],
  ['production purpose', x => { for (const side of [x.approval, x.observation]) side.database.purpose = 'production'; }, 'DATABASE'],
];
for (const [name, change, code] of jointlyForbidden) test(`rejects jointly matching ${name}`, () => {
  const input = fixture(); change(input); refuses(input, code);
});

const invalid = [
  ['old observed project', x => { x.observation.projectId = 'dispatch-os'; }, 'PROJECT'],
  ['old approved project', x => { x.approval.projectId = 'dispatch-os'; }, 'PROJECT'],
  ['old API port', x => { x.observation.apiUrl = 'http://127.0.0.1:54321'; }, 'URL'],
  ['old database port', x => { x.observation.databaseUrl = 'postgresql://127.0.0.1:54322/postgres'; }, 'URL'],
  ['old container', x => { x.observation.docker.name = 'supabase_db_dispatch-os'; }, 'DOCKER'],
  ['container short ID', x => { x.observation.docker.id = 'a'.repeat(12); }, 'DOCKER'],
  ['container full ID mismatch', x => { x.observation.docker.id = 'd'.repeat(64); }, 'DOCKER'],
  ['nonrunning container', x => { x.observation.docker.state = 'stopped'; }, 'DOCKER'],
  ['old project label', x => { x.observation.docker.labels['fixture.project'] = 'dispatch-os'; }, 'PROJECT'],
  ['missing project label', x => { delete x.observation.docker.labels['fixture.project']; }, 'PROJECT'],
  ['other label mismatch', x => { x.observation.docker.labels['fixture.component'] = 'other'; }, 'DOCKER'],
  ['extra label', x => { x.observation.docker.labels['fixture.extra'] = 'extra'; }, 'DOCKER'],
  ['unconfirmed label contract', x => { x.observation.docker.metadataContract.status = 'unconfirmed'; }, 'CONTRACT'],
  ['unknown metadata schema', x => { x.observation.docker.metadataContract.schemaId = 'guessed-docker-schema'; }, 'CONTRACT'],
  ['missing contract', x => { delete x.observation.docker.metadataContract; }, 'DOCKER'],
  ['context name mismatch', x => { x.observation.docker.context.name = 'other-local'; }, 'DOCKER'],
  ['context endpoint mismatch', x => { x.observation.docker.context.endpoint = 'npipe://./pipe/other-docker'; }, 'DOCKER'],
  ['remote Docker endpoint', x => { x.observation.docker.context.endpoint = 'tcp://example.invalid:2375'; }, 'DOCKER'],
  ['network ID mismatch', x => { x.observation.docker.networks[0].id = 'd'.repeat(64); }, 'DOCKER'],
  ['network name mismatch', x => { x.observation.docker.networks[0].name = 'other-network'; }, 'DOCKER'],
  ['missing networks', x => { delete x.observation.docker.networks; }, 'DOCKER'],
  ['empty networks', x => { x.observation.docker.networks = []; }, 'DOCKER'],
  ['duplicate network', x => { x.observation.docker.networks.push(structuredClone(x.observation.docker.networks[0])); }, 'DOCKER'],
  ['extra network', x => { x.observation.docker.networks.push({ id: 'd'.repeat(64), name: 'other-network' }); }, 'DOCKER'],
  ['volume name mismatch', x => { x.observation.docker.volumes[0].name = 'old-volume'; }, 'DOCKER'],
  ['volume identity mismatch', x => { x.observation.docker.volumes[0].sourceIdentity = 'd'.repeat(64); }, 'DOCKER'],
  ['wrong volume destination', x => { x.observation.docker.volumes[0].destination = '/other'; }, 'DOCKER'],
  ['missing volumes', x => { delete x.observation.docker.volumes; }, 'DOCKER'],
  ['old port binding', x => { x.observation.docker.portBindings[0].hostPort = '54322'; }, 'DOCKER'],
  ['wildcard port binding', x => { x.observation.docker.portBindings[0].hostIp = '0.0.0.0'; }, 'DOCKER'],
  ['unexpected internal port', x => { x.observation.docker.portBindings[0].containerPort = '55322'; }, 'DOCKER'],
  ['wrong binding protocol', x => { x.observation.docker.portBindings[0].protocol = 'udp'; }, 'DOCKER'],
  ['missing bindings', x => { delete x.observation.docker.portBindings; }, 'DOCKER'],
  ['binding does not cover URL host', x => { x.approval.docker.portBindings[0].hostIp = '::1'; x.observation.docker.portBindings[0].hostIp = '::1'; }, 'URL'],
  ['missing database identity', x => { delete x.observation.database; }, 'ACQUISITION'],
  ['environment UUID mismatch', x => { x.observation.database.environmentUuid = '00000000-0000-4000-8000-000000000002'; }, 'DATABASE'],
  ['invalid environment UUID', x => { x.observation.database.environmentUuid = 'not-a-uuid'; }, 'DATABASE'],
  ['cluster ID mismatch', x => { x.observation.database.clusterIdentifier = '1234567890123456790'; }, 'DATABASE'],
  ['cluster ID number loses precision', x => { x.observation.database.clusterIdentifier = 1234567890123456789; }, undefined],
  ['cluster ID out of range', x => { x.observation.database.clusterIdentifier = '18446744073709551616'; }, 'DATABASE'],
  ['wrong database name', x => { x.observation.database.databaseName = 'other'; }, 'DATABASE'],
  ['wrong database purpose', x => { x.observation.database.purpose = 'production'; }, 'DATABASE'],
  ['old DB project identity', x => { x.observation.database.projectId = 'dispatch-os'; }, 'DATABASE'],
  ['missing UUID', x => { delete x.observation.database.environmentUuid; }, 'DATABASE'],
  ['missing external approval', x => { delete x.approval; }, 'INPUT'],
  ['unapproved expectations', x => { x.approval.status = 'pending'; }, 'APPROVAL'],
  ['expectations derived from observation', x => { x.approval.source = 'observation'; }, 'APPROVAL'],
  ['invalid approved Docker evidence', x => { x.approval.docker.id = 'short'; }, 'DOCKER'],
  ['invalid approved database evidence', x => { x.approval.database.environmentUuid = ''; }, 'DATABASE'],
  ['observation acquisition failed', x => { x.observation.status = 'failed'; }, 'ACQUISITION'],
  ['unknown acquisition status', x => { x.observation.status = 'unknown'; }, 'ACQUISITION'],
  ['real observation forbidden in stage 1', x => { x.observation.source = 'docker-inspect'; }, 'ACQUISITION'],
  ['live scope forbidden', x => { x.observation.scope = 'live'; }, 'SCOPE'],
  ['unknown schema version', x => { x.observation.schemaVersion = 2; }, 'ACQUISITION'],
  ['unexpected Docker env input', x => { x.observation.docker.env = ['SECRET=artificial-secret']; }, 'DOCKER'],
  ['unexpected SQL input', x => { x.observation.sql = 'DELETE FROM artificial_table'; }, 'ACQUISITION'],
  ['mismatched endpoint hosts', x => { x.observation.apiUrl = 'http://[::1]:55321'; }, 'URL'],
  ['external API', x => { x.observation.apiUrl = 'http://example.invalid:55321'; }, 'URL'],
  ['noncanonical localhost DB', x => { x.observation.databaseUrl = 'postgresql://localhost:55322/postgres'; }, 'URL'],
];

for (const [name, change, code] of invalid) test(`rejects ${name}`, () => {
  const input = fixture(); change(input); refuses(input, code);
});

test('every required identity and metadata field is mandatory on both sides', () => {
  for (const side of ['approval', 'observation']) {
    for (const group of ['docker', 'database']) {
      for (const key of Object.keys(fixture()[side][group])) {
        const input = fixture(); delete input[side][group][key]; refuses(input);
      }
    }
    for (const path of [['docker', 'metadataContract'], ['docker', 'context'], ['docker', 'networks', 0], ['docker', 'volumes', 0], ['docker', 'portBindings', 0]]) {
      const object = path.reduce((value, key) => value[key], fixture()[side]);
      for (const key of Object.keys(object)) {
        const input = fixture();
        delete path.reduce((value, part) => value[part], input[side])[key];
        refuses(input);
      }
    }
  }
});

test('malformed inputs, accessors, cycles and exotic structures fail closed', () => {
  for (const value of [null, undefined, [], 'input', new Date(), { approval: null, observation: null }]) refuses(value);
  const accessor = fixture(); let getterCalls = 0;
  Object.defineProperty(accessor.observation, 'apiUrl', { enumerable: true, get() { getterCalls++; return 'secret'; } });
  refuses(accessor); assert.equal(getterCalls, 0);
  const cyclic = fixture(); cyclic.observation.loop = cyclic; refuses(cyclic);
  const symbolic = fixture(); symbolic[Symbol('hidden')] = 'secret'; refuses(symbolic);
  const sparse = fixture(); sparse.observation.docker.networks = new Array(1); refuses(sparse);
});

function trapProbe(target) {
  let calls = 0;
  const handler = Object.fromEntries([
    'getPrototypeOf', 'setPrototypeOf', 'isExtensible', 'preventExtensions',
    'getOwnPropertyDescriptor', 'defineProperty', 'has', 'get', 'set',
    'deleteProperty', 'ownKeys', 'apply', 'construct',
  ].map(name => [name, () => { calls++; throw new Error('artificial-proxy-private-marker'); }]));
  return { proxy: new Proxy(target, handler), calls: () => calls };
}

const proxyPlacements = [
  ['top level', x => x, (x, proxy) => proxy],
  ['approval', x => x.approval, (x, proxy) => { x.approval = proxy; return x; }],
  ['nested Docker', x => x.observation.docker, (x, proxy) => { x.observation.docker = proxy; return x; }],
  ['array', x => x.observation.docker.networks, (x, proxy) => { x.observation.docker.networks = proxy; return x; }],
  ['array element', x => x.approval.docker.volumes[0], (x, proxy) => { x.approval.docker.volumes[0] = proxy; return x; }],
];
for (const [name, getTarget, place] of proxyPlacements) test(`rejects ${name} Proxy with zero trap calls`, () => {
  const input = fixture(); const probe = trapProbe(getTarget(input));
  refuses(place(input, probe.proxy), 'INPUT');
  assert.equal(probe.calls(), 0);
});

test('transparent and revoked Proxies are rejected rather than accepted as plain data', () => {
  refuses(new Proxy(fixture(), {}), 'INPUT');
  const revocable = Proxy.revocable([], {}); revocable.revoke();
  const input = fixture(); input.observation.docker.networks = revocable.proxy;
  refuses(input, 'INPUT');
});

test('a Proxy thrown as an exception is rejected without introspection traps', t => {
  const input = fixture(); const probe = trapProbe(new IntegrationTargetError('DOCKER'));
  // Fault injection only: no Proxy input trap is used to produce this exception.
  t.mock.method(Reflect, 'ownKeys', () => { throw probe.proxy; });
  let caught;
  try { assertIntegrationTarget(input); } catch (error) { caught = error; }
  finally { t.mock.restoreAll(); }
  assert.ok(caught instanceof IntegrationTargetError);
  assert.equal(caught.code, 'INTEGRATION_TARGET_INPUT');
  assert.equal(caught.cause, undefined);
  assert.equal(`${caught.message}\n${caught.stack}\n${JSON.stringify(caught)}`.includes('artificial-proxy-private-marker'), false);
  assert.equal(probe.calls(), 0);
});

test('a thrown object with a Proxy prototype is never introspected', t => {
  const input = fixture(); const probe = trapProbe(new IntegrationTargetError('DOCKER'));
  const foreign = Object.create(probe.proxy);
  t.mock.method(Reflect, 'ownKeys', () => { throw foreign; });
  let caught;
  try { assertIntegrationTarget(input); } catch (error) { caught = error; }
  finally { t.mock.restoreAll(); }
  assert.ok(caught instanceof IntegrationTargetError);
  assert.equal(caught.code, 'INTEGRATION_TARGET_INPUT');
  assert.equal(probe.calls(), 0);
});

test('a forged public error is rebuilt without trusting its code, getters or cause', t => {
  const input = fixture(); const marker = 'artificial-foreign-error-private-marker';
  const foreign = new IntegrationTargetError('DOCKER');
  foreign.message = marker; foreign.cause = { secret: marker };
  let reads = 0;
  Object.defineProperty(foreign, 'code', { get() { reads++; throw new Error(marker); } });
  t.mock.method(Reflect, 'ownKeys', () => { throw foreign; });
  let caught;
  try { assertIntegrationTarget(input); } catch (error) { caught = error; }
  finally { t.mock.restoreAll(); }
  assert.ok(caught instanceof IntegrationTargetError);
  assert.equal(caught.code, 'INTEGRATION_TARGET_INPUT');
  assert.equal(`${caught.message}\n${caught.stack}\n${JSON.stringify(caught)}`.includes(marker), false);
  assert.equal(caught.cause, undefined);
  assert.equal(reads, 0);
});

test('secrets, URLs, SQL, Docker env and foreign exception text never enter diagnostics', () => {
  const marker = 'artificial-noncredential-private-marker';
  const cases = [
    x => { x.observation.databaseUrl = `postgresql://synthetic:${marker}@example.invalid:55322/postgres`; },
    x => { x.observation.sql = `DELETE FROM ${marker}`; },
    x => { x.observation.docker.env = [`TOKEN=${marker}`]; },
    x => { x.observation.database.environmentUuid = marker; },
  ];
  for (const change of cases) {
    const input = fixture(); change(input);
    try { assertIntegrationTarget(input); assert.fail('must reject'); }
    catch (error) {
      assert.ok(error instanceof IntegrationTargetError);
      const diagnostics = `${error.message}\n${error.stack}\n${JSON.stringify(error)}`;
      for (const text of [marker, 'postgresql://', 'DELETE FROM', 'TOKEN=', 'synthetic:']) assert.equal(diagnostics.includes(text), false);
      assert.equal(error.cause, undefined);
      assert.deepEqual(Object.keys(error).sort(), ['code', 'name']);
    }
  }
  const proxy = new Proxy({}, { ownKeys() { throw new Error(marker); } });
  refuses(proxy, 'INPUT');
  const forgedError = new IntegrationTargetError('DOCKER');
  forgedError.message = marker; forgedError.cause = { secret: marker };
  const forgedProxy = new Proxy({}, { ownKeys() { throw forgedError; } });
  try { assertIntegrationTarget(forgedProxy); assert.fail('must reject'); }
  catch (error) {
    assert.ok(error instanceof IntegrationTargetError);
    assert.equal(`${error.message}\n${error.stack}\n${JSON.stringify(error)}`.includes(marker), false);
    assert.equal(error.cause, undefined);
  }
  const input = fixture(); input.observation.databaseUrl = `postgresql://synthetic:${marker}@127.0.0.1:55322/postgres`;
  assert.equal(JSON.stringify(assertIntegrationTarget(input)).includes(marker), false);
  assert.equal(new IntegrationTargetError(marker).message.includes(marker), false);
});

test('first import and URL dependency perform no external calls in an isolated process', () => {
  const modules = [
    [new URL('./assert-integration-target.mjs', import.meta.url), ['node:util', './assert-local-target.mjs']],
    [new URL('./assert-local-target.mjs', import.meta.url), []],
  ];
  // Closed dependency set prevents uninstrumented packages from being loaded.
  for (const [url, expectedImports] of modules) {
    const source = readFileSync(url, 'utf8');
    assert.deepEqual([...source.matchAll(/^import .* from '([^']+)';$/gm)].map(x => x[1]), expectedImports);
    assert.doesNotMatch(source, /\b(?:process|fetch|require)\s*[.(]|\bimport\s*\(/);
  }
  const probe = String.raw`
    import assert from 'node:assert/strict';
    import childProcess from 'node:child_process';
    import net from 'node:net';
    import http from 'node:http';
    import https from 'node:https';
    import http2 from 'node:http2';
    import tls from 'node:tls';
    import dns from 'node:dns';
    import dgram from 'node:dgram';
    import fs from 'node:fs';
    import workerThreads from 'node:worker_threads';
    import { syncBuiltinESMExports } from 'node:module';
    let calls = 0;
    function forbidden() { calls++; throw new Error('EXTERNAL_CALL_FORBIDDEN'); }
    function block(object, names) {
      for (const name of names) if (typeof object[name] === 'function') object[name] = forbidden;
    }
    block(childProcess, ['exec', 'execSync', 'execFile', 'execFileSync', 'spawn', 'spawnSync', 'fork']);
    block(net, ['connect', 'createConnection', 'createServer']);
    block(net.Socket.prototype, ['connect']);
    block(net.Server.prototype, ['listen']);
    block(http, ['request', 'get', 'createServer']);
    block(https, ['request', 'get', 'createServer']);
    block(http2, ['connect', 'createServer', 'createSecureServer']);
    block(tls, ['connect', 'createServer']);
    block(dns, Object.keys(dns).filter(name => name === 'lookup' || name.startsWith('resolve') || name === 'reverse'));
    block(dns.promises, Object.keys(dns.promises));
    block(dgram, ['createSocket']);
    block(dgram.Socket.prototype, ['send', 'connect', 'bind']);
    block(workerThreads, ['Worker']);
    const writes = ['writeFile', 'appendFile', 'mkdir', 'mkdtemp', 'rm', 'rmdir', 'unlink', 'rename', 'copyFile', 'cp', 'truncate', 'chmod', 'chown', 'utimes', 'symlink', 'link'];
    block(fs, writes.flatMap(name => [name, name + 'Sync']).concat(['createWriteStream']));
    block(fs.promises, writes);
    globalThis.fetch = forbidden;
    if ('WebSocket' in globalThis) globalThis.WebSocket = forbidden;
    syncBuiltinESMExports();
    try {
      // Neither target nor its URL dependency has been imported in this process.
      const integration = await import(process.argv[1]);
      const local = await import(process.argv[2]);
      assert.equal(local.assertLocalTarget('http://127.0.0.1:55321', 'api').port, '55321');
      assert.equal(typeof integration.assertIntegrationTarget, 'function');
      assert.equal(calls, 0);
      process.stdout.write('FIRST_IMPORT_NO_EXTERNAL_CALLS');
    } catch { process.exitCode = 1; process.stdout.write('IMPORT_PROBE_FAILED'); }
  `;
  const run = spawnSync(process.execPath, ['--input-type=module', '--eval', probe, ...modules.map(([url]) => url.href)], {
    encoding: 'utf8', env: {}, timeout: 10_000, maxBuffer: 8192,
  });
  assert.equal(run.error, undefined, 'Isolated import probe could not complete');
  assert.equal(run.status, 0, 'Isolated import probe failed');
  assert.equal(run.stdout, 'FIRST_IMPORT_NO_EXTERNAL_CALLS');
  assert.equal(run.stderr, '');
});
