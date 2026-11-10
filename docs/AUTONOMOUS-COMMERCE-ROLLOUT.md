# Autonomous commerce: controlled scale-up gate (November 2026)
This is a **readiness and accounting safety layer**, not a deployed payment/fulfillment integration. It adds no supplier orders, new charges, refunds, promises or spending. Import `worker/lib/commerce-readiness.js` into a future authenticated operator dashboard and order orchestration service after integration review.

## Channels
- **Qikink POD: target 100+ approved variants/products.** Current server-priced catalogue contains only 3 products. Never invent Qikink SKU IDs, product images, prices or stock. Import supplier data only from an authorized Qikink API response and keep draft until variants, sample, landed costs, shipping, returns, margin, and end-to-end paid-order tests pass. No automatic wallet top-up.
- **Travel packages: target 20–50 curated packages.** Each requires verified partner rates, itinerary, availability and cancellation policy. Never publish fabricated departures, margins or availability.
- **RoamWise Pro:** preserve existing entitlement/payment endpoints; do not grant subscriptions on a screenshot or unpaid inquiry. Confirm plan terms and customer-facing policy.
- **Property commissions:** use signed partner-specific commission agreements and only count verified completed eligible bookings. Commission basis, GST, refunds, owner payouts and monthly settlement must be explicit.
- **Art sales:** require original-work authorization, artist pricing, packaging, shipping, returns and settlement agreement before payment.
- **Creator referrals:** explicit consent, unique attribution, contractual commission rate, refund clawback, and auditable settlement. No implied paid work or commission promise.

## Safety and reliability
1. Payment verification must be server-side and compare immutable order ID, amount, currency, environment and merchant.
2. Supplier submission must be idempotent, with an atomic Firestore claim/lease before external API calls. **Current `shop-fulfil.js` uses a non-atomic read/patch; concurrent cron invocations may submit the same order.** Block autonomous live scaling until the atomic lease is implemented and tested. Unknown supplier responses must be reconciled with the provider, never blindly retried.
3. No autonomous refunds, vendor payouts, paid ads, price increases or new subscriptions without founder-approved limits.
4. Publish truthful dispatch/return/consumer support policies; show actual fulfillment state to customers; reconcile settlement against gateway and supplier ledger.
5. Queue exceptions for missing stock, rejected payments, fulfillment uncertainty, refunds and chargebacks. Founder sees a daily concise exception report, not every routine event.
6. Cap AI inference and supplier API spend. Rate-limit checkout and referral attribution to prevent fraud.

## Pilot acceptance gates
- Sandbox: duplicate webhooks, concurrent workers, payment mismatch, supplier timeout, partial failure, refund, stockout, Qikink wallet shortage, cancelled order, settlement mismatch.
- Production: five founder-authorized small paid orders with verified delivery, then 20; increase inventory only after no duplicate fulfillment and a positive contribution margin.
- Weekly: rank candidates by actual paid demand, net contribution after returns/support, supplier SLA and customer complaints; stop losing SKUs. SEO changes should be grounded in Search Console data, not ranking guarantees.

## Integration next steps
Implement atomic supplier-claim transaction in Firestore REST or durable object, add `reviewListing` at the authenticated publish and checkout gate, and `earnedCommission` at verified completed settlement only. Add a read-only admin screen for `readinessReport` and exception queues. No public storefront/catalogue expansion is enabled by this PR.
