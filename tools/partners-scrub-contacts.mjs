// Removes host contact details from the PUBLIC partner list (Firestore config/partners, readable by anyone).
// Guests book and pay through RoamWise only (8 Nov 2026), so the list needs a booking mode, never a number.
// Owners' numbers stay where the admin keeps them: partners/{id} (admin-only).
//
//   FIREBASE_SERVICE_ACCOUNT_JSON=... node tools/partners-scrub-contacts.mjs [--dry-run]
// Run by .github/workflows/partners-scrub.yml. Prints counts only, never a number.
import { getServiceAccountAccessToken, parseServiceAccount } from '../worker/lib/service-account.js';
import { getDoc, updateDoc } from '../worker/lib/firestore-rest.js';

const PROJECT = 'roamwisepro';
const CONTACT_FIELDS = ['bookingWhatsapp', 'bookingPhone', 'bookingUrl', 'bookingOtaName', 'phone', 'ownerWa', 'ownerPhone', 'whatsapp'];

/* Pure: returns { list, removed } with every contact field dropped and any open booking mode set to 'roamwise'. */
export function scrubList(list) {
  let removed = 0;
  const out = (Array.isArray(list) ? list : []).map((entry) => {
    if (!entry || typeof entry !== 'object') return entry;
    const e = { ...entry };
    for (const f of CONTACT_FIELDS) if (f in e) { delete e[f]; removed += 1; }
    if (e.bookingMode && e.bookingMode !== 'direct' && e.bookingMode !== 'enquiry') e.bookingMode = 'roamwise';
    return e;
  });
  return { list: out, removed };
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  const env = { FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT };
  const sa = parseServiceAccount(env);
  if (sa.project_id !== PROJECT) throw new Error('service account is not for ' + PROJECT);
  const token = await getServiceAccountAccessToken(env);
  const doc = await getDoc(env, token, PROJECT, 'config/partners');
  if (!doc || !Array.isArray(doc.list)) { console.log('config/partners has no list; nothing to do.'); return; }
  const { list, removed } = scrubList(doc.list);
  console.log('entries:', list.length, '· contact fields to remove:', removed, '· modes:', list.map((e) => e && e.bookingMode || '-').join(','));
  if (dry || !removed) return;
  await updateDoc(env, token, PROJECT, 'config/partners', { list, updatedAt: new Date().toISOString() });
  const after = await getDoc(env, token, PROJECT, 'config/partners');
  const left = scrubList(after && after.list).removed;
  console.log('after: contact fields left =', left);
  if (left) process.exit(1);
}

if (import.meta.url === 'file://' + process.argv[1]) {
  main().catch((e) => { console.error('partners-scrub failed:', e.message); process.exit(1); });
}
