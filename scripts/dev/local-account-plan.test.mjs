import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { planLocalAccounts, simulateLocalAccountPreparation, LocalAccountError } from './local-account-plan.mjs';
import { prepareLocalAccounts } from './prepare-local-accounts.mjs';

const managerId = '00000000-0000-4000-8000-000000000001';
const branchId = '00000000-0000-4000-8000-000000000002';
const identities = { workerAuthId: '00000000-0000-4000-8000-000000000003', workerRowId: '00000000-0000-4000-8000-000000000004', systemAdminAuthId: '00000000-0000-4000-8000-000000000005' };
function fixture() {
  return { complete: true,
    branches: [{ id: branchId, code: 'DEMO-001', name: 'Synthetic demo branch', is_active: true }],
    authUsers: [{ id: managerId, email: 'manager-a@test.invalid', confirmed: true }],
    profiles: [{ id: managerId, display_name: 'Synthetic manager', account_type: 'manager', is_active: true }],
    workers: [], managerBranchAccess: [{ profile_id: managerId, branch_id: branchId, role: 'manager' }] };
}
const simulate = (state, fail = null, ids = identities) => simulateLocalAccountPreparation(JSON.stringify(state), JSON.stringify(ids), fail);
const reject = state => assert.throws(() => planLocalAccounts(JSON.stringify(state)), LocalAccountError);

test('plans only two new accounts and always withholds execution permission', () => {
  const plan = planLocalAccounts(JSON.stringify(fixture()));
  assert.deepEqual(plan.actions.map(row => row.action), ['verify-existing', 'create', 'create']);
  assert.equal(plan.actions[0].protected, true);
  assert.equal(plan.executionAuthorized, false);
  assert.ok(Object.isFrozen(plan)); assert.ok(Object.isFrozen(plan.actions));
});
test('mock preparation preserves Manager, branch and access exactly', () => {
  const before = fixture(); const result = simulate(before);
  assert.equal(result.status, 'prepared'); assert.equal(result.executionAuthorized, false);
  assert.deepEqual(result.state.branches, before.branches);
  assert.deepEqual(result.state.managerBranchAccess, before.managerBranchAccess);
  assert.deepEqual(result.state.authUsers[0], before.authUsers[0]);
  assert.deepEqual(result.state.profiles[0], before.profiles[0]);
  const worker = result.state.workers[0];
  assert.equal(worker.auth_profile_id, identities.workerAuthId);
  assert.notEqual(worker.id, identities.workerAuthId); assert.equal(worker.branch_id, branchId);
  assert.equal(result.state.profiles.find(row => row.id === worker.auth_profile_id).account_type, 'worker');
  assert.equal(result.state.workers.length, 1);
  assert.equal(result.state.profiles.find(row => row.id === identities.systemAdminAuthId).account_type, 'system_admin');
});
test('rerun is a no-op and contains no password update or deletion operations', () => {
  const first = simulate(fixture());
  const again = simulate(first.state);
  assert.equal(again.status, 'already-consistent'); assert.deepEqual(again.events, []);
  assert.deepEqual(again.state, first.state);
});
test('existing Worker is preserved when only System Admin needs creation', () => {
  const state = simulate(fixture()).state;
  state.authUsers = state.authUsers.filter(row => row.id !== identities.systemAdminAuthId);
  state.profiles = state.profiles.filter(row => row.id !== identities.systemAdminAuthId);
  const before = structuredClone(state);
  const result = simulate(state);
  assert.deepEqual(result.events, ['MOCK_AUTH_CREATED_system_admin', 'MOCK_DB_COMMITTED']);
  assert.deepEqual(result.state.workers, before.workers);
  assert.deepEqual(result.state.authUsers.slice(0, 2), before.authUsers);
});
test('reserved Worker staff code collision is not adopted', () => {
  const state = simulate(fixture()).state;
  state.authUsers.find(row => row.id === identities.workerAuthId).email = 'other@test.invalid';
  reject(state);
});
for (const [name, modify] of [
  ['missing Manager', x => { x.authUsers = []; x.profiles = []; x.managerBranchAccess = []; }],
  ['inactive Manager', x => { x.profiles[0].is_active = false; }],
  ['wrong Manager role', x => { x.profiles[0].account_type = 'system_admin'; }],
  ['missing Manager access', x => { x.managerBranchAccess = []; }],
  ['missing branch', x => { x.branches = []; }],
  ['inactive branch', x => { x.branches[0].is_active = false; }],
  ['duplicate Auth email', x => { x.authUsers.push({ ...x.authUsers[0], id: identities.workerAuthId }); }],
  ['incomplete acquisition', x => { x.complete = false; }],
  ['wrong Auth/profile UUID', x => { x.profiles[0].id = identities.workerAuthId; }],
  ['secret field', x => { x.password = 'artificial-private-marker'; }],
]) test(`stops on ${name} without a mutation plan`, () => reject(modifyState(fixture(), modify)));
function modifyState(state, modify) { modify(state); return state; }
for (const [name, modify] of [
  ['inactive Worker', x => { x.workers[0].status = 'inactive'; }],
  ['duplicate Worker link', x => { x.workers.push({ ...x.workers[0], id: '00000000-0000-4000-8000-000000000009', staff_code: 'OTHER' }); }],
  ['Worker UUID equals Auth UUID', x => { x.workers[0].id = x.workers[0].auth_profile_id; }],
  ['missing Worker link', x => { x.workers = []; }],
  ['wrong System Admin role', x => { x.profiles[2].account_type = 'manager'; }],
  ['unconfirmed existing Auth', x => { x.authUsers[1].confirmed = false; }],
  ['System Admin branch access', x => { x.managerBranchAccess.push({ profile_id: identities.systemAdminAuthId, branch_id: branchId, role: 'manager' }); }],
]) test(`does not repair ${name}`, () => reject(modifyState(simulate(fixture()).state, modify)));
for (const failure of ['auth-response-lost', 'before-db', 'during-db', 'after-db']) test(`safely stops at ${failure} without compensating deletion`, () => {
  const result = simulate(fixture(), failure);
  assert.equal(result.status, 'stopped'); assert.equal(result.executionAuthorized, false);
  assert.deepEqual(result.state.branches, fixture().branches);
  assert.deepEqual(result.state.managerBranchAccess, fixture().managerBranchAccess);
  assert.equal(result.recovery, 'STOP_REVIEW_PARTIAL_STATE_NO_AUTOMATIC_DELETE');
  if (failure !== 'after-db') {
    assert.equal(result.state.profiles.length, 1); assert.equal(result.state.workers.length, 0);
    reject(result.state); // Partial Auth rows are NOT silently adopted/repaired.
  }
});
test('identity collisions stop before simulated Auth creation', () => {
  assert.throws(() => simulate(fixture(), null, { ...identities, workerAuthId: managerId }), LocalAccountError);
  assert.throws(() => simulate(fixture(), null, { ...identities, workerRowId: identities.workerAuthId }), LocalAccountError);
});
test('bad types and secret-bearing input produce only fixed diagnostics', () => {
  let calls = 0;
  const proxy = new Proxy({}, { get() { calls++; throw new Error('artificial-private-marker'); } });
  for (const input of [null, undefined, proxy, '{"password":"artificial-private-marker"}', 'not-json']) {
    assert.throws(() => planLocalAccounts(input), error => {
      assert.ok(error instanceof LocalAccountError);
      assert.equal(`${error.message}\n${error.stack}\n${JSON.stringify(error)}`.includes('artificial-private-marker'), false);
      return true;
    });
  }
  assert.equal(calls, 0);
});
test('executable preparation entry refuses even caller supplied approval or credentials', () => {
  assert.throws(() => prepareLocalAccounts({ approved: true, executionAuthorized: true, key: 'artificial-key' }),
    error => error.code === 'LOCAL_ACCOUNT_TARGET_UNVERIFIED');
});
test('CLI always exits with fixed refusal and does not require or expose secrets', () => {
  const path = fileURLToPath(new URL('./prepare-local-accounts.mjs', import.meta.url));
  const run = spawnSync(process.execPath, [path], { encoding: 'utf8', env: {}, timeout: 5000 });
  assert.equal(run.error, undefined);
  assert.equal(run.status, 1);
  assert.equal(run.stdout, '');
  assert.equal(run.stderr, 'LOCAL_ACCOUNT_TARGET_UNVERIFIED: stage 2 is offline-only; no account operations performed.\n');
});
