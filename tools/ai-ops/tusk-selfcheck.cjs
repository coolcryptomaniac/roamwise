'use strict';
/* Ailon Tusk self-check, run daily by .github/workflows/tusk-selfcheck.yml.
   1. Regression guard: every event the app lists must still be answered as an
      event trip from its own data (never as generic month picks). A failure
      exits 1 and the workflow opens an issue.
   2. Report triage: reads anonymous thumbs-down reports (JSON from the Worker)
      and shows what Tusk's own parser does with each, so a human can see which
      are parser faults, which are rejected event answers, and which are places
      Tusk does not know yet.
   Deterministic: no AI model is called and nothing is changed automatically. */
const fs = require('node:fs');
const { makeTusk, eventPrompt } = require('./tusk-harness.cjs');

const args = process.argv.slice(2);
const flag = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const reportsPath = flag('--reports');
const outDir = flag('--out') || '.';
const now = new Date();

const tusk = makeTusk();
const golden = [];

for(const e of tusk.events){
  if(e.end && new Date(e.end + 'T23:59:59+05:30') < now) continue;
  const q = eventPrompt(e, 'Delhi');
  const intent = tusk.parse(q);
  const a = tusk.event(q, now);
  const text = a ? a.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') : '';
  if(intent._recommendCount) golden.push(e.name + ': parsed as a best-places request');
  if(!a) golden.push(e.name + ': no event answer');
  else if(!text.includes(e.when)) golden.push(e.name + ': answer does not show the event dates');
}

const rows = [];
let flagged = 0;
if(reportsPath && fs.existsSync(reportsPath)){
  let data = {};
  try{ data = JSON.parse(fs.readFileSync(reportsPath, 'utf8')); }catch(_){ data = {}; }
  const seen = new Map();
  for(const r of (data.reports || [])){
    const key = String(r.q || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if(!key) continue;
    const prev = seen.get(key);
    if(prev){ prev.count++; continue; }
    const intent = tusk.parse(r.q);
    const ev = tusk.event(r.q, now);
    let verdict = 'review';
    if(r.kind === 'event') verdict = 'event answer rejected: check the event data and wording';
    else if(r.kind === 'picks' && intent._recommendCount && String(r.q).length > 120) verdict = 'parser fault: long text read as best-places';
    else if(r.kind === 'picks' && !intent._recommendCount) verdict = 'picks card shown but parser disagrees: client may be out of date';
    else if(intent._weakDest) verdict = 'unknown place: "' + intent.dest + '" (add to the learned places)';
    else if(ev) verdict = 'now answered as event: ' + ev.event.name;
    const row = { q: r.q, kind: r.kind, dest: intent.dest || '', verdict, count: 1 };
    seen.set(key, row); rows.push(row);
  }
  flagged = rows.filter(r => /fault|rejected|unknown|disagrees/.test(r.verdict)).length;
}

const esc = s => String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const md = [
  '## Ailon Tusk self-check',
  '',
  golden.length ? '**Regression guard: FAILED**\n' + golden.map(g => '- ' + g).join('\n') : '**Regression guard: passed** (' + tusk.events.length + ' listed events answered from their own data).',
  ''
];
if(rows.length){
  md.push('### Reported answers (' + rows.reduce((n, r) => n + r.count, 0) + ' reports, ' + rows.length + ' distinct questions, ' + flagged + ' need a look)', '',
    '| Question | Shown | Parsed place | Count | Verdict |', '|---|---|---|---|---|',
    ...rows.map(r => '| ' + esc(r.q).slice(0, 140) + ' | ' + esc(r.kind) + ' | ' + esc(r.dest) + ' | ' + r.count + ' | ' + esc(r.verdict) + ' |'), '',
    'Reports contain the question text only (emails and long numbers removed); no account or device information.');
}else if(reportsPath){
  md.push('No thumbs-down reports in the last 30 days.');
}
fs.writeFileSync(outDir + '/tusk-selfcheck-report.md', md.join('\n') + '\n');
fs.writeFileSync(outDir + '/tusk-selfcheck-result.json', JSON.stringify({ goldenFailures: golden, reports: rows.length, flagged }, null, 2));
console.log(md.join('\n'));
process.exit(golden.length ? 1 : 0);
