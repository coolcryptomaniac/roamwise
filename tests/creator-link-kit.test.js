'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const rd = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const kit = require('../creators/link-kit.js');

test('one tracked link per channel, carrying the referral code and UTM tags, never utm_content', () => {
  const links = kit.buildLinks('rw-c-asha-ab12c');
  assert.equal(links.length, kit.CHANNELS.length);
  for (const l of links) {
    const u = new URL(l.url);
    assert.equal(u.origin, 'https://roamwise.co.in');
    assert.equal(u.searchParams.get('ref'), 'RW-C-ASHA-AB12C');
    assert.equal(u.searchParams.get('utm_medium'), 'creator');
    assert.equal(u.searchParams.get('utm_campaign'), 'rw-c-asha-ab12c');
    assert.ok(u.searchParams.get('utm_source'));
    assert.equal(u.searchParams.get('utm_content'), null);
  }
  assert.deepEqual(kit.buildLinks('<script>'), kit.buildLinks('SCRIPT'));
  assert.deepEqual(kit.buildLinks(''), []);
  assert.equal(kit.shortLink('rw-c01-trekmd'), 'https://roamwise.co.in/r/RW-C01-TREKMD');
});

test('short links /r/CODE redirect to the planner with the code; other missing pages still show the retired notice', () => {
  const html = rd('404.html');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const run = (pathname) => { const out = { to: null }; vm.runInNewContext(script, { location: { pathname, replace: (u) => { out.to = u; } }, encodeURIComponent }); return out.to; };
  assert.equal(run('/r/rw-c01-trekmd'), '/?ref=RW-C01-TREKMD&utm_source=short_link&utm_medium=creator&utm_campaign=rw-c01-trekmd');
  assert.equal(run('/r/RW-C01-TREKMD/'), '/?ref=RW-C01-TREKMD&utm_source=short_link&utm_medium=creator&utm_campaign=rw-c01-trekmd');
  assert.equal(run('/old/page'), null);
  assert.equal(run('/r/<x>'), null);
  assert.match(html, /This page has been retired/);
});

test('Creator Studio shows the link kit from the active code; the creator form offers self-select app promotion', () => {
  assert.match(rd('creators/dashboard.html'), /<script src="link-kit\.js"><\/script><script src="studio\.js">/);
  const studio = rd('creators/studio.js');
  assert.match(studio, /function paintLinks\(code\)/);
  assert.match(studio, /paint=function\(\)\{_paint\.apply\(this,arguments\);try\{paintLinks\(activeCode\(\)\)\}/);
  const page = rd('creators/match.html'), js = rd('creators/matchmaking.js');
  for (const v of ['none', 'stories', 'reel', 'ambassador']) assert.match(page, new RegExp(`name="appPromo" value="${v}"`));
  assert.match(page, /Pro is switched on after RoamWise checks the post is live/);
  assert.match(js, /appPromo,/);
  assert.match(js, /App promo: \$\{appPromo\}/);
});
