# RoamWise Creator Network

## URLs

- Public creator programme: `https://roamwise.co.in/creators/`
- Creator Studio: `https://roamwise.co.in/creators/dashboard.html`
- Founder/admin console: `https://roamwise.co.in/creators/admin.html`

The admin page is `noindex,nofollow` and requires a Firebase account with an `admins/{uid}` document. Firestore rules remain the authority.

## End-to-end workflow

1. Creator submits the public application. The CRM record is always `tier:'applied'`, zero referral totals and no code.
2. Creator creates/signs into Creator Studio with the same email and **verifies that email through Firebase Auth**.
3. After verification, Studio writes `creatorAccounts/{uid}`. Its Firestore rule requires the document email to equal `request.auth.token.email` and requires `request.auth.token.email_verified == true`. This identity record is deliberately separate from creator-editable profile fields.
4. Creator saves profile/social links and submits travel content in their own `users/{uid}` record.
5. Founder opens `creators/admin.html`. An application is matched only to a verified `creatorAccounts` identity with the same email; an editable profile email is never trusted for activation.
6. Founder clicks **Activate creator**. One Firestore transaction:
   - creates/updates `creatorEarnings/{uid}` (admin-owned verified ledger),
   - creates/updates the creator entry in `config/referrers.list`,
   - marks the matched CRM application approved and records its code/uid.
7. RoamWise already syncs `config/referrers` into the live referral system. `?ref=CODE` therefore works with the existing checkout/booking attribution path instead of a second client-only registry.
8. Raw creator submissions remain creator-editable, but **review state is never trusted from them**. Admin review state is stored in `creatorEarnings/{uid}.contentReviews`.
9. First approved content can move `applied → partner` (30%). Five verified sales also promote Applied → Partner. 25 verified sales promote → Featured; founder can also mark Featured for a dedicated feature/video.
10. Founder reconciliation updates verified clicks, completed non-refunded sales and pending/approved/paid commission. Creator Studio only reads those values.

## Trust boundaries

Creator-editable:
- display name, niche, bio
- Instagram / YouTube / TikTok / website links
- payout preference only (UPI / bank transfer / discuss with RoamWise; **no account number is stored here**)
- submitted content URLs and descriptions

Firebase-verified identity:
- `creatorAccounts/{uid}.uid`
- verified email bound to the auth token

Admin-owned / creator read-only:
- activated referral code and active/paused state
- commission rate and tier
- verified click/sale totals
- pending/approved/paid commission and payout status
- content approval/rejection state

The creator web app contains **no write call to `creatorEarnings`**.

## Required Firestore rules

`CREATOR-STUDIO-RULES-PATCH.txt` contains the two new required collection blocks:

- `creatorAccounts/{uid}` — creator self-write only when Firebase token email is verified and exactly matches the document.
- `creatorEarnings/{uid}` — creator self-read, admin-only writes; finance can read reconciled totals.

Merge those blocks into the canonical full-replace `firestore.rules` and publish the complete rules file in Firebase Console. Until published, profile/content/application features degrade safely but referral activation remains blocked.

The public application sends the exact fields the existing `/crm` creator-create rule expects (`tier:'applied'`, `refSales:0`, `refRevenue:0`, `code:''`). The patch also contains an optional stricter `hasOnly(...)` CRM condition.

## Why earnings are not calculated in the browser

A creator controls their browser and editable profile. Client-side earnings can be changed in DevTools, so RoamWise treats verified revenue reconciliation as authoritative and exposes only the admin-written aggregate to Creator Studio. The same principle is why payout/referral activation requires a Firebase-verified identity plus founder approval.
