# RoamWise Destination Knowledge Library — 16 November 2026

## Scope and status

- **Currently public:** source-reviewed travel articles under `/guides/`, discoverable through the new `/places/` hub. This is an index, **not 53,000 newly published guides**. It avoids duplicate canonicals for existing reviewed content.
- **Atlas identities:** `data/atlas/india-places.json` and `world-cities.json` give the geographic lookup layer, not proof that named attractions are open. The client has language aliases and live geocoding for long-tail places.
- **Daily background work:** `.github/workflows/destination-research.yml` creates exactly 50 candidate research briefs per UTC date, stored in a GitHub Actions artifact for 30 days, with zero paid API calls, no HTML, no public URLs, no search indexing and no commits.
- **Future independent guide publication:** the `knowledge/approved/*.json` renderer requires explicit human review/signoff, original route guidance, source records, and a claim-to-source link before creating an indexable HTML destination page.
- **AI use:** Ailon's `knowledge-bridge.js` loads only the lightweight *published* guide index and may return review-marked links for sightseeing questions. The existing itinerary-first route still wins for “10 days in Bengaluru”. No private booking, account or chat data enters this public index.

## Search and SEO policy

Google's current guidelines on people-first content, scaled content abuse and AI-authored content explicitly caution against generating thousands of unoriginal pages for ranking. Google says there is **no preferred word count**. For the RoamWise *editorial workflow*, not as an alleged Google rule:

- Original, specific route decisions and trade-offs matter more than length. A useful 450-word guide is better than 1,500 words of filler. Aim for roughly 600–1,800 words only when justified by the subject; temple micro-guides can be shorter.
- A unique practical question, **summary first**, named landmark facts with primary citations, decision matrix, at least three substantial sections, nearby routes grouped by sensible travel time (not straight-line kilometre math), a sample flexible day plan, responsible season/safety notes, accessibility caveats, source ledger and corrections link.
- Mobile-first pages: one H1, readable paragraphs/H2s, accessible tables and accordion days, visible date checked, responsive layout, internal links to already published relevant guides, canonical, description, Open Graph, appropriate `Article` and `BreadcrumbList` JSON-LD. Do **not** claim Google rich-result eligibility solely from adding markup.
- **Images:** only owned or properly licensed imagery with documented licence, creator, alt text, dimensions, and optimized WebP/AVIF variants; image credit and exact location should be visible. No invented image attribution or scraped product/OTA photos. If no rights-cleared image, present a clear text-first page instead of a fake photo.
- **Video/audio:** add only if user-useful, rights-cleared and captioned/transcribed, loaded lazily; never force autoplay or hundreds of assets per page.
- **Links/backlinks:** relevant internal breadcrumbs and citations; never buy backlinks, auto-comment across sites or manufacture guest-post networks. Editors can ask local partners to link naturally to an actually useful guide.
- **Language:** canonical English page with distinct Hindi/Kumaoni/Garhwali pages only after native-quality verification. Until then, the UI offers a one-click Hindi request to Ailon, not an indexed machine-translated clone. Use `hreflang` only for real alternate reviewed URLs.
- **Dates:** don't update `dateModified` or source checked dates unless the material content/facts have been re-reviewed.
- **Sitemap:** only canonical approved URLs. The current static sitemap includes `/places/`; when pages exceed 50,000 URLs or 50 MB uncompressed, create a sitemap index and smaller child sitemaps rather than emitting one illegal giant file.

## Source verification and update rules

Use a structured `knowledge/approved/<slug>.json` record after research and signoff:

- `slug`, `name`, `region`, `country`, `aliases`, `title`, `description`
- `sections: [{heading,text}]` with genuinely differentiated original advice
- `facts: [{text,sourceId}]` and `sources: [{id,label,url,supports,checkedAt}]`; claims must be individually supported, never just share a vaguely related root URL
- `decisions: [{goal,choice,caveat}]`, `days: [{title,plan}]`, optional rights-cleared `photo`
- `approval: {status:"approved",humanReviewed:true,reviewedBy:"<person>",reviewedAt:"YYYY-MM-DD",evidence:"<internal review reference>"}`

A script cannot sign its own review. Maintain statuses `candidate → researched → needs_review → approved → published`; pause or correct a guide immediately when a material source contradicts it.

Review intervals **by factual volatility**, not a blanket weekly AI re-write:
- 0–24 hours: live transport, safety alerts, weather, inventory, prices — no long-lived answer caching or presumed validity.
- 7–30 days: active seasonal permits, closures, public schedules.
- 90 days: tourism access or transport operator information with moderate change risk.
- 180–365 days: historical background, geography, evergreen contextual editorial analysis, and at publication if a material change occurs.

Never archive authenticated guest messages, checkout/order/payment records or supplier net rates inside the public destination corpus.

## Storage and costs

**Now:** GitHub Pages already hosts the site and existing approved articles. The new indexed guide list costs no Cloudflare database storage and the daily candidate job has no LLM token charges.

**Optional scale-out later (not provisioned here):**

1. D1: searchable structured place metadata, freshness, provenance, editorial approval, region relationships. Review `knowledge/schema/001_public_destination_d1.sql`; do not run against production yet.
2. R2 Standard: compressed versioned public guide bodies, original research evidence snapshots when legally permitted, licensed WebP/AVIF media. One body per approved guide is fine at 53k scale; use bundles where beneficial without sacrificing single-page retrieval.
3. KV: only bounded hot responses, popular approved lookup summaries and feature toggles with short TTL. Do not write 53,000 places into KV individually or use KV as the source of truth.
4. Firestore/Firebase Auth: retain existing user accounts, current real-time travel state, bookings and payment entitlements. **Do not migrate private account data to D1 during a public content project.**
5. Cached static public HTML on Cloudflare/GitHub Pages or an explicitly enabled Worker SSR route; Google needs actual crawlable HTML, canonical URLs and stable 200 status. Do not replace 53k pages with a client-only infinite-scroll list.

**Planning sizes, not measured disk usage:** 53,000 guides × ~8–20 KB compressed original data ≈ 0.42–1.06 GB; metadata, revisions and 1–2 appropriately optimized images per page can exceed 3–4 GB rapidly. Deduplicate shared region assets, avoid unnecessary generated multimedia and enforce a measured 3 GB content target with a 4 GB stop gate. Storage sizes do not predict generation, re-verification or traffic bills.

The Workers Paid plan currently includes D1 5 GB storage and 25 billion monthly rows read; R2 Standard's free tier is 10 GB-month with operation limits. Cloudflare Workers KV has separate read/write billing beyond included allowances. **No new D1, R2, Vectorize bindings, paid keys or usage flags are enabled by this PR.**

Official references:
- Google: https://developers.google.com/search/docs/essentials/spam-policies
- Google: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google: https://developers.google.com/search/docs/appearance/structured-data/article
- Sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Cloudflare D1: https://developers.cloudflare.com/d1/platform/pricing/
- Cloudflare R2: https://developers.cloudflare.com/r2/pricing/
- Cloudflare KV: https://developers.cloudflare.com/kv/platform/pricing/

## Usage and validation

- `node tools/build-destination-library.cjs` builds a human-reviewed guide collection and compact JSON for Ailon.
- `node tools/build-destination-library.cjs --check` verifies that currently generated outputs match the authoritative reviewed source files.
- `node tools/knowledge-candidates.cjs --date 2026-11-16 --count 50 --out /tmp/destination-queue.json` produces a deterministic research-only queue.
- GitHub Pages publish workflow runs the guide generator before `tools/build-dist.cjs`, so new approved guide pages are produced without committing thousands of generated duplicate files.
- Run tests and review the new hub, AI one-click behavior, mobile accessibility and source authenticity before accepting new approved guides.
