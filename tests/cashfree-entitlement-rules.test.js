// Tests for firestore.rules' entitlement-persistence fix for Cashfree
// purchases (see js/payments/providers/cashfree-adapter.js's _cfRecordOrder()
// and js/payments/plan-picker.js's grantPurchase() for the client half).
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
//   1. There is no client-writable path from a cashfreeOrders/{orderId} doc
//      (real or forged) to users/{uid}.pro — the users/{uid} match block's
//      text is unchanged by this PR (still exactly the pre-existing
//      isAdmin() / self-non-pro-fields / partner-redeem branches) and
//      contains zero reference to cashfreeOrders anywhere in its body.
//   2. cashfreeOrders/{orderId} can only ever be CREATED with status:
//      'pending' by its own uid (never 'approved', never someone else's
//      uid) — so a user cannot self-grant, and cannot forge another
//      account's receipt.
//   3. cashfreeOrders/{orderId} can only be UPDATED or DELETED by an admin
//      (isAdmin()) — i.e. the only way a pending receipt ever becomes
//      "approved" is a human admin action, exactly mirroring claims/{id}'s
//      proven manual-UPI shape.

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

test('firestore.rules: cashfreeOrders/{orderId} create requires status==\'pending\' and the caller\'s own uid — never a self-asserted approved/PAID status, never someone else\'s uid', () => {
  const createClause = cashfreeBlock.match(/allow create:[\s\S]*?;/)[0];
  assert.match(createClause, /request\.resource\.data\.uid == request\.auth\.uid/, 'create must bind the receipt to the caller\'s own uid');
  assert.match(createClause, /request\.resource\.data\.status == 'pending'/, 'create must force status to literally "pending" — a client cannot create it pre-approved');
  assert.doesNotMatch(createClause, /'approved'/, 'create must never accept a self-asserted "approved" status');
});

test('firestore.rules: cashfreeOrders/{orderId} update/delete requires isAdmin() only — no self-service transition of any kind (unlike partnerClaims\' accepted-risk create shape)', () => {
  const updateDeleteClause = cashfreeBlock.match(/allow update, delete:[\s\S]*?;/);
  assert.ok(updateDeleteClause, 'expected a single "allow update, delete:" statement');
  assert.match(updateDeleteClause[0], /isAdmin\(\)/);
  // Must be isAdmin() ALONE — not `isAdmin() || (request.auth != null && ...)`,
  // which is exactly the shape partnerClaims/{id}'s documented, accepted,
  // open forgery risk uses (see that match block). Cashfree must not import
  // that same risk onto a real-money purchase path.
  assert.doesNotMatch(updateDeleteClause[0], /\|\|/, 'update/delete must be isAdmin() alone, no self-service OR-branch');
});

test('firestore.rules: cashfreeOrders/{orderId} create validates amountINR is a bounded positive number and planId/cfOrderId are bounded strings (no unbounded/typeless self-reported fields)', () => {
  const createClause = cashfreeBlock.match(/allow create:[\s\S]*?;/)[0];
  assert.match(createClause, /request\.resource\.data\.amountINR is number/);
  assert.match(createClause, /request\.resource\.data\.amountINR > 0/);
  assert.match(createClause, /request\.resource\.data\.amountINR <= 100000/);
  assert.match(createClause, /request\.resource\.data\.planId is string/);
  assert.match(createClause, /request\.resource\.data\.cfOrderId is string/);
});

test('firestore.rules: cashfreeOrders/{orderId} create pins the doc id to the order id (orderId == request.resource.data.cfOrderId) — a second account cannot "create" over an already-claimed order id, since Firestore treats a write to an existing doc path as an update (admin-only above), not a create', () => {
  const createClause = cashfreeBlock.match(/allow create:[\s\S]*?;/)[0];
  assert.match(createClause, /orderId == request\.resource\.data\.cfOrderId/);
});

test('firestore.rules: cashfreeOrders/{orderId} read is scoped to the owning uid or an admin — not publicly listable/readable by anyone', () => {
  const readClause = cashfreeBlock.match(/allow read:[\s\S]*?;/)[0];
  assert.match(readClause, /isAdmin\(\)/);
  assert.match(readClause, /resource\.data\.uid == request\.auth\.uid/);
});
