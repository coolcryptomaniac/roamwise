# Music store: paid downloads and film licences (built 3 Nov 2026, OFF until enabled)

Page: `/music/store/`. Backend: `worker/handlers/music-order.js`, rules in `worker/lib/music-core.js`, tracks in `worker/lib/music-catalogue.js`.

## What buyers get
- **Download** (MP3, personal listening): Rs 20 per track by default. Per-track price can be Rs 10 to Rs 20 (`pricePaise` 1000-2000 on a release in `music-catalogue.js`).
- **Licences** (non-exclusive, one track, one project): Creator Rs 1,000 · Indie film/video Rs 5,000 · Commercial/advertising Rs 25,000 · Feature film/series Rs 1,00,000. After payment the buyer sees a licence certificate (print or save as PDF) and can use `Check a licence` on the page to verify a number.
- Files come from private storage through a 15-minute signed link, at most 10 downloads per order. Licence buyers get the WAV when one is stored, otherwise the MP3.

## To go live (in this order)
1. Create a Cloudflare R2 bucket, uncomment the `[[r2_buckets]]` block in `worker/wrangler.toml` (binding `RW_BUCKET`), and upload audio as `tracks/<youtube-id>.mp3` (and `.wav`). The id is the `id` in `music/releases.json`. Tracks without an MP3 show "Coming soon" and cannot be bought. Free R2 tier is 10 GB.
2. Set Worker secret `MUSIC_LINK_SECRET` (32+ random characters). Never in chat or the repo.
3. In Firestore create `config/music`: `{ enabled: true, environment: "sandbox", cashfreeEnabled: true, upiEnabled: true }`. Use `sandbox` until a full test purchase works, then `live` together with Cashfree live.
4. Deploy `firestore.rules` (adds `musicOrders`, admin-read-only).
5. Cashfree sends payment webhooks per order to `/music/cashfree/webhook`; no dashboard change needed.

## Decisions I need from the founder before enabling live
- **Licence wording.** The terms in `music-core.js` are plain-language drafts. Have a lawyer review them, especially the AI-assisted-music disclosure, Content ID undertaking and liability cap.
- **GST.** Digital downloads and licences are taxable supplies. Prices here are shown as final and no GST line is added. Confirm registration and whether prices include tax before going live.
- **Rights.** The founder confirmed full copyright on every track, including Suno-made tracks created on paid plans. Keep each track's Suno plan evidence and export on file.
- **Direct UPI** is capped at Rs 25,000; the Rs 1,00,000 licence pays by Cashfree (card/netbanking). A UPI order is released only after someone sets the order `status` to `paid` in Firestore after matching the bank record.

## Not built yet
- Emailing the file or certificate (buyers keep the order page in their browser; losing it means asking support). Add via the existing mailer.
- Per-track album/track-level splits: each release in `releases.json` (single or album) is sold as one item.
- An admin screen for orders, refunds, and invoices.
- Exclusive and buy-out licences (by enquiry on WhatsApp for now).

## Tests
`tests/music-store.test.mjs` (core rules, handlers with fake R2/Firestore/Cashfree) and `tests/music-store-client.test.js` (the page). A test keeps `music-catalogue.js` in sync with `music/releases.json`; when you add a release, add it to both.
