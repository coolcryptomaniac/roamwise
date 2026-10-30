#!/usr/bin/env node
/* ============================================================================
   Daily Uttarakhand news scout -> conditions-data.js AUTO-SCOUT block.
   Run by .github/workflows/uttarakhand-advisory-scout.yml (06:15 IST).

   1. Reads Google News RSS searches (English + Hindi) for Uttarakhand travel news
      from the last 48 hours: road closures, landslides, snow, rain alerts,
      temple dates, Char Dham, Kainchi Dham, Adi Kailash, traffic plans.
   2. Asks Claude (ANTHROPIC_API_KEY; OPENAI_API_KEY as fallback) which headlines
      change a traveller's plans, as structured JSON.
   3. Validates every proposal in scout-core.mjs (must cite a fetched headline,
      must map to a known region, max 21 days, never "official"), prunes expired
      auto items, rewrites the block, bumps RW_CONDITIONS_CHECKED.
   The workflow then rebuilds data/conditions.json, runs the tests and commits.
   The Worker alerts people from that JSON within the hour after the site deploys.

   Usage: node tools/advisory-scout/scout.mjs [--dry]   (--dry prints, writes nothing)
   Env:   ANTHROPIC_API_KEY | OPENAI_API_KEY, ADVISORY_SCOUT_MODEL (optional)
   Writes a summary to $GITHUB_STEP_SUMMARY when present.
   ========================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as S from './scout-core.mjs';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FILE = path.join(ROOT, 'conditions-data.js');
const DRY = process.argv.includes('--dry');
const UA = 'RoamWise advisory scout (+https://roamwise.co.in)';

const QUERIES = [
  ['Uttarakhand road closed landslide', 'en'], ['Uttarakhand highway blocked', 'en'], ['Uttarakhand snowfall road', 'en'],
  ['Uttarakhand heavy rain alert district', 'en'], ['Kedarnath Badrinath yatra', 'en'], ['Gangotri Yamunotri yatra', 'en'],
  ['Kainchi Dham traffic', 'en'], ['Adi Kailash yatra', 'en'], ['Nainital traffic plan', 'en'], ['Mussoorie traffic', 'en'],
  ['Almora road', 'en'], ['Pithoragarh road closed', 'en'], ['Char Dham kapat closing date', 'en'], ['Uttarakhand trek suspended', 'en'],
  ['उत्तराखंड सड़क बंद भूस्खलन', 'hi'], ['केदारनाथ यात्रा', 'hi'], ['कैंची धाम जाम', 'hi'], ['उत्तराखंड बर्फबारी', 'hi'],
];

function rssUrl(q, lang) {
  const hl = lang === 'hi' ? 'hi&gl=IN&ceid=IN:hi' : 'en-IN&gl=IN&ceid=IN:en';
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q + ' when:2d')}&hl=${hl}`;
}

async function fetchText(url, ms = 12000) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA }, signal: ac.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const txt = await r.text();
    return txt.slice(0, 600000);
  } finally { clearTimeout(t); }
}

async function askModel(prompt) {
  if (process.env.ANTHROPIC_API_KEY) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.ADVISORY_SCOUT_MODEL || 'claude-sonnet-4-5', max_tokens: 2500, temperature: 0, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!r.ok) throw new Error('Anthropic ' + r.status + ' ' + (await r.text()).slice(0, 200));
    const j = await r.json();
    return (j.content || []).map((c) => c.text || '').join('');
  }
  if (process.env.OPENAI_API_KEY) {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + process.env.OPENAI_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.ADVISORY_SCOUT_OPENAI_MODEL || 'gpt-4o-mini', temperature: 0, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!r.ok) throw new Error('OpenAI ' + r.status);
    const j = await r.json();
    return (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
  }
  return null;
}

function summary(lines) {
  const text = lines.join('\n');
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n');
}

async function main() {
  const now = Date.now();
  const today = new Date(now + 5.5 * 3600000).toISOString().slice(0, 10);
  delete require.cache[FILE];
  const { RW_CONDITIONS } = require(FILE);
  const places = require(path.join(ROOT, 'features', 'travel-safety', 'data', 'places.js'));
  const regionWords = places.RW_UK_REGIONS.flatMap((r) => r.words);

  let headlines = [];
  const failed = [];
  for (const [q, lang] of QUERIES) {
    try { headlines = headlines.concat(S.parseRss(await fetchText(rssUrl(q, lang)), 25)); } catch (e) { failed.push(q + ': ' + e.message); }
  }
  headlines = S.recent(headlines, now, 48);

  let proposals = [];
  let model = 'none';
  if (headlines.length) {
    const reply = await askModel(S.buildPrompt(headlines, today, regionWords));
    if (reply == null) failed.push('no AI key: add ANTHROPIC_API_KEY (or OPENAI_API_KEY) in Actions secrets');
    else { proposals = S.parseModelJson(reply); model = process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'openai'; }
  }
  const auto = RW_CONDITIONS.filter((c) => c.auto);
  const manual = RW_CONDITIONS.filter((c) => !c.auto);
  const { accepted, reasons } = S.validate(proposals, headlines, RW_CONDITIONS, today, places.rwUkRegionsForText);
  const { items, pruned } = S.mergeAuto(auto, accepted, today);

  summary([
    `## Uttarakhand advisory scout · ${today}`,
    `Headlines read: ${headlines.length} · model: ${model} · proposals: ${proposals.length} · added: ${accepted.length} · expired removed: ${pruned} · auto items now: ${items.length} · manual items: ${manual.length}`,
    ...accepted.map((a) => `- **added** ${a.title} (${a.from} → ${a.until}) · ${a.source} · ${a.sourceUrl}`),
    ...reasons.slice(0, 15).map((r) => `- skipped: ${r}`),
    ...failed.map((f) => `- ⚠️ ${f}`),
  ]);

  if (DRY) return;
  const src = fs.readFileSync(FILE, 'utf8');
  let next = S.writeBlock(src, items);
  if (accepted.length || pruned || model !== 'none') next = S.setChecked(next, today); /* reviewed today */
  if (next !== src) {
    fs.writeFileSync(FILE, next);
    delete require.cache[FILE];
    require(FILE);
    console.log('conditions-data.js updated');
  } else console.log('no change');
}

main().catch((e) => { console.error(e); process.exit(1); });
