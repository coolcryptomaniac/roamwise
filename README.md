# RoamWise

RoamWise is an AI travel planner: a single-page web app (Pro tier, itinerary
generation, booking links, group trips, gamified travel tracking) with an
Android wrapper via Capacitor. It's deployed today as a static site on
GitHub Pages, backed by Firebase (Auth + Firestore) for accounts, Pro
entitlement, and cross-device sync.

## Architecture, in short

- **Vanilla JavaScript + HTML/CSS. No bundler, no ES modules.** Every script
  loads via a classic `<script src="...">` tag in `index.html`, in a
  specific, load-bearing dependency order — this is required because a large
  number of function names are invoked via inline `onclick="..."` HTML
  attributes (including markup generated dynamically at runtime), so each one
  must remain a real, synchronously-available `window`-reachable global.
- The codebase is mid-migration from one large `app.js` file into small,
  single-purpose modules under `js/{core,data,pricing,audio,voice,booking,
  social,copilot,itinerary,ui,runtime}/*.js`.
- Backend: Firebase (Auth + Firestore). A Cloudflare Worker under `worker/`
  exists as an optional, currently-disconnected backend add-on (AI proxy,
  cached news/events, geocoding) — the app works fully without it.
- No build step for the web app: GitHub Actions (`.github/workflows/static.yml`)
  uploads the repo root straight to GitHub Pages on every push to `main`.

For the full, ground-truthed module map and load order, see
[`ARCHITECTURE.md`](./ARCHITECTURE.md). For a directory of every doc in this
repo and whether it's still trustworthy, see [`DOCS-INDEX.md`](./DOCS-INDEX.md)
— read that before opening any other `.md` file here.

## Running it locally

This is a static site — there's no dev server or build step required to view
it. From the repo root:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/index.html
```

Any static file server works equally well (e.g. `npx serve`). Firebase-backed
features (sign-in, Pro entitlement, sync) need a configured Firebase project
to function; without one the app still loads and most non-account features
work.

## Useful scripts

```bash
npm test         # node --test tests/*.test.js
npm run check    # syntax checks + line-limit lint + typecheck
npm run lint     # eslint over js/ and app.js
npm run typecheck  # tsc --noEmit (JSDoc-based type checking, no build step)
npm run mod-status # verify ARCHITECTURE.md's headline numbers against the live repo
```

## Android build

RoamWise ships an Android build via Capacitor. See `BUILD-STEPS.md` (build
from a computer) or `HOW-TO-BUILD-ON-PHONE.md` (build from a phone, no
computer needed).

## Contributing / AI sessions

If you're an AI agent working in this repo, `CLAUDE.md` is the binding
working contract — read it first, then `DOCS-INDEX.md` for which other docs
are relevant to your task.
