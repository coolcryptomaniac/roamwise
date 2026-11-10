/* Real Firestore rules tests (emulator). Run: npm run rules:test
   Needs Java + firebase-tools; not part of `npm test` so the default suite stays offline. */
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteField, serverTimestamp, increment } from 'firebase/firestore';
import fs from 'node:fs';
import test from 'node:test';

const env = await initializeTestEnvironment({
  projectId: 'roamwise-rules-test',
  firestore: { rules: fs.readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') }
});
await env.withSecurityRulesDisabled(async ctx => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'admins/adminUid'), { ok: true });
  await setDoc(doc(db, 'users/u1'), { name: 'U One' });
  await setDoc(doc(db, 'staff/staff1'), { role: 'marketing' });
  await setDoc(doc(db, 'stayLeads/L1'), { name: 'Asha', phone: '9876543210', status: 'new', waConsent: true });
  await setDoc(doc(db, 'tuskMisses/kasar'), { place: 'Kasar', count: 3, lastAsked: new Date() });
});
const u1 = () => env.authenticatedContext('u1').firestore();
const u2 = () => env.authenticatedContext('u2').firestore();
const admin = () => env.authenticatedContext('adminUid').firestore();
const anon = () => env.unauthenticatedContext().firestore();

test('Tusk memory sync: owner can store a bounded string, replace it and delete it', async () => {
  await assertSucceeds(setDoc(doc(u1(), 'users/u1'), { tuskMemory: '{"v":1}', tuskMemoryAt: serverTimestamp() }, { merge: true }));
  await assertSucceeds(setDoc(doc(u1(), 'users/u1'), { tuskMemory: 'x'.repeat(20000) }, { merge: true }));
  await assertSucceeds(updateDoc(doc(u1(), 'users/u1'), { tuskMemory: deleteField(), tuskMemoryAt: deleteField() }));
});
test('Tusk memory sync: too big, wrong type, or someone else is refused', async () => {
  await assertFails(setDoc(doc(u1(), 'users/u1'), { tuskMemory: 'x'.repeat(20001) }, { merge: true }));
  await assertFails(setDoc(doc(u1(), 'users/u1'), { tuskMemory: { a: 1 } }, { merge: true }));
  await assertFails(setDoc(doc(u2(), 'users/u1'), { tuskMemory: 'hi' }, { merge: true }));
});
test('regression: users still cannot grant themselves Pro', async () => {
  await assertFails(setDoc(doc(u1(), 'users/u1'), { pro: true }, { merge: true }));
  await assertSucceeds(setDoc(doc(u1(), 'users/u1'), { homeCity: 'Almora' }, { merge: true }));
});
test('tuskMisses: signed-in counter moves +1 with the exact shape; everything else is refused', async () => {
  await assertSucceeds(setDoc(doc(u1(), 'tuskMisses/new-place'), { place: 'New Place', count: increment(1), lastAsked: serverTimestamp() }, { merge: true }));
  await assertSucceeds(setDoc(doc(u1(), 'tuskMisses/kasar'), { place: 'Kasar', count: increment(1), lastAsked: serverTimestamp() }, { merge: true }));
  await assertFails(setDoc(doc(u1(), 'tuskMisses/kasar'), { place: 'Kasar', count: 99, lastAsked: serverTimestamp() }, { merge: true }));
  await assertFails(setDoc(doc(u1(), 'tuskMisses/other'), { place: 'x'.repeat(81), count: 1, lastAsked: serverTimestamp() }));
  await assertFails(setDoc(doc(u1(), 'tuskMisses/other'), { place: 'ok', count: 1, lastAsked: serverTimestamp(), extra: 1 }));
  await assertFails(setDoc(doc(anon(), 'tuskMisses/other'), { place: 'ok', count: 1, lastAsked: serverTimestamp() }));
  await assertFails(getDoc(doc(u1(), 'tuskMisses/kasar')));
  await assertSucceeds(getDoc(doc(admin(), 'tuskMisses/kasar')));
});
test('trip notification switches: public read, admin-only write', async () => {
  const p = 'config/tripNotifySettings';
  await assertFails(setDoc(doc(u1(), p), { ackEmail: true }));
  await assertSucceeds(setDoc(doc(admin(), p), { ackEmail: true, reminders: true, maxEmailsPerRun: 40 }));
  await assertSucceeds(getDoc(doc(anon(), p)));
});
test('roomBookings stay private to the guest, partner and admin', async () => {
  await env.withSecurityRulesDisabled(async ctx => { await setDoc(doc(ctx.firestore(), 'roomBookings/r1'), { guestUid: 'u1', partnerUid: 'p1', status: 'requested' }); });
  await assertSucceeds(getDoc(doc(u1(), 'roomBookings/r1')));
  await assertFails(getDoc(doc(u2(), 'roomBookings/r1')));
  await assertFails(updateDoc(doc(u1(), 'roomBookings/r1'), { ackEmailAt: 'x' }));
});
test('stayLeads: nobody but an admin can read, clients can never write, admin can only move the status', async () => {
  await assertFails(getDoc(doc(u1(), 'stayLeads/L1')));
  await assertFails(getDoc(doc(anon(), 'stayLeads/L1')));
  await assertFails(setDoc(doc(anon(), 'stayLeads/L2'), { name: 'x', phone: '9876543210' }));
  await assertFails(setDoc(doc(u1(), 'stayLeads/L2'), { name: 'x', phone: '9876543210' }));
  await assertSucceeds(getDoc(doc(admin(), 'stayLeads/L1')));
  await assertSucceeds(updateDoc(doc(admin(), 'stayLeads/L1'), { status: 'contacted', contactedAt: '2026-10-16T10:00:00Z' }));
  await assertFails(updateDoc(doc(admin(), 'stayLeads/L1'), { phone: '9000000000' }));
  await assertFails(updateDoc(doc(u1(), 'stayLeads/L1'), { status: 'contacted' }));
});
test('leads call log: staff can log a call as themselves, nobody else, exact shape', async () => {
  const s = () => env.authenticatedContext('staff1').firestore();
  const rec = { name: 'Hotel X', town: 'Almora', status: 'contacted', by: 'staff1', byName: 'S', at: '2026-10-16' };
  await assertSucceeds(setDoc(doc(s(), 'leads/c1'), rec));
  await assertFails(setDoc(doc(s(), 'leads/c2'), { ...rec, by: 'someoneElse' }));
  await assertFails(setDoc(doc(s(), 'leads/c3'), { ...rec, phone: '9876543210' }));
  await assertFails(setDoc(doc(u1(), 'leads/c4'), { ...rec, by: 'u1' }));
  await assertFails(getDoc(doc(s(), 'leads/c1')));
  await assertSucceeds(getDoc(doc(admin(), 'leads/c1')));
});
/* ---- B2B desk (staff/b2b-desk.js): b2bDeals + b2bTxns ---- */
const b2b = () => env.authenticatedContext('b2b1').firestore();
const b2bOther = () => env.authenticatedContext('b2b2').firestore();
const DEAL = { ownerUid: 'b2b1', ownerName: 'D', name: 'Pine Nest', kind: 'stay', city: 'Almora', contact: 'Asha', phone: '9876543210', email: '', plan: 'free', bookingModel: 'commission', listingFee: 0, note: '', nextAt: '', stage: 'lead', createdAt: 'x', updatedAt: 'x' };
const TXN = { dealId: 'd1', dealName: 'Pine Nest', enteredBy: 'b2b1', enteredByName: 'D', kind: 'plan_fee', method: 'upi', amount: 2499, ref: '123456789012', proofUrl: '', date: '2026-11-10', note: '', status: 'reported', at: 'x' };
test('b2bDeals: B2B staff create and work only their own deals; others see nothing', async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'staff/b2b1'), { role: 'partnerships' });
    await setDoc(doc(ctx.firestore(), 'staff/b2b2'), { role: 'staff', roles: ['staff', 'bd'] });
  });
  await assertSucceeds(setDoc(doc(b2b(), 'b2bDeals/d1'), DEAL));
  await assertSucceeds(getDoc(doc(b2b(), 'b2bDeals/d1')));
  await assertSucceeds(getDoc(doc(admin(), 'b2bDeals/d1')));
  await assertFails(getDoc(doc(b2bOther(), 'b2bDeals/d1')));
  await assertFails(getDoc(doc(u1(), 'b2bDeals/d1')));
  await assertFails(getDoc(doc(anon(), 'b2bDeals/d1')));
  await assertFails(setDoc(doc(u1(), 'b2bDeals/x1'), { ...DEAL, ownerUid: 'u1' }));
  const marketing = env.authenticatedContext('staff1').firestore();
  await assertFails(setDoc(doc(marketing, 'b2bDeals/x2'), { ...DEAL, ownerUid: 'staff1' }));
  await assertFails(setDoc(doc(b2b(), 'b2bDeals/x3'), { ...DEAL, ownerUid: 'b2b2' }));
  await assertSucceeds(setDoc(doc(b2bOther(), 'b2bDeals/d2'), { ...DEAL, ownerUid: 'b2b2' }));
});
test('b2bDeals: staff cannot create or mark a deal signed, countersigned or live, or forge a signature', async () => {
  await assertFails(setDoc(doc(b2b(), 'b2bDeals/x4'), { ...DEAL, stage: 'mou_signed' }));
  await assertFails(setDoc(doc(b2b(), 'b2bDeals/x5'), { ...DEAL, mouSignedAt: '2026-11-10' }));
  await assertFails(setDoc(doc(b2b(), 'b2bDeals/x6'), { ...DEAL, listingFee: 20000 }));
  await assertSucceeds(updateDoc(doc(b2b(), 'b2bDeals/d1'), { stage: 'mou_sent', mouToken: 'a'.repeat(32), mouSentAt: 'x', updatedAt: 'y' }));
  await assertFails(updateDoc(doc(b2b(), 'b2bDeals/d1'), { stage: 'mou_signed' }));
  await assertFails(updateDoc(doc(b2b(), 'b2bDeals/d1'), { stage: 'live' }));
  await assertFails(updateDoc(doc(b2b(), 'b2bDeals/d1'), { mouSignedAt: 'x', mouSignedBy: 'Me' }));
  await assertFails(updateDoc(doc(b2b(), 'b2bDeals/d1'), { ownerUid: 'b2b2' }));
  await assertFails(updateDoc(doc(b2bOther(), 'b2bDeals/d1'), { note: 'mine now' }));
  await assertSucceeds(updateDoc(doc(b2b(), 'b2bDeals/d1'), { mouSignedLink: 'https://roamwise.co.in/partner/mou/?s=A', updatedAt: 'z' }));
});
test('b2bTxns: staff only add reported money on their own deal; only an admin verifies; rows are evidence', async () => {
  await assertSucceeds(setDoc(doc(b2b(), 'b2bTxns/t1'), TXN));
  await assertFails(setDoc(doc(b2b(), 'b2bTxns/t2'), { ...TXN, status: 'verified' }));
  await assertFails(setDoc(doc(b2b(), 'b2bTxns/t3'), { ...TXN, amount: 600000 }));
  await assertFails(setDoc(doc(b2b(), 'b2bTxns/t4'), { ...TXN, enteredBy: 'b2b2' }));
  await assertFails(setDoc(doc(b2b(), 'b2bTxns/t5'), { ...TXN, dealId: 'd2' }));
  await assertFails(setDoc(doc(b2b(), 'b2bTxns/t6'), { ...TXN, decidedBy: 'b2b1' }));
  await assertFails(updateDoc(doc(b2b(), 'b2bTxns/t1'), { status: 'verified' }));
  await assertFails(updateDoc(doc(b2b(), 'b2bTxns/t1'), { amount: 1 }));
  await assertSucceeds(getDoc(doc(b2b(), 'b2bTxns/t1')));
  await assertFails(getDoc(doc(b2bOther(), 'b2bTxns/t1')));
  await assertSucceeds(updateDoc(doc(admin(), 'b2bTxns/t1'), { status: 'verified', decidedBy: 'adminUid' }));
});
test('b2bDeals: once signed (written by the Worker) the deal is frozen for staff; admin finishes it', async () => {
  await env.withSecurityRulesDisabled(async ctx => { await updateDoc(doc(ctx.firestore(), 'b2bDeals/d1'), { stage: 'mou_signed', mouSignedAt: '2026-11-10T06:30:00.000Z', mouSignedBy: 'Asha' }); });
  await assertFails(updateDoc(doc(b2b(), 'b2bDeals/d1'), { note: 'edit after signing' }));
  await assertFails(updateDoc(doc(b2b(), 'b2bDeals/d1'), { stage: 'lead' }));
  await assertSucceeds(getDoc(doc(b2b(), 'b2bDeals/d1')));
  await assertSucceeds(updateDoc(doc(admin(), 'b2bDeals/d1'), { stage: 'countersigned' }));
});
test.after(async () => { await env.cleanup(); });
