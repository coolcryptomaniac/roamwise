# RoamWise Stays & Host Studio

`/partner/` is the production marketplace for direct RoamWise stays and the host workspace.

- Live marketplace: `https://roamwise.co.in/partner/`
- Deliberate four-role test lab: `https://roamwise.co.in/partner/?lab=1&mode=demo`
- Canonical architecture and runtime contract: `MARKETPLACE.md`

## Runtime architecture

The page has one base renderer and one marketplace enhancement layer:

- `app.js` + `app.css` — base roles, search, rooms, bookings, admin and demo rendering.
- `marketplace.js` + `marketplace.css` — production trust checks, richer marketplace UX, Host Studio, booking guardrails and host operating summary.

Do not add back or load `marketplace-v2`, `marketplace-v3` or `marketplace-v4` assets. Those generations were consolidated because stacking them created duplicate click capture, DOM observers, auth subscriptions and competing CSS at runtime.

## Production experience

Normal visitors see three paths: **Find stays**, **List your place**, and **Host dashboard**. The Founder/Admin role is hidden unless the authenticated UID has an `admins/{uid}` record.

Direct rooms are not trusted merely because a public room document exists. The canonical marketplace requires the public projection `marketplaceApproved:true` and a matching `partnerUid` before a card remains in the verified-stay list. The canonical Firestore rules independently require the parent partner record's `verified == true` before protected room/booking operations.

## Host lifecycle

1. Create/sign into Firebase account.
2. Verify email.
3. Submit property and verification attestations.
4. Founder reviews owner/contact, rates/location and walkthrough readiness.
5. Approval writes `status:'active'` and boolean `verified:true`.
6. Existing/new rooms receive the public `marketplaceApproved:true` projection.
7. Host manages rooms, rates, booking requests, marketplace imagery/amenities and optional post-confirmation payment preferences.

The founder view detects old active partner records that still carry a legacy non-boolean verification value and offers an explicit repair/migration.

## Traveller booking lifecycle

1. Search dates and destination.
2. Only verified direct rooms survive canonical validation; external hotel choices can still appear when direct supply is thin.
3. Traveller signs in with a **verified email**.
4. The runtime re-reads the live room immediately before request creation.
5. Request is created in `roomBookings` with status `requested`.
6. Payment preference is snapshotted into the booking, but no payment action is shown while the request is pending.
7. Host confirms or declines using the existing Partner dashboard.
8. After confirmation, the traveller gets exactly the snapshotted instruction: pay at property, UPI, or an HTTPS hosted payment page.

RoamWise does not collect card numbers in this static frontend and does not pretend to provide escrow, automated refunds, bank settlement or real-time inventory locking.

## Data model

Existing collections remain the source of truth:

- `partners/{uid}`
- `partners/{uid}/rooms/{roomId}`
- `roomBookings/{bookingId}`
- `admins/{uid}`
- `staff/{uid}`
- `config/partnerMarketplace`

No second database is introduced.

## Security rules

Use the repository root `firestore.rules` as the canonical rules source. It is full-replace-only when publishing in Firebase Console. `OPTIONAL-FIRESTORE-RULES.txt` is a deprecated reference warning, not a deployable alternative.

Do **not** weaken the rules to make a UI path work.

## Public travel providers

Admin can still configure public/deep links for outside travel choices. Public URLs may use `{destination}`, `{checkin}`, `{checkout}` and `{guests}` placeholders. Secret provider/API/payment credentials must never be placed in this GitHub Pages folder or public Firestore config.
