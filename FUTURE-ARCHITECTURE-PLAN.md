# Future Architecture Plan

This is a planning document, not a rewrite to execute now. It's meant to
give a clear-eyed, honest answer to "make RoamWise ready for TypeScript,
Next.js, Python, React, and latest architecture, plus move hosting to
Cloudflare Pages and Workers" — with the pieces that are genuinely
low-risk and actionable today separated from the pieces that are a real,
large undertaking. See `ARCHITECTURE.md` for the current module map this
plan builds on.

## 1. Cloudflare Pages migration (concrete, near-term, low-risk)

This is the most actionable item in this whole document, and it does
**not** require any of the `app.js`/`js/` restructuring work to change
first. RoamWise is already a 100%-static site — no server-side
rendering, no build step (`.github/workflows/static.yml` literally
uploads the entire repo root as-is to GitHub Pages). Cloudflare Pages
serves a static directory exactly the same way. This is a deploy-target
change only.

Steps:
1. In the Cloudflare dashboard, create a **new** Pages project connected
   to this GitHub repo. Important: this must be a distinct project from
   the existing "roamwise" **Workers** project referenced by
   `worker/wrangler.toml` (`name = "roamwise-api"`) — Pages and Workers
   are different product types in Cloudflare and should not be conflated
   or share a project name.
2. Build settings: **build command = none/empty**, **output directory =
   repo root** (wherever `index.html` lives — currently the repo root
   itself). There is nothing to compile.
3. Deploy once to a `*.pages.dev` preview URL and manually smoke-test the
   app there (the same Playwright-driven manual pass used for
   modularization PRs is a reasonable bar).
4. Cut the custom domain (`roamwise.co.in`, per the repo's `CNAME` file)
   over from GitHub Pages to Cloudflare Pages: add the domain in the
   Pages project, update DNS (Cloudflare will prompt for the exact CNAME/
   A record), and only then remove/disable the GitHub Pages custom-domain
   binding to avoid a window where both claim the domain.
5. Keep `.github/workflows/static.yml` (GitHub Pages) around, disabled
   but not deleted, for a rollback window — this migration is safely and
   quickly reversible by re-pointing DNS.

Nothing about `index.html`'s script tags, `app.js`, or any `js/` file
needs to change for this. It is purely a hosting-provider swap.

## 2. Cloudflare Workers (backend/API)

The repo already has a real, working — if currently disconnected —
Worker under `worker/` (295-line `worker.js`, single entry point per
Cloudflare's one-`main`-file constraint). Today it provides:
- `GET /health` — status + which optional secrets are configured
- `POST /ai` — proxies Groq chat completions so the API key never
  reaches the browser, with a per-IP-per-minute rate limiter built on
  the Cache API (no KV writes, so it stays inside the free tier)
- `GET /news` — cached travel-tech news feed (KV-backed, refreshed daily
  by cron)
- `GET /events` / `GET /events/refresh` — cached, Ticketmaster-sourced
  events (refreshed weekly by cron; refresh endpoint is token-protected)
- `GET /geo` — a cached Nominatim (OpenStreetMap) geocoding proxy, so the
  app's geocoding calls go through Cloudflare's edge cache instead of
  hitting Nominatim directly on every request
- `GET /leads` — an OpenStreetMap Overpass-based partner-property lead
  finder for a target town, explicitly built to hand a **human** a
  reviewable list rather than auto-contacting anyone (deliberately not
  built on scraping Google/Booking.com, which would violate their terms)

It is deliberately optional today: `rw-config.js` decides whether the app
talks to it at all, and the app works fully without it.

This is the natural seed for a real API layer if/when the app needs
server-side logic beyond what Firebase covers — secrets-protected
third-party API proxying (already partially done via `/ai` and `/geo`),
rate limiting (already has a pattern via the Cache-API limiter), or
webhook handling (the separate `payments/` service already does this for
payment webhooks — see `ARCHITECTURE.md`, that's a different Worker
service from `worker/`).

Before this becomes a working CI/CD pipeline, the known dashboard-side
misconfiguration needs fixing (this is documented context, not something
in scope to fix from this session): the "Workers Builds: roamwise" check
has been failing since the repo's first commit because (a) the dashboard
Root Directory isn't pointed at `worker/`, (b) the Cloudflare project is
named `roamwise` while `worker/wrangler.toml` declares
`name = "roamwise-api"`, and (c) the `wrangler.toml` KV namespace ID is
still the placeholder `PASTE_THE_ID_HERE`. All three need a real
Cloudflare account owner to fix in the dashboard/CLI — none of them are
fixable from a code change alone.

## 3. TypeScript

See the separate `TYPESCRIPT-MIGRATION.md` for the actual recommended
path (gradual JSDoc-based typing, file by file, no build step required)
— as of this writing that document doesn't exist yet in `main`;
TypeScript-readiness work is in progress on the `claude/typescript-readiness`
branch. This section is intentionally short so as not to duplicate it.

The one architectural point worth stating here: a **hard** switch to
real `.ts` files with a compiler step would only make sense if the
project also adopts a bundler (see §4) — without one, `.ts` files can't
be loaded by a browser via `<script src>` at all, so there'd be nothing
to point `index.html` at. JSDoc-based typing gets most of the editor/
type-checking benefit today without that dependency, which is why it's
the right near-term path on its own.

## 4. React / Next.js — the big one, be honest about scope and risk

This is **not** a small step. It means rewriting the UI rendering layer
— currently string-templated `innerHTML` plus inline `onclick=` handlers,
chosen specifically because it needs no build step and works identically
inside the Capacitor Android WebView — into React components with
props/state and a real build pipeline (Next.js or Vite+React). That is a
ground-up UI rewrite of a live app serving real, paying users. It is not
a refactor, and it should not be scheduled as if it were one.

If the user wants to pursue this eventually, the realistic, phased path
is:

**Phase A — adopt a bundler for new code only.** Vite is the natural
fit: fast, simple, works well for either a Next.js-style app or a plain
React SPA, and can coexist with Capacitor without disturbing anything.
In this phase, nothing in the existing `app.js`/`js/` codebase changes.
The bundler is introduced purely to build new, separate code.

**Phase B — one self-contained feature, end to end.** Pick ONE
already-modularized, self-contained feature and rebuild just that one as
a React component, mounted into the existing page alongside the legacy
code. Good candidates identified in this session's module map: the
Settings modal (`js/ui/settings-modal.js`, 237 lines) or the pricing
tiers UI (`js/pricing/tiers.js`, 160 lines) — both are already isolated,
single-purpose files from the modularization work, which is exactly what
makes them low-risk places to prove the pattern. The goal of this phase
is proving the React component genuinely works end-to-end, including
inside the Capacitor Android WebView (not just a desktop browser), before
committing to anything further.

**Phase C — incremental, one feature at a time.** Only after Phase B is
verified working, port additional features one at a time, using the same
proven, verified, tested methodology as this session's `app.js`
extraction work (grep every call site, verify no regressions, ship in
small reviewable increments). Never a single big-bang rewrite — the
`onclick=`-as-global-function architecture and the 287 call sites
identified in `ARCHITECTURE.md` mean a big-bang rewrite would have to
correctly replace all of them simultaneously with no partial-working
state, which is a much higher-risk way to do the same work.

**Next.js specifically** requires a decision up front: either **static
export** mode (compatible with the current GitHub Pages / Cloudflare
Pages static-hosting model — no server needed) or a **Node.js server**
(a materially bigger infrastructure change, incompatible with "just
serve static files," and would mean a different hosting model entirely,
e.g. Cloudflare Workers/Pages Functions or a dedicated Node host). If
Next.js is chosen over plain Vite+React, static export mode is the
recommended choice specifically to preserve the current low-cost, simple
static-hosting model this app already relies on.

## 5. Python

Checked honestly: Python exists in this repo today only as **offline
build/content-generation tooling**, not a live backend. Found scripts:
- `itinerary-library/scripts/build_presets.py`
- `tools/itinerary-library/build_presets.py`,
  `tools/itinerary-library/apply_v2_ui.py`,
  `tools/itinerary-library/enhance_v1_1.py`
- `scripts/apply-platform-rules-v16.py`, `scripts/apply-platform-rules-v17.py`

These generate/apply content (itinerary presets, platform rules) at
authoring time; none of them run as part of the deployed app or a live
request path. There is no genuine "Python backend" use case evidenced in
this repo today, and this document won't invent one. If a real need
shows up later — something Firebase and Cloudflare Workers genuinely
can't cover — the honest options at that point would be a separate
service (e.g. FastAPI on its own host) or Cloudflare's Python Workers
beta if it fits the same edge-deployment model as the existing
`worker/`. Until a concrete capability gap appears, adding a Python
backend would be solving a problem the app doesn't have.

## 7. Capacitor version/compatibility check

Checked directly against this repo's own manifests, not from memory:

- `package.json` pins `@capacitor/android`, `@capacitor/core`, and
  `@capacitor/cli` at `^6.1.0`, with `@capacitor/geolocation` at `^6.0.1`
  and `@capacitor/app` / `@capacitor/haptics` at `^6.0.0`. The one
  community plugin in use, `@capacitor-community/speech-recognition`, is
  pinned at `^6.0.0`. Every native dependency in the app is on the
  Capacitor **6.x** line — nothing is mixed across majors today, which is
  the easy part to get wrong and this repo doesn't have that problem.
- `capacitor.config.json` is a plain, unexceptional config: `webDir:
  "www"`, `androidScheme: "https"`, and a `Geolocation` permissions block.
  Nothing in it is major-version-specific or would need to change for an
  upgrade on its own.
- As of this document's writing, Capacitor 7 is the latest known stable
  major (released in early 2025, raising minimum Android/iOS OS-version
  floors and Node tooling requirements, per Capacitor's own release
  notes at the time). **Flag this honestly: this assistant's training
  data has a cutoff, and Capacitor's release cadence means an 8.x or
  later major may already exist by the time this is read.** Before
  acting on this section, check https://capacitorjs.com (or run `npm
  view @capacitor/core versions --json`) for the actual current latest
  major, rather than trusting this document's version number indefinitely.
- This document will not invent specific breaking-change line items
  between 6.x and whatever the actual latest major is — that list should
  come from Capacitor's own official upgrade guide (`capacitorjs.com/docs/updating`)
  at the time the upgrade is actually attempted, checked against the six
  plugins this app actually uses (listed above), not guessed at now.
- **Compatibility with the `app.js`/`js/` modularization work (§3 above,
  no-bundler/no-ES-modules, classic `<script>` tags, ~290 `onclick=`-driven
  globals): this is not blocked by a Capacitor upgrade, on this or any
  future major.** Capacitor's role is narrow and stable across its
  majors — it packages `webDir` (`www`) as static assets and serves them
  from a native WebView shell (`androidScheme: "https"` in the config
  above controls how those assets are addressed inside that WebView). It
  does not care whether the app inside that WebView uses a bundler, ES
  modules, or classic scripts; it has never required any of those. A
  future Capacitor major upgrade and the React/Next.js decision in §4 are
  fully independent choices — upgrading Capacitor does not force a
  rendering-layer rewrite, and adopting a bundler for new code (§4 Phase
  A) does not require a Capacitor upgrade first. Stated explicitly here so
  a future reader doesn't treat these as coupled when they aren't.
- Recommended near-term action: run `npx cap doctor` (bundled with
  `@capacitor/cli`, already a devDependency) to get a live, repo-specific
  compatibility report, then decide whether staying on 6.x a while longer
  or upgrading is worth the (likely small, six-plugin) effort. This is
  housekeeping, not a project.

## 8. FastAPI / Python backend — honest assessment

Re-confirming §5 above with the same finding, stated plainly for this
section's purpose: Python in this repo today is **only** offline build/
content-generation tooling —
`itinerary-library/scripts/build_presets.py` and the scripts under
`tools/itinerary-library/` (`build_presets.py`, `apply_v2_ui.py`,
`enhance_v1_1.py`) plus `scripts/apply-platform-rules-v16.py` /
`-v17.py`. None of these run as part of a deployed service or a live
request path today. There is no existing FastAPI usage, no ASGI app, and
no ambient ticket calling for one — this section is not describing
something in progress.

**When would FastAPI actually make sense here?** Only when a concrete
need appears that genuinely can't be met by what's already in place —
the Cloudflare Worker (§2, plain JS/the Workers runtime) or Firebase.
Realistic triggers, none of which currently exist in this app:
- Heavy, synchronous PDF rendering or document generation beyond what
  `roamwise-premium-itinerary.js` / `js/itinerary/pdf-export.js` already
  do client-side or via existing libraries — if that ever needed a
  server-side renderer too heavy for a Worker's CPU-time limits.
- Non-trivial data processing/ETL work that's awkward in JS but has a
  mature Python library with no good JS equivalent.
- A hard dependency on a Python-only ML/data library with no practical
  JS alternative (something narrower than "we want AI features" — the
  app already does that today by proxying Groq through the existing
  Worker's `/ai` endpoint, which needs no Python at all).

None of those apply today. This document deliberately does **not**
schedule FastAPI as a roadmap item with a target phase or date — doing
so would be inventing a need the app doesn't currently have. Treat it as
**available if a specific future need arises**, not as work to plan
toward.

**If it is ever pursued**, the realistic shape is:
- FastAPI would run as its own separate, independently deployed service
  — e.g. Fly.io, Railway, a small VPS, or similar — **not** on Cloudflare
  Workers. Workers' native JS/V8 runtime doesn't run arbitrary Python/ASGI
  apps like FastAPI. Cloudflare does offer a separate **Python Workers**
  beta (Python-via-Pyodide, running on the same Workers runtime) — worth
  knowing about, but it comes with real limitations (a curated/limited
  set of importable packages, cold-start and startup-time behavior
  different from V8-native JS Workers, and beta-status caveats) that make
  it a different tool from "run any FastAPI app," not a drop-in
  replacement for a real Python host. Anyone evaluating this path should
  verify current Python Workers capabilities directly against whatever
  the specific need turns out to be, rather than assuming parity with a
  normal FastAPI deployment.
- This would be a new deployed surface with its own hosting bill, uptime
  ownership, and secrets management — not free the way the existing
  static-hosting + Worker setup mostly is. That cost should be weighed
  against the concrete need that justified it in the first place.

## 9. Android Nearby Connections API / mesh networking — cross-repo, planning only

See the new, dedicated `MESH-NETWORK-PLAN.md` for the full spec. Summary
for this document's sequencing purposes: this is a **native Android**
feature (Google's Nearby Connections API), it does **not** belong in this
repo's `js/` codebase or `worker/` Worker, and real implementation work is
blocked on this session gaining access to the separate
`roamwiseapkaabbuild` repo. Nothing here changes anything in
`roamwise` today; this repo's job for now is limited to writing the spec
so that a future session with access to that repo can act on it.

## 10. Sequencing recommendation (revised)

In order of what to actually do first, given everything above, including
the three new tracks from §7-§9:

1. **Cloudflare Pages migration (§1).** Low-risk, immediately valuable,
   doesn't block or require anything else. Do this first.
2. **Capacitor version/compatibility check (§7).** Also low-risk
   housekeeping: run `npx cap doctor`, check capacitorjs.com for the
   actual current latest major (this document's Capacitor-7-as-latest
   note may already be stale by the time it's read), and decide whether
   an upgrade of the app's six native plugins is worth doing now. Doesn't
   block or depend on anything else in this list, including §4's
   React/Next.js decision (see §7's explicit note on why those are
   independent).
3. **Fix the existing Workers dashboard misconfiguration (§2).** Needs a
   human with Cloudflare account access (Root Directory, project name,
   real KV namespace ID) — not a code change, but worth doing once
   someone with dashboard access is available, so `worker/` becomes an
   actually-working CI/CD pipeline instead of a permanently-red check.
4. **Continue TypeScript JSDoc adoption, file by file (§3).** Ongoing,
   low-cost hygiene that doesn't require a decision on bundlers/React —
   keep doing it opportunistically as files get touched anyway.
5. **React/Next.js (§4) — treat as a deliberate, opt-in, staged decision
   for later.** Not blocking anything above. Only start Phase A once
   there's an explicit decision to invest in it, since Phases B and C
   are real engineering time against a live app, not a quick add-on.
6. **FastAPI (§8) stays parked, not scheduled.** No concrete need
   exists today. Revisit only if/when a specific requirement appears
   that Cloudflare Workers or Firebase genuinely can't cover.
7. **Nearby Connections / mesh networking (§9, full spec in
   `MESH-NETWORK-PLAN.md`) is blocked on `roamwiseapkaabbuild` repo
   access and lives in that other repo, not this one.** It does not
   block, and is not blocked by, anything else in this list — it's a
   separate, larger initiative tracked independently. Once repo access
   is granted, the phased outline in `MESH-NETWORK-PLAN.md` (spec →
   bare native Android proof-of-concept → Capacitor plugin bridge →
   integration with `js/social/tribe-beacon.js` and
   `js/itinerary/trip-vault.js`) is the recommended path — starting with
   a native-only prototype, not a full Capacitor integration on day one.

Nothing in this document should be read as a commitment to do #5 (React/
Next.js) or #6 (FastAPI) — they're here so that if/when the user decides
to pursue either, there's a realistic plan instead of an open-ended
rewrite or an invented requirement. #7 (mesh networking) is real,
wanted, cross-repo work — it's sequenced last here only because it can't
proceed at all from this repo until access to `roamwiseapkaabbuild` is
granted, not because it's low priority.
