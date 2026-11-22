# Ailon Tusk Travel Atlas v1 — 22 November 2026

**Status:** review branch only; not deployed, not a live-booking system. This change is stacked on the database-first Ailon and Settings PR #847.

## What is actually included

- **124** India destination records, with stable IDs, region, attraction names, 3-day **editorial itinerary starters**, regional food suggestions, a provenance/reference URL and a photo reference.
- **18** destination profiles with source-backed overviews and concise facts: Almora, Kasar Devi, Binsar, Jageshwar, Kausani, Ranikhet, Nainital, Bhimtal, Mukteshwar, Champawat, Bhowali, Pithoragarh, Rishikesh, Mussoorie, Auli, Jaipur, Hampi and Rameswaram.
- **106** destination index leads awaiting individual source/fact review; these may be used as **suggestions only** and must not be advertised as verified guides, live itinerary bookings or product inventory.
- Named historical/cultural people only where an official source supports an association. First examples include Swami Vivekananda, Uday Shankar, Govind Ballabh Pant, Mahatma Gandhi, Sumitranandan Pant, Maharaja Sawai Jai Singh II, Krishnadevaraya and A. P. J. Abdul Kalam; never auto-infer a person's private contact details.
- **No photos embedded or downloaded** by this PR. Each record carries a photo *source-page reference*, descriptive alt-text placeholder and the explicit rights state `not-cleared`. Before showing an image, obtain the actual asset, file-specific license, photographer credit, original source and any required written commercial permission. Do **not** assume an official tourism website permits redistribution.
- No location-based ads, net supplier rates, travel booking claims, payment actions, automated fact publishing, personal information indexing or paid web-search switches.

## Data architecture

`worker/data/tusk-travel-atlas.js` is the small, versionable catalogue and source of truth for atlas IDs, food groups and editorial itinerary sketches. `worker/lib/tusk-atlas-answer.js` produces bounded, read-only travel records.

`GET /tusk/search?q=<public question>` now uses:
1. The existing independent PII/secret public-query guard and opt-in exact cache;
2. RoamWise atlas for itinerary, food, culture, photographs and people requests;
3. Existing curated permit/safety facts for normal factual questions and approved evergreen knowledge;
4. The atlas for a bare destination query, ahead of optional vector search;
5. Licensed live-search links only when configured for truly time-sensitive queries.

For a query about a current fare, date, weather, rate, open status or booking, the atlas can offer **background only** and says real-time verification is required. A trip is never confirmed by an atlas record.

The Ailon browser adapter forwards only short bounded fields. The compact mobile result contains 3-day draft, sourced facts, regional food chips, notable people if supported, official reference link, and the photo-rights disclaimer. Ailon's hosted-model path retrieves a **destination-only public query** (never the person's chat, booking history, contact details or itinerary) to add atlas context before inference. The prompt labels editorial content as such.

## Source and editorial policy

The source-backed first wave was assembled against Uttarakhand Tourism and Incredible India destination pages on 22 November 2026. For example:
- `https://uttarakhandtourism.gov.in/destination/almora`
- `https://www.incredibleindia.gov.in/en/uttarakhand/almora/kasar-devi-temple`
- `https://uttarakhandtourism.gov.in/destination/kausani`
- `https://uttarakhandtourism.gov.in/destination/jageshwar`
- `https://uttarakhandtourism.gov.in/destination/nainital`
- `https://uttarakhandtourism.gov.in/destination/bhimtal`
- `https://www.uttarakhandtourism.gov.in/destination/binsar`
- `https://www.uttarakhandtourism.gov.in/destination/ranikhet`
- `https://uttarakhandtourism.gov.in/search` (regional directory, **not proof** of a particular editorial lead's claims)
- `https://www.incredibleindia.gov.in/en` (national destination directory, **not individual record verification**)
- Media rights guidance: `https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia`

A reference-page URL proves **where to verify**, not that an image can be published or an editorial stop is correct. Keep `checkedAt=null` for editorial-only leads. Any source-backed change needs explicit source/date, stable ID and reviewer notes. Never import user chats, login/session information, historical private bookings, commission contracts, private property rates, or images without rights.

## Next source-approval wave

Review **25–50** more entries per batch, starting with Kumaon/Garhwal and commercially useful supply destinations. Use the existing source pages and original suppliers to confirm locality, attraction names, travel constraints, useful seasonal information and optional photo licensing. Add distinct food provenance (dish origin and dietary labels; no invented restaurant). Create deeper 1/2/3/5/7-day editorial plans only where route, drive time and access have been reviewed; don't inflate the 3-day starter into arbitrary durations.

Before claiming **1,000+ verified destinations**, provide each record's source identifiers, editorial approval, source freshness and rights status. Before expanding beyond Git-tracked small seed records, use R2 + controlled approval/indexing as described in `docs/TUSK-HYBRID-KNOWLEDGE-V1.md`; public traveller prompts must never become auto-approved factual documents.

## Validation and release gates

Run `node --test tests/tusk-travel-atlas.test.mjs tests/tusk-hybrid-knowledge.test.mjs tests/tusk-public-privacy.test.mjs` and full `npm test`, `npm run typecheck`, `npm run check`. Check queries such as:
- `3 day Almora itinerary`
- `Kasar Devi photos` (show reference, **not embedded unlicensed image**)
- `Kausani famous people and local food`
- `Cherrapunji itinerary` (editorial lead, not verified)
- `Gir National Park safari permits` (existing curated safety facts must win)
- `Almora hotel price today` (**no quote**)
- `My booking is AB123` (**never send to public search**)
- Hosted-model prompt with a destination and 7-day budget: keep user-specific context within authenticated AI path.

Test Android 360/390/412px and desktop, Voice, Hindi and Hinglish, focus, screen-reader labels, image-rights messaging, PWA cache, user-selected legacy designs and all commercial booking flows. Do not merge or deploy until CI and mobile smoke checks pass. No real payment or supplier inventory test is implied by this PR.
