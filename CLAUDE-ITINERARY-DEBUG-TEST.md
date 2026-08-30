# Claude Code task: validate RoamWise itinerary preset library + Cinematic Journey v2

Target branch: `feature/itinerary-library-v1.1`

## Mission

Debug and validate `/itinerary-library/` plus the new `roamwise-premium-itinerary.js/.css` v2 experience. Do not redesign the feature. Do not merge to `main` until the tests below pass.

## First: inspect, don't edit

1. Read `CLAUDE.md` and `AI-ROLES-AND-HANDOFF.md`.
2. Read `itinerary-library/README.md` and `itinerary-library/CLAUDE-CODE-MERGE-NOTES.md`.
3. Inspect the existing planner, `#results`, Pro gating and itinerary state before changing integration code.
4. Confirm the generated cache still contains 48 destinations, 192 HTML files and 192 PDFs.
5. Note: ChatGPT has already replaced the old Leaflet-dependent Cinematic engine with v2 on this branch. Verify it; do not revert to the old vertical renderer.

## Required tests

### Static/build
- `node --check roamwise-premium-itinerary.js`.
- Confirm `.github/workflows/cinematic-itinerary-v2-check.yml` passes.
- Confirm every `manifest.json` HTML/PDF path exists.
- Confirm no preset contains broken relative references to `preset-runtime.js`, CSS, `destination-photos.js` or `icon-512.png`.
- Confirm generator is deterministic: run it twice and verify no unexpected diff.
- Investigate any external Cloudflare build failure by reproducing the actual cause. Do not modify auth, production bindings or deployment configuration speculatively just to make a check green.

### Classic -> Cinematic activation (new v2 behavior)
- Before an itinerary exists there must be NO Cinematic selector cluttering the planner/search form.
- Generate a normal Classic itinerary. Only after a valid Classic result exists, a compact `Classic | Cinematic PRO` journey-view switch must appear immediately beside/above the result.
- Classic must remain selected by default.
- Selecting Cinematic must not hide Classic until the Classic itinerary has been successfully parsed.
- If parsing fails, Classic remains visible and usable.
- Switching back to Classic must restore the original `#results` unchanged.
- Non-Pro selection must open the existing Pro/payment path; do not alter entitlement/payment/auth code.

### Horizontal journey experience (new v2 behavior)
- Daily itinerary uses horizontal scroll-snap cards, not a vertical day stack.
- Test mouse/trackpad horizontal scroll, touch swipe, day chips, next/previous buttons and keyboard Left/Right.
- Current-day indicator updates correctly.
- Each card provides: Journey, Full details, Stay, Food, Budget and Day map.
- `Full details` must expose the real Classic source text inside the card; no information may be silently discarded because the summary is clamped.
- Internal detail scrolling must not make the whole document extremely tall.
- Route Story / Live Map / Elevation share one Journey Cockpit rather than stacking three full sections vertically.
- Field-console tools are also a horizontal rail.

### Live map (critical regression)
- v2 must NOT load Leaflet from `unpkg.com` or depend on external map JavaScript.
- Generate Ladakh/Leh and at least two other destinations.
- Open Journey Cockpit -> Live map. It should use the geocoded route and render the OpenStreetMap embed.
- Open a Day map. It should render a local OSM map around that day's route point.
- Test with one route point failing geocoding: other valid points should still produce a map.
- Test with all geocoding/network unavailable: animated schematic route and all itinerary text must still work.
- `Open full map` / day `Open` link should point to the resolved geography.
- Verify the animated shinobi follows the generated SVG route path (not a hard-coded unrelated CSS path).

### Matching/fallback
- Broad `Ladakh`, 6 days => preset hit once the preset loader is integrated.
- `Leh` alias => Ladakh preset hit.
- Unknown destination => `null` and existing live planner continues.
- Ladakh + exact month/budget/crowd/accessibility/fixed-hotel/special constraint => live planner unless user explicitly selects ready-made mode.
- Everest Base Camp must never be compressed to an unsafe short itinerary.

### Photos/local experience
- Hero uses existing `RW_PHOTOS_DATA` when a verified destination key exists.
- Day cards attempt route-place imagery first, destination imagery second, and degrade cleanly when neither exists.
- Confirm no second hardcoded image database is introduced.
- Confirm auto theme selection works for at least: Ladakh (Crimson Moon), Char Dham/Kedarnath (Scarlet Pilgrim), Tawang/Meghalaya (Eastern Frontier), EBC/major trek (Crimson Expedition).

### Responsive / animation
- Test 360, 390, 412, 768, 1024 and desktop widths.
- No page-wide horizontal overflow. Horizontal movement should be limited to intentional rails/carousels.
- A day card should nearly fill the mobile viewport while still hinting that another card exists.
- Hero should not consume an excessive vertical screen height.
- Sticky booking bar must not obscure the tab bar or important card content.
- `prefers-reduced-motion` must suppress nonessential animation.

### Sharing/presets
- `?share=1&user=Test%20User` displays `Made by RoamWise for Test User` on ready-made preset pages.
- Normal preset viewing does not show the fixed share stamp.
- Logo prefers repository `icon-512.png` and falls back cleanly.
- User display name remains HTML-injection safe.

### Existing-product regression
- Classic itinerary renders exactly as before when Cinematic is not selected.
- Pro entitlement/payment/auth code is untouched.
- Existing navigation, planner controls, Stay & do, Money, Near me and booking actions still work.
- A Cinematic/map/photo/weather failure cannot blank `#results` or prevent live generation.

## Integration recommendation

Only after the above tests pass, wire the ready-made cache with the smallest possible patch:
1. load `itinerary-library/preset-loader.js`;
2. call `RW_PRESETS.find(...)` before an expensive broad-generation path;
3. render a returned hit and stop that generation path;
4. if no hit/error, continue the existing planner unchanged;
5. clearly label Ready-made/Preset versus Live/Personalized results.

## What to report back on PR #63

Post:
- exact commands;
- PASS/FAIL table;
- screenshots at 390px mobile + desktop for Classic and Cinematic;
- screenshot of working main Live Map and one Day map;
- console/network errors for failures;
- files changed to fix evidenced defects;
- remaining risks;
- explicit `SAFE TO MERGE` or `DO NOT MERGE`.
