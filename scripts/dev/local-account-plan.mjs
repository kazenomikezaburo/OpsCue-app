/** Offline projections only. No Auth, DB, filesystem, env or network access. */
export class LocalAccountError extends Error {
  constructor() {
    super('Offline account preparation refused; review the projected state.');
    this.name = 'LocalAccountError';
    this.code = 'LOCAL_ACCOUNT_REFUSED';
  }
}
const refuse = () => { throw new LocalAccountError(); };
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 128;
const exact = (value, keys) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.keys(value).length !== keys.length || !keys.every(key => Object.hasOwn(value, key))) refuse();
};
export function parseOfflineJson(input) {
  // A primitive JSON string cannot execute Proxy traps/getters/toJSON. No reviver.
  if (typeof input !== 'string' || input.length > 65536) refuse();
  try { return JSON.parse(input); } catch { refuse(); }
}
export const ACCOUNT_TARGETS = Object.freeze([
  Object.freeze({ email: 'manager-a@test.invalid', accountType: 'manager', protected: true }),
  Object.freeze({ email: 'worker-a@test.invalid', accountType: 'worker', protected: false }),
  Object.freeze({ email: 'system-admin@test.invalid', accountType: 'system_admin', protected: false }),
]);
export const WORKER_STAFF_CODE = 'DEV-WORKER-A';

function validateProjection(state) {
  exact(state, ['complete', 'branches', 'authUsers', 'profiles', 'workers', 'managerBranchAccess']);
  if (state.complete !== true) refuse();
  for (const key of ['branches', 'authUsers', 'profiles', 'workers', 'managerBranchAccess']) {
    if (!Array.isArray(state[key]) || state[key].length > 100) refuse();
  }
  const definitions = [
    ['branches', ['id', 'code', 'name', 'is_active'], row => uuid(row.id) && text(row.code) && text(row.name) && typeof row.is_active === 'boolean', row => row.id],
    ['authUsers', ['id', 'email', 'confirmed'], row => uuid(row.id) && text(row.email) && typeof row.confirmed === 'boolean', row => row.id],
    ['profiles', ['id', 'display_name', 'account_type', 'is_active'], row => uuid(row.id) && text(row.display_name) && ['manager', 'worker', 'system_admin'].includes(row.account_type) && typeof row.is_active === 'boolean', row => row.id],
    ['workers', ['id', 'staff_code', 'branch_id', 'auth_profile_id', 'display_name', 'status'], row => uuid(row.id) && text(row.staff_code) && uuid(row.branch_id) && uuid(row.auth_profile_id) && text(row.display_name) && ['active', 'inactive', 'suspended'].includes(row.status), row => row.id],
    ['managerBranchAccess', ['profile_id', 'branch_id', 'role'], row => uuid(row.profile_id) && uuid(row.branch_id) && ['manager', 'branch_manager'].includes(row.role), row => `${row.profile_id}/${row.branch_id}`],
  ];
  for (const [key, keys, valid, identity] of definitions) {
    const seen = new Set();
    for (const row of state[key]) {
      exact(row, keys);
      if (!valid(row) || seen.has(identity(row))) refuse();
      seen.add(identity(row));
    }
  }
  if (new Set(state.authUsers.map(row => row.email.toLowerCase())).size !== state.authUsers.length
      || new Set(state.branches.map(row => row.code)).size !== state.branches.length
      || new Set(state.workers.map(row => row.staff_code)).size !== state.workers.length) refuse();
  // Projection includes all rows relevant to the three targets and collisions.
  for (const profile of state.profiles) if (!state.authUsers.some(user => user.id === profile.id)) refuse();
  for (const worker of state.workers) {
    if (!state.profiles.some(profile => profile.id === worker.auth_profile_id)
        || !state.branches.some(branch => branch.id === worker.branch_id)) refuse();
  }
  for (const access of state.managerBranchAccess) {
    if (!state.profiles.some(profile => profile.id === access.profile_id)
        || !state.branches.some(branch => branch.id === access.branch_id)) refuse();
  }
}

export function planLocalAccounts(snapshotJson) {
  const state = parseOfflineJson(snapshotJson);
  validateProjection(state);
  const branch = state.branches.find(row => row.code === 'DEMO-001');
  if (!branch || !branch.is_active) refuse();
  const actions = ACCOUNT_TARGETS.map(target => {
    const user = state.authUsers.find(row => row.email.toLowerCase() === target.email);
    if (!user) {
      if (target.protected || (target.accountType === 'worker'
          && state.workers.some(row => row.staff_code === WORKER_STAFF_CODE))) refuse();
      return Object.freeze({ ...target, action: 'create', authUserId: null });
    }
    const profile = state.profiles.find(row => row.id === user.id);
    if (!user.confirmed || !profile || !profile.is_active || profile.account_type !== target.accountType) refuse();
    const linked = state.workers.filter(row => row.auth_profile_id === user.id);
    const access = state.managerBranchAccess.filter(row => row.profile_id === user.id);
    if (target.accountType === 'worker') {
      if (linked.length !== 1 || linked[0].status !== 'active' || linked[0].branch_id !== branch.id
          || linked[0].id === user.id || access.length !== 0) refuse();
    } else if (linked.length !== 0) refuse();
    if (target.accountType === 'manager' && !access.some(row => row.branch_id === branch.id)) refuse();
    if (target.accountType === 'system_admin' && access.length !== 0) refuse();
    return Object.freeze({ ...target, action: 'verify-existing', authUserId: user.id });
  });
  return Object.freeze({ mode: 'offline-plan', executionAuthorized: false, branchId: branch.id, actions: Object.freeze(actions) });
}

/** A closed, in-memory mock runner. No injectable live adapter or secret input.
 * Auth creation and profile transaction are deliberately separate checkpoints.
 * On failure mock Auth rows may remain; never compensate-delete or auto-repair.
 */
export function simulateLocalAccountPreparation(snapshotJson, identitiesJson, failAt = null) {
  if (![null, 'auth-response-lost', 'before-db', 'during-db', 'after-db'].includes(failAt)) refuse();
  const plan = planLocalAccounts(snapshotJson);
  const state = parseOfflineJson(snapshotJson);
  const events = [];
  const created = [];
  const result = status => Object.freeze({ mode: 'offline-simulation', executionAuthorized: false, status, events: Object.freeze(events), state,
    recovery: created.length ? 'STOP_REVIEW_PARTIAL_STATE_NO_AUTOMATIC_DELETE' : 'NONE' });
  if (!plan.actions.some(action => action.action === 'create')) return result('already-consistent');
  const identities = parseOfflineJson(identitiesJson);
  exact(identities, ['workerAuthId', 'workerRowId', 'systemAdminAuthId']);
  const ids = Object.values(identities);
  const neededIds = plan.actions.filter(action => action.action === 'create').flatMap(action =>
    action.accountType === 'worker' ? [identities.workerAuthId, identities.workerRowId] : [identities.systemAdminAuthId]);
  if (!ids.every(uuid) || new Set(neededIds).size !== neededIds.length
      || neededIds.some(id => state.authUsers.some(row => row.id === id) || state.workers.some(row => row.id === id))) refuse();
  for (const action of plan.actions) {
    if (action.action !== 'create') continue;
    const id = action.accountType === 'worker' ? identities.workerAuthId : identities.systemAdminAuthId;
    state.authUsers.push({ id, email: action.email, confirmed: true });
    created.push(id); events.push(`MOCK_AUTH_CREATED_${action.accountType}`);
    if (failAt === 'auth-response-lost') return result('stopped');
  }
  if (created.length === 0) return result('already-consistent');
  if (failAt === 'before-db') return result('stopped');
  const transaction = structuredClone(state);
  for (const action of plan.actions) {
    if (action.action !== 'create') continue;
    const id = action.accountType === 'worker' ? identities.workerAuthId : identities.systemAdminAuthId;
    transaction.profiles.push({ id, display_name: action.accountType === 'worker' ? 'Local Worker A' : 'Local System Admin', account_type: action.accountType, is_active: true });
    if (action.accountType === 'worker') transaction.workers.push({ id: identities.workerRowId, staff_code: WORKER_STAFF_CODE, branch_id: plan.branchId, auth_profile_id: id, display_name: 'Local Worker A', status: 'active' });
  }
  if (failAt === 'during-db') { events.push('MOCK_DB_ROLLED_BACK'); return result('stopped'); }
  planLocalAccounts(JSON.stringify(transaction));
  state.profiles = transaction.profiles; state.workers = transaction.workers;
  events.push('MOCK_DB_COMMITTED');
  return result(failAt === 'after-db' ? 'stopped' : 'prepared');
}
