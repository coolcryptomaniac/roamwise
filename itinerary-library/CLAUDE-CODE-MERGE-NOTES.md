# Claude Code merge notes

1. Copy this whole folder to `/itinerary-library/`.
2. Add `<script src="itinerary-library/preset-loader.js" defer></script>` after the current planner/premium scripts.
3. In the itinerary generation handler, call `RW_PRESETS.find(...)` before any expensive generation.
4. If a hit is returned, `RW_PRESETS.renderInto("#results", hit)` and stop. If null, leave the existing planner path unchanged.
5. Add a small **Ready-made / Live** label in the premium result UI so the user always knows which source produced the itinerary.
6. Do not replace the existing Classic result renderer or premium cinematic engine; this library is an additive cache.
7. Run the existing smoke tests plus: broad Ladakh -> preset; Ladakh + exact September/₹40k/Avoid crowds -> live planner; EBC -> no unsafe short preset; unknown destination -> live planner.
