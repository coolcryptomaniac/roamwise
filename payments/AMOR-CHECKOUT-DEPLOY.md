# Amor Cashfree checkout deployment checklist
> **Superseded (13 Nov 2026):** live Amor pricing is `worker/lib/amor-pricing.js` on the roamwise-api Worker (net rate + 7% commission + 18% GST on it). The commercial assumptions below are historical.


Implemented in PR #698; **not live until the payment router Worker and homepage are deployed**.

## Routing
- Serve `payments/worker.mjs` from the dedicated payment-router Cloudflare Worker.
- Route the browser's `/v1/stays/checkout` path to that Worker on the RoamWise domain, or set `window.RW_STAY_CHECKOUT_API` before loading `packages/amor-checkout.html` to its deployed endpoint. Without this routing the checkout fails closed.
- Bind a Cloudflare KV namespace `STAY_ORDERS` for booking/order records. Protect access to this namespace.
- Configure Worker secrets `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` and `CASHFREE_ENV=live` only after sandbox testing. Never commit secrets.
- For Padma and Tattwaa, configure `STAY_GST_RATE` with the confirmed applicable decimal tax rate (0.05, 0.12, or 0.18). The endpoint rejects Padma payments without this server-side rate.
- Configure Cashfree webhook to `/v1/webhooks/cashfree`, verify signature, and connect an authenticated fulfilment consumer that maps paid order IDs to `STAY_ORDERS`. Current public status endpoint performs Cashfree server reconciliation, but does not yet dispatch supplier notifications, confirmation vouchers, or refunds.
- Configure and verify approved Cashfree domain/origin, merchant travel/accommodation category, settlement and refund capability.

## Commercial assumptions
Removed (13 Nov 2026): supplier net rates are confidential and now live only in the sealed rate book on the roamwise-api Worker (`worker/data/amor-rates.sealed.json`).

## Must pass before enabling live collection
1. Run sandbox order creation for advance and full payment; verify server-side amount, dates, currency, return URL and duplicate submissions.
2. Verify Cashfree webhook signature, replay protection, idempotent booking updates, supplier notification, customer receipt, reconciliation, and refund workflow.
3. Validate tax, peak dates, and property cancellation policies with Amor Hospitality.
4. Test UPI, card, Android and mobile browsers, and unsuccessful payment/retry scenarios.
5. Confirm live Worker routing and Cashfree merchant configuration. Merge/deploy only after the above checks.

Do not advertise automatic supplier booking, automatic refunds, or a confirmed reservation until these workflows exist.
