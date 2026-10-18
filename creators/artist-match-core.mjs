const GOALS = new Set(['commission', 'exhibition', 'workshop', 'storytelling']);
export function safeHttps(value) {
  try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; }
}
export function sourceFresh(checkedAt, now = Date.now()) {
  const age = Number(now) - Date.parse(checkedAt);
  return Number.isFinite(age) && age >= -86400000 && age <= 30 * 86400000;
}
export function rankArtistProperties(artist, properties, options = {}, now = Date.now()) {
  const goal = GOALS.has(options.goal) ? options.goal : 'commission';
  return properties.filter(p => safeHttps(p.sourceUrl) && (!options.region || p.state === options.region)).map(p => {
    const reasons = [];
    let score = 15;
    if ((p.models || []).includes(goal)) { score += 30; reasons.push(p.goalNotes[goal]); }
    const shared = (artist.themes || []).filter(t => (p.themes || []).includes(t));
    score += Math.min(25, shared.length * 8);
    if (shared.length) reasons.push('Shared setting: ' + shared.join(', '));
    if (artist.state === p.state) { score += 15; reasons.push('Same state as the studio; exact travel is still to agree.'); }
    if (sourceFresh(p.checkedAt, now)) score += 10;
    else reasons.push('Source needs a fresh check before outreach.');
    if (p.contact.email && p.contact.verified && !p.contact.ambiguous) score += 5;
    return { ...p, score: Math.min(100, score), reasons, goal, needsRefresh: !sourceFresh(p.checkedAt, now) };
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}
export function buildArtBrief(artist, property, options = {}) {
  const labels = { commission: 'a custom artwork commission', exhibition: 'a curated exhibition proposal', workshop: 'a guest painting workshop proposal', storytelling: 'an art-led content collaboration proposal' };
  const goal = GOALS.has(options.goal) ? options.goal : 'commission';
  return [
    `Hello RoamWise, I would like to discuss ${labels[goal]} involving ${artist.name} / ${artist.studio} and ${property.name}.`,
    `Portfolio: ${safeHttps(artist.website)}`, `Property source: ${safeHttps(property.sourceUrl)}`,
    options.notes ? `My brief: ${String(options.notes).trim().slice(0, 1500)}` : '',
    'Please check interest and availability on both sides. Agree dates, scope, artist fee, travel/stay, materials, installation or shipping, content usage, cancellations and payment milestones separately.',
    'This is an enquiry, not a confirmed partnership or booking. Workshops, exhibitions and content appearances are proposals requiring the artist’s agreement.'
  ].filter(Boolean).join('\n\n');
}
