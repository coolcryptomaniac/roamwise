/* creators/roster-core.mjs - every creator application on one list, each matched to every open property.
   Pure functions, no network. The barter desk (barter-desk.js) answers "who gets THIS offer"; the roster answers
   "what happens to EACH applicant", so nobody disappears into a 'not offered' fold.
   Nothing here sends or pays anything. */
import { proximity, termsFit, creatorQuality, normalizeCreatorAsk, resolveLocation, waLink, offerText } from './local-barter-core.mjs';
import { barterOfferFromPolicy } from './property-terms-core.mjs';

export const STAGES = Object.freeze(['new', 'contacted', 'shortlisted', 'offered', 'active', 'declined']);
const str = (v, n = 120) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);

export function phoneOf(app = {}) {
  if (app.phone) return str(app.phone, 24);
  const m = /WhatsApp:\s*([+\d][\d\s-]{8,})/.exec(String(app.note || ''));
  return m ? m[1].trim() : '';
}

/** One CRM application in the shape the matcher needs. Missing fields never throw. */
export function creatorOf(app = {}) {
  const b = app.barter || {}, mp = app.matchProfile || {};
  const metrics = { ...(b.metrics || {}) };
  metrics.followers = Number(metrics.followers || mp.claimedFollowers || 0);
  const town = (b.location && b.location.town) || (Array.isArray(mp.destinations) ? mp.destinations[0] : '') || '';
  return {
    id: str(app.id, 60), name: str(app.name || app.email || 'Creator', 80), handle: str(app.handle, 160), email: str(app.email, 120),
    phone: phoneOf(app), stage: STAGES.includes(app.stage) ? app.stage : (app.stage === 'new' || !app.stage ? 'new' : 'contacted'),
    createdAt: str(app.createdAt, 30), location: b.location || { town },
    ask: normalizeCreatorAsk(b.ask || { cashMin: Number(app.creatorMinimum || 0) }),
    metrics, niches: String(app.niche || (mp.niches || []).join(',')).split(',').map((x) => x.trim().toLowerCase()).filter(Boolean),
    note: str(app.note, 300),
  };
}

/** Why this application needs a human before any offer. Short plain-language flags. */
export function flagsOf(c, all = []) {
  const f = [];
  if (!c.phone) f.push('no phone / WhatsApp');
  if (!/^https:\/\//i.test(c.handle)) f.push('profile link is not a full https link');
  if (!resolveLocation(c.location).known && !(c.location && c.location.town)) f.push('location not set');
  const same = (k) => c[k] && all.filter((o) => o.id !== c.id && String(o[k]).toLowerCase() === String(c[k]).toLowerCase()).length;
  if (same('email')) f.push('same email as another application');
  if (same('handle')) f.push('same profile as another application');
  return f;
}

function nicheOverlap(a = [], b = []) {
  const s = new Set((b || []).map((x) => String(x).toLowerCase()));
  return (a || []).some((x) => s.has(String(x).toLowerCase())) ? 1 : 0;
}

/** Score one creator against one open policy. verdict: send | negotiate | no_fit. */
export function matchOne(creator, policy) {
  const offer = barterOfferFromPolicy(policy);
  const prox = proximity(creator.location, offer.location);
  const terms = termsFit(creator.ask, offer.offer, prox.tier);
  const quality = creatorQuality(creator.metrics);
  const niche = nicheOverlap(creator.niches, offer.niches);
  const score = Math.round(quality.score * 0.55 + prox.score * 0.30 + niche * 15);
  let verdict = terms.fit === 'no_fit' ? 'no_fit' : (terms.fit === 'ready' && ['local', 'nearby'].includes(prox.tier)) ? 'send' : 'negotiate';
  const why = [];
  if (terms.fit === 'no_fit') why.push('the ask is outside the offer');
  if (quality.flags.includes('likely_inflated') || quality.flags.includes('audience_growth_anomaly')) { verdict = 'no_fit'; why.push('audience numbers look unreliable'); }
  return { propertyId: policy.propertyId, name: policy.name, verdict, score, proximity: prox, terms, quality, niche: !!niche, why, offer: offerText(offer.offer) };
}

const ORDER = { send: 0, negotiate: 1, no_fit: 2 };
/** Every application with its matches, best first. Open policies only. */
export function buildRoster(apps = [], policies = []) {
  const open = (policies || []).filter((p) => p && p.status === 'open');
  const creators = (apps || []).map(creatorOf);
  return creators.map((c) => {
    const matches = open.map((p) => matchOne(c, p)).sort((a, b) => ORDER[a.verdict] - ORDER[b.verdict] || b.score - a.score);
    return { ...c, flags: flagsOf(c, creators), matches, best: matches[0] || null };
  });
}

export function rosterCounts(rows = []) {
  const out = { total: rows.length, send: 0, negotiate: 0, no_match: 0, needs_review: 0 };
  rows.forEach((r) => {
    if (r.best && r.best.verdict === 'send') out.send++; else if (r.best && r.best.verdict === 'negotiate') out.negotiate++; else out.no_match++;
    if (r.flags.length) out.needs_review++;
  });
  STAGES.forEach((s) => { out['stage_' + s] = rows.filter((r) => r.stage === s).length; });
  return out;
}

/** WhatsApp intro to the creator for a given match. A person presses send; nothing is automatic. */
export function creatorIntro(creator, match, policy) {
  const text = `Hi ${creator.name.split(' ')[0] || 'there'}, this is RoamWise. We matched you with ${match.name}: ${match.offer}. `
    + `${match.verdict === 'send' ? 'Are you free to visit soon? Reply with your dates.' : 'Some terms still need a quick chat. Reply and we will sort them out.'}`;
  return creator.phone ? waLink(creator.phone, text) : '';
}

export function toCsv(rows = []) {
  const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const head = ['name', 'handle', 'email', 'phone', 'town', 'stage', 'best_property', 'verdict', 'score', 'flags'];
  const lines = rows.map((r) => [r.name, r.handle, r.email, r.phone, (r.location && r.location.town) || '', r.stage, r.best ? r.best.name : '', r.best ? r.best.verdict : '', r.best ? r.best.score : '', r.flags.join('; ')].map(q).join(','));
  return [head.join(','), ...lines].join('\n');
}
