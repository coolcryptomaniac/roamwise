const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const G = require('../features/finance-tax/gst-rules.js');

test('room slabs: exempt, 5% no credit, 18% with credit, judged per room per night', () => {
  assert.equal(G.stayRuleFor(999).id, 'stay_exempt');
  assert.equal(G.stayRuleFor(1000).id, 'stay_standard');
  assert.equal(G.stayRuleFor(7500).id, 'stay_standard');
  assert.equal(G.stayRuleFor(7501).id, 'stay_premium');
  // 3 nights x 2 rooms at 6,000 is judged on 6,000, not 36,000
  const s = G.stay({ nightlyValue: 6000, nights: 3, rooms: 2, registered: true });
  assert.equal(s.base, 36000); assert.equal(s.rateBps, 500); assert.equal(s.tax, 1800); assert.equal(s.itc, 'none'); assert.equal(s.payableBy, 'supplier');
  const p = G.stay({ nightlyValue: 12000, nights: 1, rooms: 1, registered: true });
  assert.equal(p.rateBps, 1800); assert.equal(p.tax, 2160); assert.equal(p.itc, 'full');
});

test('small unregistered homestay charges no GST unless sold through a section 9(5) operator', () => {
  const direct = G.stay({ nightlyValue: 4000, nights: 2, rooms: 1 });
  assert.equal(direct.tax, 0); assert.equal(direct.payableBy, 'none'); assert.match(direct.reason, /below the registration threshold/);
  const eco = G.stay({ nightlyValue: 4000, nights: 2, rooms: 1, viaEco: true });
  assert.equal(eco.tax, 400); assert.equal(eco.payableBy, 'eco');
  assert.equal(G.stay({ nightlyValue: 500, nights: 2, rooms: 1, registered: true }).tax, 0); // exempt band
});

test('own fee, agent commission and tour packages', () => {
  assert.equal(G.service('platform_fee', 1000, {}).tax, 0);                    // not registered: nothing charged
  assert.equal(G.service('platform_fee', 1000, { registered: true }).tax, 180);
  assert.equal(G.service('platform_fee', 1180, { registered: true, inclusive: true }).base, 1000);
  assert.equal(G.service('agent_commission', 2500, { registered: true }).tax, 450);
  assert.equal(G.service('tour_package', 20000, { registered: true }).tax, 1000);
  assert.equal(G.service('tour_package', 20000, { registered: true, option: 'with_itc' }).tax, 3600);
  assert.equal(G.service('cab', 3000).tax, 150);                               // driver-owner may charge without registration logic here
  assert.equal(G.service('cab', 3000, { option: 'with_itc' }).tax, 540);
  assert.equal(G.service('air_economy', 10000).tax, 500);
  assert.equal(G.service('air_other', 10000).tax, 1800);
  assert.equal(G.service('nonsense', 10).ok, false);
});

test('rounding never drifts and bad input is safe', () => {
  for (const amt of [1, 7, 99, 12345, 99999]) {
    const s = G.split(amt, 1800, false); assert.equal(s.total, s.base + s.tax);
    const i = G.split(amt, 1800, true); assert.equal(i.base + i.tax, amt);
  }
  assert.equal(G.split(-5, 1800).total, 0);
  assert.equal(G.split('abc', 1800).total, 0);
  assert.equal(G.stay({}).total, 0);
});

test('every rule is dated, sourced and honestly labelled', () => {
  const ids = new Set();
  for (const r of G.RULES) {
    assert.ok(!ids.has(r.id), 'duplicate ' + r.id); ids.add(r.id);
    assert.match(r.effectiveFrom, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(['primary', 'secondary', 'conflicting'].includes(r.confidence), r.id);
    assert.ok(r.sources.length >= 1 && r.sources.every((u) => /^https:\/\//.test(u)), r.id);
    assert.ok(r.note && r.note.length > 10, r.id);
    if (r.confidence === 'conflicting') assert.equal(r.rateBps, null, 'a conflicting rule must not carry a rate: ' + r.id);
  }
  // nothing may be called "primary" unless it cites a government document
  for (const r of G.RULES.filter((x) => x.confidence === 'primary')) assert.ok(r.sources.some((u) => /pib\.gov\.in|gst\.gov\.in|cbic|gstcouncil/.test(u)), r.id);
});

test('yearly review status', () => {
  assert.equal(G.reviewStatus('2026-10-08').state, 'ok');
  assert.equal(G.reviewStatus('2027-09-20').state, 'due_soon');
  assert.equal(G.reviewStatus('2027-10-08').state, 'overdue');
  assert.equal(G.reviewStatus('2027-10-08').dueOn, '2027-10-07');
  assert.equal(G.reviewStatus('2026-10-08').caSigned, false);
  assert.ok(G.reviewStatus('2026-10-08').unverified.includes('stay_slab_basis'));
});

test('other code stays in step with the table', async () => {
  const ledger = await import('../worker/lib/stay-ledger-core.js');
  assert.equal(ledger.DEFAULT_GST_PCT * 100, G.rule('platform_fee').rateBps);
  const m = await import('../creators/match-core.mjs');
  assert.equal(m.PLATFORM_FEE_GST_BPS, G.rule('platform_fee').rateBps);
  assert.equal(m.quoteCollaboration({ role: 'property', maxCash: 10000 }, {}).platformFeeGst >= 0, true);
});

test('stay quote adds the tax view without changing existing numbers', () => {
  const vm = require('node:vm');
  const ctx = vm.createContext({ RWGst: G, Math, Number, isFinite, Object });
  vm.runInContext(fs.readFileSync(__dirname + '/../js/booking/stay-quote.js', 'utf8') + '\nthis.q=rwStayQuote;', ctx);
  const plain = ctx.q({ rate: 5000, nights: 2, rooms: 1, policy: { advancePct: 20 } });
  assert.equal(plain.total, 10000); assert.equal(plain.gst, null); assert.equal(plain.totalWithTax, 10000); assert.equal(plain.advance, 2000);
  const reg = ctx.q({ rate: 5000, nights: 2, rooms: 1, policy: { advancePct: 20 }, gstRegistered: true });
  assert.equal(reg.total, 10000); assert.equal(reg.advance, 2000); assert.equal(reg.gst.tax, 500); assert.equal(reg.totalWithTax, 10500);
});

test('lists accounts whose GST looks stale (informational)', () => {
  const src = fs.readFileSync(__dirname + '/../finance-data.js', 'utf8');
  const non18 = [...src.matchAll(/(rev_\w+):\s*\{[^}]*gst:'(\d+)'/g)].filter((m) => m[2] !== '18').map((m) => m[1] + '=' + m[2]);
  assert.deepEqual(non18, ['rev_merch=12']); // 12% slab was largely removed on 22 Sep 2025; confirm goods rate at the review
});
