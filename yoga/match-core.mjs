// Introduction-only yoga matching. Unknown facts never imply yoga readiness.
const text = (v, n = 180) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const number = v => v !== '' && v != null && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : null;
const list = v => [...new Set((Array.isArray(v) ? v : String(v || '').split(',')).map(x => text(x).toLowerCase()).filter(Boolean))];
const models = v => list(v).filter(x => ['paid', 'barter', 'hybrid'].includes(x));
const date = v => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return '';
  const d = new Date(v + 'T00:00:00Z');
  return Number.isFinite(+d) && d.toISOString().slice(0, 10) === v ? v : '';
};
export function cleanBrief(raw = {}) {
  const role = ['teacher', 'property', 'both'].includes(raw.role) ? raw.role : 'teacher';
  const from = date(raw.from), to = date(raw.to);
  if (from && to && from > to) throw Error('End date must be on or after the start date.');
  const group = number(raw.group);
  if (group == null || !Number.isInteger(group) || group < 1 || group > 60) throw Error('Choose a group size from 1 to 60.');
  return {
    role, name: text(raw.name, 100), place: text(raw.place, 100), from, to, group,
    budget: number(raw.budget), styles: list(raw.styles), models: models(raw.models),
    propertyName: text(raw.propertyName, 120), propertyUrl: text(raw.propertyUrl, 400),
    quiet: raw.quiet !== false, optional: raw.optional !== false, noFilming: raw.noFilming !== false,
    note: text(raw.note, 600)
  };
}
export function routesFor(role) {
  return role === 'both' ? ['find_property', 'find_teacher', 'offer_own_property'] : role === 'property' ? ['find_teacher'] : ['find_property'];
}
export function scoreYogaMatch(teacher, property) {
  const blockers = [], missing = [], reasons = [];
  if (teacher.ownerId && property.ownerId && teacher.ownerId === property.ownerId || teacher.ownPropertyId && teacher.ownPropertyId === property.id) blockers.push('same_owner');
  if (teacher.approved !== true || property.approved !== true) blockers.push('review_required');
  if (teacher.consentToMatch !== true || property.consentToMatch !== true) blockers.push('matching_consent_required');
  const compare = (key, label, predicate) => {
    if (teacher[key] == null || property[key] == null || teacher[key] === '' || property[key] === '') missing.push(label);
    else if (!predicate(teacher[key], property[key])) blockers.push(label + '_mismatch');
    else reasons.push(label);
  };
  compare('place', 'location', (a, b) => text(a).toLowerCase() === text(b).toLowerCase());
  const group = number(teacher.group), capacity = number(property.capacity);
  if (group == null || group < 1 || capacity == null || capacity < 1) missing.push('capacity');
  else if (group > capacity) blockers.push('capacity_mismatch'); else reasons.push('capacity');
  if (![teacher.from, teacher.to, property.from, property.to].every(date)) missing.push('dates');
  else if (teacher.from > teacher.to || property.from > property.to || teacher.to < property.from || property.to < teacher.from) blockers.push('dates_mismatch');
  else reasons.push('dates');
  const shared = models(teacher.models).filter(x => models(property.models).includes(x));
  if (!models(teacher.models).length || !models(property.models).length) missing.push('terms');
  else if (!shared.length) blockers.push('terms_mismatch'); else reasons.push('terms');
  const budget = number(teacher.budget), rate = number(property.rate);
  if (shared.includes('paid')) {
    if (budget == null || rate == null) missing.push('budget');
    else if (rate > budget && shared.length === 1) blockers.push('budget_mismatch');
    else if (rate <= budget) reasons.push('budget');
  }
  for (const key of ['quiet', 'optional', 'noFilming']) {
    if (teacher[key] === true && property[key] !== true) (property[key] === false ? blockers : missing).push(key);
  }
  if (property.yogaSpaceReviewed !== true) missing.push('practice_space_review');
  const eligible = blockers.length === 0 && missing.length === 0;
  return { eligible, status: blockers.length ? 'blocked' : missing.length ? 'needs_confirmation' : 'possible_introduction', blockers, missing, reasons, score: eligible ? reasons.length : 0 };
}
export function rankYogaMatches(teacher, properties = []) {
  return properties.map(property => ({ property, ...scoreYogaMatch(teacher, property) })).filter(r => r.eligible).sort((a, b) => b.score - a.score);
}
export function introductionText(raw, candidate = '') {
  const b = cleanBrief(raw);
  return [
    'RoamWise Yoga Match — introduction request (not a booking)',
    'Name: ' + b.name, 'Role: ' + b.role, 'Requests: ' + routesFor(b.role).join(', '),
    'Town: ' + b.place, 'Dates: ' + (b.from || 'to discuss') + ' to ' + (b.to || 'to discuss'),
    'Group: ' + b.group, 'Yoga styles: ' + (b.styles.join(', ') || 'to discuss'),
    'Terms: ' + (b.models.join(', ') || 'to discuss'),
    'Total venue budget INR: ' + (b.budget ?? 'to discuss'),
    'Preferences: ' + [b.quiet && 'quiet setting', b.optional && 'participation optional; no judgement', b.noFilming && 'no filming or touch adjustments without separate consent'].filter(Boolean).join('; '),
    candidate && 'Property to enquire about (yoga suitability not confirmed): ' + text(candidate),
    b.role === 'both' && 'Own property: ' + (b.propertyName || 'details to follow') + ' ' + b.propertyUrl,
    'Notes: ' + b.note,
    'I consent to RoamWise reviewing this brief and contacting me about matching. Ask before sharing my contact details with another party.',
    'Both parties must agree dates, space, teaching scope, costs and cancellation terms. No payment or booking authorised.'
  ].filter(Boolean).join('\n');
}
