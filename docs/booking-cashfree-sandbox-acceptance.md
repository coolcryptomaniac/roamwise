# Cashfree booking sandbox acceptance — PR #615

## Implemented, not deployed or provider-verified

Dedicated `worker/booking-sandbox.js` exposes POST `/booking/cashfree/order`
and `/booking/cashfree/webhook`. Deploy ONLY with
`worker/wrangler.booking-sandbox.toml`, never the production configuration.
It has no production routes, KV or cron bindings.

Checkout requires a sandbox Firebase ID token, an `admins/{uid}` document,
and a trusted host-confirmed `roomBookings/{bookingId}` owned by that UID.
The client supplies only bookingId. The sandbox test cap is INR 1,000.
The server atomically prepares bookingSessions, bookingOrderMappings and the
source roomBookings order/payment fields before creating the Cashfree order.
Retries reuse the deterministic order ID and UUID idempotency key.
Provider timeout leaves a retryable pending session, never a paid booking.

Webhook verification uses timestamp + exact raw bytes and the sandbox Cashfree
client secret. Independent payment API lookup must match the signed payload
and trusted mapping. Confirmation atomically writes one payment claim, the
confirmed session and paid source room booking. Firestore resource names use
`projects/...`, not HTTP URLs. Version preconditions/create-only claims prevent
double confirmation. Transaction conflict fails closed and can be retried.

## Required isolated configuration

- Authenticate to Cloudflare; provision `roamwise-booking-sandbox` separately.
- Set BOOKING_FIRESTORE_PROJECT to an actual separate project containing `sandbox`
  in its ID. Empty, production (`roamwisepro`), live Cashfree mode and mismatched
  service-account/project configurations fail closed.
- Provision only sandbox CASHFREE_APP_ID, CASHFREE_SECRET_KEY and the sandbox
  project's FIREBASE_SERVICE_ACCOUNT_JSON as secrets. Never copy production secrets.
- Deny client writes to sandbox room bookings, sessions, mappings and claims.
- Seed synthetic admin/customer/host-confirmed room booking records in the sandbox.
  Room fields: guestUid, guestPhone, status=`confirmed`, amount in INR,
  paymentMethod=`roamwise_cashfree_after_confirmation`; paymentStatus absent or `unpaid`.
- Use returned payment_session_id with Cashfree checkout in sandbox mode.
  Production UI is not repointed. Client callbacks never confirm payment.

## Acceptance gate

1. All repository CI and real Firestore emulator contention checks pass.
2. Deploy the isolated Worker; record Worker version and tested Git commit.
3. Create an order using authenticated sandbox checkout and complete an actual
   Cashfree sandbox payment. Record redacted provider order/payment IDs.
4. Verify signature, independent reconciliation and all three Firestore records.
5. Replay/concurrently deliver the webhook: exactly one confirmation and claim.
6. Reject tampered bytes/signature, wrong order/payment/amount/currency,
   failed/pending payments, cancellation and expiry; safely retry provider timeout.
7. Retry checkout: same provider order, no duplicate payment or claim.
8. Squash-merge only after every gate succeeds.

## Current evidence — 31 October 2026

Local targeted suite: 47 passed, 0 failed, 1 emulator test skipped (no emulator).
Mocked Worker REST integration covers checkout/source booking integration,
idempotent retries, signature + reconciliation + commit, conflicting claims,
tampering, price/cancellation/expiry mismatches and production exclusion.
These mocks do not prove real Firestore or provider acceptance.
Full local suite blocked by unavailable jsdom installation; CI remains required.
Cloudflare reached sign-in; no authenticated deployment session established.
Isolated Firestore project and sandbox credentials are not yet provisioned/verified.
No deployment, actual sandbox payment or real webhook-to-Firestore acceptance
is claimed. Do not merge based on unit tests alone.
