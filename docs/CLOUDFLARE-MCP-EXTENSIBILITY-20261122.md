# RoamWise Cloudflare MCP expansion and deployment runbook (22 Nov 2026)

## Verified production infrastructure
Production Worker: `roamwise-api`, host `https://roamwise-api.founder-f53.workers.dev`.
GitHub Actions job [44982182115](https://github.com/coolcryptomaniac/roamwise/actions/runs/44982182115), 22 Nov 2026: Wrangler dry-run, deploy and `/health` **succeeded**. Staging Cloudflare Pages job [44982182135](https://github.com/coolcryptomaniac/roamwise/actions/runs/44982182135) **succeeded**. GitHub Pages remains the public static site; Pages staging does NOT imply the main domain has been migrated.

An older proposed URL `https://api.roamwise.co.in/mcp` is **not confirmed** to have DNS, SSL or a Worker custom-domain route. Use the verified workers.dev deployment origin for initial private connector testing; promote the custom host only after its DNS/SSL records and permissioned bindings pass smoke checks.

## What was enabled
* `POST /mcp`: read-only public listing search/details, quote previews, publishing capability descriptions.
* `GET /v1/discovery/search`, `GET /v1/discovery/items/:id`, `GET /v1/discovery/openapi.json`, `GET /v1/discovery/capabilities`.
* Premium MCP Apps cards with RoamWise branding and a canonical-host link allowlist; fall back to structured JSON in clients without MCP Apps rendering.
* Curated **editorial** itineraries: Kumaon (six days), Ladakh (six days), Rishikesh and Mussoorie (four days). All are existing static `/itinerary-library/presets/.../signature.html` pages with existing PDFs and public sharing links. They are never a user's personal saved trip.
* Versioned capability manifest in `worker/lib/roamwise-mcp-capabilities.js` describes current features honestly, including disabled wallet and direct in-chat payment features.

## Adding records without redesigning the connector
Current catalog `worker/lib/roamwise-discovery-catalog.js` is intentionally a small reviewed **seed**, not a dynamic inventory database. Add only a profile or public itinerary with a working canonical URL, rights/consent, date reviewed, verified property relationship where applicable, and a suitable enquiry action. Do not import private CRM leads, unapproved creators, homeowner phone numbers, guest booking history, or owner's net prices.

Future adapters should be developed in separate modules:
1. `public-catalog-adapter`: approved public Firestore records -> versioned Cloudflare KV index or D1 query table. Keep owner/supplier private records in Firestore; index only explicit opt-in, public fields. Provide removal, expiry and rollback. Cloudflare KV is eventually consistent; it MUST NOT represent room inventory or payment state.
2. `experience-catalog-adapter`: seller-authorized experiences, tickets, retreats and wedding packages with per-item state: draft -> reviewed -> public -> enquiry -> separately verified bookable. Unconfirmed options stay enquiry-only.
3. `itinerary-share-adapter`: for **personal** routes, require authenticated owner opt-in and a revocable short-lived read-only token. Strip email, phone, home location, booking references, payment details and any private notes; enforce sharing scope and deletion. Never expose current local/offline private trip vault automatically.
4. `wallet-account-adapter`: separate OAuth-protected connector and individual-account authorization. Read balance only with consent; spend requires a verified checkout session, explicit user approval, idempotency and a private ledger. Not part of public MCP or public cache.
5. `checkout-adapter`: reuse current server-calculated Cashfree shop/stay quotes and webhook verification; distinguish payment received from supplier confirmation. A provider-authorized embedded checkout is a separate opt-in release with security review. Never take client/model-supplied totals.

Media: published photographs must be owned or licensed for **third-party assistant display**. Future approved media can use R2 + caching/CDN; do not create R2 or D1 resources by default. Natasha's third-party art-photo syndication remains withheld pending written permission.

## Easy release model
* Keep the **single** Cloudflare Worker entry point (`worker/worker.js`); mount features through narrowly scoped named-export handlers, never multiple `export default` Workers.
* Stable `/mcp` URL and schema versions. Extend via new tools/categories; avoid renaming existing tool names. Version MCP Apps UI resources when making breaking UI changes.
* Use GitHub PRs + CI for code review and tests, then merge `worker/**` changes to main. The pre-existing `deploy-worker.yml` automatically runs the Wrangler dry-run and Worker deployment.
* The upgraded deployment workflow now smoke-tests public discovery, seven expected MCP tools, safe itinerary display and privacy flags, and the MCP Apps HTML resource after upload. It **rolls back** if health or MCP smoke fails.
* Avoid changing `rw-config.js` global `backend:'firebase'` just to enable MCP. The Worker can serve third-party AI connectors while normal website login and bookings continue to use existing independent systems. Do not risk breaking site runtime by prematurely switching the whole app.

## Test commands
Use the GitHub Actions job logs after merge for independent live verification:
- `GET https://roamwise-api.founder-f53.workers.dev/health`
- `GET https://roamwise-api.founder-f53.workers.dev/v1/discovery/search?q=Almora&type=stay`
- `GET https://roamwise-api.founder-f53.workers.dev/v1/discovery/search?q=Kumaon&type=itinerary`
- `GET https://roamwise-api.founder-f53.workers.dev/v1/discovery/capabilities`
- `POST https://roamwise-api.founder-f53.workers.dev/mcp` with JSON-RPC `tools/list`, then the `search_roamwise`, `roamwise_capabilities`, and `resources/read` calls.

Monitor response times and Cloudflare costs. Do not claim a working ChatGPT/Claude public marketplace listing until both host connections have been tested and any applicable platform approval/merchant onboarding is complete.

## Operational boundaries
GitHub CI deploy confirmation does **not** verify production customer checkout, Cashfree settlement, booking stock, refunds, wallet balance, platform connector installation, photo rights, or API custom domain. Those are separate launch checks.
