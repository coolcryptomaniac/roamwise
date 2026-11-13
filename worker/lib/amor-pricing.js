/* Guest prices for Amor Hospitality stays and packages, computed only on the server (policy: amor-policy.js).
 * guest price = supplier cost (tax included) + RoamWise commission K + 18% GST on K, where K gives a margin of
 * 20-25%+ by demand, never more than a 200% markup, never below the 7% floor agreed with Amor, and never above
 * a known public price for the same thing (hotel's own rate, OTAs). Supplier nets never leave this module except
 * in `supplierNet`, which goes to KV and to Amor's own booking email, never to the browser. */
import { AMOR, GIR_EXTRAS, PLAN_LABEL, COMMISSION, COMMISSION_GST, roomGstRate, advanceShare, balanceLeadDays } from './amor-rates.js';
import { PACKAGES } from './amor-packages.js';
import { POLICY, marginFor, sellFor, floorFor } from './amor-policy.js';

export const MARKUP = 1 + COMMISSION * (1 + COMMISSION_GST); // the 7% floor, 1.0826
const DAY = 864e5;
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const at = (d) => Date.parse(d + 'T00:00:00Z');
const ceil10 = (n) => Math.ceil(Math.round(n * 100) / 1000) * 10;
const floor10 = (n) => Math.floor(n / 10) * 10;
const fail = (m) => { throw Object.assign(new Error(m), { status: 422 }); };

/* What one room costs RoamWise for one night, tax included. */
export function nightCost(stayId, roomId, plan, date, extraBeds = 0) {
  const p = AMOR[stayId]; const r = p && p.rooms[roomId];
  if (!r) fail('Unknown room');
  if (!p.plans.includes(plan)) fail('That meal plan is not offered here');
  if (date < p.validFrom || date > p.validTo) fail(p.name + ' is bookable online from ' + p.validFrom + ' to ' + p.validTo + '.');
  if (p.blocked && p.blocked.has(date)) fail(p.blockedReason);
  const peak = p.peakDates.has(date);
  let tariff = peak && p.peakTable ? r.peak[plan] : r.rates[plan];
  if (peak && p.peakSupplement) tariff += p.peakSupplement;
  tariff += extraBeds * ((peak && p.extraBedPeak) ? p.extraBedPeak[plan] : (p.extraBed ? p.extraBed[plan] : 0));
  const cost = p.taxIncluded ? tariff : tariff * (1 + roomGstRate(tariff));
  return { cost, peak };
}

/* extraBeds: for a whole-villa booking, beds added to that one unit; otherwise rooms that get one extra bed.
 * Returns cost (to RoamWise), target sell (policy margin per night) and the public price when one is known. */
function legCost(leg, checkin, rooms, extraBeds, ctx) {
  const p = AMOR[leg.stay], r = p.rooms[leg.room]; let cost = 0, sell = 0, pub = 0, peakNights = 0;
  if (r.exclusive && rooms > 1) fail('The whole villa is one booking');
  if (r.keys && rooms > r.keys) fail('Only ' + r.keys + ' of these rooms exist; choose fewer or another room.');
  const withBed = r.exclusive ? 0 : Math.min(extraBeds, rooms);
  for (let i = 0; i < leg.nights; i++) {
    const d = iso(at(checkin) + i * DAY);
    let c, peak;
    if (r.exclusive) { const n = nightCost(leg.stay, leg.room, leg.plan, d, extraBeds); c = n.cost; peak = n.peak; }
    else { const n = nightCost(leg.stay, leg.room, leg.plan, d, 0); peak = n.peak; c = n.cost * (rooms - withBed) + (withBed ? nightCost(leg.stay, leg.room, leg.plan, d, 1).cost * withBed : 0); }
    cost += c; sell += sellFor(c, marginFor(d, { ...ctx, peak })); if (peak) peakNights++;
    const ref = r.rack || (r.market && r.market[leg.plan]); pub += ref ? ref * rooms : Infinity; // hotel's published rate or a checked OTA price, tax included
  }
  if (p.perStayFee) { const f = p.perStayFee.amount * rooms; cost += f; sell += f; pub += f; } // fees pass through at cost
  return { cost, sell, pub, peakNights, nonRefundable: !!(p.peakNonRefundable && peakNights) };
}

/* Core: price a list of legs plus extras. Returns the browser-safe quote and the private supplier cost. */
function build({ name, legs, extras = [], checkin, rooms = 1, extraBeds = 0, paymentType, now, id, kind, guests, group }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(checkin || ''))) fail('Choose a check-in date');
  if (at(checkin) < now - DAY) fail('Choose a check-in date from today onwards');
  let t = at(checkin), cost = 0, target = 0, pub = 0, upfrontCost = 0, peakNights = 0, nonRefundable = false;
  const outLegs = [], supplierNet = [], ctx = { kind, group };
  for (const leg of legs) {
    t += (leg.gapBefore || 0) * DAY;
    const start = iso(t), c = legCost(leg, start, rooms, extraBeds, ctx);
    const daysOut = Math.floor((t - now) / DAY);
    const p = AMOR[leg.stay];
    cost += c.cost; target += c.sell; pub += c.pub; peakNights += c.peakNights; nonRefundable = nonRefundable || c.nonRefundable;
    upfrontCost += c.cost * advanceShare(p.deposit, daysOut);
    t += leg.nights * DAY;
    const L = { property: p.name, place: p.place, room: p.rooms[leg.room].label, plan: PLAN_LABEL[leg.plan] + (p.planNote ? ' · ' + p.planNote : ''), checkin: start, checkout: iso(t), nights: leg.nights, rooms };
    outLegs.push(L); supplierNet.push({ ...L, stay: leg.stay, mealPlan: leg.plan, extraBeds, cost: Math.round(c.cost) });
  }
  for (const e of extras) {
    const x = e.ref ? { ...GIR_EXTRAS[e.ref], ...e } : e;
    if (!(x.cost > 0)) fail('This package is being updated; please try again shortly.');
    const n = x.cost * (x.per === 'room' ? rooms : 1);
    cost += n; upfrontCost += x.prepay ? n : n * 0.25;
    target += sellFor(n, x.budget ? POLICY.weddingBudgetMargin : POLICY.extrasMargin);
    pub += x.public != null ? x.public * (x.per === 'room' ? rooms : 1) : Infinity;
    supplierNet.push({ extra: x.label, cost: n, prepay: !!x.prepay });
  }
  /* Never above a known public price (1% under it), never below the 7% floor or above the 200% markup cap. */
  const floor = ceil10(floorFor(cost)), cap = Math.min(cost * (1 + POLICY.maxMarkup), Number.isFinite(pub) ? pub * (1 - POLICY.undercut) : Infinity);
  let total = ceil10(target);
  if (total > cap) total = Math.max(floor, floor10(cap));
  /* Inside the final-payment window (balance would already be due), the whole amount is due now:
   * no advance option and never a balance date in the past. */
  const dueAt = at(checkin) - Math.max(...legs.map((l) => balanceLeadDays(AMOR[l.stay].deposit))) * DAY;
  const fullOnly = dueAt <= now + DAY;
  const advance = fullOnly ? total : Math.min(total, ceil10(total * upfrontCost / cost));
  if (paymentType !== 'full' && paymentType !== 'advance') fail('Choose advance or full payment');
  const full = paymentType === 'full' || fullOnly;
  const nights = legs.reduce((s, l) => s + l.nights + (l.gapBefore || 0), 0);
  const q = {
    stay: kind === 'package' ? 'pkg' : legs[0].stay, package: kind === 'package' ? id : undefined, property: name, kind,
    checkin, checkout: outLegs[outLegs.length - 1].checkout, nights, rooms, guests, legs: outLegs,
    extras: extras.map((x) => x.label || (GIR_EXTRAS[x.ref] || {}).label), total, portion: full ? 100 : Math.round(advance / total * 100), amount: full ? total : advance,
    advanceAmount: advance, fullOnly: fullOnly || undefined, balance: full ? 0 : total - advance, balanceDueBy: full ? null : balanceDue(legs, checkin),
    peakNights, nonRefundable, currency: 'INR', supplier: 'amor', provisional: legs.some((l) => AMOR[l.stay].provisional) || undefined,
    ...(Number.isFinite(pub) && pub > total ? { publicPrice: Math.round(pub), saving: Math.round(pub - total) } : {}),
  };
  return { quote: q, supplierNet, cost };
}
function balanceDue(legs, checkin) {
  const lead = Math.max(...legs.map((l) => balanceLeadDays(AMOR[l.stay].deposit)));
  return iso(at(checkin) - lead * DAY);
}

/* A single Amor stay chosen on the booking page. */
export function priceStay(body, now = Date.now()) {
  const p = AMOR[body.stay]; if (!p) fail('Online prices for this stay are loading; please try again in a minute.');
  const room = body.room && p.rooms[body.room] ? body.room : Object.keys(p.rooms)[0];
  const plan = p.plans.includes(body.plan) ? body.plan : p.plans[0];
  const checkin = String(body.checkin || ''), checkout = String(body.checkout || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkin) || !/^\d{4}-\d{2}-\d{2}$/.test(checkout)) fail('Invalid dates');
  const nights = (at(checkout) - at(checkin)) / DAY;
  if (!Number.isInteger(nights) || nights < 1 || nights > 14) fail('Choose check-in and check-out dates (up to 14 nights).');
  const rooms = clampInt(body.rooms, 1, 8, 1), extraBeds = clampInt(body.extraBeds, 0, rooms, 0);
  return build({ name: p.name + ' · ' + p.rooms[room].label, legs: [{ stay: body.stay, room, plan, nights }], checkin, rooms, extraBeds,
    paymentType: body.paymentType, now, kind: 'nightly', guests: rooms * p.rooms[room].pax + extraBeds });
}

/* A curated package. Optional `cheaper`: when the dates hit peak nights, look a week either side for a lower total. */
export function pricePackage(body, now = Date.now(), cheaper = true) {
  const k = PACKAGES[String(body.package || '')]; if (!k) fail('Unknown package');
  const checkin = String(body.checkin || '');
  if (k.window && (checkin < k.window.from || checkin > k.window.to)) fail(k.name + ' starts between ' + k.window.from + ' and ' + k.window.to + '.');
  const rooms = k.rooms ? clampInt(body.rooms, k.rooms.min || 1, k.rooms.max, k.rooms.min || 1) : 1;
  const extraBeds = k.extraGuests ? clampInt(body.extraGuests, 0, k.extraGuests, 0) : 0;
  const r = build({ name: k.name, legs: k.legs, extras: k.extras, checkin, rooms, extraBeds, paymentType: body.paymentType, now, id: k.id, kind: 'package', group: k.group,
    guests: rooms * (k.guestsPerRoom || 2) + extraBeds });
  if (cheaper && r.quote.peakNights) {
    let best = null;
    for (let s = -7; s <= 7; s++) {
      if (!s) continue; const d = iso(at(checkin) + s * DAY);
      try { const alt = pricePackage({ ...body, checkin: d }, now, false).quote; if (alt.total < r.quote.total && (!best || alt.total < best.total)) best = { checkin: d, total: alt.total, save: r.quote.total - alt.total }; } catch (_) { /* date not sellable */ }
    }
    if (best) r.quote.cheaperDate = best;
  }
  return r;
}

const clampInt = (v, lo, hi, d) => { const n = Number(v); return Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : d; };

/* Browser-safe catalogue: room names, plans and lowest nightly guest price (no nets). */
export function publicAmor(refDate = '2027-02-08') {
  const out = {};
  for (const [id, p] of Object.entries(AMOR)) {
    const rooms = {};
    for (const [rid, r] of Object.entries(p.rooms)) {
      const plans = {};
      for (const pl of p.plans) { try { plans[pl] = priceStay({ stay: id, room: rid, plan: pl, checkin: refDate, checkout: iso(at(refDate) + DAY), paymentType: 'full' }, at(refDate) - 30 * DAY).quote.total - (p.perStayFee ? p.perStayFee.amount : 0); } catch (_) { /* outside validity */ } }
      rooms[rid] = { label: r.label, guests: r.pax, keys: r.keys || 1, perNight: plans, ...(r.rack ? { publishedRate: r.rack } : {}) };
    }
    out[id] = { name: p.name, place: p.place, plans: p.plans.map((x) => ({ id: x, label: PLAN_LABEL[x] })), rooms, validFrom: p.validFrom, validTo: p.validTo,
      taxesIncluded: true, provisional: !!p.provisional, exclusiveDeal: !!p.exclusiveDeal, ...(p.perStayFee ? { perStayFee: p.perStayFee } : {}) };
  }
  return out;
}
