/* creators/strict-match-core.mjs - strict niche matching, travel-distance bands and "travelling near an opportunity" alerts.
   Pure functions, no network. Used by roster-core.mjs (admin roster) and tested in tests/strict-match.test.mjs.
   Nothing here contacts anyone: an alert is a suggestion a person sends. */
import { distanceKm, resolveLocation } from './local-barter-core.mjs';

const str = (v, n = 120) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);

/* Canonical content types a property can ask for. Keywords are matched as whole words or word starts, lower-case. */
export const NICHES = Object.freeze({
  food: ['food', 'foodie', 'foodies', 'chef', 'cook', 'cooking', 'recipe', 'recipes', 'restaurant', 'cafe', 'eats', 'street food', 'biryani', 'thali'],
  comedy: ['comedy', 'comedian', 'humor', 'humour', 'funny', 'skit', 'skits', 'meme', 'memes', 'standup', 'stand-up', 'roast', 'satire'],
  travel: ['travel', 'traveller', 'traveler', 'travelling', 'traveling', 'vlog', 'vlogger', 'vlogs', 'explorer', 'explore', 'backpack', 'backpacker', 'wanderlust', 'trek', 'trekking', 'adventure', 'roadtrip', 'wander'],
  lifestyle: ['lifestyle', 'daily vlog', 'day in my life', 'home decor', 'minimal'],
  fashion: ['fashion', 'ootd', 'style', 'styling', 'outfit', 'beauty', 'makeup'],
  photography: ['photography', 'photographer', 'photo', 'photos', 'cinematic', 'filmmaker', 'filmmaking', 'videography', 'videographer', 'reels editor'],
  wellness: ['wellness', 'yoga', 'fitness', 'meditation', 'health', 'gym', 'ayurveda'],
  music: ['music', 'singer', 'musician', 'artist', 'band', 'dj'],
  culture: ['culture', 'heritage', 'spiritual', 'temple', 'history', 'folk', 'kumaon', 'pahadi', 'art'],
  nature: ['nature', 'wildlife', 'birding', 'mountains', 'himalaya', 'himalayan', 'hills'],
  tech: ['tech', 'gadgets', 'ai', 'startup', 'finance', 'business', 'product'],
  family: ['family', 'parenting', 'kids', 'couple', 'couples', 'mom', 'dad'],
});
export const NICHE_NAMES = Object.freeze(Object.keys(NICHES));

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const NICHE_RE = Object.fromEntries(NICHE_NAMES.map((n) => [n, new RegExp('(^|[^a-z])(' + NICHES[n].map(escRe).join('|') + ')([^a-z]|$)', 'i')]));

/** Canonical content types found in free text ("hospitality and product commercials, travel filmmaker" -> travel, photography, tech). */
export function nichesOf(...texts) {
  const t = texts.flat().map((x) => (Array.isArray(x) ? x.join(' ') : String(x == null ? '' : x))).join(' ').toLowerCase();
  return NICHE_NAMES.filter((n) => NICHE_RE[n].test(t));
}

/** What a property needs. strict=true means a creator who does not make that content is not introduced at all. */
export function normalizeNeeds(raw = {}) {
  const wanted = [...new Set((Array.isArray(raw.niches) ? raw.niches : []).map((x) => String(x).toLowerCase().trim()).filter((x) => NICHE_NAMES.includes(x)))].slice(0, 6);
  return { niches: wanted, strict: raw.strict === true && wanted.length > 0, starsPass: raw.starsPass !== false, note: str(raw.note, 200) };
}

/** { ok, matched, why } for a creator's content types against a property's needs. No stated need means everyone passes. */
export function nicheFit(creatorNiches = [], needsIn = {}) {
  const needs = normalizeNeeds(needsIn);
  if (!needs.niches.length) return { ok: true, matched: [], needs, why: '' };
  const mine = new Set(creatorNiches || []);
  const matched = needs.niches.filter((n) => mine.has(n));
  if (matched.length) return { ok: true, matched, needs, why: '' };
  const said = [...mine];
  return { ok: false, matched: [], needs, why: (said.length ? 'makes ' + said.join(', ') + ' content' : 'has not said what content they make') + '; this property needs ' + needs.niches.join(' or ') };
}

/* Distance bands, straight-line km from the creator to the property. Local up to 150, far up to 500, very far beyond. */
export const BANDS = Object.freeze({ localKm: 150, farKm: 500 });
export function travelBand(km) {
  if (km == null || !Number.isFinite(km)) return 'unknown';
  return km <= BANDS.localKm ? 'local' : km <= BANDS.farKm ? 'far' : 'very_far';
}
const BAND_TEXT = {
  local: ['Local · up to 150 km', 'Reachable by road in a day. Travel cost is small; usually the creator covers it.'],
  far: ['Far · 150 to 500 km', 'Needs a bus, train or taxi. Agree who pays the fare before dates are fixed.'],
  very_far: ['Very far · over 500 km', 'Flight or long train. Only worth it with travel covered or a paid deal; the property must agree the cost first.'],
  unknown: ['Location not set', 'Ask the creator where they are based.'],
};
export const bandLabel = (b) => (BAND_TEXT[b] || BAND_TEXT.unknown)[0];
export const bandNote = (b) => (BAND_TEXT[b] || BAND_TEXT.unknown)[1];

/** One public profile photo link, https only. Never fetched from Instagram: the creator or the admin supplies it. */
export function photoOf(app = {}) {
  const b = app.barter || {}, c = [app.photoUrl, b.photoUrl, app.photo, app.avatar].find((x) => /^https:\/\/[^\s<>"']{6,400}$/i.test(String(x || '')));
  return c ? String(c) : '';
}

/** A trip the creator told us about: { town, from, to } with YYYY-MM-DD dates. */
export function tripOf(app = {}) {
  const t = (app.barter && app.barter.trip) || app.trip || {};
  const d = (v) => (/^20\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(String(v || '')) ? String(v) : '');
  const town = str(t.town, 60);
  return town && d(t.to) ? { town, from: d(t.from) || d(t.to), to: d(t.to) } : null;
}

export const ALERT_KM = Object.freeze({ nearKm: 30, maxKm: 100 });
/** Creators whose trip passes within 100 km of an open property that fits their content. today = 'YYYY-MM-DD'. */
export function travelAlerts(rows = [], policies = [], today = new Date().toISOString().slice(0, 10), horizonDays = 60) {
  const limit = new Date(today + 'T00:00:00Z'); limit.setUTCDate(limit.getUTCDate() + horizonDays);
  const out = [];
  (rows || []).forEach((r) => {
    const trip = r.trip; if (!trip || trip.to < today || trip.from > limit.toISOString().slice(0, 10)) return;
    (policies || []).filter((p) => p && p.status === 'open').forEach((p) => {
      const km = distanceKm(resolveLocation(trip.town), p.location);
      if (km == null || km > ALERT_KM.maxKm) return;
      if (!nicheFit(r.nicheTags || [], p.needs).ok) return;
      out.push({ creatorId: r.id, creator: r.name, propertyId: p.propertyId, property: p.name, tripTown: trip.town, from: trip.from, to: trip.to, km: Math.round(km), near: km <= ALERT_KM.nearKm });
    });
  });
  return out.sort((a, b) => a.km - b.km);
}
export function alertMessage(a, creatorFirst = 'there') {
  return `Hi ${creatorFirst}, this is RoamWise. We see you will be around ${a.tripTown} (${a.from === a.to ? a.to : a.from + ' to ' + a.to}). ${a.property} is about ${a.km} km from there and welcomes creators. Want a hosted stay for content? Reply with the dates you are free.`;
}
