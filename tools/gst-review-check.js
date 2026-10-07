#!/usr/bin/env node
/* Yearly GST review check. Read-only.
 *   npm run gst:review            human report; exit 1 only when the review is OVERDUE
 *   npm run gst:review -- --json  machine-readable
 *   npm run gst:review -- --now=2027-10-01   pretend today is that date
 * It does not fetch anything. It tells you whether features/finance-tax/gst-rules.js
 * is inside its review window and which rules still need a CA's confirmation. */
'use strict';
const fs = require('fs');
const path = require('path');
const G = require('../features/finance-tax/gst-rules.js');

const arg = (k) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : null; };
const json = process.argv.includes('--json');
const st = G.reviewStatus(arg('now') || new Date());

const finance = fs.readFileSync(path.join(__dirname, '..', 'finance-data.js'), 'utf8');
const accounts = [...finance.matchAll(/(rev_\w+):\s*\{[^}]*gst:'(\d+)'/g)].map((m) => ({ account: m[1], gstPct: Number(m[2]) }));
const ownFee = G.rule('platform_fee').rateBps / 100;
const mismatched = accounts.filter((a) => a.gstPct !== ownFee);

const report = {
  state: st.state, reviewedOn: st.reviewedOn, dueOn: st.dueOn, daysLeft: st.daysLeft,
  caSigned: st.caSigned, rulesVersion: st.rulesVersion,
  needsConfirmation: G.RULES.filter((r) => r.confidence !== 'primary').map((r) => ({ id: r.id, confidence: r.confidence })),
  accountsToCheck: mismatched,
};
if (json) { console.log(JSON.stringify(report, null, 2)); process.exit(st.state === 'overdue' ? 1 : 0); }

const label = { ok: 'OK', due_soon: 'DUE SOON', overdue: 'OVERDUE' }[st.state];
console.log('GST rules ' + st.rulesVersion + ': ' + label);
console.log('  last reviewed ' + st.reviewedOn + ', next review due ' + st.dueOn + (st.daysLeft != null ? ' (' + st.daysLeft + ' days)' : ''));
console.log('  CA sign-off: ' + (st.caSigned ? 'yes' : 'NOT YET. Non-primary rules below are unconfirmed.'));
console.log('  ' + report.needsConfirmation.length + ' rule(s) need CA confirmation:');
report.needsConfirmation.forEach((r) => console.log('    - ' + r.id + ' [' + r.confidence + ']'));
if (mismatched.length) {
  console.log('  Ledger accounts whose GST differs from the own-fee rate (' + ownFee + '%), check at the review:');
  mismatched.forEach((a) => console.log('    - ' + a.account + ' = ' + a.gstPct + '%'));
}
if (st.state !== 'ok') console.log('\nTo review: re-check every rule in features/finance-tax/gst-rules.js against the GST Council FAQ and CBIC notifications, update rateBps/sources/confidence, bump META.reviewedOn and rulesVersion, run npm test.');
process.exit(st.state === 'overdue' ? 1 : 0);
