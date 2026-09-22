/* Firebase/GCP service-account OAuth for Cloudflare Workers. All credentials
 * stay in the Worker secret and are never returned to clients or logged. */
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
let cachedToken = null;
let cachedExpiresAt = 0;

function b64url(bytes) {
  let bin = '';
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function pemToDer(pem) {
  const stripped = pem.replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '').replace(/\s+/g, '');
  const bin = atob(stripped);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Both raw JSON and the base64 JSON used by some secret-management UIs are
 * supported. Never interpret arbitrary strings as keys or leak parse errors. */
export function parseServiceAccount(env) {
  const raw = env && env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('service_account_missing');
  const trimmed = raw.trim();
  if (trimmed.length > 65536) throw new Error('service_account_invalid');
  let jsonText = trimmed;
  if (!trimmed.startsWith('{')) {
    if (!/^[A-Za-z0-9+/_=-]+$/.test(trimmed)) throw new Error('service_account_invalid');
    try {
      const encoded = trimmed.replace(/-/g, '+').replace(/_/g, '/');
      jsonText = new TextDecoder('utf-8', { fatal: true }).decode(
        Uint8Array.from(atob(encoded), c => c.charCodeAt(0))
      );
    } catch (_) { throw new Error('service_account_invalid'); }
  }
  let sa;
  try { sa = JSON.parse(jsonText); }
  catch (_) { throw new Error('service_account_invalid'); }
  if (!sa || typeof sa !== 'object' || typeof sa.client_email !== 'string'
      || typeof sa.private_key !== 'string' || typeof sa.project_id !== 'string'
      || !sa.client_email.endsWith('.gserviceaccount.com')
      || !sa.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('service_account_invalid');
  }
  // The parser is shared with push notifications and has no project policy.
  // Individual payment/admin handlers must enforce their expected project.
  return sa;
}

async function signJwt(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL,
    iat: now, exp: now + 3600
  };
  const encHeader = b64url(new TextEncoder().encode(JSON.stringify(header)));
  const encClaims = b64url(new TextEncoder().encode(JSON.stringify(claims)));
  const signingInput = `${encHeader}.${encClaims}`;
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key,
    new TextEncoder().encode(signingInput));
  return `${signingInput}.${b64url(sig)}`;
}

/** Short-lived OAuth access token; cache never exposes credentials to browser. */
export async function getServiceAccountAccessToken(env) {
  const now = Date.now();
  if (cachedToken && now < cachedExpiresAt - 60_000) return cachedToken;
  const sa = parseServiceAccount(env);
  const assertion = await signJwt(sa);
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion
  });
  let res;
  try {
    res = await fetch(TOKEN_URL, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
  } catch (_) { throw new Error('service_account_oauth_unavailable'); }
  if (!res.ok) throw new Error('service_account_oauth_rejected');
  const data = await res.json();
  if (!data || typeof data.access_token !== 'string') throw new Error('service_account_oauth_invalid');
  cachedToken = data.access_token;
  cachedExpiresAt = now + (data.expires_in || 3600) * 1000;
  return cachedToken;
}
