# RoamWise automation control plane — initial safe foundation

This is a staged design, **not a deployed fully autonomous system**. This commit adds a reusable, testable policy/state module. It does not grant live Cloudflare access or execute workflows. Do not claim any integrations are enabled until verified against the actual Worker account.

## Existing architecture found in source
- `worker/wrangler.toml` configures `RW_KV` and `AI_USAGE` bindings (same namespace), a Workers AI binding, and hourly/daily cron triggers.
- `worker/lib/qikink-client.js` reads Qikink credentials from Worker secrets and supports token issuance and **order creation**, not seller-account management or artwork/product creation.
- `worker/lib/shop-fulfil.js` stores a short-lived supplier token in server-only Firestore and submits verified paid orders behind config flags.
- `worker/lib/shop-catalogue.js` is the checkout price/SKU allowlist; never accept client-provided prices.
- Worker sources cannot prove that deployed secrets, bindings, or live permissions actually exist.

## Persistent source-of-truth boundaries
- **Firestore**: product approvals, order/transaction ledger, payout status, staff permissions, task approvals, customer consent, versioned knowledge. Use transactions for financial idempotency; Firestore Security Rules apply to clients.
- **KV**: anonymous public destination cache, idempotent *read cache*, non-sensitive automation checkpoints, daily budget counters and short-lived summaries. KV is eventually consistent and is **not** a lock, payment ledger, exclusive rate limiter, or authoritative user profile.
- **R2**: optional image/media/backup objects once a bucket is actually bound and permissioned; never place originals in KV.
- **Worker secrets**: Qikink/Cashfree/email API keys and service-account credentials; NEVER plain passwords in code, KV, Git, client-side JS or chat. Prefer official OAuth/API tokens over user/password storage. Rotate/revoke credentials on schedule.

## Approval and cost policy
- Default policy: maximum 24 eligible checks/day per job, minimum 1 hour cadence, 8,000 estimated Workers AI neurons/day for automation, zero discretionary paid AI cost.
- Reserved categories require task-specific, dated authorization: payments/refunds/payouts, supplier order submission, publishing, sending emails, changing permissions/credentials, deployments and customer-data export.
- AI outputs are untrusted suggestions; no self-modifying production code, autonomous auto-merge or unchecked self-training. Use human-reviewed and versioned knowledge edits with tests/rollback.
- AI budget must use **actual provider usage telemetry** before enabling jobs. This module uses estimates only and is not an account-level billing cap; apply Cloudflare usage analytics, rate limits and account alerts separately.
- Persistent cron execution requires durable transactions and deduplication beyond KV; the provided KV state helper does not guarantee lock safety.
- Do not auto-spend, create live orders, send bulk pitches, publish unreviewed content, or deploy unattended. Respect consent and unsubscribe requirements for marketing.

## Rollout in priority order
1. Verify deployed Cloudflare bindings, environment and secret *names* through authorized account access; never log values. Confirm Qikink documented endpoints/supported permissions.
2. Connect this policy module to admin-authenticated job registry and Firestore task ledger; add job execution receipts and reviewable approvals. Introduce only read-only/draft jobs first.
3. Shop: sync approved supplier product data into Firestore and public catalogue; whitelist approved SKU/price/shipping; use existing payment status verification before fulfillment.
4. Content and Ailon Tusk: source-ranked travel knowledge, freshness/feedback review queue, cache-first answers, budgeted AI fallback.
5. Add opt-in artist/property onboarding review, support drafts, finance reconciliation reports and operational summaries, each with role-scoped access.
6. Introduce metrics, alerting, failure queues, rollback and monthly cost reconciliation; do not equate free-tier allowances with a guarantee of zero overages.

## Test
`node --test tests/ops-control.test.mjs`

The controls are currently a library only: **no new scheduled automation was enabled, no live credentials were read, no financial transaction was initiated and no Worker was deployed**.
