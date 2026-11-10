# RoamWise autonomous AI operations: gated implementation
## Existing code
PRs #723–#726 have been merged. This PR adds a **read-only, source-agnostic operations scorecard**. It does not wire production analytics, redesign the public site, launch new SKUs, or enable AI actions.

## Workstreams and release order
1. **Financial safety**: replace Cloudflare KV wallet authority with atomic ledger, provider-confirmed refund states, signed webhooks, idempotent fulfillment, and hard aggregate IST daily ₹500 spend reservation. No live self-spend until proven.
2. **Sales**: daily consent-aware segmented outreach using approved offers and sender limits. Log send/reply/order attribution and opt-outs. Never claim paid commitments or invented discounts. Prioritize warm customers and B2B prospects, not scraped consumer spam.
3. **Product supply**: 100+ Qikink SKUs only after actual supplier variant IDs, approved original artwork, sample QA, landed costs and delivery rules. 20–50 travel packages only after verified partner availability, rates and cancellation terms. Draft-only for missing information.
4. **SEO and UI**: improve real mobile Core Web Vitals, keyboard access, readable product cards, trust indicators, clear total pricing and order status. Use Search Console indexing/click-through evidence; no fabricated reviews or guaranteed rankings. Test checkout UX on Android and desktop before rollout.
5. **Finance and revenue**: separate product sales, Pro subscriptions, accommodation commissions, creator referral income, artist settlements and taxes; reconcile source records daily and publish invoices only with correct seller/tax identity.
6. **Monitoring**: feed verified visits, qualified leads, payments, fulfillment, refunds, support and outreach into `commerceScorecard`. Missing data stays unknown. A founder digest should highlight exceptions, revenue and next best action.

## Release gates
- Unit + Firestore emulator tests, concurrent-worker tests, refund replay, provider timeouts, reconciliation and wallet migration dry-run.
- A sandbox payment-to-fulfillment flow, followed by founder-authorized small live pilot.
- Production deployment and rollback verification before public claims of automation.
- Do not spend on advertising, supplier top-ups or new subscriptions merely because daily budget capacity remains.
