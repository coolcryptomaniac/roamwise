# RoamWise Creator Autopilot — operating contract (v1)

The new `worker/lib/creator-autopilot-core.mjs` is a pure decision engine, **not a deployed autonomous agent**. It can generate reviewable local opportunity drafts from caller-provided records, but it cannot read email, send outreach, spend money, change roles, or write databases. The default policy denies these operations.

## Architecture for production

1. **Ingestion:** Authorized Cloudflare Worker jobs ingest creator applications, consent/suppression updates, approved property availability, provider-verified analytics, and permitted email metadata. Store minimal records in Firestore; use KV for cache and rate limits. Keep raw email bodies out of KV unless necessary and consented.
2. **Brain:** Deterministic eligibility and commercial rules run before any optional model. The model may summarize, categorize, suggest copy and rank opportunities, but its text cannot override policy decisions. Unknown facts remain unknown.
3. **Opportunity queue:** Each proposed action receives creator ID, property ID, action type, deduplication key, evidence, confidence, consent provenance, expiry, and draft text. Never invent bookings, rates, audience sizes, or partner approval.
4. **Executor:** Separate authenticated server endpoints with founder/admin role checks, per-channel quotas, signed provider webhooks, idempotency keys, suppression lists, audit trail and retry/backoff. Default is human approval for first contact and all paid commitments, booking/refund decisions, access changes and bulk campaigns.
5. **Maintenance:** Daily dry-run data quality reports (duplicates, missing towns, stale records, unreachable links), weekly creator/property match reports and budget alerts. Automatic low-risk operations may include refreshing cache and preparing drafts; destructive operations require approval.
6. **Growth:** Measure sourced enquiries, opted-in responses, accepted collaborations, confirmed bookings, settled commissions, acquisition cost and churn. Only count paid subscribers from a verified payment/subscription event feed. Revenue projections must not be presented as realized revenue.

## Enablement checklist

- [ ] Confirm admin authorization and Firestore rules for a server-side job.
- [ ] Add a consent field with timestamp/source and unsubscribe processing.
- [ ] Verify property owner approval, availability and commercial terms.
- [ ] Wire Gmail/AgentMail through authenticated server-side connectors, never expose credentials to browsers.
- [ ] Add signed inbound webhooks and sender-specific rate limits.
- [ ] Build a durable Firestore outbox and delivery/reply audit log.
- [ ] Test retry, opt-out, duplicate sends, quota exhaustion and failed authentication.
- [ ] Test on staging before enabling any scheduled send.
- [ ] Verify actual Creator Studio login with a test creator and a founder account.
- [ ] Deploy Worker and static site and confirm production health checks.

## Security boundaries

No model-generated action is trusted as an authorization token. Never expose API keys in client code, bypass Firebase verification, or allow autonomous payouts/refunds, partner agreements, verification or account deletion. Maintain an emergency stop and audit log. A goal of near-zero routine admin does not imply zero oversight for legal, financial or reputational decisions.

Run unit tests with `node --test tests/creator-autopilot.test.mjs`.
