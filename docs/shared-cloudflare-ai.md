# Included Ailon Tusk AI: launch policy and scale

Prepared 18 November 2026 for the current audience of approximately 70 registered users. This is a review branch, not evidence of a production deployment or a live model-quality test.

## What is implemented

- `GET /ai/basic` returns the signed-in account's remaining daily allowance. `POST /ai/basic` generates a short reply through the existing Workers AI binding. No provider key is requested from the traveller.
- Every verified email or phone account can request up to **10 generated answers per UTC day** (resets at 05:30 IST). Anonymous Firebase accounts are excluded. Unsigned visitors retain existing public search/knowledge paths.
- Automatic mode uses this route for short copilot conversations and short travel plans. Premium itinerary products, PDF purchases and paid-plan monthly `/ai` allowances keep their existing terms. The five-per-day destination search counter is a different feature and is now labelled accordingly.
- Model: `@cf/google/gemma-4-26b-a4b-it`; maximum 384 completion tokens. The server chooses both. It does not run multiple models for every answer or send free requests to a paid fallback provider.
- One **8,000 estimated neurons/day** launch pool, shared across all users, plus 1,000 model attempts/day. Defaults are configurable, with an upper bound of 20 answers/account/day and 10,000 estimated neurons/day in this launch implementation.
- A SQLite-backed Durable Object reserves both account allowance and shared budget atomically before inference. Three attempts/minute per verified UID, 180/minute across the pool, and at most twice the daily allowance in attempts prevent simple retry loops. Changing a token or clearing browser storage cannot reset the verified UID's quota.
- Failed or empty model responses refund the user's answer allowance once. Their estimated compute cost remains reserved because upstream work may still be billed. Missing/failed metering blocks inference.
- Provider-reported token usage reconciles the cost reservation. Without valid telemetry, the conservative reservation remains. Actual over-reservation is recorded and blocks later calls. This is an application estimate, not a billing guarantee.
- Exact same-user responses can be cached for one hour. Cache keys hash identity and full context; personal responses are never shared across users. The public response is `private, no-store`. Public reviewed facts remain the preferred zero-generation path.
- Quota storage retains hashed UIDs and counters, not prompts or credentials. Each daily object's alarm deletes its counters one day after that day's reset. No public route exposes the coordinator itself.

**The free allocation is per Cloudflare account, not per RoamWise account.** Other Worker AI routes, embeddings, art, voice, automations and testing may consume that same allocation. The 2,000-neuron margin does not prove that all other usage fits. Monitor total Cloudflare usage before calling the whole app free.

## Economics: explicit assumptions

Cloudflare currently includes 10,000 neurons/day, with paid-plan overage at $0.011/1,000 neurons. Gemma 4 is $0.10/M input tokens and $0.30/M output tokens. This illustration assumes **1,500 total input tokens plus 350 output tokens per uncached reply**, 30 identical days, the entire daily free allocation available, and **INR 90/USD as a planning assumption, not an exchange-rate quote**.

| Daily usage | Uncached answers/day | Estimated incremental AI cost/month |
| --- | ---: | ---: |
| 70 active people × 10 answers | 700 | $2.06 / about INR 185 |
| 70 active people × 20 answers | 1,400 | $7.41 / about INR 667 |
| 1,000 active people × 10 answers | 10,000 | $73.20 / about INR 6,588 |
| 1 million registered; 10% active daily × 10 answers | 1,000,000 | $7,646.70 / about INR 6.88 lakh |
| 1 million active daily × 10 answers | 10,000,000 | $76,496.70 / about INR 68.85 lakh |

These are inference-only examples, not quotes. They exclude the existing Workers subscription, Durable Objects, database/network costs, taxes, retries, long reasoning, voice/images, premium models and other account usage. Caching and fewer daily active users lower costs; longer conversations and larger outputs raise them. Free daily allocation does not roll over.

At the example token mix, 8,000 neurons covers about **345 generated replies/day**. Therefore, 10/account is an individual maximum subject to shared availability, not a promise that 70 people can each use all 10 for zero cost. Start with the capped pool; a later explicitly funded INR 300–500 monthly AI budget could make sense after measuring actual usage. No such additional spend is enabled by this patch.

## One account for many models

Cloudflare AI Gateway Unified Billing is the closest fit to one central bill: RoamWise prepays credits and serves users through its own backend. Supported provider inference remains usage-priced, and Cloudflare currently charges a 5% fee on purchased credits. Model coverage and rate limits vary. A consumer chat subscription is not an unlimited resale/API plan; finite subscription-linked API credits, where offered, do not remove usage limits.

Use one economical default model for common tasks. Offer premium reasoning, large itineraries, voice and artwork through a separately metered add-on. A possible future offer is **INR 99 per 30 days for 500 additional standard text credits**, with larger/premium jobs charging more credits. This is a proposal only: checkout, pricing and existing lifetime Founder promises have not been changed.

## Before expanding the rollout

1. Review the separate auth/quota and deployment changes, including the new `BasicAIQuota` class and SQLite migration. Existing deployment automation runs when Worker changes reach main.
2. Confirm the production Firebase service-account secret and Workers AI binding, then deploy and check `/health` for `configured.basicAI` and `configured.basicAIMeter`. Presence flags do not verify credentials, model quality or remaining account allocation.
3. With a real non-Pro verified account, test Automatic mode, quota display, a short English query and a Hindi query. Confirm Cloudflare billing telemetry, actual response usage and that no premium route is used. Test the cap in a staging environment with a small configured allowance. Do not paste credentials into PRs or logs.
4. Disable `BASIC_AI_ENABLED` to stop new generations. Keep the Durable Object binding/class during rollback; do not assume an old Worker version without that class can be rolled back after a migration. Turn off `RW_CONFIG.basicAI.enabled` to restore the previous client routing.
5. For larger traffic, use measured daily active users, token distributions, cache hit rate and peak concurrency. Request provider rate-limit increases before scaling beyond the documented limits. Add staged bot protection and verified-account abuse controls.
6. The single daily coordinator is appropriate for this small bounded pool. Millions of active users require load-tested per-user/shard coordinators with centrally allocated budget leases, observability and a paid capacity plan. This branch is **not** a million-user load test.

## Verification

- 14 new policy, handler and UI tests cover auth, trusted model/output limits, concurrent reservations, daily limits, refunds, missing telemetry, cache identity separation, body size and safe messages.
- Full suite at this branch: 1,722 passed, 2 skipped, 0 failed. `npm run check`, `npm run mod-status`, syntax and whitespace checks passed.
- Browser preview verified the included-AI card in Settings, without entering an API key. Real signed-in model quality still needs a production smoke test.
- Wrangler 4.164.0 dry-run bundled the complete Worker, including its new binding. No deployment or live inference was performed by the dry run.
- Miniflare 4.20260730.0 executed the compiled Worker against a real local SQLite Durable Object: 80 concurrent reservations verified global limits, account limits, idempotent refunds and separate daily objects.

Reproduce the runtime check in a temporary development checkout:

```sh
npm install --no-save --package-lock=false miniflare@4.20260730.0 wrangler@4.164.0
npx wrangler deploy --config worker/wrangler.toml --dry-run --outdir /tmp/roamwise-basic-ai
node tools/check-basic-ai-runtime.cjs /tmp/roamwise-basic-ai/worker.js
```

## Sources checked 18 November 2026

- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/
- https://developers.cloudflare.com/workers-ai/platform/limits/
- https://developers.cloudflare.com/ai-gateway/features/unified-billing/
- https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus
- https://help.openai.com/en/articles/20001626-api-credits-benefit-for-eligible-chatgpt-subscriptions
