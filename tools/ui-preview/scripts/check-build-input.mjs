import { checkBoundary, previewRoot } from './check-boundary.mjs';
import { captureInputs, verifyInputs } from './build-input-boundary.mjs';
import { createVerifiedInputGate } from './verified-input-gate.mjs';
try {
 const snapshot=captureInputs(previewRoot);
 const overrides=Object.fromEntries(Object.entries(snapshot).map(([name,item])=>['tools/ui-preview/'+name,item.text]));
 if(!checkBoundary(overrides).ok)throw new Error('boundary rejected');
 verifyInputs(previewRoot,snapshot);
 const gate=createVerifiedInputGate(previewRoot,snapshot);
 gate.load(snapshot['src/main.tsx'].target);
 if(gate.executionAuthorized!==false)throw new Error('unexpected build authorization');
 console.log('INPUT_SNAPSHOT_PASS');
 // Until a reviewed Vite resolver/load hook consumes this immutable snapshot,
 // there is no authorized build path. Do not invoke Vite on live source files.
 console.error('PREVIEW_BUILD_INPUT_UNVERIFIED');
 process.exitCode=1;
} catch {
 console.error('PREVIEW_BUILD_INPUT_REJECTED');
 process.exitCode=1;
}
