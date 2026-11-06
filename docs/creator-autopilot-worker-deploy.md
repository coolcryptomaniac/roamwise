# Creator Autopilot Cloudflare Worker — deployment

This integration exposes an **operational authenticated API** for deterministic inbox triage, creator/property matching proposals, and data-maintenance analysis. It does **not** yet pull Gmail messages, read Firestore, make AI model calls, dispatch email, or create revenue by itself.

## Configuration

The existing `worker/wrangler.toml` already declares `RW_KV` and daily/hourly crons. Existing secret `AGENTMAIL_ADMIN_TOKEN` authenticates the server-to-server admin endpoint; do not put this token in a browser, static dashboard or GitHub source. To enable the daily observe-only KV heartbeat, add `CREATOR_AUTOPILOT_ENABLED = "true"` as a Worker environment variable using Cloudflare settings or a secure workflow. Without it, API triage/plan/maintenance still run, but the heartbeat is disabled.

Deploy the existing Worker GitHub workflow. Confirm `GET /health` first, then call `GET /admin/creator-autopilot` with `Authorization: Bearer <server-token>`. The route deliberately has no public CORS.

## API

`POST /admin/creator-autopilot` with bearer token and JSON:

- `{"action":"triage","messages":[{"id":"m1","subject":"Creator collaboration","snippet":"..."}]}`
- `{"action":"plan","creators":[{"id":"c1","email":"creator@example.com","town":"Almora","outreachConsent":true}],"properties":[{"id":"p1","town":"Almora","creatorMatching":{"enabled":true}}],"history":[]}`
- `{"action":"maintenance","creators":[],"properties":[],"outbox":[]}`
- `{"action":"run"}` — store heartbeat report in KV, only when enabled.

All actions are read-only/draft-only; no send, delete, payment, booking or automatic credential use. Input arrays limited to 100 records; plan output can include creator email addresses, so use server-side callers only. Never paste sensitive messages into public URLs.

## Next integrations

1. A server-side Gmail OAuth connection with least-privilege read scopes and consent, or the existing connected Gmail workflow outside Worker. No Gmail tokens currently wired to this route.
2. Firestore server credentials with strictly scoped collection reads, plus a durable outbox and approval records.
3. AgentMail sender adapter already exists at `/admin/agentmail/outreach`; it **requires explicit opt-in and human approval**. Do not remove its suppression and quota checks.
4. Durable Objects for atomic quotas/idempotency before unattended sends.
5. Model-assisted categorization and draft generation with structured validation and cost ceilings.
6. GitHub maintenance PR agent using GitHub App credentials, branch protection and required CI, never direct unreviewed production changes.

This API is an intermediate operational milestone, not a fully self-managing company. Do not enable unattended payment, refunds, access changes or legal commitments.
