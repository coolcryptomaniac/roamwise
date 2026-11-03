/* Qikink Order API client. Secrets come only from Worker secrets (QIKINK_CLIENT_ID, QIKINK_CLIENT_SECRET).
 * Qikink issues a NEW access token on every token call and invalidates the previous one, so the token is
 * cached by the caller (Firestore, server-only) and refreshed at most once per request on a 401/403.
 * Results are classified so callers never double-submit: ok | retryable (safe to try again) | permanent. */
const SANDBOX = 'https://sandbox.qikink.com';
const LIVE = 'https://api.qikink.com';

export const qikinkEnvName = (env) => (String(env.QIKINK_ENV || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox');
export const qikinkConfigured = (env) => !!(env && env.QIKINK_CLIENT_ID && env.QIKINK_CLIENT_SECRET);

const safeText = (v) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').slice(0, 200);

/* store = { read(): Promise<{token, expiresAt}|null>, write({token, expiresAt}): Promise<void> } */
export function createQikinkClient({ env, fetchImpl = (...a) => fetch(...a), now = () => Date.now(), store }) {
  const base = qikinkEnvName(env) === 'live' ? LIVE : SANDBOX;

  async function freshToken() {
    const res = await fetchImpl(`${base}/api/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ClientId: String(env.QIKINK_CLIENT_ID), client_secret: String(env.QIKINK_CLIENT_SECRET) }).toString(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.Accesstoken) throw new Error('qikink_token_failed_' + res.status);
    const ttl = Math.max(60, Number(data.expires_in) || 3600);
    const entry = { token: String(data.Accesstoken), expiresAt: now() + (ttl - 120) * 1000 };
    if (store) { try { await store.write(entry); } catch (_) { /* cache is best effort */ } }
    return entry.token;
  }

  async function getToken(force) {
    if (!force && store) {
      let c = null;
      try { c = await store.read(); } catch (_) { c = null; }
      if (c && c.token && Number(c.expiresAt) > now()) return c.token;
    }
    return freshToken();
  }

  async function post(path, body, token) {
    return fetchImpl(`${base}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ClientId: String(env.QIKINK_CLIENT_ID), Accesstoken: token },
      body: JSON.stringify(body),
    });
  }

  /* Submit one order. Never throws. */
  async function createOrder(body) {
    let res;
    try {
      let token = await getToken(false);
      res = await post('/api/order/create', body, token);
      if (res.status === 401 || res.status === 403) { token = await getToken(true); res = await post('/api/order/create', body, token); }
    } catch (e) {
      return { retryable: true, reason: safeText(e && e.message || 'network_error') };
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.order_id != null) return { ok: true, qikinkOrderId: String(data.order_id) };
    if (res.status === 429 || res.status >= 500) return { retryable: true, reason: 'http_' + res.status };
    if (res.status === 401 || res.status === 403) return { retryable: true, reason: 'auth_' + res.status };
    return { permanent: true, reason: safeText(data.error || data.message || 'http_' + res.status) };
  }

  return { createOrder, getToken };
}
