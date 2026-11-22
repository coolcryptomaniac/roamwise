# Ailon Tusk world discovery, resilient media and safe R2 migration

Status: **feature branch / preview only — NOT deployed and NOT an R2 upload**.
Visual reference: founder-provided mobile screenshots of spacious original Ailon, four-image Explore & Book, black/white itinerary cards, cinematic/Netflix rails and the existing paid stay panels. No external artwork was copied from the screenshots.

## What this PR changes

- `js/ui/ailon-world-experience.js` renders a horizontally looping **bounded** 3-copy rail of up to 96 *distinct* records from the existing curated `DB` (not fabricated "all-Earth" listings). Active cards are non-booking discovery. Tap destination = choose **Plan with Ailon** (prefill; user must send) or **Find stays** (filters `/escapes/`; no availability promise).
- Adds an image-first four-category Explore & Book home gallery using *existing* card photos: Stays, Weddings, Packages and Shop. Weddings have their own filter instead of being buried under Teams & HR.
- Adds Ailon AI settings shortcut beside the hero. The button opens the existing real settings/provider/BYOK/on-device controls, not an untested model router. It never pays for an API or uploads keys.
- Adds black-and-white editorial, cinematic and card itinerary presentation skins to existing `.rw-tusk-itinerary` cards. Map view hands off to the existing map function; no fabricated stops.
- `js/copilot/core.js` stops substituting the previous destination when an explicit *new* place was named but could not yet be resolved. Weak names are not written as verified conversation context until geocoder confirmation.
- Pollinations is no longer called simply by viewing the optional custom-shirt preview. A user-initiated style selection requests artwork. A failed image shows a visible fallback, and the custom merch order flow rejects an artwork that never loaded.

## Existing knowledge is the foundation, not a second database

The repository already documents:
- `data/atlas/`: GeoNames / geonamescache derived identities; 252 countries/territories, ~34k worldwide cities, ~19k Indian places and administrative data (per the repository's own README). This is **not** 50k verified attraction pages.
- `js/data/destinations.js`: curated destination entries, known cost basis and seasonal notes — needs source review for changed prices/conditions.
- `itinerary-library/manifest.json` and presets: stored example itineraries, not confirmed schedules, services or availability.
- `js/data/atlas-resolver.js`, `js/copilot/itinerary-rescue.js`: place resolution and safe/verified generic planning fallback.
- `worker/data/tusk-facts.js` and approved human-reviewed guides: editorial answers; new facts require source, date and review.

**Do not** recreate user accounts, paid orders, room stock or Pro entitlements in D1. They remain in protected Firebase/Firestore + verified payment Worker. Do not index private user data in public Vectorize.

## R2 release stages (not done by this PR)

1. In Cloudflare Dashboard → R2 Object Storage create `roamwise-public-assets`. Check actual costs and free allowances before uploads. Use **private by default**; selectively publish only licensed assets.
2. Later, when Cloudflare DNS for the production domain is ready, use **R2 Custom Domain** `media.roamwise.co.in` (not the rate-limited public `r2.dev` endpoint) with Cloudflare Cache. Domain binding needs the Cloudflare zone active.
3. Use fixed, versioned keys, never a random Pollinations URL: `destinations/<slug>/v1/hero.webp`, `properties/<approved-id>/v1/room-1.webp`, `art/<approved-id>/v1/work-1.webp`, `shop/<sku>/v1/front.webp`, `itineraries/<id>/v1/plan.json`, `knowledge/v1/<approved-id>.json`. Store license, provenance, contributor permission, review date and source URL in the manifest before any public asset reference.
4. Upload only through the Cloudflare dashboard or a securely authenticated one-time Wrangler command. Example: `npx wrangler r2 object put roamwise-public-assets/destinations/almora/v1/hero.webp --file=./path/to/approved-hero.webp --content-type=image/webp` (requires a real approved image file). Do **not** paste R2 credentials into GitHub or browser JavaScript.
5. Add an entry under `data/ailon/media-manifest-v1.json` using the existing destination ID as key, e.g.:
   ```json
   {
     "version": 1,
     "assets": {
       "almora": {
         "approved": true,
         "src": "https://media.roamwise.co.in/destinations/almora/v1/hero.webp",
         "alt": "Approved photograph of Almora",
         "license": "REPLACE WITH VERIFIED LICENSE",
         "source": "REPLACE WITH SOURCE URL",
         "credit": "REPLACE WITH REQUIRED CREATOR CREDIT"
       }
     }
   }
   ```
   This is an example **only**; do not publish placeholder metadata. Today's checked-in manifest intentionally contains **zero** approved R2 assets.
6. Run `node tools/ailon/r2-catalog-staging.cjs` to create a SHA-256 review report for the *existing public* atlas and itinerary manifest. Review license, changed data, file sizes, attribution, and billing before selectively uploading any JSON. The script DOES NOT upload.
7. Maintain a small independent set of backup static icons, logos and essential UI assets in Firebase Hosting for `roamwise.tech`, so a Cloudflare outage doesn't also blank the backup site's imagery.
8. Keep paid bookings and personal histories off public R2. Worker KV is for small verified read cache and feature flags (not payments), D1 only if new public relational catalog requirements actually justify it. Optional Vectorize = approved public chunks only; Durable Objects later for genuinely collaborative group trips.

## Release gates and test plan

- [ ] Run `node --test tests/ailon-world-experience.test.cjs` with Node 22, and existing Tusk/checkout test suites.
- [ ] Inspect preview on 360/390/412px screens; no nav overlap, wedding category accessible, all cards have useful fallback, reduced-motion respected.
- [ ] Search *different places in sequence*, e.g. `3 days in Almora` → `4 days in Ushuaia` → `what about Funchal?`, plus `what about food there?` for genuine follow-ups. Ensure new cities never inherit previous named places.
- [ ] Verify first-click category shows matching existing cards (including paid wedding cards), correct prices unaffected, no automatic checkout.
- [ ] Check itinerary editorial/cinematic/cards/map modes with maps and multi-day plans. The visual switch must not edit quotes or bookings.
- [ ] Test Pollinations outage: no blank card, never submit a custom T-shirt with no loaded artwork. Real shop SKU checkout is unaffected.
- [ ] Test Google sign-in, Firebase persistence, Cashfree sandbox and merchant-approved origins separately; **no DNS cutover** until passing.
- [ ] Verify SEO/canonical URL, PWA caching, mobile Chrome, Android WebView (if the embedded app is updated).
- [ ] Existing design vault choices remain selectable (Himalayan Saanjh / Kasar Cloud / Buransh Bazaar). New visuals are additive; live data, rates, payments and SDKs are not rewritten.

## Performance and automation

Up to 96 curated destinations per rail cycle; three bounded copies mimic endless scrolling but are not infinite new destinations. Images lazy-load with a gradient/text fallback, with no API credits needed on passive scroll. For thousands of atlas places, use a paged/virtualized catalog view and selective source-reviewed photos instead of rendering 34k cards. Human-approved metadata, source dates and user-consented feedback are the correct first stage of "self-evolving"; autonomous model training or self-editing production copy is neither implemented nor implied.
