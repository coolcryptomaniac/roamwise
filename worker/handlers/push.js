/* ============================================================================
   worker/handlers/push.js — POST /push/send
   ============================================================================
   Named export only — see worker/lib/http.js header for why. Imported into
   worker/worker.js and dispatched from its fetch() router.

   Admin-only send path for the push-notification infrastructure (see
   PUSH-NOTIFICATIONS-SETUP.md, js/core/push-notifications.js,
   firebase-messaging-sw.js). This is the ONLY place the Firebase
   service-account private key is ever used (env.FIREBASE_SERVICE_ACCOUNT_JSON,
   a Worker secret set with `wrangler secret put`, never a plaintext value in
   wrangler.toml, never shipped to the browser) — see worker/lib/
   service-account.js. The browser only ever sends a short-lived Firebase ID
   token (the user's own sign-in credential) as a Bearer header; this handler
   verifies it, confirms the caller is a real admin (an admins/{uid} Firestore
   document — the same allow-list every other admin surface in this app uses,
   see firestore.rules), and only then looks up the target user's registered
   push tokens and calls FCM's HTTP v1 send API.

   Two-step auth, both required, in order:
     1. verifyFirebaseIdToken()  — proves the bearer token is a real,
        unexpired Firebase Auth credential for THIS Firebase project.
     2. admins/{uid} lookup      — proves the signed-in uid is an admin, not
        just any signed-in user. Uses the service-account's own Firestore
        access (bypasses firestore.rules by design, same trust model as the
        Admin SDK), so this check cannot be spoofed by anything the client
        controls.

   Per the price-tampering lesson from PR #152 (never trust client-supplied
   values that should be server-authoritative): the caller supplies a target
   `uid`, never a raw device token — the actual FCM tokens sent to are always
   looked up server-side from that user's own Firestore doc, never accepted
   directly from the request body. Every other field is length/type-validated
   before anything is sent. */
import { json } from '../lib/http.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { getDoc, deleteFields } from '../lib/firestore-rest.js';

const MAX_TITLE = 100;
const MAX_BODY = 500;
const MAX_URL = 500;
const MAX_DATA_KEYS = 10;
const MAX_DATA_VALUE = 500;

function badRequest(msg) {
  return json({ error: 'bad_request', message: msg }, 400);
}

/** Server-side input validation — never trust the shape/size of client JSON. */
function validatePayload(body) {
  if (!body || typeof body !== 'object') return 'missing request body';
  if (typeof body.uid !== 'string' || !body.uid || body.uid.length > 128) return 'uid must be a non-empty string';
  if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > MAX_TITLE) {
    return `title must be a non-empty string up to ${MAX_TITLE} chars`;
  }
  if (typeof body.body !== 'string' || !body.body.trim() || body.body.length > MAX_BODY) {
    return `body must be a non-empty string up to ${MAX_BODY} chars`;
  }
  if (body.url != null) {
    if (typeof body.url !== 'string' || body.url.length > MAX_URL || !/^https:\/\//.test(body.url)) {
      return 'url must be an https:// string';
    }
  }
  if (body.data != null) {
    if (typeof body.data !== 'object' || Array.isArray(body.data)) return 'data must be a flat object';
    const keys = Object.keys(body.data);
    if (keys.length > MAX_DATA_KEYS) return `data may have at most ${MAX_DATA_KEYS} keys`;
    for (const k of keys) {
      const v = body.data[k];
      if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') {
        return `data.${k} must be a string, number or boolean`;
      }
      if (String(v).length > MAX_DATA_VALUE) return `data.${k} is too long`;
    }
  }
  return null;
}

async function requireAdmin(request, env, projectId) {
  const auth = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) return { error: json({ error: 'unauthorized', message: 'missing Bearer token' }, 401) };

  let claims;
  try {
    claims = await verifyFirebaseIdToken(m[1], projectId);
  } catch (e) {
    return { error: json({ error: 'unauthorized', message: 'invalid or expired token' }, 401) };
  }

  const accessToken = await getServiceAccountAccessToken(env);
  const adminDoc = await getDoc(env, accessToken, projectId, `admins/${claims.uid}`);
  if (!adminDoc) return { error: json({ error: 'forbidden', message: 'admin only' }, 403) };

  return { uid: claims.uid, accessToken };
}

async function sendOne(accessToken, projectId, token, notification, data, url) {
  const message = {
    token,
    notification,
    ...(data ? { data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) } : {}),
    ...(url ? { webpush: { fcm_options: { link: url } } } : {}),
  };
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  const data2 = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body: data2 };
}

/** FCM's documented "this token is dead, stop sending to it" error shapes. */
function isDeadToken(result) {
  const status = result.body && result.body.error && result.body.error.status;
  return result.status === 404 || status === 'UNREGISTERED' || status === 'NOT_FOUND';
}

export async function handlePushSend(request, env) {
  let sa;
  try {
    sa = parseServiceAccount(env);
  } catch (e) {
    return json({ error: 'not_configured', message: e.message }, 501);
  }
  const projectId = sa.project_id;

  const auth = await requireAdmin(request, env, projectId);
  if (auth.error) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return badRequest('invalid JSON body');
  }
  const validationError = validatePayload(body);
  if (validationError) return badRequest(validationError);

  const userDoc = await getDoc(env, auth.accessToken, projectId, `users/${body.uid}`);
  const pushTokens = (userDoc && userDoc.pushTokens) || {};
  const deviceIds = Object.keys(pushTokens).filter((k) => pushTokens[k] && pushTokens[k].token);
  if (!deviceIds.length) return json({ error: 'no_tokens', message: 'target user has no registered devices' }, 404);

  const notification = { title: body.title, body: body.body };
  const results = [];
  const deadFieldPaths = [];
  for (const deviceId of deviceIds) {
    const token = pushTokens[deviceId].token;
    const result = await sendOne(auth.accessToken, projectId, token, notification, body.data, body.url);
    results.push({ deviceId, platform: pushTokens[deviceId].platform || 'unknown', ok: result.ok });
    if (!result.ok && isDeadToken(result)) deadFieldPaths.push(`pushTokens.${deviceId}`);
  }

  if (deadFieldPaths.length) {
    try {
      await deleteFields(env, auth.accessToken, projectId, `users/${body.uid}`, deadFieldPaths);
    } catch (e) {
      // best-effort cleanup only — the notification itself already sent
    }
  }

  const sent = results.filter((r) => r.ok).length;
  return json({ ok: true, sent, failed: results.length - sent, prunedDeadTokens: deadFieldPaths.length, results });
}
