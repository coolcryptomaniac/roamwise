# RoamWise Partner Marketplace v2

This layer progressively enhances the existing `/partner/` application. The original four-role workflow remains intact; `marketplace-v2.js` and `marketplace-v2.css` add a production-facing marketplace and host studio without changing the root RoamWise planner.

## Customer booking flow

1. Search a destination and dates.
2. RoamWise verified rooms appear first.
3. `View & request` opens the richer booking sheet.
4. A real live booking requires Firebase Authentication.
5. The request is written to `roomBookings` with `status: requested` and `bookingVersion: marketplace-v2`.
6. The host confirms or declines from the existing Partner dashboard.
7. Payment preference is recorded, but RoamWise does not collect or store card data in this static frontend.

Supported payment preferences today:

- `pay_at_property`
- `upi_after_confirmation` when the host has deliberately published a UPI ID
- `secure_link_after_confirmation` when the host has configured a public hosted payment page

Do not add secret Razorpay/Stripe/provider keys to this folder. A future card checkout should use a private server endpoint that creates/verifies the payment and then updates the booking.

## Host onboarding / verification

The owner form now adds three explicit attestations plus an optional public location/listing URL. It deliberately does **not** collect Aadhaar/passport/bank-document images on the static site.

Partner documents can contain:

```js
verification: {
  ownerAttestation: true,
  rateAttestation: true,
  walkthroughConsent: true,
  publicLocationUrl: 'https://...',
  identity: 'pending',
  property: 'pending',
  payout: 'pending',
  overall: 'pending'
}
```

The existing admin approval remains authoritative for `status`, `verified`, badges and commission.

## Host Studio

Once an approved host opens the Partner dashboard, Host Studio can save:

- hero image URL
- gallery URLs
- amenities
- cancellation policy
- house rules
- guest welcome note
- optional public UPI ID
- optional public hosted payment link

Marketplace-safe public fields are synced into the host's room documents so travellers can see them without making the private partner document public.

## What is and is not live

Live now: authenticated booking requests, host confirm/decline, property verification state, room/rate management, host marketplace profile, pay-at-property preference, post-confirmation UPI/payment-link preference, direct-room-first search and external travel choices.

Not faked: instant card capture, escrow, automated refunds, bank payouts or real-time inventory locking. Those require a private payment/inventory service and should not be simulated in public JavaScript.

## Test

Use `/partner/?lab=1&mode=demo` for the existing four-role test lab. For live writes, use `/partner/?mode=live` with a test Firebase account and confirm the deployed Firestore rules are compatible with `OPTIONAL-FIRESTORE-RULES.txt`.
