# Cloudflare knowledge setup for RoamWise

**Status:** schema and staging preparation only. No D1 database, R2 bucket, upload, domain or binding is provisioned or activated.

The canonical knowledge instructions are at:
[knowledge/CLOUDFLARE-KNOWLEDGE-SETUP.md](../../knowledge/CLOUDFLARE-KNOWLEDGE-SETUP.md)

The repository already had a mature and reviewed public-destination model; **do not create a competing `destinations` schema**.

Use these two SQL files **in order**, only after local rehearsal and approval:

1. [001_public_destination_d1.sql](../../knowledge/schema/001_public_destination_d1.sql) — canonical editorial destination, source, and revision schema.
2. [002_public_media_faq_itinerary.sql](../../knowledge/schema/002_public_media_faq_itinerary.sql) — rights-controlled R2 media metadata, FAQ and itinerary extensions.

For offline reviewable draft destination seeds and local asset rights check:

```sh
node knowledge/tools/build-cloudflare-seeds.cjs /tmp/roamwise-knowledge-seeds
```

This generates 49 destination **candidates**, not 49 new reviewed guides, images,
reservations or public D1 entries. All media rights remain pending until
explicitly reviewed. It does not upload or change any external service.

**Keep existing Firebase/Firestore authentication, orders, Cashfree payment
and real-time booking data unchanged.** Also keep GitHub Pages and Cloudflare
Pages separate until preview QA passes. No automatic failover is configured.


## Read-only D1 + rights-approved R2 reader (proposed deployment)

New module: `approved-reader.mjs`. It is a separate, public-read-only Worker
that has **no** Firebase admin binding, Cashfree credentials, purchase API or
private user data. It only reads approved editorial records and licensed public
media from the *existing* canonical D1 tables.

Endpoints (not live until this isolated Worker is explicitly provisioned):
- `GET /v1/search?q=almora`: up to 12 human-approved, indexed, non-expired public destinations; never returns hotel availability or prices.
- `GET /v1/destinations/almora`: approved source-backed summary, published FAQs and approved itineraries, with false live-price/availability flags.
- `GET /v1/media-manifest`: first cleared photo per published destination, only if the approved media custom domain and R2 binding exist.
- `GET /media/<approved-image-id>`: read R2 objects by editorial media ID only, never by arbitrary object key; limit to approved image MIME types and recorded assets ≤ 4 MiB.
- `GET /health`: binding status only, with no secrets.

The client loads `/media/destination-manifest-v1.json` from its own website
and rejects unapproved media URLs or rights status. This manifest starts
**empty** intentionally: no media has been deemed legally approved for upload
merely because its file exists in the repository. Once D1/R2 is provisioned
and the assets are reviewed, an editor can export the separate Worker's
`/v1/media-manifest`, review it, and explicitly update the versioned
static manifest. Do not automatically publish candidate images.

### Safest initial setup

1. Confirm R2 billing/limits and permissions in Cloudflare before creating a
   bucket; this PR does **not** create anything billable.
2. Create empty `roamwise-knowledge-dev` D1 and private
   `roamwise-public-media-dev` R2 under the correct Cloudflare account.
3. Make a temporary local copy of `wrangler.example.toml` named
   `wrangler.toml`. Replace the D1 UUID. Do not write auth keys to the file.
4. In a **local development environment**, rehearse the existing two
   schemas (001 then 002) using D1's local execution commands and a temporary
   database. Confirm full schema, foreign keys and source ledger.
5. Deploy the **separate preview Worker only after verifying its account and
   bindings**, then test `/health`, an unapproved destination (404), a
   reviewed destination, and denied media (404). Test from mobile Chrome.
6. Ensure DNS / TLS and an allowed host origin are configured before using
   the approved `assets.roamwise.co.in` public media domain. Until then, the
   generated manifest is empty and the frontend uses local fallback.
7. Verify photo ownership, property/subject permission, license terms,
   attribution, size, checksum and exact geography for every asset.
   Only then upload optimized WebP/AVIF, mark metadata published and export
   the approved manifest into the website preview.
8. Require Cloudflare Pages preview checks and human approval before
   transferring to `roamwise.co.in`. Keep the existing Cashfree API Worker and
   site failover configuration unchanged.

### Test without Cloudflare writes

```sh
node --check cloudflare/knowledge/approved-reader.mjs
node --test tests/approved-knowledge-reader.test.mjs tests/destination-media-approved.test.js
node --test tests/ailon-destination-context.test.cjs tests/destination-filmstrip.test.cjs
```

This does not yet implement full global R2 upload/ingestion, runtime D1
binding or customer payment. Those depend on explicit provisioning and rights
review. Never put an R2 S3 secret or a Cloudflare API token in client code,
public manifests, the Git repository or a chat screenshot.
