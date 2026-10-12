import { assertLocalTarget } from './assert-local-target.mjs';
import { assertIntegrationTarget } from './assert-integration-target.mjs';

export class LocalAccountTargetError extends Error {
  constructor() {
    super('Account preparation has no verified live target or execution approval.');
    this.name = 'LocalAccountTargetError';
    this.code = 'LOCAL_ACCOUNT_TARGET_UNVERIFIED';
  }
}
const refuse = () => { throw new LocalAccountTargetError(); };

/** Offline comparison only. Never reads env/config/approval files or probes IO.
 * Actual Docker labels/volume/daemon identities, DB fingerprint, and API-to-DB
 * routing have not been approved. No caller-provided flag enables live access.
 */
export function verifyOfflineAccountTarget(evidenceJson) {
  if (typeof evidenceJson !== 'string' || evidenceJson.length > 65536) refuse();
  try {
    const evidence = JSON.parse(evidenceJson);
    assertIntegrationTarget(evidence); // Comparison, NEVER execution permission.
    const api = assertLocalTarget(evidence.observation.apiUrl, 'api');
    const db = assertLocalTarget(evidence.observation.databaseUrl, 'database');
    if (api.hostname !== '127.0.0.1' || db.hostname !== '127.0.0.1') refuse();
    return Object.freeze({ mode: 'offline-comparison', executionAuthorized: false });
  } catch { refuse(); }
}

export function assertLiveAccountPreparationAllowed() {
  // Unconditionally blocked in stage 2, regardless of credentials or flags.
  refuse();
}
