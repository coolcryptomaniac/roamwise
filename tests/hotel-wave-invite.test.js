'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const invite = fs.readFileSync('partner/invite/hotel-wave-sirsa/index.html', 'utf8');
const join = fs.readFileSync('partner/join/index.html', 'utf8');

test('Hotel Wave Inn invitation has parseable prefill and matching onboarding slug', () => {
  assert.match(invite, /<title>Hotel Wave Inn, Sirsa/);
  assert.match(invite, /href="\/partner\/join\/\?property=hotel-wave-inn-sirsa"/);
  assert.match(invite, /propertyName:'Hotel Wave Inn',city:'Sirsa'/);
  assert.match(invite, /sessionStorage\.setItem\('rwJoinDraft',JSON\.stringify\(seed\)\)/);
  assert.match(join, /saved\.slug===slug/);
  assert.match(join, /restore\(saved\)/);
  const scripts = [...invite.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(Boolean);
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new vm.Script(scripts[0]));
});

test('Application does not claim a booking or invent rates or an owner', () => {
  assert.match(invite, /roomCount:'',startPrice:'',hook:''/);
  assert.match(invite, /ownerName:'',phone:''/);
  assert.match(invite, /application is pending/i);
  assert.doesNotMatch(invite, /cashfree\.com\/pg\/orders|upi:\/\/pay|verified:true/);
});
