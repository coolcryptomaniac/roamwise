# RoamWise Atlas data
- `world-countries.json` — 252 countries/territories. Base facts from GeoNames (https://www.geonames.org, CC-BY 4.0) via the MIT `geonamescache` package; aliases and `top` destinations are RoamWise-curated. Rebuild: `python3 tools/atlas/build-world.py`.
- India atlas (states/districts/places) builds on `map/districts.json` + `map/places.json` (Uttarakhand base layer) — coming in phase 2.
