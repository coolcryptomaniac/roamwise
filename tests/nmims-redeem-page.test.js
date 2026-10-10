'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const page = read('nmims/redeem/index.html');

test('pass instructions page is light, self-contained and states the real rules', () => {
  assert.ok(Buffer.byteLength(page) < 20000, 'stays small for slow connections');
  assert.doesNotMatch(page, /<link[^>]+(stylesheet|fonts)/i, 'no external CSS or fonts');
  assert.doesNotMatch(page, /<script[^>]+src=/i, 'no external scripts');
  assert.match(page, /first 500 passes: 50 for organisers and 450/);
  assert.match(page, /single-use/);
  assert.match(page, /verify your email/i);
  assert.match(page, /Redeem within 30 days/);
  assert.match(page, /One code per person/);
  assert.match(page, /does not change your price/);
  assert.match(page, /never gives you a pass/);
  assert.match(page, /href="\/\?redeem=1"/);
  assert.match(page, /support@roamwise\.co\.in/);
  assert.match(page, /\/privacy\.html/);
  assert.doesNotMatch(page, /<form\b/i, 'this page never creates or claims a pass');
});

test('home event card links to the instructions; referral code is attribution-only and active', () => {
  assert.match(read('js/ui/nmims-event-banner.js'), /how\.href='\/nmims\/redeem\/'/);
  const r = read('referral-data.js');
  assert.match(r, /code:'NMIMS2026'[^\n]*type:'campus'[^\n]*rate:0\.30, active:true/);
  assert.match(r, /never\s+changes the buyer's price/);
});
