# RoamWise Cloudflare knowledge + media: staged setup (November 2026)

**Status: preparation only.** This PR does not provision an R2 bucket, D1 database,
Workers, domain, secrets or live write access. Do not change DNS, Cashfree or Firebase
identity settings as part of media ingestion.

## Source of truth

Use the **existing** editorial source and approval model in `knowledge/README.md`.
`knowledge/schema/001_public_destination_d1.sql` is the canonical destination schema;
`knowledge/schema/002_public_media_faq_itinerary.sql` adds media, FAQ and itinerary
tables to it. Never maintain a second competing destination table.

- Public candidate destinations: current `js/data/destinations.js` (not proof
  of verified information, opening hours, pricing or room inventory).
- Verified published articles: `knowledge/approved/` plus reviewed `/guides/`
  and their source ledger; only signed-off content should become public AI answers.
- Images and other media: asset metadata with `rights_status`, attribution,
  license proof, content type, checksums and geography before publishing.
- Live listings, customer accounts, payment status and confirmed bookings:
  the existing Firebase/Firestore + authenticated RoamWise Worker architecture.
  **Do not move private user data into the public D1 knowledge database.**

## Prepare candidates and review assets (local, read-only)

```sh
node knowledge/tools/build-cloudflare-seeds.cjs /tmp/roamwise-knowledge-seeds
```

Produces `destinations.candidate.sql` (not published or indexed),
`media-rights-review.json` (all rights marked pending), and
`seed-report.json` with skipped / unmappable countries.

**This command does not upload media, insert rows or call any Cloudflare API.**
If a country ISO mapping is absent, the generator omits the row rather than
invent a code. Check all candidate facts before any public exposure.

## Optional founder provisioning (not done in this PR)

Only after reviewing the expected free/paid limits and confirming
Cloudflare account billing preferences:

1. Create a separate **D1** DB named `roamwise-knowledge-dev` via Cloudflare
   dashboard (Workers & Pages > D1). Keep separate from the existing payment Worker.
2. Inspect BOTH SQL files; execute 001 first and 002 second against the
   empty **development** D1 database. Follow Cloudflare's documented D1
   migrations process; do **not** point `wrangler d1 migrations apply` at the
   existing production Worker by mistake. Test migrations with a local SQLite
   database and a backup before applying remotely.
3. Create a private R2 bucket `roamwise-public-media-dev` via R2 Object Storage
   in the same account (or `npx wrangler r2 bucket create roamwise-public-media-dev`).
   R2 buckets are private by default. Public delivery should use a separately
   controlled domain or a media-only Worker with limited read permission.
4. Review licensing, credits and original files. Upload **only approved**
   optimized media to stable versioned keys such as `media/destinations/almora/2026-11/photo-01.webp`.
   Do not copy arbitrary OTA/stock photos, AI output, or invoices into a public bucket.
5. Populate `public_destination_media` with R2 key, exact rights evidence,
   alt text, attribution and status. Only `published` AND `owned/licensed/public-domain`
   entries can be rendered as public destination images.
6. Bind R2 (read-only) and D1 to an isolated **preview** Worker/Pages Function.
   Add a hard quota / cost budget and cache-control policy. Never bind the
   public media Worker to Cashfree secrets or authenticated customer databases.
7. Later: add a versioned approved JSON media index to Pages at
   `/media/destination-manifest.json` and load it as `window.RW_DEST_MEDIA`
   **before** `destination-filmstrip.js`. The frontend only accepts a
   first-party media URL or an explicitly approved `assets.roamwise.co.in`
   URL. If the image fails, it shows a branded fallback instead of a broken tile.
8. Publish region-by-region after checks, not 50,000 unreviewed SEO pages.
   Cache approved public guides with short freshness TTLs for changing data;
   keep live weather, safety and pricing outside a static guide.

## Non-payment smoke tests

```sh
node --test tests/ailon-destination-context.test.cjs tests/destination-filmstrip.test.cjs
```

Verify on `roamwise-web.pages.dev`: switch between distinct destinations;
voice/text interactions; preserved *explicit* follow-up context; opening all
category carousels including weddings; images falling back on weak connectivity;
Plan trip and Find stays actions; login and theme switching. Live Cashfree
checkout requires a separately approved merchant origin and end-to-end testing.

## Cloudflare documentation

- [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [D1 Wrangler commands](https://developers.cloudflare.com/d1/wrangler-commands/)
- [R2 create a bucket](https://developers.cloudflare.com/r2/buckets/create-buckets/)
- [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [Pages R2/D1 bindings](https://developers.cloudflare.com/pages/functions/bindings/)

Keep the main domain and the separately hosted backup untouched until the
staging site passes authentication, non-payment functionality and approved
checkout testing. Two websites existing at once is not automatic failover.
