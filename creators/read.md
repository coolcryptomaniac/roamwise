# RoamWise Creator Network

## URLs

- Public creator programme: `https://roamwise.co.in/creators/`
- Creator Studio: `https://roamwise.co.in/creators/dashboard.html`
- Founder/admin console: `https://roamwise.co.in/creators/admin.html`

The admin page is `noindex,nofollow` and still requires a Firebase account that has an `admins/{uid}` document. The UI check is convenience only; Firestore rules remain the authority.

## End-to-end workflow

1. Creator submits the public application. The record lands in `crm` with `seg:'creator'`, `tier:'applied'`, zero referral totals and no code.
2. Creator creates/signs into Creator Studio with the same email and saves profile/social links.
3. Founder opens `creators/admin.html`. Application and Studio account are matched by email.
4. Founder clicks **Activate creator**. One Firestore transaction:
   - creates/updates `creatorEarnings/{uid}` (admin-owned verified ledger),
   - creates/updates the creator entry in `config/referrers.list`,
   - marks the CRM application approved and records its code.
5. RoamWise already syncs `config/referrers` into the live referral system. The creator's `?ref=CODE` link is therefore recognised by the existing checkout/booking attribution path without another frontend registry.
6. Creator submits itineraries/Reels/videos/blogs in Studio. Raw submissions live in their existing `users/{uid}` creator data, but **review state is never trusted from that creator-editable record**. Admin review state is stored inside `creatorEarnings/{uid}.contentReviews`.
7. Approving the creator's first content item automatically moves `applied → partner` (30%). Five verified sales also auto-promote to Partner when the ledger is saved. 25 verified sales auto-promote to Featured; founder can also mark Featured for a dedicated feature/video.
8. Founder/finance reconciliation updates verified clicks, completed non-refunded sales and pending/approved/paid commission in the admin console. Creator Studio only reads those values.

## Trust boundaries

Creator-editable:
- display name
- niche / bio
- social links
- payout preference (UPI / bank transfer / discuss with RoamWise; **no bank or UPI account number is stored here**)
- submitted content URLs and descriptions

Admin-owned / creator read-only:
- activated referral code
- active/paused referral state
- commission rate and tier
- verified click/sale totals
- pending/approved/paid commission
- payout status
- content approval/rejection state

The creator web app contains **no write call to `creatorEarnings`**.

## Required Firestore rule

Creator Studio needs the `creatorEarnings/{uid}` block in `CREATOR-STUDIO-RULES-PATCH.txt` merged into the canonical `firestore.rules` and published in Firebase Console. This is the only new collection permission required by Studio v3.

The public application now also sends the exact fields the existing `/crm` creator-create rule already expects (`tier:'applied'`, `refSales:0`, `refRevenue:0`, `code:''`). The patch file includes an optional stricter `hasOnly(...)` version to prevent oversized extra fields.

## Why earnings are not calculated in the browser

A creator controls their browser and their own profile. Any client-side earnings counter can be changed in DevTools. RoamWise therefore treats claim/payment reconciliation as authoritative and exposes only an admin-written aggregate to Creator Studio. This is also why the referral code is activated by the founder instead of letting a creator invent a payout code.
