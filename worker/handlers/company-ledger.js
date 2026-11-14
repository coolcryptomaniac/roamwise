/* Company ledger (read-only). Daily cron builds the snapshot; admins read it.
 *   GET  /admin/ledger       latest snapshot
 *   POST /admin/ledger/run   rebuild now
 * Reads wallet: and stayorder: keys from KV. Writes only its own ledger: keys. */
import { json } from '../lib/http.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { getDoc } from '../lib/firestore-rest.js';
import { buildLedger, PROMO_CAP_DEFAULT } from '../lib/company-ledger.js';

const MAX_KEYS = 1000;

async function readAll(env, prefix) {
  const out = []; let cursor, truncated = false;
  do {
    const page = await env.RW_KV.list({ prefix, cursor });
    for (const k of page.keys) {
      if (out.length >= MAX_KEYS) { truncated = true; break; }
      const v = await env.RW_KV.get(k.name, 'json'); if (v) out.push(v);
    }
    cursor = page.list_complete || truncated ? undefined : page.cursor;
  } while (cursor);
  return { rows: out, truncated };
}

export async function runCompanyLedger(env, { nowMs = Date.now() } = {}) {
  if (!env.RW_KV) return null;
  const w = await readAll(env, 'wallet:'), o = await readAll(env, 'stayorder:'), e = await readAll(env, 'earn:');
  const promoCap = Number(env.PROMO_MONTHLY_CAP) > 0 ? Number(env.PROMO_MONTHLY_CAP) : PROMO_CAP_DEFAULT;
  const ledger = buildLedger({ wallets: w.rows, orders: o.rows, earnings: e.rows, nowMs, promoCap, truncated: w.truncated || o.truncated || e.truncated });
  await env.RW_KV.put('ledger:last', JSON.stringify(ledger));
  await env.RW_KV.put('ledger:day:' + ledger.at.slice(0, 10), JSON.stringify(ledger.accounts), { expirationTtl: 90 * 24 * 3600 });
  return ledger;
}

export async function requireAdmin(request, env, deps) {
  if (deps.requireAdmin) return deps.requireAdmin(request, env);
  let sa;
  try { sa = parseServiceAccount(env); } catch (e) { return { error: json({ error: 'not_configured' }, 501) }; }
  const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '');
  if (!m) return { error: json({ error: 'unauthorized', message: 'Sign in to RoamWise Admin.' }, 401) };
  let claims;
  try { claims = await verifyFirebaseIdToken(m[1], sa.project_id); } catch (e) { return { error: json({ error: 'unauthorized', message: 'Admin sign-in expired.' }, 401) }; }
  const admin = await getDoc(env, await getServiceAccountAccessToken(env), sa.project_id, 'admins/' + claims.uid);
  if (!admin) return { error: json({ error: 'forbidden', message: 'Founder/admin access required.' }, 403) };
  return { uid: claims.uid };
}

export async function handleCompanyLedger(request, env, path, deps = {}) {
  const auth = await requireAdmin(request, env, deps);
  if (auth.error) return auth.error;
  if (!env.RW_KV) return json({ error: 'ledger_unavailable' }, 503);
  if (path === 'admin/ledger/run' && request.method === 'POST') return json({ ok: true, ledger: await runCompanyLedger(env, { nowMs: deps.nowMs }) });
  if (path === 'admin/ledger' && request.method === 'GET') {
    const ledger = (await env.RW_KV.get('ledger:last', 'json')) || await runCompanyLedger(env, { nowMs: deps.nowMs });
    return json({ ok: true, ledger });
  }
  return json({ error: 'not_found' }, 404);
}
