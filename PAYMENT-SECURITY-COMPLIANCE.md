# Payment / financial-ledger security & compliance summary

This document is the single place to check "is the payment/ledger code
organized, secure and compliant" for RoamWise. It covers the file map, the
security audit performed on 2026-09-07, what was fixed, what residual risk
is intentionally left open (and why), and the compliance notes already
established elsewhere in this repo.

## 1. File map — audit verdict: already well-consolidated

This codebase's payment/pricing/financial-ledger code is **already
reasonably consolidated** under two clear roots. No disruptive
reorganization was performed — nothing was moved except one stale broken
script reference (see §3). The map:

| Area | Location | What it owns |
|---|---|---|
| Payment gateway adapters | `js/payments/*.js`, `js/payments/providers/*.js` | `gateway-adapter.js` (the `RWPaymentGateway` registry), `plan-picker.js` (pay modal, plan grid, `grantPurchase()`/`rwTierForPlan()` per-product fulfillment), `checkout.js` (Gumroad + crypto-wallet panel), `partner-redeem.js` (NMIMS code redemption — not a gateway), `providers/manual-upi-adapter.js` (the live default), `providers/cashfree-adapter.js` (gateway #2, off by default), `providers/mock-adapter.js` (test-only) |
| Pricing config | `js/pricing/*.js` | `subscription-plans.js` (recurring `CONFIG.TIERS` + `RWPricing` singleton), `one-off-plans.js` (Founder offer / long-term / short-term one-time passes), `referral.js` (referral commission math), `founder-seats.js` (seat-cap arithmetic) |
| Server-side order creation | `worker/handlers/cashfree.js` + new `worker/lib/pricing.js` | The ONE live, deployed order-creation/status endpoint (`roamwise-api` Worker). Secrets (`CASHFREE_APP_ID`/`CASHFREE_SECRET_KEY`) live only here, as Worker secrets. |
| Separate multi-provider router (not wired to production checkout) | `payments/*.mjs` | A more general Razorpay/Cashfree/Stripe/PayPal router (`roamwise-payments` Worker) — built, documented, but no live client code points at it today. Its `createPayment()` already derives price server-side from `PRODUCT_CATALOG_JSON`, never from a client-supplied amount — confirmed safe by this audit, see §4.3. |
| Admin financial UI | `js/admin/business-metrics.js`, `js/admin/referral-liability.js`, `js/admin/compliance-checklist.js`, rendered into `admin/index.html` | MRR/ARR/EBITDA view, referral-liability computation, GST/TDS compliance checklist — all behind one `admins/{uid}`-gated login screen |
| Financial ledger data | `finance-data.js` (chart of accounts, append-only double-entry discipline), `referral-data.js` (referrer roster) | Root-level data files, loaded via `<script>` same as every other `*-data.js` config file in this app (`booking-data.js`, `events-data.js`, etc.) — this is the established, consistent pattern for this app's data files, not a scatter issue |
| Firestore rules | `firestore.rules` | `claims/{id}` (UTR submissions), `pricing/{doc}` (founder-offer gate), `config/{doc}` (owner-managed flags incl. `PAYMENT_PROVIDER`), `finance/costs`, `partnerClaims/{id}`, `partnerClaimEmails/{emailKey}`, `partnerships/{id}`, `admins/{uid}` |

**No stray payment-related code was found sitting in an unrelated file.**
`app.js` (575 lines, down from ~19,300 at the start of the modularization)
contains only a one-line `submitUtr()` delegation wrapper to
`RWPaymentGateway.provider('manual_upi').verifyPayment()` — required
because `index.html`'s `onclick="submitUtr()"` needs that exact global name
— plus marker comments; every other payment/pricing/ledger function is
already in the directories above.

## 2. Security audit — findings

### 2.1 Secrets: zero client-exposed — VERIFIED SAFE

Grepped every `.js`/`.html` file in the repo for Cashfree/Razorpay/Firebase
secret-key patterns (`*_SECRET*`, `*_API_KEY*`, `*_CLIENT_SECRET*` assigned
to a literal string). **Zero hits.** `worker/handlers/cashfree.js` reads
`env.CASHFREE_APP_ID`/`env.CASHFREE_SECRET_KEY` — Worker secrets set via
`wrangler secret put`, never written to `wrangler.toml` (confirmed: neither
`worker/wrangler.toml` nor `payments/wrangler.toml.example` contains a
secret value, only comments instructing `wrangler secret put`). The browser
only ever receives a `payment_session_id` back from `POST /cashfree/order`
— confirmed by `tests/cashfree-payment.test.js`'s existing assertion that
the secret key never appears in the response JSON.

The Firebase Web API key hardcoded in `admin/index.html` (and similarly in
`index.html`) is **not** a secret by Firebase's design — it identifies the
project, not a credential; access control is enforced entirely by
`firestore.rules`. Flagging this would be a false positive; noted here so a
future review doesn't re-flag it without checking.

### 2.2 Firestore rules on payment-related collections — VERIFIED SAFE (one pre-existing, documented, deliberately-open risk carried forward, not introduced by this audit)

- `claims/{id}` (UTR submissions): narrowly-scoped self-create (own `uid`,
  `status=='pending'`, `amount` bounded `0 < x <= 100000`, UTR must be
  exactly 12 digits, doc id bound to `uid_utr` preventing UTR reuse across
  accounts); only admin can `update`/`delete` (i.e. approve/reject). Safe.
- `pricing/{doc}` (founder-offer gate): public read, admin-only write,
  except a narrow `+1`-only carve-out on `founder.count` for a future write
  path — no client code currently exercises it. Safe.
- `config/{doc}` (`PAYMENT_PROVIDER` flag and friends): public read,
  admin-only write. Safe.
- `finance/costs`: admin read+write only. Safe.
- `admins/{uid}`: never client-creatable/deletable; a signed-in user may
  only update their own `pinHash` field. Cannot self-grant admin. Safe.
- `partnerClaims/{id}` (NMIMS-style institutional code redemption): **has a
  pre-existing, explicitly documented, deliberately-left-open risk** — `create`
  has no auth requirement beyond field-shape validation, so a caller who can
  guess/brute-force a valid unredeemed code + its associated email can
  redeem it for themselves. This was investigated and a fix was **attempted
  and reverted** in an earlier pass (v15.10 → v15.11) because the fix broke
  100% of genuine claim submissions (the real client, `nmims/index.html`,
  has no Firebase Auth wired in at all). The rules file itself documents
  three real options (a/b/c — add sign-in to the claim page, accept the
  bounded risk, or move creation through a Cloud Function) and explicitly
  defers the decision to the site owner. **This audit did not re-attempt
  that fix** — re-litigating an already-made, already-reverted, explicitly
  owner-deferred decision without new instruction from the owner would
  violate `AI-ROLES-AND-HANDOFF.md` rule 6 ("preserve intentional changes")
  and risks reintroducing the exact breakage v15.10 caused. It remains an
  open item for the owner, bounded by the `partnerships/{id}.cap` check
  (500-seat cap) also documented there.

### 2.3 Input validation / price tampering — VULNERABILITY FOUND AND FIXED

**This was real.** `worker/handlers/cashfree.js`'s `POST /cashfree/order`
— the one live, deployed order-creation endpoint — validated the
client-supplied `amount` only for being a finite positive number. It never
checked that `amount` matched the real price of the plan the client claimed
to be buying (`meta.planId`).

**Exploit scenario this closes:** a user opens browser dev tools (or simply
calls the endpoint directly with `curl`/`fetch`, bypassing the UI entirely)
and posts:
```json
{ "amount": 1, "customer": { "phone": "9999999999" },
  "meta": { "planId": "elite_y10" } }
```
`elite_y10` (Elite 10-year pass) really costs ₹24,999. The old code would
happily create a real Cashfree order for ₹1, hand back a real, valid
`payment_session_id`. The attacker pays the real ₹1 through Cashfree's
actual hosted checkout — a genuine, verifiable payment. Once
`GET /cashfree/order/:id/status` reports `order_status: "PAID"` (a true
statement — ₹1 really was paid), the client-side adapter
(`js/payments/providers/cashfree-adapter.js`) calls
`grantPurchase(orderId, 'cashfree', 'elite_y10')` — which derives the
granted tier from the **plan id**, not the amount actually charged (that's
deliberate, correct behavior for per-product fulfillment — see
`PAYMENT-GATEWAY-ARCHITECTURE.md`'s "Per-product fulfillment" section — the
gap was never validating that the plan id and the paid amount actually
agreed with each other before that point). Net effect: a real, permanent
₹24,999 Elite 10-year pass for ₹1, no admin review step (Cashfree's
confirmation is real-time/automatic, unlike the manual-UPI honor system).

**Fix:** added `worker/lib/pricing.js`, a canonical server-side price table
mirroring every plan `js/pricing/subscription-plans.js` and
`js/pricing/one-off-plans.js` actually sell (19 plan ids: `founder`,
`plus_m/plus_y/pro_m/pro_y/elite_m/elite_y`, `plus_y3/plus_y5/plus_y10/
pro_y3/pro_y5/pro_life/elite_y3/elite_y5/elite_y10`, `day/week/quarter`).
`handleCashfreeOrder()` now looks up `meta.planId` in that table and
rejects the request (`400 unknown_plan` / `400 amount_mismatch`) **before**
an order — and a real, chargeable `payment_session_id` — is ever created,
if `amount` doesn't match exactly.

Because the server-side table can't literally `import` the client's
browser-global pricing files (no bundler/ES modules in this app — see
`CLAUDE.md`), a new test file, `tests/cashfree-price-validation.test.js`,
loads BOTH sides for real (the client files via the same `vm`-context
pattern `tests/founder-seats.test.js` already uses; the server file via a
real dynamic `import()`) and asserts every price matches exactly, so a
future price change on one side that forgets the other fails CI loudly
instead of silently reopening this hole or overcharging buyers.

New tests (`tests/cashfree-payment.test.js` + the new
`tests/cashfree-price-validation.test.js`, 8 new tests total):
- rejects a tampered amount for a real, known plan (`elite_y10` at ₹1 →
  `amount_mismatch`, never reaches Cashfree)
- rejects a missing/unrecognized plan id even at a plausible amount
- accepts every one of the 19 real plan ids at its exact real price
- every server-side price matches the client-side canonical source, with no
  stale/extra ids

Existing tests that previously posted an `amount` with no `meta.planId`
(exercising unrelated behavior — live/sandbox routing, Cashfree-side
failure propagation, network-error handling) were updated to include a
real, correctly-priced `planId` so they keep exercising what they always
intended to, now that price validation runs first.

**Scope note on the manual-UPI honor-system flow:** the equivalent
"amount vs. plan" check does not exist for `js/payments/providers/
manual-upi-adapter.js`'s `verifyPayment()` (the UTR-claim submission). This
was investigated and is **not** the same bug: manual UPI is a deliberate,
documented honor system where every submission's instant unlock is
explicitly **provisional** pending a human admin's manual approval (see
`AI-ROLES-AND-HANDOFF.md`/`PAYMENT-GATEWAY-ARCHITECTURE.md`) — the human
review step this task's Cashfree finding was missing already exists here by
design. A mismatched amount there costs an admin a few seconds to catch and
reject on review, not a permanent, unreviewed grant. Left as-is; flagged
here for visibility, not fixed, since it is working as designed rather than
a gap.

### 2.4 XSS — VERIFIED SAFE

Checked every place a payment-related, user-submitted string (UTR, payment
reference, claim name/email) is rendered into the DOM. `admin/index.html`
(the only place these are ever displayed, e.g. `renderRevenue()`,
`openRevenue()`) consistently routes every such value through its
`esc()` helper (`s=>String(s??"").replace(/[&<>"]/g,c=>({...}))`) before
interpolating into `innerHTML` — confirmed at every call site handling
`c.utr`, `c.ref`, `c.email`, `c.uid`, etc. No raw interpolation of
user-submitted payment strings found anywhere in `js/payments/*.js` or
`admin/index.html`.

### 2.5 Admin payment/financial UI auth gating — VERIFIED SAFE

`admin/index.html` gates its ENTIRE app shell (Money, Business, Referrals,
Compliance, Staff, etc. — every `<section>`) behind one
`auth.onAuthStateChanged()` handler that (a) requires a signed-in Firebase
user, AND (b) requires `admins/{uid}` to exist in Firestore (itself
`allow read: if isSelf(uid)` and never client-writable beyond `pinHash` —
see §2.2). Sign-out clears `CURRENT_ADMIN` and re-shows the login screen.
There is no separate, differently-gated payment/financial section — one
consistent gate for the whole console.

## 3. Non-security fix: stale script reference (found during the audit)

`admin/index.html` still loaded `../js/pricing/tiers.js` — a file that no
longer exists. It was split into `js/pricing/subscription-plans.js` +
`js/pricing/one-off-plans.js` in an earlier "subscription-vs-one-off
gating" pass (see `PAYMENT-GATEWAY-ARCHITECTURE.md`), and `index.html` was
updated to the two new files at the time, but `admin/index.html` was
missed. This meant `RWPricing` was `undefined` in the admin console, and
`admin/index.html`'s own Business tab code
(`RWBusinessMetrics.summarizeRevenue(proRevenueRecords(), RWPricing.CONFIG)`)
would throw — the admin Business tab (MRR/ARR/EBITDA view) was silently
broken. Fixed by pointing at the same two files, in the same order,
`index.html` already uses. Verbatim reference fix, zero logic change.

## 4. Verification performed

- `node --check` on every touched file (`worker/handlers/cashfree.js`,
  `worker/lib/pricing.js`, `tests/cashfree-payment.test.js`,
  `tests/cashfree-price-validation.test.js`) — clean.
- `npm test` (`node --test tests/*.test.js`) — full suite green (142
  tests), including 8 new/updated tests covering the price-tampering fix.
- `npm run check` (line-limit + syntax + typecheck) — clean; the 5
  soft-target line-count warnings listed are pre-existing and unrelated to
  this change.
- `npm run mod-status` — `ARCHITECTURE.md`'s headline numbers still match
  (this change touched `worker/` and `tests/` only, no `js/`/`app.js`
  line-count drift).
- Confirmed (§4.3 above) that the separate, not-yet-wired `payments/`
  multi-provider router does NOT have the same price-tampering gap:
  `payments/worker.mjs`'s `createPayment()` derives the charged amount
  entirely from its own server-side `PRODUCT_CATALOG_JSON`, never from a
  client-supplied amount field.

## 5. Compliance notes (established this session / cross-referenced, not re-derived here)

- **GST / TDS** — see `PRICING-REFERRAL-MATH.md` for the full math. Two
  compliance lines already modeled: (1) 18% GST is tagged per-account in
  `finance-data.js`'s `RW_ACCOUNTS` chart of accounts (`rev_pro`,
  `rev_commission`, etc.), with a documented, conservative
  GST-on-commission stress case for when a GST-registered creator/affiliate
  starts invoicing RoamWise; (2) Section 194H TDS withholding
  (`exp_referral` tagged `tds:'194H'`) triggers once a single referrer's
  commission crosses ~₹20,000/financial year — worked out to ~27 Pro-yearly
  sales or ~5 Pro-lifetime sales by one referrer. Not yet operational (only
  3 staff referrers on the books today per `referral-data.js`), but the
  chart-of-accounts tagging is already in place for when it is. As always,
  confirm actual applicability with a CA — this is bookkeeping structure,
  not tax advice.
- **Razorpay KYC/merchant-activation pages** (PR #128,
  `claude/razorpay-kyc-pages`) — added `pricing.html`, `refund-policy.html`
  and confirmed `about.html`/`contact.html`/`terms.html` exist, satisfying
  Razorpay's live-payments activation website checklist (About Us, Contact
  Us, Pricing, Terms & Conditions, Privacy Policy, Cancellation & Refunds)
  ahead of a future real Razorpay integration — Razorpay is not RoamWise's
  live payment provider today (see `AI-ROLES-AND-HANDOFF.md`'s "Important
  correction" section); this is preparatory groundwork only.
- **PCI-DSS** — stated explicitly and precisely here, since overclaiming or
  ignoring this is worse than either alone: **RoamWise never touches, sees,
  transmits, or stores a raw card number, in any purchase path.** Manual
  UPI is a deep-link/QR to the user's own UPI app plus a 12-digit UTR
  reference — no card data ever exists in this flow. Cashfree checkout is
  entirely hosted by Cashfree's own client-side Checkout JS SDK
  (`js/payments/providers/cashfree-adapter.js`'s `openCheckout()` hands off
  to `cashfree.checkout({paymentSessionId, redirectTarget:'_modal'})`) —
  RoamWise's own code never sees card fields, only an opaque
  `payment_session_id`. Gumroad checkout is similarly a full redirect/hosted
  flow. **This keeps RoamWise out of full PCI-DSS scope** (specifically,
  it is not required to complete a SAQ D or maintain a cardholder-data
  environment) **by design, not by omission** — but this statement is a
  scope observation based on how card data flows through this specific
  integration shape, not a completed formal PCI compliance assessment, SAQ
  filing, or attestation, none of which this pass performed or claims to
  have performed. If a future integration ever collects card fields
  directly (rather than via a fully hosted/tokenized checkout), this
  statement stops being true and a real PCI-DSS scoping exercise would be
  required at that point.
