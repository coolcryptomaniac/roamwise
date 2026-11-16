# Ailon itinerary-first recovery and destination knowledge plan — 16 Nov 2026

## Root cause, reproduced from Android screenshots
- `10 days in Bengaluru` and `10 days plan almora` correctly imply itinerary intent but the old active-AI failure branch called `rwTuskSearchFailure` -> `rwMiniSearch` with the entire sentence. Wikipedia found unrelated train films and people, not a 10-day plan.
- The old `cpSmartAnswer` short destination summary displayed `visa.days === 0` in a way that seemed to describe a 0-day trip. This is unrelated to trip duration.
- Latin-only smalltalk detection mistakenly treated Hindi-only voice transcripts as greetings.

## Released approach
1. `js/copilot/itinerary-rescue.js` intercepts explicit duration + verified destination early in `rwTuskPreAnswer`; works with the same typed and voice `copilotSend` pathway, even if all hosted LLM providers are unavailable. Never invoke generic Wikipedia search for a recognized itinerary.
2. Reuse `cpParseRegex`, conversation context, existing curated DB, `RW_INDIA_LANG`, loaded `RW_ATLAS` when present and the geocoder for unknown places. Do **not** accept unconfirmed geocoder namesakes without clarification. Known official-grounded itineraries for Almora, Bengaluru and Rishikesh include 10 specific days and links to district/India tourism source pages. Other places get a transparently generic template with only actual saved RoamWise gem names; no invented places.
3. Display a progress status in the same bubble while place and existing optional `RW_PRESETS` metadata load, with a 6.5-second fallback rather than an indefinite blank spinner. The 3 local fully reviewed plans answer immediately. No background computation after leaving the website is promised or scheduled.
4. The pre-existing separate trip planner and its 48 multi-region itinerary-library presets are still accessible. Presets with a different duration are explicitly shown as different examples; never call an 8-day regional package a custom 10-day city plan.
5. Keep bookings and prices on authenticated/payment Worker endpoints; do not infer live availability from geography sources.

## Knowledge coverage — important correction
A complete, verified, permanently correct database of **every tourist place in India and every place worldwide** is not feasible or accurate. The repository **already includes** `data/atlas` (approximately 19,000 Indian towns/places, 34,000 world cities, 252 countries, 36 states/UTs and hundreds of districts, according to its current atlas metadata), `js/data/destinations.js` curated cities, `js/data/place-overrides.js` namesake protection, and 48 itinerary-library destination groups. These are place **identity/coordinate indices**, not complete, verified tourist itineraries or current commercial inventory.

Recommended architecture for adding broad reliable content **without surprising cost**:

| Layer | Data | Source of truth | Cache and lifetime |
| --- | --- | --- | --- |
| Immutable/versioned anchor | Historical dates, landmark and city geography, heritage | Original official government/primary reference and source URL | Git/approved R2 with versions, annual re-review; never silently overwrite |
| Changeable reference | Airport codes, transport networks, climate norms, park boundaries | Dated approved records | KV exact keys only after enablement; TTL 1–90 days depending on type |
| Live travel facts | Prices, visa/permit rules, weather, hours, roads, flight schedules, tourist access | Original source/provider checked when needed | No long-lived answer cache |
| Personal | Trip history, addresses, account/bookings, order payments | Signed-in protected Worker and Firestore | Never in public index or embedding engine |

The optional `TUSK_EXACT_KV_ENABLED`, `TUSK_VECTOR_SEARCH_ENABLED`, R2 and licensed search flags remain **off by default**. Git/static atlas files and HTTP/edge caching already work without making 53,000 KV writes or indexing unreviewed content. A geocoder can handle long-tail destinations on demand. Only human-approved, source-linked public place records should later be indexed, deduplicated and tested in 50–200-record batches. Record `checkedAt`, `validUntil`, `sourceUrl`, language, region/place ID, license and version; reject personal and supplier-sensitive data. Avoid copying Google snippets or third-party article text into permanent storage.

## Next validation steps
- Unit and site CI must pass. Test `10 days in Bengaluru`, `10 days plan Almora`, `10 days in Rishikesh`, Hindi/Hinglish, international city and refund/status negative queries.
- On real Android Chrome and the voice interface, try these phrases with hosted AI allowance exhausted. Check that the first result is the 10-day route, not random Wikipedia hits, that no "0 days" appears as trip duration, and that the loading state eventually resolves.
- Compare a live-source answer and its official citations; source links are not proof of same-day availability.
- Later consider an approved-cache ingestion/import job with rate limits and cost budgets, but do not enable unreviewed ingestion or paid embedding services as part of this fix.
