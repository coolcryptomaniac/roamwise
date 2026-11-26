/* "Support RoamWise": voluntary contributions of Rs 1 to Rs 10,000 with nothing given in return (D1, migration 0004).
 * OFF until the Worker var SUPPORT_CHECKOUT = "true". Indian payers only (Indian UPI/cards; the buyer confirms they
 * hold an Indian passport), because donations from foreign sources fall under FCRA. Not a donation to a charity:
 * no tax receipt, no perks, no shout-outs unless the supporter asks to show their name.
 *   POST /support/order        { amount, name, phone, email, message, showName, confirmNothingInReturn, confirmIndian }
 *   GET  /support/status/<id>  checks Cashfree, marks paid only if id, amount and currency match
 *   GET  /support/wall         public: total supporters, total amount, recent names that opted in */
import { json } from '../lib/http.js';
import { cfBase, cfHeaders, cfConfigured } from '../lib/cashfree-pg.js';

const MIN = 1, MAX = 10000;
const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
async function body(request) { try { return await request.json(); } catch (e) { return {}; } }
const enabled = (env) => String(env.SUPPORT_CHECKOUT || '') === 'true' && cfConfigured(env) && !!env.DB;
const envName = (env) => (String(env.CASHFREE_ENV || 'sandbox') === 'live' ? 'production' : 'sandbox');

export async function handleSupport(request, env, path, deps = {}) {
  const f = deps.fetchImpl || fetch, db = env.DB;
  if (path === 'support/wall' && request.method === 'GET') {
    if (!db) return json({ supporters: 0, total: 0, names: [] });
    const t = await db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(amount),0) AS s FROM support_contributions WHERE status = 'paid'").first();
    const r = await db.prepare("SELECT name FROM support_contributions WHERE status = 'paid' AND show_name = 1 AND name != '' ORDER BY paid_at DESC LIMIT 30").all();
    return json({ open: enabled(env), supporters: t.n, total: t.s, names: (r.results || []).map((x) => x.name.split(' ')[0]) });
  }
  if (path === 'support/order' && request.method === 'POST') {
    if (!enabled(env)) return json({ error: 'not_open', message: 'Support payments are not open yet. Thank you for wanting to help!' }, 503);
    const b = await body(request), amount = Math.round(Number(b.amount));
    if (!(amount >= MIN && amount <= MAX)) return json({ error: 'bad_amount', message: 'Choose an amount from Rs 1 to Rs 10,000.' }, 400);
    if (b.confirmNothingInReturn !== true || b.confirmIndian !== true) return json({ error: 'confirm', message: 'Please tick both confirmations.' }, 400);
    const phone = str(b.phone, 15).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    if (!/^[6-9]\d{9}$/.test(phone)) return json({ error: 'bad_phone', message: 'Enter a 10-digit Indian mobile number.' }, 400);
    const email = str(b.email, 120), name = str(b.name, 60);
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'bad_email' }, 400);
    const id = 'RWSUP-' + crypto.randomUUID().replace(/-/g, '').slice(0, 14).toUpperCase();
    await db.prepare('INSERT INTO support_contributions (id, amount, name, phone, email, message, show_name, environment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, amount, name, phone, email, str(b.message, 280), b.showName === true ? 1 : 0, envName(env)).run();
    const res = await f(cfBase(env) + '/pg/orders', { method: 'POST', headers: cfHeaders(env), body: JSON.stringify({
      order_id: id, order_amount: amount, order_currency: 'INR', order_note: 'Voluntary support for RoamWise (nothing in return)',
      customer_details: { customer_id: id, customer_phone: phone, ...(name ? { customer_name: name } : {}), ...(email ? { customer_email: email } : {}) },
      order_meta: { return_url: 'https://www.roamwise.co.in/support/?id=' + id },
      order_tags: { kind: 'support' },
    }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || !d.payment_session_id) { await db.prepare("UPDATE support_contributions SET status = 'failed' WHERE id = ?").bind(id).run(); return json({ error: 'gateway', message: 'Payment could not start. Nothing was charged.' }, 502); }
    return json({ id, payment_session_id: d.payment_session_id, environment: envName(env) });
  }
  const m = /^support\/status\/(RWSUP-[A-Z0-9]{14})$/.exec(path);
  if (m && request.method === 'GET') {
    if (!db) return json({ error: 'not_configured' }, 503);
    const row = await db.prepare('SELECT * FROM support_contributions WHERE id = ?').bind(m[1]).first();
    if (!row) return json({ error: 'not_found' }, 404);
    if (row.status === 'paid') return json({ status: 'paid', amount: row.amount });
    if (!cfConfigured(env)) return json({ status: row.status });
    const res = await f(cfBase(env) + '/pg/orders/' + encodeURIComponent(row.id), { headers: cfHeaders(env) });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.order_id === row.id && d.order_currency === 'INR' && Math.round(Number(d.order_amount)) === row.amount && d.order_status === 'PAID') {
      await db.prepare("UPDATE support_contributions SET status = 'paid', paid_at = datetime('now') WHERE id = ? AND status != 'paid'").bind(row.id).run();
      return json({ status: 'paid', amount: row.amount });
    }
    if (!res.ok) return json({ status: row.status });
    /* Never echo the gateway's PAID for an order whose id, currency or amount did not match. */
    return json({ status: d.order_status === 'PAID' ? 'review' : String(d.order_status || 'ACTIVE').toLowerCase() });
  }
  return json({ error: 'not_found' }, 404);
}
