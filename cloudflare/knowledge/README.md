# RoamWise public destination knowledge: D1 + R2 rollout

Status: **schema and frontend fallback only**. No D1 database, R2 bucket, custom domain, API binding, paid usage, or migration has been created or activated. Keep GitHub Pages and Cloudflare Pages running separately until QA and Cashfree whitelisting are complete.

## Separation of responsibilities

- **R2** `roamwise-knowledge-media`: reviewed, rights-cleared destination pictures, property media (only with permission), short preview video, product artwork, finished itinerary files. Private backups or rights-restricted audio require private access controls.
- **D1** `roamwise-knowledge`: public destination names, alternate names, source-reviewed facts, FAQ answers, itinerary templates, rights metadata and public listing *references*. Migration: `migrations/0001_public_knowledge.sql`.
- **Workers KV**: bounded caching of public destination responses and feature flags. Invalidate on new reviewed versions. Never use for transactional booking or wallet state.
- **Firebase/Firestore**: remains the current source of truth for authenticated users, roles, entitlements, receipts, booking state and paid orders. Absolutely no silent move to D1.
- **Cloudflare Worker**: safe read-only destination catalog endpoint once bindings exist; may later add curated retrieval and optional Vectorize. Current frontend continues working without those services.

## First deployment (manual after review)

From `cloudflare/knowledge` (or project root, adjusting paths):

```bash
npx wrangler d1 create roamwise-knowledge
npx wrangler r2 bucket create roamwise-knowledge-media
```

Record the actual D1 database UUID. Add bindings to the **appropriate Worker**, not to the static frontend:

```toml
[[d1_databases]]
binding = "DEST_KB"
database_name = "roamwise-knowledge"
database_id = "<REAL_DATABASE_UUID>"

[[r2_buckets]]
binding = "DEST_MEDIA"
bucket_name = "roamwise-knowledge-media"
```

Apply the reviewed SQL using Wrangler's D1 migration workflow. **Never run remote migrations until a local SQLite run and backup review have passed.** Use `--local` to rehearse and `--remote` only with explicit deployment approval. See Cloudflare's official D1 migration documentation.

R2 buckets are private by default. When approved, put non-sensitive public images behind `assets.roamwise.co.in` (a Cloudflare-managed custom domain) with cache controls. Do not use `r2.dev` as a high-volume production media hostname. This cannot be configured until Cloudflare's domain/DNS stage is ready.

## Media object layout

- `media/destinations/<slug>/<sha256>.webp`
- `media/stays/<verified-listing-id>/<sha256>.webp`
- `media/shop/<sku>/<sha256>.webp`
- `media/video/<collection>/<sha256>.mp4`
- `media/itineraries/<approved-id>/<version>.pdf`
- `media/faq/<locale>/<approved-id>.json`

All media need owner/permission, attribution and license proof; caption and ALT text must describe what the picture actually shows. Do not populate destination scenery with property interiors or generic AI imagery described as genuine destination photography. The current local Almora and Manali images are **explicitly labelled property photos**.

## Ingestion contract

1. Start from the 49 existing `js/data/destinations.js` curated records and 6 Kumaon introduction cards; do not infer that any is a verified booking destination.
2. Resolve canonical geo IDs and aliases, enforce unique city-country key, reject ambiguities.
3. Add a factual claim with its original source URL, reviewed date, and freshness/expiry; preserve editorial vs official status.
4. For media, verify permission to redistribute and document provenance and hash; convert to WebP/AVIF with responsive sizes. Never scrape images and publish them without licensing.
5. Publish only `status='published'`, `rights_status IN ('owned','licensed','public-domain')` media and independently verified knowledge. Drafts remain invisible.
6. On a changed source, run deduplication and validation, log review state, then invalidate bounded KV keys. Do not let an AI model autonomously approve licensing, change supplier prices or overwrite booking states.
7. Distinguish **Plan trip** (knowledge-backed suggestion) from **Find stays** (availability enquiry) and **Pay** (trusted backend confirmed checkout).

## Frontend behavior

`js/ui/destination-filmstrip.js` starts with 6 curated Kumaon entries plus the existing destination dataset, appends 12 cards at a time, and uses only local owned/reviewed media or labelled gradients. It does not fetch Pollinations or produce speculative room prices. The optional `window.RW_DEST_MEDIA` map can point to first-party `/media/` assets or HTTPS `assets.roamwise.co.in/media/` after that hostname is live and approved.

This is an incremental catalog, **not** a complete Earth database or a production R2 deployment. Add progressive geo/FAQ/media quality checks and monitoring before broadening coverage.

## Quality gates

- Tests: `node --test tests/ailon-destination-context.test.cjs tests/ailon-discovery-ui.test.cjs`.
- Cloudflare Pages staging: verify no duplicate locations, both action buttons work, wedding rail appears by default, image placeholders are deliberate, older mobile theme still works.
- No Cashfree checkout on a new hostname until merchant approval and server-side settlement acceptance.
- Review traffic quotas and R2 storage/bucket access before enabling large video hosting.
