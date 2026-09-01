# RoamWise Partner Marketplace — Canonical Runtime

`/partner/` now has one production enhancement runtime: `marketplace.js` + `marketplace.css`, layered only over the base `app.js` + `app.css` renderer.

Do not restore or load `marketplace-v2`, `marketplace-v3` or `marketplace-v4` assets. Their useful behavior has been consolidated into the canonical files and the old runtime assets were removed specifically to prevent duplicate capture listeners, MutationObservers, auth subscriptions and CSS overrides.

## Preserved production behavior

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

The owner flow keeps the verification attestations for listing authority, rate accuracy and walkthrough readiness, plus a public location/listing URL. Email must be verified before a real property application write. The public form explicitly warns against uploading Aadhaar, PAN, passport, card data or bank passwords.

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
app.css
marketplace.css
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
