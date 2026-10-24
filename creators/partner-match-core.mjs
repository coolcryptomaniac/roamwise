/* Explainable partner-to-stay matching for every non-stay role (creator, painter, music artist, transport provider, college, yoga teacher).
   Pure functions, no network. Every score is a list of visible reasons, never a hidden number: the output says WHY a stay fits,
   what is unknown, and that both sides must approve. It does not predict sales or enquiries and never moves money. */
export const ROLES = ['creator', 'painter', 'music', 'transport', 'college', 'yoga'];
export const MIN_SCORE = 50;

const txt = (p) => [p.name, p.hook, p.area, p.zone, (p.badges || []).join(' '), p.cat].filter(Boolean).join(' ').toLowerCase();
const has = (s, re) => re.test(s);
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim();

/* What a stay can host, read only from fields the listing already has. */
export function stayTraits(p = {}) {
  const t = txt(p);
  return {
    id: p.id, name: p.name, town: p.zone || '', area: p.area || '',
    social: has(t, /cafe|restaurant|lounge|dining|bar|garden|terrace|gaming/),
    quiet: has(t, /quiet|calm|wellness|yoga|himalayan|peace|spiritual|retreat|tranquil|nature/),
    space: has(t, /garden|terrace|lawn|hall|courtyard|deck|lounge|jungle|forest/),
    scenic: has(t, /view|mountain|snow|valley|himalaya|sunset|garden|jungle/),
    nomad: !!(p.nomad && p.nomad.enabled),
    photos: Array.isArray(p.photos) ? p.photos.length : 0,
    whatsapp: p.bookingMode === 'whatsapp' && !!p.bookingWhatsapp,
    signed: p.verified === 'signed',
  };
}

function townFit(want, s) {
  const w = norm(want); if (!w) return { pts: 0, note: null, unknown: 'No town given, so distance was not scored.' };
  const hay = norm(s.town + ' ' + s.area);
  if (hay.includes(w) || w.includes(norm(s.town))) return { pts: 40, note: `Same area: ${s.town}` };
  return { pts: 0, note: null, unknown: `Not in ${want}.` };
}

const RULES = {
  creator: (s) => [[s.scenic, 20, 'Scenic setting that films well'], [s.photos >= 3, 15, 'Photo-ready listing'], [s.nomad, 10, 'Open to longer stays'], [s.social, 10, 'Cafe or common area for content']],
  painter: (s) => [[s.social, 30, 'Cafe, lounge or dining space with wall area'], [s.quiet, 15, 'Calm, spiritual or wellness setting suits sacred art'], [s.scenic, 10, 'Guests who linger and look'], [s.signed, 5, 'Signed RoamWise partner']],
  music: (s) => [[s.social, 30, 'Cafe, lounge or garden where music fits'], [s.scenic, 15, 'Setting that suits live or ambient sets'], [s.photos >= 3, 10, 'Venue photos ready for an announcement'], [s.nomad, 5, 'Long-stay guests, repeat audience']],
  transport: (s) => [[s.whatsapp, 25, 'Direct WhatsApp contact for pickups'], [s.signed, 15, 'Signed partner with agreed terms'], [s.scenic, 5, 'Hill or remote setting where pickups are needed']],
  college: (s) => [[s.nomad, 20, 'Takes long stays, useful for programmes'], [s.social, 15, 'Common space for a group'], [s.scenic, 10, 'Good for retreats and field visits'], [s.signed, 10, 'Signed partner with agreed terms']],
  /* Yoga teacher looking for a place to run a retreat: calm setting, room to practise, views, and long enough stays for a week. */
  yoga: (s) => [[s.quiet, 25, 'Calm, wellness or nature setting that suits a retreat'], [s.space, 20, 'Garden, terrace or lounge that can work as a practice space'], [s.scenic, 10, 'Views that guests come for'], [s.nomad, 10, 'Takes longer stays, useful for week-long retreats'], [s.signed, 5, 'Signed partner with agreed terms']],
};

export function matchStay(role, want = {}, stay) {
  if (!ROLES.includes(role)) throw new Error('unknown role: ' + role);
  const s = stayTraits(stay), reasons = [], unknown = [];
  let score = 0;
  const tf = townFit(want.town, s);
  score += tf.pts; if (tf.note) reasons.push(tf.note); if (tf.unknown) unknown.push(tf.unknown);
  for (const [ok, pts, why] of RULES[role](s)) if (ok) { score += pts; reasons.push(why); }
  const style = norm(want.style);
  if (style && has(txt(stay), new RegExp(style.split(' ').filter((w) => w.length > 3).join('|') || '$^'))) { score += 10; reasons.push('Matches your style words'); }
  return { id: s.id, name: s.name, town: s.town, score: Math.min(100, score), reasons, unknown, needsApproval: true };
}

/* Returns only genuine fits. An empty list is a correct answer: it is better to say "no strong match yet" than to force one. */
export function matchStays(role, want, stays, limit = 3) {
  return (Array.isArray(stays) ? stays : []).filter((p) => p && p.listingReady !== false && p.verified !== 'listed')
    .map((p) => matchStay(role, want, p)).filter((m) => m.score >= MIN_SCORE).sort((a, b) => b.score - a.score).slice(0, limit);
}
