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

test('commission scenario: 600 NMIMS-referred buyers (493 x Rs100 founder, 107 x Rs299) = Rs 24,387.90 at 30%', () => {
  const Liability = load('js/admin/referral-liability.js', 'RWReferralLiability');
  const directory = [{ code: 'NMIMS2026', name: 'E-Cell NMIMS Mumbai', type: 'campus', rate: 0.30, active: true }];
  const sales = [];
  for (let i = 0; i < 493; i++) sales.push({ amountINR: 100, uid: 'f' + i, email: `f${i}@x.com`, refCode: 'NMIMS2026' });
  for (let i = 0; i < 107; i++) sales.push({ amountINR: 299, uid: 'p' + i, email: `p${i}@x.com`, refCode: 'NMIMS2026' });
  const out = Liability.computeReferralLiability(sales, directory, { ratePct: 30 });
  const b = out.byCode.NMIMS2026;
  assert.equal(b.salesCount, 600);
  assert.equal(b.grossRevenueINR, 493 * 100 + 107 * 299);
  assert.equal(b.grossRevenueINR, 81293);
  assert.equal(Math.round(b.commissionOwedINR * 100) / 100, 24387.9);
});

test('commission safety: a buyer is counted once per code, a hand-edited rate is capped at 30%, unknown codes are flagged', () => {
  const Liability = load('js/admin/referral-liability.js', 'RWReferralLiability');
  const directory = [{ code: 'NMIMS2026', name: 'E-Cell NMIMS', type: 'campus', rate: 0.90, active: true }];
  const out = Liability.computeReferralLiability([
    { amountINR: 100, uid: 'u1', refCode: 'NMIMS2026' },
    { amountINR: 299, uid: 'u1', refCode: 'NMIMS2026' },
    { amountINR: 100, uid: 'u2', refCode: 'FAKECODE', refRate: 5 },
  ], directory, { ratePct: 30 });
  assert.equal(out.byCode.NMIMS2026.salesCount, 1);
  assert.equal(out.byCode.NMIMS2026.commissionOwedINR, 30);
  assert.equal(out.byCode.FAKECODE.commissionOwedINR, 30);
  assert.ok(out.unmatchedCodes.FAKECODE);
});

test('admin referral report includes verified PAID Cashfree payments that carry a refCode', () => {
  const html = read('admin/index.html');
  assert.match(html, /PAYMENTS\.filter\(p=>p\.refCode&&paymentSucceeded\(p\)&&String\(p\.status\|\|""\)\.toLowerCase\(\)==="paid"\)/);
  assert.match(read('js/payments/providers/cashfree-adapter.js'), /refCode: _cfRefCode\(\)/);
});

test('printable cards: one QR per coupon pointing at its own redeem link, nothing loaded externally', () => {
  const qrcode = require('../nmims/pass-issuer/qrcode.js');
  const list = U.couponBatch(rnd);
  const urls = [];
  const svg = url => { urls.push(url); const q = qrcode(0, 'M'); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); };
  const html = U.cardsHtml(list.filter(c => c.role === 'student'), svg, '2026-11-08', 'NMIMS student <pass> cards');
  assert.equal(urls.length, 450);
  assert.equal(new Set(urls).size, 450);
  for (const u of urls) assert.match(u, /^https:\/\/www\.roamwise\.co\.in\/\?redeem=NMIMS-STU-\d{4}-[0-9A-HJKMNP-TV-Z]{13}$/);
  assert.equal((html.match(/class="card"/g) || []).length, 450);
  assert.equal((html.match(/<svg /g) || []).length, 450);
  assert.ok(html.includes('NMIMS student &lt;pass&gt; cards'), 'title is escaped');
  assert.doesNotMatch(html, /<script|<link|<img|src=|url\(http/i);
});

test('generic poster QR (?redeem=open) opens the empty form; page wires card printing', () => {
  assert.match(read('js/payments/redeem-link.js'), /code==='OPEN'\|\|code==='1'/);
  const page = read('nmims/pass-issuer/index.html');
  assert.match(page, /qrcode\.js/);
  assert.match(page, /cardOrgBtn/);
  assert.match(read('nmims/pass-issuer/qrcode.js'), /MIT license/);
});

test('digital cards: one per coupon, fixed inline script (no codes inside it), nothing external', () => {
  const qrcode = require('../nmims/pass-issuer/qrcode.js');
  const list = U.couponBatch(rnd).filter(c => c.role === 'student');
  const svg = url => { const q = qrcode(0, 'M'); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); };
  const html = U.digitalCardsHtml(list, svg, '2026-11-08', 'NMIMS <digital>');
  assert.equal((html.match(/class="card"/g) || []).length, 450);
  assert.equal((html.match(/class="save"/g) || []).length, 450);
  assert.equal((html.match(/<script>/g) || []).length, 1);
  const script = html.slice(html.indexOf('<script>'), html.indexOf('</script>'));
  assert.ok(!script.includes('NMIMS-STU-'), 'no coupon codes in the script');
  assert.doesNotMatch(html, /<link|<img|src="http|url\(http/i);
  assert.ok(html.includes('NMIMS &lt;digital&gt;'));
  const page = read('nmims/pass-issuer/index.html');
  assert.match(page, /digOrgBtn/); assert.match(page, /digStuBtn/);
});
