/* ============================================================================
   worker/handlers/bot-admin.js — founder-only chat commands and the daily digest
   ============================================================================
   Lets the founder run routine admin from WhatsApp or Telegram:

     /admin statement [YYYY-MM]            commission statement summary
     /admin settle <code> <completed|cancelled|no_show> [amount]
     /admin leads                           property leads that arrived by chat
     /admin digest                          today's digest on demand

   Who counts as admin: ONLY chat ids / numbers listed in the Worker secrets
   BOT_ADMIN_WHATSAPP and BOT_ADMIN_TELEGRAM (comma separated). Anyone else gets
   the normal help text, never a hint that admin commands exist.

   No payment code: settling a stay only records what happened and the fee.
   ========================================================================= */
import { buildStatement, parseSettle, validMonth, DEFAULT_COMMISSION_PCT, DEFAULT_GST_PCT } from '../lib/stay-ledger-core.js';
import gstRules from '../../features/finance-tax/gst-rules.js';

const csv = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);

export function adminIds(env) {
  return { whatsapp: csv(env.BOT_ADMIN_WHATSAPP).map((x) => x.replace(/\D/g, '')), telegram: csv(env.BOT_ADMIN_TELEGRAM) };
}
export function isAdminChat(env, channel, chatId) {
  const ids = adminIds(env);
  return (channel === 'whatsapp' ? ids.whatsapp : ids.telegram).includes(String(chatId));
}

const money = (n) => 'Rs ' + Math.round(Number(n) || 0).toLocaleString('en-IN');
const monthNow = () => new Date().toISOString().slice(0, 7);

export async function statementText(env, deps, month) {
  const registered = env.RW_GST_REGISTERED === 'true';
  const rows = (await deps.list('stayLedger', 3000)).map((x) => ({ ...x, code: x.code || x.id }));
  const st = buildStatement(rows, month, { gstPct: registered ? DEFAULT_GST_PCT : 0 });
  if (!st.partners.length) return 'No stays recorded for ' + month + '.';
  const lines = st.partners.slice(0, 12).map((p) => '- ' + p.partnerId + ': ' + p.completed + ' completed, stays ' + money(p.gross) + ', fee ' + money(p.total)
    + (p.unreported ? ', ' + p.unreported + ' guest-confirmed but unreported' : '') + (p.conflicts ? ', ' + p.conflicts + ' conflict(s)' : ''));
  return 'Statement ' + month + (registered ? '' : ' (no GST on our fee: not registered yet)') + '\n' + lines.join('\n')
    + '\nTotal fee ' + money(st.totals.total) + ' on stays worth ' + money(st.totals.gross) + '. Flags to review: ' + st.flags.length + '.';
}

export async function leadsText(deps) {
  const leads = (await deps.list('botLeads', 200)).filter((l) => l.status !== 'closed')
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 10);
  if (!leads.length) return 'No open property leads.';
  return leads.map((l) => '- ' + (l.id || '?') + ': ' + l.name + ', ' + l.city + ', ' + l.rooms + ' rooms'
    + (l.gstin ? ', GSTIN ' + l.gstin + ' (format ok, not yet checked on portal)' : ', no GSTIN')
    + (l.contact ? ', wa.me/' + l.contact : '')).join('\n');
}

export async function buildDigest(env, deps, now) {
  now = now || new Date();
  const month = now.toISOString().slice(0, 7);
  const parts = ['RoamWise daily digest'];
  try {
    const leads = (await deps.list('botLeads', 200)).filter((l) => l.status !== 'closed');
    parts.push('Open property leads: ' + leads.length + (leads.length ? ' (send /admin leads)' : ''));
  } catch (_) { /* optional */ }
  try {
    const rows = (await deps.list('stayLedger', 3000)).map((x) => ({ ...x, code: x.code || x.id }));
    const st = buildStatement(rows, month, { gstPct: 0 });
    parts.push('This month: ' + st.totals.enquiries + ' enquiries, ' + st.totals.completed + ' completed, ' + st.totals.unreported + ' guest-confirmed but unreported, ' + st.totals.conflicts + ' conflicts.');
  } catch (_) { /* optional */ }
  const g = gstRules.reviewStatus(now);
  if (g.state !== 'ok') parts.push('GST rules review is ' + (g.state === 'overdue' ? 'OVERDUE' : 'due in ' + g.daysLeft + ' days') + ' (rules ' + g.rulesVersion + ').');
  return parts.join('\n');
}

export async function adminCommand(env, deps, args) {
  const sub = String(args[0] || '').toLowerCase();
  if (sub === 'statement') {
    const month = args[1] || monthNow();
    if (!validMonth(month)) return 'Use: /admin statement YYYY-MM';
    return statementText(env, deps, month);
  }
  if (sub === 'leads') return leadsText(deps);
  if (sub === 'digest') return buildDigest(env, deps);
  if (sub === 'settle') {
    const p = parseSettle({ code: String(args[1] || '').toUpperCase(), status: args[2], amount: args[3] });
    if (p.error) return 'Use: /admin settle <code> <completed|cancelled|no_show> [amount]  (' + p.error + ')';
    const v = p.value;
    const doc = await deps.getCode(v.code);
    if (!doc) return 'No such code. Record stays reported without a code from the admin page.';
    const patch = { status: v.status, settledAt: new Date().toISOString(), settledBy: 'admin' };
    if (v.amount != null) patch.amount = v.amount;
    patch.commissionPct = doc.commissionPct != null ? doc.commissionPct : DEFAULT_COMMISSION_PCT;
    await deps.updateCode(v.code, patch);
    return 'Recorded ' + v.code + ' as ' + v.status + (v.amount != null ? ' at ' + money(v.amount) : '') + '.';
  }
  return 'Admin commands: /admin statement [YYYY-MM], /admin settle <code> <completed|cancelled|no_show> [amount], /admin leads, /admin digest';
}

/* Daily digest to every configured admin chat. Called from the scheduled handler. */
export async function sendAdminDigest(env, deps, now) {
  const ids = adminIds(env);
  const text = await buildDigest(env, deps, now);
  const jobs = [];
  if (env.TELEGRAM_BOT_TOKEN) ids.telegram.forEach((id) => jobs.push(deps.fetch('https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/sendMessage', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: id, text }) })));
  if (env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID) ids.whatsapp.forEach((id) => jobs.push(deps.fetch('https://graph.facebook.com/v20.0/' + env.WHATSAPP_PHONE_NUMBER_ID + '/messages', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + env.WHATSAPP_TOKEN },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: id, type: 'text', text: { preview_url: false, body: text } }) })));
  await Promise.all(jobs.map((j) => j.catch(() => null)));
  return { sent: jobs.length, text };
}
