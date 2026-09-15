# RoamWise resilient travel-marketplace revenue model

Research checked 15 September 2026. This is a decision document, not a claim
that every private supplier contract is public. Thousands of regional portals
exist and most large OTAs negotiate rates by country, property type, inventory,
promotion and contract. Where a portal does not publish a supplier rate, the
table labels the number as a market estimate rather than presenting it as fact.

## Commission landscape

| Portal / category | Public or commonly reported supplier model | Evidence quality | RoamWise decision |
|---|---:|---|---|
| Airbnb stays | Split fee: most hosts 3% plus a guest fee; single fee: most hosts 15.5%, normally 14–16% | Official current help page | Compete with a clear host-only 5–7%; ₹0 guest booking fee |
| Airbnb services / experiences | Services typically 15% (with a stated minimum); experiences typically 20% | Official current help page | Experiences should start at 10–15%, only after operator economics are verified |
| Vrbo pay-per-booking | 5% commission + 3% payment processing | Official help page | RoamWise 7% host-collected pilot is below the combined 8% |
| Booking.com | Exact commission is shown during registration and depends on country, property and agreement; industry guides commonly place it around 10–25%, often near 15% | Official page confirms variable contract; range is secondary | Do not advertise a made-up Booking.com universal number |
| Expedia Group | Compensation/commission affects visibility and is contract-dependent; independent-hotel market estimates commonly run roughly 15–30% | Official page confirms variable compensation; range is secondary | Keep RoamWise terms fixed per confirmed booking; never auction ranking secretly |
| Agoda | Supplier rate is contract/market dependent; common hotel-industry estimates are roughly 15–25% | Secondary; no universal public rate found | Treat competitor value as directional until a real contract is obtained |
| Trip.com | Common hotel-industry estimates are roughly 10–25% | Secondary; no universal public rate found | Same guardrail: no false exact comparison |
| Hostelworld | Public terms explain booking deposits and supplier settlement, but not one universal supplier commission | Official terms; rate private/variable | Compare only after receiving a RoamWise supplier's actual offer |
| MakeMyTrip / Goibibo | Indian hotel-industry estimates commonly report about 18–25%; real rates are negotiated | Secondary; contract private | Position 5–7% as simpler and lower, not as a guaranteed percentage saving |
| OYO | Reported economics vary widely by operating model; market estimates often cite roughly 20–30% | Secondary; not a comparable single OTA contract | Do not compare directly without matching the same operating model |
| Cleartrip / Yatra / EaseMyTrip | No reliable universal public supplier commission found; negotiated by contract | Public exact rate unavailable | Mark “contract required,” never invent a number |
| Viator / Tripadvisor Experiences | Supplier commission is negotiated; market estimates often cite about 20–30%. The public 8% figure is an affiliate payout, not a supplier fee | Mixed; important category distinction | Do not confuse affiliate revenue share with operator commission |
| GetYourGuide | Supplier commission is agreement/market dependent; industry estimates commonly cite about 20–30% | Secondary; exact universal rate unavailable | Start below the verified local comparator, with a minimum contribution-margin floor |
| Klook | Industry estimates commonly cite about 15–25%; exact terms vary | Secondary | Same evidence and margin guardrail |
| Flights | Airline/OTA economics are usually thin, route- and agreement-specific; many consumer portals monetize service fees, ads or affiliate/CPC rather than a simple hotel-like commission | Mixed/private | Use affiliates or licensed inventory first; do not subsidize ticketing support blindly |
| Cars / insurance / eSIM / activities | Affiliate CPA or revenue-share varies by provider, country and product | Contract-specific | Use as ancillary revenue only when disclosure, refund and support ownership are clear |

Primary references:

- [Airbnb service fees](https://www.airbnb.com/help/article/1857)
- [Airbnb service and experience host fees](https://www.airbnb.com/help/article/3164)
- [Vrbo pay-per-booking fees](https://help.vrbo.com/articles/What-is-the-pay-per-booking-service-fee)
- [Booking.com: understanding your commission](https://partner.booking.com/en-us/help/commission-invoices-tax/invoices/understanding-your-commission)
- [Cashfree Easy Split product](https://www.cashfree.com/easy-split/split-payment-gateway/)
- [Cashfree Easy Split overview](https://www.cashfree.com/docs/api-reference/payments/previous/v2023-08-01/split/easy-split-overview)
- [Cashfree split-a-payment recipe](https://www.cashfree.com/docs/payments/split/recipes/split-a-payment)

Secondary ranges are useful for positioning, not billing. Before naming any
competitor in property sales material, keep a dated copy of the cited source or
the property's actual competing offer.

## The RoamWise commercial ladder

| Plan | Fixed fee | Completed-booking fee | Purpose |
|---|---:|---:|---|
| Partner Free | ₹0 | 7% | Frictionless onboarding and pay-for-results acquisition |
| Partner Desk | ₹249/month | 5% | Low-cost recurring revenue plus a useful host workspace |
| Annual Desk | ₹2,499/year | 5% | Improves cash predictability across a property's low season |
| Three-year Desk | ₹5,999/3 years | 5% | Retention and upfront working capital; no automatic renewal by default |

The lower 5% rate starts only after a paid plan is verified. A requested plan
never changes commission by itself. Every booking snapshots its commission at
confirmation, so a later pricing or risk change cannot rewrite the deal.

The rate is deliberately not dynamically raised during high demand. The
dynamic engine changes supply acquisition, merchandising and promotion—not an
already-agreed partner charge. Taxes, payment-gateway fees and optional paid
promotion must remain separate and visible.

## Season-, shock- and economy-resistant portfolio

No travel business is literally war-, recession- or season-proof. The correct
goal is bounded exposure and fast reallocation.

1. Build a demand matrix for each property: country, destination, latitude/
   climate pattern, high-season months, price band, domestic/international
   share, lead time, cancellation profile and operational risk.
2. Measure only completed-booking commission as earned revenue. Keep requested,
   confirmed, paid, refunded, disputed and completed states separate.
3. Set portfolio guardrails: target no country/region above 35% of booking
   commission, no single property above 15%, no price band above 50%, and no
   calendar month above 20% of annual commission. These are operating targets,
   not guarantees; the admin dashboard should flag exceptions rather than hide
   them.
4. When one region enters a government-advised disruption, stop promotion and
   new checkout there, protect affected guests, and redirect acquisition to
   already-verified safe regions. Never use a crisis merely to increase fees.
5. Balance northern/southern seasons, mountain/coastal/city demand, domestic/
   international markets and budget/midscale/premium supply. City, work-trip,
   long-stay and B2B demand can soften leisure seasonality.
6. Use recurring partner subscriptions, RoamWise consumer plans, B2B Trail
   Mesh/operator licenses and disclosed ancillary affiliates as independent
   revenue lines. Do not let one category exceed 40% of gross margin without an
   explicit founder review.
7. Recompute concentration monthly and open an onboarding target when a
   country, month, price band or property exceeds its guardrail. Human review
   approves the market; an algorithm never declares a destination safe.

## Property lifecycle

Onboarding should be one short application followed by verification:

1. Verified Firebase account; one UID regardless of Google or password sign-in.
2. Owner/contact, country, city, rooms, starting price, busiest months and
   requested commercial plan.
3. Public ownership/location/rate check and remote walkthrough when needed.
4. Admin approval activates the property on Partner Free at 7%.
5. Rooms become bookable only after explicit marketplace approval.
6. A paid-plan request moves to 5% only after payment is independently verified.

Offboarding is suspension, not deletion: stop new inventory, preserve guest,
refund, tax, payout and audit history, then settle any undisputed balance. This
keeps accounting correct and allows reviewed reactivation.

## Payment and money routing

### Phase 1 — safe pilot (current)

The property collects from the guest only after confirming availability.
RoamWise snapshots the booking amount and fee, marks completion, invoices the
earned commission and reconciles weekly. This avoids pretending RoamWise has an
escrow/wallet or marketplace settlement approval it does not yet have.

### Phase 2 — Cashfree marketplace routing (activation required)

Cashfree Easy Split is the relevant product, not the existing one-off RoamWise
subscription checkout. Before live routing:

- Cashfree must activate Easy Split for the merchant account.
- Each property becomes a vendor with provider-required KYC and settlement
  details; RoamWise stores only the vendor identifier and safe status, not bank
  credentials in browser-readable Firestore.
- A signed server webhook—not a browser callback—moves a booking to paid.
- The server creates one idempotent split from the booking's snapshotted terms:
  property net amount, RoamWise commission, separately disclosed gateway/tax
  treatment, and a rounding invariant that always equals the captured amount.
- Refunds, partial refunds, disputes and reversals create compensating ledger
  entries; history is never edited away.
- Settlement is held while verification/refund/dispute rules require it, then
  released through the provider. Exact TDS/GST treatment needs Indian tax and
  legal review before launch.

`payments/marketplace-settlement.mjs` implements the provider-neutral,
integer-paise settlement invariant and refuses unpaid bookings, unverified
vendors and missing commission snapshots. It deliberately makes no network
call until the provider activation and webhook layer exist.

Do not accept Cashfree passwords, App IDs, secret keys, webhook secrets, bank
credentials or identity documents in chat, Git, a public admin form or client
Firestore. Configure provider secrets only in the deployed server's secret
store, test Sandbox end-to-end, rotate anything ever pasted into an unsafe
channel, and perform one small controlled live settlement before rollout.

## Monthly operating loop

1. Close completed bookings and refunds; reconcile the payment provider and
   partner ledger.
2. Review country, property, month, price-band and revenue-line concentration.
3. Pause unsafe supply and open onboarding targets for the weakest independent
   segment.
4. Promote available inventory where demand and safety evidence agree.
5. Review take rate, support cost, refund loss and contribution margin by
   segment. A lower commission that loses money after support is not resilient.
6. Keep a cash reserve; diversification reduces shocks but never removes them.
