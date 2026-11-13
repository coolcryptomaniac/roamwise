# Amor Hospitality — operational booking and pricing gates (13 November 2026)
Amor partners: The Tattwaa Corbett Spa & Resort, Nanau Resort & Spa, Padma Villa Manali and Aramness Gir.

## Current founder commercial direction
- Room-only resale markup: **maximum 7% on agreed net room cost**; do not apply the earlier 25% room multiplier.
- Experience-led packages: **target 20–25% overall markup on all supplier costs**, only if real, independently quoted add-ons support it. Room line remains capped at 7%; the package target is **not** a promised profit margin.
- Any supplier discount **up to Rs 500**, on select properties only, needs a property/date/amount-specific written confirmation. Founder may choose to pass it on, retain it, or split it. Do not announce an unapproved discount.
- A retail price comparison, sale badge or crossed-out MRP requires the same property, exact room category, guest count, check-in/out, meal plan, cancellation rule, taxes and date/time snapshot. OTA cashbacks and card deals should not be described as universal prices.
- Fees and taxes: model supplier quoted inclusive/exclusive tax per rate sheet, separately confirm the actual invoice route and any applicable GST service classification with accountant; do not add GST to an already tax-inclusive supplier amount by assumption.
- Supplier net rate data is confidential: keep in private approved pricing store or Worker secret, never in public code, cards, JS, logs or HTML.

## Supplier sheets and dated validity
- Nanau: October 2026 through March 2027, rate sheet explicitly inclusive of taxes; peak supplements and child/pet add-ons apply. 25–30% token, 50% before 15 days, 100% at least 7 days before arrival. Confirm actual booking deadlines and supply quote.
- Padma: normal tariff 1 Oct–18 Dec 2026 and 11 Jan–31 Mar 2027; separate 18 Dec–10 Jan peak tariff. PDF explicitly says TAX-EXCLUSIVE, despite 7 Nov email saying inclusive. 50% at booking; rest at least seven days before arrival. Six rooms, up to 12 overnight occupants on entire villa; wedding/event capacity and venue permission unknown and require a custom event quote.
- Aramness: 16 Oct 2026 through 28 Feb 2027 tariff, all-major-meal Kothi. Special fair / blackout sheet differs. Conservation fees and safaris are separate; safari prepayment is 100%; property booking requires 25% inside 3 working days and remaining by 30 days before arrival. Gujarat property may be promoted on rack rates or written exclusive deals: do NOT assume wholesale discount will be honoured absent partner confirmation.
- Tattwaa: PDF expires **31 March 2026**. Request fresh Nov 2026–Mar 2027 rates and reconcile reported 60 keys / eight-bedroom private-pool villa inventory. Do not sell off expired room rates.
- Verify the Tattwaa Sitabani Gate–Bhalon address on Amor's PDF against similarly named properties on OTAs (some listings point to Dhela) before using OTA comps.
- Wedding and group rates are explicitly **ad hoc**, not contracted. Get venue permission, day guest limits, food, décor, sound, vendor, safety, cancellation, occupancy, room-block and extra guest rates in writing.

## Payment safeguards
- Both payment paths — `worker/handlers/stay-cashfree.js` and `payments/worker.mjs` — reject all four Amor IDs until a separately implemented approved locked quote is live.
- Existing checkout displays a quote-only message and links to `/packages/amor-luxury.html`. No Cashfree/UPI payment or wallet deduction for unsold Amor packages while these gates are active.
- When enabled, Cashfree orders MUST use immutable server-stored quote ID/total, linked to a supplier room hold, date and category, taxes, cancellation rules, invoice entity, discount evidence and payment schedule; never accept client-supplied total.
- Customer may choose 25% advance only if the supplier deposit deadline can be covered without RoamWise financing the shortfall. Full payment is possible if the quotation is valid and terms disclosed. Padma needs at least 50% at booking; default **full only** from a 25%/100% UI unless 50% is separately introduced. Gir early-arrival cases may need 100%.
- Signed Cashfree webhook and independent payment lookup; atomic idempotent claiming; supplier acknowledgement, fulfilment and guest voucher after hold, as well as original-source refund reconciliation, are mandatory.
- Public cards disclose that quoted packages and extras are subject to supplier confirmation, never guaranteed safaris or instant inventory.
- All four source PDFs and any net-rate derivations must remain private; do not attach them to GitHub.

## Priority actions
1. Written commercial addendum: max 7% room markup, entitlement to reseller booking and customer payment collection; exact tax and ₹500 eligibility matrix.
2. Latest Tattwaa Nov 2026–Mar 2027 tariff and room configuration; Padma contradictory tax instruction; Aramness rack vs exclusive eligibility and peak restrictions.
3. Every product: dated room/meal/inclusions and supplier hold; separate add-on supplier quotes and cancellation terms for package margin.
4. Build private rate-book + signed admin quote acceptance + live inventory confirmation. Run sandbox 25% and full orders (and 50% option where legally/commercially needed) before enabling production.
5. Compete with OTP-specific public OTA totals, not a one-off unverified headline price. Get photo use rights and real Padma media.
