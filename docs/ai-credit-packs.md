# RoamWise AI credit packs

Implementation prepared 18 November 2026, stacked on shared-AI PR #812. Checkout is disabled in configuration. This document is not evidence of deployed payment collection or a live provider test.

## Product and pricing

Travellers purchase RoamWise AI service credits with Cashfree, then choose a server-approved model in `/ai-credits/`. No personal provider account or API key is required. A quote precedes each paid answer. Buying credits does not switch Automatic mode to paid usage, change the included free allowance, or alter existing Founder/Pro entitlements.

| Pack | Credits |
| ---: | ---: |
| INR 10 | 1,000 |
| INR 20 | 2,000 |
| INR 50 | 5,000 |
| INR 100 | 10,000 |
| INR 250 | 25,000 |
| INR 500 | 50,000 |
| INR 1,000 | 100,000 |

One credit is one paise of RoamWise AI service, not one answer or a transferable currency. There is no automatic renewal, auto-top-up, credit expiry, cash-out or connection to the travel wallet. Unused-credit refund requests go to support and the original payment method. This patch does not initiate refunds itself.

Rate card `2026-11-18-v1`: INR 90 per USD is a disclosed billing conversion, not a live exchange-rate claim. Convert the model's published input/output tariff into paise; round up. Gateway requests add 5%, rounded up. RoamWise's service fee is 25% of those components, minimum one paise, rounded up. The displayed ceiling and pack price are the full customer payable amount; any applicable taxes must be accounted for within that amount, not unexpectedly added to a confirmed quote.

Example: Standard model, 1,500 input and 350 output tokens: INR 0.03 model tariff + INR 0.01 service fee = **4 credits / INR 0.04**. This is an example, not a promised number of answers per pack. Quotes reserve more conservatively using UTF-8 bytes and the full 768-output-token ceiling. Valid usage telemetry reduces the final debit. Charges never exceed the confirmed quote; RoamWise absorbs any overrun. Missing usage telemetry or failed generation charges the traveller zero. The provider budget retains unknown costs.

The tariff is not the provider invoice. Free allocations and discounts can reduce RoamWise's actual cost. Existing credits buy future usage at the displayed rate; each request is quoted independently. Rates fail closed after 18 December 2026 until rechecked and updated, so stale pricing cannot keep collecting money silently.

## Models and the BYOK distinction

- Standard: Cloudflare `@cf/google/gemma-4-26b-a4b-it`, USD 0.10/M input and 0.30/M output tokens.
- Optional GPT-4.1 mini: Cloudflare AI Gateway `openai/gpt-4.1-mini`, USD 0.40/M input and 1.60/M output tokens, with a disclosed 5% gateway component. It stays disabled until the owner configures and funds an authenticated gateway. Request caching and gateway prompt logging are disabled for this path.
- More models require adding a reviewed model, pricing and output policy to the server allowlist. Clients cannot pass arbitrary provider URLs, model names, prices, quotas or credentials.
- Cloudflare Unified Billing is managed access paid by RoamWise. It is not BYOK and does not create separate provider accounts for customers.
- OpenRouter's OAuth flow can connect a user's own account after authorization. Management APIs can provision keys under RoamWise's centrally funded account, which is also managed access. Neither mechanism promises silent creation/funding of arbitrary personal OpenAI, Anthropic or Google accounts.
- Existing manual BYOK remains available, with its existing terms. No new BYOK surcharge, OAuth permission, customer credential collection or automatic provider signup was added.

## Payment and balance integrity

- Firebase verifies the account; verified email/phone required. The per-account SQLite Durable Object name uses a hashed UID. Order IDs contain its 128-bit hash prefix and a random suffix, never raw identity.
- Server-defined packs only. New orders use stable UUID Cashfree idempotency keys, a 30-minute expiry and one unresolved checkout at a time. Live and sandbox orders are distinct and cannot fund each other.
- Credits require a backend lookup of the original order, matching customer, INR amount, `PAID` state and one captured `SUCCESS` payment. A browser return URL, screenshot, UTR or success toast cannot grant credit.
- Atomic payment grants are idempotent. Authenticated status checks and signed raw-body webhooks use the same reconciliation. Refund records are fetched from Cashfree; successful refunds for the funding payment reverse credit monotonically. Refunds for unrelated failed attempts do not reverse the successful payment's credits.
- Pending refunds pause spending until reconciled; disputes/chargebacks put the account on review hold. A reversal after consumption can make the service balance negative, blocking future spend; it never causes an automatic charge to the customer.
- Quotes are tied to the authenticated account, model, prompt hash, rate version and five-minute expiry. A transaction reserves available credits before inference. Replaying a completed quote returns its result without another charge or inference.
- Failed calls release the customer reservation; abandoned holds recover by alarm. Quote/result records expire after 24 hours. Financial order and usage receipt records remain; prompts, API keys and payment-session IDs are not retained in the credit ledger. Short answer text is retained for up to 24 hours solely for request recovery.
- Per-account throttling: 6 quotes/minute, 3 generation starts/minute, 100 attempts/day and 20 checkout preparations/day. A separate atomic provider budget initially allows INR 20/day across paid generation. This is deliberately small for the initial audience and is an estimate, not an account-wide Cloudflare billing guarantee. Failed upstream calls may still cost RoamWise; their estimates stay reserved.
- A customer can recover a network-interrupted answer using the same quote. Paid API failures do not fall through to another paid model. Balance data is `private, no-store`.

## Release checks still required

1. Merge dependencies only after their reviews. Deploy the new `AICreditAccount` and `AICreditBudget` bindings/migration with `AI_CREDITS_ENABLED=false`. Keep the class bindings during rollback and never reset/delete the financial namespaces.
2. In staging, use actual Cashfree sandbox credentials and a verified non-Pro test account. Confirm INR 10 and INR 1,000 order totals, captured-success verification, duplicate delivery, return-before-webhook, wrong account, expired checkout, partial/full refund and pending/rejected refund events. Validate the actual payloads and capture behaviour for the existing API version.
3. Configure payment, refund and dispute notifications to `/ai/credits/webhook` in Cashfree. An order's notify URL alone is not evidence that refund/dispute webhooks are configured. Confirm delivery/retry behaviour and an operational reconciliation/recovery procedure before collecting real money.
4. Review the rate card, final-price tax allocation, refund handling, accounting export/invoice integration, retention and operator procedures for account holds. The existing Firestore invoice pipeline does not automatically ingest this new SQLite ledger; no tax invoice integration is claimed.
5. With funded model access, smoke-test an English and Hindi answer and actual token usage. Review latency, rounding, price ceiling, zero debit on failure, daily capacity and cost telemetry. No production inference or real payment was made during development.
6. For GPT access, configure a real authenticated Gateway with adequate credits, set `AI_CREDITS_GATEWAY_ID`, then opt in with `AI_CREDITS_GATEWAY_ENABLED=true`. No gateway or provider account is auto-created by this patch. Set `AI_CREDITS_ENABLED=true` only once checkout and fulfilment are verified. Size the daily budget to paid demand before advertising availability.
7. Regularly reconcile refunds/disputes and export financial records for recovery/accounting. The global daily budget object is a launch coordinator; it is not a million-user throughput claim. The per-account balances are sharded, but large-scale capacity needs measured traffic and provider limit increases.

## Verification and sources

Focused tests exercise duplicate grants, concurrent spending, refund ordering/holds, quote expiry/tampering, interrupted requests, server-defined pricing, invalid signatures, provider errors, missing usage and disabled UI. The runtime check additionally runs the real SQLite storage implementation with 100 concurrent paid-ledger operations, alongside 80 shared-free-pool reservations. No payment/inference network calls are made by these tests.

The local browser preview confirmed the Settings link, all seven pack amounts, and disabled checkout/paid-answer controls while the backend is unavailable. Signed-in UI tests use mocked payment and model responses; they check consent, the separate quote/confirmation steps and recovery of the same request after a network interruption. This is not evidence of a successful real checkout or provider response.

Official documentation checked 18 November 2026:

- https://developers.cloudflare.com/ai-gateway/features/unified-billing/
- https://developers.cloudflare.com/ai-gateway/usage/worker-binding-methods/
- https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/
- https://developers.cloudflare.com/ai/models/openai/gpt-4.1-mini/
- https://openrouter.ai/docs/guides/overview/auth/oauth
- https://openrouter.ai/docs/guides/overview/auth/management-api-keys
- https://www.cashfree.com/docs/api-reference/payments/latest/orders/create-order
- https://www.cashfree.com/docs/api-reference/payments/latest/payments/get-payments-for-an-order
- https://www.cashfree.com/docs/api-reference/payments/latest/refunds/get-all-refunds-for-an-order


## Forward-port review (25 November 2026)
The included-AI backend and browser flags remain disabled. Paid sales and Gateway access remain false. Do not enable until current Cashfree sandbox capture/refund/webhook, billing reconciliation, authenticated model usage and invoice/export checks are signed off. This branch does not activate sales or change travel wallet balances.
