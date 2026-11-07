# Amor Cashfree checkout deployment checklist

Implemented in PR #698; **not live until the payment router Worker and homepage are deployed**.

## Routing
- Serve `payments/worker.mjs` from the dedicated payment-router Cloudflare Worker.
- Route the browser's `/v1/stays/checkout` path to that Worker on the RoamWise domain, or set `window.RW_STAY_CHECKOUT_API` before loading `packages/amor-checkout.html` to its deployed endpoint. Without this routing the checkout fails closed.
- Bind a Cloudflare KV namespace `STAY_ORDERS` for booking/order records. Protect access to this namespace.
- Configure Worker secrets `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` and `CASHFREE_ENV=live` only after sandbox testing. Never commit secrets.
- For Padma, configure `PADMA_GST_RATE` with the confirmed applicable decimal tax rate (0.05, 0.12, or 0.18). The endpoint rejects Padma payments without this server-side rate.
- Configure Cashfree webhook to `/v1/webhooks/cashfree`, verify signature, and connect an authenticated fulfilment consumer that maps paid order IDs to `STAY_ORDERS`. Current public status endpoint performs Cashfree server reconciliation, but does not yet dispatch supplier notifications, confirmation vouchers, or refunds.
- Configure and verify approved Cashfree domain/origin, merchant travel/accommodation category, settlement and refund capability.

## Commercial assumptions
- Nanau Sitabani Studio CP+hi-tea: partner net ₹5,500 per night inclusive of taxes. Retail ₹6,875/night; 2 nights ₹13,750; 25% advance ₹3,438. Dates Oct 2026–Mar 2027; known blackout dates blocked.
- Padma Royal Chamber EP: partner net ₹5,000 per night exclusive of tax. Retail ₹6,250/night **before tax**; 2 nights ₹12,500 before tax; checkout blocked until tax configured. Blackout window 18 Dec 2026–10 Jan 2027 blocked.
- Aramness Kothi AP: partner net ₹72,216 per night inclusive of taxes. Retail ₹90,270/night; 2 nights ₹180,540; 25% advance ₹45,135. Conservation fee, safaris and other extras excluded. Special fair/blackout dates require manual rate updates.
- Tattwaa: old tariff expired March 2026; do not enable payment until current net tariff received.
- All prices are one room / two guests, no transport or optional excursions included. Customer payment means **paid, property confirmation pending**, not a guaranteed room.
- The server rejects unpriced products, dates outside contracted validity, and certain known peak dates. It does not currently have live inventory or a supplier availability API.

## Must pass before enabling live collection
1. Run sandbox order creation for advance and full payment; verify server-side amount, dates, currency, return URL and duplicate submissions.
2. Verify Cashfree webhook signature, replay protection, idempotent booking updates, supplier notification, customer receipt, reconciliation, and refund workflow.
3. Validate tax, peak dates, and property cancellation policies with Amor Hospitality.
4. Test UPI, card, Android and mobile browsers, and unsuccessful payment/retry scenarios.
5. Confirm live Worker routing and Cashfree merchant configuration. Merge/deploy only after the above checks.

Do not advertise automatic supplier booking, automatic refunds, or a confirmed reservation until these workflows exist.
