import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PACKAGES, GROUP, priceFor, transportPlan, whatsappLink, OPERATING_MODEL } from '../packages/catalog.mjs';
import { GRID } from '../packages/price-grid.mjs';
import { dayRisk, windowRisk, bestWindows, addDays, dow, NMIMS_SAMPLE } from '../packages/dates-core.mjs';
import { instalmentPlan, POLICY } from '../packages/instalment-core.mjs';

test('price grid is public-safe: prices and vehicle labels only, no costs or margins', () => {
  const raw = readFileSync(new URL('../packages/price-grid.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(raw, /margin|profit|assumption|supplier|subtotal|contingency|"cost/i);
  for (const pkg of Object.values(GRID)) for (const variant of Object.values(pkg)) for (const row of Object.values(variant)) {
    assert.deepEqual(Object.keys(row).sort(), ['local', 'longLeg', 'pricePP', 'rooms', 'totalPP']);
    assert.equal(row.pricePP % 100, 0);
    assert.equal(row.totalPP, Math.round(row.pricePP * 1.05));
  }
});

test('prices exist for every offered group size and the lite option is cheaper', () => {
  for (const id of Object.keys(PACKAGES)) for (let n = GROUP.min; n <= GROUP.max; n++) {
    const full = priceFor(id, n);
    assert.ok(full && full.pricePP > 0, id + n);
    assert.ok(priceFor(id, n, { vehicle: 'cheapest', kit: false }).pricePP <= full.pricePP);
    assert.equal(full.groupTotal, full.totalPP * n);
  }
  assert.equal(priceFor('almora', 3), null);
  assert.equal(GROUP.default, 8);
});

test('only the Almora package is open for booking; Lansdowne waits for its owner agreement', () => {
  assert.equal(PACKAGES.almora.status, 'open');
  assert.equal(PACKAGES.lansdowne.status, 'soon');
  for (const p of Object.values(PACKAGES)) assert.equal(p.itinerary.length, p.days);
});

test('dates: weekends and new year are jams, Tue-Thu in a quiet month are calm', () => {
  assert.equal(dow('2026-11-21'), 6);
  assert.equal(dayRisk('2026-11-21').level, 3);
  assert.equal(dayRisk('2026-11-17').level, 0);
  assert.equal(dayRisk('2026-12-31').level, 3);
  assert.equal(dayRisk('2026-11-08').level, 3);
  assert.ok(dayRisk('2027-01-12').level >= 1);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('best windows avoid weekends and respect lead time, allowed and blackout ranges', () => {
  const today = '2026-10-23';
  const w = bestWindows({ days: 4, fromISO: '2026-11-01', toISO: '2027-03-31', todayISO: today });
  assert.ok(w.length && w.every((x) => x.label === 'calm'));
  assert.ok(w.every((x) => x.start >= addDays(today, 21)));
  const b = bestWindows({ days: 4, fromISO: '2026-11-01', toISO: '2026-12-31', todayISO: today, blackout: [{ from: '2026-11-15', to: '2026-12-10' }] });
  assert.ok(b.every((x) => x.end < '2026-11-15' || x.start > '2026-12-10'));
  const nm = bestWindows({ days: 4, fromISO: '2026-11-01', toISO: '2027-06-30', todayISO: today, allowed: NMIMS_SAMPLE.free });
  assert.ok(nm.length > 0 && nm.every((x) => NMIMS_SAMPLE.free.some((r) => x.start >= r.from && x.end <= r.to)));
});

test('winter vacation is flagged busy with a fog note; March is clear of both', () => {
  const w = windowRisk('2026-12-26', 4);
  assert.equal(w.label, 'busy');
  assert.ok(w.fog);
  assert.equal(windowRisk('2027-03-02', 3).fog, false);
});

test('pay in parts: sums to the total, no interest, last part 14 days before departure', () => {
  const plan = instalmentPlan({ totalPerPerson: 13020, departISO: '2027-04-06', todayISO: '2026-10-23', groupSize: 8 });
  assert.equal(plan.mode, 'parts');
  assert.equal(plan.perPerson.reduce((s, r) => s + r.amount, 0), 13020);
  assert.equal(plan.interestPct, 0);
  assert.equal(plan.perPerson[0].amount, Math.ceil(13020 * POLICY.depositPct / 10) * 10);
  assert.ok(plan.perPerson.length <= POLICY.maxParts + 1);
  assert.equal(plan.perPerson[plan.perPerson.length - 1].due, addDays('2027-04-06', -POLICY.finalDueDaysBefore));
  assert.equal(plan.groupTotal, 13020 * 8);
  assert.ok(plan.perPerson.every((r, i, a) => i === 0 || r.due > a[i - 1].due));
});

test('pay in parts: close departures pay in full, shorter runs get fewer parts', () => {
  assert.equal(instalmentPlan({ totalPerPerson: 9000, departISO: '2026-11-05', todayISO: '2026-10-23' }).mode, 'full');
  const short = instalmentPlan({ totalPerPerson: 9000, departISO: '2026-12-10', todayISO: '2026-10-23' });
  assert.equal(short.mode, 'parts');
  assert.equal(short.perPerson.reduce((s, r) => s + r.amount, 0), 9000);
});

test('transport plan: a leg for every day, student rail legs, advice follows the risk', () => {
  const calm = transportPlan('almora', 8, '2026-11-16');
  assert.equal(calm.legs.length, PACKAGES.almora.days);
  assert.equal(calm.risk.label, 'calm');
  assert.match(calm.studentLegs[0], /Shatabdi/);
  assert.match(calm.legs[0].by, /sumo/i);
  assert.match(calm.legs[1].by, /Tempo/);
  const jam = transportPlan('almora', 8, '2026-12-26');
  assert.equal(jam.risk.label, 'busy');
  assert.match(jam.advice, /Monday to Thursday/);
  assert.equal(transportPlan('lansdowne', 8, '2026-11-17').legs.length, PACKAGES.lansdowne.days);
  assert.equal(transportPlan('goa', 8, '2026-11-17'), null);
});

test('asset light: partners own vehicles, rooms and guides; WhatsApp link is well formed', () => {
  assert.ok(OPERATING_MODEL.partners.driver && OPERATING_MODEL.partners.stay && OPERATING_MODEL.partners.guide);
  const link = whatsappLink({ pkgId: 'almora', n: 8, startISO: '2026-11-16', total: 13020 });
  assert.match(link, /^https:\/\/wa\.me\/919987379730\?text=/);
  assert.match(decodeURIComponent(link), /Almora Food Trail for 8 people starting 2026-11-16/);
});

import { safetyPlan, EMERGENCY } from '../packages/safety-core.mjs';

test('safety plan: dated checklist, honest warnings and a safe Tusk question', () => {
  const calm = safetyPlan({ pkgId: 'almora', n: 8, startISO: '2027-03-09' });
  assert.equal(calm.checks.length, 4);
  assert.match(calm.chatMessage, /112/); assert.equal(EMERGENCY.ambulance, '108');
  assert.match(calm.tuskPrompt, /8 friends/); assert.ok(calm.tuskPrompt.length <= 600); assert.doesNotMatch(calm.tuskPrompt, /[<>]/);
  const winter = safetyPlan({ pkgId: 'almora', n: 8, startISO: '2026-12-26' });
  assert.ok(winter.watch.some((w) => /fog/i.test(w)) && winter.watch.some((w) => /busy/i.test(w)));
  const monsoon = safetyPlan({ pkgId: 'lansdowne', n: 6, startISO: '2027-07-20' });
  assert.ok(monsoon.watch.some((w) => /landslide/i.test(w)));
  assert.equal(safetyPlan({ pkgId: 'nope', n: 8, startISO: '2027-03-09' }), null);
});

test('premium van: dedicated vehicle for every day, priced above the standard plan, capped at 10 guests', () => {
  for (const id of Object.keys(PACKAGES)) {
    for (let n = GROUP.min; n <= 10; n++) {
      const prem = priceFor(id, n, { vehicle: 'premium', kit: true }), std = priceFor(id, n, { vehicle: 'single', kit: true });
      assert.ok(prem && prem.totalPP > std.totalPP, id + ' ' + n);
      assert.match(prem.longLeg, /Premium 12-seat van/);
    }
    assert.equal(priceFor(id, 11, { vehicle: 'premium', kit: true }), null);
  }
});
