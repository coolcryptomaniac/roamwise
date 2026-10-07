# Partner live operations (Stay & do)

How a signed property goes live, and how it is kept healthy. Read this before touching `partner/app.js`, `js/booking/routes.js` or the listing files.

## Go-live checklist (per property)
1. Approve the property in the partner admin (status ACTIVE, MOU accepted).
2. Open **Details**. Check the WhatsApp number, Google Maps link and (optionally) booking policy.
3. Add photos: **Choose photos** (up to 4, compressed in the browser) then **Save photos**. Use **Ask owner for photos on WhatsApp** if none were shared.
4. Press **Owner agreed: go live on WhatsApp**. The listing appears with the same WhatsApp message as Milan Heights.

A listing with no working booking route is hidden everywhere. Signed partners book by WhatsApp or phone only; no OTA links.

## Photos
* Repo photos (`assets/property-photos/*`, listed in `partners-data.js`) always win. Add them with a normal commit.
* Admin uploads are stored as strict base64 webp/jpeg in `config/photo_<partnerId>_<n>` (public read, admin write via the existing `config/{doc}` rule), counted by `photoCount` on the live entry, and fetched lazily. At about 500 properties move them to object storage with a CDN (needs its own rules review).

## Pre-book and refund numbers
`js/booking/stay-quote.js` is pure arithmetic: advance, balance, refund by hours before check-in, and RoamWise's fee (7% Partner Free, 5% paid plan, charged to the property after a completed stay, never added to the guest). The guest pays the property directly, so the property makes any refund under the policy it published. Collecting an advance through a gateway or refunding it from RoamWise would be payment-behaviour work and needs the separate review in `AI-ROLES-AND-HANDOFF.md` rule 7.

## Automatic maintenance
`node tools/partner-health-check.js` reads the public listings and the site and reports what guests can see, what is hidden and why, missing photos, bad links and out-of-range policy values. It is read-only. A weekly scheduled task runs it every Monday morning (India time) and reports in plain words. It never changes data.
