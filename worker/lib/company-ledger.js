/* Company ledger: one read-only picture of whose money RoamWise is holding.
 * Pure functions, whole rupees. It reads wallets and stay orders and moves nothing:
 * no refunds, payouts or wallet writes happen here.
 *
 * Accounts
 *   guestCash        real money in guest wallets (refunds, prepaid packs) - owed to guests
 *   refundInTransit  the part of guestCash already scheduled to go back to the bank
 *   bonusLiability   unspent bonus coins - RoamWise's promise, never payable in cash
 *   partnerPayable   supplier net on live paid stays - owed to properties
 *   marginBooked     guest price minus supplier net where the stay has not finished
 *   marginEarned     the same once the stay ended 48 hours ago with no refund
 * Earnings rows follow the same two steps per property: booked, then earned. */
const DAY = 24 * 3600 * 1000;
export const EARN_AFTER_MS = 2 * DAY;
export const PROMO_CAP_DEFAULT = 50000;
const LIVE = new Set(['paid', 'paid_pending_confirmation', 'confirmed']);
const rupees = (n) => (Number.isFinite(Number(n)) && Number(n) > 0 ? Math.round(Number(n)) : 0);
const lotOpen = (l) => l && rupees(l.remaining) > 0 && l.state !== 'used' && l.state !== 'lapsed' && l.state !== 'bank';

export function istMonth(ms) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' }).format(new Date(ms));
}

export function walletTotals(wallets, nowMs) {
  const month = istMonth(nowMs);
  const t = { wallets: 0, guestCash: 0, refundInTransit: 0, bonusLiability: 0, bonusIssuedThisMonth: 0 };
  for (const w of wallets || []) {
    if (!w || !Array.isArray(w.lots)) continue;
    t.wallets++;
    for (const l of w.lots) {
      if (l.source === 'bonus' && l.createdAt && istMonth(Date.parse(l.createdAt)) === month) t.bonusIssuedThisMonth += rupees(l.amount);
      if (!lotOpen(l)) continue;
      if (l.source === 'bonus') t.bonusLiability += rupees(l.remaining);
      else { t.guestCash += rupees(l.remaining); if (l.state === 'credit') t.refundInTransit += rupees(l.remaining); }
    }
  }
  return t;
}

/* A stay is "earned" 48 hours after check-out; until then it is only "booked". */
export function stayPhase(order, nowMs) {
  const out = Date.parse((order.checkout || '') + 'T06:30:00Z'); // noon IST check-out
  return Number.isFinite(out) && nowMs >= out + EARN_AFTER_MS ? 'earned' : 'booked';
}

export function stayTotals(orders, nowMs) {
  const t = { stays: 0, collected: 0, partnerPayable: 0, marginBooked: 0, marginEarned: 0, unknownNet: 0 };
  const by = new Map();
  for (const o of orders || []) {
    if (!o || !LIVE.has(o.status) || o.kind === 'balance') continue;
    const paid = rupees(o.amount), phase = stayPhase(o, nowMs);
    const net = Array.isArray(o.supplierNet) ? o.supplierNet.reduce((s, l) => s + rupees(l.cost), 0) : null;
    t.stays++; t.collected += paid;
    const row = by.get(o.property) || { property: o.property || 'Unknown', stays: 0, collected: 0, booked: 0, earned: 0, netKnown: true };
    row.stays++; row.collected += paid;
    if (net === null) { t.unknownNet++; row.netKnown = false; }
    else {
      const owed = Math.min(net, paid), margin = Math.max(0, paid - net);
      t.partnerPayable += owed; row[phase] += owed;
      if (phase === 'earned') t.marginEarned += margin; else t.marginBooked += margin;
    }
    by.set(o.property, row);
  }
  return { totals: t, earnings: [...by.values()].sort((a, b) => (b.booked + b.earned) - (a.booked + a.earned)) };
}

export function buildLedger({ wallets, orders, nowMs = Date.now(), promoCap = PROMO_CAP_DEFAULT, truncated = false } = {}) {
  const w = walletTotals(wallets, nowMs), s = stayTotals(orders, nowMs);
  const alerts = [];
  if (w.bonusIssuedThisMonth > promoCap) alerts.push({ code: 'promo_cap_exceeded', message: 'Bonus coins issued this month (Rs ' + w.bonusIssuedThisMonth + ') are over the cap of Rs ' + promoCap + '.' });
  if (s.totals.unknownNet) alerts.push({ code: 'partner_amount_unknown', message: s.totals.unknownNet + ' paid stay(s) have no supplier amount on record, so what is owed to the property is not counted.' });
  if (truncated) alerts.push({ code: 'partial_scan', message: 'Too many records for one run; totals are a lower bound.' });
  const heldForOthers = w.guestCash + s.totals.partnerPayable;
  return {
    at: new Date(nowMs).toISOString(), month: istMonth(nowMs), promoCap,
    accounts: { ...w, ...s.totals, heldForOthers },
    earnings: s.earnings, alerts, ok: alerts.length === 0,
  };
}
