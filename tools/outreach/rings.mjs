/* Distance rings for the Milan Heights (Milan Chowk, Almora) creator outreach.
   Straight-line (great-circle) distance from Almora; road distance is longer. Pure functions, no network. */
export const ALMORA = Object.freeze({ lat: 29.597, lon: 79.659 });
export const RINGS = Object.freeze({ near: 90, regional: 500 }); // km; anything farther is "far"
/* Approximate city centres. Add a city here before using it in creators.json. */
export const CITIES = Object.freeze({
  almora: [29.597, 79.659], kausani: [29.845, 79.605], ranikhet: [29.644, 79.432], bageshwar: [29.838, 79.771], nainital: [29.380, 79.463], bhimtal: [29.347, 79.564],
  haldwani: [29.222, 79.513], pithoragarh: [29.583, 80.218], rudrapur: [28.975, 79.400], kathgodam: [29.266, 79.545], ramnagar: [29.394, 79.126],
  dehradun: [30.316, 78.032], rishikesh: [30.087, 78.268], haridwar: [29.946, 78.164], delhi: [28.614, 77.209], gurugram: [28.459, 77.027], noida: [28.535, 77.391],
  chandigarh: [30.733, 76.779], lucknow: [26.847, 80.947], bareilly: [28.367, 79.430], moradabad: [28.839, 78.777], meerut: [28.984, 77.706], agra: [27.177, 78.008], jaipur: [26.912, 75.787],
  mumbai: [19.076, 72.878], pune: [18.520, 73.857], bengaluru: [12.972, 77.594], hyderabad: [17.385, 78.487], kolkata: [22.573, 88.364], chennai: [13.083, 80.271], ahmedabad: [23.023, 72.572]
});
export function km(a, b) {
  const r = (d) => (d * Math.PI) / 180, R = 6371;
  const dLat = r(b[0] - a[0]), dLon = r(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export function ringFor(city, from = ALMORA) {
  const c = CITIES[String(city || '').trim().toLowerCase()];
  if (!c) return { ring: 'unknown', km: null };
  const d = Math.round(km([from.lat, from.lon], c));
  return { ring: d <= RINGS.near ? 'near' : d <= RINGS.regional ? 'regional' : 'far', km: d };
}
export function fromCity(city) { const c = CITIES[String(city || '').trim().toLowerCase()]; return c ? { lat: c[0], lon: c[1] } : ALMORA; }
const ORDER = { near: 0, regional: 1, far: 2 };
/* A creator beyond a campaign's maxKm is allowed ONLY as a "star": very wide reach, videos people clearly love, and sourced
   evidence they convert (for example past hotel or travel collaborations, or viewers asking where to book). Missing or
   unsourced numbers mean not a star. At most maxFarPerRun (default 1) stars are picked per run. */
export const STAR = Object.freeze({ minFollowers: 100000, minEngagementPct: 3 });
const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0);
const httpUrl = (u) => /^https?:\/\/[^\s]+$/.test(String(u || ''));
export function isStar(c) {
  const r = c && c.reach, ev = c && c.conversionEvidence;
  return !!r && num(r.followers) >= STAR.minFollowers && num(r.engagementPct) >= STAR.minEngagementPct && httpUrl(r.source)
    && !!ev && String(ev.text || '').trim().length >= 20 && httpUrl(ev.source);
}
/* Fit score used inside a radius and to rank stars: bigger audience and more loved content score higher; evidence of conversion adds. */
export function quality(c) {
  const r = (c && c.reach) || {};
  return Math.round(10 * Math.log10(Math.max(1, num(r.followers))) + 5 * Math.min(10, num(r.engagementPct)) + (c && c.conversionEvidence && httpUrl(c.conversionEvidence.source) ? 15 : 0));
}
/* Next creators to email for one campaign: matching niche, confirmed base city, a public business email, not yet
   contacted for this campaign.
   Without maxKm: nearest ring first. With maxKm (food-vlogger and painting promotions use 90): the best-fitting LOCAL creators
   (inside maxKm, higher quality first, then nearer); beyond maxKm only isStar creators, at most maxFarPerRun of them, ranked by
   quality alongside the locals. Anyone else farther away, or whose city is unknown, is never picked. */
export function pickNext(creators, n = 3, campaign = { id: 'milan-heights', city: 'almora', niches: [] }) {
  const from = fromCity(campaign.city), want = (campaign.niches || []).map((x) => x.toLowerCase()), lim = num(campaign.maxKm);
  const base = creators
    .filter((c) => c.status === 'pending' && c.baseConfirmed === true && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email || '') && ringFor(c.baseCity, from).ring !== 'unknown'
      && !(c.sentFor || []).includes(campaign.id) && (!want.length || (c.niches || []).some((x) => want.includes(String(x).toLowerCase()))))
    .map((c) => ({ c, r: ringFor(c.baseCity, from) }));
  if (!lim) return base.sort((a, b) => ORDER[a.r.ring] - ORDER[b.r.ring] || a.r.km - b.r.km).slice(0, n).map((x) => ({ ...x.c, ring: x.r.ring, km: x.r.km }));
  const byFit = (a, b) => quality(b.c) - quality(a.c) || a.r.km - b.r.km;
  const local = base.filter((x) => x.r.km <= lim).sort(byFit);
  const stars = base.filter((x) => x.r.km > lim && isStar(x.c)).sort(byFit).slice(0, num(campaign.maxFarPerRun) || 1);
  return local.concat(stars).sort(byFit).slice(0, n).map((x) => ({ ...x.c, ring: x.r.ring, km: x.r.km, star: x.r.km > lim }));
}
