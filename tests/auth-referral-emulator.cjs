// Integration test for the review candidate ONLY. Requires a Firestore emulator
// and @firebase/rules-unit-testing + firebase; never contacts production.
const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, updateDoc, serverTimestamp } = require('firebase/firestore');

async function run() {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Refusing to run without a Firestore emulator');
  const rules = fs.readFileSync(path.resolve(__dirname, '..', 'firestore-review.rules'), 'utf8');
  const env = await initializeTestEnvironment({ projectId: 'demo-roamwise-rules-review', firestore: { rules } });
  try {
    const founder = env.authenticatedContext('founder', {email: 'founder@example.com', email_verified: true}).firestore();
    const alice = env.authenticatedContext('alice', {email: 'alice@example.com', email_verified: true}).firestore();
    const bob = env.authenticatedContext('bob', {email: 'bob@example.com', email_verified: true}).firestore();
    const pending = env.authenticatedContext('pending', {email: 'pending@example.com', email_verified: false}).firestore();
    const anon = env.unauthenticatedContext().firestore();
    await env.withSecurityRulesDisabled(async ctx => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'admins', 'founder'), {role: 'owner'});
      await setDoc(doc(db, 'partnerships', 'NMIMS'), {claimed: 0, cap: 500, studentClaimed: 0, studentCap: 450});
      await setDoc(doc(db, 'users', 'alice'), {name: 'Alice'});
      await setDoc(doc(db, 'users', 'bob'), {name: 'Bob'});
    });
    const claim = {name: 'Alice', email: 'alice@example.com', consent: true,
      partnership: 'NMIMS', code: 'ISSUED-1', proRedeemed: false};
    await assertFails(setDoc(doc(anon, 'partnerClaims', 'FREE'), {...claim, code: 'FREE'}));
    await assertFails(setDoc(doc(bob, 'partnerClaims', 'BOB-FREE'), {...claim, code: 'BOB-FREE'}));
    await assertSucceeds(setDoc(doc(founder, 'partnerClaims', 'ISSUED-1'), claim));
    await assertFails(getDoc(doc(bob, 'partnerClaims', 'ISSUED-1')));
    await assertFails(getDoc(doc(anon, 'partnerClaimEmails', 'alice@example.com')));
    await assertSucceeds(getDoc(doc(alice, 'partnerClaims', 'ISSUED-1')));
    await assertFails(updateDoc(doc(bob, 'partnerClaims', 'ISSUED-1'), {proRedeemed: true, redeemedUid: 'bob', redeemedAt: serverTimestamp()}));
    await assertFails(updateDoc(doc(pending, 'partnerClaims', 'ISSUED-1'), {proRedeemed: true, redeemedUid: 'pending', redeemedAt: serverTimestamp()}));
    await assertSucceeds(updateDoc(doc(alice, 'partnerClaims', 'ISSUED-1'), {proRedeemed: true, redeemedUid: 'alice', redeemedAt: serverTimestamp()}));
    await assertFails(updateDoc(doc(bob, 'users', 'bob'), {pro: true, proMethod: 'partner', proCode: 'ISSUED-1'}));
    await assertSucceeds(updateDoc(doc(alice, 'users', 'alice'), {pro: true, proMethod: 'partner', proCode: 'ISSUED-1'}));
    await assertFails(updateDoc(doc(anon, 'partnerships', 'NMIMS'), {claimed: 1, studentClaimed: 1}));
    await assertFails(setDoc(doc(anon, 'refSignups', 'RW-TEST__alice'), {code: 'RW-TEST', userUID: 'alice', at: serverTimestamp()}));
    await assertFails(setDoc(doc(bob, 'refSignups', 'RW-TEST__alice'), {code: 'RW-TEST', userUID: 'alice', at: serverTimestamp()}));
    await assertSucceeds(setDoc(doc(alice, 'refSignups', 'RW-TEST__alice'), {code: 'RW-TEST', userUID: 'alice', at: serverTimestamp()}));
    console.log('PASS: rules reject self-issued codes, wrong users, public indexes and forged referrals; preserve verified claimant redemption.');
  } finally {
    await env.cleanup();
  }
}
run().catch(err => { console.error(err); process.exitCode = 1; });
