/* ============================================================================
   worker/handlers/partner-self-list.js — a property lists itself after signing
   ============================================================================
   POST /partner/self-list   Authorization: Bearer <Firebase ID token>

   Called by /partner/join/ right after the host saves the form (and again when
   they press "Check again"). The Worker, not the browser, decides:
     1. reads partners/{uid} with the service account (the host cannot fake it here);
     2. runs the automatic checks in lib/partner-self-list-core.js;
     3. records MOU evidence (IP, browser, verified email, content hash) in
        mouEvidence/{uid} — admin-read-only, never client-writable;
     4. if every check passes, adds a NEW · ENQUIRY-ONLY entry to config/partners,
        which the homepage, Stay & do, the map, the stays hub and Tusk already read.

   NO PAYMENT CODE. Self-listed properties cannot take payments, show prices or
   carry the signed-partner badge. Turning on payments stays a founder action
   (partner admin → Approve → Trust audit), unchanged. */
import { json } from '../lib/http.js';
import { overLimit, clientIp } from '../lib/rate-limit.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { getDoc, updateDoc, queryEqualsString } from '../lib/firestore-rest.js';
import { assess, publicEntry, mergeEntry, evidence, indianMobile, SELF_LIST_VERSION } from '../lib/partner-self-list-core.js';

/* Full 64-character SHA-256 (the rate limiter's helper is shortened on purpose; evidence must not be). */
async function sha256Full(text) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text)));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function realDeps(env) {
  let sa = null, tokenP = null;
  const project = () => (sa = sa || parseServiceAccount(env)).project_id;
  const token = () => (tokenP = tokenP || getServiceAccountAccessToken(env));
  return {
    configured: () => !!env.FIREBASE_SERVICE_ACCOUNT_JSON,
    async verify(idToken) { return verifyFirebaseIdToken(idToken, project()); },
    async get(path) { return getDoc(env, await token(), project(), path); },
    async patch(path, values) { return updateDoc(env, await token(), project(), path, values); },
    async byPhone(phone) { return queryEqualsString(env, await token(), project(), 'partners', 'phone', phone, 20); },
  };
}

export async function handlePartnerSelfList(request, env, deps, cacheImpl) {
  deps = deps || realDeps(env);
  if (request.method !== 'POST') return json({ error: 'not found' }, 404);
  if (!deps.configured()) return json({ error: 'not_configured', message: 'Self-listing is not switched on yet. RoamWise will review your property by hand.' }, 501);
  const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '');
  if (!m) return json({ error: 'unauthorized', message: 'Sign in again, then press "Check again".' }, 401);
  let claims;
  try { claims = await deps.verify(m[1]); } catch (_) { return json({ error: 'unauthorized', message: 'Your sign-in expired. Sign in again.' }, 401); }
  const uid = claims.uid;
  if (await overLimit('self-list-uid', uid, 6, 3600, cacheImpl)) return json({ error: 'slow_down', message: 'Please wait a few minutes before checking again.' }, 429);
  if (await overLimit('self-list-ip', clientIp(request), 10, 3600, cacheImpl)) return json({ error: 'slow_down', message: 'Too many checks from this network. Try again later.' }, 429);

  const p = await deps.get(`partners/${uid}`);
  if (!p) return json({ error: 'no_application', message: 'We could not find your application. Please submit the form first.' }, 404);
  if (p.status === 'suspended' || p.operationsLocked === true) return json({ ok: false, listed: false, held: true, message: 'This property is paused. RoamWise will contact you.' });

  const cfg = (await deps.get('config/partners')) || {};
  const existing = Array.isArray(cfg.list) ? cfg.list : [];
  const phone = indianMobile(p.phone || p.ownerWa);
  let phoneOwners = [];
  if (phone) {
    try { phoneOwners = (await deps.byPhone(p.phone || p.ownerWa)).map((r) => r.id); } catch (_) { phoneOwners = []; }
  }
  const result = assess(p, uid, { emailVerified: claims.email_verified === true, existing, phoneOwners });
  const now = new Date().toISOString();

  /* Evidence first: even a failed check leaves a record of what was signed and from where. */
  const on = p.onboarding || {};
  const hash = await sha256Full([uid, on.mouVersion, on.mouSignedName, on.mouAcceptedAt, p.name, p.zone, p.ownerName].join('|'));
  await deps.patch(`mouEvidence/${uid}`, evidence(p, uid, {
    now, ip: clientIp(request), ua: request.headers.get('user-agent') || '',
    email: claims.email || '', emailVerified: claims.email_verified === true, hash,
  }));

  const summary = { version: SELF_LIST_VERSION, checkedAt: now, pass: result.pass, hold: result.hold,
    failed: result.checks.filter((c) => !c.ok).map((c) => c.id) };

  if (!result.pass) {
    await deps.patch(`selfListing/${uid}`, { ...summary, listed: false });
    return json({ ok: true, listed: false, held: result.hold, checks: result.checks });
  }

  const entry = publicEntry(p, uid, now);
  const merged = mergeEntry(existing, entry);
  if (!merged.changed) {
    await deps.patch(`selfListing/${uid}`, { ...summary, listed: false, hold: true, failed: ['owned_elsewhere'] });
    return json({ ok: true, listed: false, held: true, message: 'This listing is managed by RoamWise. We will contact you.', checks: result.checks });
  }
  await deps.patch('config/partners', { list: merged.list, updatedAt: now });
  await deps.patch(`selfListing/${uid}`, { ...summary, listed: true, listingId: entry.id });
  return json({ ok: true, listed: true, id: entry.id, checks: result.checks });
}
