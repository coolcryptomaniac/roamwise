/* Long-term storage, by purpose:
 *   KV  (RW_KV)   — caches, rate limits, sessions, idempotency and short-lived state (with TTLs).
 *   D1  (DB)      — records that must be searched or totalled for years: the sales register.
 *   R2  (RECORDS) — permanent private files: monthly books, one JSON per sale, daily KV backups.
 *   R2  (MEDIA)   — public long-term assets (photos, audio, itineraries), mirrored by CI.
 * Every helper is best-effort and a no-op when its binding is missing, so the Worker never fails
 * a payment or a cron because archiving is unavailable. GST records must be kept ~6 years;
 * KV entries expire, so R2 + D1 are the copies of record. */

const KV_BACKUP_PREFIXES = ['book:', 'stayorder:', 'payout:', 'payee:', 'wallet:', 'walletphone:', 'voucher:',
  'creditorder:', 'creditmember:', 'creditexp:', 'ledger:day:', 'invoiceq:', 'pot:', 'grpm:', 'staydue:', 'walletdue:'];
const PAGE = 400; // KV reads per cron run stay far below the per-invocation limit

export async function archive(env, key, body, contentType = 'application/json', kind = 'file') {
  if (!env || !env.RECORDS || !key) return false;
  try {
    const data = typeof body === 'string' ? body : JSON.stringify(body);
    await env.RECORDS.put(key, data, { httpMetadata: { contentType } });
    await logArchive(env, key, kind, data.length);
    return true;
  } catch (e) { return false; }
}

async function logArchive(env, key, kind, bytes) {
  if (!env.DB) return;
  try { await env.DB.prepare('INSERT OR REPLACE INTO archive_log (key, kind, bytes) VALUES (?, ?, ?)').bind(key, kind, bytes).run(); } catch (e) { /* log only */ }
}

/* One sale (a book entry): D1 row for queries + R2 JSON as the permanent copy. */
export async function recordSale(env, month, entry) {
  if (!entry || !entry.id) return;
  if (env && env.DB) {
    try {
      await env.DB.prepare('INSERT OR REPLACE INTO sales (id, month, paid_at, total, json) VALUES (?, ?, ?, ?, ?)')
        .bind(String(entry.id), month, String(entry.paidAt || ''), Number(entry.total) || 0, JSON.stringify(entry)).run();
    } catch (e) { /* R2 copy below still runs */ }
  }
  await archive(env, 'books/' + month + '/sales/' + String(entry.id).replace(/[^A-Za-z0-9_.-]/g, '_') + '.json', entry, 'application/json', 'sale');
}

/* Sales for a month from D1 (survives the KV expiry). Returns null when D1 is unavailable. */
export async function salesFromD1(env, month) {
  if (!env || !env.DB) return null;
  try {
    const r = await env.DB.prepare('SELECT json FROM sales WHERE month = ? ORDER BY paid_at').bind(month).all();
    return (r.results || []).map((x) => JSON.parse(x.json));
  } catch (e) { return null; }
}

/* Daily backup of long-lived KV prefixes into R2, a page per hourly run, resuming where it stopped.
 * State lives in KV under backup:kv:state. Files: backups/kv/<IST date>/<prefix>-<n>.json */
export async function runKvBackup(env, nowMs = Date.now()) {
  if (!env || !env.RW_KV || !env.RECORDS) return null;
  const today = new Date(nowMs + 19800000).toISOString().slice(0, 10);
  let st = (await env.RW_KV.get('backup:kv:state', 'json')) || {};
  if (st.date !== today) st = { date: today, i: 0, cursor: null, n: 0, keys: 0 };
  if (st.i >= KV_BACKUP_PREFIXES.length) return { done: true, date: today, keys: st.keys };
  const prefix = KV_BACKUP_PREFIXES[st.i];
  const page = await env.RW_KV.list({ prefix, cursor: st.cursor || undefined, limit: PAGE });
  const items = {};
  for (const k of page.keys) { const v = await env.RW_KV.get(k.name); if (v !== null) items[k.name] = v; }
  if (page.keys.length) {
    await archive(env, 'backups/kv/' + today + '/' + prefix.replace(/[^a-z]/g, '') + '-' + st.n + '.json',
      { prefix, date: today, count: page.keys.length, items }, 'application/json', 'kv-backup');
    st.n++; st.keys += page.keys.length;
  }
  if (page.list_complete) { st.i++; st.cursor = null; st.n = 0; } else st.cursor = page.cursor;
  await env.RW_KV.put('backup:kv:state', JSON.stringify(st), { expirationTtl: 60 * 60 * 48 });
  return { done: st.i >= KV_BACKUP_PREFIXES.length, date: today, keys: st.keys };
}

/* Public long-term assets from the MEDIA bucket: GET /media/r2/<assets|media|itinerary-library|shop>/...
 * shop/ holds shop-engine print files and mockups (immutable) and the daily promotion plan (short cache). */
export async function handleMediaGet(request, env, path) {
  if (!env || !env.MEDIA) return new Response('Not configured', { status: 404 });
  const key = decodeURIComponent(path.replace(/^\/media\/r2\//, ''));
  if (!/^(assets|media|itinerary-library|shop)\/[A-Za-z0-9_./ %,()-]+$/.test(key) || key.includes('..')) return new Response('Not found', { status: 404 });
  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  const h = new Headers();
  obj.writeHttpMetadata(h);
  h.set('Cache-Control', key.startsWith('shop/engine/') ? 'public, max-age=300' : 'public, max-age=2592000, immutable');
  h.set('Access-Control-Allow-Origin', '*');
  h.set('ETag', obj.httpEtag);
  return new Response(obj.body, { headers: h });
}

export const _test = { KV_BACKUP_PREFIXES };
