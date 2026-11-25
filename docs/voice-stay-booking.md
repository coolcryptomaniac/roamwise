# Voice stay booking

`js/voice/stay-concierge.js` is a deterministic, read-only booking conversation entered from an explicit voice stay request. It asks for a destination, actual check-in/check-out dates, guest count and total budget. Up to two guests can compare full server-priced room quotes; larger groups use the existing room-selection flow. Missing inventory, unknown full totals, expired conversations and rate failures lead to enquiry or checkout navigation, never invented prices. An advance is not treated as the total stay cost.

The same conversation is visible in Ailon chat and Voice Studio. Options can be selected by voice or buttons. “Confirm selection” produces a checkout link carrying the chosen property, room, meal plan and dates. The checkout page rechecks prices and handles contact details, consent and Cashfree. The voice module never creates an order, reads wallet secrets or deducts a balance. Stop resets the conversation and ignores late quote responses.

## Before enabling automatic wallet payment

The current `spendWallet` handler loads and saves wallet lots in KV. It does not provide atomic compare-and-debit across concurrent requests; `createStayOrder` also creates a new random reference for every attempt. Do not connect automatic voice wallet deductions to this path. An interruption or repeated confirmation could create duplicate payments or conflicting balance writes.

A separate payment change must add authenticated quote-bound consent, a stable idempotency key per approved purchase, serialized/atomic debits against the canonical wallet ledger, recoverable order status and retry tests. Do not create a second wallet ledger. Distinguish paid/pending-property-confirmation from confirmed reservations. Cashfree remains the explicit checkout handoff until that server path is implemented and validated.

Validation: `node --test tests/voice-stay-concierge.test.mjs`, existing voice and commerce regressions, full tests and browser checks. Live charges are unnecessary for UI verification.
