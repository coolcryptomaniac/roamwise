# RoamWise Trails — partner self-onboarding and checkout

Status: review-gated feature, not merged or deployed. It does not constitute an affiliation announcement or a live Hike & Seek listing.

## Pages and users
- /treks/ — public verified-departure discovery; Hike & Seek invitation preview is explicitly unverified and never bookable.
- /treks/#join — logged-in applications for trekking companies, guides, transport operators and outdoor experiences.
- /treks/#studio — applicant package submission, package updates and review status.
- /treks/#review — founder/admin approval desk for partners, departures and paid booking follow-up.
- The homepage's Partner with RoamWise chooser points trekking and transport applicants here.

Public Hike & Seek trek names were researched from https://hikeandseek.in/ and appear as source-linked invitation examples only. No relationship, rights to images, prices, availability, or terms are assumed. Its Tungnath listing appears inconsistent on length and inclusions; an authorised representative must check these before approval. The same onboarding is reusable for Trek The Himalayas, Indiahikes and similar operators. Neither is claimed as a RoamWise partner.

## Commercial terms
- Operator/platform commission: 0% for three years beginning on verified approval for approved trekking companies, guides, transport and similar experience providers. No automatic charge is imposed after that period by this implementation.
- A voluntary gift or contribution is never a checkout field or mandatory obligation and does not purchase ranking, verification or favourable safety decisions.
- Customer-paid RoamWise service fee: MIN(CEIL(1% of operator subtotal), INR 99), charged once per booking. The operator base rate is not reduced.
- Individual seat pricing: subtotal = unit price times traveller count. Vehicle and private-group pricing: subtotal = unit price, regardless of passenger count.
- Examples: INR 3,000 operator total => INR 30 fee; INR 9,999 => INR 99 fee; INR 20,000 => INR 99 fee. Payment gateway charges, GST and refund costs may exceed the RoamWise fee: budget a subsidy rather than claiming positive unit contribution margin.

## Protected data and verification
Worker-only Firestore collections under the existing Firebase project:
- trekProviders/{uid} — verified-email applicant, role, details, safety/permit information, pending/approved/paused review status.
- trekPackages/{tp_uuid} — owner, departure, capacity, unit price, pricing unit, itinerary, inclusion/exclusion, refund/safety details; pending review until approved.
- trekBookings/{rwtrek_hash} — server-calculated total and fee, guest and provider references; payment pending or paid pending operator confirmation, later manually confirmed or flagged for refund review.
- config/trekMarketplace — launch switch read by the Cloudflare Worker; must explicitly contain checkoutEnabled=true AND environment matching the Worker's CASHFREE_ENV to allow checkout. Keep checkoutEnabled=false by default. DO NOT change it to true while testing a live Worker configuration.

The existing Firestore security rules are not broadened: server service-account handlers perform reads/writes, and the public catalog exposes only approved professional information. Applicants must have Firebase-verified email. Administrators have their existing admins/{uid} record. Browser-supplied prices, operator IDs and payout instructions are never trusted.

## Payment process (onboarding does not automatically trigger charges)
1. Verified partner and published departure; customer signs in with verified email and reviews final operator quote plus capped fee.
2. Customer explicitly accepts cancellation policy, pending-confirmation condition and payment terms.
3. Worker snapshots an immutable booking quote, then creates a Cashfree order from server-controlled price and returns a payment session.
4. Frontend launches Cashfree checkout. Returning from the gateway never on its own marks the booking paid.
5. Signed Cashfree webhook and/or authenticated status endpoint rereads Cashfree order, amount and currency; PAID is recorded only when verified.
6. Successful payment status is paid_pending_operator_confirmation. Founder verifies booking with operator manually, records confirmation evidence, or flags refund_review_required.
7. Refund flag does not issue a real refund; authorised Cashfree refund workflow must be completed and reconciled separately. Neither auto-issue trek tickets nor auto-transfer supplier funds. Cashfree Easy Split/supplier settlements are not enabled.

## Launch checklist
- [ ] Obtain voluntary application from Hike & Seek authorised contact; do not impersonate its representative.
- [ ] Validate the operator's real identity, tour/guide permits and insurance where relevant, emergency plans, route, trekking certifications, contact, availability and exact inclusions.
- [ ] Confirm any consumer protection, travel/tax, refund and Cashfree third-party collection requirements before accepting live payments. Confirm money management and supplier settlement arrangements; automated split payouts are NOT present.
- [ ] Deploy the frontend and Worker to staging, inspect cloud log failures without logging secrets, test mobile layout and Firebase login.
- [ ] Keep cashfree environment sandbox with matching sandbox credentials and config/trekMarketplace checkoutEnabled=true for test; the Worker currently defaults to LIVE and must not be used for trial charges.
- [ ] Test unauthorized partner edits, unapproved catalog listing suppression, checkout price manipulation, duplicate nonce/idempotent order creation, webhook replay, exact amount verification and customer-only status access.
- [ ] Test all three pricing units (person, vehicle, group), multi-person group capacities, broken dates, unavailable seats and pending confirmation.
- [ ] Test that marking booking operator_confirmed survives later status checks and webhook retries.
- [ ] Test cancellations, actual Cashfree refunds, refund liability and settlement manually before launch.
- [ ] Run node --check on worker/handlers/treks-marketplace.js, worker/worker.js, treks/app.js and js/ui/partner-hub.js; then npm run check, npm test and Chrome/Android end-to-end testing. These were not performed from this connected-tool session.
- [ ] Independent review of payment/auth changes and explicit production deploy. Never enable checkout merely by merging this PR.

## Explicit nonclaims
Not merged, deployed, merchant-approved or purchase-tested in production. No company has been onboarded by this implementation; no public booking dates or supplier prices were invented. There is no automated operator inventory lock, supplier payout or completed Cashfree refund. Operator confirmation after payment is essential.
