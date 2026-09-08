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
