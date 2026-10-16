/* Revenue-gated spend governor for the managed /ai route.

   The rule: model, database and hosting costs must stay below revenue.
     paid AI budget (this month) = max(floor, revenue * (1 - margin) - fixed costs)
   - revenue    : money actually received (live Cashfree payments), rolling:
                  this month + the not-yet-expired share of last month.
   - margin     : AI_TARGET_MARGIN, share of revenue that must remain as profit.
   - fixed      : FIXED_MONTHLY_COSTS_PAISE, the non-AI subscriptions (Firebase,
                  Cloudflare plan, domain, Sarvam/Groq/Anthropic plans...).
   - floor      : AI_MIN_PAID_BUDGET_PAISE, a bootstrap allowance so the service
                  works before revenue history exists.
   Spend that is covered by a free allowance is not counted: the Workers AI
   daily free allocation (10,000 Neurons, about 0.11 USD) and the Groq free
   tier. Everything else is estimated per request and counted. When the budget
   is gone, requests are answered from the answer cache only, and uncached ones
   fall back to the on-device planner. Nothing here ever blocks a cache hit.

   Counters live in the AI_USAGE KV binding. KV is not atomic, so counts can be
   off by a few requests under heavy concurrency; the margin absorbs that.
   Amounts are integer paise (1/100 rupee). */

const TTL = 3 * 31 * 24 * 3600;

/* USD per 1M tokens [input, output]. Sarvam is priced in INR directly.
   Claude entry is Haiku 5.5 (0.10 / 0.50) plus ~30% for the newer tokenizer. */
export const RATES_USD = Object.freeze({
  'workers-ai': [0.10, 0.30],
  groq: [0.075, 0.30],
  claude: [0.13, 0.65],
});
export const RATES_INR = Object.freeze({ sarvam: [15, 60] });

function kv(env){
  return env && env.AI_USAGE && typeof env.AI_USAGE.get === 'function' && typeof env.AI_USAGE.put === 'function' ? env.AI_USAGE : null;
}
function num(v, d){ const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : d; }
async function readInt(store, key){ return Math.max(0, parseInt(await store.get(key) || '0', 10) || 0); }

export function monthKey(date){ return (date || new Date()).toISOString().slice(0, 7); }
export function dayKey(date){ return (date || new Date()).toISOString().slice(0, 10); }
function prevMonthKey(date){
  const d = date || new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
}

/* Estimated cost of one request in paise, rounded up, never below 1. */
export function estimateCostPaise(route, promptChars, maxTokens, env){
  const inTok = Math.ceil(Math.max(0, promptChars) / 3) + 400; // ~3 chars/token (Indic is denser) + system prompt
  const outTok = Math.ceil(Math.max(0, maxTokens) * 0.7);
  let inr;
  if(RATES_INR[route]){
    const [i, o] = RATES_INR[route];
    inr = (inTok * i + outTok * o) / 1e6;
  }else if(RATES_USD[route]){
    const [i, o] = RATES_USD[route];
    inr = ((inTok * i + outTok * o) / 1e6) * num(env && env.USD_INR, 88);
  }else{
    return 0;
  }
  return Math.max(1, Math.ceil(inr * 100));
}

/* Record money received. Idempotent per order id. Live payments only. */
export async function recordRevenue(env, orderId, paise, date){
  const store = kv(env);
  const amount = Math.round(Number(paise));
  if(!store || !orderId || !Number.isFinite(amount) || amount <= 0) return false;
  const seen = `rw-revenue-seen:${String(orderId).slice(0, 64)}`;
  if(await store.get(seen)) return false;
  await store.put(seen, '1', { expirationTtl: TTL });
  const key = `rw-revenue:${monthKey(date)}`;
  await store.put(key, String((await readInt(store, key)) + amount), { expirationTtl: TTL });
  return true;
}

/* Where the paid budget stands right now. Fails closed without the KV binding. */
export async function readBudget(env, date){
  const store = kv(env);
  const now = date || new Date();
  const floor = num(env && env.AI_MIN_PAID_BUDGET_PAISE, 0);
  const fixed = num(env && env.FIXED_MONTHLY_COSTS_PAISE, 0);
  const margin = Math.min(0.9, num(env && env.AI_TARGET_MARGIN, 0.2));
  const freeDaily = num(env && env.AI_FREE_DAILY_PAISE, 900);
  if(!store) return { ok:false, revenue:0, fixed, cap:0, spent:0, remaining:0, freeLeft:0, freeDaily };
  const dom = now.getUTCDate();
  const dim = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const cur = await readInt(store, `rw-revenue:${monthKey(now)}`);
  const prev = await readInt(store, `rw-revenue:${prevMonthKey(now)}`);
  const revenue = Math.round(cur + prev * Math.max(0, 1 - (dom - 1) / dim));
  const cap = Math.max(floor, Math.floor(revenue * (1 - margin) - fixed));
  const spent = await readInt(store, `rw-ai-spend:${monthKey(now)}`);
  const freeUsed = await readInt(store, `rw-ai-free:${dayKey(now)}`);
  return { ok:true, revenue, fixed, cap, spent, remaining:Math.max(0, cap - spent), freeLeft:Math.max(0, freeDaily - freeUsed), freeDaily };
}

/* Which of the candidate routes can be afforded right now, in order.
   candidates: [{ name, premium?, freeTier? }]. Pure function. */
export function planRoutes(candidates, budget, ctx){
  const out = [];
  const maxRatio = num(ctx && ctx.premiumMaxSpendRatio, 0.6);
  for(const c of candidates){
    const est = c.est;
    if(c.premium){
      if(!budget.cap || budget.spent / budget.cap > maxRatio || budget.remaining < est * 20) continue;
    }
    if(c.freeTier){ out.push({ ...c, est: 0 }); continue; }
    const freePart = c.name === 'workers-ai' ? Math.min(est, budget.freeLeft) : 0;
    if(est - freePart <= budget.remaining) out.push(c);
  }
  return out;
}

/* Count a finished request against the right bucket. */
export async function chargeSpend(env, route, paise, freeTier, date){
  const store = kv(env);
  if(!store || freeTier || !(paise > 0)) return { free:0, paid:0 };
  const now = date || new Date();
  let free = 0;
  if(route === 'workers-ai'){
    const budget = await readBudget(env, now);
    free = Math.min(paise, budget.freeLeft);
    if(free > 0){
      const fk = `rw-ai-free:${dayKey(now)}`;
      await store.put(fk, String((await readInt(store, fk)) + free), { expirationTtl: 2 * 24 * 3600 });
    }
  }
  const paid = paise - free;
  if(paid > 0){
    const sk = `rw-ai-spend:${monthKey(now)}`;
    await store.put(sk, String((await readInt(store, sk)) + paid), { expirationTtl: TTL });
  }
  return { free, paid };
}
