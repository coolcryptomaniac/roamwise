// compare/compare-core.mjs - pure scoring for the package comparison. No DOM, no network, unit tested.
// The score is a transparent "RoamWise fit score", NOT a customer review. Every point comes from a field in offers.json
// that has a source link and a date. Missing information lowers the score (we do not guess in the seller's favour).

export const CRITERIA = Object.freeze([
  { id: 'price',  label: 'Price per person per night', hint: 'Cheaper than the median of the offers you are comparing scores higher.' },
  { id: 'inclusions', label: 'What is included', hint: 'Meals, guide, transport from a named place, insurance.' },
  { id: 'clarity', label: 'Clear and checkable', hint: 'Price, inclusions and a source are all stated.' },
  { id: 'safety', label: 'Safety and trust', hint: 'Named operator, guide safety plan, reviewed batches.' },
  { id: 'flex',   label: 'Flexibility', hint: 'Pay in parts, free change of date, clear cancellation.' },
]);

export const DEFAULT_WEIGHTS = Object.freeze({ price: 30, inclusions: 25, clarity: 15, safety: 20, flex: 10 });
export const SELLER_TYPES = Object.freeze(['ota', 'local', 'creator', 'brand', 'roamwise']);
export const SELLER_LABEL = Object.freeze({ ota: 'Online travel site', local: 'Local operator', creator: 'Creator or influencer', brand: 'Big travel brand', roamwise: 'RoamWise' });

const clamp01 = (n) => Math.max(0, Math.min(1, n));
const isNum = (n) => typeof n === 'number' && Number.isFinite(n) && n > 0;
const URL_RE = /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/[^\s"'<>]*)?$/i;

/** Keep only well-formed offers; strip anything that could be markup. */
export function cleanOffers(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.map((o) => {
    if (!o || typeof o !== 'object') return null;
    const id = String(o.id || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
    if (!id || seen.has(id)) return null;
    seen.add(id);
    const type = SELLER_TYPES.includes(o.type) ? o.type : 'local';
    const txt = (v, n) => String(v == null ? '' : v).replace(/[<>]/g, '').trim().slice(0, n);
    const cur = o.currency === 'USD' ? 'USD' : 'INR';
    return {
      id, type, seller: txt(o.seller, 60), title: txt(o.title, 90), region: txt(o.region, 40),
      nights: isNum(o.nights) ? Math.round(o.nights) : 0,
      pricePP: isNum(o.pricePP) ? Math.round(o.pricePP) : 0, currency: cur,
      from: txt(o.from, 60),
      has: {
        meals: !!(o.has && o.has.meals), guide: !!(o.has && o.has.guide), transport: !!(o.has && o.has.transport),
        insurance: !!(o.has && o.has.insurance), stay: !(o.has && o.has.stay === false),
      },
      safety: { namedOperator: !!(o.safety && o.safety.namedOperator), safetyPlan: !!(o.safety && o.safety.safetyPlan), reviewed: !!(o.safety && o.safety.reviewed) },
      flex: { payInParts: !!(o.flex && o.flex.payInParts), freeChange: !!(o.flex && o.flex.freeChange), cancellationStated: !!(o.flex && o.flex.cancellationStated) },
      url: typeof o.url === 'string' && URL_RE.test(o.url) ? o.url : '',
      checked: /^\d{4}-\d{2}-\d{2}$/.test(o.checked || '') ? o.checked : '',
      note: txt(o.note, 220),
      suspect: !!o.suspect,
    };
  }).filter(Boolean);
}

export const perNight = (o) => (o.nights > 0 && o.pricePP > 0 ? o.pricePP / o.nights : 0);

/** Offers whose price we can compare fairly: INR, positive, not flagged as suspect. */
export const comparable = (o) => o.currency === 'INR' && !o.suspect && perNight(o) > 0;

export function median(nums) {
  const a = nums.filter(isNum).sort((x, y) => x - y);
  if (!a.length) return 0;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function inclusionScore(o) {
  const h = o.has; let s = 0;
  if (h.stay) s += 0.2; if (h.meals) s += 0.25; if (h.guide) s += 0.25; if (h.transport) s += 0.2; if (h.insurance) s += 0.1;
  return clamp01(s);
}
function clarityScore(o) {
  let s = 0;
  if (comparable(o)) s += 0.4;
  if (o.url) s += 0.2;
  if (o.checked) s += 0.1;
  if (o.from) s += 0.15;
  if (o.has.meals || o.has.guide || o.has.transport) s += 0.15;
  return clamp01(s);
}
const safetyScore = (o) => clamp01((o.safety.namedOperator ? 0.4 : 0) + (o.safety.safetyPlan ? 0.4 : 0) + (o.safety.reviewed ? 0.2 : 0));
const flexScore = (o) => clamp01((o.flex.payInParts ? 0.4 : 0) + (o.flex.freeChange ? 0.3 : 0) + (o.flex.cancellationStated ? 0.3 : 0));

function priceScore(o, med) {
  if (!comparable(o) || !med) return 0;
  // 1 at half the median or less, 0.5 at the median, 0 at double the median or more.
  return clamp01(1 - (perNight(o) / med - 0.5) / 1.5);
}

/** Normalise weights so they sum to 100, ignoring junk. */
export function normaliseWeights(w) {
  const out = {}; let sum = 0;
  for (const c of CRITERIA) { const v = Number(w && w[c.id]); out[c.id] = Number.isFinite(v) && v > 0 ? v : 0; sum += out[c.id]; }
  if (sum <= 0) return { ...DEFAULT_WEIGHTS };
  for (const c of CRITERIA) out[c.id] = (out[c.id] / sum) * 100;
  return out;
}

/** Score every offer (0-100) and return them best first, with a per-criterion breakdown. */
export function rank(offers, weights = DEFAULT_WEIGHTS) {
  const w = normaliseWeights(weights);
  const med = median(offers.filter(comparable).map(perNight));
  return offers.map((o) => {
    const parts = { price: priceScore(o, med), inclusions: inclusionScore(o), clarity: clarityScore(o), safety: safetyScore(o), flex: flexScore(o) };
    const score = Math.round(CRITERIA.reduce((t, c) => t + parts[c.id] * w[c.id], 0));
    return { offer: o, score, parts, perNight: Math.round(perNight(o)), comparable: comparable(o) };
  }).sort((a, b) => b.score - a.score || a.offer.id.localeCompare(b.offer.id));
}

/** One honest sentence on why the top offer won, and what to double-check. */
export function verdict(ranked) {
  const top = ranked[0];
  if (!top) return 'No offers match these filters.';
  const strongest = CRITERIA.map((c) => [c, top.parts[c.id]]).sort((a, b) => b[1] - a[1])[0][0];
  const gaps = [];
  if (!top.offer.has.guide) gaps.push('no guide mentioned');
  if (!top.offer.has.insurance) gaps.push('insurance not mentioned');
  if (!top.offer.safety.safetyPlan) gaps.push('no safety plan stated');
  if (!top.comparable) gaps.push('price could not be compared');
  const tail = gaps.length ? ' Check before paying: ' + gaps.join(', ') + '.' : '';
  return top.offer.seller + ' scores highest (' + top.score + '/100), strongest on "' + strongest.label.toLowerCase() + '".' + tail;
}

export function filterOffers(offers, { type = 'all', maxNights = 0, minNights = 0, q = '' } = {}) {
  const s = String(q || '').toLowerCase().trim();
  return offers.filter((o) => (type === 'all' || o.type === type)
    && (!minNights || o.nights >= minNights) && (!maxNights || o.nights <= maxNights)
    && (!s || (o.seller + ' ' + o.title + ' ' + o.region).toLowerCase().includes(s)));
}

/** Days since a check date, for a "last checked" warning. */
export function ageDays(iso, today = new Date()) {
  const d = Date.parse(iso + 'T00:00:00Z');
  return Number.isFinite(d) ? Math.floor((today.getTime() - d) / 86400000) : Infinity;
}
