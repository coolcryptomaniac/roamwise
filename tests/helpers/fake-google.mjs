/* In-memory stand-in for the Google services the Worker calls: service-account OAuth, Firebase ID-token keys (JWKS)
   and the Firestore REST API (get, patch with updateMask, create-if-absent, list, runQuery equality).
   install() swaps globalThis.fetch for any request to those hosts and passes everything else through.
   Tokens are real RS256 JWTs signed by a key made here, so the Worker's own verifier runs unchanged. */
import { generateKeyPairSync, createSign, randomUUID } from 'node:crypto';

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const PROJECT = 'roamwisepro';

function toValue(v) {
  if (v == null) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toValue(x)])) } };
}
function fromValue(v) {
  if (!v || 'nullValue' in v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromValue);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, fromValue(x)]));
  return null;
}
const fromFields = (f) => Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, fromValue(v)]));
const toFields = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, toValue(v)]));
const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export function createFakeGoogle() {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const kid = 'test-key-1';
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid, alg: 'RS256', use: 'sig' };
  const serviceAccount = JSON.stringify({ type: 'service_account', project_id: PROJECT, client_email: 'worker@roamwisepro.iam.gserviceaccount.com',
    private_key: privateKey.export({ format: 'pem', type: 'pkcs8' }), private_key_id: 'sa1' });
  const docs = new Map(); // 'collection/id' -> plain object
  const calls = [];
  const mails = []; // emails the Worker sent through the Gmail relay (env.GMAIL_RELAY_URL = https://mail.test/send)

  function idToken({ uid, email, emailVerified = true, expiresIn = 3600 }) {
    const now = Math.floor(Date.now() / 1000);
    const header = b64u(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' }));
    const payload = b64u(JSON.stringify({ iss: 'https://securetoken.google.com/' + PROJECT, aud: PROJECT, sub: uid, user_id: uid,
      email, email_verified: emailVerified, iat: now - 5, exp: now + expiresIn, auth_time: now - 5 }));
    const signer = createSign('RSA-SHA256'); signer.update(header + '.' + payload);
    return header + '.' + payload + '.' + b64u(signer.sign(privateKey));
  }

  async function handle(url, init = {}) {
    const u = new URL(url), method = (init.method || 'GET').toUpperCase();
    calls.push(method + ' ' + u.pathname);
    if (u.hostname === 'mail.test') { mails.push(JSON.parse(init.body)); return reply(200, { ok: true }); }
    if (u.hostname === 'oauth2.googleapis.com') return reply(200, { access_token: 'fake-access', expires_in: 3600 });
    if (u.hostname === 'www.googleapis.com' && u.pathname.includes('/jwk/')) return reply(200, { keys: [jwk] });
    const root = '/v1/projects/' + PROJECT + '/databases/(default)/documents';
    if (!u.pathname.startsWith(root)) return reply(404, { error: 'unknown path' });
    const rest = decodeURIComponent(u.pathname.slice(root.length));
    if (rest === ':runQuery' && method === 'POST') {
      const q = JSON.parse(init.body).structuredQuery;
      const col = q.from[0].collectionId, f = q.where && q.where.fieldFilter;
      const want = f && fromValue(f.value);
      const rows = [...docs.entries()].filter(([k, d]) => k.startsWith(col + '/') && k.split('/').length === 2 && (!f || d[f.field.fieldPath] === want))
        .slice(0, q.limit || 1000);
      return reply(200, rows.length ? rows.map(([k, d]) => ({ document: { name: 'projects/' + PROJECT + '/databases/(default)/documents/' + k, fields: toFields(d) } })) : [{ readTime: 'x' }]);
    }
    const path = rest.replace(/^\//, ''), parts = path.split('/');
    if (parts.length % 2 === 1) { // collection
      if (method === 'POST') {
        const id = u.searchParams.get('documentId') || randomUUID(), key = path + '/' + id;
        if (docs.has(key)) return reply(409, { error: { status: 'ALREADY_EXISTS' } });
        docs.set(key, fromFields(JSON.parse(init.body).fields));
        return reply(200, { name: key });
      }
      const rows = [...docs.entries()].filter(([k]) => k.startsWith(path + '/') && k.split('/').length === parts.length + 1);
      return reply(200, { documents: rows.map(([k, d]) => ({ name: 'projects/' + PROJECT + '/databases/(default)/documents/' + k, fields: toFields(d) })) });
    }
    if (method === 'GET') return docs.has(path) ? reply(200, { name: path, fields: toFields(docs.get(path)) }) : reply(404, { error: { status: 'NOT_FOUND' } });
    if (method === 'PATCH') {
      const mask = u.searchParams.getAll('updateMask.fieldPaths');
      const incoming = fromFields(JSON.parse(init.body || '{}').fields);
      const prev = docs.get(path) || {};
      const next = { ...prev };
      for (const k of mask.length ? mask : Object.keys(incoming)) { if (k in incoming) next[k] = incoming[k]; else delete next[k]; }
      docs.set(path, next);
      return reply(200, { name: path, fields: toFields(next) });
    }
    if (method === 'DELETE') { docs.delete(path); return reply(200, {}); }
    return reply(405, {});
  }

  const realFetch = globalThis.fetch;
  const hosts = ['oauth2.googleapis.com', 'www.googleapis.com', 'firestore.googleapis.com', 'mail.test'];
  function install() {
    globalThis.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      if (hosts.includes(new URL(url).hostname)) return handle(url, init);
      return realFetch(input, init);
    };
    return () => { globalThis.fetch = realFetch; };
  }
  return { docs, calls, mails, install, idToken, project: PROJECT,
    env: { FIREBASE_SERVICE_ACCOUNT_JSON: serviceAccount, GMAIL_RELAY_URL: 'https://mail.test/send', GMAIL_RELAY_SECRET: 'test' } };
}
