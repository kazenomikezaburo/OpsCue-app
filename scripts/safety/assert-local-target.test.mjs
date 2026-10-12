import test from 'node:test';
import assert from 'node:assert/strict';
import { assertLocalTarget, LocalTargetError, LOCAL_TARGET_POLICY } from './assert-local-target.mjs';

test('explicit API and database loopback forms', () => {
  for (const host of ['127.0.0.1', '[::1]']) {
    for (const suffix of ['', '/']) {
      const result = assertLocalTarget(`http://${host}:55321${suffix}`, 'api');
      assert.equal(result.hostname, host);
      assert.equal(result.port, '55321');
    }
    assert.equal(assertLocalTarget(`postgresql://${host}:55322/postgres`, 'database').path, '/postgres');
    assert.equal(assertLocalTarget(`postgresql://synthetic:fixture-only@${host}:55322/postgres`, 'database').port, '55322');
  }
  assert.ok(Object.isFrozen(LOCAL_TARGET_POLICY.api));
  assert.ok(Object.isFrozen(LOCAL_TARGET_POLICY.database));
});

for (const host of ['127.0.0.1', '[::1]']) {
  for (const [kind, input] of [
    ['api', `http://${host}:54321`],
    ['database', `postgresql://synthetic:fixture-only@${host}:54322/postgres`],
  ]) test(`rejects original ${kind} port on ${host}`, () => {
    assert.throws(() => assertLocalTarget(input, kind),
      (error) => error instanceof LocalTargetError && error.code === 'LOCAL_TARGET_PORT');
  });
}

const rejected = [
  ['external domain', 'http://example.invalid:55321', 'api'],
  ['external IP', 'http://192.0.2.1:55321', 'api'],
  ['deceptive localhost domain', 'http://localhost.example.invalid:55321', 'api'],
  ['localhost not a literal IP', 'http://localhost:55321', 'api'],
  ['IPv4 mapped IPv6', 'http://[::ffff:127.0.0.1]:55321', 'api'],
  ['IPv6 expanded alias', 'http://[0:0:0:0:0:0:0:1]:55321', 'api'],
  ['short IPv4 alias', 'http://127.1:55321', 'api'],
  ['integer IP alias', 'http://2130706433:55321', 'api'],
  ['hex IP alias', 'http://0x7f000001:55321', 'api'],
  ['wrong port', 'http://127.0.0.1:55322', 'api'],
  ['missing port', 'http://127.0.0.1', 'api'],
  ['padded port', 'http://127.0.0.1:055321', 'api'],
  ['wrong protocol', 'https://127.0.0.1:55321', 'api'],
  ['protocol alias', 'postgres://127.0.0.1:55322/postgres', 'database'],
  ['uppercase normalization', 'HTTP://127.0.0.1:55321', 'api'],
  ['unexpected query', 'http://127.0.0.1:55321/?token=synthetic', 'api'],
  ['empty query', 'http://127.0.0.1:55321/?', 'api'],
  ['fragment', 'http://127.0.0.1:55321/#synthetic', 'api'],
  ['path', 'http://127.0.0.1:55321/rest/v1', 'api'],
  ['dot path normalization', 'http://127.0.0.1:55321/a/..', 'api'],
  ['encoded host', 'http://%31%32%37.0.0.1:55321', 'api'],
  ['encoded database', 'postgresql://127.0.0.1:55322/%70ostgres', 'database'],
  ['wrong database', 'postgresql://127.0.0.1:55322/other', 'database'],
  ['database trailing slash', 'postgresql://127.0.0.1:55322/postgres/', 'database'],
  ['API credentials', 'http://synthetic:fixture-only@127.0.0.1:55321', 'api'],
  ['multiple authority separators', 'postgresql://synthetic@fake@127.0.0.1:55322/postgres', 'database'],
  ['encoded credentials', 'postgresql://synthetic:fixture%2Donly@127.0.0.1:55322/postgres', 'database'],
  ['backslash normalization', 'http://127.0.0.1:55321\\', 'api'],
  ['leading whitespace', ' http://127.0.0.1:55321', 'api'],
  ['trailing newline', 'http://127.0.0.1:55321\n', 'api'],
  ['empty string', '', 'api'],
  ['invalid URL', 'not-a-url', 'api'],
  ['nonstring', null, 'api'],
  ['unknown kind', 'http://127.0.0.1:55321', 'unknown'],
];

for (const [name, input, kind] of rejected) test(`rejects ${name}`, () => {
  assert.throws(() => assertLocalTarget(input, kind), (error) => error instanceof LocalTargetError && /^LOCAL_TARGET_[A-Z]+$/.test(error.code));
});

test('credentials are absent from results and error diagnostics', () => {
  const password = 'artificial-noncredential-marker';
  const good = `postgresql://synthetic:${password}@127.0.0.1:55322/postgres`;
  const result = assertLocalTarget(good, 'database');
  assert.ok(Object.isFrozen(result));
  assert.equal(JSON.stringify(result).includes(password), false);
  assert.equal(JSON.stringify(result).includes('synthetic'), false);
  assert.equal(JSON.stringify(result).includes(good), false);
  for (const bad of [`postgresql://synthetic:${password}@example.invalid:55322/postgres`, `postgresql://synthetic:${password}@127.0.0.1:55322/postgres?token=artificial`]) {
    try { assertLocalTarget(bad, 'database'); assert.fail('expected rejection'); }
    catch (error) {
      assert.ok(error instanceof LocalTargetError);
      const diagnostics = `${error.message}\n${error.stack}\n${JSON.stringify(error)}`;
      assert.equal(diagnostics.includes(password), false);
      assert.equal(diagnostics.includes('synthetic'), false);
      assert.equal(diagnostics.includes(bad), false);
      assert.equal(error.cause, undefined);
    }
  }
});

test('invalid kind types are rejected before any conversion or input processing', () => {
  for (const kind of [undefined, null, true, 1, 1n, Symbol('api'), [], {}, new String('api'), () => 'api', 'API', '']) {
    assert.throws(() => assertLocalTarget(null, kind),
      error => error instanceof LocalTargetError && error.code === 'LOCAL_TARGET_KIND');
  }
});

for (const method of [Symbol.toPrimitive, 'toString', 'valueOf']) {
  test(`kind conversion ${String(method)} is never invoked`, () => {
    let calls = 0;
    const kind = { [method]() { calls++; throw new Error('artificial-private-marker'); } };
    assert.throws(() => assertLocalTarget('http://127.0.0.1:55321', kind), error => {
      assert.ok(error instanceof LocalTargetError);
      assert.equal(error.code, 'LOCAL_TARGET_KIND');
      assert.equal(`${error.message}\n${error.stack}\n${JSON.stringify(error)}`.includes('artificial-private-marker'), false);
      return true;
    });
    assert.equal(calls, 0);
  });
}

test('Proxy and revoked Proxy kinds are rejected without traps', () => {
  let calls = 0;
  const handler = Object.fromEntries(['get', 'getPrototypeOf', 'ownKeys', 'getOwnPropertyDescriptor'].map(name => [name, () => {
    calls++; throw new Error('artificial-private-marker');
  }]));
  const revocable = Proxy.revocable({}, handler);
  revocable.revoke();
  for (const kind of [new Proxy({}, handler), revocable.proxy]) {
    assert.throws(() => assertLocalTarget('http://127.0.0.1:55321', kind),
      error => error instanceof LocalTargetError && error.code === 'LOCAL_TARGET_KIND');
  }
  assert.equal(calls, 0);
});
