# RoamWise Revenue OS — payment operations and AI employee policy (8 Nov 2026)

## Commercial objective
Target ₹20,00,000 monthly **gross merchandise/booking value**, not profit. Ramp from verified paid bookings and shop orders, with transparent all-inclusive prices and supplier confirmation. Do not borrow against unconfirmed bookings or treat refundable deposits as distributable income.

## Payment rails
1. Cashfree checkout (UPI/cards/netbanking): default for supported, date-priced products. Founder reports a zero-fee concession up to ₹20 lakh; **verify effective agreement, eligible instruments, fee-free volume, monthly processing limit and expiry separately**. Do not hardcode 0 fees until transaction settlement proves it.
2. Direct merchant UPI to the RoamWise current account: display only a verified business VPA/QR. Never mark an order paid based on a customer screenshot, UTR alone, or user-submitted amount. Match an authenticated bank credit (amount, payer reference, date, unique order reference) and investigate ambiguous matches.
3. NEFT/RTGS: offer bank-transfer instructions from approved account configuration for large corporate/wedding invoices. Use unique order reference, bank reconciliation, payment expiry and explicit invoice/receipt. Do not expose bank secrets in client code. RTGS/NEFT are not instant guarantees of receipt. Payment confirmation requires verified account credit.
4. Capacity: automatic routing to an alternative rail only if it is configured, tested and reconciled. Limits are set by merchant/provider/bank and can differ by instrument, account and risk controls. Never advertise “unlimited UPI”.
5. Payouts: supplier settlements and refund liabilities remain ring-fenced. The company may retain its **contractually agreed** margin, not unilaterally delay supplier payout until a review.

## Money states and accounting
CREATED → PAYMENT_PENDING → PAYMENT_VERIFIED → SUPPLIER_PENDING → CONFIRMED | DECLINED → REFUND_DUE → REFUND_INITIATED → REFUNDED | FAILED. Independent states for guest cancellation, chargeback and supplier settlement.
Store immutable payment and refund events in a transactional financial ledger (Firestore transaction or D1); KV is a cache, not a ledger. Every event has idempotency key, order ID, bank/gateway reference, amount, currency, verified source, timestamp, actor and audit hash.
For each order calculate:
- gross customer collections
- taxes payable (as applicable)
- supplier payable
- payment/refund costs
- chargeback and cancellation reserves
- realized RoamWise margin
- *available operating surplus* = settled RoamWise margin less committed operating costs and reserve.
Owner salary and team salaries are paid only from **available operating surplus** and an approved payroll budget, not gross receipts or supplier money. Forecast a 60–90 day operating runway and flag negative coverage.

## AI employee teams (reuse existing RABE/autopilot rather than duplicate)
- AI Sales Researcher: find publicly listed wedding planners, corporate offsite organizers, premium travel advisors, retreats; rank verified business prospects; dedupe and respect opt-outs. Draft outreach for human review or approved bounded campaigns.
- AI Revenue Analyst: funnel by source, paid conversion, confirmed booking rate, refund rate, realized margin, revenue vs ₹20 lakh objective, Cashfree fee concession usage and bank rail mix. Recommend high-margin campaigns, not fictitious sales.
- AI Booking Coordinator: on verified payment create supplier task, notify via approved email/WhatsApp/SMS integration, retry through durable outbox, escalate missing acknowledgements, never fabricate confirmation.
- AI Finance Controller: reconcile Cashfree and bank credits, reserve supplier/refund liabilities, detect duplicates, prepare payout/refund approvals, calculate payroll-safe surplus.
- AI Shop Merchandiser: monitor real SKU availability, cart abandonment, fulfillment, returns and contribution margin; suggest product promotions.
- AI Growth Producer: produce approval-ready seasonal wedding/New Year/offsite campaigns with verified rates and inventory; monitor UTM attribution and stop promotions when unfulfillable.
- AI Customer Support: answer status/FAQ from verified records, request missing details, escalate safety, refund disputes and cancellation cases.
- AI Technical QA: site/payment monitoring, create GitHub issue/PR, run tests, independent review and rollback recommendation. Do not self-merge high-risk payment changes.

## Authority and controls
Autonomous: dedupe, reports, safe FAQs, internal task creation, draft content, low-risk diagnostics, bounded analytics. Human-approved: refund execution, supplier settlement, payroll, banking instructions, public claims about availability, price overrides, contracts, credential changes, production financial code deployment, broad cold outreach. AI cannot create fake reviews, fake leads, fake inventory or misrepresent payment status.
Store operational state in Firestore, cache in KV, use Workers Cron/Queues/Workflows for retryable jobs. Do not introduce a second competing scheduler when a prior automation already exists. Keep AI compute budgets and low-cost deterministic paths.
Daily founder dashboard: paid orders, confirmed bookings, supplier pending > SLA, refunds due, supplier payables, realized margin, operating surplus, staff sales funnel, shop orders, payment rail capacity, conversion and failed notification outbox.

## December team execution
Joint targets already emailed to Deepanshi and Febin: first-month ₹5 lakh verified paid orders, six confirmed packages, ten shop orders, 40 qualified professional leads, 20 decision-maker calls and 12 dated quotes. ₹20 lakh is the longer-term monthly gross sales objective. Targets and incentives require agreed continuation after the internship end date. No repeat outreach to NMIMS; focus on professional wedding planners, corporate event organizers, executive offsites and premium retreats.

## Rollout checklist (not complete)
- Verify bank account ownership and gateway terms before displaying payment instructions.
- Verify Cashfree webhook signature, order amount, UPI settlement, bank-credit reconciliation, refunds and idempotency.
- Confirm per-property rate validity, peak supplements, guest count and cancellation schedule; only sell a priced and supported product.
- Prove supplier notification delivery, retry, guest confirmation, cancellation/refund paths, and finance ledger under simulated failures.
- Run production smoke tests; enable by property/rail via feature flags, with rollback.
