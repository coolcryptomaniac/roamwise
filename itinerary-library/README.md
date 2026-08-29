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

## Intended decision rule

Use a cached preset when a user asks broadly, for example:

- "Plan Ladakh"
- "5 days in Goa"
- "Tawang itinerary"
- "Everest Base Camp itinerary"

Do **not** silently force a preset when the user gives meaningful constraints such as a specific month, exact budget, accessibility need, crowd-avoidance requirement, fixed hotel, unusual transport rule, permit-sensitive requirement, or custom style/tags. In that case, keep the existing live planner and optionally use the preset only as a scaffold.

`preset-loader.js` already implements this conservative rule.

## Integration

Add once near the existing premium itinerary scripts:

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

## Folder placement

Recommended repository path:

```
/itinerary-library/
  manifest.json
  preset-loader.js
  index.html
  assets/
  data/
  presets/
```

No database, Firestore, worker or API is needed to serve the cache. GitHub Pages / static hosting can serve it directly.

## Safety / freshness

These are fallback route designs, not live operational guarantees. Weather, road status, permits, park openings, border/frontier access, transport, pricing and availability must be refreshed when relevant. Expedition presets deliberately keep conservative durations instead of shortening high-altitude routes to an unsafe number of days.

## Local intelligence & sharing

The v1.1 cinematic runtime adds destination-specific photo hooks, lazy local/day maps, local food/movement/etiquette/visual context, and share mode attribution (`Made by RoamWise for <user>`). Normal viewing stays clean; personalized attribution is activated for share/print flows.
