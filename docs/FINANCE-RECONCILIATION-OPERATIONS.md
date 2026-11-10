# Finance reconciliation gate — follow-up
The pure module `worker/lib/finance-reconciliation.js` provides fail-closed order exception detection and IST day calculation. It does **not** call the gateway, bank, Qikink or Firestore. It must not be presented as a production reconciliation service.

## Production sequence
1. Fetch verified Cashfree order/payment/refund states server-side; obtain bank settlement reports, Qikink order status and append-only journal entries.
2. Normalize each source into immutable, timestamped, INR-paise records with stable order IDs and source provenance.
3. Call `reconcileBatch` and queue mismatches. Never automatically resubmit a supplier order or release a partner payout from an unresolved mismatch.
4. Build a transaction-backed wallet and journal migration from KV. Old KV credits are **claims to reconcile**, not authoritative assets. Backfill only against verifiable source payment events and signed-off refund histories.
5. Build a daily IST aggregate expense reservation transaction across all AI/SEO/research vendors. Enforce ₹500 hard cap; aim ₹100–₹200. `istBudgetDay` is a date utility, not an enforcement service.
6. Add provider-specific signed webhooks, event replay protection, settlement idempotency, accountant-reviewed GST/TCS/TDS classification and a customer-visible refund state machine.
7. Execute unit, emulator and sandbox tests before enabling new live operations. Require explicit approval for provider payments and legal wallet classification.

## Known risks
Current `worker/handlers/wallet.js` stores and spends wallet credit via Cloudflare KV read/modify/write; concurrent requests can overwrite balances. `worker/lib/shop-fulfil.js` does not use an atomic claim yet. `worker/handlers/shop-wallet.js` describes automatic bank refunds before settlement is independently confirmed. These remain production blockers.
