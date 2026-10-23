/* ============================================================================
   worker/lib/stay-integrity-core.js - tamper evidence and cheating signals for stay records
   ============================================================================
   Pure functions, named exports only, no network and no Firestore (same rules as stay-ledger-core.js).

   What it gives a stay record (one booking code, RW-XXXXXX):
     1. A hash-chained event log. Every change (enquiry, guest confirmation, property report, admin settlement) is appended
        with the hash of the event before it. Editing or deleting any earlier event breaks every later hash, so a changed
        amount, date or status is detectable. It cannot STOP someone with database access from rewriting everything, so keep
        the latest chain head somewhere separate (a monthly statement or an email to the founder).
     2. A terms fingerprint. The guest side and the property side each submit the dates, guests and total they believe were
        agreed; if the fingerprints differ the record is flagged and the differing fields are listed.
     3. Signals a human reviews. Flags never change a bill, block a guest or accuse a property by themselves.

   Honest limits: nothing here can see a private WhatsApp chat or a cash payment. It makes cheating visible and costly; it
   does not make it impossible.
   ========================================================================= */
import { sha256Hex, validCode, validDate, rupees, monthOf } from './stay-ledger-core.js';

export const EVENT_TYPES = ['enquiry', 'terms_guest', 'terms_property', 'guest_confirm', 'property_report', 'admin_settle'];
export const ACTORS = ['guest', 'property', 'admin', 'system'];
const GENESIS = '0'.repeat(64);

/** Stable JSON: keys sorted, so the same data always hashes the same. */
export function canonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
}

export async function eventHash(prev, ev) {
  return sha256Hex((prev || GENESIS) + '|' + canonical({ seq: ev.seq, at: ev.at, actor: ev.actor, type: ev.type, data: ev.data || {} }));
}

/** Append one event. Returns a NEW chain; the input is never modified. */
export async function appendEvent(chain, { actor, type, data, at }) {
  if (!ACTORS.includes(actor)) throw new Error('bad actor');
  if (!EVENT_TYPES.includes(type)) throw new Error('bad event type');
  const prevEv = (chain || [])[chain.length - 1], prev = prevEv ? prevEv.hash : GENESIS;
  const ev = { seq: (chain || []).length, at: String(at || new Date().toISOString()), actor, type, data: data || {}, prev };
  ev.hash = await eventHash(prev, ev);
  return (chain || []).concat([ev]);
}

/** Re-hash the whole chain. { ok:true } or { ok:false, brokenAt } (index of the first event that does not match). */
export async function verifyChain(chain) {
  let prev = GENESIS;
  for (let i = 0; i < (chain || []).length; i++) {
    const ev = chain[i];
    if (!ev || ev.seq !== i || ev.prev !== prev || ev.hash !== await eventHash(prev, ev)) return { ok: false, brokenAt: i };
    prev = ev.hash;
  }
  return { ok: true, head: prev, length: (chain || []).length };
}

/* ---- terms: what each side says was agreed ---- */
export function cleanTerms(t) {
  t = t || {};
  const n = (x, lo, hi) => { const v = Math.round(Number(x)); return Number.isFinite(v) && v >= lo && v <= hi ? v : 0; };
  return { checkIn: validDate(t.checkIn) ? t.checkIn : '', nights: n(t.nights, 1, 365), guests: n(t.guests, 1, 60), total: n(t.total, 1, 10000000) };
}
export const termsFingerprint = (t) => sha256Hex(canonical(cleanTerms(t)));
/** Fields that differ between two sides' terms. Empty when they agree (a side that did not state a field never conflicts). */
export function diffTerms(a, b) {
  const x = cleanTerms(a), y = cleanTerms(b);
  return ['checkIn', 'nights', 'guests', 'total'].filter((k) => x[k] && y[k] && x[k] !== y[k]);
}

const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/* ---- per-record review flags ----
   record: { code, partnerId, createdAt, checkIn, status, amount, guestStayed, reportedAt, events?, termsGuest?, termsProperty? }
   ctx:    { listedPerNight?, nights? } the property's own published nightly rate and the stay length, when known. */
export async function analyseRecord(record, ctx) {
  const r = record || {}, c = ctx || {}, flags = [];
  const add = (kind, severity, detail) => flags.push({ code: r.code, partnerId: r.partnerId, kind, severity, detail: detail || '' });
  if (!validCode(r.code) && !/^RW-M[A-Z0-9]{5}$/.test(String(r.code || ''))) add('bad_code', 'medium');
  if (Array.isArray(r.events)) {
    const v = await verifyChain(r.events);
    if (!v.ok) add('history_tampered', 'high', 'event ' + v.brokenAt + ' does not match its hash');
    const amounts = r.events.filter((e) => e.type === 'property_report' && e.data && e.data.amount).map((e) => rupees(e.data.amount));
    if (new Set(amounts).size > 1) add('amount_changed_after_report', 'high', amounts.join(' -> '));
    const dates = r.events.filter((e) => e.data && e.data.checkIn).map((e) => e.data.checkIn);
    if (new Set(dates).size > 1) add('checkin_changed', 'medium', dates.join(' -> '));
  }
  if (r.termsGuest && r.termsProperty) {
    const d = diffTerms(r.termsGuest, r.termsProperty);
    if (d.length) add('terms_mismatch', 'high', d.join(', '));
  }
  if (validDate(r.checkIn) && r.createdAt && daysBetween(String(r.createdAt).slice(0, 10), r.checkIn) < 0) add('checkin_before_enquiry', 'medium', r.checkIn);
  if (r.status === 'completed' && c.listedPerNight > 0 && c.nights > 0 && r.amount > 0) {
    const expected = c.listedPerNight * c.nights;
    if (r.amount < expected * 0.5) add('amount_far_below_listed', 'medium', 'reported ' + r.amount + ' vs about ' + expected);
    if (r.amount > expected * 3) add('amount_far_above_listed', 'info', 'reported ' + r.amount + ' vs about ' + expected);
  }
  if (r.reportedAt && validDate(r.checkIn) && daysBetween(r.checkIn, String(r.reportedAt).slice(0, 10)) > 21) add('late_report', 'info', 'reported over 21 days after check-in');
  if (r.status === 'completed' && r.guestStayed === 'no') add('guest_denies_stay', 'high');
  if ((r.status === 'cancelled' || r.status === 'no_show') && r.guestStayed === 'yes') add('property_says_not_stayed_guest_says_stayed', 'high');
  if (r.status === 'enquired' && r.guestStayed === 'yes') add('guest_stayed_not_reported', 'high');
  return flags;
}

/* ---- per-property review across a month or quarter ----
   A property whose guests keep saying "I stayed" while the property reports little or nothing is the classic leak. */
export function propertyReview(rows, opts) {
  const o = Object.assign({ minEnquiries: 6, unreportedShare: 0.4, minUnreported: 3 }, opts);
  const by = {};
  for (const r of rows || []) {
    if (!r || !r.partnerId) continue;
    const b = (by[r.partnerId] = by[r.partnerId] || { partnerId: r.partnerId, enquiries: 0, completed: 0, guestYes: 0, unreported: 0, conflicts: 0, months: new Set() });
    b.enquiries += 1; if (monthOf(r.checkIn || r.createdAt)) b.months.add(monthOf(r.checkIn || r.createdAt));
    if (r.status === 'completed') b.completed += 1;
    if (r.guestStayed === 'yes') { b.guestYes += 1; if (r.status === 'enquired') b.unreported += 1; if (r.status === 'cancelled' || r.status === 'no_show') b.conflicts += 1; }
    if (r.status === 'completed' && r.guestStayed === 'no') b.conflicts += 1;
  }
  return Object.values(by).map((b) => {
    const share = b.guestYes ? b.unreported / b.guestYes : 0, reasons = [];
    if (b.unreported >= o.minUnreported && share >= o.unreportedShare) reasons.push(b.unreported + ' of ' + b.guestYes + ' guest-confirmed stays were never reported by the property');
    if (b.conflicts >= 2) reasons.push(b.conflicts + ' records where guest and property disagree');
    if (b.enquiries >= o.minEnquiries && b.completed === 0 && b.guestYes === 0) reasons.push('no stay reported or confirmed from ' + b.enquiries + ' enquiries (may be normal: ask the owner)');
    return { partnerId: b.partnerId, enquiries: b.enquiries, completed: b.completed, guestYes: b.guestYes, unreported: b.unreported, conflicts: b.conflicts,
      level: reasons.length && (share >= o.unreportedShare || b.conflicts >= 2) ? 'review' : reasons.length ? 'watch' : 'ok', reasons };
  }).sort((a, b) => ({ review: 0, watch: 1, ok: 2 }[a.level] - { review: 0, watch: 1, ok: 2 }[b.level]) || b.unreported - a.unreported);
}
