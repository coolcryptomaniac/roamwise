/* Amor Hospitality rate book: logic only. The NET RATES are not in this public repository.
 * They live encrypted in worker/data/amor-rates.sealed.json; only the Worker can open them, with the private key
 * AMOR_RATES_KEY (a Worker secret created once by deploy-worker.yml and never printed). See amor-rates-store.js.
 * Commercial model (Manish Bhola, Amor, 13 Nov 2026): every sheet rate is a NET rate; RoamWise sets the guest price
 * (policy in amor-policy.js). Up to Rs 500 more off on some properties is headroom, not built into prices.
 * Tax: sheets marked taxIncluded:false get hotel GST added here (5% up to Rs 7,500 a night, 18% above). */

export const COMMISSION = 0.07;      // Amor-agreed floor commission
export const COMMISSION_GST = 0.18;
export const roomGstRate = (tariff) => (tariff <= 7500 ? 0.05 : 0.18);
export const PLAN_LABEL = { EP: 'Room only', CP: 'Breakfast', MAP: 'Breakfast and dinner', AP: 'All meals' };

/* Live registries, filled by setAmorRates() from the decrypted rate book (or a test fixture). */
export const AMOR = {};
export const GIR_EXTRAS = {};
let loadedVersion = null;
export const amorRatesLoaded = () => loadedVersion;

/* Accepts the rate book JSON: { version, properties: { id: {...} }, girExtras: { id: { label, cost, prepay?, public? } } }.
 * Date lists arrive as arrays and become Sets. */
export function setAmorRates(book) {
  if (!book || !book.properties) throw new Error('Amor rate book missing');
  for (const k of Object.keys(AMOR)) delete AMOR[k];
  for (const k of Object.keys(GIR_EXTRAS)) delete GIR_EXTRAS[k];
  for (const [id, p] of Object.entries(book.properties)) {
    AMOR[id] = { ...p, peakDates: new Set(p.peakDates || []), blocked: p.blocked ? new Set(p.blocked) : null };
  }
  Object.assign(GIR_EXTRAS, book.girExtras || {});
  loadedVersion = book.version || 'unknown';
}

/* Advance RoamWise asks for, per property (founder decision, 13 Nov 2026): 25% in general, 50% where the property
 * itself demands it at booking (Padma). When arrival is inside the property's final-payment window, the guest pays in
 * full, so RoamWise never pays a supplier balance out of its own money. Safaris (prepay) are always 100%.
 *   corbett (Tattwaa, Nanau): balance due 7 days before arrival -> full payment within 8 days
 *   padma: 50% at booking, balance 7 days before arrival      -> full payment within 8 days
 *   aramness: 25% at booking, balance 30 days before arrival   -> full payment within 31 days */
export const ADVANCE_RULES = Object.freeze({
  corbett: { advance: 0.25, fullWithinDays: 8 },
  padma: { advance: 0.50, fullWithinDays: 8 },
  aramness: { advance: 0.25, fullWithinDays: 31 },
  default: { advance: 0.25, fullWithinDays: 8 },
});
export function advanceShare(policy, daysOut) {
  const r = ADVANCE_RULES[policy] || ADVANCE_RULES.default;
  return daysOut < r.fullWithinDays ? 1 : r.advance;
}
export const balanceLeadDays = (policy) => (ADVANCE_RULES[policy] || ADVANCE_RULES.default).fullWithinDays;
