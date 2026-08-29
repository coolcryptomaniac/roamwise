# RoamWise Preset Itinerary Library v1.1.0

This folder is a pre-generated fallback cache for the RoamWise cinematic itinerary engine.

## What is included

- **48 important destinations / expeditions**
- **4 ready-made trip depths per destination**: Essential, Signature, Deep Dive, Expedition
- **192 HTML files + 192 PDF files**
- Four cinematic theme families: `crimson-moon`, `scarlet-pilgrim`, `eastern-frontier`, `crimson-expedition`
- `manifest.json` with aliases, durations and file paths
- `preset-loader.js` for zero-API matching and instant loading
- `index.html` to browse every preset
- `data/destinations.json` source catalog
- `data/local-intelligence.json` destination-specific food, movement, etiquette and visual context
- `DESTINATION-CATALOG.md` human-readable route/duration inventory

## Intended decision rule

Use a cached preset when a user asks broadly, for example:

- "Plan Ladakh"
- "5 days in Goa"
- "Tawang itinerary"
- "Everest Base Camp itinerary"

Do **not** silently force a preset when the user gives meaningful constraints such as a specific month, exact budget, accessibility need, crowd-avoidance requirement, fixed hotel, unusual transport rule, permit-sensitive requirement, or custom style/tags. In that case, keep the existing live planner and optionally use the preset only as a scaffold.

`preset-loader.js` implements this conservative rule.

## Integration

Add once near the existing premium itinerary scripts only after the Claude/local regression checklist passes:

```html
<script src="itinerary-library/preset-loader.js" defer></script>
```

Before a broad live-generation call, ask the library for a hit:

```js
const hit = await window.RW_PRESETS?.find({
  destination: document.querySelector('#destInput')?.value,
  duration: Number(document.querySelector('#dur')?.value || 0),
  month: document.querySelector('#month')?.value,
  style: document.querySelector('#style')?.value,
  crowd: document.querySelector('#crowd')?.value,
  budgetExact: document.querySelector('#budgetExact')?.value,
  tags: window.currentPlannerTags || []
});

if (hit) {
  window.RW_PRESETS.renderInto('#results', hit);
  return; // skip expensive generation for this broad request
}
```

For an explicit user action such as "Load ready-made itinerary", call with `forcePreset:true`.

```js
const hit = await RW_PRESETS.find({ destination:'Ladakh', duration:6, forcePreset:true });
RW_PRESETS.renderInto('#results', hit);
```

Each HTML also supports a theme override:

```
presets/ladakh/signature.html?theme=eastern-frontier
```

## Local cinematic intelligence

- HTML presets reuse the existing repo-level `destination-photos.js` / `window.RW_PHOTOS_DATA` when a destination or stop has a verified match. No second photo service is required.
- The first matched image becomes the cinematic hero; up to five matches become a Local Frames gallery. If none load, the original cinematic gradient remains intact.
- Every destination has a local food, movement, etiquette/context and visual-signature profile in `data/local-intelligence.json`.
- The schematic animated shinobi route remains offline-safe. A real local map is loaded lazily only when the traveller opens it, including per-day local maps.
- Journey-style motifs (coastal, sacred, heritage, high-altitude, trek, safari, etc.) layer on top of the four cinematic themes.

## Social attribution

Use `RW_PRESETS.shareUrl(hit, userName, theme)` or append `?share=1&user=Name` to a preset HTML URL. Share mode displays the RoamWise brand mark and `Made by RoamWise for Name`. The normal reading view stays unwatermarked. Print/Save-PDF from that personalized share view also carries the stamp. Static pre-generated PDFs cannot contain a future user's name; they contain generic RoamWise branding plus the destination's local-intelligence page.

## Folder placement

```
/itinerary-library/
  manifest.json
  preset-loader.js
  index.html
  DESTINATION-CATALOG.md
  assets/
  data/
  presets/
```

No database, Firestore, worker or API is needed to serve the cache. GitHub Pages / static hosting can serve it directly.

## Deterministic generation

The source generator lives in `/tools/itinerary-library/`. The workflow `.github/workflows/build-itinerary-library.yml` regenerates the full static cache and verifies exactly 48 destinations, 192 HTML presets and 192 PDFs before committing generated output to the integration branch.

Do not hand-edit hundreds of generated preset files. Fix the source data/runtime/generator and regenerate instead.

## AI handoff and testing

Read repository-root `AI-ROLES-AND-HANDOFF.md` for the ChatGPT/Claude division of responsibility. Claude Code should use `CLAUDE-ITINERARY-DEBUG-TEST.md` for repo-local, browser/mobile and regression validation before this feature is connected to the live planner.

## Safety / freshness

These are fallback route designs, not live operational guarantees. Weather, road status, permits, park openings, border/frontier access, transport, pricing and availability must be refreshed when relevant. Expedition presets deliberately keep conservative durations instead of shortening high-altitude routes to an unsafe number of days.
