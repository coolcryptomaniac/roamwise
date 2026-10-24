/* Outbound email guard for every automated RoamWise email (creator outreach and the daily team update).
   Pure functions plus a small CLI so a scheduled task can run it before each send and stop on a non-zero exit:

     node tools/outreach/mail-guard.mjs outreach message.json <campaign-id>
     node tools/outreach/mail-guard.mjs team message.json

   message.json = { "to": ["a@b.com"], "cc": [], "bcc": [], "subject": "...", "body": "..." }

   It is a last line of defence, not a substitute for judgement: it blocks what it can recognise (money and funding talk,
   people's salaries, secrets, stray phone numbers, extra recipients, wrong subject or signature). A blocked message is never
   "fixed up" and sent anyway: the task must rewrite it or skip the send and report why. */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const FOUNDER = Object.freeze({ name: 'Mohit Pandey', title: 'Founder, RoamWise' });
export const SUPPORT = 'support@roamwise.co.in';
const SITE_HOSTS = ['roamwise.co.in', 'www.roamwise.co.in'];

/* Words that mean confidential business, money or security detail. Matched as whole words, case-insensitive. */
const CONFIDENTIAL_WORDS = ['burn', 'runway', 'valuation', 'cap table', 'equity', 'esop', 'investor', 'investors', 'angel', 'commitment', 'commitments',
  'pledge', 'pledged', 'fundraise', 'fundraising', 'term sheet', 'revenue', 'salary', 'salaries', 'stipend', 'payroll', 'profit', 'loss', 'password', 'passcode',
  'otp', 'api key', 'secret', 'token', 'keystore', 'service account', 'firestore', 'bank account', 'ifsc', 'aadhaar', 'pan card', 'gstin'];
const SECRET_PATTERNS = [
  ['api key', /\bAIza[0-9A-Za-z_-]{20,}\b/], ['api key', /\bsk-[A-Za-z0-9_-]{16,}\b/], ['github token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/], ['slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/],
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/], ['aadhaar-like number', /\b\d{4}\s?\d{4}\s?\d{4}\b/], ['gstin', /\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/], ['pan', /\b[A-Z]{5}\d{4}[A-Z]\b/],
];
const MONEY = /(?:₹|\brs\.?\s?|\binr\s?|\$|\busd\s?)\s?\d|\b\d[\d,.]*\s?(?:k|l|lakh|lakhs|cr|crore|crores|million|mn)\b(?=\s|[.,;:)]|$)/i;
const PROMISE = /\b(?:free|complimentary|paid|payment|commission|discount|stipend|barter|guarantee|guaranteed)\b/i;
const PHONE = /(?:\+?91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/g;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const URL_RE = /\bhttps?:\/\/[^\s)>\]"']+/gi;

const digits = (s) => String(s || '').replace(/\D/g, '');
const lower = (s) => String(s || '').toLowerCase();
const wordHit = (text, w) => new RegExp('(^|[^a-z0-9])' + w.replace(/ /g, '\\s+') + '([^a-z0-9]|$)', 'i').test(text);

/** Everything in `text` that looks confidential. allow = { phones: [digits...], emails: [addr...] } */
export function scan(text, allow = {}) {
  const t = String(text || ''), out = [];
  CONFIDENTIAL_WORDS.forEach((w) => { if (wordHit(t, w)) out.push({ rule: 'confidential-word', match: w }); });
  SECRET_PATTERNS.forEach(([rule, re]) => { const m = t.match(re); if (m) out.push({ rule, match: m[0].slice(0, 12) + '…' }); });
  const okPhones = (allow.phones || []).map(digits);
  (t.match(PHONE) || []).forEach((p) => { const d = digits(p).slice(-10); if (!okPhones.some((o) => o.endsWith(d))) out.push({ rule: 'phone-number', match: p.trim() }); });
  const okMail = (allow.emails || []).map(lower);
  (t.match(EMAIL) || []).forEach((e) => { if (!okMail.includes(lower(e))) out.push({ rule: 'email-address', match: e }); });
  return out;
}

function urlProblems(text) {
  return (String(text || '').match(URL_RE) || []).filter((u) => { try { return !SITE_HOSTS.includes(new URL(u).hostname); } catch (_) { return true; } }).map((u) => ({ rule: 'external-link', match: u }));
}
const recipients = (m) => [].concat(m.to || []).filter(Boolean);
const signature = (body) => { const tail = String(body || '').trim().split(/\n/).map((l) => l.trim()).filter(Boolean).slice(-8).join('\n'); return tail; };

function result(problems) { return { ok: problems.length === 0, problems }; }

/** Creator outreach: one creator, the template's shape, the business's own WhatsApp only, no money or promise language. */
export function checkOutreach(m, campaign) {
  const p = [], body = String(m && m.body || ''), subject = String(m && m.subject || '');
  if (!m || typeof m !== 'object') return result([{ rule: 'no-message', match: '' }]);
  if (!campaign || !campaign.id) p.push({ rule: 'unknown-campaign', match: '' });
  if (recipients(m).length !== 1) p.push({ rule: 'recipients', match: 'exactly one recipient is allowed, got ' + recipients(m).length });
  if ((m.cc || []).length || (m.bcc || []).length) p.push({ rule: 'cc-bcc', match: 'CC and BCC are never used' });
  if (!/^Collab with .{2,60}, .{2,60} \(via RoamWise\)$/.test(subject)) p.push({ rule: 'subject-format', match: subject.slice(0, 80) });
  if (!/^Hi [^\n,]{1,40},\n/.test(body)) p.push({ rule: 'greeting', match: 'must start with "Hi <first name>,"' });
  if (campaign && campaign.business && !body.includes(campaign.business)) p.push({ rule: 'business-missing', match: campaign.business });
  const wa = campaign && digits(campaign.whatsapp);
  if (!wa || wa.length < 10) p.push({ rule: 'campaign-whatsapp', match: 'campaign has no WhatsApp number' });
  else if (!digits(body).includes(wa.slice(-10))) p.push({ rule: 'whatsapp-missing', match: 'the business WhatsApp number must be in the email' });
  if (!/reply\s+"?no"?/i.test(body)) p.push({ rule: 'opt-out', match: 'opt-out line missing' });
  if (!/https:\/\/www\.roamwise\.co\.in\/creators\/match\.html\?role=creator&invite=founding/.test(body)) p.push({ rule: 'signup-link', match: 'creator signup link missing' });
  if (!signature(body).includes(FOUNDER.name) || !signature(body).includes(FOUNDER.title)) p.push({ rule: 'signature', match: 'must end with ' + FOUNDER.name + ', ' + FOUNDER.title });
  if (body.length > 1600) p.push({ rule: 'length', match: body.length + ' characters' });
  const all = subject + '\n' + body;
  p.push(...scan(all, { phones: [wa || ''], emails: [SUPPORT] }), ...urlProblems(all));
  if (MONEY.test(all)) p.push({ rule: 'money', match: 'amounts are agreed directly with the business, never in this email' });
  const pm = all.match(PROMISE); if (pm) p.push({ rule: 'promise', match: pm[0] });
  return result(p);
}

/** Daily team update: the company inbox only, a dated subject, no money, funding, salaries, contact details or secrets. */
export function checkTeamUpdate(m) {
  const p = [], body = String(m && m.body || ''), subject = String(m && m.subject || '');
  if (!m || typeof m !== 'object') return result([{ rule: 'no-message', match: '' }]);
  const to = recipients(m).map(lower);
  if (to.length !== 1 || to[0] !== SUPPORT) p.push({ rule: 'recipients', match: 'only ' + SUPPORT + ' may receive the daily update' });
  if ((m.cc || []).length || (m.bcc || []).length) p.push({ rule: 'cc-bcc', match: 'CC and BCC are never used' });
  if (!/^RoamWise Daily Update \| \d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/.test(subject)) p.push({ rule: 'subject-format', match: subject.slice(0, 80) });
  if (!/^Team,\n/.test(body)) p.push({ rule: 'greeting', match: 'must start with "Team,"' });
  const tail = signature(body);
  if (!/On behalf of Mohit Pandey, Founder/.test(tail)) p.push({ rule: 'signature', match: 'must be signed "On behalf of Mohit Pandey, Founder"' });
  if (!/Internal/i.test(tail)) p.push({ rule: 'footer', match: 'confidentiality footer missing' });
  const all = subject + '\n' + body;
  p.push(...scan(all, { phones: [], emails: [SUPPORT] }), ...urlProblems(all));
  if (MONEY.test(all)) p.push({ rule: 'money', match: 'no rupee, dollar or lakh/crore amounts in the team update' });
  return result(p);
}

/* CLI */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , kind, file, campaignId] = process.argv;
  try {
    const m = JSON.parse(readFileSync(file, 'utf8'));
    let r;
    if (kind === 'outreach') {
      const { campaigns } = JSON.parse(readFileSync(new URL('../../outreach/campaigns.json', import.meta.url), 'utf8'));
      r = checkOutreach(m, campaigns.find((c) => c.id === campaignId));
    } else if (kind === 'team') r = checkTeamUpdate(m);
    else { console.error('usage: mail-guard.mjs outreach|team message.json [campaign-id]'); process.exit(2); }
    if (r.ok) { console.log('OK: safe to send'); process.exit(0); }
    console.error('BLOCKED. Do not send. Rewrite or skip:'); r.problems.forEach((x) => console.error(' - ' + x.rule + ': ' + x.match)); process.exit(1);
  } catch (e) { console.error('guard error: ' + e.message + ' (treat as BLOCKED)'); process.exit(2); }
}
