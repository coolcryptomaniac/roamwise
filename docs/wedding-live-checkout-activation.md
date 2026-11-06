# RoamWise wedding checkout production wiring

This page is developed but intentionally disabled unless `window.ROAMWISE_PAYMENT_WORKER_URL` is injected at deploy time by a trusted config loaded before checkout JS. The target must be the HTTPS endpoint of the existing `payments/worker.mjs` `/v1/payments/create` route, not a guessed URL.

## Existing code path
- Server pricing uses `PRODUCT_CATALOG_JSON`. Add service SKUs (wedding_discovery INR 3000, wedding_priority INR 5000) **only** after merchant eligibility and refund policy approval, never permit browser-controlled amount.
- Set `PAY_CASHFREE_ENABLED=true` and disable competing providers for the launch flow if unsupported; `CASHFREE_ENV=live`, required API secrets in Cloudflare secrets, not source.
- The Cashfree SDK receives the order's `payment_session_id` from the server. Browser redirect/success is not payment verification.
- Only independent signed webhook and provider-side order/payment verification may move the booking to paid; persist unique payment claims atomically and open a support case. Connect founder@roamwise.co.in and support@roamwise.co.in via transactional mail service before enabling checkout.
- Confirm complete refunds for failed fulfilment with an operational refund API and daily exception queue; provide a 7-day initiation SLA.
- Ensure no more than founder-reported INR 4,00,000 monthly Cashfree merchant capacity, and use independent bank reconciliation for direct UPI. Never route overflow through unverified VPA.
- Run sandbox and low-value production end-to-end; reconcile dashboard settlement, customer receipt, notification and refund.
- Never show service payment as a confirmed wedding venue booking.
- Preserve existing Pro checkout.

## Important current status
No Cloudflare deployment or Cashfree merchant management connector is available in this conversation, so these steps have not been executed. Merely committing the static page does not activate payments.
