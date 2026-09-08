/* ============================================================================
   worker/lib/firebase-verify.js — verify a Firebase Auth ID token without the
   Firebase Admin SDK (which does not run in the Workers runtime).
   ============================================================================
   Named exports only — see worker/lib/http.js header for why.

   Firebase ID tokens are RS256-signed JWTs issued by Google's "securetoken"
   service. Google publishes the current signing keys in JWK format (no X.509
   parsing needed) at a stable, documented URL — this is the same mechanism
   Firebase's own docs point to for verifying tokens "using a third-party JWT
   library" in environments without the Admin SDK:
     https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
   Verification here uses only native `fetch` + Web Crypto (`crypto.subtle`,
   available in the Workers runtime) — no npm dependency, consistent with the
   rest of this Worker.

   This ONLY proves "this token was really issued by Firebase Auth for this
   project, for this uid, and hasn't expired." It does NOT prove the caller is
   an admin — see requireAdmin() in worker/handlers/push.js, which layers an
   admins/{uid} Firestore lookup on top of this using the service-account
   access token from worker/lib/service-account.js. */

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

// Module-scope cache. Workers reuse an isolate across many requests, so this
// saves a JWKS fetch on most requests without ever risking a stale key
// past its documented ~6h Google rotation window.
let jwksCache = null;
let jwksFetchedAt = 0;
const JWKS_TTL_MS = 60 * 60 * 1000; // 1 hour

function b64urlToUint8(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function b64urlToJson(b64url) {
  return JSON.parse(new TextDecoder().decode(b64urlToUint8(b64url)));
}

async function getJwks() {
  const now = Date.now();
  if (jwksCache && now - jwksFetchedAt < JWKS_TTL_MS) return jwksCache;
  const res = await fetch(JWKS_URL);
  if (!res.ok) throw new Error('failed to fetch Firebase JWKS');
  const data = await res.json();
  jwksCache = data.keys || [];
  jwksFetchedAt = now;
  return jwksCache;
}

/**
 * Verify a Firebase Auth ID token. Throws on any failure (bad signature,
 * wrong project, expired, malformed). Returns the decoded payload (includes
 * `sub` / `user_id` — the Firebase uid — plus `email` etc.) on success.
 * @param {string} idToken
 * @param {string} projectId - the Firebase project id (aud/iss must match)
 */
export async function verifyFirebaseIdToken(idToken, projectId) {
  if (!idToken || typeof idToken !== 'string') throw new Error('missing token');
  if (!projectId) throw new Error('missing projectId');
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('malformed token');
  const [headerB64, payloadB64, sigB64] = parts;

  const header = b64urlToJson(headerB64);
  const payload = b64urlToJson(payloadB64);

  if (header.alg !== 'RS256') throw new Error('unexpected alg');

  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== projectId) throw new Error('bad audience');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('bad issuer');
  if (typeof payload.exp !== 'number' || payload.exp < now) throw new Error('expired token');
  if (typeof payload.iat !== 'number' || payload.iat > now + 300) throw new Error('bad iat');
  const uid = payload.sub || payload.user_id;
  if (!uid || typeof uid !== 'string') throw new Error('token has no subject');

  const keys = await getJwks();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('unknown signing key');

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = b64urlToUint8(sigB64);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, signedData);
  if (!valid) throw new Error('bad signature');

  return { ...payload, uid };
}
