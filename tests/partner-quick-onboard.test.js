'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('partner/join/index.html', 'utf8');
const inline = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(Boolean);

test('quick invitation page has parseable browser script and three steps', () => {
  assert.equal(inline.length, 1);
  assert.doesNotThrow(() => new vm.Script(inline[0], {filename:'partner/join/index.html'}));
  assert.equal((html.match(/data-step="[012]"/g) || []).length, 3);
});

test('both pilot invitations are named and the price is never guessed', () => {
  assert.match(html, /'milan-heights':\{name:'Hotel Milan Heights'/);
  assert.match(html, /'corbett-jungle-view':\{name:'Corbett Jungle View Homestay'/);
  assert.doesNotMatch(html, /startPrice:\s*[1-9][0-9]*/);
});

test('application only creates pending partner records; no payment or self-verification', () => {
  assert.match(html, /db\.collection\('partners'\)\.doc\(u\.uid\)/);
  assert.match(html, /doc\.status='pending'/);
  assert.doesNotMatch(html, /doc\.verified\s*=/);
  assert.doesNotMatch(html, /doc\.badges\s*=/);
  assert.doesNotMatch(html, /cashfree.*createOrder/i);
  assert.match(html, /ownerAuthorityAttested:true/);
  assert.match(html, /commercialTermsPending:true/);
});

test('collect only application basics, not bank or ID document fields', () => {
  assert.match(html, /id="authority" required/);
  assert.match(html, /id="consent" required/);
  assert.doesNotMatch(html, /<input[^>]+(?:id|name)="(?:aadhaar|pan|accountNumber|ifsc|upiPin|cardNumber)"/i);
  assert.match(html, /privacy\.html/);
});
