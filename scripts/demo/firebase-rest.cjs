/**
 * scripts/demo/firebase-rest.cjs
 *
 * Minimal Firestore + Identity Toolkit REST helpers for the demo-data scripts.
 * Authenticates with YOUR existing Firebase CLI login (no service-account key).
 * Access tokens are held in memory only and never printed.
 *
 * Requires firebase-tools to be available, e.g. run once:
 *   npx --yes firebase-tools@15.35.0 login
 * Or set FIREBASE_TOOLS_DIR=/path/to/node_modules/firebase-tools
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const PROJECT_ID = 'cse-research-hub';
const DB = `projects/${PROJECT_ID}/databases/(default)/documents`;
const FIRESTORE = `https://firestore.googleapis.com/v1/${DB}`;
const IDENTITY = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}`;

// ---------------------------------------------------------------------------
// Auth via firebase-tools
// ---------------------------------------------------------------------------

function findFirebaseTools() {
  const candidates = [];
  if (process.env.FIREBASE_TOOLS_DIR) candidates.push(process.env.FIREBASE_TOOLS_DIR);
  for (const root of [path.join(os.homedir(), '.npm', '_npx'), '/tmp/.npm-cache/_npx']) {
    if (!fs.existsSync(root)) continue;
    for (const dir of fs.readdirSync(root)) {
      candidates.push(path.join(root, dir, 'node_modules', 'firebase-tools'));
    }
  }
  const found = candidates
    .filter((c) => fs.existsSync(path.join(c, 'lib', 'auth.js')))
    .map((c) => ({ dir: c, version: require(path.join(c, 'package.json')).version }))
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
  if (!found.length) {
    throw new Error('firebase-tools not found. Run: npx --yes firebase-tools@15.35.0 login');
  }
  return path.join(found[0].dir, 'lib');
}

let cachedToken = null;
async function getToken() {
  if (cachedToken) return cachedToken;
  const lib = findFirebaseTools();
  const auth = require(path.join(lib, 'auth'));
  const scopes = require(path.join(lib, 'scopes'));
  const account = auth.getProjectDefaultAccount(process.cwd()) || auth.getGlobalDefaultAccount();
  if (!account || !account.tokens || !account.tokens.refresh_token) {
    throw new Error('Not logged in to the Firebase CLI. Run: npx --yes firebase-tools@15.35.0 login');
  }
  const result = await auth.getAccessToken(account.tokens.refresh_token, [scopes.CLOUD_PLATFORM, scopes.EMAIL]);
  cachedToken = result.access_token;
  return cachedToken;
}

async function api(method, url, body) {
  const token = await getToken();
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = json.error ? `${json.error.status || res.status}: ${json.error.message}` : res.status;
    const err = new Error(`${method} ${url.replace(/\?.*/, '')} failed — ${msg}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

// ---------------------------------------------------------------------------
// Firestore value encoding
// ---------------------------------------------------------------------------

function encode(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encode) } };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'object') return { mapValue: { fields: encodeFields(v) } };
  throw new Error(`Unsupported value: ${v}`);
}
function encodeFields(obj) {
  const fields = {};
  for (const [k, val] of Object.entries(obj)) fields[k] = encode(val);
  return fields;
}
function decode(v) {
  if ('nullValue' in v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return new Date(v.timestampValue);
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  return undefined;
}
function decodeFields(fields) {
  const out = {};
  for (const [k, val] of Object.entries(fields || {})) out[k] = decode(val);
  return out;
}

// ---------------------------------------------------------------------------
// Firestore operations
// ---------------------------------------------------------------------------

const docName = (relPath) => `${DB}/${relPath}`;

/**
 * Atomic commit (max 500 per request). Writes:
 *   { set: 'col/id', data }                — create / overwrite the document
 *   { set: 'col/id', data, mask: [paths] } — update ONLY these field paths
 *   { delete: 'col/id' }
 */
async function commit(writes) {
  for (let i = 0; i < writes.length; i += 400) {
    const chunk = writes.slice(i, i + 400).map((w) => {
      if (w.delete) return { delete: docName(w.delete) };
      const write = { update: { name: docName(w.set), fields: encodeFields(w.data) } };
      if (w.mask) {
        write.updateMask = { fieldPaths: w.mask };
        write.currentDocument = { exists: true };
      }
      return write;
    });
    await api('POST', `${FIRESTORE}:commit`, { writes: chunk });
  }
}

/** Lists all document IDs (and data) in a collection path, e.g. 'users' or 'users/x/saved_items'. */
async function listDocs(collectionPath) {
  const out = [];
  let pageToken = '';
  do {
    const url = `${FIRESTORE}/${collectionPath}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await api('GET', url);
    for (const d of res.documents || []) {
      out.push({ id: d.name.split('/').pop(), data: decodeFields(d.fields) });
    }
    pageToken = res.nextPageToken || '';
  } while (pageToken);
  return out;
}

// ---------------------------------------------------------------------------
// Firebase Auth (admin REST)
// ---------------------------------------------------------------------------

async function upsertAuthUser({ localId, email, password, displayName }) {
  try {
    await api('POST', `${IDENTITY}/accounts`, { localId, email, password, displayName, emailVerified: true });
    return 'created';
  } catch (err) {
    if (err.status === 400 && /DUPLICATE|EXISTS/i.test(JSON.stringify(err.body))) {
      await api('POST', `${IDENTITY}/accounts:update`, { localId, email, password, displayName, emailVerified: true });
      return 'updated';
    }
    throw err;
  }
}

async function deleteAuthUser(localId) {
  try {
    await api('POST', `${IDENTITY}/accounts:delete`, { localId });
    return true;
  } catch (err) {
    if (err.status === 400 && /USER_NOT_FOUND/i.test(JSON.stringify(err.body))) return false;
    throw err;
  }
}

module.exports = { PROJECT_ID, commit, listDocs, upsertAuthUser, deleteAuthUser, encodeFields, decodeFields };
