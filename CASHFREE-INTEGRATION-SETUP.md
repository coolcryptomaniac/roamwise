# Cashfree + Cloudflare setup

RoamWise uses the existing `roamwise-api` Cloudflare Worker as the trusted
payment backend. Cashfree App IDs, secret keys and Firebase service-account
JSON must never be entered in the RoamWise admin page, Firestore, source code,
GitHub Actions output, chat, or browser storage.

The admin page stores only public/non-secret controls: Worker URL, sandbox/live
mode, provider enabled state, return URL, and masked settlement metadata.

## Implemented trust flow

1. A signed-in user selects a supported one-time plan.
2. The browser sends its Firebase ID token, plan ID and phone to
   `POST /cashfree/order`.
3. The Worker verifies the ID token, looks up the plan price server-side,
   rejects recurring plans and accounts that already have active paid access,
   and creates the Cashfree order with Worker secrets. Blocking a second active
   plan prevents a short pass from accidentally overwriting a longer entitlement.
4. The Worker saves an `ACTIVE` `cashfreeOrders/{orderId}` receipt bound to the
   authenticated Firebase UID before returning `payment_session_id`.
5. The browser opens Cashfree Hosted Checkout.
6. `GET /cashfree/order/{orderId}/status` re-verifies the Firebase ID token and
   receipt ownership, then reads the order directly from Cashfree.
7. Only when order ID, INR amount, currency and `order_status: PAID` all match,
   the Worker writes `payments/{orderId}`, the durable `users/{uid}` entitlement,
   and marks the order fulfilled.
8. The browser shows success only after the Worker returns
   `entitlement.persisted: true`.

The browser cannot set its own Cashfree receipt or permanent Pro fields.

## Supported products

Cashfree is restricted in both UI and Worker to one-time products: Founder,
long-term passes, and day/week/quarter passes. Monthly/yearly recurring plans
remain on manual UPI until Cashfree Subscriptions is separately implemented and
approved. Hiding a button is not the security boundary; the Worker allow-list is.

## 1. Add Cloudflare secrets

Use Cloudflare Dashboard → Workers & Pages → `roamwise-api` → Settings →
Variables and Secrets. Add each value as type **Secret**:

- `CASHFREE_APP_ID` — sandbox App ID first
- `CASHFREE_SECRET_KEY` — matching sandbox secret first
- `FIREBASE_SERVICE_ACCOUNT_JSON` — complete JSON for the Firebase project

Or, from `worker/`:

```bash
npx wrangler secret put CASHFREE_APP_ID
npx wrangler secret put CASHFREE_SECRET_KEY
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON
```

Do not add their values to `worker/wrangler.toml`. Cloudflare secrets are
write-only from the application and cannot be displayed in Admin.

`FIREBASE_SERVICE_ACCOUNT_JSON` should come from Firebase Console → Project
Settings → Service accounts. Give the service account only the project access
needed by this Worker and rotate it if the JSON has ever been exposed.

## 2. Deploy the Worker

`worker/wrangler.toml` defaults to `CASHFREE_ENV = "sandbox"`.

```bash
cd worker
npx wrangler deploy
```

Record the deployed HTTPS URL, for example:
`https://roamwise-api.<account>.workers.dev`.

## 3. Enable sandbox from Admin

Open Admin → Partner payments:

1. Enter the public Worker base URL.
2. Select **Sandbox test**.
3. Set **Cashfree checkout** to enabled.
4. Click **Verify and save**.

The health check must report both Cashfree credentials and Firebase server
verification as configured, and the Worker environment must match Admin. Saving
updates both the Pro checkout config (`config/app`) and partner-payment config.
In sandbox, the Cashfree button is shown only to the admin UID that enabled it.

## 4. Sandbox acceptance test

Use only Cashfree's current documented sandbox payment details.

- Sign in as the sandbox admin account.
- Select a one-time plan and provide a valid receipt phone if requested.
- Complete one successful sandbox payment.
- Confirm Cashfree shows the order as `PAID`.
- Confirm Firestore has the same order ID in `cashfreeOrders` and `payments`.
- Confirm `users/{uid}` has `pro: true`, the expected `proTier`, `proPlanId`,
  `proPayId`, and `proUntil` (`0` for lifetime).
- Sign out and sign in again; access must still be present.
- Test cancellation and failed payment; neither may create an entitlement.
- Try a recurring plan; the Cashfree option must not be offered, and a direct
  API request must return `unsupported_plan`.
- Try another user's order ID; status must return forbidden.
- Try from an account that already has active Pro; order creation must return
  `already_entitled` rather than charging and replacing its current access.

The repository unit tests mock Cashfree and Firebase boundaries. They prove the
request authorization, price/plan checks, exact paid-order validation and
server-side persistence logic without charging money. A real sandbox payment
still requires deployed secrets and must be performed by the account owner.

## 5. Go live

Do not switch live based only on a green unit test. First complete the sandbox
acceptance test above.

1. Replace the two Cashfree Worker secrets with the live App ID and live Secret
   Key.
2. Set `CASHFREE_ENV = "live"` in `worker/wrangler.toml` and deploy.
3. In Admin choose **Live payments**, run **Check Worker**, then save.
4. Make one low-value real purchase with your own account.
5. Verify the Cashfree dashboard, Firestore payment, durable entitlement and a
   second-device login before opening the gateway to customers.

Use Admin to switch `PAYMENT_PROVIDER` back to `manual_upi` immediately if the
Worker health check or real payment test fails.

## Operational limitations before high-volume launch

- The current automatic fulfillment is initiated by the authenticated status
  poll after Hosted Checkout. It is secure because the Worker independently
  verifies Cashfree, but a user who closes the app before polling may require
  recovery from Admin's “Cashfree orders needing attention” queue.
- Add and validate a signed Cashfree webhook before treating this as a
  high-volume, fully unattended payment system. The webhook must verify the raw
  request signature, be idempotent by order/payment ID, re-check the recorded
  amount and owner, and reuse the same server-side fulfillment function.
- Cloudflare CORS is currently shared with the public Worker routes. Firebase
  authorization and receipt ownership protect payment operations, but an
  explicit production-origin allow-list remains worthwhile defense in depth.
- Cashfree requires a phone for order creation. RoamWise asks for a receipt phone
  at checkout when the Firebase account does not contain one; it never invents a
  fake number.
- Easy Split/direct-stay settlements are a different product. Keep them disabled
  until Cashfree approves Easy Split, vendors pass KYC, payout destinations are
  verified, and refund/dispute/webhook paths have been tested.

## Recovery

Admin → Money shows active or paid-but-unfulfilled Cashfree orders. Cross-check
the order in Cashfree before using the existing manual “Record payment” recovery
path. Never grant from a screenshot, browser callback, or user-provided order ID
alone.
