# Cinematic Journey v2 — UX fix set

This change set replaces the first-generation vertical Cinematic renderer on `feature/itinerary-library-v1.1`.

## User-visible changes

- Cinematic is no longer offered before a trip exists. The `Classic | Cinematic PRO` switch appears only after a valid Classic itinerary has rendered.
- Classic is always the source of truth and is never hidden until Cinematic parsing succeeds.
- Daily itinerary is now a horizontal scroll-snap carousel with day chips, previous/next controls, swipe/trackpad support and keyboard arrows.
- Every day keeps the complete source content through a `Full details` tab with internal scrolling; summaries can stay compact without losing information.
- Route Story, Live Map and Elevation now occupy a single Journey Cockpit instead of three vertical sections.
- Field tools are a horizontal rail.
- Hero height and mobile card sizing are reduced to make the experience feel app-like rather than document-like.
- Day cards can use route-place photography from the existing `RW_PHOTOS_DATA`, falling back to destination imagery.
- Destination type automatically selects one of the established RoamWise cinematic visual families.

## Live-map fix

The old renderer dynamically loaded Leaflet JavaScript/CSS from `unpkg.com`. If the CDN, CSP, network or script load failed, the live map never appeared.

v2 removes that dependency. It:

1. geocodes route stops using the existing/Open-Meteo path;
2. keeps the animated SVG/shinobi route as the always-working base layer;
3. creates a direct OpenStreetMap embed for the main route when the Live Map tab is opened;
4. creates a local OpenStreetMap embed inside each Day Map tab;
5. preserves the itinerary even if geocoding or map networking fails.

No map failure may blank or replace Classic.

## Validation

`.github/workflows/cinematic-itinerary-v2-check.yml` verifies:

- JavaScript syntax with `node --check`;
- horizontal carousel hooks exist;
- direct OpenStreetMap embed exists;
- post-Classic launcher exists;
- Full details exists;
- actual global Pro boolean detection exists;
- reduced-motion CSS exists;
- old Leaflet/unpkg dependency is absent;
- fabricated fallback itinerary days are absent.

Claude Code should run the browser/mobile/regression checklist in `CLAUDE-ITINERARY-DEBUG-TEST.md` before merge.
