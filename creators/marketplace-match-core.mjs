/* Marketplace matching for artists, events, travel agencies and drivers.
 *
 * Same principle as match-core.mjs (creators and properties): RoamWise INTRODUCES,
 * records, and invoices its own fee. It never holds the money, never sets a fare
 * and never dispatches. Pure functions, no network, no payment.
 *
 * Two sides:
 *   supply  — artist | event | agency | driver  (needs documents checked before it may be listed)
 *   demand  — traveller | venue | property      (who is looking)
 *
 * Hard gates (never a match, however good the theme): documents not verified,
 * no shared place, dates that cannot overlap, budget that cannot be bridged,
 * and for drivers any fare-share or dispatch model.
 * "Unknown" (an empty field) scores zero for that part. It is not treated as neutral.
 */
import { placeCloseness, canonicalNiche, PLATFORM_FEE_GST_BPS } from './match-core.mjs';

export const SUPPLY_KINDS = Object.freeze({
  artist: {
    label: 'Artist or band',
    demand: ['venue', 'property', 'traveller'],
    documents: ['portfolio_link', 'rate_card'],
    fee: { type: 'percent', bps: 500, min: 99, dueWhen: 'after the show, from the confirmed fee' },
    note: 'RoamWise only introduces. The venue pays the artist directly; a venue that plays recorded music still needs its own music licences.'
  },
  event: {
    label: 'Event or organiser',
    demand: ['traveller'],
    documents: ['organiser_identity', 'venue_permission', 'event_dates'],
    fee: { type: 'flat', amount: 499, dueWhen: 'prepaid, for a 7-day featured slot' },
    note: 'RoamWise lists and links to the organiser’s own ticketing. It does not sell tickets.'
  },
  agency: {
    label: 'Travel agency or tour operator',
    demand: ['traveller'],
    documents: ['business_name', 'state_registration_number', 'contact_verified'],
    fee: { type: 'flat', amount: 149, dueWhen: 'per qualified lead, after the traveller confirms a booking' },
    note: 'Trek and tour operators may need a state tourism registration; the number is verified by a person before listing.'
  },
  driver: {
    label: 'Driver or taxi operator',
    demand: ['traveller', 'property'],
    documents: ['driving_licence', 'vehicle_registration', 'commercial_permit', 'insurance'],
    fee: { type: 'flat', amount: 99, dueWhen: 'monthly listing fee. Never a share of the fare' },
    note: 'RoamWise lists drivers and the traveller agrees the fare with the driver. Setting fares, dispatching or taking a share of fares is outside this model and needs a state-by-state aggregator review first.',
    forbiddenModels: ['fare_share', 'dispatch', 'surge_pricing']
  }
});
export const DEMAND_KINDS = Object.freeze(['traveller', 'venue', 'property']);

const list = (v, n = 12) => [...new Set((Array.isArray(v) ? v : String(v || '').split(',')).map((x) => String(x || '').trim().toLowerCase()).filter(Boolean))].slice(0, n);
const whole = (v) => { const n = Math.round(Number(v)); return Number.isSafeInteger(n) && n > 0 ? n : 0; };
const day = (v) => (/^20\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(String(v || '')) ? String(v) : '');

export function normalizeProfile(input = {}) {
  const kind = String(input.kind || '').toLowerCase();
  if (!SUPPLY_KINDS[kind] && !DEMAND_KINDS.includes(kind)) throw new Error('unknown kind: ' + kind);
  let min = whole(input.budgetMin), max = whole(input.budgetMax);
  if (max && min > max) [min, max] = [max, min];
  const from = day(input.dateFrom), to = day(input.dateTo);
  return {
    kind, side: SUPPLY_KINDS[kind] ? 'supply' : 'demand',
    name: String(input.name || '').trim().slice(0, 120),
    destinations: list(input.destinations),
    categories: list(input.categories),
    budgetMin: min, budgetMax: max,
    dateFrom: from && to && from > to ? to : from, dateTo: from && to && from > to ? from : to,
    verifiedDocuments: list(input.verifiedDocuments, 20),
    models: list(input.models, 6),
    profileUrl: /^https:\/\//.test(String(input.profileUrl || '')) ? String(input.profileUrl).slice(0, 500) : ''
  };
}

/* May this supply profile be listed at all? A human marks documents verified; this only checks the list. */
export function listingGate(supplyInput) {
  const p = normalizeProfile(supplyInput);
  if (p.side !== 'supply') return { allowed: false, missing: [], blockers: ['not_a_supply_kind'], note: '' };
  const spec = SUPPLY_KINDS[p.kind];
  const missing = spec.documents.filter((d) => !p.verifiedDocuments.includes(d));
  const blockers = [];
  if (missing.length) blockers.push('documents_not_verified');
  for (const m of spec.forbiddenModels || []) if (p.models.includes(m)) blockers.push('model_needs_review:' + m);
  return { allowed: blockers.length === 0, missing, blockers, note: spec.note };
}

function overlap(a, b) {
  if (!a.length || !b.length) return { value: 0, known: false };
  return { value: Math.max(...a.map((x) => Math.max(...b.map((y) => placeCloseness(x, y))))), known: true };
}

export function scoreMatch(demandInput, supplyInput) {
  const demand = normalizeProfile(demandInput), supply = normalizeProfile(supplyInput);
  const spec = SUPPLY_KINDS[supply.kind];
  const blockers = [];
  if (demand.side !== 'demand' || supply.side !== 'supply') blockers.push('wrong_sides');
  else if (!spec.demand.includes(demand.kind)) blockers.push('kind_not_served');
  const gate = listingGate(supply);
  if (!gate.allowed) blockers.push(...gate.blockers);

  const place = overlap(demand.destinations, supply.destinations);
  if (place.known && place.value === 0) blockers.push('no_shared_place');
  const dateKnown = demand.dateFrom && demand.dateTo && supply.dateFrom && supply.dateTo;
  const datesOverlap = dateKnown ? !(demand.dateTo < supply.dateFrom || supply.dateTo < demand.dateFrom) : false;
  if (dateKnown && !datesOverlap) blockers.push('dates_do_not_overlap');
  const budgetKnown = demand.budgetMax && supply.budgetMin;
  const budgetFits = budgetKnown ? supply.budgetMin <= demand.budgetMax && (!supply.budgetMax || !demand.budgetMin || demand.budgetMin <= supply.budgetMax) : false;
  if (budgetKnown && !budgetFits) blockers.push('budget_gap');

  const cats = demand.categories.length && supply.categories.length
    ? (() => { const A = new Set(demand.categories.map(canonicalNiche)), B = new Set(supply.categories.map(canonicalNiche)); return [...A].filter((x) => B.has(x)).length / Math.max(1, Math.min(A.size, B.size)); })()
    : 0;
  const trust = (supply.profileUrl ? 0.5 : 0) + (gate.allowed ? 0.5 : 0);
  const score = Math.round(place.value * 30 + cats * 25 + (budgetFits ? 20 : 0) + (datesOverlap ? 15 : 0) + trust * 10);
  const eligible = blockers.length === 0;
  const reasons = [];
  if (place.value >= 0.85) reasons.push('same or nearby place');
  if (cats > 0) reasons.push('shared interests');
  if (budgetFits) reasons.push('budget fits');
  if (datesOverlap) reasons.push('dates overlap');
  const missingInfo = [!place.known && 'place', !demand.categories.length && 'interests', !budgetKnown && 'budget', !dateKnown && 'dates'].filter(Boolean);
  return {
    eligible, score: eligible ? score : 0, tier: !eligible ? 'blocked' : score >= 70 ? 'strong' : score >= 45 ? 'good' : 'possible',
    blockers, reasons, askForDetails: missingInfo
  };
}

export function rankSuppliers(demandInput, supplies = [], limit = 10) {
  return supplies.map((s, i) => ({ index: i, supply: s, ...scoreMatch(demandInput, s) }))
    .filter((r) => r.eligible)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, Math.max(1, Math.min(50, limit)));
}

/* What RoamWise would charge the SUPPLIER. Never the traveller, never a share of a fare. Proposed
   defaults only: nothing is collected until both sides accept and the payments review is done. */
export function quoteIntroduction(supplyInput, { confirmedAmount = 0 } = {}) {
  const supply = normalizeProfile(supplyInput);
  const spec = SUPPLY_KINDS[supply.kind];
  if (!spec) throw new Error('not a supply kind');
  const f = spec.fee;
  const fee = f.type === 'percent' ? Math.max(f.min, Math.round(whole(confirmedAmount) * f.bps / 10000)) : f.amount;
  return {
    kind: supply.kind, fee, chargedTo: 'supplier', travellerPays: 0, holdsMoney: false,
    dueWhen: f.dueWhen,
    basis: f.type === 'percent' ? `${f.bps / 100}% of the confirmed fee (minimum ₹${f.min})` : `flat ₹${f.amount}`,
    feeGst: Math.round(fee * PLATFORM_FEE_GST_BPS / 10000),
    feeGstNote: 'Plus GST on the RoamWise fee once RoamWise is GST-registered.',
    note: spec.note
  };
}
