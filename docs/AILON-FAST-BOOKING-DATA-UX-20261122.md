# Ailon Tusk — booking-first UX and trusted catalogue (22 Nov 2026)

**Status:** Design + versioned seed metadata only. This PR does **not** import into Firestore, activate public inventory, enable Cashfree, or guarantee real-time availability.

## Customer-first interface
Review inputs: founder-provided screenshots of Onto's mobile room selection (large real room photos, 2–3 cards visible via horizontal swipe, concise labels, bed/cancellation tags, selected state, sticky all-inclusive amount and booking button), onto.travel product and Suno's short prompt-to-result experience.

- **Home:** Ailon Tusk input as the visual focal point with nearby three example prompts. Navigation: Explore, Trips, More. Put deep admin, finance, creator operations and experimental infrastructure in More, not the home screen.
- **One conversation, one trip canvas:** User says “2 adults, a quiet room near Almora for 2 nights, under ₹3,000 total”. Parse what is known; ask only for a missing critical date; do not fabricate availability. Shortlist up to three grounded room/package cards, expandable to more, beside the conversation.
- **Room card:** 4:3 licensed photo; name, bed, occupancy, inclusions, cancellation, partner verification, time checked, and either *all-inclusive final quote with dates* or **Price on request**. Selected state and sticky total match the room quantity and nights. Show no private owner rate, hidden commission, invented price comparison or fake reviews.
- **Tap / voice:** “Select the second room” moves the selected card. “Book this” triggers **server-owned revalidation** and a clearly labelled checkout or enquiry path. Voice **never silently authorises payment**. A payment requires an explicit authenticated approval in a secured UI. Spoken selection must receive an accessible visual/read-back confirmation.
- **Booking modes:** `direct_verified` only where a supplier availability/rate API and payment workflow are production-verified; `assisted_enquiry` otherwise. For enquiries, prefill a WhatsApp message with RoamWise, dates, guest count, canonical partner ID and lead correlation ID; persist a consented lead before claiming receipt. WhatsApp opening is not a confirmed sale.
- **After booking:** persistent summary: Inquiry, awaiting owner, room held, payment pending, confirmed, modified, cancelled, refund pending/refunded; never mark confirmed solely because a payment provider redirected. Show support and traceable reference.
- **Accessibility:** high-contrast text, 44px+ tap targets, reduced-motion support, thumb-zone CTA, non-jarring haptics, keyboard access, dynamic font sizes, English/Hindi/Hinglish first. Kumaoni/Garhwali when QA-ready.

## API response contract
`data/ailon/booking-card-v1.schema.json` is a strict proposed JSON schema for server-returned candidates. The data is **display-only**, not a payment request.

Server must own: availability, final all-in tax computation, payment order, immutable supplier confirmation, Cashfree webhook verification, refund and settlement ledger. Browser owns only presentation and explicit user actions.

| Context | Source of truth | Required trust metadata | Cache |
| --- | --- | --- | --- |
| Place identities / namesakes | Existing `data/atlas`, curated destination records | canonical ID, origin, review date | Versioned / long-lived |
| Reviewed general travel facts | Existing `worker/data/tusk-facts.js`, optional R2 | primary URL, reviewedAt, expiresAt | Dated; no permanently live claims |
| Property and room details | Existing `partners-data.js` / `rooms-data.js` and approved Firestore partner records | canonical partner ID, verification status, image permissions | Until supplier update |
| Rates + stock | Partner-confirmed booking system / authorised supplier API | verifiedAt, expiresAt, source, final tax-inclusive amount | Very short TTL with recheck |
| Booking / payments | Authenticated Firestore + authoritative ledger + signed provider callbacks | quoteId, bookingId, idempotency key, verified payment state | Not public/cacheable |
| User preferences / trip history | Consent-scoped Firestore; local offline cache | user ID, privacy consent, deletion options | Per user; never indexed in public Vectorize |
| Semantic factual search | Optional Worker AI embeddings + R2 + Vectorize | approved-only chunks, model version, dated source | Version keyed; off until approved |

### Fast response budgets (performance **targets**, not claims)
- App interaction acknowledgement: <150ms on supported test devices.
- Render cached grounded shortlist: p75 <1s (only if cache has the reviewed data).
- Complete network-grounded quote: aim p75 <3s, show skeleton and honest `Checking availability…` until then.
- Instrument p50/p75/p95, TTFB, INP, LCP, Android ANR, swipe failures, quote timeout rate, price mismatch, booking conversion and cost per successful booking. Never let a timer turn missing inventory into assumed availability.

## Trust-first sales autopilot
1. Fix and smoke-test `POST /stay/lead` (tracked separately in #826) and all WhatsApp attribution paths.
2. Verify warm partner room inventory + owner-approved fees, official cancellation terms, licensed photos and room capacities before publishing new cards.
3. Open daily work queues: missing supplier data; consented enquiry follow-ups; refundable payment exceptions; qualified corporate requests; incomplete trip reminders. Draft outreach first, **never send or incur costs without the existing approval policy**.
4. Maintain an auditable lead funnel: `view → select → lead submitted → partner reply → quote accepted → payment verified → supplier confirmed → completed → commission reconciled`. Gross booking value is not RoamWise revenue.
5. Begin with 10–20 high-quality verified partner SKUs, not 50,000 automatically generated pages.

## Release sequence
- **P0**: isolate #809 conflicts and fix lead interception/security safely; regression and live staging POST. Then ensure owner contact permission, accurate WhatsApp links and delivery status.
- **P1**: accept this schema via a server-owned endpoint and add a compact card renderer inside existing `js/booking/tusk-stay-desk.js` (no disconnected new booking engine). Aillon can select with tap or voice, including confirmation.
- **P2**: Firestore migration + supplier-side rate/hold quote + Cashfree sandbox sign-off + reconciliation; promote `direct_verified` per approved supplier, with rollback.
- **P3**: post-booking support, price-change watches where suppliers permit it, multi-language speech QA, on-device light caching, rigorous Android testing.

### Existing architecture to reuse
- `docs/TUSK-HYBRID-KNOWLEDGE-V1.md`; `docs/TUSK-CURATED-KNOWLEDGE.md`
- `docs/AILON-TUSK-BOOKING-PARTNER-ROLLOUT.md`; `docs/booking-cashfree-sandbox-acceptance.md`
- `js/booking/tusk-stay-desk.js`; `js/booking/price-guard.js`; `js/booking/stay-lead.js`
- `worker/handlers/stay-lead.js`; `worker/handlers/stay-ledger.js`

### Evidence & competitors
Onto: https://onto.travel/ ; Onto funding: https://www.newsvoir.com/index.php?option=com_content&rid=37166&view=release ; Bucketlistt: https://titancapital.vc/blogs/bucketlistt ; Mindtrip strategic capital: https://www.unitedairlinesventures.com/news/capital-one-ventures-united-airlines-ventures-invest-in-mindtrip ; Suno creative UX reference: https://suno.com/blog/series-d-announcement ; AI travel directory: https://aiagentsfortravel.com/tools/

**Important:** This seed is a versioned *review queue*, not a public listing or a real-time database. The authoritative transactional store remains approved Firestore/Worker systems. Any automated ingestion requires owner-authorized records, source licensing, access rules, retention and rollback testing.
