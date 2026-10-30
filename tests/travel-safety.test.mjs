// Uttarakhand travel-safety pages + advisory alerts: pure logic tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as core from '../worker/lib/advisory-alerts-core.js';

const require = createRequire(import.meta.url);

function browserSandbox(files) {
  const sb = { console, URL, URLSearchParams };
  sb.window = sb;
  vm.createContext(sb);
  for (const f of files) vm.runInContext(fs.readFileSync(f, 'utf8'), sb, { filename: f });
  return sb;
}
const SB = browserSandbox(['features/travel-safety/data/places.js', 'features/travel-safety/data/rules.js', 'conditions-data.js',
  'js/booking/mountain-conditions.js', 'features/travel-safety/core/checker.js', 'features/travel-safety/core/scam.js']);
const C = SB.RWTravelChecker;
const S = SB.RWScamCheck;
const ids = (list) => Array.from(list, (r) => r.id);

test('rules: every rule has a source, https official links and a known kind/status', () => {
  for (const r of SB.RW_UK_RULES) {
    assert.match(r.source.url, /^https:\/\//, r.id);
    assert.match(r.checked, /^20\d\d-\d\d-\d\d$/, r.id);
    assert.ok(['must', 'know', 'safety'].includes(r.kind), r.id);
    assert.ok(['in-force', 'draft', 'seasonal', 'info'].includes(r.status), r.id);
    for (const l of r.links) assert.ok(/^https:\/\//.test(l.url) || /^\/[a-z]/.test(l.url), r.id + ' ' + l.url);
    for (const l of r.links.filter((x) => x.official)) assert.match(l.url, /^https:\/\/([a-z0-9-]+\.)*(gov\.in|nic\.in|irctc\.co\.in|uttarakhandtraffic\.com|gmvnonline\.com)\//, l.url);
  }
});

test('checker: places, activities and months pick the right rules', () => {
  const r = C.rulesFor({ places: ['kainchi', 'adi kailash'], activities: ['car-outside'], date: '2026-11-05' }, '2026-10-30');
  assert.deepEqual(ids(r.must).sort(), ['adi-kailash-ilp', 'green-cess', 'kainchi-crowd-rules']);
  assert.ok(ids(r.safety).includes('emergency-numbers'));
  assert.ok(!ids(r.safety).includes('monsoon-roads'), 'no monsoon note in November');
  const k = C.rulesFor({ places: ['kedarnath'], date: '2026-12-10' }, '2026-10-30');
  assert.ok(ids(k.must).includes('char-dham-registration') && ids(k.must).includes('kedarnath-helicopter'));
  assert.ok(ids(k.know).includes('winter-shrines'));
  const m = C.rulesFor({ places: ['almora'], date: '2026-08-01' }, '2026-10-30');
  assert.deepEqual(ids(m.must), []);
  assert.ok(ids(m.safety).includes('monsoon-roads'));
  const stale = C.rulesFor({ places: ['mussoorie'] }, '2027-02-01');
  assert.equal(stale.must[0].stale, true);
});

test('checker: regions, follow links and advisories', () => {
  assert.deepEqual([...C.regionsFor('kainchi | adi kailash')].sort(), ['nainital', 'pithoragarh']);
  assert.deepEqual([...C.regionsFor('char dham')].sort(), ['chamoli', 'rudraprayag', 'uttarkashi']);
  assert.equal(C.followUrl(['almora', 'evil"><x', 'nainital', 'almora']), '/?follow=almora,nainital#alerts');
  assert.equal(C.followUrl([]), '/');
  const act = C.activeAdvisories('2026-10-30');
  assert.ok(act.some((a) => a.id === 'kainchi-crowds-autumn-2026' && a.regions.includes('nainital')));
  assert.ok(!act.some((a) => a.id === 'himalayan-car-rally-2026'), 'rally not active yet');
  assert.ok(C.upcomingAdvisories('2026-10-30', 30).some((a) => a.id === 'himalayan-car-rally-2026'));
  assert.equal(act[act.length - 1].uttarakhand, false, 'other Himalaya listed last');
  const adv = C.advisoriesFor({ places: ['kainchi'], date: '2026-11-01' });
  assert.ok(adv.some((a) => a.id === 'kainchi-crowds-autumn-2026'));
  const txt = C.checklistText({ places: ['Kainchi Dham'], date: '2026-11-01' }, C.rulesFor({ places: ['kainchi'] }, '2026-10-30'), adv);
  assert.match(txt, /Must do/);
  assert.match(txt, /roamwise\.co\.in\/uttarakhand-travel-rules/);
});

test('scam checker: official, lookalike, free hosts, UPI and phone', () => {
  assert.equal(S.classify('https://heliyatra.irctc.co.in/booking', 'helicopter').verdict, 'official');
  assert.equal(S.classify('www.registrationandtouristcare.uk.gov.in', 'chardham').verdict, 'official');
  assert.equal(S.classify('pithoragarh.nic.in', 'other').verdict, 'official');
  assert.equal(S.classify('roamwise.co.in/stays/almora/', 'stay').verdict, 'roamwise');
  assert.equal(S.classify('kedarnath-heli-booking.in', 'helicopter').verdict, 'high-risk');
  assert.equal(S.classify('irctc-heliyatra.com', 'other').verdict, 'high-risk');
  assert.equal(S.classify('irctc.co.in.evil.com', 'other').verdict, 'high-risk');
  assert.equal(S.classify('gmvn-rest-house.blogspot.com', 'stay').verdict, 'high-risk');
  assert.equal(S.classify('http://myhomestay.in', 'stay').verdict, 'caution');
  assert.equal(S.classify('sunrisehomestay.in', 'stay').verdict, 'unknown');
  assert.equal(S.classify('ramesh@okaxis', 'helicopter').verdict, 'high-risk');
  assert.equal(S.classify('ramesh@okaxis', 'stay').verdict, 'caution');
  assert.equal(S.classify('+91 98765 43210', 'helicopter').verdict, 'high-risk');
  assert.equal(S.classify('hello there', 'stay').verdict, 'unknown');
  assert.equal(S.classify('', 'stay').type, 'empty');
});

test('conditions.json is current and every advisory has a region list', () => {
  const j = JSON.parse(fs.readFileSync('data/conditions.json', 'utf8'));
  const { RW_CONDITIONS } = require('../conditions-data.js');
  assert.equal(j.advisories.length, RW_CONDITIONS.length);
  const feed = core.parseFeed(j);
  assert.ok(feed && feed.regions.length >= 10);
  assert.deepEqual(feed.advisories.find((a) => a.id === 'kainchi-crowds-autumn-2026').regions, ['nainital']);
  assert.deepEqual(feed.advisories.find((a) => a.id === 'lahaul-snow-oct-2026').regions, []);
  assert.equal(core.parseFeed({ version: 2 }), null);
});

/* Manual (curated) advisories only, so the daily auto-scout additions cannot change these expectations. */
const RAW = JSON.parse(fs.readFileSync('data/conditions.json', 'utf8'));
const FEED = core.parseFeed({ ...RAW, advisories: RAW.advisories.filter((a) => !a.auto) });

test('alerts: bookings in window and in an affected region get the advisory', () => {
  const today = '2026-10-30';
  const active = core.activeAdvisories(FEED, today);
  assert.ok(!active.some((a) => a.id === 'lahaul-snow-oct-2026'), 'only Uttarakhand advisories alert');
  const near = { id: 'b1', status: 'confirmed', zone: 'Nainital', area: 'Bhowali', property: 'X', checkIn: '2026-11-07', checkOut: '2026-11-09' };
  assert.equal(core.bookingInWindow(near, today), true);
  assert.deepEqual(core.advisoriesForBooking(FEED, active, near).map((a) => a.id), ['kainchi-crowds-autumn-2026']);
  assert.equal(core.bookingInWindow({ ...near, status: 'declined' }, today), false);
  assert.equal(core.bookingInWindow({ ...near, checkIn: '2026-12-30', checkOut: '2027-01-02' }, today), false);
  assert.equal(core.bookingInWindow({ ...near, checkIn: '2026-10-20', checkOut: '2026-10-22' }, today), false);
  const goa = { ...near, zone: 'Goa', area: 'Candolim', property: 'Y' };
  assert.deepEqual(core.advisoriesForBooking(FEED, active, goa), []);
  const kedar = { ...near, zone: 'Guptkashi', area: 'Guptkashi', checkIn: '2026-11-15', checkOut: '2026-11-17' };
  assert.ok(core.advisoriesForBooking(FEED, active, kedar).some((a) => a.id === 'kedarnath-close-2026'), 'closure still matters after its date');
  assert.deepEqual(core.advisoriesForFollower(active, ['pithoragarh']).map((a) => a.id), ['adi-kailash-season-end-2026']);
});

test('alerts: messages are escaped, capped and carry sources', () => {
  const active = core.activeAdvisories(FEED, '2026-10-30');
  const g = core.buildGuestAlert({ guestName: '<b>Asha</b>', property: 'Milan Heights', checkIn: '2026-11-07' }, active);
  assert.ok(g.push.body.length <= 180);
  assert.ok(!g.email.html.includes('<b>Asha'));
  assert.match(g.email.text, /Hi there/);
  assert.ok((g.email.html.match(/Source:/g) || []).length <= core.MAX_PER_MESSAGE);
  const f = core.buildFollowerAlert(['Almora'], active.slice(0, 1));
  assert.match(f.email.text, /unfollow=1/);
  const p = core.buildPartnerAlert('Milan Heights', [{ id: 'b1', ref: 'RW1', checkIn: '2026-11-07', guests: 2 }], active.slice(0, 1));
  assert.match(p.email.subject, /1 guest booking affected/);
  const d = core.buildTeamDigest(FEED, '2026-11-20', { affectedBookings: 2, guests: 1, newLeads: 3 });
  assert.ok(d.lines.some((l) => /himalayan-car-rally-2026/.test(l)), 'expiring item flagged');
  assert.equal(d.stale, true, 'list older than 7 days needs review');
  const s = core.parseAdvisorySettings({ advisoryAlerts: true, maxEmailsPerRun: 500 });
  assert.deepEqual([s.advisoryAlerts, s.partnerAlerts, s.teamDigest, s.maxEmailsPerRun], [true, false, false, 90]);
  const e = core.parseAdvisorySettings({ partnerAlerts: false }, 'guests, partners,digest');
  assert.deepEqual([e.advisoryAlerts, e.partnerAlerts, e.teamDigest], [true, false, true], 'Worker var turns on; a Firestore false wins');
  assert.equal(core.parseAdvisorySettings(null, '').advisoryAlerts, false);
  assert.equal(core.istToday(Date.parse('2026-10-30T20:00:00Z')), '2026-10-31');
});

test('app hand-off: follow links are parsed to known regions only', () => {
  const sb = { console, URLSearchParams };
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync('js/core/alert-follow.js', 'utf8'), sb);
  assert.deepEqual(JSON.parse(JSON.stringify(sb.rwAlertParse('?follow=almora,ALMORA,mars,nainital'))), { unfollow: false, regions: ['almora', 'nainital'] });
  assert.deepEqual(JSON.parse(JSON.stringify(sb.rwAlertParse('?unfollow=1'))), { unfollow: true, regions: [] });
  assert.equal(sb.rwAlertParse('?follow=mars'), null);
  const places = require('../features/travel-safety/data/places.js');
  assert.deepEqual([...sb.RW_ALERT_REGIONS].sort(), places.RW_UK_REGIONS.map((r) => r.id).sort());
});

test('pages: strict CSP, no inline handlers or styles, scripts exist', () => {
  for (const p of ['uttarakhand-travel-rules', 'uttarakhand-road-status', 'booking-safety']) {
    const html = fs.readFileSync(p + '/index.html', 'utf8');
    assert.match(html, /script-src 'self'/);
    assert.doesNotMatch(html, /\son[a-z]+="/, p);
    assert.doesNotMatch(html, /\sstyle="/, p);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://www.roamwise.co.in/${p}/">`));
    for (const m of html.matchAll(/<script src="\/([^"]+)"/g)) assert.ok(fs.existsSync(m[1]), m[1]);
  }
});
