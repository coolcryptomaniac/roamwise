/* ============================================================================
   worker/lib/firestore-rest.js — minimal Firestore REST helpers for the
   Worker's admin-only push-send endpoint (worker/handlers/push.js).
   ============================================================================
   Named exports only — see worker/lib/http.js header for why.

   Calls here are authenticated with the service-account OAuth2 access token
   from worker/lib/service-account.js, NOT a user credential — that token has
   IAM-level access to Firestore and bypasses firestore.rules entirely (the
   same trust model as the Firebase Admin SDK), which is why this file lives
   only on the Worker, never in client code. It reads only what
   worker/handlers/push.js needs (admins/{uid}, users/{uid}'s pushTokens map)
   and writes only to prune dead tokens after a send — it is not a general
   Firestore client. */

const BASE = 'https://firestore.googleapis.com/v1';

function docPath(projectId, path) {
  return `${BASE}/projects/${projectId}/databases/(default)/documents/${path}`;
}

// Firestore REST "Value" wire format -> plain JS. Only the value types this
// file's own writes/reads can ever produce need handling.
function fromFirestoreValue(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return parseInt(v.integerValue, 10);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('mapValue' in v) return fromFirestoreFields(v.mapValue.fields || {});
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromFirestoreValue);
  return null;
}

function fromFirestoreFields(fields) {
  const out = {};
  for (const k of Object.keys(fields || {})) out[k] = fromFirestoreValue(fields[k]);
  return out;
}

function toFirestoreValue(v) {
  if (v == null) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFirestoreValue) } };
  if (typeof v === 'object') return { mapValue: { fields: toFirestoreFields(v) } };
  throw new Error('Unsupported Firestore value');
}

function toFirestoreFields(obj) {
  const out = {};
  for (const k of Object.keys(obj || {})) out[k] = toFirestoreValue(obj[k]);
  return out;
}

/** GET a document. Returns null if it doesn't exist (never throws for 404). */
export async function getDoc(env, accessToken, projectId, path) {
  const res = await fetch(docPath(projectId, path), {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Firestore GET ${path} failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return fromFirestoreFields(data.fields || {});
}

/**
 * Deletes one or more field paths from a document (used to prune dead FCM
 * tokens after a send — see worker/handlers/push.js). Best-effort: callers
 * should treat failures here as non-fatal, since the notification itself
 * has already been sent by the time cleanup runs.
 */
export async function deleteFields(env, accessToken, projectId, path, fieldPaths) {
  if (!fieldPaths || !fieldPaths.length) return;
  const mask = fieldPaths.map((p) => `updateMask.fieldPaths=${encodeURIComponent(p)}`).join('&');
  const res = await fetch(`${docPath(projectId, path)}?${mask}`, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ fields: {} }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Firestore PATCH ${path} failed (${res.status}): ${text.slice(0, 300)}`);
  }
}

/** Patch a small, explicit field set on a trusted server-owned document. */
export async function updateDoc(env, accessToken, projectId, path, values) {
  const keys = Object.keys(values || {});
  if (!keys.length) return;
  const mask = keys.map((p) => `updateMask.fieldPaths=${encodeURIComponent(p)}`).join('&');
  const res = await fetch(`${docPath(projectId, path)}?${mask}`, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ fields: toFirestoreFields(values) }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Firestore PATCH ${path} failed (${res.status}): ${body.slice(0, 300)}`);
  }
}

/**
 * Create a document ONLY if it does not exist yet (Firestore precondition
 * currentDocument.exists=false). Returns true when created, false when the id
 * was already taken. Used for stay-ledger codes so a repeated or hostile
 * request can never overwrite an existing record.
 */
export async function createDocIfAbsent(env, accessToken, projectId, collectionPath, id, values) {
  const url = `${docPath(projectId, collectionPath)}?documentId=${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields(values) }),
  });
  if (res.status === 409) return false;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Firestore CREATE ${collectionPath}/${id} failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return true;
}

/** List up to `max` documents of a collection as { id, ...fields } (admin reports only). */
export async function listDocs(env, accessToken, projectId, collectionPath, max = 1000) {
  const out = [];
  let pageToken = '';
  while (out.length < max) {
    const url = `${docPath(projectId, collectionPath)}?pageSize=${Math.min(300, max - out.length)}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
    if (res.status === 404) break;
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Firestore LIST ${collectionPath} failed (${res.status}): ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    for (const d of data.documents || []) {
      out.push({ id: String(d.name || '').split('/').pop(), ...fromFirestoreFields(d.fields || {}) });
    }
    pageToken = data.nextPageToken || '';
    if (!pageToken) break;
  }
  return out;
}

/**
 * Structured query: docs of `collection` whose `field` (a timestamp) is before `beforeIso`,
 * oldest first. Returns [{ id, ...fields }] (admin/cron use only).
 */
export async function queryBeforeTimestamp(env, accessToken, projectId, collection, field, beforeIso, limit = 300) {
  const url = `${BASE}/projects/${projectId}/databases/(default)/documents:runQuery`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: { fieldFilter: { field: { fieldPath: field }, op: 'LESS_THAN', value: { timestampValue: beforeIso } } },
        orderBy: [{ field: { fieldPath: field }, direction: 'ASCENDING' }],
        limit: Math.min(1000, Math.max(1, limit)),
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Firestore QUERY ${collection} failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).filter((r) => r.document).map((r) => ({
    id: String(r.document.name || '').split('/').pop(), ...fromFirestoreFields(r.document.fields || {}),
  }));
}
