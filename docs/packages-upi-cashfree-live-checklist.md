# RoamWise package payment go-live checklist — 6 November 2026

## Merchant facts supplied by founder
- Direct UPI VPA supplied: roamwisepay@ybl.
- Founder describes receiving bank as HDFC current account. The VPA handle alone does NOT independently verify bank account, beneficiary name, bank mapping or settlement eligibility.
- Existing Pro checkout functioning is not proof package installments are enabled or verified.
- Never store bank passwords, Cashfree secrets or private keys in GitHub or browser.

## Deploy sequence
1. Independently confirm receiving beneficiary name/bank and test merchant VPA from official bank/UPI app. Only then set DIRECT_UPI_VPA, PACKAGE_UPI_MERCHANT_VERIFIED=true and PACKAGE_DIRECT_UPI_ENABLED=true on secured Worker.
2. Register authenticated /package/leads handler; use Firebase token, actual Cloudflare rate limiting and anti-abuse; wire frontend to it with explicit consent. Monitor Firestore packageLeads status new, contacted, qualified, quoted, won, lost. No anonymous writes to monetary documents.
3. Add authoritative signed quote and each installment as server-only Firestore transactions; lock quote revision, tax-inclusive amounts, supplier confirmation ID, cancellation policy, charge amount and due dates. Frontend only sends bookingId + installment ordinal.
4. Cashfree production order creation: use Cashfree PG server-side production key, merchant domain/app approved, deterministic order ID and idempotency, expiry and payment_session_id. Signed webhooks + independent Get Order/Get Payments reconciliation and atomic claim; no client-success callback as proof.
5. Direct-UPI instruction remains PENDING_BANK_RECONCILIATION until independently matched to bank credit (amount, beneficiary, unique bank reference, merchant statement and no duplicate). UTR/screenshot alone is insufficient. Provide support-assisted refund procedure and anti-duplicate checking.
6. Supplier payout: prefer Cashfree Easy Split if activated and vendors onboarded/KYC verified; otherwise use Cashfree Payouts or manual bank transfer with written agreement. Require provider eligibility, supplier verification, invoice, sufficient settled funds and founder-approved transfer. Never imply bank payout occurs because code calculated eligibility.
7. Finance reconciliation and chargebacks: Cashfree order status, raw signed webhook, settlement report, bank credit and supplier remittance cross-check; refunds and customer receipts separately tracked.
8. Run actual sandbox and then controlled low-value live production test, including partial deposits, missed installment, duplicate webhooks, cancellation/refund, failed supplier confirmation, overpayment and payout retries before enabling package checkout for all guests.

## Supplier-specific collection
Aramness: 25% within three working days and balance 30 days pre-arrival.
Padma: 50% now and remainder 7 days pre-arrival.
Nanau/Tattwaa: tiered advances with full payment before arrival; re-confirm outdated Tattwaa rate.
Never advertise balance payment on arrival without signed exception.

## Current releases
Feature-flagged rules, manual UPI intent and tests are development-only in draft PR #696. Production Cashfree checkout and automatic payouts intentionally remain disabled until audited end-to-end.
