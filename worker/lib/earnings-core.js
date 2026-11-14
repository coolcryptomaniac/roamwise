/* Earnings pocket for creators, artists and property partners: rules only (pure, whole rupees).
 *
 * This is a record of what RoamWise owes a partner and what it has paid. It moves no money:
 * the founder pays by UPI or bank transfer outside the app, then marks the entry paid with
 * the bank reference. Earnings can never be topped up by the partner and are separate from
 * wallet cash and bonus coins, so the wallet stays a closed wallet.
 *
 * Caps keep compliance light while RoamWise is small:
 *   - creators and artists: at most MONTHLY_CAP of new earnings per calendar month (IST);
 *   - a "tax watch" flag once a person's earnings in the tax year (April to March) reach
 *     TAX_WATCH, the lowest yearly tax-deduction threshold (commission). Above it, check
 *     with a CA before paying. */
export const MONTHLY_CAP = 10000;
export const TAX_WATCH = 20000;
export const ROLES = ['creator', 'artist', 'property'];
export const CAPPED = new Set(['creator', 'artist']);
const rupees = (n) => (Number.isFinite(Number(n)) && Number(n) > 0 ? Math.round(Number(n)) : 0);
const ist = (ms) => new Date(ms + 5.5 * 3600 * 1000);
export const istMonthOf = (ms) => ist(ms).toISOString().slice(0, 7);
export function taxYearOf(ms) { const d = ist(ms), y = d.getUTCFullYear(); return d.getUTCMonth() >= 3 ? y : y - 1; }

export function emptyAccount(email, role, name) {
  return { email: String(email || '').trim().toLowerCase(), role: ROLES.includes(role) ? role : 'creator', name: String(name || '').slice(0, 80), entries: [] };
}

export function summary(acct, nowMs, caps = {}) {
  const cap = caps.monthly > 0 ? caps.monthly : MONTHLY_CAP, watch = caps.taxWatch > 0 ? caps.taxWatch : TAX_WATCH;
  const e = (acct && acct.entries) || [], month = istMonthOf(nowMs), year = taxYearOf(nowMs);
  const sum = (xs) => xs.reduce((t, x) => t + rupees(x.amount), 0);
  const thisMonth = sum(e.filter((x) => istMonthOf(Date.parse(x.at)) === month));
  const thisYear = sum(e.filter((x) => taxYearOf(Date.parse(x.at)) === year));
  const capped = CAPPED.has(acct && acct.role);
  return {
    available: sum(e.filter((x) => x.status === 'available')), paid: sum(e.filter((x) => x.status === 'paid')),
    thisMonth, thisYear, capped, monthlyCap: capped ? cap : null, capLeft: capped ? Math.max(0, cap - thisMonth) : null,
    taxWatch: thisYear >= watch, taxWatchAt: watch,
  };
}

/* Record a new earning. Idempotent per id. Refuses anything over the monthly cap for capped roles. */
export function addEarning(acct, { id, amount, note }, nowMs, caps = {}) {
  const amt = rupees(amount);
  if (!id || !/^[A-Za-z0-9_:-]{4,64}$/.test(id)) return { ok: false, code: 'bad_id' };
  if (!(amt > 0) || amt > 500000) return { ok: false, code: 'bad_amount' };
  if ((acct.entries || []).some((x) => x.id === id)) return { ok: true, duplicate: true, account: acct };
  const s = summary(acct, nowMs, caps);
  if (s.capped && amt > s.capLeft) return { ok: false, code: 'monthly_cap', capLeft: s.capLeft, monthlyCap: s.monthlyCap };
  const entry = { id, at: new Date(nowMs).toISOString(), amount: amt, note: String(note || '').slice(0, 140), status: 'available' };
  const account = { ...acct, entries: [...(acct.entries || []), entry] };
  return { ok: true, duplicate: false, account, entry, taxWatch: summary(account, nowMs, caps).taxWatch };
}

/* Mark available entries as paid outside the app (UPI / bank). A payment reference is required. */
export function markPaid(acct, { ids, ref }, nowMs) {
  const r = String(ref || '').trim().slice(0, 60);
  if (r.length < 4) return { ok: false, code: 'reference_required' };
  const want = Array.isArray(ids) && ids.length ? new Set(ids) : null;
  let amount = 0;
  const entries = (acct.entries || []).map((x) => {
    if (x.status !== 'available' || (want && !want.has(x.id))) return x;
    amount += rupees(x.amount);
    return { ...x, status: 'paid', paidAt: new Date(nowMs).toISOString(), ref: r };
  });
  if (!amount) return { ok: false, code: 'nothing_to_pay' };
  return { ok: true, account: { ...acct, entries }, amount };
}

/* What the partner sees: no internal ids beyond the entry list, bank reference shown only on paid lines. */
export function publicEarnings(acct, nowMs, caps = {}) {
  return { role: acct.role, name: acct.name, summary: summary(acct, nowMs, caps),
    entries: (acct.entries || []).slice(-30).reverse().map((x) => ({ at: x.at, amount: x.amount, note: x.note, status: x.status, paidAt: x.paidAt || null, ref: x.ref || null })) };
}
