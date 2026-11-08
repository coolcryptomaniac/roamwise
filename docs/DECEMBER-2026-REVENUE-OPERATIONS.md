# RoamWise December 2026 revenue sprint — operating brief

Owner: Founder. Execution requires explicit staff assignment; internships ending 10 November do not imply automatic extension.

## Targets (proposed, not forecasts)
- Deepanshi, if retained/contracted: 40 qualified wedding/corporate/retreat organizer leads, 20 decision-maker conversations, 12 dated package quotes, 6 paid booking requests, 4 supplier-confirmed bookings, 100% same-day supplier response chasing. Weekly target: 10/5/3/1–2.
- Febin, if retained/contracted: 20 qualified high-intent inbound leads, 12 original short videos, 8 property/package promotional posts, 4 corporate/wedding landing-page campaigns, 10 shop orders, 100% tagged attribution on campaigns; weekly review of checkout drop-off.
- Shared: 6 supplier-confirmed packages and 10 shop orders as stretch goals, zero lost paid booking notifications, refund backlog zero. Bonuses require a separate written incentive agreement and verified net margin after refunds, fees, taxes and supplier settlements.
- Priority: corporate offsites and professional wedding planners; secondary: premium honeymooners, retreats, private family groups. Do not re-contact NMIMS as part of this sprint.

## Funnel and contact management
Stages: sourced → verified business contact → permission/legitimate outreach basis → contacted → discovery → dated quote → payment received → supplier confirmation pending → confirmed OR refund initiated → stay completed → review → supplier settlement reconciled.
For each lead: organization, professional contact, location, event type, group size, budget band, date, source, permission status, owner, last touch, next action, forecast value, actual revenue and margin. Suppress unsubscribes. No scraping private phone numbers or mass unsolicited WhatsApp.
For each booking: immutable order ID, property, guests, dates, all-inclusive selling price, optional extras, Cashfree verified payment ID, payment captured amount, supplier cost, RoamWise fee/margin, supplier response SLA, confirmation reference, refund liability, cancellation terms accepted at checkout, payout status, audit trail, Deepanshi/Febin coordination routing.

## Guest experience
Date + guest selection → server-computed all-inclusive total → Cashfree/UPI → status 'PAID — PROPERTY CONFIRMATION PENDING' → booking desk alert and acknowledgement → hotel reference sent to guest. If unavailable, full refund initiated to original method; record refund ID and timing. Never mark confirmed before written supplier acknowledgement.
Show applicable cancellation schedule and non-refundable deadline **before payment**, reflecting each supplier's actual policy; never invent a flat no-refund cutoff. Refund any statutory entitlement and unprovided service as applicable.
Keep Deepanshi and Febin professional coordination emails visible only if their continued role and permission are confirmed; do not publish unverified personal phone numbers.

## Financial controls
Track gross booking value separately from recognized RoamWise revenue. Maintain supplier payable, refunds payable, payment gateway fees, taxes, chargebacks, and settled margin. Do not treat guest advances as free operating cash. Payout dates follow agreed supplier contracts and payment service rules; never unilaterally hold funds until a review. Trigger low-balance alert if reserved refunds + supplier payables exceed available settled funds.
A property can be advertised as bookable only with date-valid inclusive rates, supplements, cancellation terms, and a functioning confirmation desk. Tattwaa's old rate expired 31 March 2026 and must not be used for payable checkout. Festive/blackout rates require approved final totals.

## Promotions
- 8–20 Nov: corporate winter offsite proposals, luxury honeymoon itineraries, winter destination-wedding planners.
- 21 Nov–15 Dec: winter retreat and premium Manali/Corbett campaign with date-validated package totals.
- 16 Dec–5 Jan: New Year / festive offers **only** where peak dates and surcharges are approved.
- Use UTM-tagged landing pages and measure lead→payment→confirmation→refund→net margin. Pause campaigns with unfulfillable inventory.
- Shop: feature Aipan apparel, travel essentials and gifts with verified SKU stock, shipping and refund terms. Promote direct checkout, not WhatsApp-only ordering.

## Important implementation gaps
The existing stay Cashfree handler currently prices four Amor stays only; guest count is hardcoded at two. No universal booking engine exists yet for Almora, Lansdowne and all other properties. Supplier emails rely on AgentMail secrets; SMS/WhatsApp not implemented. KV alone is not a durable idempotent financial ledger. Implement Firestore transaction-backed booking records, verified payment webhook, reliable retry/outbox, supplier confirmation UI, refunds, settlement ledger, and live sandbox acceptance tests before promising unattended fulfillment.
