import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { makePreviewPlan, minimalEnvironment, assertCheckResult, requireRuntimeAuthorization } from './run-preview.mjs';
const executable = path.resolve('verified-node.exe');
const plan = env => makePreviewPlan({version:'v22.23.3',platform:'win32',executable,environment:env});
function rejects(fn, code) { assert.throws(fn, error => error.code === code); }
test('model: static preview command is loopback-only and strictPort',()=>{
 const p=plan({});
 assert.equal(p.host,'127.0.0.1');assert.equal(p.port,5178);assert.equal(p.strictPort,true);
 assert.equal(p.argv[1],'preview');assert.equal(p.argv[p.argv.indexOf('--host')+1],'127.0.0.1');
 assert.ok(p.argv.includes('--strictPort'));assert.ok(!p.argv.includes('dev'));
});
test('model: no execution authority from a correct version',()=>{
 const p=plan({});assert.equal(p.executionAuthorized,false);
 for(const key of ['nodeEgressVerified','browserEgressVerified','descendantContainmentVerified','processTreeCleanupVerified'])assert.equal(p.isolation[key],false);
});
test('model: default Node 24 is refused',()=>rejects(()=>makePreviewPlan({version:'v24.16.0',platform:'win32',executable}),'NODE_VERSION_REJECTED'));
test('model: other Node 22 patch is refused',()=>rejects(()=>makePreviewPlan({version:'v22.23.2',platform:'win32',executable}),'NODE_VERSION_REJECTED'));
test('model: unvalidated OS is refused',()=>rejects(()=>makePreviewPlan({version:'v22.23.3',platform:'linux',executable}),'PLATFORM_NOT_VALIDATED'));
test('model: relative executable path is refused',()=>rejects(()=>makePreviewPlan({version:'v22.23.3',platform:'win32',executable:'node.exe'}),'NODE_PATH_REJECTED'));
test('model: inherited credentials/proxy/Node behavior are dropped',()=>{
 const env=minimalEnvironment({SystemRoot:'OS-root',WINDIR:'OS-root',TEMP:'scratch',TMP:'scratch',
  NODE_OPTIONS:'synthetic',NODE_PATH:'synthetic',PATH:'synthetic',HTTP_PROXY:'synthetic',HTTPS_PROXY:'synthetic',
  AWS_ACCESS_KEY_ID:'synthetic',AWS_SECRET_ACCESS_KEY:'synthetic',SUPABASE_SERVICE_ROLE_KEY:'synthetic',
  LINE_LOGIN_CHANNEL_SECRET:'synthetic',NPM_CONFIG_USERCONFIG:'synthetic',OPSCUE_SECRET:'synthetic'},executable);
 assert.deepEqual(Object.keys(env).sort(),['PATH','SystemRoot','TEMP','TMP','WINDIR'].sort());
 assert.equal(env.PATH,path.dirname(executable));
});
test('model: explicit OS values only; no HOME/USERPROFILE/APPDATA',()=>{
 const env=minimalEnvironment({HOME:'synthetic',USERPROFILE:'synthetic',APPDATA:'synthetic',TEMP:42},executable);
 assert.deepEqual(Object.keys(env),['PATH']);
});
test('model: plan and its environment cannot be mutated',()=>{
 const p=plan({});assert.ok(Object.isFrozen(p));assert.ok(Object.isFrozen(p.argv));assert.ok(Object.isFrozen(p.environment));assert.ok(Object.isFrozen(p.isolation));
});
test('model: successful read-only check is accepted',()=>assert.doesNotThrow(()=>assertCheckResult({status:0,signal:null},'CHECK_FAILED')));
for(const [label,result]of [['failure',{status:1}],['skipped/missing',null],['cancelled',{status:null,signal:'SIGTERM'}],['timeout',{status:null,error:{code:'ETIMEDOUT'}}]]){
 test('model: '+label+' check is refused',()=>rejects(()=>assertCheckResult(result,'CHECK_FAILED'),'CHECK_FAILED'));
}
test('model: unsafe host execution is always refused',()=>rejects(()=>requireRuntimeAuthorization(plan({})),'PREVIEW_ISOLATION_UNVERIFIED'));
test('model: forged caller assertions cannot authorize execution',()=>rejects(()=>requireRuntimeAuthorization({
 executionAuthorized:true,isolation:{nodeEgressVerified:true,browserEgressVerified:true,descendantContainmentVerified:true,processTreeCleanupVerified:true},
}),'PREVIEW_ISOLATION_UNVERIFIED'));
test('model: environment flag cannot authorize execution',()=>rejects(()=>requireRuntimeAuthorization(plan({OPSCUE_PREVIEW_ISOLATION_VERIFIED:'true'})),'PREVIEW_ISOLATION_UNVERIFIED'));
