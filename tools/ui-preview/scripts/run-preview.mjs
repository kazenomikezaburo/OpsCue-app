import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const requiredVersion = 'v22.23.3';
const approvedWindowsNodeHash = '9c9245166b4a8e182e0b797da9c20136117ff24368eaff1fec8343a123c8db0e';

export class PreviewLaunchError extends Error {
  constructor(code) { super(code); this.name = 'PreviewLaunchError'; this.code = code; }
}
function refuse(code) { throw new PreviewLaunchError(code); }

export function minimalEnvironment(input, executable) {
  const env = {};
  for (const key of ['SystemRoot', 'WINDIR', 'TEMP', 'TMP']) {
    if (typeof input[key] === 'string' && input[key]) env[key] = input[key];
  }
  // Parent PATH, NODE_OPTIONS, npm settings, proxy and credentials are never copied.
  env.PATH = path.dirname(executable);
  return Object.freeze(env);
}

export function makePreviewPlan({ version, platform, executable, environment = {} }) {
  if (version !== requiredVersion) refuse('NODE_VERSION_REJECTED');
  if (platform !== 'win32') refuse('PLATFORM_NOT_VALIDATED');
  if (typeof executable !== 'string' || !path.isAbsolute(executable)) refuse('NODE_PATH_REJECTED');
  return Object.freeze({
    host: '127.0.0.1',
    port: 5178,
    strictPort: true,
    cwd: root,
    // Static Vite preview, not Next.js or a Vite development server.
    executable,
    argv: Object.freeze([
      path.join(root, 'node_modules/vite/bin/vite.js'), 'preview',
      '--config', path.join(root, 'vite.config.ts'),
      '--host', '127.0.0.1', '--port', '5178', '--strictPort',
    ]),
    environment: minimalEnvironment(environment, executable),
    executionAuthorized: false,
    isolation: Object.freeze({
      nodeEgressVerified: false,
      browserEgressVerified: false,
      descendantContainmentVerified: false,
      processTreeCleanupVerified: false,
      reason: 'VALIDATED_ISOLATION_BACKEND_REQUIRED',
    }),
  });
}

export function assertCheckResult(result, code) {
  if (!result || result.error || result.signal || result.status !== 0) refuse(code);
}

export function requireRuntimeAuthorization(plan) {
  // Intentional hard stop. No CLI flag, env value or caller assertion can grant
  // host execution. Implementing a real isolated backend requires a separate
  // reviewed change and guest-side IPv4/IPv6/DNS/browser/cleanup verification.
  void plan;
  refuse('PREVIEW_ISOLATION_UNVERIFIED');
}

function realNodeIsApproved() {
  if (process.platform !== 'win32') refuse('PLATFORM_NOT_VALIDATED');
  if (fs.lstatSync(process.execPath).isSymbolicLink() ||
      path.resolve(fs.realpathSync(process.execPath)) !== path.resolve(process.execPath)) refuse('NODE_PATH_REJECTED');
  const hash = crypto.createHash('sha256').update(fs.readFileSync(process.execPath)).digest('hex');
  if (hash !== approvedWindowsNodeHash) refuse('NODE_INTEGRITY_REJECTED');
  const npmPackage = path.join(path.dirname(process.execPath), 'node_modules/npm/package.json');
  if (JSON.parse(fs.readFileSync(npmPackage, 'utf8')).version !== '10.9.9') refuse('NPM_VERSION_REJECTED');
}

function snapshotPackage() {
  const snapshot = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) refuse('PACKAGE_REDIRECT_REJECTED');
      // Existence is rejected without reading potentially secret config contents.
      if (/^\.env(?:\.|$)|^\.npmrc$/i.test(entry.name)) refuse('PACKAGE_ENV_FILE_REJECTED');
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile()) snapshot.push([
        path.relative(root, file),
        crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
      ]);
      else refuse('PACKAGE_ENTRY_REJECTED');
    }
  }
  walk(root);
  const index = path.resolve(root, '../../.git/index');
  snapshot.push(['owner-clone-index', crypto.createHash('sha256').update(fs.readFileSync(index)).digest('hex')]);
  return JSON.stringify(snapshot);
}

function runReadOnlyCheck(filename, env) {
  // These reviewed AST inspectors do not execute app/bundle/fixture code or
  // spawn grandchildren. A timeout is a failure, never permission to proceed.
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', filename)], {
    cwd: root, env, encoding: 'utf8', timeout: 20000, killSignal: 'SIGKILL',
    windowsHide: true, maxBuffer: 1024 * 1024,
  });
  assertCheckResult(result, filename === 'check-boundary.mjs' ? 'BOUNDARY_CHECK_FAILED' : 'BUILD_OUTPUT_CHECK_FAILED');
}

export function main() {
  if (process.argv.length !== 2) refuse('LAUNCH_ARGUMENTS_REJECTED');
  const plan = makePreviewPlan({
    version: process.version, platform: process.platform,
    executable: process.execPath, environment: process.env,
  });
  if (path.resolve(process.cwd()) !== root || path.resolve(fs.realpathSync(root)) !== root) refuse('WORKING_DIRECTORY_REJECTED');
  realNodeIsApproved();
  const before = snapshotPackage();
  try {
    runReadOnlyCheck('check-boundary.mjs', plan.environment);
    runReadOnlyCheck('check-build.mjs', plan.environment);
  } finally {
    if (snapshotPackage() !== before) refuse('PRESERVATION_CHECK_FAILED');
  }
  // Never open a port or start Vite/browser while isolation and native process
  // containment are unverified. A port-probe implementation is also deferred.
  requireRuntimeAuthorization(plan);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) {
    const code = error instanceof PreviewLaunchError ? error.code : 'PREVIEW_PREFLIGHT_FAILED';
    console.error(code); // Do not print arbitrary exception messages or env values.
    process.exitCode = code === 'PREVIEW_ISOLATION_UNVERIFIED' ? 2 : 1;
  }
}
