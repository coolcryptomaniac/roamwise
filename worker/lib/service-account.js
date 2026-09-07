/* ============================================================================
   worker/lib/service-account.js — mint a short-lived Google OAuth2 access
   token from a Firebase/GCP service-account JSON key, using only native
   `fetch` + Web Crypto (no npm dependency, no Firebase Admin SDK — that SDK
   does not run in the Workers runtime).
   ============================================================================
   Named exports only — see worker/lib/http.js header for why.

   The service-account JSON (env.FIREBASE_SERVICE_ACCOUNT_JSON, a Worker
   secret set with `wrangler secret put` — see PUSH-NOTIFICATIONS-SETUP.md)
   is used ONLY here, server-side, to sign a short-lived JWT and exchange it
   with Google's token endpoint for an access token (the standard "JWT
   Bearer" service-account OAuth2 flow). That access token — not the private
   key itself — is what actually calls the FCM v1 send API and the Firestore
   REST API (both scoped under the single 'cloud-platform' OAuth scope, so
   one secret covers both call sites in worker/handlers/push.js). The private
   key never leaves this Worker and is never sent to the browser. */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

// Module-scope cache — Workers reuse an isolate across requests, so this
// avoids re-signing + re-exchanging a JWT on every single call.
let cachedToken = null;
let cachedExpiresAt = 0;

function b64url(bytes) {
  let bin = '';
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToDer(pem) {
  const stripped = pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '');
  const bin = atob(stripped);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Parses env.FIREBASE_SERVICE_ACCOUNT_JSON. Throws a clear error if unset/invalid. */
export function parseServiceAccount(env) {
  const raw = env && env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
  let sa;
  try {
    sa = JSON.parse(raw);
  } catch (e) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }
  if (!sa.client_email || !sa.private_key || !sa.project_id) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is missing client_email/private_key/project_id');
  }
  return sa;
}

async function signJwt(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: sa.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const encHeader = b64url(new TextEncoder().encode(JSON.stringify(header)));
  const encClaims = b64url(new TextEncoder().encode(JSON.stringify(claims)));
  const signingInput = `${encHeader}.${encClaims}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${b64url(sig)}`;
}

/**
 * Returns a cached-or-fresh Google OAuth2 access token for this Worker's
 * service account, scoped to `cloud-platform` (covers both FCM v1 send and
 * Firestore REST reads — see the header comment above).
 */
export async function getServiceAccountAccessToken(env) {
  const now = Date.now();
  if (cachedToken && now < cachedExpiresAt - 60_000) return cachedToken;

  const sa = parseServiceAccount(env);
  const assertion = await signJwt(sa);
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google token exchange failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  cachedToken = data.access_token;
  cachedExpiresAt = now + (data.expires_in || 3600) * 1000;
  return cachedToken;
}
