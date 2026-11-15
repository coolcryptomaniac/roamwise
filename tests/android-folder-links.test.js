'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = (f) => fs.readFileSync(f, 'utf8');

/* The Android app answers a folder URL (/wallet/) with the home page, which then loads unstyled.
   The build repo's bridge fixes clicks; these checks keep the web code from depending on it. */
test('home quick-access shortcuts name the file inside the Android app', () => {
  const src = read('js/ui/home-quick-access.js');
  assert.match(src, /function target\(href\)/);
  assert.match(src, /a\.href = item\.href \? target\(item\.href\) : '#'/);
  const target = (native, href) => (native ? href.replace(/^(\/[^?#]*\/)(?=$|[?#])/, '$1index.html') : href);
  assert.equal(target(true, '/wallet/#invite'), '/wallet/index.html#invite');
  assert.equal(target(true, '/wallet/'), '/wallet/index.html');
  assert.equal(target(false, '/wallet/#invite'), '/wallet/#invite');
  assert.equal(target(true, '/packages/amor-checkout.html'), '/packages/amor-checkout.html');
});

test('links rendered by scripts are rooted and point at real files', () => {
  assert.match(read('js/trip-desk/ui.js'), /href="\/partner\/index\.html"/);
  assert.doesNotMatch(read('js/trip-desk/ui.js'), /href="partner\/"/);
  const board = read('js/ui/creator-property-board.js');
  assert.doesNotMatch(board, /href="creators\//);
  assert.ok(fs.existsSync('partner/index.html') && fs.existsSync('creators/match.html'));
});

test('Google sign-in message tells people what to do', () => {
  const src = read('js/boot/auth-init.js');
  assert.doesNotMatch(src, /needs the latest RoamWise app build/);
  assert.match(src, /update RoamWise from Google Play/);
});
