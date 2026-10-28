const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync(__dirname + '/../js/pricing/referral.js', 'utf8');
const shareSrc = fs.readFileSync(__dirname + '/../js/itinerary/share.js', 'utf8');

function load(opts = {}) {
  const ls = {};
  const win = { RW_REFERRERS: opts.referrers || [], user: opts.user };
  const ctx = {
    window: win, URL, URLSearchParams, Date, Math, JSON, String, parseInt, encodeURIComponent, decodeURIComponent,
    location: { href: 'https://www.roamwise.co.in/', search: '', hash: '', pathname: '/' },
    lsGet: k => (k in ls ? ls[k] : null), lsSet: (k, v) => { ls[k] = v; },
    track() {}, showToast() {}, setTimeout() {},
  };
  if (opts.user) ctx.user = opts.user;
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx;
}

test('adds utm_source and utm_medium to a RoamWise link', () => {
  const c = load();
  const u = new URL(c.rwShareLink('https://www.roamwise.co.in', 'WhatsApp'));
  assert.equal(u.searchParams.get('utm_source'), 'whatsapp');
  assert.equal(u.searchParams.get('utm_medium'), 'share');
  assert.equal(u.searchParams.get('ref'), null);
});

test('never sets utm_content, which the referral capture reads as a code', () => {
  const c = load();
  assert.equal(new URL(c.rwShareLink('https://roamwise.co.in/stays/almora/', 'x')).searchParams.has('utm_content'), false);
});

test('leaves other hosts and bad input unchanged', () => {
  const c = load();
  assert.equal(c.rwShareLink('https://example.com/a', 'x'), 'https://example.com/a');
  assert.equal(c.rwShareLink('', 'x'), '');
  assert.equal(c.rwShareLink('https://roamwise.co.in.evil.com/', 'x'), 'https://roamwise.co.in.evil.com/');
});

test('does not overwrite an existing utm_source or ref', () => {
  const c = load({ user: { uid: 'u1', email: 'a@b.c' }, referrers: [{ code: 'RW-S01-FEBIN', uid: 'u1', active: true }] });
  const u = new URL(c.rwShareLink('https://www.roamwise.co.in/?utm_source=ig&ref=RW-X', 'whatsapp'));
  assert.equal(u.searchParams.get('utm_source'), 'ig');
  assert.equal(u.searchParams.get('ref'), 'RW-X');
});

test('adds the sharer\'s OWN code only, matched by uid or email', () => {
  const refs = [
    { code: 'RW-S01-FEBIN', uid: 'u1', active: true },
    { code: 'RW-C01-ASHA', email: 'Asha@Example.com', active: true },
    { code: 'RW-S03-OLD', uid: 'u3', active: false },
  ];
  assert.equal(load({ user: { uid: 'u1' }, referrers: refs }).rwOwnRefCode(), 'RW-S01-FEBIN');
  assert.equal(load({ user: { uid: 'x', email: 'asha@example.com' }, referrers: refs }).rwOwnRefCode(), 'RW-C01-ASHA');
  assert.equal(load({ user: { uid: 'u3' }, referrers: refs }).rwOwnRefCode(), '', 'retired code is never shared');
  assert.equal(load({ referrers: refs }).rwOwnRefCode(), '', 'signed-out users have none');
});

test('a visitor\'s incoming referral is never reused on their shares', () => {
  const refs = [{ code: 'RW-S01-FEBIN', active: true, uid: 'u1' }];
  const c = load({ user: { uid: 'friend' }, referrers: refs });
  c.lsSet('rw_ref_code', 'RW-S01-FEBIN'); c.lsSet('rw_ref_at', String(Date.now()));
  assert.equal(new URL(c.rwShareLink('https://www.roamwise.co.in', 'copy')).searchParams.get('ref'), null);
});

test('share.js no longer promises a rupee lifetime price and tags every channel', () => {
  assert.ok(!/u20b9100 lifetime/.test(shareSrc));
  assert.ok(/tag\('whatsapp'\)/.test(shareSrc) && /tag\('telegram'\)/.test(shareSrc) && /tagged\('copy'\)/.test(shareSrc));
});
