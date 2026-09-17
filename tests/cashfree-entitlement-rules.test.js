// Structural tests for the Cashfree server-authoritative Firestore boundary.
//
// IMPORTANT — what this file does and does NOT prove: this repo has no
// Firebase emulator / @firebase/rules-unit-testing harness (checked
// package.json — no firebase-* dependency exists anywhere here), and adding
// one requires a JVM-backed emulator this sandboxed environment cannot
// install/run. So these are STATIC, structural assertions against the real
// firestore.rules TEXT (balanced-brace block extraction, not a live rules
// engine) — they prove the *shape* of the deployed rule is what this PR
// claims, not that Firestore's rules engine evaluates it a particular way at
// runtime. A real emulator-based test (e.g. via @firebase/rules-unit-testing)
// would be a stronger follow-up; flagged in the PR description.
//
// What these DO conclusively establish by reading the actual file that gets
// pasted into the Firebase Console (see firestore.rules' own deploy
// instructions):
//   1. users/{uid} has no client-side Cashfree grant branch.
//   2. cashfreeOrders/{orderId} has no non-admin write path. Production
//      receipts are written by the Worker with service-account REST, which
//      bypasses Firestore rules after server-side Firebase/Cashfree checks.
//   3. users can read only their own receipt; admins retain recovery access.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rulesText = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');

/* Balanced-brace extraction of `match /<path> { ... }` — needed because
   simple regex up to the next `}` would truncate at the first NESTED
   sub-collection's closing brace (e.g. users/{uid} contains a nested
   `match /devices/{deviceId} { ... }`). */
function extractMatchBlock(text, matchPath){
  const needle = 'match ' + matchPath + ' {';
  const start = text.indexOf(needle);
  assert.ok(start !== -1, 'expected to find "' + needle + '" in firestore.rules');
  // needle itself ends with the block's OPENING brace (matchPath may contain
  // its own `{param}` braces, e.g. "/cashfreeOrders/{orderId}", so naively
  // searching for the next "{" from `start` would stop at THAT brace instead
  // — start balanced counting right after needle's own trailing "{").
  const openIdx = start + needle.length - 1;
  let depth = 1, i;
  for(i = openIdx + 1; i < text.length && depth > 0; i++){
    if(text[i] === '{') depth++;
    else if(text[i] === '}') depth--;
  }
  return text.slice(start, i);
}

const usersBlock = extractMatchBlock(rulesText, '/users/{uid}');
const cashfreeBlock = extractMatchBlock(rulesText, '/cashfreeOrders/{orderId}');

test('firestore.rules: cashfreeOrders/{orderId} block exists', () => {
  assert.ok(cashfreeBlock.length > 0);
});

test('firestore.rules: users/{uid} has NO reference to cashfreeOrders at all — this PR adds zero new client-writable path to pro/proAt/proMethod/proPayId', () => {
  assert.equal(usersBlock.indexOf('cashfreeOrders'), -1, 'users/{uid} must not gain a Cashfree-specific self-service branch');
});

test('firestore.rules: users/{uid} still has exactly the three pre-existing update branches (isAdmin, self-non-pro-fields, partner-redeem) — no fourth branch added', () => {
  const updateMatches = usersBlock.match(/allow update:/g) || [];
  assert.equal(updateMatches.length, 3, 'expected exactly 3 "allow update:" statements on users/{uid} (isAdmin / self / partner-redeem) — a 4th would mean a new self-service grant path was added');
});

test('firestore.rules: cashfreeOrders writes require admin — ordinary clients cannot create or transition receipts', () => {
  const writeClause = cashfreeBlock.match(/allow create, update, delete:[\s\S]*?;/);
  assert.ok(writeClause, 'expected one admin-only Cashfree write statement');
  assert.match(writeClause[0], /isAdmin\(\)/);
  assert.doesNotMatch(writeClause[0], /\|\||request\.auth\.uid/, 'there must be no self-service receipt write branch');
});

test('firestore.rules: cashfreeOrders/{orderId} read is scoped to the owning uid or an admin — not publicly listable/readable by anyone', () => {
  const readClause = cashfreeBlock.match(/allow read:[\s\S]*?;/)[0];
  assert.match(readClause, /isAdmin\(\)/);
  assert.match(readClause, /resource\.data\.uid == request\.auth\.uid/);
});
