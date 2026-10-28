# Yoga × Stays introduction desk

`/yoga/match.html` extends, rather than replaces, `/yoga/` and its existing CRM application.

- Teacher: request another venue. Property: request a teacher. Owner-teacher: find venues, request guest teachers and offer their own property in one brief.
- Brief preparation is browser-local, without persistence or network submission. Email/WhatsApp drafts are opened only on the user's click; the user must send. Contact-sharing requires a further opt-in.
- Stay candidates come only from the existing signed, listing-ready public seed and exact town matching. These are enquiries, not yoga-ready or available inventory. No profile or ownership is verified by this page.
- A reviewed teacher registry is not connected. Host requests go to manual review; no synthetic teacher profiles, availability, prices or bookings are presented.
- `match-core.mjs` provides conservative matching gates for a future trusted registry: approved records, consent, separate owners, location, dates, capacity, agreed collaboration model and paid budget. Comfort requirements and yoga-space review cannot be filled by guesses. Do not accept approval flags from self-submitted profiles.
- Quiet setting, optional participation, privacy and nonjudgmental facilitation are preferences to confirm, not medical guarantees. No therapeutic promises, payment collection, commission changes or automatic contact.

Tests: `node --test tests/yoga-property-match.test.mjs` (includes jsdom form tests).
