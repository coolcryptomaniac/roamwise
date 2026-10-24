// map/map-core.mjs - pure helpers for the Uttarakhand map. The partner list is NOT copied here: the page reads the same
// partners-data.js the Stays pages use, and applies the same public-eligibility rule, so the map can never show a partner
// that the Stays pages would hide.

export const BOUNDS = Object.freeze({ south: 28.6, west: 77.5, north: 31.5, east: 81.1 }); // Uttarakhand, with margin
export const REGIONS = Object.freeze(['Kumaon', 'Garhwal']);

const txt = (v, n) => String(v == null ? '' : v).replace(/[<>\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const list = (v, n, m) => (Array.isArray(v) ? v : []).map((x) => txt(x, m)).filter(Boolean).slice(0, n);
const PAGE_RE = /^\.\.\/[a-z0-9-]+\/$/;

/** Keep well-formed places only: inside the state, known region, safe relative page link. */
export function cleanPlaces(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  return raw.map((p) => {
    if (!p || typeof p !== 'object') return null;
    const id = txt(p.id, 30).toLowerCase().replace(/[^a-z0-9-]/g, '');
    const lat = Number(p.lat), lng = Number(p.lng);
    if (!id || seen.has(id) || !REGIONS.includes(p.region)) return null;
    if (!(lat >= BOUNDS.south && lat <= BOUNDS.north && lng >= BOUNDS.west && lng <= BOUNDS.east)) return null;
    seen.add(id);
    const t = p.travel || {};
    return {
      id, name: txt(p.name, 50), region: p.region, zone: txt(p.zone || p.name, 40), lat, lng, district: txt(p.district, 40).toLowerCase().replace(/[^a-z-]/g, ''),
      page: typeof p.page === 'string' && PAGE_RE.test(p.page) ? p.page : '', pageLabel: txt(p.pageLabel, 60),
      blurb: txt(p.blurb, 200), culture: list(p.culture, 6, 160), food: list(p.food, 6, 160),
      travel: { reach: txt(t.reach, 200), best: txt(t.best, 120), tip: txt(t.tip, 200) },
    };
  }).filter(Boolean);
}

/** Same rule as window.rwStayPublicEligible in partners-data.js. Kept identical; a test compares the two. */
export const isPublicPartner = (p) => !!p && p.listingReady === true && (p.verified === 'signed'
  || (p.verified === 'founder-approved' && p.enquiryOnly === true && p.founderApproval === 'Mohit Pandey · 2026-10-18'));

export const partnersForPlace = (partners, place) => (Array.isArray(partners) ? partners : [])
  .filter((p) => isPublicPartner(p) && String(p.zone || '').toLowerCase() === place.zone.toLowerCase());

export function tierOf(p) {
  if (p.verified === 'signed') return { label: 'RoamWise Partner', note: 'Agreement signed', enquiryOnly: false };
  return { label: 'Founder introduced', note: 'Enquiries only; agreement pending', enquiryOnly: true };
}

/** Safe card model for a partner: no phone numbers or emails are ever passed to the page. */
const PHOTO_RE = /^assets\/[a-z0-9][a-z0-9\-./]*\.(jpg|jpeg|png|webp)$/i;
const photoOf = (p) => { const f = Array.isArray(p.photos) ? p.photos.find((x) => x && PHOTO_RE.test(String(x.src || ''))) : null; return f ? { src: f.src, alt: txt(f.alt, 140) } : null; };
export const partnerCard = (p) => ({ id: String(p.id || ''), name: txt(p.name, 80), area: txt(p.area, 100), type: txt(p.propertyType || p.cat || 'stay', 30), tier: tierOf(p), photo: photoOf(p) });

/** Districts: well-formed rows only. `places` keeps only ids that exist; `zones` are partner zones that belong to the district. */
export function cleanDistricts(raw, places) {
  if (!Array.isArray(raw)) return [];
  const ids = new Set((places || []).map((p) => p.id)), seen = new Set();
  return raw.map((d) => {
    if (!d || typeof d !== 'object') return null;
    const id = txt(d.id, 40).toLowerCase().replace(/[^a-z-]/g, ''), lat = Number(d.lat), lng = Number(d.lng), zoom = Math.round(Number(d.zoom));
    if (!id || seen.has(id) || !REGIONS.includes(d.region)) return null;
    if (!(lat >= BOUNDS.south && lat <= BOUNDS.north && lng >= BOUNDS.west && lng <= BOUNDS.east)) return null;
    seen.add(id);
    return { id, name: txt(d.name, 40), region: d.region, lat, lng, zoom: zoom >= 7 && zoom <= 12 ? zoom : 10, tagline: txt(d.tagline, 160),
      traits: list(d.traits, 5, 100), places: list(d.places, 8, 30).filter((x) => ids.has(x)), zones: list(d.zones, 8, 40) };
  }).filter(Boolean);
}

export const partnersForDistrict = (partners, d) => (Array.isArray(partners) ? partners : [])
  .filter((p) => isPublicPartner(p) && d.zones.some((z) => z.toLowerCase() === String(p.zone || '').toLowerCase()));

/** Google Maps search link built only from the partner's public name and area; the exact spot is resolved by Google, not guessed here. */
export const mapsLink = (p) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([txt(p.name, 80), txt(p.area, 100)].filter(Boolean).join(' '));

/** One pin per public partner, placed at its town (never invented building coordinates). `slot`/`of` let the page fan pins
 *  that share a town out in screen pixels so they do not hide each other. `approx` is always true: the page says so. */
export function partnerPins(partners, d, places) {
  const found = partnersForDistrict(partners, d);
  return found.map((p, i) => {
    const town = (places || []).find((pl) => pl.zone.toLowerCase() === String(p.zone || '').toLowerCase()) || d;
    return { card: partnerCard(p), maps: mapsLink(p), lat: town.lat, lng: town.lng, slot: i, of: found.length, approx: true };
  });
}

export const searchDistricts = (districts, places, q) => {
  const s = String(q || '').toLowerCase().trim();
  if (!s) return districts;
  return districts.filter((d) => (d.name + ' ' + d.region + ' ' + d.tagline + ' ' + d.traits.join(' ') + ' ' + d.places.map((id) => (places.find((p) => p.id === id) || {}).name || '').join(' ')).toLowerCase().includes(s));
};

export const searchPlaces = (places, q) => {
  const s = String(q || '').toLowerCase().trim();
  return s ? places.filter((p) => (p.name + ' ' + p.region + ' ' + p.blurb).toLowerCase().includes(s)) : places;
};
