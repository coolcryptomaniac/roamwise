# Claude Code merge notes

1. Copy this whole folder to `/itinerary-library/`.
2. Add `<script src="itinerary-library/preset-loader.js" defer></script>` after the current planner/premium scripts.
3. In the itinerary generation handler, call `RW_PRESETS.find(...)` before any expensive generation.
4. If a hit is returned, `RW_PRESETS.renderInto("#results", hit)` and stop. If null, leave the existing planner path unchanged.
5. Add a small **Ready-made / Live** label in the premium result UI so the user always knows which source produced the itinerary.
6. Do not replace the existing Classic result renderer or premium cinematic engine; this library is an additive cache.
7. Run the existing smoke tests plus: broad Ladakh -> preset; Ladakh + exact September/₹40k/Avoid crowds -> live planner; EBC -> no unsafe short preset; unknown destination -> live planner.


## SOCIAL + LOCAL MEDIA (v1.1)
1. Keep repo-root `destination-photos.js` loaded in the app as it is today. Preset HTML can also load it directly when opened standalone inside the deployed repo.
2. When rendering a preset for a logged-in user, pass the display name: `RW_PRESETS.renderInto(target, hit, { user: displayName })`.
3. For a share action use `RW_PRESETS.shareUrl(hit, displayName, selectedTheme)`. This adds `share=1` and displays `Made by RoamWise for <name>`.
4. Do not replace the animated schematic route; the live local-map iframe is deliberately lazy and network-dependent.
5. Do not hardcode a second photo database. `RW_PHOTOS_DATA` remains the source of truth for destination photos.
