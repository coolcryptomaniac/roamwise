# RoamWise Partner Marketplace — Canonical Runtime

`/partner/` has one production enhancement runtime (`marketplace.js`) over the base `app.js` renderer, and one visual source of truth (`partner.css`).

Do not restore or load `marketplace-v2`, `marketplace-v3` or `marketplace-v4` assets. Their useful behavior has been consolidated into the canonical files and the old runtime assets were removed specifically to prevent duplicate capture listeners, MutationObservers, auth subscriptions and CSS overrides.

## Preserved production behavior

### Curated property identity

RoamWise verification and property character are deliberately separate. A room can be a verified direct listing without being a Signature, Premium, Live or Quiet property.

Admin review publishes public-safe property character through `partnerPublicProfiles/{uid}`. The public projection may contain only curated labels and short experience/host notes. Hosts cannot write this collection, so they cannot self-award trust or premium labels through their otherwise self-service room editor.

Current labels:

- **Experience** — at least one real host-arranged/bookable local experience.
- **Hosted** — owner/host presence is meaningfully part of the stay.
- **Local** — strong local ownership/community/food/culture connection.
- **Premium** — high service/design/operating standards verified in audit.
- **Signature** — invitation-only, RoamWise co-designed; requires Premium + Experience.
- **Live** — suitable for responsible music, workshops or small events.
- **Quiet** — nature, wellness, silence or digital-detox is a core strength.

These labels are descriptive rather than a universal ranking: a Quiet retreat should not be penalized for not being a Live venue.

### Trust and booking integrity

- A direct room must have `marketplaceApproved === true`, remain open, and have the expected `partnerUid`.
- The parent partner must remain approved/`verified:true` under the root `firestore.rules` contract.
- Real booking requests require Firebase Authentication and verified email; the runtime refreshes the user/token before a protected write.
- Room price, capacity, approval and public payment instructions are re-read from Firestore immediately before request creation.
- The selected public payment instruction is snapshotted into the booking.
- Pending requests never expose an actionable payment destination.
- Hosted payment pages must use HTTPS. RoamWise does not collect card numbers or secret gateway credentials in this static frontend.

### Host capabilities

The canonical Host Studio preserves the useful fields introduced in earlier marketplace iterations:

- hero image URL;
- gallery image URLs;
- amenities;
- cancellation policy;
- house rules;
- guest welcome note;
- optional public UPI ID;
- optional HTTPS hosted payment page.

Public-safe listing/payment fields are synchronized into room documents for traveller display. Approved rooms are synchronized to the current verified partner identity.

### Host operations UX

The host workspace includes a single Host Today summary for:

- new requests;
- confirmed stays;
- live rooms;
- open booking value;
- requests waiting more than 24 hours;
- recent reservation activity.

### Property onboarding

The owner flow keeps the verification attestations for listing authority, rate accuracy and walkthrough readiness, plus a public location/listing URL, signature experiences, cleanliness practice, public review route and best owner contact window. Email must be verified before a real property application write. The public form explicitly warns against uploading Aadhaar, PAN, passport, card data, bank passwords or gateway secrets.

Confirmed guests can use Cashfree only when the admin enables it and Worker health confirms gateway credentials plus server-side Firebase access. The Worker accepts a booking id rather than an amount, verifies the signed-in guest, re-reads the confirmed booking and active host, then checks Cashfree's server status before recording payment. Platform UPI is a manual fallback and never self-verifies.

Pause and deboarding are review requests, not destructive client actions. Booking and settlement history remains intact throughout the transition.

### Traveller UX

- valid future dates;
- checkout after check-in;
- 90-night ceiling for the lightweight direct request flow;
- plausible phone number;
- cancellation/no-prepayment acknowledgement;
- request → host response → pay/stay state clarity;
- verified direct stays first with external inventory only as an additional choice.

## Runtime contract

`partner/index.html` should load only:

```text
partner.css
config.js
core.js
app.js
marketplace.js
```

Firebase libraries remain external dependencies loaded before these application scripts.

## Security source of truth

The repository root `firestore.rules` is authoritative. Never weaken Firestore rules to accommodate a client-side flow.

The marketplace does not claim escrow, insurance, automatic refunds, PCI card processing, real-time inventory locking or government-ID KYC. Those require private backend services before they can be represented as production capabilities.

## Regression guard

`.github/workflows/partner-marketplace-check.yml` validates the canonical marketplace and its trust invariants.

`.github/workflows/runtime-asset-integrity.yml` scans HTML for duplicate or multi-generation JS/CSS references so future `foo.js` + `foo-vN.js` stacking fails CI.
