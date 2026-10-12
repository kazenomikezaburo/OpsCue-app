import { pathToFileURL } from 'node:url';
import { assertLiveAccountPreparationAllowed } from '../safety/verify-local-account-target.mjs';

/** Stage 2 entry point. No SDK/driver, password reads, dotenv, Docker or DB IO.
 * The only executable behavior is a fixed refusal. Offline planning/simulation
 * lives in local-account-plan.mjs and is exercised by synthetic unit tests.
 */
export function prepareLocalAccounts() {
  assertLiveAccountPreparationAllowed();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { prepareLocalAccounts(); }
  catch {
    process.stderr.write('LOCAL_ACCOUNT_TARGET_UNVERIFIED: stage 2 is offline-only; no account operations performed.\n');
    process.exitCode = 1;
  }
}
