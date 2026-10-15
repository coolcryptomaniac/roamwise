/* ============================================================================
   worker/handlers/nomad-ai.js — POST /nomad/advise
   ============================================================================
   Public, anonymous, no personal data. Body: { brief, picks, whatIfs } where
   picks are the matcher's own top results (ids, names, scores, reasons). Workers
   AI writes a short explanation and host questions about THOSE picks only; the
   reply is validated (nomads/nomad-ai-core.mjs parseAdvice) and anything invalid
   falls back to deterministic wording, so the page always gets a usable answer.

   Cost guards: same brief + same picks is served from the edge cache for 24 h;
   per-IP 12 per 10 minutes; a global soft cap per data-centre per day. When a
   guard trips, the deterministic advice is returned (never an error page). */
import { json } from '../lib/http.js';
import { overLimit, clientIp, sha256Hex } from '../lib/rate-limit.js';
import { workersAIText } from './ai.js';
import { buildAdvicePrompt, parseAdvice, fallbackAdvice, adviceKey } from '../../nomads/nomad-ai-core.mjs';

const MAX_BODY = 8000;

export async function handleNomadAdvise(request, env, deps = {}) {
  const cache = deps.cache || (typeof caches !== 'undefined' ? caches.default : null);
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ error: 'too_large' }, 413);
  let body; try { body = JSON.parse(text); } catch (_) { return json({ error: 'bad_json' }, 400); }
  const picks = (Array.isArray(body.picks) ? body.picks : []).slice(0, 5).map(p => ({
    id: String(p && p.id || '').slice(0, 40), name: String(p && p.name || '').slice(0, 60), score: Math.max(0, Math.min(100, Math.round(Number(p && p.score) || 0))),
    reasons: (Array.isArray(p && p.reasons) ? p.reasons : []).slice(0, 4).map(x => String(x).slice(0, 80)),
    gaps: (Array.isArray(p && p.gaps) ? p.gaps : []).slice(0, 3).map(x => String(x).slice(0, 80)),
  })).filter(p => p.id && p.name);
  if (!picks.length) return json({ error: 'no_picks' }, 400);
  const whatIfs = (Array.isArray(body.whatIfs) ? body.whatIfs : []).slice(0, 3).map(w => ({ text: String(w && w.text || '').slice(0, 100), from: Number(w && w.from) || 0, to: Number(w && w.to) || 0 }));
  const brief = body.brief || {};
  const fallback = { ...fallbackAdvice(brief, picks, whatIfs), source: 'matcher' };

  const key = new Request('https://cache.roamwise.internal/nomad-advise/' + await sha256Hex(adviceKey(brief, picks)));
  if (cache) { const hit = await cache.match(key); if (hit) return hit; }
  const limited = await overLimit('nomad-ai', clientIp(request), 12, 600, cache)
    || await overLimit('nomad-ai-day', 'all', Number(env.NOMAD_AI_DAILY_CAP) || 3000, 86400, cache);
  if (env.NOMAD_AI_ENABLED === 'false' || limited || !env.AI || typeof env.AI.run !== 'function') return json(fallback);

  let advice = null, model = String(env.NOMAD_AI_MODEL || env.WORKERS_AI_MODEL || '@cf/google/gemma-4-26b-a4b-it');
  try {
    const out = await env.AI.run(model, { messages: [{ role: 'system', content: 'You write short, factual JSON for a travel matching page. Never invent facts.' }, { role: 'user', content: buildAdvicePrompt(brief, picks, whatIfs) }], max_tokens: 450 });
    advice = parseAdvice(workersAIText(out), picks);
  } catch (_) { advice = null; }
  const payload = advice ? { ...advice, source: 'ai', model } : fallback;
  const res = new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=86400' } });
  if (cache && advice) await cache.put(key, res.clone()).catch(() => {});
  return res;
}
