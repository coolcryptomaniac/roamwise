# B2B desk and daily home feed

Added 10 Nov 2026. Two small systems that share one pull request.

## 1. B2B desk (`/staff/`, card "B2B desk")

For the B2B / partnerships person (today: Deepanshi). One card, four jobs.

| Job | What she does | What happens |
| --- | --- | --- |
| Deals | "New deal" after a call: name and city are enough | A row in `b2bDeals`, visible only to her and admins |
| MOU | "Send on WhatsApp" / "Copy signing link" / "Preview" / "Download PDF" | Builds the existing `/partner/mou/` link with the property schedule filled in. The partner signs on their phone |
| Signature | Nothing | `partner/mou/mou.js` posts to the Worker (`POST /b2b/mou-signed`), which marks the deal "MOU signed" with the server time. Fallback: paste the signed link the partner sends on WhatsApp |
| Packages | "Package quote": pick package, group size, vehicle | Price comes from `packages/catalog.mjs` (the same grid the public page uses). Send on WhatsApp or save as a deal |
| Payments | "Report a payment received" with the UTR | A `reported` row in `b2bTxns`. Only an admin can mark it `verified` |

### Who may do what (enforced in `firestore.rules`, tested in `tests/emulator/`)

- Staff with role `partnerships` or `bd` (primary `role`, or in the `roles` list) see the desk.
- Staff move a deal through `lead`, `pitched`, `mou_sent`, `lost` only.
- `mou_signed` is written only by the Worker (service account) when the partner presents the deal's 128-bit signing key. Staff cannot write the signature fields.
- `countersigned` and `live` are admin steps. "Make live in the app" adds the partner to `config/partners`.
- Staff can add a payment row only as themselves, on their own deal, with status `reported`, up to Rs 5,00,000. They cannot edit or delete it. Reported money is shown apart from verified money and never added to it.
- On verify, plan fees, setup fees and commission also go to `ledger` as revenue. Package money is collected on behalf of the stay, driver and guide, so it is not booked as revenue here.

### Bug fixed on the way

The old "Onboard a business" button on the staff desk wrote to `config/partners`, which is admin-write only. It failed with a permission error for every non-admin. Staff now add the business as a deal; the founder publishes it after countersigning.

### Not built here

- RoamWise's own signature. Countersigning stays with the founder (Zoho Sign / the pre-signed offer flow in `partner/mou/offers.js`).
- Taking money. The desk records payments; it does not create payment links.

## 2. Daily home feed (`GET /home/daily`)

- Daily cron (`refreshHomeDaily`) stores a small snapshot of `data/home-promo.json` and `data/conditions.json` in KV (one write a day).
- `GET /home/daily` builds today's feed by India date: the curated stays rotated so a different one leads each day, and up to three travel advisories that are in force today (official first). Advisory data older than 4 days is not shown.
- `js/ui/home-daily.js` reads it (1.5 s limit, cached per day on the device). `js/ui/home-promo.js` uses the order. If the Worker is down or slow the home page is exactly what it was before.
- The Worker selects and reorders only. It never writes copy, prices or alerts. To change what can appear, edit the two JSON files as before.

## Tests

`npm test` (tests/b2b-desk.test.js, tests/home-daily.test.js) and `npm run rules:test` (emulator).
