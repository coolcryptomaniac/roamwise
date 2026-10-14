/* ============================================================================
   creators/local-barter-core.mjs — local-first barter matching, creator quality,
   and the WhatsApp deal flow between a creator and a property
   ============================================================================
   The idea in one line: a hosted barter (stay + food for content, no cash) works
   best with a GOOD creator who lives NEARBY, because they spend almost nothing
   to get there. So for an Almora property, creators from Almora, Ranikhet,
   Bageshwar, Kausani, Nainital, Bhimtal, Haldwani ... are offered the barter
   first; creators from other states or countries are not shut out, they go to
   a "negotiate full terms" list (travel, cash, dates) instead of an auto-offer.

   Quality is not follower count. The market is full of bought followers, so the
   score leans on engagement for the creator's size, views per follower, and above
   all VERIFIED conversions (stays booked with their RoamWise code).

   Pure functions, no network, no money. Messages are wa.me links a person taps:
   nothing is sent automatically, and nothing is binding until both sides say yes.
   ========================================================================= */

const num = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; };
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const str = (v, n = 120) => String(v == null ? '' : v).trim().slice(0, n);
const key = (v) => str(v, 80).toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();

/* ---- Gazetteer: town centres (approximate, good to ~2 km). Extend freely. ---- */
export const PLACES = Object.freeze({
  /* Kumaon, Uttarakhand */
  almora: [29.5971, 79.6591, 'UK'], 'kasar devi': [29.6316, 79.6668, 'UK'], dharanaula: [29.5966, 79.6593, 'UK'],
  ranikhet: [29.6434, 79.4322, 'UK'], bageshwar: [29.8380, 79.7710, 'UK'], kausani: [29.8434, 79.6036, 'UK'],
  nainital: [29.3803, 79.4636, 'UK'], bhimtal: [29.3456, 79.5590, 'UK'], bhowali: [29.3846, 79.5155, 'UK'],
  haldwani: [29.2183, 79.5130, 'UK'], kathgodam: [29.2660, 79.5380, 'UK'], mukteshwar: [29.4722, 79.6460, 'UK'],
  binsar: [29.7036, 79.7520, 'UK'], jageshwar: [29.6370, 79.8540, 'UK'], dwarahat: [29.7780, 79.4270, 'UK'],
  someshwar: [29.7800, 79.6050, 'UK'], chaukhutia: [29.8840, 79.3470, 'UK'], lamgara: [29.5470, 79.8240, 'UK'],
  pithoragarh: [29.5829, 80.2182, 'UK'], champawat: [29.3360, 80.0910, 'UK'], lohaghat: [29.4050, 80.0890, 'UK'],
  chaukori: [29.8530, 80.0110, 'UK'], munsiyari: [30.0670, 80.2390, 'UK'], berinag: [29.7790, 80.0580, 'UK'],
  rudrapur: [28.9750, 79.4000, 'UK'], kashipur: [29.2100, 78.9600, 'UK'], ramnagar: [29.3940, 79.1260, 'UK'],
  lalkuan: [29.0700, 79.5200, 'UK'], tanakpur: [29.0740, 80.1110, 'UK'], khatima: [28.9200, 79.9700, 'UK'],
  /* Garhwal, Uttarakhand */
  dehradun: [30.3165, 78.0322, 'UK'], rishikesh: [30.0869, 78.2676, 'UK'], haridwar: [29.9457, 78.1642, 'UK'],
  mussoorie: [30.4598, 78.0644, 'UK'], pauri: [30.1520, 78.7800, 'UK'], lansdowne: [29.8377, 78.6871, 'UK'],
  srinagar: [30.2230, 78.7800, 'UK'], chopta: [30.4840, 79.2120, 'UK'], auli: [30.5290, 79.5690, 'UK'],
  joshimath: [30.5550, 79.5640, 'UK'], tehri: [30.3780, 78.4800, 'UK'], uttarkashi: [30.7268, 78.4354, 'UK'],
  /* Nearby plains and big source cities */
  bareilly: [28.3670, 79.4304, 'UP'], moradabad: [28.8386, 78.7733, 'UP'], rampur: [28.8100, 79.0300, 'UP'],
  lucknow: [26.8467, 80.9462, 'UP'], noida: [28.5355, 77.3910, 'UP'], ghaziabad: [28.6692, 77.4538, 'UP'],
  delhi: [28.6139, 77.2090, 'DL'], 'new delhi': [28.6139, 77.2090, 'DL'], gurgaon: [28.4595, 77.0266, 'HR'], gurugram: [28.4595, 77.0266, 'HR'],
  chandigarh: [30.7333, 76.7794, 'CH'], jaipur: [26.9124, 75.7873, 'RJ'], mumbai: [19.0760, 72.8777, 'MH'],
  pune: [18.5204, 73.8567, 'MH'], bengaluru: [12.9716, 77.5946, 'KA'], bangalore: [12.9716, 77.5946, 'KA'],
  hyderabad: [17.3850, 78.4867, 'TG'], chennai: [13.0827, 80.2707, 'TN'], kolkata: [22.5726, 88.3639, 'WB'],
  ahmedabad: [23.0225, 72.5714, 'GJ'], goa: [15.2993, 74.1240, 'GA'], indore: [22.7196, 75.8577, 'MP'],
  /* Himachal and Ladakh */
  manali: [32.2432, 77.1892, 'HP'], shimla: [31.1048, 77.1734, 'HP'], dharamshala: [32.2190, 76.3234, 'HP'],
  kasol: [32.0100, 77.3150, 'HP'], leh: [34.1526, 77.5771, 'LA'],
  /* Nepal, just across the Kali */
  kathmandu: [27.7172, 85.3240, 'NP'], pokhara: [28.2096, 83.9856, 'NP'], mahendranagar: [28.9640, 80.1780, 'NP'],
});
const ALIAS = Object.freeze({ 'kasardevi': 'kasar devi', 'naini tal': 'nainital', 'ranikhet cantt': 'ranikhet', 'bhim tal': 'bhimtal', 'dehra dun': 'dehradun', 'bombay': 'mumbai', 'calcutta': 'kolkata' });
const STATE_NAMES = Object.freeze({ UK: 'Uttarakhand', UP: 'Uttar Pradesh', DL: 'Delhi', HR: 'Haryana', CH: 'Chandigarh', RJ: 'Rajasthan', MH: 'Maharashtra', KA: 'Karnataka', TG: 'Telangana', TN: 'Tamil Nadu', WB: 'West Bengal', GJ: 'Gujarat', GA: 'Goa', MP: 'Madhya Pradesh', HP: 'Himachal Pradesh', LA: 'Ladakh', NP: 'Nepal' });

/** { town, lat, lng, state, country, known, source }. Exact coordinates win; otherwise the town name is looked up. */
export function resolveLocation(input = {}) {
  const raw = typeof input === 'string' ? { town: input } : (input || {});
  const town = key(raw.town || raw.city || raw.location || '');
  const lat = Number(raw.lat), lng = Number(raw.lng);
  const hit = PLACES[ALIAS[town] || town] || PLACES[(ALIAS[town] || town).split(' ')[0]];
  let state = str(raw.state, 4).toUpperCase() || (hit ? hit[2] : '');
  let country = str(raw.country, 2).toUpperCase() || (state === 'NP' ? 'NP' : (state || hit) ? 'IN' : '');
  if (state === 'NP') country = 'NP';
  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat || lng)) {
    return { town, lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5, state, country: country || 'IN', known: true, source: 'coordinates' };
  }
  if (hit) return { town, lat: hit[0], lng: hit[1], state: hit[2], country: hit[2] === 'NP' ? 'NP' : 'IN', known: true, source: 'town' };
  return { town, lat: null, lng: null, state, country, known: false, source: 'unknown' };
}

export function distanceKm(a, b) {
  const A = resolveLocation(a), B = resolveLocation(b);
  if (!A.known || !B.known) return null;
  const r = (d) => d * Math.PI / 180, dLat = r(B.lat - A.lat), dLng = r(B.lng - A.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(A.lat)) * Math.cos(r(B.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) * 10) / 10;
}

/* Hill roads wind: road km is roughly 1.6x the straight line in Kumaon (Almora–Haldwani ~45 km straight, ~85 km by road). */
export const ROAD_FACTOR = 1.6;
export const TIERS = Object.freeze({ localKm: 15, nearbyKm: 90, regionalKm: 300 });

/**
 * local     same town and around it: barter, no travel cost worth mentioning
 * nearby    a short bus or shared-taxi ride (Kumaon belt for an Almora stay): barter first
 * regional  same state, further away: barter if the creator is happy to travel, otherwise talk
 * far       another state or country, or very far: every term is negotiated (travel, cash, dates)
 */
export function proximity(creatorLoc, propertyLoc) {
  const A = resolveLocation(creatorLoc), B = resolveLocation(propertyLoc);
  const km = distanceKm(A, B);
  if (km == null) return { tier: 'unknown', km: null, roadKm: null, sameState: false, label: 'Location not set', score: 30 };
  const sameCountry = (A.country || 'IN') === (B.country || 'IN');
  const sameState = sameCountry && !!A.state && A.state === B.state;
  let tier = 'far';
  if (sameCountry && km <= TIERS.localKm) tier = 'local';
  else if (sameCountry && km <= TIERS.nearbyKm && (sameState || !A.state || !B.state)) tier = 'nearby';
  else if (sameState && km <= TIERS.regionalKm) tier = 'regional';
  const roadKm = Math.round(km * ROAD_FACTOR);
  const label = { local: 'Local', nearby: 'Nearby', regional: 'Same state', far: sameCountry ? (sameState ? 'Far' : 'Other state') : 'Other country' }[tier];
  return { tier, km, roadKm, sameState, sameCountry, label, score: { local: 100, nearby: 80, regional: 50, far: 20 }[tier] };
}

/* ---- What each side wants or offers ---- */
const FOOD = Object.freeze(['none', 'breakfast', 'all']);
const foodRank = (f) => Math.max(0, FOOD.indexOf(f));
const foodText = (f) => ({ none: 'no meals', breakfast: 'breakfast', all: 'all meals' })[f] || 'no meals';

export function normalizeCreatorAsk(raw = {}) {
  return {
    guests: clamp(Math.round(num(raw.guests) || 2), 1, 4),          // "free stay for two" is the usual ask
    nights: clamp(Math.round(num(raw.nights) || 2), 1, 7),
    food: FOOD.includes(raw.food) ? raw.food : 'all',
    travel: raw.travel === true || raw.travel === 'yes',            // wants travel paid/arranged
    cashMin: Math.round(num(raw.cashMin ?? raw.minimumCash)),
    negotiable: raw.negotiable !== false,
  };
}

export function normalizePropertyOffer(raw = {}) {
  const travel = ['none', 'pickup', 'full'].includes(raw.travel) ? raw.travel : (raw.travel === true ? 'full' : 'none');
  return {
    guests: clamp(Math.round(num(raw.guests) || 2), 1, 4),
    nights: clamp(Math.round(num(raw.nights) || 1), 1, 7),
    food: FOOD.includes(raw.food) ? raw.food : 'none',
    travel,                                                          // none | pickup (local transfer) | full
    travelUpTo: Math.round(num(raw.travelUpTo)),
    cashMax: Math.round(num(raw.cashMax)),
    deliverables: str(raw.deliverables || '1 Reel + 3 Stories, tagged, within 7 days of checkout', 200),
  };
}

export function offerText(offerIn) {
  const o = normalizePropertyOffer(offerIn);
  const travel = o.travel === 'full' ? (o.travelUpTo ? `travel up to ₹${o.travelUpTo.toLocaleString('en-IN')}` : 'travel covered')
    : o.travel === 'pickup' ? 'local pickup' : 'own travel';
  return `Stay for ${o.guests}, ${o.nights} night${o.nights > 1 ? 's' : ''}, ${foodText(o.food)}, ${travel}, ${o.cashMax ? `cash up to ₹${o.cashMax.toLocaleString('en-IN')}` : 'no cash'}. Content: ${o.deliverables}.`;
}

/**
 * Line by line: does the property's offer cover what the creator asked for?
 * ok = covered · gap = small difference to agree on · block = will not work as offered.
 */
export function termsFit(askIn, offerIn, tier = 'local') {
  const a = normalizeCreatorAsk(askIn), o = normalizePropertyOffer(offerIn);
  const lines = [];
  const add = (item, status, text) => lines.push({ item, status, text });
  add('guests', o.guests >= a.guests ? 'ok' : 'gap', o.guests >= a.guests ? `Stay for ${o.guests}` : `Creator asks stay for ${a.guests}; offer is for ${o.guests}`);
  add('nights', o.nights >= a.nights ? 'ok' : 'gap', o.nights >= a.nights ? `${o.nights} night${o.nights > 1 ? 's' : ''}` : `Creator asks ${a.nights} nights; offer is ${o.nights}`);
  add('food', foodRank(o.food) >= foodRank(a.food) ? 'ok' : 'gap', foodRank(o.food) >= foodRank(a.food) ? `Food: ${foodText(o.food)}` : `Creator asks ${foodText(a.food)}; offer is ${foodText(o.food)}`);
  if (!a.travel || o.travel === 'full') add('travel', 'ok', o.travel === 'full' ? 'Travel covered' : 'No travel support needed');
  else if (tier === 'local' || (tier === 'nearby' && o.travel === 'pickup')) add('travel', 'ok', tier === 'local' ? 'Local: travel cost is negligible' : 'Local pickup offered');
  else if (tier === 'nearby' || tier === 'regional') add('travel', 'gap', 'Creator wants travel support; discuss bus/taxi fare');
  else add('travel', a.negotiable ? 'gap' : 'block', 'Long-distance travel is not in the offer: negotiate');
  if (a.cashMin <= o.cashMax) add('cash', 'ok', o.cashMax ? `Cash within budget (asks ₹${a.cashMin.toLocaleString('en-IN')})` : 'No cash asked');
  else add('cash', a.negotiable ? 'gap' : 'block', `Creator asks ₹${a.cashMin.toLocaleString('en-IN')} cash; offer is ${o.cashMax ? '₹' + o.cashMax.toLocaleString('en-IN') : 'no cash'}`);
  const blocks = lines.filter((l) => l.status === 'block').length, gaps = lines.filter((l) => l.status === 'gap').length;
  /* Far creators always go to a negotiation, even when the numbers look fine, so travel and dates are written down. */
  const fit = blocks ? 'no_fit' : (tier === 'far' || tier === 'unknown' || gaps) ? 'negotiate' : 'ready';
  return { fit, lines, gaps, blocks };
}

/* ---- Creator quality: built to resist bought followers ---- */
export function expectedEngagementPct(followers) {
  const f = num(followers);
  return f < 10000 ? 4 : f < 100000 ? 2.5 : f < 500000 ? 1.5 : 1;
}

export function creatorQuality(m = {}) {
  const followers = num(m.followers);
  const er = num(m.engagementPct) || (followers && (num(m.avgLikes) + num(m.avgComments)) ? ((num(m.avgLikes) + num(m.avgComments)) / followers) * 100 : 0);
  const views = num(m.avgViews), posts = num(m.postsLast30d), bookings = num(m.verifiedBookings), clicks = num(m.verifiedClicks);
  const flags = [], why = [];
  let s = 0;

  const size = followers ? clamp((Math.log10(followers) - 3) / 2.5, 0, 1) * 15 : 0;           // 1k=0 · 10k=6 · 100k=12 · 300k+=15
  s += size;

  let eng = 0;
  if (!er) { eng = 8; flags.push('engagement_unknown'); }
  else if (er > 25 && followers > 2000) { eng = 8; flags.push('engagement_suspicious'); }
  else { eng = clamp(er / expectedEngagementPct(followers), 0, 1.2) / 1.2 * 30; if (er >= expectedEngagementPct(followers)) why.push(`engagement ${er.toFixed(1)}% is strong for their size`); }
  s += eng;

  const vpf = followers && views ? views / followers : 0;
  s += !views ? 5 : vpf >= 0.5 ? 15 : vpf >= 0.2 ? 11 : vpf >= 0.05 ? 6 : 0;
  if (views && vpf < 0.05) flags.push('low_reach');
  if (vpf >= 0.5) why.push('reels reach well beyond followers');

  let conv = 8;                                                                                   // new creators still get a fair start
  if (bookings >= 5) conv = 25; else if (bookings >= 2) conv = 20; else if (bookings === 1) conv = 14;
  else if (clicks >= 50) { conv = 4; flags.push('clicks_no_bookings'); }
  s += conv;
  if (bookings) why.push(`${bookings} verified booking${bookings > 1 ? 's' : ''} through RoamWise`);

  s += posts >= 8 ? 10 : posts >= 4 ? 7 : posts >= 1 ? 4 : 0;
  if (!posts) flags.push('inactive_lately');
  const local = num(m.audienceLocalPct);
  s += local >= 40 ? 5 : local >= 20 ? 3 : 0;
  if (local >= 40) why.push(`${Math.round(local)}% of audience in the region`);

  if (followers >= 20000 && er && er < 0.6) flags.push('likely_inflated');
  if (followers > 50000 && num(m.accountAgeDays) && num(m.accountAgeDays) < 120) flags.push('audience_growth_anomaly');
  const verified = m.metricsVerified === true;
  if (!verified) { s *= 0.85; flags.push('self_reported'); }
  if (flags.includes('likely_inflated') || flags.includes('audience_growth_anomaly')) s = Math.min(s, 35);
  const score = Math.round(clamp(s, 0, 100));
  return { score, grade: score >= 75 ? 'A' : score >= 60 ? 'B' : score >= 45 ? 'C' : 'D', engagementPct: Math.round(er * 10) / 10, flags, why, verified };
}

/* ---- Who gets the offer: nearest good creators first, a capped list, rotated fairly ---- */
const nicheHit = (a, b) => { const A = (a || []).map(key), B = (b || []).map(key); return A.length && B.length ? A.filter((x) => B.includes(x)).length / Math.min(A.length, B.length) : 0; };

export function rankForOffer(offerIn, creators = [], opts = {}) {
  const offer = normalizePropertyOffer(offerIn.offer || offerIn);
  const propLoc = offerIn.location || opts.location;
  const limit = clamp(Math.round(num(opts.limit) || 8), 1, 50);
  const minQuality = num(opts.minQuality) || 45;
  const cooldownDays = opts.cooldownDays ?? 14;
  const today = Date.parse(opts.today || new Date().toISOString());
  const barterOnly = !offer.cashMax && offer.travel !== 'full';
  const notify = [], negotiate = [], skipped = [], active = [], seen = new Set();
  const pid = str(offerIn.propertyId || offerIn.id, 60);
  for (const c of Array.isArray(creators) ? creators : []) {
    if (!c) continue;
    const id = str(c.id || c.handle || c.phone || c.email, 120).toLowerCase();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const prox = proximity(c.location || c.town, propLoc);
    const quality = c.rating && Number.isFinite(c.rating.score) ? c.rating : creatorQuality(c.metrics || c);
    const terms = termsFit(c.ask || {}, offer, prox.tier);
    const niche = nicheHit(c.niches, offerIn.niches || opts.niches);
    const rank = Math.round(quality.score * 0.55 + prox.score * 0.30 + niche * 15);
    const where = resolveLocation(c.location || c.town);
    const row = { id, name: str(c.name, 80), handle: str(c.handle, 120), phone: str(c.phone, 24), town: where.town, location: where, proximity: prox, quality, terms, rank, source: c };
    const last = Date.parse(c.lastOfferAt || '');
    /* A deal already running with this property stays on the desk, whatever the cooldown says. */
    const running = pid && Object.values(c.deals || {}).some((d) => d && d.propertyId === pid && !['closed', 'declined'].includes(d.status));
    if (running) { active.push(row); continue; }
    if (quality.score < minQuality || quality.flags.includes('likely_inflated') || quality.flags.includes('audience_growth_anomaly')) { skipped.push({ ...row, why: 'quality below bar' }); continue; }
    if (terms.fit === 'no_fit') { skipped.push({ ...row, why: 'terms do not fit' }); continue; }
    if (Number.isFinite(last) && cooldownDays && today - last < cooldownDays * 864e5) { skipped.push({ ...row, why: 'offered recently' }); continue; }
    /* A stay-and-food barter is offered automatically only where travel costs the creator little. */
    const reach = offerIn.reach || opts.reach || 'nearby';
    const autoTier = prox.tier === 'local'
      || (prox.tier === 'nearby' && reach !== 'local')
      || (prox.tier === 'regional' && reach !== 'local' && (reach === 'state' || !barterOnly || (quality.score >= 70 && !normalizeCreatorAsk(c.ask).travel)));
    (autoTier && terms.fit !== 'negotiate' ? notify : negotiate).push(row);
  }
  const by = (a, b) => b.rank - a.rank || (a.proximity.km ?? 1e9) - (b.proximity.km ?? 1e9);
  notify.sort(by); negotiate.sort(by); active.sort(by);
  return { notify: notify.slice(0, limit), negotiate: negotiate.slice(0, limit), active, skipped, barterOnly };
}

/* ---- Maps and WhatsApp ---- */
export function mapsLink(loc) {
  const L = resolveLocation(loc);
  const q = L.known ? `${L.lat},${L.lng}` : (typeof loc === 'string' ? loc : str(loc && (loc.query || loc.town), 120));
  return q ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q) : '';
}
export function directionsLink(from, to) {
  const A = resolveLocation(from), B = resolveLocation(to);
  if (!B.known) return '';
  return 'https://www.google.com/maps/dir/?api=1' + (A.known ? '&origin=' + encodeURIComponent(`${A.lat},${A.lng}`) : '') + '&destination=' + encodeURIComponent(`${B.lat},${B.lng}`);
}
/** Indian 10-digit numbers get 91; anything else must already carry a country code. Empty when unusable. */
export function waNumber(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 10 && /^[6-9]/.test(d)) d = '91' + d;
  return d.length >= 11 && d.length <= 15 ? d : '';
}
export function waLink(phone, text) {
  const n = waNumber(phone);
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent(String(text || '').slice(0, 1800));
}

export function dealId(propertyId, creatorId, iso = new Date().toISOString()) {
  let h = 2166136261;
  for (const ch of `${propertyId}|${creatorId}|${String(iso).slice(0, 10)}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return 'RWD-' + h.toString(36).toUpperCase().slice(0, 6);
}

export const DEAL_STAGES = Object.freeze(['offered', 'creator_yes', 'property_yes', 'dates_locked', 'stayed', 'content_live', 'closed', 'countered', 'declined']);

/** The message to the creator: the offer, why them, where it is, and how to say yes. */
export function creatorDealMessage(deal) {
  const d = deal || {}, p = d.property || {}, c = d.creator || {}, prox = d.proximity || {};
  const first = str(c.name || 'there', 40).split(/\s+/)[0];
  const where = prox.km != null ? ` (${prox.tier === 'local' ? 'in your town' : `about ${prox.roadKm} km by road from you`})` : '';
  const negotiate = d.terms && d.terms.fit !== 'ready';
  return [
    `Hi ${first}, RoamWise here. ${p.name || 'A partner stay'} in ${titleCase(p.town || '')}${where} would like to host you for content.`,
    '',
    `Offer: ${offerText(d.offer)}`,
    p.mapsUrl ? `Location: ${p.mapsUrl}` : '',
    negotiate && d.terms ? 'To agree: ' + d.terms.lines.filter((l) => l.status !== 'ok').map((l) => youVoice(l.text)).join('; ') + '.' : '',
    '',
    d.fairNote ? d.fairNote : '',
    negotiate ? 'Reply with what works for you (dates, travel, anything else) and we will settle it with the property.'
      : d.instantAccept ? 'The property has already agreed these exact terms: reply YES with 2-3 dates and it is confirmed. Reply NO if it is not for you.'
        : 'Reply YES with 2-3 dates that suit you, or NO if it is not for you. Nothing is binding until both sides confirm the same terms.',
    `This offer is held for you for ${d.holdHours || 48} hours, then it goes to the next creator.`,
    `Deal ref: ${d.id || ''}`,
  ].filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n').trim();
}

/** The message to the property: who the creator is, the numbers that matter, and the terms. */
export function propertyDealMessage(deal) {
  const d = deal || {}, p = d.property || {}, c = d.creator || {}, q = d.quality || {}, prox = d.proximity || {};
  const stats = [c.followers ? `${Number(c.followers).toLocaleString('en-IN')} followers` : '', q.engagementPct ? `${q.engagementPct}% engagement` : '', c.verifiedBookings ? `${c.verifiedBookings} verified bookings` : '', q.grade ? `RoamWise grade ${q.grade}${q.verified ? '' : ' (self-reported numbers)'}` : ''].filter(Boolean).join(' · ');
  return [
    `Namaste ${p.name || ''} team, RoamWise here. A creator for your barter offer:`,
    '',
    `${c.name || 'Creator'}${c.handle ? ' · ' + c.handle : ''}`,
    `Based in ${titleCase(c.town || 'not set')}${prox.km != null ? `, about ${prox.roadKm} km by road (${String(prox.label || '').toLowerCase()})` : ''}`,
    stats,
    '',
    `Terms: ${offerText(d.offer)}`,
    d.recommendation && d.recommendation.fair ? `Fair price for this creator: ₹${d.recommendation.fair.low.toLocaleString('en-IN')}–₹${d.recommendation.fair.high.toLocaleString('en-IN')}. ${d.recommendation.why}` : '',
    d.terms && d.terms.fit !== 'ready' ? 'Still to agree: ' + d.terms.lines.filter((l) => l.status !== 'ok').map((l) => l.text).join('; ') + '.' : '',
    '',
    'Reply YES to host, or suggest other dates. We confirm the same terms to both of you in writing before the stay.',
    `Deal ref: ${d.id || ''}`,
  ].filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n').trim();
}

/** Final confirmation, identical text to both sides once they have both said yes. */
export function confirmationMessage(deal, dates = {}) {
  const d = deal || {}, p = d.property || {}, c = d.creator || {};
  return [
    `Confirmed · ${d.id || ''}`,
    `${c.name || 'Creator'} × ${p.name || 'Property'}`,
    `Dates: ${str(dates.checkIn, 10) || 'TBC'}${dates.nights ? `, ${dates.nights} night${dates.nights > 1 ? 's' : ''}` : ''}`,
    `Terms: ${offerText(d.offer)}`,
    p.mapsUrl ? `Map: ${p.mapsUrl}` : '',
    'Content is posted within 7 days of checkout with an honest caption and #ad/#collab disclosure. Either side can cancel up to 48 hours before check-in.',
  ].filter(Boolean).join('\n');
}

/** Everything a desk needs to send both messages for one creator × offer. */
export function buildDeal(offerIn, row, opts = {}) {
  const prop = offerIn || {}, c = row || {};
  const loc = prop.location || {};
  const property = { id: str(prop.propertyId || prop.id, 60), name: str(prop.name, 110), town: resolveLocation(loc).town, whatsapp: waNumber(prop.whatsapp), mapsUrl: mapsLink(loc) };
  const m = (c.source && (c.source.metrics || c.source)) || {};
  const creator = { id: c.id, name: c.name, handle: c.handle, town: c.town, phone: waNumber(c.phone), followers: num(m.followers), verifiedBookings: num(m.verifiedBookings) };
  const rec = opts.recommendation || null;
  const baseOffer = { ...(prop.offer || prop) };
  if (rec && rec.package && rec.package.deliverables) baseOffer.deliverables = rec.package.deliverables;
  if (rec && rec.verdict === 'hybrid' && rec.topUp) baseOffer.cashMax = rec.topUp;
  const deal = { id: dealId(property.id, creator.id, opts.today), property, creator, offer: normalizePropertyOffer(baseOffer), proximity: c.proximity, quality: c.quality, terms: c.terms,
    instantAccept: !!prop.instantAccept, holdHours: opts.holdHours || 48, recommendation: rec,
    fairNote: rec && rec.fair ? `Fair-price check: about ₹${rec.fair.low.toLocaleString('en-IN')}–₹${rec.fair.high.toLocaleString('en-IN')} for this brief at your level; ${rec.verdict === 'hybrid' ? `the stay plus ₹${rec.topUp.toLocaleString('en-IN')} covers it` : rec.verdict === 'negotiate' ? 'the stay alone is below that, so tell us what would work' : 'the stay covers it'}.` : '' };
  deal.toCreator = creatorDealMessage(deal);
  deal.toProperty = propertyDealMessage(deal);
  deal.creatorWa = creator.phone ? waLink(creator.phone, deal.toCreator) : '';
  deal.propertyWa = property.whatsapp ? waLink(property.whatsapp, deal.toProperty) : '';
  deal.directions = directionsLink(c.location || (c.town ? { town: c.town } : null), loc);
  return deal;
}

const youVoice = (t) => String(t).replace(/^Creator asks /, 'You asked for ').replace(/^Creator wants /, 'You want ').replace(/; offer is /, '; the offer is ');
function titleCase(s) { return String(s || '').replace(/\b[a-z]/g, (m) => m.toUpperCase()); }
export const stateName = (code) => STATE_NAMES[code] || code || '';
