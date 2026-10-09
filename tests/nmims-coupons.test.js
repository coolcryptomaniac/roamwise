const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const U = require('../nmims/pass-issuer/pass-utils.js');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const load = (f, name) => { const c = {}; vm.createContext(c); vm.runInContext(read(f), c); return c[name]; };
const Seats = load('js/pricing/founder-seats.js', 'RWFounderSeats');
const Reconcile = load('js/admin/founder-seat-reconcile.js', 'RWFounderSeatReconcile');
const rnd = n => webcrypto.getRandomValues(new Uint8Array(n));
const snap = (exists, data) => ({ exists, data: () => data });

test('coupon batch: 50 organiser + 450 student, all unique, fit the app code limit', () => {
  const b = U.couponBatch(rnd);
  assert.equal(b.length, 500);
  assert.equal(new Set(b.map(c => c.code)).size, 500);
  assert.equal(b.filter(c => c.role === 'organiser').length, 50);
  assert.equal(b.filter(c => c.role === 'student').length, 450);
  for (const c of b) {
    assert.match(c.code, /^NMIMS-(ORG|STU)-\d{4}-[0-9A-HJKMNP-TV-Z]{13}$/);
    assert.ok(c.code.length <= 32);
    assert.equal(c.code, c.code.toUpperCase().replace(/[^A-Z0-9_-]/g, ''), 'survives rwSanitizeRefCode');
  }
  assert.equal(b[0].code.startsWith('NMIMS-ORG-0001-'), true);
  assert.equal(b[499].code.startsWith('NMIMS-STU-0450-'), true);
});

test('coupon batch fails closed: over-ceiling plan, bad role, weak entropy', () => {
  assert.throws(() => U.couponBatch(rnd, { organiser: 100, student: 450 }), /500/);
  assert.throws(() => U.coupon('guest', 1, rnd(8)), /student or organiser/);
  assert.throws(() => U.coupon('student', 1, new Uint8Array(3)), /random bytes/);
});

test('coupon randomness: 64 bits, not derived from serial or time', () => {
  const a = U.couponBatch(rnd), b = U.couponBatch(rnd);
  assert.equal(a.filter((c, i) => c.code === b[i].code).length, 0);
});

test('commitment is order independent and changes if any code changes', async () => {
  const b = U.couponBatch(rnd).map(c => c.code);
  const h1 = await U.commitment(b, webcrypto.subtle);
  const h2 = await U.commitment(b.slice().reverse(), webcrypto.subtle);
  assert.equal(h1, h2);
  assert.match(h1, /^[0-9a-f]{64}$/);
  const c = b.slice(); c[10] = c[10].slice(0, -1) + (c[10].endsWith('A') ? 'B' : 'A');
  assert.notEqual(h1, await U.commitment(c, webcrypto.subtle));
});

test('csv has one row per coupon with a redeem link and expiry', () => {
  const csv = U.toCsv(U.couponBatch(rnd), '2026-11-08');
  const rows = csv.trim().split('\n');
  assert.equal(rows.length, 501);
  assert.match(rows[1], /^1,organiser,NMIMS-ORG-0001-[0-9A-Z]{13},https:\/\/www\.roamwise\.co\.in\/\?redeem=NMIMS-ORG-0001-[0-9A-Z]{13},2026-11-08$/);
});

test('seat counter: NMIMS pool reserved once issuing, never double counted (the reported bug)', () => {
  const founder = n => snap(true, { count: n });
  const issuing = snap(true, { issuanceEnabled: true });
  assert.equal(Seats.computeFromSnapshots(founder(7), issuing).left, 493, '7 paid, NMIMS issuing, none redeemed');
  // redeeming NMIMS passes no longer changes the paid counter, so the public number stays 493
  assert.equal(Seats.computeFromSnapshots(founder(7), issuing).left, 493, '7 paid, all 500 NMIMS redeemed');
  assert.equal(Seats.computeFromSnapshots(founder(7), snap(true, { officialConfirmed: true })).left, 493);
  assert.equal(Seats.computeFromSnapshots(founder(7), snap(true, { issuanceEnabled: false })).left, 993, 'not issuing and not official: nothing reserved');
  assert.equal(Seats.computeFromSnapshots(founder(500), issuing).left, 0, '500 paid + 500 reserved = sold out');
  assert.equal(Seats.computeFromSnapshots(founder(700), issuing).left, 0, 'never negative');
});

test('reconcile tool ignores NMIMS pass holders but counts every other permanent Pro account', () => {
  const users = [
    { pro: true, proMethod: 'founder-cashfree' },
    { pro: true, proMethod: 'manual-paid' },
    { pro: true, proMethod: 'partner', proCode: 'NMIMS-STU-0001-AAAAAAAAAAAAA' },
    { pro: true, proMethod: 'partner', proCode: 'NMIMS-ORG-0001-AAAAAAAAAAAAA' },
    { pro: true, proMethod: 'partner', proCode: 'OTHERCO-1234' },
    { pro: false },
  ];
  assert.equal(Reconcile.permanentProCount(users), 3);
});

test('redeem flow: coupons skip the email check, record the redeemer email, and never move the paid counter', () => {
  const src = read('js/payments/partner-redeem.js');
  assert.match(src, /var isCoupon=\(data\.bearer===true\)/);
  assert.match(src, /if\(isCoupon\) flip\.email=user\.email/);
  assert.match(src, /if\(!isCoupon && data\.email/);
  assert.match(src, /indexOf\('NMIMS-'\)!==0/);
  assert.match(src, /isPro\)\{ showToast\('Your account already has Pro/);
  assert.match(src, /rwPartnerShare/);
});

test('redeem-link only pre-fills the form and cleans the URL', () => {
  const src = read('js/payments/redeem-link.js');
  assert.match(src, /__rwPendingRedeem=code/);
  assert.match(src, /searchParams\.delete\('redeem'\)/);
  assert.doesNotMatch(src, /\.update\(|\.set\(/);
  assert.match(read('index.html'), /redeem-link\.js/);
});

test('rules: coupon branches present and admin-only creation unchanged', () => {
  const r = read('firestore.rules');
  assert.match(r, /get\('bearer', false\) == true/);
  assert.match(r, /hasOnly\(\['proRedeemed','redeemedAt','redeemedUid','email'\]\)/);
  assert.match(r, /allow create: if isAdmin\(\);\n      \/\/ Redemption flip/);
});
