import { types } from 'node:util';
import { assertLocalTarget } from './assert-local-target.mjs';

/**
 * Stage 1: pure comparison of synthetic snapshots, NEVER execution permission.
 * No Docker/SQL/network/filesystem/environment access, including at import time.
 * This is an adapter-neutral fixture contract, NOT a Docker inspect schema.
 * Actual label keys, network/volume identity acquisition and DB identity read
 * privileges remain unverified. A future reviewed adapter must supply them.
 * Approval provenance cannot be authenticated by this pure function; the caller
 * supplies separately approved expectations, never derived from observations.
 */
export const INTEGRATION_TARGET_POLICY = Object.freeze({
  scope: 'synthetic-only',
  projectId: 'opscue-app-dev',
  containerName: 'supabase_db_opscue-app-dev',
  databaseName: 'postgres',
  purpose: 'disposable-integration-test',
  apiPort: '55321',
  databasePort: '55322',
});

const messages = Object.freeze({
  INPUT: 'Invalid synthetic evidence structure.',
  SCOPE: 'Only synthetic comparison is supported.',
  APPROVAL: 'Separately approved expectations are required.',
  ACQUISITION: 'Complete successful evidence is required.',
  PROJECT: 'Project identity is not permitted.',
  URL: 'Local endpoint syntax or binding does not match.',
  CONTRACT: 'Confirmed synthetic metadata contract is required.',
  DOCKER: 'Docker identity evidence is invalid or does not match.',
  DATABASE: 'Database identity evidence is invalid or does not match.',
});

export class IntegrationTargetError extends Error {
  constructor(code) {
    const safeCode = typeof code === 'string' && Object.hasOwn(messages, code) ? code : 'INPUT';
    super(messages[safeCode]);
    this.name = 'IntegrationTargetError';
    this.code = `INTEGRATION_TARGET_${safeCode}`;
  }
}

// Only internally issued errors carry trusted rejection codes. WeakMap lookup
// never invokes caller code, including exception objects with Proxy prototypes.
const rejectionCodes = new WeakMap();
const reject = (code) => {
  const error = new IntegrationTargetError(code);
  rejectionCodes.set(error, code);
  throw error;
};
const plain = (value) => value !== null && typeof value === 'object'
  && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));

// Read own data properties only: never invoke getters or serialize caller data.
// Bounds also reject cycles, oversized input and exotic objects without echoing.
function snapshot(value, depth = 0, budget = { left: 512 }) {
  if (depth > 10 || --budget.left < 0) reject('INPUT');
  // isProxy does not execute traps, even for revoked or nested array Proxies.
  // This must precede Array.isArray, prototype/descriptor inspection and reads.
  if (types.isProxy(value)) reject('INPUT');
  if (value === null || ['string', 'boolean'].includes(typeof value)) {
    if (typeof value === 'string' && value.length > 4096) reject('INPUT');
    return value;
  }
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value;
  if (!Array.isArray(value) && !plain(value)) reject('INPUT');
  const keys = Reflect.ownKeys(value);
  const result = Array.isArray(value) ? [] : Object.create(null);
  for (const key of keys) {
    if (Array.isArray(value) && key === 'length') continue;
    if (typeof key !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(key)) reject('INPUT');
    if (Array.isArray(value) && !/^(0|[1-9][0-9]*)$/.test(key)) reject('INPUT');
    const property = Object.getOwnPropertyDescriptor(value, key);
    if (!property || !Object.hasOwn(property, 'value') || !property.enumerable) reject('INPUT');
    result[key] = snapshot(property.value, depth + 1, budget);
  }
  if (Array.isArray(value) && (result.length !== value.length || keys.length !== value.length + 1)) reject('INPUT');
  return result;
}

function fields(value, names, code) {
  if (!plain(value) || Object.keys(value).sort().join('|') !== [...names].sort().join('|')) reject(code);
}
const atom = (value) => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(value);
const fullId = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const labelKey = (value) => typeof value === 'string' && /^[a-z][a-z0-9_.-]{0,127}$/.test(value);
const uuid = (value) => typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);

function collection(value, validate, uniqueKey) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 16) reject('DOCKER');
  const seen = new Set();
  for (const item of value) {
    validate(item);
    const key = uniqueKey(item);
    if (seen.has(key)) reject('DOCKER');
    seen.add(key);
  }
}

function dockerEvidence(value) {
  fields(value, ['id', 'name', 'state', 'metadataContract', 'labels', 'context', 'networks', 'volumes', 'portBindings'], 'DOCKER');
  if (!fullId(value.id) || value.name !== INTEGRATION_TARGET_POLICY.containerName || value.state !== 'running') reject('DOCKER');
  fields(value.metadataContract, ['status', 'schemaId', 'projectLabelKey'], 'CONTRACT');
  const contract = value.metadataContract;
  if (contract.status !== 'confirmed' || contract.schemaId !== 'synthetic-v1' || !labelKey(contract.projectLabelKey)) reject('CONTRACT');
  if (!plain(value.labels) || Object.keys(value.labels).length === 0 || Object.keys(value.labels).length > 16) reject('DOCKER');
  for (const [key, label] of Object.entries(value.labels)) {
    if (!labelKey(key) || typeof label !== 'string' || label.length === 0 || label.length > 128 || /[^\x21-\x7e]/.test(label)) reject('DOCKER');
  }
  if (!Object.hasOwn(value.labels, contract.projectLabelKey)
      || value.labels[contract.projectLabelKey] !== INTEGRATION_TARGET_POLICY.projectId) reject('PROJECT');
  fields(value.context, ['name', 'endpoint'], 'DOCKER');
  if (!atom(value.context.name) || typeof value.context.endpoint !== 'string'
      || !/^(?:npipe:\/\/\.\/pipe\/[A-Za-z0-9_-]+|unix:\/\/(?:\/[A-Za-z0-9_-]+)+\.sock)$/.test(value.context.endpoint)) reject('DOCKER');
  collection(value.networks, (item) => {
    fields(item, ['id', 'name'], 'DOCKER');
    if (!fullId(item.id) || !atom(item.name)) reject('DOCKER');
  }, (item) => item.id);
  if (new Set(value.networks.map((item) => item.name)).size !== value.networks.length) reject('DOCKER');
  // sourceIdentity is an approved fixture fingerprint, not a claimed Docker ID.
  collection(value.volumes, (item) => {
    fields(item, ['name', 'sourceIdentity', 'destination', 'readOnly'], 'DOCKER');
    if (!atom(item.name) || !fullId(item.sourceIdentity)
        || item.destination !== '/var/lib/postgresql/data' || item.readOnly !== false) reject('DOCKER');
  }, (item) => item.destination);
  collection(value.portBindings, (item) => {
    fields(item, ['hostIp', 'hostPort', 'containerPort', 'protocol'], 'DOCKER');
    if (!['127.0.0.1', '::1'].includes(item.hostIp) || item.hostPort !== '55322'
        || item.containerPort !== '5432' || item.protocol !== 'tcp') reject('DOCKER');
  }, (item) => item.hostIp);
}

function databaseEvidence(value) {
  fields(value, ['environmentUuid', 'clusterIdentifier', 'databaseName', 'projectId', 'purpose'], 'DATABASE');
  if (!uuid(value.environmentUuid) || typeof value.clusterIdentifier !== 'string'
      || !/^[1-9][0-9]{0,19}$/.test(value.clusterIdentifier)
      || BigInt(value.clusterIdentifier) > 18446744073709551615n
      || value.databaseName !== INTEGRATION_TARGET_POLICY.databaseName
      || value.projectId !== INTEGRATION_TARGET_POLICY.projectId
      || value.purpose !== INTEGRATION_TARGET_POLICY.purpose) reject('DATABASE');
}

// Object key and collection order do not affect identity; extra entries do.
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).sort().join(',')}]`;
  if (plain(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

/**
 * Input: { approval, observation }, both caller-supplied synthetic data.
 * approval: schemaVersion=1, scope=synthetic-only, status=approved,
 *   source=external-review, projectId, docker and database expectations.
 * observation: schemaVersion=1, scope=synthetic-only, status=ok,
 *   source=synthetic-fixture, projectId, apiUrl, databaseUrl, docker, database.
 * All required fields are exact, successful and confirmed; no fallback/default.
 * Successful comparison does NOT prove real identity or authorize any operation.
 */
export function assertIntegrationTarget(input) {
  try {
    const data = snapshot(input);
    fields(data, ['approval', 'observation'], 'INPUT');
    const { approval, observation } = data;
    fields(approval, ['schemaVersion', 'scope', 'status', 'source', 'projectId', 'docker', 'database'], 'APPROVAL');
    fields(observation, ['schemaVersion', 'scope', 'status', 'source', 'projectId', 'apiUrl', 'databaseUrl', 'docker', 'database'], 'ACQUISITION');
    if (approval.scope !== 'synthetic-only' || observation.scope !== 'synthetic-only') reject('SCOPE');
    if (approval.schemaVersion !== 1 || approval.status !== 'approved' || approval.source !== 'external-review') reject('APPROVAL');
    if (observation.schemaVersion !== 1 || observation.status !== 'ok' || observation.source !== 'synthetic-fixture') reject('ACQUISITION');
    if (approval.projectId !== INTEGRATION_TARGET_POLICY.projectId || observation.projectId !== INTEGRATION_TARGET_POLICY.projectId) reject('PROJECT');
    let api, database;
    try {
      api = assertLocalTarget(observation.apiUrl, 'api');
      database = assertLocalTarget(observation.databaseUrl, 'database');
    } catch { reject('URL'); }
    if (api.port !== '55321' || database.port !== '55322' || api.hostname !== database.hostname) reject('URL');
    dockerEvidence(approval.docker);
    dockerEvidence(observation.docker);
    if (canonical(approval.docker) !== canonical(observation.docker)) reject('DOCKER');
    const hostIp = database.hostname === '[::1]' ? '::1' : database.hostname;
    if (!observation.docker.portBindings.some((binding) => binding.hostIp === hostIp)) reject('URL');
    databaseEvidence(approval.database);
    databaseEvidence(observation.database);
    if (canonical(approval.database) !== canonical(observation.database)) reject('DATABASE');
    return Object.freeze({ scope: 'synthetic-only', verdict: 'matched', executionAuthorized: false });
  } catch (error) {
    // Never retain input, foreign errors, cause, SQL or inspect environment data.
    // Do not inspect foreign exceptions via instanceof, descriptors or reads.
    const code = types.isProxy(error) ? 'INPUT' : (rejectionCodes.get(error) ?? 'INPUT');
    reject(code);
  }
}
