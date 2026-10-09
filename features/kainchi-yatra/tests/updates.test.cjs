const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core/node.cjs');
const now = Date.parse('2026-10-09T08:00:00Z');
const item = { title: 'Kainchi road update', url: 'https://nainital.nic.in/notice/test/', publishedAt: '2026-10-09T05:00:00Z', kind: 'official' };
function normalize(items, extra = {}) { return core.updates.normalize({ version: 1, items, sources: [], ...extra }, now); }
test('untrusted links, invalid dates and future records are discarded', () => {
  assert.equal(normalize([{ ...item, url: 'javascript:alert(1)' }, { ...item, publishedAt: '2027-01-01T00:00:00Z' }, { ...item, publishedAt: null }]).items.length, 0);
  assert.equal(core.updates.safeURL('https://user:secret@example.com/'), '');
  assert.throws(() => normalize(null));
});
test('only dated allowlisted government URLs receive official classification', () => {
  assert.equal(normalize([item]).items[0].kind, 'official');
  assert.equal(normalize([{ ...item, url: 'https://nainital.nic.in.evil.example/notice/' }]).items[0].kind, 'news');
  assert.equal(normalize([{ ...item, url: 'https://news.google.com/test' }]).items[0].kind, 'news');
});
test('old headlines remain historical and missing or future checks are stale', () => {
  assert.equal(normalize([{ ...item, publishedAt: '2026-10-03T10:00:00Z' }]).items[0].recent, false);
  assert.equal(core.updates.stale(null, now), true);
  assert.equal(core.updates.stale('2026-10-10T10:00:00Z', now), true);
  assert.equal(core.updates.stale('2026-10-08T01:00:00Z', now), true);
  assert.equal(core.updates.stale('2026-10-09T05:00:00Z', now), false);
});
test('duplicate URLs cannot inflate the headline count', () => {
  assert.equal(normalize([item, item]).items.length, 1);
});
test('arrival date bounds follow India midnight rather than UTC midnight', () => {
  const instant = '2026-10-09T20:00:00Z';
  assert.equal(core.istDate(instant), '2026-10-10');
  const last = core.addDays('2026-10-10', core.config.maxAdvanceDays);
  const input = { date: last, hour: '8', leader: 'Mohit Pandey', size: '2', vehicle: '' };
  assert.equal(core.makePass(input, instant).date, last);
  assert.throws(() => core.makePass({ ...input, date: '2026-10-09' }, instant));
});
test('temple dates roll annually while 2026 lunar festival dates expire', () => {
  const dates = core.importantDates('2026-10-09');
  assert.equal(dates[0].date, '2026-10-20');
  assert.equal(dates.find(x => x.id === 'foundation').date, '2027-06-15');
  assert.equal(dates.find(x => x.id === 'siddhi').date, '2026-12-28');
  assert.equal(core.importantDates('2027-01-01').some(x => x.kind === 'festival'), false);
  assert.equal(core.importantDates('2026-12-28').find(x => x.id === 'siddhi').days, 0);
});
