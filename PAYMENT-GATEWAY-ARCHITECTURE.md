# Pluggable payment gateway architecture

This document explains the provider-adapter refactor introduced to let
RoamWise onboard additional payment gateways in the future without
rewriting checkout code — the same shape `js/booking/affiliate-links.js`'s
`rwAffLink()` already uses to route bookings through multiple affiliate
programs behind one function.

## Important correction to this task's original premise

This work was scoped assuming RoamWise's checkout was "Razorpay-based."
**It is not.** A repo-wide grep for `razorpay`/`Razorpay` across `app.js`,
`index.html` and `js/**` returns zero hits, and both
`REVENUE-INTEGRATIONS.md` ("UPI (current) — 0% — What you use now. Zero
fees, manual verification.") and `BUSINESS-FINANCE-SETUP.md` ("Payment
gateway — when, not whether... Stay on plain UPI while volume is low") list
Razorpay as a *future* option once manual verification stops scaling — not
the current provider.

RoamWise's real, currently-live checkout (`js/payments/plan-picker.js` +
`app.js`'s `submitUtr()`) is a plain **UPI deep-link/QR flow with a manual,
honor-system claim**: the app builds a `upi://pay?...` intent (as a deep
link for the tapped UPI app, or a QR code for desktop), the user pays in
their own UPI app, then pastes the 12-digit UTR transaction reference back
into the app; that reference is written to Firestore's `claims` collection
as a pending claim, the user gets an instant provisional 24h unlock, and an
admin verifies it by hand in the admin console. There is no server-side
order-creation call and no gateway webhook in this path at all — it is not
"Razorpay with the SDK call hidden somewhere," it genuinely never talks to
Razorpay or any payment gateway API.

Separately, there's an **already-built, separate, server-side multi-provider
payment router** at the repo root (`payments/` — a Cloudflare Worker, see
`payments/README.md`, `payments/provider-registry.mjs`, `payments/router-core.mjs`)
that already supports Razorpay, Cashfree, Stripe and PayPal, with its own
provider-selection and webhook-verification logic. **It is not wired to this
client checkout flow today.** It's the natural home for a *real* future
Razorpay/Cashfree/Stripe/PayPal integration — see "Adding a new gateway"
below for how a client-side adapter would call it.

Given this, the adapter interface below is derived from the flow that
**actually exists** (the manual UPI flow), not from an imagined Razorpay
integration, per this task's own instruction to derive the interface from
what's actually used today.

## The adapter interface (`js/payments/gateway-adapter.js`)

A provider adapter is a plain object with an `id` and whichever of these
methods it needs (all optional at the registry level — a hosted-checkout
gateway typically resolves success from inside its own SDK callback and may
never need `verifyPayment()` at all):

```js
{
  id: 'manual_upi',                      // matches the registration key

  createOrder(amount, meta) -> order     // amount: plain rupee number (this
                                          // app has never dealt in paise —
                                          // UPI's `am=` param is rupees;
                                          // a paise-based provider converts
                                          // internally, in its own adapter)
                                          // meta: {planId, tierId, label}
                                          // returns an adapter-defined,
                                          // opaque "order" object

  openCheckout(order, method) -> void    // presents the actual payment
                                          // action for `order`; `method` is
                                          // the tapped UPI app / payment
                                          // method key (e.g. 'gpay',
                                          // 'phonepe', 'any')

  buildQR(order) -> void                 // optional: renders a scannable
                                          // code for the order

  verifyPayment() -> void                // optional: submits proof of
                                          // payment for verification
}
```

`RWPaymentGateway` (also in `gateway-adapter.js`) is the single plug point:

```js
RWPaymentGateway.register(id, adapter);   // a provider adds itself once, at load time
RWPaymentGateway.current();               // resolves the configured provider
RWPaymentGateway.createOrder(amount, meta);
RWPaymentGateway.openCheckout(order, method);
RWPaymentGateway.buildQR(order);
RWPaymentGateway.verifyPayment();
```

`RW_PAYMENT_PROVIDER` (default `'manual_upi'`) is the one selection point.
It's set from `config/app.PAYMENT_PROVIDER` in Firestore — the exact same
remote-config doc + apply pattern every other owner-controlled flag in this
app already uses (affiliate IDs, WhatsApp numbers, Gumroad link/ID, crypto
wallets — see `js/boot/init.js`'s `applyRemoteConfig`). An unset flag leaves
`RW_PAYMENT_PROVIDER` at `'manual_upi'`, so **today's behavior is completely
unchanged** until an admin deliberately sets this field to a provider id
that has actually registered an adapter.

## What moved where (behavior-preserving, zero logic changes)

| Before | After |
|---|---|
| `js/payments/plan-picker.js`: `upiParams()`/`payVia()`'s deep-link logic/`buildQR()`, and the `UPI_VPA`/`UPI_NAME`/`UPI_AMT`/`qrBuilt`/`_qrBuiltAmt` module state | Moved verbatim into `js/payments/providers/manual-upi-adapter.js`'s `ManualUpiAdapter.openCheckout()`/`buildQR()`/`createOrder()` |
| `app.js`: `submitUtr()`'s full body (DOM reads, fraud checks, Firestore claim write, provisional unlock, admin notify) | Moved verbatim into `ManualUpiAdapter.verifyPayment()` |
| `app.js`: `var qrBuilt = false;` | Moved into `manual-upi-adapter.js` (one-line marker left at the original location) |

`plan-picker.js`'s `pickPlan()`/`payVia()`/`buildQR()` and `app.js`'s
`submitUtr()` keep their exact original global names and signatures
(`index.html`'s `onclick="payVia('gpay')"`, `onclick="submitUtr()"`, the
dynamically-generated `onclick="pickPlan(...)"` markup `renderPlanGrid()`
emits, and `js/itinerary/pdf-export.js`/`journey-movie.js`'s
`onclick="payVia('generic50'/'generic10')"` all keep working unchanged) —
they're now thin wrappers that call `RWPaymentGateway`, which resolves to
the manual-UPI adapter by default.

The two flat, fixed-price micro-flows (`payVia('generic50')` for the
Journey Movie render, `payVia('generic10')` for the PDF export — see
`js/itinerary/journey-movie.js`/`pdf-export.js`) are **not** tied to any
picked plan/order, so they stay inline in `payVia()` exactly as before,
reading the same live `UPI_VPA`/`UPI_NAME` globals — they never reach
`RWPaymentGateway`.

**Explicitly out of scope for this pass** (to keep this a small, reviewable,
behavior-preserving change, same precedent as prior modularization phases
scoping out the Firebase/auth init block): Gumroad international checkout
and `verifyGumroad()` (`js/payments/checkout.js`), the direct-wallet crypto
panel (`js/payments/checkout.js`), and partner-code redemption
(`js/payments/partner-redeem.js` — this one isn't a payment gateway
interaction at all, it's a Firestore code-redemption flow with no gateway
involvement). These remain separate, independently-selected payment paths
users see as separate buttons in the pay modal, not something the
`PAYMENT_PROVIDER` flag switches between. They're reasonable candidates for
their own adapters in a future pass.

## Proving the abstraction: `js/payments/providers/mock-adapter.js`

This file is **test-only** — not registered by any config value, not added
to `index.html`, never reachable in production. It implements the same
interface and records every call it receives. `tests/payment-gateway-adapter.test.js`
uses it to prove, without needing a real second gateway's API keys or
business decisions:

1. `RWPaymentGateway`'s registry/dispatch works and never throws, even if
   the configured provider never registered.
2. `js/payments/plan-picker.js`'s real, production `pickPlan()`/`payVia()`
   call through `RWPaymentGateway` rather than any one provider — proven by
   registering two mock adapters and showing that flipping
   `RW_PAYMENT_PROVIDER` alone (no code change) redirects every subsequent
   call to the newly-selected adapter.
3. `app.js`'s `submitUtr()` is a pure one-line delegation to
   `RWPaymentGateway.verifyPayment()`.

## Gateway #2: Cashfree (added — see CASHFREE-INTEGRATION-SETUP.md)

`js/payments/providers/cashfree-adapter.js` is a second, real gateway
adapter, registered as `'cashfree'`. It is not the default — behavior is
unchanged for every live user until an admin sets
`config/app.PAYMENT_PROVIDER` to `'cashfree'` in Firestore, per
`CASHFREE-INTEGRATION-SETUP.md`, which has the full setup/secrets/testing
walkthrough. Its server-side order-creation endpoint
(`POST /cashfree/order`) lives on the existing `worker/` Worker
(`roamwise-api`), not on the separate `payments/` multi-provider router —
see that setup doc and the header comment in `worker/handlers/cashfree.js`
for why.

## Adding gateway #2 (e.g., a real Razorpay integration)

1. Decide whether the new gateway should be a thin client wrapper around
   the already-built server-side router in `payments/` (recommended for
   Razorpay/Cashfree/Stripe/PayPal, since that Worker already handles order
   creation, webhook verification and secrets — see `payments/README.md`)
   or a fully client-driven integration.
2. Write `js/payments/providers/<name>-adapter.js` implementing whichever
   of `createOrder`/`openCheckout`/`buildQR`/`verifyPayment` the gateway
   actually needs (a hosted-checkout gateway will likely only need
   `createOrder` + `openCheckout`, with success/failure handled inside its
   own SDK's callback rather than a separate `verifyPayment()` step). End
   the file with `RWPaymentGateway.register('<name>', <Adapter>);`, same as
   `manual-upi-adapter.js`.
3. Add its `<script>` tag to `index.html`, after `js/payments/gateway-adapter.js`
   and before `js/payments/plan-picker.js`.
4. **Do not touch `plan-picker.js`, `partner-redeem.js`, `checkout.js` or
   `submitUtr()`** — they already call `RWPaymentGateway`, not any one
   provider.
5. Add the new provider id to `config/app.PAYMENT_PROVIDER` in Firestore
   (via the admin console, same as any other remote-config flag) once the
   new adapter is tested in the gateway's sandbox mode. Leaving it unset
   keeps every live user on `manual_upi`, so this is safe to deploy ahead
   of the actual cutover.
6. Verify with `node --check`, `npm test`, and a Playwright pass exercising
   the pay modal with `RW_PAYMENT_PROVIDER` forced to the new id, the same
   way this PR's own verification did for `manual_upi`.
7. Payment/entitlement behavior changes still require the separate review
   `AI-ROLES-AND-HANDOFF.md` rule 7 calls for — this architecture makes the
   *code change* small, it doesn't remove the need for that review.

## Verification performed for this change

- `node --check` on every touched/added file.
- `npm test` (`node --test tests/*.test.js`) — full suite green, including
  11 new tests in `tests/payment-gateway-adapter.test.js` covering the
  registry/dispatch, the provider-switching mechanism, and the exact
  delegation from `plan-picker.js`/`app.js`'s real code.
- `npm run check` (line-limit + syntax + typecheck) — clean.
- A local Playwright pass (chromium) driving the real, unmodified
  `index.html`: clicked the real `#proBtn` (`onclick="openPay()"`), the
  real first plan button (`onclick="pickPlan('plus_m',99,'Plus Monthly','plus')"`),
  and the real "Any other UPI app" button (`onclick="payVia('any')"`), with
  a non-mutating spy wrapped around `RWPaymentGateway`'s facade methods
  (each wrapped method still calls straight through to the real
  implementation). Confirmed the real onclick chain reaches
  `RWPaymentGateway.current()` (`manual_upi`) with the exact order
  (`amountINR:99`, `vpa:'coolmohit@ybl'`, `name:'RoamWise Plus Monthly'`,
  `planId:'plus_m'`, `tierId:'plus'`, `label:'Plus Monthly'`) and method
  (`'any'`) the picked plan implies, with zero uncaught JS errors. Firebase
  network calls were blocked for this run (using the offline-degradation
  path `js/boot/auth-init.js` already documents) rather than hitting the
  real production Firebase project from an automated test.
