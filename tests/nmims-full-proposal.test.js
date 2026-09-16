const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'nmims', 'index.html'), 'utf8');

test('NMIMS proposal retains the complete 50/450 offer and stays inactive', () => {
  assert.match(html, /50\s*passes\s*for\s*the\s*organising\s*team/i);
  assert.match(html, /450\s*for\s*eligible\s*NMIMS\s*students\s*and\s*participating\s*audience/i);
  assert.match(html, /PROPOSAL ONLY\s*·\s*NOT LIVE/);
  assert.match(html, /No public registration, pass claiming, payment or referral campaign is active/i);
  assert.doesNotMatch(html, /<form\b|<script\b|\bsubmitClaim\s*\(/i);
});

test('partnership details and independent creator interest remain available', () => {
  for (const phrase of ['Cash sponsorship', '2 collaborative Reels', '4 Stories', '1 LinkedIn post', '2 campus/community pushes', '30%', 'no commission', 'approved participants']) {
    assert.ok(html.toLowerCase().includes(phrase.toLowerCase()), `missing proposal detail: ${phrase}`);
  }
  for (const route of ['/nmims/creators/', '/legal/privacy.html']) {
    assert.ok(html.includes(route), `${route} should be linked`);
  }
  assert.match(html, /organisers or participating students/i);
  assert.match(html, /only one referral bonus/i);
});

test('public proposal has no personal outreach or internal document notes', () => {
  assert.doesNotMatch(html, /\b(?:Tannu|Tanu|Deepanshi|Abhay)\b/i);
  assert.doesNotMatch(html, /founder in CC|keep (?:me|the founder) (?:in )?CC|older self-service|before signing|reconciliation note/i);
  assert.doesNotMatch(html, /\/nmims\/(?:mou|proposal)\.html/);
  assert.match(html, /authorised representatives/i);
});
