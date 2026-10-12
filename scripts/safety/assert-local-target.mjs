/** URL syntax policy only; does not establish DB identity or safe execution. */
export const LOCAL_TARGET_POLICY = Object.freeze({
  api: Object.freeze({ protocol: 'http:', port: '55321', path: '/' }),
  database: Object.freeze({ protocol: 'postgresql:', port: '55322', path: '/postgres' }),
});

const reasons = Object.freeze({
  INPUT: 'Expected a nonempty ASCII URL string.',
  KIND: 'Unknown target kind.',
  SYNTAX: 'Noncanonical or ambiguous URL syntax.',
  PROTOCOL: 'Protocol is not permitted.',
  HOST: 'An explicit approved loopback address is required.',
  PORT: 'Port is not permitted.',
  PATH: 'Path or database name is not permitted.',
  EXTRA: 'Query and fragment are not permitted.',
  AUTH: 'Credentials are not permitted in this URL form.',
});

export class LocalTargetError extends Error {
  constructor(code) {
    super(reasons[code]);
    this.name = 'LocalTargetError';
    this.code = `LOCAL_TARGET_${code}`;
  }
}

const reject = (code) => { throw new LocalTargetError(code); };

/**
 * API: http://127.0.0.1:55321[/] or http://[::1]:55321[/], no credentials.
 * DB: postgresql://[user[:password]@]127.0.0.1:55322/postgres (or [::1]).
 * DB credentials use literal ASCII unreserved characters only; never returned.
 * Reject localhost, encodings, normalization aliases and unknown target kinds.
 * No DNS, environment, filesystem, process or network operations are performed.
 */
export function assertLocalTarget(input, kind) {
  if (typeof kind !== 'string' || (kind !== 'api' && kind !== 'database')) reject('KIND');
  const policy = LOCAL_TARGET_POLICY[kind];
  if (typeof input !== 'string' || input.length === 0 || /[^\x21-\x7e]/.test(input)) reject('INPUT');
  if (/[\\%]/.test(input)) reject('SYNTAX');
  if (/[?#]/.test(input)) reject('EXTRA');
  const parts = input.match(/^([a-z]+):\/\/([^/]+)(\/.*)?$/);
  if (!parts) reject('SYNTAX');
  const [, scheme, authority, rawPath = ''] = parts;
  if (`${scheme}:` !== policy.protocol) reject('PROTOCOL');
  const auth = authority.split('@');
  if (auth.length > 2) reject('AUTH');
  if (auth.length === 2 && (kind !== 'database' || !/^[A-Za-z0-9._~-]+(?::[A-Za-z0-9._~-]+)?$/.test(auth[0]))) reject('AUTH');
  const hostPort = auth.at(-1).match(/^(127\.0\.0\.1|\[::1\]):([0-9]+)$/);
  if (!hostPort) reject('HOST');
  if (hostPort[2] !== policy.port) reject('PORT');
  if (rawPath !== policy.path && !(kind === 'api' && rawPath === '')) reject('PATH');
  let parsed;
  try { parsed = new URL(input); } catch { reject('SYNTAX'); }
  if (parsed.hostname !== hostPort[1] || parsed.port !== policy.port || parsed.protocol !== policy.protocol
      || parsed.search || parsed.hash || parsed.pathname !== policy.path) reject('SYNTAX');
  // Deliberately return no credentials, input string or URL object.
  return Object.freeze({ kind, protocol: policy.protocol, hostname: hostPort[1], port: policy.port, path: policy.path });
}
