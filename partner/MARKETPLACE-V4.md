# RoamWise Partner Marketplace v4

Marketplace v4 is the production UX and operating layer above the verified v3 booking contract. It deliberately keeps RoamWise simpler than a full OTA while borrowing proven marketplace patterns: a compact search, readable listing cards, clear price/status hierarchy, request-to-book, explicit trust boundaries, and a host dashboard centred on work that needs attention.

## Product model

### Traveller

1. Search destination, dates and guests.
2. RoamWise verified direct stays appear before external inventory.
3. A direct room is actionable only after v3 rechecks `marketplaceApproved === true`, `open !== false`, and `partnerUid` consistency.
4. The traveller sees room price, estimated stay total, cancellation summary and the no-prepayment rule.
5. A real request requires a Firebase account with verified email, a valid phone number, valid dates, and acknowledgement of the booking/prepayment terms.
6. The host confirms or declines availability.
7. Only after confirmation does the payment method snapshotted by v3 become actionable: pay at property, UPI after confirmation, or a host-supplied HTTPS checkout page.

RoamWise does not claim that a static room calendar is instant inventory. Until a private inventory service exists, direct rooms stay request-to-book.

### Host

The Host dashboard starts with **Host Today**, not settings:

- new requests;
- confirmed stays;
- live rooms;
- open booking value;
- requests that have been waiting more than 24 hours;
- three most recent reservation events.

The existing room/rate/booking controls remain underneath, so v4 is additive rather than a rewrite of trusted v3 business logic.

### Property onboarding

The owner flow now presents four steps:

1. verify account;
2. add property and public listing details;
3. RoamWise review;
4. go live and manage requests.

The public form explicitly tells hosts not to upload Aadhaar, PAN, passport, bank passwords or card data. The existing v2/v3 attestations and founder approval remain the trust gate.

## UX principles used

- **Airbnb-style simplicity:** one primary action at a time, clear booking state, readable reservation details, host attention on requests and earnings rather than an admin wall.
- **Booking.com-style supply logic:** Request to Book remains available, house/cancellation expectations are surfaced before commitment, and properties control their own rooms/rates.
- **RoamWise-specific boundary:** verified direct local stays first; external providers fill inventory gaps without being presented as RoamWise-direct supply.

These are product principles, not copied layouts or claims of equivalent protection.

## Safety and trust boundaries

v4 does not relax any Firestore permission and does not replace the v3 trust checks.

It does **not** add or claim:

- card processing;
- escrow;
- automatic refunds;
- insurance or damage protection;
- government-ID KYC inside static client JavaScript;
- PCI handling;
- instant-book inventory locking;
- guaranteed 24-hour response;
- verified guest reviews unless a completed-stay review ledger is later implemented.

A future private backend should own inventory locks, payment webhooks, refunds/disputes, KYC vendor callbacks, fraud/risk signals and authoritative notification delivery before those features are advertised.

## Additional v4 client guardrails

- check-in cannot be before today;
- checkout must be after check-in;
- direct requests longer than 90 nights are stopped and routed away from the lightweight request flow;
- phone format is constrained to 7–15 digits after punctuation is removed;
- traveller must acknowledge cancellation/prepayment terms;
- price copy distinguishes the stored room total from any mandatory property/local tax the host must disclose;
- unanswered requests older than 24 hours are surfaced to the host as attention items, but are not silently auto-cancelled client-side.

## Files

- `partner/marketplace-v4.css` — calmer marketplace hierarchy, responsive listing/booking/host UI and accessibility/touch improvements.
- `partner/marketplace-v4.js` — progressive UX, client guardrails, host operating summary and owner onboarding progress.
- `partner/index.html` — v4 asset loading after existing v2/v3 layers.
- `.github/workflows/partner-marketplace-v4-check.yml` — syntax and trust-boundary checks.

## Release rule

Merge only after v4 CI passes. The canonical root `firestore.rules` remains the security source of truth and must never be weakened just to make a client flow pass.
