# RoamWise Smart Payment Router

This folder is the server-side payment control plane for RoamWise. Browser code should never receive a Razorpay key secret, Cashfree secret, Stripe secret key, PayPal client secret or webhook secret.

## What it does

- chooses an eligible provider by country, currency, payment method, configured merchant fee and reliability;
- supports Razorpay Orders, Cashfree PG Orders, Stripe PaymentIntents and PayPal Orders v2;
- supports optional manual direct-UPI only when explicitly enabled;
- falls back only on safe provider availability/rate-limit/server errors;
- uses idempotency keys where the provider supports them;
- verifies Razorpay, Cashfree, Stripe and PayPal webhook signatures;
- can persist attempts/events in Cloudflare D1 and forward a verified normalized event to a separate fulfilment endpoint;
- creates payments only for products in the server-side `PRODUCT_CATALOG_JSON`, so a browser cannot invent a cheaper amount.

## API

### `POST /v1/payments/route`
Returns an estimated ordered route. This is informational; settlement statements remain the source of truth for actual gateway fees.

```json
{"amountMinor":10000,"currency":"INR","country":"IN","method":"upi"}
```

### `POST /v1/payments/create`
Creates a provider-side order/payment from a configured server product.

```json
{
  "productId":"roamwise_pro",
  "currency":"INR",
  "country":"IN",
  "method":"upi",
  "customer":{"id":"user-id","email":"user@example.com","phone":"+919999999999"}
}
```

Send a stable `x-idempotency-key` for retries. For Cashfree, phone is required by the Create Order flow; when it is absent the router can fall back to another eligible provider rather than inventing customer data.

### Webhooks

- `/v1/webhooks/razorpay`
- `/v1/webhooks/cashfree`
- `/v1/webhooks/stripe`
- `/v1/webhooks/paypal`

All four reject invalid signatures. If `PAYMENTS_DB` is bound, verified event IDs are deduplicated there. If `PAYMENT_FULFILLMENT_URL` and `PAYMENT_FULFILLMENT_SECRET` are configured, verified events are forwarded to the trusted entitlement/order service.

## Secrets

Configure with Cloudflare secrets, never Git:

- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`
- optional `DIRECT_UPI_VPA`
- optional `PAYMENT_FULFILLMENT_SECRET`

## Smart routing is configurable, not hard-coded pricing truth

The checked-in defaults are conservative routing estimates based on public standard pricing at implementation time. Merchant promotions, negotiated rates, taxes, card-origin rules, currency conversion and provider product pricing change. Put your actual commercial terms in `PAY_<PROVIDER>_FEE_BPS`, fixed-fee variables and provider eligibility variables.

Important examples at implementation time:

- Razorpay publishes a standard 2% + GST gateway price and may run promotional pricing.
- Cashfree advertises headline promotional/standard pricing that can differ by merchant/volume.
- Stripe India publishes different domestic/foreign/international card pricing.
- PayPal India supports international merchant receipts and its published international commercial rate is materially higher than typical domestic Indian gateways.

The router therefore considers availability + method + country + currency + estimated fee + reliability rather than permanently declaring one provider “cheapest”.

## Deployment

1. Copy `wrangler.toml.example` to a private deployment config or configure the Worker in Cloudflare dashboard.
2. Add provider secrets with `wrangler secret put` or Cloudflare secret variables.
3. Replace the example `PRODUCT_CATALOG_JSON` with actual product IDs/prices.
4. Optional: create D1 and apply `schema.sql`.
5. Start in provider sandbox/test modes.
6. Register the four webhook URLs in provider dashboards.
7. Run end-to-end tests including duplicate retries, provider 429/5xx failover, failed payments, refunds and webhook replay.
8. Only then change Cashfree/PayPal/provider environments to live.

The Worker is intentionally isolated from the static RoamWise site: provider secrets and authoritative product prices remain server-side.
