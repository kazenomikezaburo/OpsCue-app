import test from 'node:test';
import assert from 'node:assert/strict';
import { assertLocalTarget, LocalTargetError, LOCAL_TARGET_POLICY } from './assert-local-target.mjs';

test('explicit API and database loopback forms', () => {
  for (const host of ['127.0.0.1', '[::1]']) {
    for (const suffix of ['', '/']) assert.equal(assertLocalTarget(`http://${host}:54321${suffix}`, 'api').hostname, host);
    assert.equal(assertLocalTarget(`postgresql://${host}:54322/postgres`, 'database').path, '/postgres');
    assert.equal(assertLocalTarget(`postgresql://synthetic:fixture-only@${host}:54322/postgres`, 'database').port, '54322');
  }
  assert.ok(Object.isFrozen(LOCAL_TARGET_POLICY.api));
});

const rejected = [
  ['external domain', 'http://example.invalid:54321', 'api'],
  ['external IP', 'http://192.0.2.1:54321', 'api'],
  ['deceptive localhost domain', 'http://localhost.example.invalid:54321', 'api'],
  ['localhost not a literal IP', 'http://localhost:54321', 'api'],
  ['IPv4 mapped IPv6', 'http://[::ffff:127.0.0.1]:54321', 'api'],
  ['IPv6 expanded alias', 'http://[0:0:0:0:0:0:0:1]:54321', 'api'],
  ['short IPv4 alias', 'http://127.1:54321', 'api'],
  ['integer IP alias', 'http://2130706433:54321', 'api'],
  ['hex IP alias', 'http://0x7f000001:54321', 'api'],
  ['wrong port', 'http://127.0.0.1:54322', 'api'],
  ['missing port', 'http://127.0.0.1', 'api'],
  ['padded port', 'http://127.0.0.1:054321', 'api'],
  ['wrong protocol', 'https://127.0.0.1:54321', 'api'],
  ['protocol alias', 'postgres://127.0.0.1:54322/postgres', 'database'],
  ['uppercase normalization', 'HTTP://127.0.0.1:54321', 'api'],
  ['unexpected query', 'http://127.0.0.1:54321/?token=synthetic', 'api'],
  ['empty query', 'http://127.0.0.1:54321/?', 'api'],
  ['fragment', 'http://127.0.0.1:54321/#synthetic', 'api'],
  ['path', 'http://127.0.0.1:54321/rest/v1', 'api'],
  ['dot path normalization', 'http://127.0.0.1:54321/a/..', 'api'],
  ['encoded host', 'http://%31%32%37.0.0.1:54321', 'api'],
  ['encoded database', 'postgresql://127.0.0.1:54322/%70ostgres', 'database'],
  ['wrong database', 'postgresql://127.0.0.1:54322/other', 'database'],
  ['database trailing slash', 'postgresql://127.0.0.1:54322/postgres/', 'database'],
  ['API credentials', 'http://synthetic:fixture-only@127.0.0.1:54321', 'api'],
  ['multiple authority separators', 'postgresql://synthetic@fake@127.0.0.1:54322/postgres', 'database'],
  ['encoded credentials', 'postgresql://synthetic:fixture%2Donly@127.0.0.1:54322/postgres', 'database'],
  ['backslash normalization', 'http://127.0.0.1:54321\\', 'api'],
  ['leading whitespace', ' http://127.0.0.1:54321', 'api'],
  ['trailing newline', 'http://127.0.0.1:54321\n', 'api'],
  ['empty string', '', 'api'],
  ['invalid URL', 'not-a-url', 'api'],
  ['nonstring', null, 'api'],
  ['unknown kind', 'http://127.0.0.1:54321', 'unknown'],
];

for (const [name, input, kind] of rejected) test(`rejects ${name}`, () => {
  assert.throws(() => assertLocalTarget(input, kind), (error) => error instanceof LocalTargetError && /^LOCAL_TARGET_[A-Z]+$/.test(error.code));
});

test('credentials are absent from results and error diagnostics', () => {
  const password = 'artificial-noncredential-marker';
  const good = `postgresql://synthetic:${password}@127.0.0.1:54322/postgres`;
  const result = assertLocalTarget(good, 'database');
  assert.ok(Object.isFrozen(result));
  assert.equal(JSON.stringify(result).includes(password), false);
  for (const bad of [`postgresql://synthetic:${password}@example.invalid:54322/postgres`, `postgresql://synthetic:${password}@127.0.0.1:54322/postgres?token=artificial`]) {
    try { assertLocalTarget(bad, 'database'); assert.fail('expected rejection'); }
    catch (error) {
      assert.ok(error instanceof LocalTargetError);
      const diagnostics = `${error.message}\n${error.stack}\n${JSON.stringify(error)}`;
      assert.equal(diagnostics.includes(password), false);
      assert.equal(diagnostics.includes(bad), false);
      assert.equal(error.cause, undefined);
    }
  }
});
