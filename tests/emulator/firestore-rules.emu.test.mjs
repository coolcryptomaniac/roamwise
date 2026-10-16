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
test.after(async () => { await env.cleanup(); });
