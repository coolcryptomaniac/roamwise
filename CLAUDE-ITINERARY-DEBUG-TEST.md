# Claude Code task: validate RoamWise itinerary preset library v1.1

Target branch: `feature/itinerary-library-v1.1`

## Mission

Debug and validate the generated `/itinerary-library/` cache and its eventual integration with the existing RoamWise planner. Do not redesign the feature. Do not merge to `main` until the tests below pass.

## First: inspect, don't edit

1. Read `AI-ROLES-AND-HANDOFF.md`.
2. Read `itinerary-library/README.md` and `itinerary-library/CLAUDE-CODE-MERGE-NOTES.md` if present.
3. Inspect the existing premium itinerary implementation (`roamwise-premium-itinerary.js/.css`, planner handler, `#results`, Pro gating) before proposing integration.
4. Confirm the generated cache contains 48 destinations, 192 HTML files and 192 PDFs.

## Required tests

### Static/build
- `node --check` on relevant JavaScript files.
- Confirm every `manifest.json` HTML/PDF path exists.
- Confirm no preset contains broken relative references to `preset-runtime.js`, CSS, `destination-photos.js` or `icon-512.png`.
- Confirm the generator is deterministic: run it twice and verify no unexpected diff.
- GitHub's Jekyll/site CI passed on PR #63, but the external Cloudflare Workers build check reported failure. Determine the exact Cloudflare cause before recommending merge. Treat it as a deployment/asset/configuration investigation; do not modify auth, production Worker bindings or deployment configuration speculatively just to turn the check green.

### Matching/fallback
- Broad `Ladakh`, 6 days => preset hit.
- `Leh` alias => Ladakh preset hit.
- Unknown destination => `null` and existing live planner continues.
- Ladakh + exact month/budget/crowd/accessibility/fixed-hotel/special constraint => `null` unless the user explicitly selects ready-made mode.
- Everest Base Camp must never be compressed to an unsafe short itinerary by nearest-duration matching.

### Cinematic runtime
- Four theme buttons work.
- Shinobi route animation works with no external map dependency.
- Local photo hook uses existing `RW_PHOTOS_DATA` when a verified key exists and fails gracefully otherwise.
- Main and day maps load only on user action; map failure must not hide route/day content.
- Mobile widths 360/390/412px do not overflow horizontally.
- `prefers-reduced-motion` is respected.

### Sharing
- `?share=1&user=Test%20User` displays `Made by RoamWise for Test User`.
- Normal viewing does not show the fixed share stamp.
- Logo prefers repository `icon-512.png` and falls back to bundled mark.
- Printed/share-mode PDF contains attribution; static cached PDFs remain generic RoamWise assets.
- User-supplied display name is escaped/textContent-safe; no HTML injection.

### Existing-product regression
- Classic itinerary still renders exactly as before when presets are disabled/unmatched.
- Pro entitlement/payment/auth code is untouched.
- Existing navigation and planner controls still work.
- A preset failure cannot blank `#results` or prevent live generation.

## Integration recommendation

Only after tests pass, add the smallest integration patch:
1. load `itinerary-library/preset-loader.js`;
2. call `RW_PRESETS.find(...)` before an expensive broad-generation path;
3. render a returned hit and stop that generation path;
4. if no hit/error, continue the existing planner unchanged;
5. clearly label cached results as Ready-made/Preset versus Live/Personalized.

## What to report back

Post in the PR:
- exact test commands;
- PASS/FAIL table;
- screenshots or console output for any failure;
- files changed to fix failures;
- remaining risks;
- explicit `SAFE TO MERGE` or `DO NOT MERGE` recommendation.
