const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

const proposal = read('nmims/index.html');
const mou = read('nmims/mou/index.html');

test('one canonical proposal preserves the complete approved-in-principle 50/450 offer', () => {
  assert.match(proposal, /<link rel="canonical" href="https:\/\/roamwise\.co\.in\/nmims\/">/);
  for (const expected of ['50 passes for the organising team', '450 for eligible NMIMS students and participating audience', '2 collaborative Reels', '4 Stories', '1 LinkedIn post', '2 campus/community pushes', '30%', '/nmims/mou/', '/nmims/creators/']) {
    assert.ok(proposal.includes(expected), `Missing offer element: ${expected}`);
  }
  assert.match(proposal, /PROPOSAL ONLY · NOT LIVE/);
  assert.doesNotMatch(proposal, /\b(?:Tannu|Deepanshi|Abhay)\b|<form\b|firebase\.initializeApp|submitClaim\(/i);
  assert.doesNotMatch(proposal, /Kind Partner|Title Sponsor|Category Partner|electronically signed/i);
});

test('old proposal and MOU URLs redirect to canonical paths and preserve referrals', () => {
  for (const legacy of ['nmims/proposal.html', 'nmims/proposal/index.html']) {
    const content = read(legacy);
    assert.match(content, /location\.replace\('\/nmims\/'\+location\.search\+location\.hash\)/);
    assert.match(content, /noindex,follow/);
    assert.doesNotMatch(content, /500 lifetime.*passes/i);
  }
  const legacyMou = read('nmims/mou.html');
  assert.match(legacyMou, /location\.replace\('\/nmims\/mou\/'\+location\.search\+location\.hash\)/);
});

test('only current unsigned MOU is linked; no invented signature, self-claim, or old downloads', () => {
  assert.match(mou, /UNSIGNED DRAFT · NO PARTNERSHIP ACTIVATION/);
  assert.match(mou, /30 days of individual issuance/);
  assert.match(mou, /50 passes for approved E-Cell organisers/);
  assert.match(mou, /450 passes for eligible NMIMS students and participating audience members/);
  assert.doesNotMatch(mou, /\/s\/ Mohit|electronically signed\)/i);
  assert.doesNotMatch(mou, /claimed via a unique QR|automatic.*claim.*pass/i);
  for (const obsolete of [
    'nmims/RoamWise-NMIMS-MOU.docx', 'nmims/RoamWise-NMIMS-MOU.pdf',
    'nmims/RoamWise-NMIMS-Proposal.docx', 'nmims/RoamWise-NMIMS-Proposal.pdf',
    'nmims/proposal/RoamWise-NMIMS-Commercial-Proposal.docx',
    'nmims/proposal/RoamWise-NMIMS-Commercial-Proposal.pdf',
    'nmims/mou/RoamWise-NMIMS-MOU-Annexure.docx',
    'nmims/mou/RoamWise-NMIMS-MOU-Annexure.pdf']) {
    assert.equal(fs.existsSync(path.join(__dirname, '..', obsolete)), false, `Outdated document still published: ${obsolete}`);
  }
});

test('NMIMS referral remains a non-active seed until agreement, while operational code survives', () => {
  assert.match(read('referral-data.js'), /code:'NMIMS2026'[^\n]*active:false/);
  assert.ok(fs.existsSync(path.join(__dirname, '../nmims/pass-issuer/pass-utils.js')));
  assert.ok(fs.existsSync(path.join(__dirname, '../nmims/pass-issuer/index.html')));
  assert.ok(fs.existsSync(path.join(__dirname, '../nmims/creators/index.html')));
});
