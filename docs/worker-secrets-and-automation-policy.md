# RoamWise Worker: secrets and permissioned automation (low-traffic mode)

This is a code-level security guide, **not proof of any deployed secret, Cloudflare account setting, billing cap, or AI integration**. The live Worker is `roamwise-api`; its settings must be checked in Cloudflare separately. The Worker deployment workflow is triggered by changes to `worker/**` on **main**. Review and test this branch before merging.

## What belongs in the Worker

Use **Cloudflare Worker Secret** bindings for credentials an already-authorized server-side function needs, not for personal website passwords.

| Current use | Binding name(s) found in RoamWise code | Safest scope |
| --- | --- | --- |
| Firebase server-side reads and verified payments | `FIREBASE_SERVICE_ACCOUNT_JSON` | Dedicated service account, least-privilege Firestore/FCM scopes; protect key; never client-side |
| Cashfree live checkout | `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` | Merchant checkout API only; no autonomous refunds/payouts |
| Qikink verified paid shop orders | `QIKINK_CLIENT_ID`, `QIKINK_CLIENT_SECRET` | Order creation only after verified payment, SKU/pricing approval and idempotency |
| AgentMail outreach/delivery | `AGENTMAIL_API_KEY`, `AGENTMAIL_ADMIN_TOKEN` | Sender and admin access separated; human-approved, consent-aware initial outreach |
| Optional AI services | `GROQ_API_KEY`, `SARVAM_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | Provider-specific limited-budget key; keep unfunded routes disabled |
| Telegram customer support | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` | Dedicated bot; signed webhook validation |
| WhatsApp Cloud API | `WHATSAPP_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` | Dedicated business integration, minimum scopes |
| Public-form verification | `TURNSTILE_SECRET` | Turnstile verification only |
| Signed internal operations | `REFRESH_TOKEN`, `WALLET_LINK_SECRET`, `TUSK_REPORT_TOKEN`, `MUSIC_LINK_SECRET` | Independent random secrets per purpose; never reuse |

This list is an **inventory of names in source**, not confirmation they exist in production. IDs, model names, limits and toggles that are not confidential belong in `[vars]`, not secrets. Existing `CASHFREE_ENV=live` and `QIKINK_ENV=live` are operational settings; changing them or setting credentials does **not** authorize real payments/orders.

**Keep `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in deployment CI (GitHub Actions), not inside the application Worker.** A narrowly scoped deploy token is preferable to a global account token. Do not put GitHub personal access tokens, Google/Meta personal passwords, bank logins, UPI PINs, recovery phrases, OTPs, or 2FA backup codes in Worker secrets. Keep those in a password manager. A required OAuth refresh token, if permitted by the provider, may be stored as a dedicated revocable secret for a narrowly approved integration.

## Adding one secret

Dashboard: Cloudflare > Workers & Pages > `roamwise-api` > Settings > Variables and Secrets > Add > **Secret**. Paste the credential **there**, not into GitHub, a public page, AI chat, logs, KV or a screenshot.

CLI (from the `worker/` directory, when authorized):

```sh
npx wrangler secret put AGENTMAIL_API_KEY
```

The CLI securely prompts for its value. **`wrangler secret put` publishes a new Worker version immediately**; for a staged change use `wrangler versions secret put` and deploy deliberately. Never paste secret values into a shell command history, CI log, ChatGPT conversation, or documentation.

Local development: `worker/.dev.vars` or `worker/.env`, never both. The repo `.gitignore` ignores both, including environment variants; example/template files may be committed without real values. Existing tracked files must still be audited manually; a new gitignore rule does not scrub history. Rotate any exposed keys.

## Cost and safety guardrails

1. Keep `MANAGED_AI_ENABLED=false`, `AI_MIN_PAID_BUDGET_PAISE=0`, `AI_FREE_DAILY_PAISE=0`, `GROQ_MONTHLY_REQUEST_CAP=0`, and `AI_PREMIUM_ENABLED=false` until explicitly authorized to spend.
2. **Zero is zero**: the `/ai` and `/kala/chat` Groq integrations now pass the literal configured cap to the shared quota function. Previously, `0` silently became a 12,000-request allowance.
3. Cloudflare Workers AI is a separate billable product on paid plans once its daily free allocation is exhausted. Other AI routes can call it even while `MANAGED_AI_ENABLED=false`: audit them individually before claiming an overall spending ceiling. KV counters and Cache API rate limits are not atomic.
4. Automation's reusable `ops-control.js` policy now **rejects unknown actions**, validates cost estimates, and requires dated approvals for payment, refund, payout, supplier order, publishing, email-send, credential change, deployment, permissions, and customer-data export. **This is still a library, not a deployed autonomous executor.**
5. Draft/read/triage/report/summarize/preview can be made automatic after authenticating a server-side caller and validating consent and scope. Sending messages, placing orders, approving refunds, making financial commitments, hiring, changing credentials and production deployments still require the founder's explicit approval. A secret is not an approval.
6. No generic `run arbitrary tool`, `read env secret`, or public endpoint should expose secrets to a language model. Authenticate, authorize, validate exact action and inputs, log redacted receipts, allow cancellation/disable, and restrict provider API keys.

## Test and review

```sh
node --test tests/ops-control.test.mjs tests/kala-worker.test.js
cd worker && npx wrangler deploy --dry-run
```

Before deployment: inspect production **secret names only**, confirm Cloudflare billing/AI usage and alert thresholds, check live payment webhook signatures and order idempotency, and run staging tests. A GitHub PR, local test, or Worker health response does not confirm live payment or supplier fulfillment.
