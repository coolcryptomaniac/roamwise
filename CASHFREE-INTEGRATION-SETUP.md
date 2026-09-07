# Cashfree integration — setup guide

This is the literal, step-by-step guide for turning on the new Cashfree
payment-gateway adapter. It changes **nothing** for live users until you do
step 4 — until then the app keeps working exactly as it does today (the
plain UPI/UTR flow, `js/payments/providers/manual-upi-adapter.js`).

See `PAYMENT-GATEWAY-ARCHITECTURE.md` for the adapter interface this plugs
into, and this PR's description for why the server-side piece landed in
`worker/` (the app's one actively-deployable Worker, `roamwise-api`) rather
than in the separate, currently-undeployed `payments/` multi-provider router
— short version: `payments/` already has correct Cashfree order-creation
logic (its `worker.mjs`'s `cashfree()` function), which this integration's
request/response shape is ported from, but it's its own separate Cloudflare
Worker with no real (non-`.example`) `wrangler.toml`, no deploy step, and no
client code pointed at it — standing it up would mean the owner deploying
and maintaining a second Worker/project/DNS route for one gateway.

## What shipped

- `worker/handlers/cashfree.js` — two new routes on the existing
  `roamwise-api` Worker:
  - `POST /cashfree/order` — creates a real Cashfree order server-side and
    returns a `payment_session_id` to the browser. The App ID/Secret Key
    never leave this handler.
  - `GET /cashfree/order/:id/status` — lets the browser confirm
    `order_status === 'PAID'` with Cashfree before granting anything (see
    the code comment there for why: Cashfree's own docs note the client
    SDK's completion callback fires once checkout finishes, "irrespective
    of transaction status" — it isn't proof of a successful charge by
    itself).
- `js/payments/providers/cashfree-adapter.js` — implements the
  `RWPaymentGateway` interface (`js/payments/gateway-adapter.js`):
  `createOrder()` calls the endpoint above via the existing `rwApi()`
  helper (`rw-config.js`); `openCheckout()` loads Cashfree's official
  Checkout JS SDK (`https://sdk.cashfree.com/js/v3/cashfree.js`) and drives
  it, then polls the status endpoint and, once the order is confirmed
  `PAID`, calls `grantPurchase(orderId, 'cashfree', planId)`
  (`js/payments/plan-picker.js`) — the exact per-product tier-derivation
  logic the manual-UPI/UTR flow's instant provisional unlock already uses,
  reused here so a Plus/Pro monthly buyer gets exactly that tier and a
  Founder/long-term/short-term buyer gets full access, not a blanket grant
  for every product. **(Fixed in the subscription-vs-one-off gating pass —
  an earlier version of this integration called the generic `activatePro()`
  for every Cashfree purchase regardless of what was actually bought; see
  `PAYMENT-GATEWAY-ARCHITECTURE.md`'s "Per-product fulfillment" section.)**
- `index.html` — one new `<script>` tag registering the adapter, right
  after `manual-upi-adapter.js`. `partner-redeem.js`/`checkout.js` are
  untouched; `plan-picker.js` gained explicit, category-gated wiring for
  Cashfree in the subscription-vs-one-off pass — see below.
- `tests/cashfree-payment.test.js` — unit tests (mocked network, no real
  credentials) for both the Worker handler and the client adapter: success,
  Cashfree-side order failure, invalid/missing amount, missing customer
  phone, network errors, checkout-cancelled, the not-yet-`PAID` status
  path, and (added in the gating pass) that a confirmed `PAID` status calls
  `grantPurchase()` with the correct plan id rather than the blanket
  `activatePro()`.

## Subscription-vs-one-off gating (added in a later pass)

Cashfree is approved on this merchant account for one-off/one-time payments
only — recurring subscriptions are **not yet** approved (may need more
business documentation/presence first). So Cashfree is now offered ONLY
when the purchase being made is one-off (Founder offer, long-term/short-
term passes) — never for a Plus/Pro/Elite monthly-or-yearly subscription
purchase, regardless of `config/app.PAYMENT_PROVIDER`. Manual UPI remains
available for every purchase, subscription or one-off, as a genuine choice.

This didn't require a new config field: `config/app.PAYMENT_PROVIDER`
still works exactly as step 4 below describes ("the one field that turns
Cashfree on"), it's just no longer the ONLY gate — `js/payments/
plan-picker.js`'s `_renderCashfreeOption()` additionally checks the
selected plan's category before showing the Cashfree button at all. See
`PAYMENT-GATEWAY-ARCHITECTURE.md`'s "Subscription vs. one-off gating"
section for the full mapping and exactly which one line to change once
Cashfree's subscription approval comes through.

Nothing here changes `config/app.PAYMENT_PROVIDER`'s default — it's still
`manual_upi` (see step 4 for the one Firestore field that switches it).

## 1. Get your Cashfree credentials

From the Cashfree merchant dashboard (the one that was just approved):

1. Make sure you have credentials for **both** Sandbox and Live/Production
   — they're separate App ID/Secret Key pairs in Cashfree's dashboard
   (Developers → API Keys), one per environment tab.
2. Copy the **Sandbox** App ID and Secret Key first — test end-to-end in
   sandbox before touching anything live (step 3).

## 2. Deploy the Worker (if you haven't already)

This reuses the existing `roamwise-api` Worker (`worker/`), the same one
`CLOUDFLARE-MIGRATION-SETUP.md` walks through deploying and fixing the
"Workers Builds: roamwise" Cloudflare dashboard misconfiguration for. If
that Worker isn't deployed yet, do that first (see that doc's §0 and §B) —
the Cashfree routes ship as part of the same file (`worker/worker.js`) and
need nothing extra to deploy alongside it.

## 3. Set the Worker secrets (sandbox first)

From the `worker/` directory, with `wrangler` authenticated against your
Cloudflare account:

```bash
cd worker
npx wrangler secret put CASHFREE_APP_ID
# paste your SANDBOX App ID when prompted

npx wrangler secret put CASHFREE_SECRET_KEY
# paste your SANDBOX Secret Key when prompted
```

`worker/wrangler.toml` already ships `CASHFREE_ENV = "sandbox"` as the
default `[vars]` value — a plain, non-secret config choice, not a secret,
so it's fine to keep it checked into the repo. **Do not** put the App
ID/Secret Key in `wrangler.toml` — `wrangler secret put` is the only place
they should ever live, and they're never readable back out once set (only
overwritable with another `wrangler secret put`).

Optional: `npx wrangler secret put ...` doesn't apply to
`CASHFREE_API_VERSION` or `PAYMENT_RETURN_URL` — those are plain vars too;
uncomment/edit them directly in `worker/wrangler.toml`'s `[vars]` block if
you need to override the defaults.

Deploy:

```bash
npx wrangler deploy
```

## 4. Point the client at the Worker and test in Cashfree's sandbox

1. In `rw-config.js`, set `window.RW_CONFIG.backend` to `'worker'` (or
   `'auto'`) and `workerUrl` to your deployed Worker's URL (e.g.
   `https://roamwise-api.<your-subdomain>.workers.dev`, or your custom
   route if you've mapped one) — this is the same switch every other
   Worker-backed feature in this app already uses (`/geo`, `/ai`, etc.), it
   is not Cashfree-specific.
2. In the Firestore admin console, set `config/app.PAYMENT_PROVIDER` to
   `"cashfree"`. **This is the one field that turns Cashfree on** — see
   `js/boot/init.js`'s `applyRemoteConfig` and
   `PAYMENT-GATEWAY-ARCHITECTURE.md`. Leaving it unset (or setting it back
   to `"manual_upi"`) reverts every user to today's UPI/UTR flow instantly,
   no deploy needed.
3. Open the app and tap a **one-off/one-time plan** (Founder offer, a
   long-term pass, or a short-term pass) — a new "Pay via Cashfree —
   instant, automatic unlock" button/section appears alongside the
   existing GPay/PhonePe/WhatsApp/"Any other UPI app" buttons (which keep
   working exactly as before; they still drive the manual-UPI flow, never
   Cashfree). Tapping the Cashfree button opens Cashfree's own hosted
   checkout, which presents its own full method picker (cards, UPI,
   netbanking). Tapping a **subscription** plan (Plus/Pro/Elite monthly or
   yearly) does NOT show the Cashfree button at all, even with
   `PAYMENT_PROVIDER` set to `cashfree` — see
   `PAYMENT-GATEWAY-ARCHITECTURE.md`'s "Subscription vs. one-off gating"
   section for why (Cashfree isn't approved for recurring payments yet).
4. Use [Cashfree's documented sandbox test card/UPI/netbanking
   credentials](https://www.cashfree.com/docs) (their dashboard's own
   sandbox testing guide — these change over time, so don't hardcode them
   here) to complete a full test payment.
5. Confirm: the checkout modal opens, completing the test payment resolves
   without a Cashfree SDK error, the app shows the success overlay
   (`activatePro()` fires only after `GET /cashfree/order/:id/status`
   confirms `order_status: "PAID"`), and the Cashfree sandbox dashboard
   shows the order as `PAID`.
6. Test the failure/cancel paths too: close the checkout modal without
   paying, and use a documented sandbox failure card — confirm the app
   shows a clear "not completed" message and does **not** grant Pro.

## 5. Go live

Only after step 4 is fully green:

1. `npx wrangler secret put CASHFREE_APP_ID` and
   `npx wrangler secret put CASHFREE_SECRET_KEY` again, this time pasting
   your **Live/Production** credentials (overwrites the sandbox secrets).
2. Edit `worker/wrangler.toml`'s `[vars]` block: `CASHFREE_ENV = "live"`.
   Commit that change (it's a non-secret config choice, safe to check in —
   same as `CASHFREE_ENV = "sandbox"` was).
3. `npx wrangler deploy` again.
4. Do one small real end-to-end payment yourself before announcing it.
5. `config/app.PAYMENT_PROVIDER` in Firestore is already `"cashfree"` from
   step 4 above, so live users start using it as soon as the Worker
   redeploys with live credentials — there's no separate "go live" flag
   beyond swapping the Worker secrets/env and redeploying. If you'd rather
   stage this (e.g. sandbox-test with the Worker deployed but keep real
   users on manual UPI a while longer), just leave
   `config/app.PAYMENT_PROVIDER` as `"manual_upi"` until you're ready — the
   Worker being live/configured doesn't by itself route any real user
   traffic to it.

## Known limitations to review before relying on this for real revenue

- **Entitlement is granted client-side, gated on one status check.** The
  adapter polls `GET /cashfree/order/:id/status` up to 3 times (1.5s apart)
  right after checkout and calls `grantPurchase()` (the correct per-product
  tier grant, not a blanket one — see "Subscription-vs-one-off gating"
  above) the moment it sees `PAID`.
  There is no Cashfree **webhook** wired up in this PR — `payments/`'s
  already-built `verifyCashfree()` webhook-signature verifier
  (`payments/webhook-verify.mjs`) is a natural next step if you want
  server-confirmed, replay-proof entitlement instead of trusting a
  browser-driven status poll (a user closing the tab mid-poll, or a slow
  Cashfree status update, just means they see "still processing" and don't
  get Pro yet — it fails closed, not open — but it's still weaker than a
  webhook). This mirrors the existing Gumroad path's trust model
  (`verifyGumroad()` in `js/payments/checkout.js`), not a new risk category
  for this app, but it's worth your own review before this carries
  meaningful volume (per `AI-ROLES-AND-HANDOFF.md` rule 7).
- **Customer phone is mandatory.** Cashfree's Create Order API requires a
  customer phone number; users who signed in without one (e.g. Google/email
  login, no phone on file) get a clear `422` from `/cashfree/order` instead
  of a fabricated phone number. There's no in-app "add your phone number"
  prompt yet — that's a follow-up UI piece, not built here.
- **CORS on `worker/worker.js` is wildcard (`*`)**, matching every other
  route on this Worker today (`/ai`, `/geo`, etc.) — this PR didn't
  introduce a new CORS model, but a payment-order-creation endpoint is a
  reasonable place to reconsider that (e.g. reuse `payments/`'s
  origin-allowlist pattern in `payments/worker.mjs`'s `cors()`/
  `allowedOrigin()`) if you want to tighten it later.
- **Cashfree takes a ~2% commission per transaction** through their
  Payment Gateway — unlike manual UPI (`roamwise@ybl`), which has none.
  This is a real cost difference the owner should factor into pricing/
  margin decisions; it isn't surfaced to the buyer in the app UI today.
- **Only one-off/one-time payments are approved on this merchant account
  today** — Cashfree has NOT yet approved recurring subscription payments
  (may need more business documentation/presence first). The app enforces
  this at the UI level (see "Subscription-vs-one-off gating" above); it is
  not just a documentation note — attempting to route a subscription
  purchase through Cashfree would likely also be rejected by Cashfree
  itself, since the merchant account isn't provisioned for it, but the app
  should never even attempt that call in the first place.
