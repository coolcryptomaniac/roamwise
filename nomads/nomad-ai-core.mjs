/* RoamWise Nomad Match - the "make it better" layer.
   Two parts, both pure (no network) so they are tested and reused by the page and the Worker:
     1. Deterministic what-ifs: re-run the real scorer with one answer relaxed (budget, Wi-Fi, a must-have,
        stay length) and report only the changes that actually lift the best match. For hosts: the
        cheapest steps to the next Nomad-Ready tier, with the points each one adds.
     2. An AI advice layer (Cloudflare Workers AI in the Worker). The model only writes wording about the
        matches and what-ifs it is given; it may not name a place that is not in the list, and its reply is
        parsed, length-capped and validated. Anything invalid falls back to the deterministic text. */
import { cleanBrief, nomadTier, rank, MUST_HAVES, STAY_LENGTHS, NOMAD_TIERS } from './nomad-core.mjs';

const clip = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const label = id => (MUST_HAVES.find(m => m.id === id) || { label: id }).label.toLowerCase();

/** What single change to the brief lifts the best match the most? Only real improvements (+3 points or more). */
export function improveSuggestions(items, scorer, rawBrief, limit = 3) {
  const b = cleanBrief(rawBrief);
  const best = brief => { const r = rank(items, scorer, brief, 1)[0]; return r ? { score: r.score, name: r.item.name } : { score: 0, name: '' }; };
  const base = best(b);
  const tries = [];
  const up = Math.round(b.budget * 1.2 / 500) * 500;
  if (up <= 250000) tries.push({ change: { budget: up }, text: `Raise your budget to about ₹${up.toLocaleString('en-IN')} a month` });
  const wifiDown = { 100: 50, 50: 25, 25: 10 }[b.wifi];
  if (wifiDown) tries.push({ change: { wifi: wifiDown }, text: `Accept ${wifiDown} Mbps Wi-Fi instead of ${b.wifi}` });
  b.must.forEach(id => tries.push({ change: { must: b.must.filter(x => x !== id) }, text: `Make ${label(id)} a nice-to-have` }));
  STAY_LENGTHS.filter(s => s.id !== b.stay).forEach(s => tries.push({ change: { stay: s.id }, text: `Stay ${s.label} instead` }));
  if (b.vibes.length) tries.push({ change: { vibes: [] }, text: 'Stay open on mood (mountains, beach, city ...)' });
  return tries.map(t => { const r = best({ ...b, ...t.change }); return { text: t.text, from: base.score, to: r.score, lift: r.score - base.score, top: r.name }; })
    .filter(t => t.lift >= 3).sort((x, y) => y.lift - x.lift).slice(0, limit);
}

/* Each missing item, what it adds, and a rough effort so hosts see the cheapest path first. */
const HOST_STEPS = [
  { key: 'mbps', set: { mbps: 50 }, step: 'Upgrade to a 50 Mbps plan and share a speed-test screenshot', effort: 'about ₹700–1,200 a month for fibre where available' },
  { key: 'backup', set: { backup: 'full' }, step: 'Put the work area (not only the router) on an inverter', effort: 'about ₹8,000–20,000 one time' },
  { key: 'desk', set: { desk: 'ergonomic' }, step: 'Add a proper desk and an ergonomic chair', effort: 'about ₹6,000–15,000 per room' },
  { key: 'callRoom', set: { callRoom: true }, step: 'Mark one quiet corner for calls', effort: 'little or no cost' },
  { key: 'kitchen', set: { kitchen: true }, step: 'Offer kitchen access or simple meals', effort: 'low' },
  { key: 'coworking', set: { coworking: true }, step: 'Set up a shared work table with plugs', effort: 'about ₹5,000–10,000' },
  { key: 'community', set: { community: true }, step: 'Host one weekly dinner or walk for guests', effort: 'low' },
  { key: 'rate30', set: { rate30: 1 }, step: 'Publish a monthly rate', effort: 'free' },
];
export function hostNextTier(rawSpace = {}) {
  const space = rawSpace.nomad || rawSpace;
  const now = nomadTier({ nomad: space });
  const next = [...NOMAD_TIERS].reverse().find(t => t.min > now.score) || null;
  const steps = HOST_STEPS.map(s => {
    const after = nomadTier({ nomad: { ...space, ...s.set, rate30: s.key === 'rate30' ? Math.max(1, Number(space.rate30) || 1) : space.rate30 } });
    return { step: s.step, effort: s.effort, gain: after.score - now.score };
  }).filter(s => s.gain > 0).sort((a, b) => (a.effort.startsWith('free') || a.effort.startsWith('little') || a.effort === 'low' ? 0 : 1) - (b.effort.startsWith('free') || b.effort.startsWith('little') || b.effort === 'low' ? 0 : 1) || b.gain - a.gain);
  let need = next ? next.min - now.score : 0, plan = [];
  for (const s of steps) { if (!next || need <= 0) break; plan.push(s); need -= s.gain; }
  return { score: now.score, tier: now.tier.label, next: next ? next.label : '', pointsToNext: next ? next.min - now.score : 0, plan, all: steps, needsProof: !now.verified };
}

/* ---- AI advice ---------------------------------------------------------------------------------------- */
export function compactPicks(results = []) {
  return results.slice(0, 5).map(r => ({ id: clip(r.item && (r.item.id || r.item.name), 40), name: clip(r.item && r.item.name, 60),
    score: Math.round(Number(r.score) || 0), reasons: (r.reasons || []).slice(0, 4).map(x => clip(x, 80)), gaps: (r.gaps || []).slice(0, 3).map(x => clip(x, 80)) }));
}

export function buildAdvicePrompt(rawBrief, picks, whatIfs = []) {
  const b = cleanBrief(rawBrief);
  return [
    'You help a remote worker choose a long work stay in India. Write ONLY a JSON object, no other text:',
    '{"headline": string (max 120 chars), "picks": [{"id": string, "why": string (max 140 chars), "tip": string (max 120 chars)}], "ask": [string] (max 2 short questions for the host), "tradeoff": string (max 160 chars)}',
    'Rules: use only the ids given below and only the facts given; never invent prices, Wi-Fi speeds, places or properties; plain friendly English; no emojis.',
    'Brief: ' + JSON.stringify({ persona: b.persona, stayDays: b.stay, wifiMbps: b.wifi, mustHave: b.must, mood: b.vibes, budgetPerMonthINR: b.budget, people: b.people }),
    'Ranked matches (best first): ' + JSON.stringify(picks),
    'What-ifs computed by the matcher: ' + JSON.stringify(whatIfs.map(w => ({ change: w.text, from: w.from, to: w.to })))
  ].join('\n').slice(0, 3800);
}

export function parseAdvice(text, picks) {
  const allowed = new Set(picks.map(p => p.id));
  let o = null;
  try { const m = /\{[\s\S]*\}/.exec(String(text || '')); o = m ? JSON.parse(m[0]) : null; } catch (_) { o = null; }
  if (!o || typeof o !== 'object') return null;
  const out = {
    headline: clip(o.headline, 120),
    picks: (Array.isArray(o.picks) ? o.picks : []).filter(p => p && allowed.has(clip(p.id, 40))).slice(0, 5)
      .map(p => ({ id: clip(p.id, 40), why: clip(p.why, 140), tip: clip(p.tip, 120) })),
    ask: (Array.isArray(o.ask) ? o.ask : []).slice(0, 2).map(q => clip(q, 120)).filter(Boolean),
    tradeoff: clip(o.tradeoff, 160),
  };
  return out.headline && out.picks.length ? out : null;
}

export function fallbackAdvice(rawBrief, picks, whatIfs = []) {
  const b = cleanBrief(rawBrief);
  const top = picks[0];
  return {
    headline: top ? `${top.name} fits your ${b.stay}-day brief best (${top.score}/100).` : 'Tell us a little more and we will hand-match you.',
    picks: picks.slice(0, 3).map(p => ({ id: p.id, why: (p.reasons || []).slice(0, 2).join('; '), tip: p.gaps && p.gaps[0] ? 'Check: ' + p.gaps[0].toLowerCase() : 'Ask for a recent speed-test screenshot' })),
    ask: ['Can you share a speed test taken this week?', 'What is the full monthly total including electricity and taxes?'],
    tradeoff: whatIfs[0] ? `${whatIfs[0].text} to move from ${whatIfs[0].from} to ${whatIfs[0].to}.` : '',
  };
}

export function adviceKey(rawBrief, picks) {
  const b = cleanBrief(rawBrief);
  return JSON.stringify([b.persona, b.stay, b.wifi, b.must.slice().sort(), b.vibes.slice().sort(), b.budget, b.people, picks.map(p => p.id + ':' + p.score)]);
}
