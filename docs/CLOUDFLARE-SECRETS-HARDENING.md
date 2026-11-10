# RoamWise Cloudflare secrets hardening
No credentials are included in this repository or this change. This PR does **not** create or rotate real Cloudflare secrets.

## Recommended controls
1. Store API credentials in Cloudflare **Worker Secrets** or account-level **Secrets Store**, encrypted at rest. Use scoped API tokens rather than personal passwords wherever providers support them. Never store raw passwords in Firestore, KV, public JavaScript, Wrangler `vars`, GitHub issues or source.
2. In Cloudflare dashboard, select the relevant Worker → Settings → Variables and Secrets → Add → **Secret**. Use staging and production separately. Avoid posting secret values in chats, commits or logs.
3. Audit bindings for Cashfree, Qikink, Firebase service account, email providers and AI inference. Verify exact environment-specific names against current deployed Worker before adding or changing anything. `secretReadiness` only covers two known groups; it does not prove full application readiness.
4. Rotate any key previously exposed in source, CI logs or messages. Prefer least-privilege permissions, MFA/passkeys for admin accounts, separate roles, IP restrictions when supported, and short-lived credentials.
5. Configure GitHub secret scanning and branch protection, security headers, dependency review, audit logging, rate limiting, backups and incident recovery. None is a guarantee against compromise.
6. Do not automatically rotate unknown production credentials: rotation can break checkout, webhook verification or fulfillment. Stage, verify, then cut over.
7. Before enabling autonomous finance, complete atomic wallet ledger, supplier claim wiring, provider reconciliation and live budget enforcement; security readiness is separate from finance correctness.

Cloudflare documentation: https://developers.cloudflare.com/workers/configuration/secrets/ and https://developers.cloudflare.com/secrets-store/integrations/workers/
