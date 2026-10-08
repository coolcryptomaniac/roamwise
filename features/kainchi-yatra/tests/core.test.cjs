const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core/node.cjs');
const NOW = '2026-10-08T06:00:00.000Z';
test('calendar: weekday normal, long weekend high, never labels a holiday outside the block', () => {
  assert.equal(core.classify('2026-10-06').level, 'normal');
  const g = core.classify('2026-10-03');
  assert.equal(g.level, 'high');
  assert.ok(g.reasons.some(r => r.key === 'r_longweekend'));
  assert.throws(() => core.classify('nonsense'));
});
test('calendar: foundation day and declared peaks are peak', () => {
  assert.equal(core.classify('2027-06-15', core.peaks).level !== 'normal', true);
  const peaks = Object.assign({}, core.peaks, { declaredPeaks: ['2026-11-01'] });
  const r = core.classify('2026-11-01', peaks);
  assert.equal(r.level, 'peak');
});
test('slots: no invented capacity', () => {
  assert.equal(core.capacityFor('2026-10-20', 8), null);
  assert.equal(core.slotsFor('2026-10-20').length, core.config.lastHour - core.config.firstHour + 1);
});
test('pass: code shape, advisory kind, bounds', () => {
  const p = core.makePass({ date: '2026-10-20', hour: '8', leader: 'Asha', size: '4', vehicle: '' }, NOW);
  assert.match(p.code, /^KDY-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
  assert.equal(p.kind, 'advisory');
  assert.throws(() => core.makePass({ date: '2026-10-20', hour: '3', leader: 'Asha', size: '1' }, NOW), e => e.key === 'e_hour');
  assert.throws(() => core.makePass({ date: '2026-10-20', hour: '8', leader: 'Asha', size: '61' }, NOW), e => e.key === 'e_size');
  assert.throws(() => core.makePass({ date: '2020-01-01', hour: '8', leader: 'Asha', size: '1' }, NOW), e => e.key === 'e_date');
});
test('pass: codes differ and stored data is validated', () => {
  const a = core.newCode(), b = core.newCode();
  assert.notEqual(a, b);
  assert.deepEqual(core.parseStoredPasses('not json'), []);
  assert.deepEqual(core.parseStoredPasses(JSON.stringify([{ code: 'bad' }])), []);
});
test('rates: empty by default; bad cards are dropped', () => {
  assert.deepEqual(core.normalizeRates(core.rateCardsRaw), []);
  assert.deepEqual(core.normalizeRates([{ route: 'x' }]), []);
});
test('reports: composed locally, fallback email, emergency only for ambulance', () => {
  const r = core.buildReport({ category: 'taxi', place: 'Bhowali', when: '2026-10-08', amount: '3000', official: '2000', text: 'Driver asked for much more than posted.' }, NOW);
  assert.match(r.mailto, /^mailto:support@roamwise\.co\.in\?/);
  assert.equal(r.toFallback, true);
  assert.equal(r.whatsapp, null);
  assert.equal(r.emergency, false);
  assert.equal(core.buildReport({ category: 'ambulance', place: 'Bhowali road', text: 'Ambulance stuck in traffic jam.' }, NOW).emergency, true);
  assert.throws(() => core.buildReport({ category: 'nope', place: 'x', text: 'y' }, NOW), e => e.key === 'e_rep_cat');
  assert.throws(() => core.buildReport({ category: 'taxi', place: 'Bhowali', text: 'short' }, NOW), e => e.key === 'e_rep_text');
});
test('reports: uses district contact when provided', () => {
  const cfg = Object.assign({}, core.config, { districtContact: { name: 'DM Office', email: 'dm@example.gov', whatsapp: '+91 98765 43210' } });
  const r = core.buildReport({ category: 'bribe', place: 'Check post', text: 'Asked for money to pass the barrier.' }, NOW, cfg);
  assert.match(r.mailto, /^mailto:dm@example\.gov/);
  assert.match(r.whatsapp, /wa\.me\/919876543210/);
});
test('i18n: Hindi has every English key, falls back otherwise', () => {
  const en = Object.keys(core.strings.en), hi = Object.keys(core.strings.hi);
  assert.deepEqual(en.filter(k => !hi.includes(k)), []);
  assert.equal(core.t('xx', 'back'), core.strings.en.back);
  assert.equal(core.t('en', 'plan_hist', { from: 'a', to: 'b', a: '1', b: '2' }).includes('{'), false);
});
test('observed event figures match the research record', () => {
  assert.deepEqual(core.peaks.observed[0].outsideVehiclesPerDay, [101840, 93197, 90077]);
});
