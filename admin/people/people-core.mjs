/* ============================================================================
   admin/people/people-core.mjs — one sheet for every partner RoamWise works with
   ============================================================================
   Pure functions (no Firebase, no DOM) so they can be unit-tested:

     fromCreatorRow(row)   creator application (already through buildRoster)
     fromPartner(doc)      signed property partner (partners/{id})
     fromCrmLead(doc)      other CRM leads: property, trek-company, yogapreneur
     fromArtist(a)         featured artist (creators/artists-data.json)
     mergePeople(list)     one person per real human/business: records that share
                           an email, a phone (last 10 digits) or an Instagram
                           handle are merged, never deleted
     messageTier(msg)      the auto-inform policy Mohit chose:
                             perfect  -> send now, even past the daily cap
                             routine  -> send, within the daily cap
                             review   -> draft for Mohit (money, legal, disputes,
                                         unverified identity) – kept rare
                             skip     -> no consent or no way to reach them
     peopleKpis(people)    counts, funnel, completeness and a transparent
                           "data worth" estimate with its assumptions shown
   ========================================================================= */

export const TYPES = Object.freeze({ creator: 'Creator', artist: 'Artist', property: 'Property', lead: 'Property lead', trek: 'Trek company', yoga: 'Yoga / wellness' });
export const STAGES = Object.freeze(['new', 'contacted', 'shortlisted', 'offered', 'active', 'declined']);

const s = (v, n = 160) => String(v == null ? '' : v).trim().slice(0, n);
export const emailKey = (e) => { const v = s(e, 160).toLowerCase(); return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(v) ? v : ''; };
export const phoneKey = (p) => { const d = String(p || '').replace(/\D/g, ''); return d.length >= 10 ? d.slice(-10) : ''; };
export function igKey(v){
  const t = s(v, 300).toLowerCase();
  const m = /instagram\.com\/([a-z0-9._]{2,30})/.exec(t) || /^@?([a-z0-9._]{2,30})$/.exec(t.replace(/^instagram\s*:?\s*/, '').replace(/\s.*$/, ''));
  return m && !['p', 'reel', 'reels', 'stories', 'explore'].includes(m[1]) ? m[1].replace(/\.$/, '') : '';
}
const town = (v) => s(v, 60).replace(/\b\w/g, (c) => c.toUpperCase());

function base(type, id, o){
  return {
    id: type + ':' + id, type, name: s(o.name, 80) || 'Unnamed', email: emailKey(o.email), phone: s(o.phone, 24),
    instagram: igKey(o.instagram || o.handle || ''), profileUrl: /^https:\/\//i.test(o.profileUrl || '') ? s(o.profileUrl, 300) : '',
    town: town(o.town), state: s(o.state, 40), niches: (o.niches || []).map((x) => s(x, 30).toLowerCase()).filter(Boolean).slice(0, 8),
    stage: STAGES.includes(o.stage) ? o.stage : 'new', consent: o.consent === true, shareLocation: o.shareLocation === true,
    lastContactAt: s(o.lastContactAt, 30), createdAt: s(o.createdAt, 30), score: Number(o.score) || 0,
    bestMatch: o.bestMatch || null, flags: Array.isArray(o.flags) ? o.flags.slice(0, 8) : [], verified: o.verified === true,
    sources: [type + ':' + id], types: [type], records: 1,
  };
}

export function fromCreatorRow(r = {}){
  const best = r.best && r.best.verdict !== 'no_fit' ? { name: r.best.name, verdict: r.best.verdict, score: r.best.score } : null;
  return base('creator', r.id, { name: r.name, email: r.email, phone: r.phone, handle: r.handle, profileUrl: r.handle,
    town: r.location && r.location.town, niches: r.niches, stage: r.stage, consent: true, createdAt: r.createdAt,
    score: best ? best.score : 0, bestMatch: best, flags: r.flags, verified: !!(r.metrics && r.metrics.metricsVerified) });
}
export function fromPartner(p = {}){
  return base('property', p.id, { name: p.name || p.propertyName, email: p.email || p.ownerEmail, phone: p.phone || p.ownerPhone,
    instagram: p.instagram, profileUrl: p.website || p.publicUrl, town: p.town || p.city || p.location, state: p.state,
    stage: p.status === 'live' || p.status === 'active' ? 'active' : 'contacted', consent: true, createdAt: p.createdAt,
    verified: p.verified === true || p.status === 'live' });
}
const SEG = { property: 'lead', 'trek-company': 'trek', yogapreneur: 'yoga' };
export function fromCrmLead(d = {}){
  const type = SEG[d.seg]; if(!type) return null;
  return base(type, d.id, { name: d.name, email: d.email, phone: d.phone, instagram: d.instagram, profileUrl: d.website || d.reviewUrl,
    town: d.city || d.town, state: d.state, niches: String(d.tags || '').split(','), stage: d.status === 'replied' ? 'contacted' : (d.stage || 'new'),
    consent: d.consent === true, lastContactAt: d.lastContactAt || d.emailedAt, createdAt: d.createdAt });
}
export function fromArtist(a = {}){
  return base('artist', a.id, { name: a.name, email: a.email, instagram: a.instagram, profileUrl: a.website || a.instagram,
    state: a.state, town: a.town, niches: a.themes, stage: 'active', consent: true, verified: true });
}

/* ---- merge ---------------------------------------------------------------- */
export function mergePeople(list = []){
  const items = list.filter(Boolean), parent = items.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const seen = new Map();
  items.forEach((p, i) => {
    for(const k of [p.email && 'e:' + p.email, phoneKey(p.phone) && 'p:' + phoneKey(p.phone), p.instagram && 'i:' + p.instagram]){
      if(!k) continue;
      if(seen.has(k)) parent[find(i)] = find(seen.get(k)); else seen.set(k, i);
    }
  });
  const groups = new Map();
  items.forEach((p, i) => { const r = find(i); groups.set(r, (groups.get(r) || []).concat(p)); });
  const rank = (st) => STAGES.indexOf(st);
  return [...groups.values()].map((g) => {
    const out = { ...g[0], sources: [], types: [], flags: [], niches: [], records: g.length };
    for(const p of g){
      for(const k of ['email', 'phone', 'instagram', 'profileUrl', 'town', 'state']) if(!out[k] && p[k]) out[k] = p[k];
      if(p.name.length > out.name.length && out.name === 'Unnamed') out.name = p.name;
      if(rank(p.stage) > rank(out.stage) && p.stage !== 'declined') out.stage = p.stage;
      if(p.score > out.score){ out.score = p.score; out.bestMatch = p.bestMatch; }
      if(String(p.lastContactAt) > String(out.lastContactAt || '')) out.lastContactAt = p.lastContactAt;
      out.consent = out.consent || p.consent; out.verified = out.verified || p.verified; out.shareLocation = out.shareLocation || p.shareLocation;
      out.sources.push(...p.sources); out.types.push(...p.types); out.flags.push(...p.flags); out.niches.push(...p.niches);
    }
    out.types = [...new Set(out.types)]; out.niches = [...new Set(out.niches)].slice(0, 8);
    out.flags = [...new Set(out.flags.filter((f) => !/same (email|profile) as another/.test(f)))];
    if(g.length > 1) out.flags.unshift(g.length + ' records merged');
    if(!out.town) out.flags.push('location not set');
    out.type = out.types[0];
    out.completeness = completeness(out);
    out.nextAction = nextAction(out);
    return out;
  }).sort((a, b) => b.score - a.score || b.completeness - a.completeness || a.name.localeCompare(b.name));
}

export function completeness(p){
  const checks = [p.name && p.name !== 'Unnamed', p.email, phoneKey(p.phone), p.instagram || p.profileUrl, p.town, p.niches && p.niches.length, p.consent];
  return Math.round(100 * checks.filter(Boolean).length / checks.length);
}

export function nextAction(p){
  if(!p.email && !phoneKey(p.phone)) return 'Find a contact';
  if(['new', 'contacted', 'shortlisted'].includes(p.stage) && p.bestMatch && p.bestMatch.verdict === 'send') return 'Send the offer';
  if(p.stage === 'new') return p.town ? 'Say hello' : 'Ask for home town';
  if(p.stage === 'offered') return 'Follow up on offer';
  if(p.stage === 'active') return 'Share next opportunity';
  return 'Check in';
}

/* ---- auto-inform policy ----------------------------------------------------- */
const REVIEW_KINDS = new Set(['payment', 'refund', 'payout', 'dispute', 'complaint', 'contract', 'legal', 'cancellation']);
export const PERFECT_SCORE = 85;
export function messageTier(person = {}, msg = {}){
  const reachable = !!(person.email || phoneKey(person.phone));
  if(!person.consent || !reachable || person.stage === 'declined') return 'skip';
  if(REVIEW_KINDS.has(msg.kind) || Number(msg.amount) > 0 || (msg.needsIdentity && !person.verified)) return 'review';
  if(msg.kind === 'match' && Number(msg.score) >= PERFECT_SCORE && msg.verdict === 'send') return 'perfect';
  return 'routine';
}

/* ---- KPIs -------------------------------------------------------------------- */
export const WORTH_ASSUMPTIONS = Object.freeze({ perContact: 150, perVerified: 1500, perActive: 5000,
  note: 'Internal estimate only: what it would roughly cost to rebuild this network by paid lead generation (₹150 a reachable contact, ₹1,500 a verified partner, ₹5,000 an active one). Not a valuation.' });

export function peopleKpis(people = [], rawCount = people.length, a = WORTH_ASSUMPTIONS){
  const by = (f) => people.filter(f).length;
  const reachable = by((p) => p.email || phoneKey(p.phone)), verified = by((p) => p.verified), active = by((p) => p.stage === 'active');
  const types = {}; people.forEach((p) => p.types.forEach((t) => { types[t] = (types[t] || 0) + 1; }));
  const funnel = STAGES.map((st) => [st, by((p) => p.stage === st)]);
  return {
    people: people.length, records: rawCount, merged: rawCount - people.length, types, funnel,
    reachable, optedIn: by((p) => p.consent), verified, active, missingTown: by((p) => !p.town),
    readyOffers: by((p) => p.bestMatch && p.bestMatch.verdict === 'send' && p.stage === 'new'),
    avgCompleteness: people.length ? Math.round(people.reduce((n, p) => n + p.completeness, 0) / people.length) : 0,
    dataWorth: reachable * a.perContact + verified * a.perVerified + active * a.perActive, worthNote: a.note,
  };
}

export function toCsv(people = []){
  const cols = ['name', 'types', 'stage', 'town', 'state', 'email', 'phone', 'instagram', 'profileUrl', 'niches', 'consent', 'verified', 'completeness', 'score', 'nextAction', 'flags'];
  const cell = (v) => { let t = Array.isArray(v) ? v.join('; ') : String(v == null ? '' : v); if(/^[=+\-@]/.test(t)) t = "'" + t; return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
  return [cols.join(',')].concat(people.map((p) => cols.map((c) => cell(p[c])).join(','))).join('\n');
}
