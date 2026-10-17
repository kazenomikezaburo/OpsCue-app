import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyOfflineAccountTarget, assertLiveAccountPreparationAllowed, LocalAccountTargetError } from './verify-local-account-target.mjs';

function fixture() {
  const docker = { id: 'a'.repeat(64), name: 'supabase_db_opscue-app-dev', state: 'running',
    metadataContract: { status: 'confirmed', schemaId: 'synthetic-v1', projectLabelKey: 'fixture.project' },
    labels: { 'fixture.project': 'opscue-app-dev' }, context: { name: 'fixture-local', endpoint: 'npipe://./pipe/fixture-docker' },
    networks: [{ id: 'b'.repeat(64), name: 'fixture-network' }],
    volumes: [{ name: 'fixture-volume', sourceIdentity: 'c'.repeat(64), destination: '/var/lib/postgresql/data', readOnly: false }],
    portBindings: [{ hostIp: '127.0.0.1', hostPort: '55322', containerPort: '5432', protocol: 'tcp' }] };
  const database = { environmentUuid: '00000000-0000-4000-8000-000000000001', clusterIdentifier: '1234567890123456789', databaseName: 'postgres', projectId: 'opscue-app-dev', purpose: 'disposable-integration-test' };
  return { approval: { schemaVersion: 1, scope: 'synthetic-only', status: 'approved', source: 'external-review', projectId: 'opscue-app-dev', docker: structuredClone(docker), database: structuredClone(database) },
    observation: { schemaVersion: 1, scope: 'synthetic-only', status: 'ok', source: 'synthetic-fixture', projectId: 'opscue-app-dev', apiUrl: 'http://127.0.0.1:55321', databaseUrl: 'postgresql://127.0.0.1:55322/postgres', docker, database } };
}
test('matching mock target still gives no live execution permission', () => {
  assert.deepEqual(verifyOfflineAccountTarget(JSON.stringify(fixture())), { mode: 'offline-comparison', executionAuthorized: false });
});
for (const [name, modify] of [
  ['old project', x => { x.observation.projectId = 'dispatch-os'; }],
  ['old API', x => { x.observation.apiUrl = 'http://127.0.0.1:54321'; }],
  ['old DB', x => { x.observation.databaseUrl = 'postgresql://127.0.0.1:54322/postgres'; }],
  ['old container', x => { x.observation.docker.name = 'supabase_db_dispatch-os'; }],
  ['missing identity', x => { delete x.observation.database; }],
  ['unverified contract', x => { x.observation.docker.metadataContract.status = 'unknown'; }],
  ['changed container ID', x => { x.observation.docker.id = 'd'.repeat(64); }],
  ['changed DB cluster', x => { x.observation.database.clusterIdentifier = '1'; }],
  ['acquisition failed', x => { x.observation.status = 'failed'; }],
]) test(`target guard rejects ${name}`, () => {
  const input = fixture(); modify(input);
  assert.throws(() => verifyOfflineAccountTarget(JSON.stringify(input)), LocalAccountTargetError);
});
test('live execution always refuses including a valid synthetic comparison', () => {
  const matched = verifyOfflineAccountTarget(JSON.stringify(fixture()));
  assert.throws(() => assertLiveAccountPreparationAllowed(matched), LocalAccountTargetError);
});
test('malformed input and credentials never enter diagnostics', () => {
  for (const input of [null, {}, '{"key":"artificial-private-marker"}', 'not-json']) {
    assert.throws(() => verifyOfflineAccountTarget(input), error => {
      assert.ok(error instanceof LocalAccountTargetError);
      assert.equal(`${error.message}\n${error.stack}\n${JSON.stringify(error)}`.includes('artificial-private-marker'), false);
      return true;
    });
  }
});
