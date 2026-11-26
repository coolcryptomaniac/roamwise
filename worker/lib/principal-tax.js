/* RoamWise as principal seller (founder decision 26 Nov 2026): RoamWise buys rooms and services from partners at
 * their net rate, sells the stay or package in its own name, issues the GST invoice for the full value and pays the
 * partner its net rate after the partner accepts the booking.
 *
 * GST (rates from 22 Sep 2025, GST 2.0; the 12% slab is gone). Confirm the RoamWise-specific choices with the CA:
 *   - Hotel accommodation (SAC 996311): 5% when the value of one unit per day is up to Rs 7,500 (no ITC),
 *     18% above (with ITC). The slab follows RoamWise's own selling price per room-night.
 *   - Tour operator service (SAC 998555), a curated package of stays plus transfers/activities: 5% on the full
 *     package value (ITC only of tour operator services). Invoice must say the price includes the bundled services.
 *   - Place of supply: accommodation = where the property is (IGST Act s.12(3)); tour operator to an unregistered
 *     guest = guest's address on record, else RoamWise's own state (s.12(2)). Same state as RoamWise (Uttarakhand,
 *     code 05) -> CGST + SGST, otherwise IGST.
 *   - GST a partner charges RoamWise is a cost, except where RoamWise may take credit for it: an 18% room sold at
 *     18% by a partner in RoamWise's own state (credit across states is not available without registering there).
 *   - Where selling as principal would make RoamWise dearer than the public price at the 7% floor (premium rooms in
 *     other states, where 18% GST would apply twice), the booking falls back to the agent model (`aboveCap`).
 *
 * Margin m is RoamWise's share of its own pre-GST selling price: m = (S - C) / S, so S = C / (1 - m). */
export const SELLER_STATE = '05';
export const SAC = Object.freeze({ room: '996311', tour: '998555', agent: '998552' });
export const ROOM_SLAB_LIMIT = 7500;
export const TOUR_RATE = 0.05;
export const roomRate = (perUnitPerDay) => (perUnitPerDay <= ROOM_SLAB_LIMIT ? 0.05 : 0.18);
/* How far below its target margin RoamWise will go to keep a room-night in the 5% slab (guest saves ~11%). */
export const SLAB_STEP_DOWN = 0.05;

export const STATE_CODE = Object.freeze({
  'Jammu and Kashmir': '01', 'Himachal Pradesh': '02', 'Punjab': '03', 'Chandigarh': '04', 'Uttarakhand': '05', 'Haryana': '06', 'Delhi': '07',
  'Rajasthan': '08', 'Uttar Pradesh': '09', 'Bihar': '10', 'Sikkim': '11', 'Arunachal Pradesh': '12', 'Nagaland': '13', 'Manipur': '14',
  'Mizoram': '15', 'Tripura': '16', 'Meghalaya': '17', 'Assam': '18', 'West Bengal': '19', 'Jharkhand': '20', 'Odisha': '21',
  'Chhattisgarh': '22', 'Madhya Pradesh': '23', 'Gujarat': '24', 'Dadra and Nagar Haveli and Daman and Diu': '26', 'Maharashtra': '27',
  'Karnataka': '29', 'Goa': '30', 'Lakshadweep': '31', 'Kerala': '32', 'Tamil Nadu': '33', 'Puducherry': '34',
  'Andaman and Nicobar Islands': '35', 'Telangana': '36', 'Andhra Pradesh': '37', 'Ladakh': '38',
});
/* Where each sold property is (state code), for the accommodation place of supply. */
export const PROPERTY_STATE = Object.freeze({
  nanau: '05', tattwaa: '05', padma: '02', aramness: '24',
  bigbro: '05', milan: '05', soulmate: '05', corbett: '05', woodbook: '02', newhimank: '02',
});
export const stateCode = (s) => { const v = String(s || '').trim(); return /^\d{2}$/.test(v) ? v : (STATE_CODE[v] || ''); };

export function placeOfSupply({ tour, propertyState, guestState }) {
  if (!tour) return stateCode(propertyState) || SELLER_STATE;
  return stateCode(guestState) || SELLER_STATE;
}

const r2 = (n) => Math.round(n * 100) / 100;
const ceil10 = (n) => Math.ceil(Math.round(n * 100) / 1000) * 10;
const floor10 = (n) => Math.floor(n / 10) * 10;

/* items: [{ cost, units, margin, label }] (cost tax-included as charged to RoamWise, units = rooms that night;
 * units 0 = not a room-night, e.g. an extra or pass-through fee). tour: sell as one tour operator package.
 * floor: minimum margin. cap: highest allowed tax-included total (public price / markup). pos: state code.
 * Returns the guest total (multiple of 10), invoice lines by SAC and rate, GST, and RoamWise's margin. */
export function principalQuote({ items, tour = false, floor = 0.07, cap = Infinity, pos = SELLER_STATE, propertyState = '' }) {
  const creditOk = stateCode(propertyState) === SELLER_STATE;
  const C = items.reduce((t, i) => t + i.cost, 0);
  const rateOf = (i, s) => (i.pureAgent ? 0 : tour ? TOUR_RATE : i.units > 0 ? roomRate(s / i.units) : (i.rate != null ? i.rate : 0.05));
  const plan = items.map((i) => {
    if (i.pureAgent) return { i, s: i.cost, fs: i.cost, credit: 0 };
    let s = i.cost / (1 - i.margin), credit = 0;
    /* 18% outward with an 18% partner invoice in RoamWise's state: the partner's GST is credited, not a cost. */
    if (!tour && creditOk && i.units > 0 && i.inputRate === 0.18 && i.inputGst > 0) {
      const s2 = (i.cost - i.inputGst) / (1 - i.margin);
      if (s2 / i.units > ROOM_SLAB_LIMIT) { credit = i.inputGst; s = s2; }
    }
    if (!tour && i.units > 0 && s / i.units > ROOM_SLAB_LIMIT) {
      const alt = ROOM_SLAB_LIMIT * i.units, mAlt = 1 - i.cost / alt;
      if (mAlt >= Math.max(floor, i.margin - SLAB_STEP_DOWN)) { s = alt; credit = 0; }
    }
    return { i, s, fs: (i.cost - credit) / (1 - floor), credit };
  });
  const totalOf = (key, f = 1) => plan.reduce((t, p) => { const g = p.i.pureAgent ? 1 : f; return t + p[key] * g * (1 + rateOf(p.i, p[key] * g)); }, 0);
  const target = totalOf('s'), floorTotal = ceil10(totalOf('fs'));
  let total = ceil10(target), use = 's', f = 1;
  const aboveCap = floorTotal > cap;
  if (total > cap) {
    total = Math.max(floorTotal, floor10(cap));
    if (total === floorTotal) use = 'fs';
    else { f = cap / target; for (let k = 0; k < 4; k++) f *= total / totalOf('s', f); }
  }
  /* Invoice lines: tax-included value per (SAC, rate), rounded so lines add up to the total exactly. */
  const groups = new Map();
  for (const p of plan) {
    const s = p.i.pureAgent ? p.i.cost : p[use] * (use === 's' ? f : 1), rate = rateOf(p.i, s), sac = p.i.pureAgent ? 'PA' : tour ? SAC.tour : p.i.sac || SAC.room;
    const k = sac + '|' + rate, g = groups.get(k) || { sac, rate, gross: 0, taxable: 0 };
    g.gross += s * (1 + rate); g.taxable += s; groups.set(k, g);
  }
  const lines = [...groups.values()].sort((a, b) => b.gross - a.gross);
  const scale = total / lines.reduce((t, g) => t + g.gross, 0);
  let left = total;
  lines.forEach((g, n) => {
    const gross = n === lines.length - 1 ? r2(left) : r2(g.gross * scale);
    left -= gross;
    g.gross = gross; g.taxable = r2(gross / (1 + g.rate)); g.tax = r2(gross - g.taxable); g.ratePct = Math.round(g.rate * 100);
  });
  const taxable = r2(lines.reduce((t, g) => t + g.taxable, 0)), gst = r2(total - taxable);
  const split = pos === SELLER_STATE ? { cgst: r2(gst / 2), sgst: r2(gst - r2(gst / 2)), igst: 0 } : { cgst: 0, sgst: 0, igst: gst };
  return {
    total, taxable, gst, ...split, pos, interState: pos !== SELLER_STATE, cost: C,
    inputCredit: r2(plan.reduce((t, p) => t + (p.credit || 0), 0)), aboveCap,
    margin: (() => { const pa = items.filter((i) => i.pureAgent).reduce((t, i) => t + i.cost, 0), tx = taxable - pa, cr = plan.reduce((t, p) => t + (p.credit || 0), 0); return tx > 0 ? (tx - (C - pa - cr)) / tx : 0; })(),
    lines: lines.map((g) => ({ sac: g.sac, ratePct: g.ratePct, taxable: g.taxable, tax: g.tax, gross: g.gross,
      label: g.sac === 'PA' ? 'Fees paid on your behalf (pure agent, no GST)' : g.sac === SAC.tour ? 'Tour package (stays and bundled services)' : 'Hotel accommodation' })),
  };
}

/* The browser-safe tax summary carried on a quote and onto the invoice. */
export const taxSummary = (pq, tour) => ({ model: 'principal', inclusive: true, service: tour ? 'tour_operator' : 'accommodation',
  pos: pq.pos, interState: pq.interState, taxable: pq.taxable, gst: pq.gst, cgst: pq.cgst, sgst: pq.sgst, igst: pq.igst,
  lines: pq.lines.map(({ sac, ratePct, taxable, tax, gross, label }) => ({ sac, ratePct, taxable, tax, gross, label })),
  note: tour ? 'Tour operator service: the price includes accommodation and the bundled services; GST at 5% on the full value.' : 'Hotel accommodation sold by RoamWise; GST by room-night value.' });

/* Scale a quote's tax lines to a part payment (advance, balance, or the cash after a Coins discount). */
export function taxForPart(tax, total, part) {
  if (!tax || !(total > 0) || !(part > 0)) return null;
  const k = part / total; let left = part;
  const lines = tax.lines.map((l, n) => {
    const gross = n === tax.lines.length - 1 ? r2(left) : r2(l.gross * k); left -= gross;
    const taxable = r2(gross / (1 + l.ratePct / 100));
    return { ...l, gross, taxable, tax: r2(gross - taxable) };
  });
  const gst = r2(lines.reduce((t, l) => t + l.tax, 0));
  return { ...tax, lines, taxable: r2(part - gst), gst, ...(tax.interState ? { cgst: 0, sgst: 0, igst: gst } : { cgst: r2(gst / 2), sgst: r2(gst - r2(gst / 2)), igst: 0 }) };
}

/* A simple GST-inclusive amount at one rate (fixed-price plans, advances, agent fees). */
export function inclusiveTax(amount, { rate = 0.05, sac = SAC.room, pos = SELLER_STATE, label = 'Hotel accommodation', service = 'accommodation', note = '' } = {}) {
  const gross = r2(amount), taxable = r2(gross / (1 + rate)), gst = r2(gross - taxable), inter = pos !== SELLER_STATE;
  return { model: service === 'agent_fee' ? 'agent' : 'principal', inclusive: true, service, pos, interState: inter, taxable, gst,
    ...(inter ? { cgst: 0, sgst: 0, igst: gst } : { cgst: r2(gst / 2), sgst: r2(gst - r2(gst / 2)), igst: 0 }),
    lines: [{ sac, ratePct: Math.round(rate * 100), taxable, tax: gst, gross, label }], note };
}
/* Re-point a tour package's place of supply once the guest's state is known. */
export function withPos(tax, pos) {
  if (!tax || !tax.lines || !pos || tax.service !== 'tour_operator') return tax;
  const inter = pos !== SELLER_STATE;
  return { ...tax, pos, interState: inter, ...(inter ? { cgst: 0, sgst: 0, igst: tax.gst } : { cgst: r2(tax.gst / 2), sgst: r2(tax.gst - r2(tax.gst / 2)), igst: 0 }) };
}
