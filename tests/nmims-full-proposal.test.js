const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'nmims', 'index.html'), 'utf8');

test('NMIMS home presents the complete 50/450 offer and stays proposal-only', () => {
  assert.match(html, /50\s*passes\s*for\s*the\s*organising\s*team/i);
  assert.match(html, /450\s*for\s*eligible\s*NMIMS\s*students\s*and\s*participating\s*audience/i);
  assert.match(html, /PROPOSAL ONLY\s*·\s*NOT LIVE/);
  assert.match(html, /No public registration, pass claiming, payment or referral campaign is active/i);
  assert.doesNotMatch(html, /\bsubmitClaim\s*\(/);
  assert.doesNotMatch(html, /<form\b/i);
  assert.doesNotMatch(html, /<script\b/i);
});

test('NMIMS home includes the actual partnership terms and separate creator offer', () => {
  for (const phrase of ['Cash sponsorship', '2 collaborative Reels', '4 Stories', '1 LinkedIn post', '2 campus/community pushes', '30%', 'no commission', 'approved participants']) {
    assert.match(html.toLowerCase(), new RegExp(phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const path of ['/nmims/creators/', '/nmims/proposal.html', '/nmims/mou.html', '/legal/privacy.html']) {
    assert.ok(html.includes(path), `${path} should be linked`);
  }
  assert.match(html, /older self-service claim wording must be reconciled/i);
});
