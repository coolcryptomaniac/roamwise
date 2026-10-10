/* ============================================================================
   worker/handlers/invoices.js — POST /admin/invoices/sweep
   Admin-only: issue invoices for any verified payment that has none yet. The same sweep runs from the daily cron.
   ========================================================================= */
import { json } from '../lib/http.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { getDoc } from '../lib/firestore-rest.js';
import { sweepInvoices } from '../lib/invoice-sweep.js';

export async function handleInvoiceSweep(request, env) {
  let sa;
  try { sa = parseServiceAccount(env); } catch (e) { return json({ error: 'not_configured', message: 'Firebase service-account secret is required.' }, 501); }
  const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '');
  if (!m) return json({ error: 'unauthorized', message: 'Sign in to RoamWise Admin.' }, 401);
  let claims;
  try { claims = await verifyFirebaseIdToken(m[1], sa.project_id); } catch (e) { return json({ error: 'unauthorized', message: 'Admin sign-in expired.' }, 401); }
  const token = await getServiceAccountAccessToken(env);
  if (!(await getDoc(env, token, sa.project_id, 'admins/' + claims.uid))) return json({ error: 'forbidden', message: 'Founder/admin access required.' }, 403);
  try { return json(await sweepInvoices(env, token, sa.project_id)); }
  catch (e) { return json({ error: 'sweep_failed', message: String(e.message || e).slice(0, 200) }, 502); }
}

export async function runInvoiceSweepCron(env) {
  const sa = parseServiceAccount(env);
  return sweepInvoices(env, await getServiceAccountAccessToken(env), sa.project_id);
}
