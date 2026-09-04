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

## 6. Sequencing recommendation

In order of what to actually do first, given everything above:

1. **Cloudflare Pages migration (§1).** Low-risk, immediately valuable,
   doesn't block or require anything else. Do this first.
2. **Fix the existing Workers dashboard misconfiguration (§2).** Needs a
   human with Cloudflare account access (Root Directory, project name,
   real KV namespace ID) — not a code change, but worth doing once
   someone with dashboard access is available, so `worker/` becomes an
   actually-working CI/CD pipeline instead of a permanently-red check.
3. **Continue TypeScript JSDoc adoption, file by file (§3).** Ongoing,
   low-cost hygiene that doesn't require a decision on bundlers/React —
   keep doing it opportunistically as files get touched anyway.
4. **React/Next.js (§4) — treat as a deliberate, opt-in, staged decision
   for later.** Not blocking anything above. Only start Phase A once
   there's an explicit decision to invest in it, since Phases B and C
   are real engineering time against a live app, not a quick add-on.

Nothing in this document should be read as a commitment to do #4 — it's
here so that if/when the user decides to pursue it, there's a realistic
plan instead of an open-ended rewrite.
