/* ============================================================================
   tools/advisory-scout/scout-core.mjs — pure logic for the daily Uttarakhand
   news scout. No network: parse RSS, shape the AI request, validate what the
   AI proposes, merge into conditions-data.js's AUTO-SCOUT block.

   Safety rules (enforced here, not trusted to the model):
   · a proposed advisory must cite one of the headline links we gave it
   · its place words must map to a known Uttarakhand region
   · it is always official:false ("confirm locally") and auto:true
   · it lasts at most 21 days; expired auto items are pruned every run
   · at most 6 new items a day and 25 auto items in total
   · near-duplicates of an existing item (same kind + region + similar title) are dropped
   ========================================================================= */
export const MAX_NEW = 6;
export const MAX_AUTO = 25;
export const MAX_DAYS = 21;
export const KINDS = ['closure', 'road', 'rain', 'snow', 'crowd', 'event'];
const ISO = /^20\d\d-\d\d-\d\d$/;
const DAY = 86400000;

export function addDays(iso, n) { return new Date(Date.parse(iso + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10); }

function decode(s) {
  return String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&')
    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Google News RSS -> [{ title, url, source, published }] (bounded, https only). */
export function parseRss(xml, max = 40) {
  const out = [];
  for (const m of String(xml || '').matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const it = m[1];
    const pick = (tag) => { const x = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`).exec(it); return x ? decode(x[1]) : ''; };
    const url = pick('link');
    const t = Date.parse(pick('pubDate'));
    if (!/^https:\/\//.test(url) || !Number.isFinite(t)) continue;
    out.push({ title: pick('title').slice(0, 220), url, source: pick('source').slice(0, 80) || 'News', published: new Date(t).toISOString() });
    if (out.length >= max) break;
  }
  return out;
}

/** Keep headlines from the last `hours`, de-duplicated by URL and by title. */
export function recent(items, nowMs, hours = 48) {
  const seenU = new Set(); const seenT = new Set();
  return items.filter((x) => {
    const age = nowMs - Date.parse(x.published);
    if (age < -3600000 || age > hours * 3600000) return false;
    const tk = x.title.toLowerCase().replace(/\s+-\s+[^-]+$/, '').slice(0, 90);
    if (seenU.has(x.url) || seenT.has(tk)) return false;
    seenU.add(x.url); seenT.add(tk);
    return true;
  }).slice(0, 80);
}

export function buildPrompt(headlines, today, regionWords) {
  const list = headlines.map((h, i) => `[${i}] ${h.published.slice(0, 10)} · ${h.source} · ${h.title}`).join('\n');
  return `You help travellers in Uttarakhand, India. Today is ${today} (India).
Below are news headlines from the last two days. Pick ONLY items that change a traveller's plans in Uttarakhand in the next three weeks:
a road or highway closed/blocked, a temple or route closing/opening date, heavy rain/snow warnings for named districts, a trek or yatra suspended,
traffic restrictions or diversions, very heavy crowds at a named place, or a dated event that closes roads.
Ignore politics, crime, accidents without ongoing closure, opinion, other states, and anything vague.

For each pick return an object:
{"headline": <index number>, "kind": one of ${JSON.stringify(KINDS)}, "title": short factual title (max 90 chars, no hype),
 "detail": 1-2 plain sentences of what a traveller should do (max 260 chars), "places": array of lowercase place names in Uttarakhand mentioned in the headline,
 "from": "YYYY-MM-DD" when it starts (use the headline date if unclear), "until": "YYYY-MM-DD" when it should stop being shown (at most 21 days ahead; 2-3 days for a road block or a rain alert)}
Use only facts in the headline. Do not invent dates, numbers or places. If nothing qualifies, return [].
Known place names include: ${regionWords.slice(0, 160).join(', ')}.
Reply with a JSON array only.

Headlines:
${list}`;
}

/** Extract a JSON array from a model reply (tolerates code fences). */
export function parseModelJson(text) {
  const s = String(text || '');
  const a = s.indexOf('['); const b = s.lastIndexOf(']');
  if (a === -1 || b <= a) return [];
  try { const j = JSON.parse(s.slice(a, b + 1)); return Array.isArray(j) ? j : []; } catch (_) { return []; }
}

function words(s) { return new Set(String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2)); }
function similar(a, b) {
  const A = words(a); const B = words(b);
  if (!A.size || !B.size) return 0;
  let n = 0; for (const w of A) if (B.has(w)) n++;
  return n / Math.min(A.size, B.size);
}
function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40); }
function clean(s, n) { return String(s || '').replace(/[\u0000-\u001f<>`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n); }

/**
 * Turn model proposals into advisories. `regionsFor(text)` maps place text to region ids;
 * `existing` is the current RW_CONDITIONS list (manual + auto).
 */
export function validate(proposals, headlines, existing, today, regionsFor) {
  const accepted = [];
  const reasons = [];
  for (const p of Array.isArray(proposals) ? proposals : []) {
    const h = headlines[Number(p && p.headline)];
    if (!h) { reasons.push('no such headline'); continue; }
    const kind = KINDS.includes(p.kind) ? p.kind : null;
    const title = clean(p.title, 90);
    const detail = clean(p.detail, 260);
    const places = (Array.isArray(p.places) ? p.places : []).map((x) => clean(x, 40).toLowerCase()).filter(Boolean).slice(0, 8);
    const regions = regionsFor(places.join(' | '));
    if (!kind || title.length < 12 || detail.length < 20) { reasons.push('incomplete: ' + h.title); continue; }
    if (!regions.length) { reasons.push('not a known Uttarakhand place: ' + h.title); continue; }
    const pub = h.published.slice(0, 10);
    let from = ISO.test(p.from || '') ? p.from : pub;
    if (from < addDays(today, -3)) from = pub;
    if (from > addDays(today, MAX_DAYS)) { reasons.push('starts too late: ' + title); continue; }
    let until = ISO.test(p.until || '') ? p.until : addDays(from, 3);
    if (until < today) { reasons.push('already over: ' + title); continue; }
    if (until > addDays(today, MAX_DAYS)) until = addDays(today, MAX_DAYS);
    if (until < from) until = from;
    /* One auto advisory per kind and region at a time; a curated one blocks only a similar title. */
    const dup = existing.concat(accepted).find((e) => e && (e.sourceUrl === h.url || (e.kind === kind && e.until >= today
      && regionsFor((e.match || []).join(' | ')).some((r) => regions.includes(r)) && (e.auto || similar(e.title, title) >= 0.6))));
    if (dup) { reasons.push('duplicate of ' + dup.id); continue; }
    accepted.push({
      id: `auto-${from.replace(/-/g, '')}-${slug(title)}`, kind, official: false, auto: true,
      match: places, title, detail, from, until, source: clean(h.source, 60), sourceUrl: h.url, checkedAt: today,
    });
    if (accepted.length >= MAX_NEW) break;
  }
  return { accepted, reasons };
}

/* ------------------------------------------------------------ no-AI fallback
   Used when no AI key is configured. Deliberately narrow: English headlines that name a
   known Uttarakhand place AND a clear travel impact. Title is the headline itself; the
   detail tells people to confirm locally. Everything still goes through validate(). */
const RULES = [
  { kind: 'road', days: 2, re: /\b(landslides?|road|highway|route|nh[- ]?\d+)\b[^.]*\b(closed|blocked|shut|cut off|washed away|suspended)\b|\b(closed|blocked|shut)\b[^.]*\b(road|highway|route)\b|\blandslide\b/i },
  { kind: 'snow', days: 3, re: /\bsnow(fall)?\b/i },
  { kind: 'rain', days: 2, re: /\b(red|orange) alert\b|\bheavy (rain|rainfall)\b|\bcloudburst\b/i },
  { kind: 'crowd', days: 3, re: /\b(traffic jam|gridlock|heavy rush|huge crowd|crowds? swell|stranded)\b/i },
  { kind: 'closure', days: 14, re: /\b(portals?|kapat|doors?|yatra)\b[^.]*\b(close|closed|closing|suspended|halted)\b/i },
];
const NOT_HERE = /\b(nepal|himachal|kashmir|ladakh|sikkim|shimla|manali|ooty|coonoor|udhagamandalam|kerala|thane|mumbai|delhi-ncr)\b/i;
const NOISE = /\b(contract|tender|inaugurat\w*|satire|epfo|election|poll|arrest\w*|murder|court|bypass bridge|stock|shares?)\b/i;

export function ruleProposals(headlines, regionWords) {
  const out = [];
  headlines.forEach((h, i) => {
    const t = h.title.replace(/\s+-\s+[^-]{2,60}$/, '').trim();
    if (!/^[\x20-\x7E‘-”–—]+$/.test(t)) return;
    if (NOT_HERE.test(t) || NOISE.test(t)) return;
    const low = t.toLowerCase();
    const places = regionWords.filter((w) => low.includes(w));
    if (!places.length) return;
    const r = RULES.find((x) => x.re.test(t));
    if (!r) return;
    const from = h.published.slice(0, 10);
    out.push({ headline: i, kind: r.kind, title: t.length > 90 ? t.slice(0, 88).replace(/\s+\S*$/, '') + '…' : t,
      detail: `${h.source || 'A news report'} reports this. Check with local police or the district administration before you travel.`,
      places, from, until: addDays(from, r.days) });
  });
  return out;
}

/** Current auto items kept (not expired) + new ones, newest first, capped. */
export function mergeAuto(currentAuto, fresh, today) {
  const kept = currentAuto.filter((a) => a && a.until >= today);
  const all = fresh.concat(kept.filter((k) => !fresh.some((f) => f.id === k.id)));
  return { items: all.slice(0, MAX_AUTO), pruned: currentAuto.length - kept.length };
}

const START = '/* AUTO-SCOUT:START';
const END = '/* AUTO-SCOUT:END */';
/** Rewrite the AUTO-SCOUT block of conditions-data.js with `items` (JSON object literals). */
export function writeBlock(source, items) {
  const a = source.indexOf(START); const b = source.indexOf(END);
  if (a === -1 || b === -1 || b < a) throw new Error('AUTO-SCOUT markers missing in conditions-data.js');
  const headEnd = source.indexOf('*/', a) + 2;
  const body = items.map((x) => '  ' + JSON.stringify(x) + ',\n').join('');
  return source.slice(0, headEnd) + '\n' + body + '  ' + source.slice(b);
}

export function setChecked(source, today) {
  return source.replace(/var RW_CONDITIONS_CHECKED = '20\d\d-\d\d-\d\d';/, `var RW_CONDITIONS_CHECKED = '${today}';`);
}
