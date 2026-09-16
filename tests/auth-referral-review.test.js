// Review-only regression: generate the candidate from the REAL current rules.
// This never mutates firestore.rules or deploys anything.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

test('current Firestore rules produce a safe partner-claim review candidate', () => {
  const root = path.resolve(__dirname, '..');
  const before = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-firestore-review-'));
  const output = path.join(temp, 'candidate.rules');
  try {
    execFileSync('python3', [path.join(root, 'tools/prepare-auth-referral-rules.py'),
      '--input', path.join(root, 'firestore.rules'), '--output', output], { cwd: root });
    const rules = fs.readFileSync(output, 'utf8');
    assert.equal(fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8'), before);
    assert.match(rules, /match \/paymentDestinations\/\{id\}/);
    assert.match(rules, /request\.resource\.data\.userUID == request\.auth\.uid/);
    assert.match(rules, /request\.resource\.data\.refRate <= 0\.30/);
    assert.match(rules, /get\([\s\S]*partnerClaims[\s\S]*\)\.data\.email == request\.auth\.token\.email/);
    const claims = rules.split('match /partnerClaims/{id} {')[1].split('// ---- PARTNER CLAIM EMAIL INDEX')[0];
    const index = rules.split('match /partnerClaimEmails/{emailKey} {')[1].split('// ---- PARTNERSHIPS')[0];
    const partnerships = rules.split('match /partnerships/{id} {')[1].split('// ---- REFERRAL SIGNUP LOG')[0];
    assert.match(claims, /allow create: if isAdmin\(\);/);
    assert.match(index, /allow get: if isAdmin\(\);/);
    assert.match(index, /allow create: if isAdmin\(\);/);
    assert.match(partnerships, /allow update: if isAdmin\(\);/);
    assert.doesNotMatch(claims, /allow get: if true/);
    assert.doesNotMatch(partnerships, /allow update: if isAdmin\(\) \|\|/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
