/* ============================================================================
   worker/handlers/partner-inform.js — auto-inform partners (People Hub engine)
   ============================================================================
   Hourly from the cron. Policy (Mohit, Nov 2026), decided by messageTier() in
   admin/people/people-core.mjs:
     perfect -> opted-in, perfect match (score 85+, ready): send now, any hour
                in the day window, even past the routine cap
     routine -> opted-in, normal update: once a day (10:30 IST batch), within
                PARTNER_DAILY_CAP (default 15)
     review  -> anything about money (cash asks), payouts, contracts, disputes
                or unverified identity: saved as a DRAFT in outbox/ for Mohit.
                When he marks it approved in the People Hub, the next run sends it.
     skip    -> no consent, no email, unsubscribed or declined
   Email goes out through mailer channel 'partner' (Brevo free 300/day, then the
   Gmail relay). Every mail is RoamWise-branded HTML with a plain-text twin and
   a signed one-click unsubscribe. The same match is never mailed twice (30-day
   KV key), and a person gets at most one routine mail a week.
   Switch: PARTNER_INFORM_ENABLED = "true" (anything else = dry run, drafts only).
   GET /partners/unsubscribe?c=<crmId>&t=<sig>   one-click opt-out (crm doc).
   Named exports only. */
import { json } from '../lib/http.js';
import { sendMail } from '../lib/mailer.js';
import { partnerEmail, firstName } from '../lib/partner-email.js';
import { signUnsub, verifyUnsub } from '../lib/reminder-core.js';
import { parseServiceAccount, getServiceAccountAccessToken } from '../lib/service-account.js';
import { getDoc, updateDoc, listDocs, queryEqualsString, createDocIfAbsent } from '../lib/firestore-rest.js';
import { buildRoster } from '../../creators/roster-core.mjs';
import { SEED_POLICIES, mergePolicies, policyFromPartner } from '../../creators/property-terms-core.mjs';
import { fromCreatorRow, messageTier } from '../../admin/people/people-core.mjs';

const DAY = 864e5;
const API = (env) => String(env.PUBLIC_API_BASE || 'https://roamwise-api.founder-f53.workers.dev').replace(/\/+$/, '');
const hourUtc = (now) => new Date(now).getUTCHours();
export const WINDOW_UTC = [3, 15];          /* 08:30–20:30 IST: no night mail */
export const ROUTINE_HOUR_UTC = 5;          /* 10:30 IST daily batch */
export const PERFECT_PER_RUN = 25;          /* safety ceiling, not a business cap */

/** Decide what (if anything) one creator row should receive. Pure. */
export function planFor(row, crm = {}){
  const person = fromCreatorRow(row);
  if (crm.emailOptOut) person.consent = false;
  const best = row.best;
  if (best && best.verdict !== 'no_fit') {
    const cashLine = ((best.terms && best.terms.lines) || []).find((l) => l.item === 'cash');
    const msg = { kind: 'match', score: best.score, verdict: best.verdict, amount: cashLine && cashLine.status !== 'ok' ? 1 : 0, propertyId: best.propertyId, propertyName: best.name };
    /* "needs a chat" matches stay a human job in the hub; cash asks become drafts */
    if (best.verdict === 'send' || msg.amount) return { person, msg, tier: messageTier(person, msg) };
  }
  if (!person.town) { const msg = { kind: 'profile' }; return { person, msg, tier: messageTier(person, msg) }; }
  return null;
}

export function defaultDeps(env){
  let tok = null, project = null;
  const auth = async () => { if (!tok) { project = parseServiceAccount(env).project_id; tok = await getServiceAccountAccessToken(env); } return [tok, project]; };
  return {
    async creators(){ const [t, p] = await auth(); return queryEqualsString(env, t, p, 'crm', 'seg', 'creator', 500); },
    async partners(){ const [t, p] = await auth(); return listDocs(env, t, p, 'partners', 300); },
    async policies(){ const [t, p] = await auth(); const d = await getDoc(env, t, p, 'config/creatorPolicies'); return d && Array.isArray(d.list) ? d.list : []; },
    async approved(){ const [t, p] = await auth(); return queryEqualsString(env, t, p, 'outbox', 'status', 'approved', 50); },
    async outbox(id, values){ const [t, p] = await auth(); return createDocIfAbsent(env, t, p, 'outbox', id, values); },
    async patch(path, values){ const [t, p] = await auth(); return updateDoc(env, t, p, path, values); },
    kvGet: (k) => env.RW_KV ? env.RW_KV.get(k) : null,
    kvPut: (k, v, ttl) => env.RW_KV ? env.RW_KV.put(k, v, { expirationTtl: ttl }) : null,
    send: (m) => sendMail(env, { ...m, channel: 'partner' }),
  };
}

async function hashId(s){ const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].slice(0, 12).map((x) => x.toString(16).padStart(2, '0')).join(''); }

export async function runPartnerInform(env, { deps, now = Date.now() } = {}){
  const h = hourUtc(now);
  if (h < WINDOW_UTC[0] || h > WINDOW_UTC[1]) return { skipped: 'night' };
  if (!deps && !env.FIREBASE_SERVICE_ACCOUNT_JSON) return { skipped: 'no service account' };
  const d = deps || defaultDeps(env);
  const live = String(env.PARTNER_INFORM_ENABLED || '').toLowerCase() === 'true';
  const cap = Math.max(0, Math.min(250, Number(env.PARTNER_DAILY_CAP) || 15));
  const today = new Date(now).toISOString().slice(0, 10), at = new Date(now).toISOString();
  const out = { live, sent: 0, perfect: 0, routine: 0, drafts: 0, approvedSent: 0, skipped: 0, failed: 0 };
  const capKey = 'inform:count:' + today;
  let used = Number(await d.kvGet(capKey)) || 0;

  const deliver = async (person, msg, crmId) => {
    const unsubUrl = env.EMAIL_UNSUB_SECRET ? `${API(env)}/partners/unsubscribe?c=${encodeURIComponent(crmId)}&t=${await signUnsub(env.EMAIL_UNSUB_SECRET, 'crm:' + crmId)}` : '';
    const mail = partnerEmail({ kind: msg.kind, name: person.name, propertyName: msg.propertyName, unsubUrl, now: new Date(now) });
    return { mail, res: live ? await d.send({ to: person.email, subject: mail.subject, html: mail.html, text: mail.text, unsubUrl }) : { ok: false, reason: 'dry_run' } };
  };

  /* 1. drafts Mohit approved in the People Hub */
  for (const m of (live ? await d.approved().catch(() => []) : [])) {
    if (!m.email || !m.crmId) continue;
    const { res } = await deliver({ name: m.toName, email: m.email }, { kind: m.kind, propertyName: m.propertyName }, m.crmId);
    await d.patch('outbox/' + m.id, { status: res.ok ? 'sent' : 'failed', sentAt: at, provider: res.provider || '' });
    if (res.ok) out.approvedSent++; else out.failed++;
  }

  /* 2. new matches and profile nudges */
  const [apps, partners, override] = await Promise.all([d.creators(), d.partners().catch(() => []), d.policies().catch(() => [])]);
  const policies = mergePolicies(mergePolicies(SEED_POLICIES, override), partners.filter((p) => p.creatorMatching && p.creatorMatching.enabled).map((p) => policyFromPartner(p.id, p)));
  const byId = new Map(apps.map((a) => [a.id, a]));
  const plans = buildRoster(apps, policies).map((r) => planFor(r, byId.get(r.id))).filter(Boolean);
  plans.sort((a, b) => ({ perfect: 0, review: 1, routine: 2, skip: 3 }[a.tier] - { perfect: 0, review: 1, routine: 2, skip: 3 }[b.tier]));
  let perfectThisRun = 0;
  for (const { person, msg, tier } of plans) {
    if (tier === 'skip') { out.skipped++; continue; }
    const crmId = person.id.split(':')[1];
    const matchKey = 'inform:m:' + await hashId(person.email + '|' + msg.kind + '|' + (msg.propertyId || ''));
    if (await d.kvGet(matchKey)) continue;
    const weekKey = 'inform:p:' + await hashId(person.email);
    if (tier === 'routine' && (h !== ROUTINE_HOUR_UTC || used >= cap || await d.kvGet(weekKey))) continue;
    if (tier === 'perfect' && perfectThisRun >= PERFECT_PER_RUN) continue;
    const id = today.replace(/-/g, '') + '-' + matchKey.slice(-12);
    if (tier === 'review' || !live) {
      const mail = partnerEmail({ kind: msg.kind, name: person.name, propertyName: msg.propertyName, now: new Date(now) });
      await d.outbox(id, { status: 'draft', tier, kind: msg.kind, crmId, toName: firstName(person.name), email: person.email, propertyName: msg.propertyName || '', subject: mail.subject, reason: tier === 'review' ? 'money or identity: needs Mohit' : 'dry run', createdAt: at, channel: 'email' }).catch(() => null);
      await d.kvPut(matchKey, 'draft', 30 * 86400);
      out.drafts++; continue;
    }
    const { mail, res } = await deliver(person, msg, crmId);
    await d.outbox(id, { status: res.ok ? 'sent' : 'failed', tier, kind: msg.kind, crmId, toName: firstName(person.name), propertyName: msg.propertyName || '', subject: mail.subject, provider: res.provider || '', reason: res.ok ? '' : res.reason, createdAt: at, channel: 'email' }).catch(() => null);
    if (!res.ok) { out.failed++; if (res.reason === 'cap') break; continue; }
    out.sent++; out[tier]++;
    await d.kvPut(matchKey, 'sent', 30 * 86400);
    await d.kvPut(weekKey, '1', 7 * 86400);
    if (tier === 'routine') { used++; await d.kvPut(capKey, String(used), 2 * 86400); } else perfectThisRun++;
    await d.patch('crm/' + crmId, { lastContactAt: at, ...(person.stage === 'new' ? { stage: 'contacted' } : {}) }).catch(() => null);
  }
  return out;
}

export async function handlePartnerUnsubscribe(request, env){
  const url = new URL(request.url), c = url.searchParams.get('c') || '', t = url.searchParams.get('t') || '';
  const page = (msg) => new Response(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>RoamWise</title><body style="font-family:Arial,sans-serif;max-width:520px;margin:60px auto;padding:0 20px;color:#1d1d1f"><h2 style="color:#8a5a14">RoamWise</h2><p>${msg}</p></body>`, { headers: { 'content-type': 'text/html;charset=utf-8' } });
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(c) || !env.EMAIL_UNSUB_SECRET || !(await verifyUnsub(env.EMAIL_UNSUB_SECRET, 'crm:' + c, t))) return page('This unsubscribe link is not valid.');
  try {
    const tok = await getServiceAccountAccessToken(env);
    await updateDoc(env, tok, parseServiceAccount(env).project_id, 'crm/' + c, { emailOptOut: true, emailOptOutAt: new Date().toISOString() });
  } catch (_) { return page('Could not update right now. Email support@roamwise.co.in and we will do it for you.'); }
  if (request.method === 'POST') return json({ ok: true });
  return page('You are unsubscribed. RoamWise will not send you collaboration emails again.');
}
