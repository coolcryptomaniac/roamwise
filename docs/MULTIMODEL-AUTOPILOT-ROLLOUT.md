# Multi-model autopilot deployment (staged)
This PR adds a **disabled-by-default, read-only reviewer library**. It does not modify Worker scheduled() routing, install Cron Triggers, provision provider credentials, perform actual reviews or send reports.

## Providers
Cloudflare AI Gateway supports OpenAI, Anthropic, Groq, Google, DeepSeek, Mistral, xAI and Workers AI. Use the REST chat-completions endpoint with Cloudflare account credentials, or gateway BYOK/Unified Billing as supported. Model availability changes: validate every ID in the account catalog before enablement. The example Groq model ID may be retired; substitute a verified model.

## Safe rollout
1. Provision Cloudflare AI Gateway with billing/spend limits and scoped Worker secret `CLOUDFLARE_AI_TOKEN`, plus non-secret account ID. Never commit credentials.
2. Connect approved model IDs and an actual cost reservation and settlement path. PR #728 does not yet enforce real provider spend.
3. Build a verified telemetry adapter: Cloudflare logs/analytics, GitHub CI/security alerts, Search Console, Cashfree reconciliation and user support exceptions. Strip personal data.
4. Wire a scheduled() handler (weekly and monthly UTC Cron Triggers), durable job ID and Firestore audit record. Do not run expensive duplicate jobs on retries. Weekly: errors, uptime, broken checkout, performance, SEO, content integrity, lead/sales conversion. Monthly: security, dependency updates, finance reconciliation, backup restore, accessibility, cost and architecture.
5. Generate read-only evidence-based recommendations, open a draft GitHub PR only with bounded changes and passing tests. Human approval for production merges/deploys, customer-facing marketing, spending and financial operations.
6. Enforce request concurrency, provider timeouts, total per-run token caps, daily ₹500 maximum, no raw prompt logging of PII, and alerts for failed cron runs.
7. Verify locally with mocked Gateway responses, then staging integration and a controlled production pilot.

Cloudflare docs:
https://developers.cloudflare.com/ai-gateway/get-started/
https://developers.cloudflare.com/ai-gateway/usage/chat-completion/
https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/
