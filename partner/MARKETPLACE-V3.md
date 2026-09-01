# RoamWise Partner Marketplace v3

Marketplace v3 closes the trust and booking gaps left by the v2 progressive enhancement while keeping RoamWise's existing Firebase collections and static-hosting architecture.

## Production flow

**Traveller** → searches `/partner/` → only rooms with `marketplaceApproved: true` are presented as direct verified stays → signs in with a verified Firebase email → sends a `roomBookings` request → host confirms/declines → the payment instruction chosen at request time unlocks only after confirmation.

**Host** → creates a Firebase account → verifies email → submits property → founder reviews owner/contact, public location/rates and walkthrough readiness → approval writes `status:'active'` and **boolean `verified:true`** → host can publish/manage rooms and receive requests.

**Founder** → sees the admin role only when the signed-in UID has `admins/{uid}` → approves partners, migrates any legacy `verified:'signed'` records, and keeps marketplace commercial settings under admin control.

## Trust contract

The canonical root `firestore.rules` requires a partner document with `verified == true` before the host can write rooms and before a guest can create a booking. v2's admin flow wrote the string `verified:'signed'`, which looked approved in the UI but failed that rule. v3 intercepts production approval and writes the correct boolean.

Public partner documents remain private. Customer cards therefore trust a deliberately public room-level projection:

```js
{
  marketplaceApproved: true,
  partnerUid: '<verified partner uid>',
  partnerVerifiedAt: '<timestamp/ISO>',
  paymentPublic: {
    upiId: 'optional-public-upi',
    paymentLink: 'https://optional-hosted-checkout.example/'
  }
}
```

Only a host whose parent partner record is already `verified:true` can create/update room docs under the canonical rules. v3 refuses to show a direct room as verified unless `marketplaceApproved === true` and the public room's `partnerUid` matches the listing.

## Legacy migration

Founder/admin gets a repair panel when an active legacy partner still has a non-boolean verification value. Repair changes the partner to `verified:true` and projects `marketplaceApproved:true` onto existing rooms. This is intentionally explicit rather than silently treating old strings as equivalent to verification.

## Booking and payment state

Marketplace v3 does **not** claim to be an escrow or card processor. It supports:

- pay at property;
- UPI after host confirmation;
- a host-supplied **HTTPS** hosted payment page after confirmation.

The selected public payment instruction is copied into the booking at request creation as `paymentSnapshot`. The guest owns the create, while the host can later update only the allowed booking-state fields, so the host does not need to inject a different payment destination after the request was made.

Until `status === 'confirmed'` (or completed), the guest UI says not to prepay. Once confirmed, the guest sees the snapshotted UPI deep link, HTTPS payment page, or pay-at-property instruction.

No card number, CVV, private gateway key, bank password or API secret belongs in this frontend.

## Email verification

Property application submission and real direct-booking submission require `FirebaseUser.emailVerified === true`. The page can send/resend Firebase's verification email, but it never treats an unverified typed email as an identity proof.

## Production UX

Normal production visitors see three product paths only:

1. Find stays
2. List your place
3. Host dashboard

The founder/admin role is hidden unless the authenticated user has `admins/{uid}`. Demo/lab mode remains available through `?lab=1&mode=demo` for the four-role test workspace.

## Firestore rules

v3 is designed around the canonical root `firestore.rules`; it does **not** require widening partner permissions. Do not deploy the old optional partner snippet if it differs from the root rules. The root file is the source of truth and is full-replace-only when published to Firebase Console.

## Test checklist

- Partner approval writes `verified:true`, never the old verification string.
- Legacy active partner repair converts the old verification shape and syncs rooms.
- An unapproved/public room is removed from the verified direct-stay list.
- Approved host can add/edit rooms under canonical rules.
- Guest with verified email can request an approved room.
- Guest cannot request a room that loses `marketplaceApproved` between card render and submit.
- Confirmed UPI booking exposes only the snapshotted UPI instruction.
- Confirmed hosted-payment booking opens only a snapshotted HTTPS URL.
- Pending booking never exposes an actionable payment control.
- Admin role is hidden to ordinary production visitors.
