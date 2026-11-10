# RoamWise wallet and accounting — controlled design, not a licensed stored-value wallet
**Status:** proposed controls and pure testable utilities only. No customer deposits, transfers, payouts, crypto wallet, or expense automation activated.

## Founder discretionary AI spending
Daily IST (Asia/Kolkata) **hard ceiling ₹500**, target ₹100–₹200. Allowlisted AI inference, SEO tools, research APIs, previously approved marketing and automation only. A hard cap is not permission to buy subscriptions or ads without vendor/price authorization. Reserve funds atomically before calling paid services; aggregate all workers/providers in one durable ledger, not KV counters. Founder can pause instantly. Never roll unused budget forward. Alerts at ₹200, ₹400 and ₹500; no auto-increase. Statutory obligations, customer refunds and partner payables are NOT limited by this discretionary budget and must be handled by their own liquidity/approval controls.

## Separate concepts
1. **Customer account**: order history, Cashfree payments, refund tracking and non-cash promotional rewards. Promotional credits have explicit expiry, exclusions, caps and no cash redemption or person-to-person transfers.
2. **Customer refund liability**: never pretend a KV credit is bank money. Return to original source through the payment provider, except customer-directed lawful alternatives. Avoid silently converting refunds to store credit.
3. **Partner dashboard**: property/artist/creator payable and settlement status, verified contract-specific rates, tax withholding, clawbacks and invoices; not a transferable wallet.
4. **RoamWise operating ledger**: separate cash, gateway clearing, taxes payable, deferred revenue, partner payable, supplier payable, discounts, fees, refunds and chargebacks. Double-entry, paise precision, one immutable journal per event and a reversal journal for corrections.
5. **Real transferable stored value**: disabled unless licensed PPI issuer/bank partnership, legal review, KYC, fraud controls, customer protection and payment compliance are complete. Do not call the present system a PhonePe/Amazon Pay equivalent.

## Security and reliability blockers identified in repository
- `worker/handlers/wallet.js` stores balances in Cloudflare KV and uses read/modify/write without atomic compare-and-swap. Concurrent spends or credits can lose updates or overspend. KV cannot be the authoritative financial ledger.
- `worker/handlers/shop-wallet.js` automatically credits a failed shop order to an internal wallet and promises an automatic bank refund. This needs an explicit refund-state machine and reconciliation with the original payment before it can be described as guaranteed.
- `worker/lib/shop-fulfil.js` patches an order to `submitting` without a transactional claim. Concurrent workers may submit twice. Resolve before autonomous scale.
- Signed email links to mutate refunds should be one-use, short-lived, authenticated and separately confirmed; avoid action-on-GET links and never embed PII in URLs.

## Production design
- Authoritative append-only Firestore journal with atomic transactions, immutable event IDs, journal idempotency keys and per-account sequence/version. Use server-only credentials; rules deny client writes. Firestore is not literally immutable against privileged administrators: export snapshots to independent, versioned, write-once-capable storage, hash-chain batches, sign daily roots with protected keys, and independently reconcile bank/gateway statements.
- Debit and credit entries must balance; no negative customer balances; reject replayed payment/webhook events; verify signature and order amount/currency/status on server; role separation and two-person approvals for payouts and large refunds.
- Maintain original payment source and refund IDs. Track initiated/accepted/settled/failed/chargeback states. Generate sequential GST invoice numbers only from approved seller identity and applicable tax treatment; do not guess tax rates or commission bases. Account for GST TCS/TDS where legally applicable; professional review before filing.
- Keep private bank details and KYC out of public pages, logs, marketing exports and AI model prompts. MFA/passkeys for privileged accounts, scoped service credentials, audit alerts, backups, restore drills, and penetration testing.
- Customer-facing benefits: free itinerary history, verified booking tracking, optional promotional points after settled transactions, transparent rewards terms, faster repeat checkout through the licensed gateway; no fabricated cashback promise.
- Reconcile daily: gateway ↔ orders ↔ journal ↔ supplier ↔ bank settlement; quarantine mismatches. Weekly exception report and monthly accountant-approved closing.

## Regulatory boundary
Review RBI 2021 PPI master direction, the **draft** 2026 PPI revision (not yet operative merely because published), RBI September 2025 Payment Aggregator Directions, and CBIC GST ecommerce/TCS obligations. Closed-loop instruments for own goods are not equivalent to multi-merchant wallets. Avoid custody of third-party funds without the right provider/structure.

## Launch gates
1. Replace KV authority with atomic journal; migrate existing balances only after reconciled source evidence.
2. Disable/repair automatic wallet-refund promises and unsafe concurrent spend/fulfillment flows before increasing volume.
3. Test duplicate webhooks, parallel spending, reversals, failed refunds, merchant settlement, timezone boundary and GST treatment.
4. Obtain counsel/CA approval of wallet classification and invoices, and provider confirmation for marketplace split settlements.
5. Only then enable a small sandbox pilot and controlled production rollout. No production wallet launch is authorized by this document.
