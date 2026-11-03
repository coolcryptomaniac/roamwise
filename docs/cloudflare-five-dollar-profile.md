# Strict $5/month operating profile (conservative defaults)

Cloudflare Workers Paid is a **base subscription**, not a spending cap. Requests, CPU, KV, Durable Objects, Workers AI, builds and other products may bill beyond their included allowances. A code-based threshold is not an account-level billing stop. Verify the actual invoice and all other deployed Workers and Cloudflare products.

As of November 2026, Workers Paid includes 10 million Worker requests/month and 30 million CPU milliseconds/month. Workers AI includes 10,000 free neurons/day; on Paid plans usage above this is charged at $0.011 per 1,000 neurons. Model throughput/rate limits are separate. A million registered users is not equivalent to a million free model calls.

This profile defaults `MANAGED_AI_ENABLED=false`, `AI_MIN_PAID_BUDGET_PAISE=0`, `AI_FREE_DAILY_PAISE=0`, `GROQ_MONTHLY_REQUEST_CAP=0` and reserves ₹500 in the revenue-based cost formula for subscriptions. These settings disable the main managed `/ai` route after deployment, but **do not** guarantee an invoice capped at $5: audit other inference routes, Cron, KV, D1, third-party APIs, billing configuration and all Workers. No subscription change or dashboard cap is applied by a GitHub merge.

Keep useful Ailon Tusk features available without hosted AI: curated destination and verified property data, cached/shared answers, on-device deterministic trip guidance, and user-supplied BYOK keys (keys must remain in the user's browser or be handled by a secure opt-in BYOK proxy). Do not ship RoamWise-paid premium credentials in the browser. Never route a BYOK request through a RoamWise-funded key.

Before re-enabling server-funded AI: implement atomic counters (Durable Objects or transactional DB), a provider-enforced spending ceiling, daily neuron tracking with safety margin, and a global circuit breaker. Alerts alone do not stop charges. Limit premium routes to BYOK until cost tests demonstrate they fit the founder's explicitly approved budget. No credible paid hosted model will serve a million active AI users for a total of $10/month; a million predominantly static/cache-served visitors may be possible depending on request volume.

Official pricing:
https://developers.cloudflare.com/workers/platform/pricing/
https://developers.cloudflare.com/workers-ai/platform/pricing/
