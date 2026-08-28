# RoamWise Partner — drop-in folder

This folder is designed to replace the current `/partner/` folder in the RoamWise repository without requiring edits to `index.html`, `app.js`, `app.css`, `rw-config.js`, or a Worker.

## Upload

Copy **all files in this folder** into your repository's existing `partner/` directory:

- `partner/index.html`
- `partner/app.css`
- `partner/config.js`
- `partner/core.js`
- `partner/app.js`
- `partner/README.md`
- `partner/OPTIONAL-FIRESTORE-RULES.txt`
- `partner/TEST-CHECKLIST.md`

Then visit:

- Normal live portal: `https://roamwise.co.in/partner/`
- Full four-role test lab: `https://roamwise.co.in/partner/?lab=1&mode=demo`

On the production domain the normal `/partner/` URL defaults to live accounts. The dummy role simulator only appears when you deliberately open the lab URL.

GitHub Pages will serve `partner/index.html` automatically.

## Two workspaces

### Test everything
This is the default. It uses browser-local dummy data and lets you switch between:

1. Customer
2. Property owner
3. RoamWise partner
4. Admin / staff

The data is shared across those four roles in the same browser, so you can test the complete loop immediately.

Recommended flow:

1. Property owner → submit a new property.
2. Admin / staff → approve it.
3. RoamWise partner → select the newly approved property and add/edit a room.
4. Customer → search that destination and request the room.
5. RoamWise partner → confirm the request.
6. Customer → My trips shows `confirmed`.
7. Admin / staff → mark it completed.
8. Partner earnings now count the stay; pending/confirmed bookings do not count as earned commission.

### Use live accounts
This uses the same Firebase project and document shapes already used by the current RoamWise repository:

- `partners/{uid}`
- `partners/{uid}/rooms/{roomId}`
- `roomBookings/{bookingId}`
- `admins/{uid}`
- `staff/{uid}`
- `config/partnerMarketplace`

No second database is introduced.

## Travel choices

The public page never asks travellers to understand suppliers, APIs or referral systems. It simply shows RoamWise verified stays first and adds “More choices” where local RoamWise supply is thin.

In Admin / staff, you can paste **public partner/deep links** for Travelpayouts, Expedia, Trawex or BookingXML-style contracted feeds. The link may contain these placeholders:

- `{destination}`
- `{checkin}`
- `{checkout}`
- `{guests}`

Example:

`https://example.com/search?city={destination}&from={checkin}&to={checkout}`

### Important security rule

Do **not** paste secret API tokens into this static website. GitHub Pages files and public Firestore config can be inspected by visitors. This folder works immediately with public affiliate/white-label links. If a provider later requires a secret token for live inventory search or booking, put that token in a private server function and keep this frontend unchanged.

## Existing Firestore rules

The repository already contains `firestore-rules-ADD-partners.txt`. If your current live partner portal can sign up, save rooms and read bookings, the matching rules are likely already published and no rules change is needed.

If Live mode returns a permissions message, compare the Firebase Console rules with `OPTIONAL-FIRESTORE-RULES.txt`. **Do not replace your complete Firestore rules with that small file**; it is only the partner block to merge into the existing rules.

## What was deliberately fixed

- Commission is counted only for completed/checked-out stays.
- Partner cannot self-approve in the intended rules model.
- Direct RoamWise rooms are shown before outside choices.
- No secret provider credentials are exposed in public JS.
- The folder has no dependency on root RoamWise JS/CSS, so a future root refactor should not silently break the partner portal.
- Public copy avoids backend/database/API terminology.
