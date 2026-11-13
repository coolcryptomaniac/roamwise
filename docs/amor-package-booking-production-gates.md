# Amor package booking — production gates (6 November 2026)
> **Update (13 Nov 2026):** Amor stays and packages are live on the roamwise-api Worker (`worker/lib/amor-*.js`). Advances never fall below each property's own deposit rule; balances are paid through a linked Cashfree order once the booking is confirmed.

Do not turn on live payment collection until sandbox and supplier acceptance.

## Supplier schedule
Tattwaa: rate validity ended 31 March 2026; 25–30% early token, 50% by 15 days and full payment at least 7 days before arrival.
Nanau: 25–30% early token, 50% by 15 days and full payment at least 7 days before arrival.
Padma: 50% at booking; remaining amount at least 7 days before arrival.
Aramness Gir: 25% within 3 working days; remaining 75% 30 days before arrival. Safaris require 100% prepayment.
All blackout dates, deposits and net terms must be reconfirmed per customer date and contract.

## Transactional production workflow
1. Customer submits enquiry, dates, guests and room requirements; no money collected.
2. Admin receives supplier availability and written hold; founder authorizes immutable tax-inclusive quote including separate disclosed RoamWise convenience fee.
3. Customer accepts total, cancellation terms, full payment schedule, payment recipient and refunds process.
4. Server creates immutable quote-version and installment records. Cashfree order amounts derive from locked server records only; never from a client price.
5. Verify raw signed webhook and independently reconcile against Cashfree API. Atomically claim provider payment id, order id, quote version and installment exactly once.
6. Confirm supplier reservation before issuing travel vouchers; escalate confirmation failure to refund/alternative with buyer approval.
7. Collect remaining installment ahead of supplier deadline. Direct-to-property balance is permitted only with a signed commission remittance agreement and clear customer invoice.
8. Reconcile supplier remittances, payment fees, chargebacks, refunds, receivables and cancellation liabilities.

## Production readiness
Separate quote, package booking, installment, unique payment claim, refund, supplier payout and audit records with server-only write permissions.
Block duplicate webhook payments, delayed/failed captures, partial authorization, expired inventory holds and conflicting customer changes.
Verify Cashfree merchant account allows the intended travel merchant-of-record/agency settlement model; check GST invoices and consumer refund liabilities with accountant.
Existing RoamWise Worker booking Cashfree integration is sandbox-only and admin gated; it must not be treated as an approved live package checkout.
Run real sandbox order and two-installment test, concurrent webhook replay, failed deposit, refund and supplier confirmation cancellation; get production signoff.