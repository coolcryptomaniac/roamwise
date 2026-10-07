/* ============================================================================
   worker/lib/stay-ledger-core.js — pure rules for the stay ledger
   ============================================================================
   Named exports only (see worker/lib/http.js). No network, no Firestore, no
   money movement: this file only validates input and does arithmetic, so it
   can be unit-tested directly under Node.

   A "stay record" is one WhatsApp/phone enquiry that RoamWise sent to a
   property, keyed by a short booking code (RW-XXXXXX). The code is the shared
   reference both sides can see. It lets RoamWise reconcile what a property
   reports against what guests say, without ever holding guest money.

   Privacy: a record holds NO guest name, phone or email. Only the code, the
   property id, a hash of a secret that stays in the guest's own browser, and
   status/amount fields.
   ========================================================================= */

export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
export const STATUSES = ['enquired', 'completed', 'cancelled', 'no_show', 'disputed'];
export const DEFAULT_COMMISSION_PCT = 7;   // Partner Free; 5 on a paid plan
export const DEFAULT_GST_PCT = 18;         // GST on RoamWise's own service fee
export const MAX_STAY_AMOUNT = 10000000;   // ₹1 crore sanity cap

const CODE_RE = /^RW-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
const PARTNER_RE = /^[A-Za-z0-9_-]{2,60}$/;
const HEX64_RE = /^[a-f0-9]{64}$/;
const MONTH_RE = /^(20\d\d)-(0[1-9]|1[0-2])$/;
const DATE_RE = /^20\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const validCode = (c) => typeof c === 'string' && CODE_RE.test(c);
export const validPartnerId = (p) => typeof p === 'string' && PARTNER_RE.test(p);
export const validHash = (h) => typeof h === 'string' && HEX64_RE.test(h);
export const validMonth = (m) => typeof m === 'string' && MONTH_RE.test(m);
export const validDate = (d) => typeof d === 'string' && DATE_RE.test(d);

/** SHA-256 hex of a string (WebCrypto, available in Workers, Node 19+ and browsers). */
export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text)));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Whole rupees, half up; never NaN. */
export const rupees = (x) => Math.round(Number(x) || 0);

/* Commission and GST for one completed stay. All integer rupees, and
   commission + GST always equals total, so an invoice never drifts. */
export function commissionFor(amount, commissionPct, gstPct) {
  const base = Math.max(0, rupees(amount));
  const cp = Math.min(30, Math.max(0, Number.isFinite(+commissionPct) ? +commissionPct : DEFAULT_COMMISSION_PCT));
  const gp = Math.min(40, Math.max(0, Number.isFinite(+gstPct) ? +gstPct : DEFAULT_GST_PCT));
  const commission = rupees((base * cp) / 100);
  const gst = rupees((commission * gp) / 100);
  return { amount: base, commissionPct: cp, gstPct: gp, commission, gst, total: commission + gst };
}

/** Validate an admin "settle" body. Returns { error } or { value }. */
export function parseSettle(body) {
  if (!body || typeof body !== 'object') return { error: 'missing body' };
  if (!validCode(body.code) && !/^RW-M[A-Z0-9]{5}$/.test(String(body.code || ''))) return { error: 'bad code' };
  if (!STATUSES.includes(body.status) || body.status === 'enquired') return { error: 'bad status' };
  const out = { code: body.code, status: body.status };
  if (body.status === 'completed') {
    const a = Number(body.amount);
    if (!Number.isFinite(a) || a <= 0 || a > MAX_STAY_AMOUNT) return { error: 'completed needs an amount' };
    out.amount = rupees(a);
  } else if (body.amount != null) {
    const a = Number(body.amount);
    if (!Number.isFinite(a) || a < 0 || a > MAX_STAY_AMOUNT) return { error: 'bad amount' };
    out.amount = rupees(a);
  }
  if (body.commissionPct != null) {
    const c = Number(body.commissionPct);
    if (!Number.isFinite(c) || c < 0 || c > 30) return { error: 'bad commissionPct' };
    out.commissionPct = c;
  }
  if (body.checkIn != null) {
    if (!validDate(body.checkIn)) return { error: 'bad checkIn' };
    out.checkIn = body.checkIn;
  }
  if (body.partnerId != null) {
    if (!validPartnerId(body.partnerId)) return { error: 'bad partnerId' };
    out.partnerId = body.partnerId;
  }
  if (body.note != null) out.note = String(body.note).slice(0, 300);
  return { value: out };
}

/** A new, fully-validated manual code for stays a property reports with no code. */
export function manualCode(seed) {
  const s = String(seed || '').toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(5, 'X').slice(0, 5);
  return 'RW-M' + s;
}

/** YYYY-MM of an ISO timestamp or date string ('' if unparsable). */
export function monthOf(iso) {
  const m = /^(\d{4})-(\d{2})/.exec(String(iso || ''));
  return m ? m[1] + '-' + m[2] : '';
}

/* Monthly statement. `rows` are ledger documents (plain objects). A row
   counts toward month M by its stay date (checkIn) if known, else its
   settledAt, else its createdAt.

   Besides the money, it flags the patterns that mean leakage:
     - guest said they stayed but the property has not reported it (unreported)
     - property reported completed but the guest said they did not stay (conflict)
     - property reported cancelled/no_show but the guest said they stayed (conflict)
   Flags are for a HUMAN to review. They never change a bill by themselves. */
export function buildStatement(rows, month, opts) {
  opts = opts || {};
  const gstPct = opts.gstPct == null ? DEFAULT_GST_PCT : opts.gstPct;
  const byPartner = {};
  const flags = [];
  const bucket = (id) => (byPartner[id] = byPartner[id] || {
    partnerId: id, enquiries: 0, completed: 0, guestConfirmed: 0, gross: 0,
    commission: 0, gst: 0, total: 0, unreported: 0, conflicts: 0,
  });

  for (const r of rows || []) {
    if (!r || !validPartnerId(r.partnerId)) continue;
    const when = monthOf(r.checkIn) || monthOf(r.settledAt) || monthOf(r.createdAt);
    if (when !== month) continue;
    const b = bucket(r.partnerId);
    b.enquiries += 1;
    const guestYes = r.guestStayed === 'yes';
    const guestNo = r.guestStayed === 'no';
    if (guestYes) b.guestConfirmed += 1;

    if (r.status === 'completed') {
      const c = commissionFor(r.amount, r.commissionPct, gstPct);
      b.completed += 1; b.gross += c.amount; b.commission += c.commission; b.gst += c.gst; b.total += c.total;
      if (guestNo) { b.conflicts += 1; flags.push({ code: r.code, partnerId: r.partnerId, kind: 'conflict_reported_completed_guest_no' }); }
    } else if (r.status === 'cancelled' || r.status === 'no_show') {
      if (guestYes) { b.conflicts += 1; flags.push({ code: r.code, partnerId: r.partnerId, kind: 'conflict_reported_' + r.status + '_guest_yes' }); }
    } else if (guestYes) {
      b.unreported += 1; flags.push({ code: r.code, partnerId: r.partnerId, kind: 'guest_stayed_not_reported' });
    }
  }
  const partners = Object.values(byPartner).sort((a, b) => b.total - a.total || a.partnerId.localeCompare(b.partnerId));
  const totals = partners.reduce((t, p) => {
    t.enquiries += p.enquiries; t.completed += p.completed; t.gross += p.gross;
    t.commission += p.commission; t.gst += p.gst; t.total += p.total;
    t.unreported += p.unreported; t.conflicts += p.conflicts; return t;
  }, { enquiries: 0, completed: 0, gross: 0, commission: 0, gst: 0, total: 0, unreported: 0, conflicts: 0 });
  return { month, gstPct, partners, totals, flags };
}
