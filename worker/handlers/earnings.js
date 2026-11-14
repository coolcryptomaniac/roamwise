/* Earnings pocket: storage and endpoints. Rules are in lib/earnings-core.js. Moves no money.
 *   GET  /earnings/me              the signed-in partner's own earnings (sign-in or wallet link)
 *   GET  /admin/earnings           every account with its summary            (admin)
 *   POST /admin/earnings/add       {email, role, name, amount, note, id?}    (admin)
 *   POST /admin/earnings/paid      {email, ids?, ref}  mark as paid by UPI/bank, with the reference (admin)
 * KV: earn:<hash of email> = {email, role, name, entries[]}
 * Caps: EARN_MONTHLY_CAP (default 10000, creators and artists), EARN_TAX_WATCH (default 20000 a tax year). */
import { json } from '../lib/http.js';
import { sha256Hex, validEmail, normEmail } from '../lib/wallet-core.js';
import { identify } from './referrals.js';
import { requireAdmin } from './company-ledger.js';
import { emptyAccount, addEarning, markPaid, summary, publicEarnings, ROLES } from '../lib/earnings-core.js';

const keyOf = async (email) => 'earn:' + (await sha256Hex('rw-earn:' + normEmail(email))).slice(0, 40);
const caps = (env) => ({ monthly: Number(env.EARN_MONTHLY_CAP) || 0, taxWatch: Number(env.EARN_TAX_WATCH) || 0 });
const MESSAGES = { monthly_cap: 'This is over the monthly earnings cap for creators and artists.', bad_amount: 'Enter an amount in whole rupees.',
  reference_required: 'Enter the UPI or bank reference for the payment.', nothing_to_pay: 'Nothing is waiting to be paid for this person.' };

export async function handleEarnings(request, env, path, nowMs = Date.now(), deps = {}) {
  if (!env.RW_KV) return json({ error: 'earnings_unavailable' }, 503);
  if (path === 'earnings/me' && request.method === 'GET') {
    const who = await identify(request, env, new URL(request.url).searchParams.get('t') || '', nowMs, deps);
    if (!who) return json({ error: 'not_signed_in' }, 401);
    if (!who.verified) return json({ ok: true, earnings: null });
    const acct = await env.RW_KV.get(await keyOf(who.email), 'json');
    return json({ ok: true, earnings: acct ? publicEarnings(acct, nowMs, caps(env)) : null });
  }
  const auth = await requireAdmin(request, env, deps);
  if (auth.error) return auth.error;

  if (path === 'admin/earnings' && request.method === 'GET') {
    const out = []; let cursor;
    do {
      const page = await env.RW_KV.list({ prefix: 'earn:', cursor });
      for (const k of page.keys) { if (out.length >= 500) break; const a = await env.RW_KV.get(k.name, 'json'); if (a) out.push({ email: a.email, role: a.role, name: a.name, summary: summary(a, nowMs, caps(env)), entries: a.entries.slice(-10).reverse() }); }
      cursor = page.list_complete || out.length >= 500 ? undefined : page.cursor;
    } while (cursor);
    out.sort((a, b) => b.summary.available - a.summary.available);
    return json({ ok: true, accounts: out });
  }
  if (request.method !== 'POST') return json({ error: 'not_found' }, 404);
  let b = {}; try { b = await request.json(); } catch (_) { b = {}; }
  if (!validEmail(b.email)) return json({ error: 'bad_email', message: 'Enter the partner\'s email.' }, 422);
  const key = await keyOf(b.email);
  let acct = await env.RW_KV.get(key, 'json');

  if (path === 'admin/earnings/add') {
    if (!acct) { if (!ROLES.includes(b.role)) return json({ error: 'bad_role', message: 'Choose creator, artist or property.' }, 422); acct = emptyAccount(b.email, b.role, b.name); }
    const id = b.id || 'e' + (await sha256Hex(key + ':' + nowMs + ':' + b.amount + ':' + (b.note || ''))).slice(0, 20);
    const r = addEarning(acct, { id, amount: b.amount, note: b.note }, nowMs, caps(env));
    if (!r.ok) return json({ error: r.code, message: MESSAGES[r.code] || 'Could not add this earning.', capLeft: r.capLeft, monthlyCap: r.monthlyCap }, 422);
    if (!r.duplicate) await env.RW_KV.put(key, JSON.stringify(r.account));
    return json({ ok: true, duplicate: !!r.duplicate, taxWatch: !!r.taxWatch, summary: summary(r.account, nowMs, caps(env)) });
  }
  if (path === 'admin/earnings/paid') {
    if (!acct) return json({ error: 'no_account', message: 'No earnings recorded for this email.' }, 404);
    const r = markPaid(acct, { ids: b.ids, ref: b.ref }, nowMs);
    if (!r.ok) return json({ error: r.code, message: MESSAGES[r.code] }, 422);
    await env.RW_KV.put(key, JSON.stringify(r.account));
    return json({ ok: true, paid: r.amount, summary: summary(r.account, nowMs, caps(env)) });
  }
  return json({ error: 'not_found' }, 404);
}
