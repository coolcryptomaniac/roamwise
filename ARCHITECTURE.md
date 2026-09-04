# RoamWise Architecture

This is the current, ground-truthed source of truth for how the RoamWise
codebase is put together. It exists so a future AI agent or human
contributor can understand the project in one read instead of re-deriving
it via expensive repo-wide greps every session. Every number and file
path below was verified against the repo at commit `caff09c` on `main`
(2026-09-04) — re-run the commands in each section's footnote if you
suspect drift.

## Overview

RoamWise is a vanilla JavaScript + HTML/CSS single-page web app, wrapped
for Android distribution via Capacitor, and deployed today as a plain
static file tree on GitHub Pages (`.github/workflows/static.yml` uploads
the entire repo root, no build step). The backend is Firebase (Auth +
Firestore) for user accounts, Pro entitlement, and cross-device key sync.
There is **no bundler and no ES module system** — every script is loaded
via a classic `<script src="...">` tag in `index.html`, in a specific,
load-bearing order (see below). A real but currently-disconnected
Cloudflare Worker exists under `worker/` as an optional, non-breaking
backend add-on (AI proxy, cached news/events, geocoding proxy) — the app
works fully without it.

## Module map

As of this commit, `app.js` is **6,657 lines** (down from ~19,300 at the
start of the modularization effort) and there are **56 files** under
`js/`, organized into 15 subdirectories. Draft PR #112 (open, not yet
merged — auth/Firestore-key-sync/payments relocation, requires the repo
owner's direct review per `AI-ROLES-AND-HANDOFF.md` rule 7) would bring
`app.js` to 6,075 lines and add `js/payments/checkout.js` and
`js/data-sync/key-sync.js`. Check `git log` / open PRs before trusting
these two numbers if this doc is stale.

### `js/core/` — shared low-level utilities (4 files)
- `dom-utils.js` — DOM helper functions
- `error-guard.js` — global `window.onerror`/error-boundary wiring
- `storage-utils.js` — `localStorage` read/write helpers
- `text-utils.js` — string/text formatting helpers

### `js/data/` — static reference data + lookup helpers (3 files)
- `destinations.js` (596 lines) — destination database
- `iata.js` — airport/IATA code lookup
- `regions.js` — region/country grouping data

### `js/data-sync/` — cross-device data portability (1 file)
- `rwdata.js` — `RWData`, the backend-portability abstraction layer

### `js/pricing/` (1 file)
- `tiers.js` — pricing tier definitions

### `js/audio/` (3 files)
- `cues.js` — manifest-driven one-shot sound cues
- `focus.js` — single-audible-owner arbitration across cues/music/speech/video
- `reminders.js` — local trip-countdown notification scheduling

### `js/voice/` (2 files)
- `tusk-speak.js` — TTS output (native bridge in-app, Web Speech on web)
- `voice-input.js` — speech-to-text input handling

### `js/booking/` (4 files)
- `actions.js` — on-trip action hub
- `affiliate-links.js` — central affiliate/deep-link builder
- `form.js` (287 lines) — booking form + pay flow
- `local-rides.js` — local rides + stranded-traveler flows

### `js/social/` (7 files)
- `coordkit.js` — group coordination + shared-money layer
- `group-chat.js` (562 lines) — secure trip group chat core
- `group-chat-social.js` (476 lines) — reactions/presence layer on top of group chat
- `group-compromise.js` — group decision/compromise engine
- `group-state.js` — shared group-chat state
- `tribe-beacon.js` — tribe/beacon/trip-squad discovery
- `trip-board.js` (557 lines) — shared trip planning board

### `js/copilot/` — "Tusk" AI travel assistant (5 files)
- `core.js` (931 lines — over the soft target, flagged by `check-line-limits.js`) — chat core, parser, intent memory, world resolver
- `rich-reply.js` (555 lines) — rich reply rendering system
- `tusk-persona.js` — persona/voice definition
- `tusk-knowledge.js` — knowledge + learning layer
- `answer-cards.js` — structured answer-card rendering

### `js/itinerary/` — trip building and itinerary features (11 files)
- `build.js` — `buildItin`, the itinerary construction engine
- `certificates.js` (624 lines) — downloadable Atlas Certificate HTML
- `journey-log.js` (457 lines) — mood-tagged journal entries
- `map-view.js` (333 lines) — Leaflet-based live world map
- `meters.js` — pollution + happiness meters
- `ninja-hacks.js` — deterministic per-destination cheap/luxury hack suggestions
- `pdf-export.js` (742 lines — over the soft target) — premium PDF itinerary export
- `place-disambiguation.js` — resolves ambiguous place names
- `shadow-budget.js` — models a trip's shadow/hidden budget
- `share.js` — generic multi-platform share sheet
- `trip-vault.js` — offline saved-trips vault (localStorage)

### `js/ui/` — cross-cutting UI chrome (7 files)
- `adaptive-shell.js` (401 lines) — adaptive app shell
- `card-painter.js` — card rendering
- `onboarding.js` — first-run onboarding flow
- `settings-modal.js` — settings modal (candidate for the React proof-of-concept, see `FUTURE-ARCHITECTURE-PLAN.md`)
- `site-search.js` — in-app search
- `status-tier.js` — Pro/tier status display
- `themes.js` — theme switching

### `js/game/` — gamification (2 files)
- `badges.js` (277 lines) — badge progression system
- `realms.js` (429 lines) — "Realms of Roam" / Journey Passport game system

### `js/misc/` — miscellaneous feature groups (4 files)
- `eco-safety.js` (472 lines) — eco/safety travel features
- `misc-features.js` (392 lines), `misc-features-2.js` (370 lines), `misc-features-3.js` (566 lines — over the soft target) — three sequentially-numbered grab-bag feature files from the same extraction phase

### `js/runtime/` (1 file)
- `freshness.js` — keeps an installed PWA updated to the newest deployed code while preserving offline fallback

### `js/boot/` (1 file)
- `init.js` (380 lines) — boot sequence: push notification setup, PWA install prompt, status bar, back-button handling, DOMContentLoaded wiring

### Root-level scripts (not under `js/`, still classic globals)
`rw-config.js`, `events-data.js`, `referral-data.js`, `partners-data.js`,
`booking-data.js`, `affiliate-config.js`, `rooms-data.js`,
`experiences-data.js`, `badges-data.js`, `compat-data.js`,
`finance-data.js`, `regions-data.js`, `tusk-learned.js`,
`destination-photos.js`, `tusk-data.js`, `app.js`,
`roamwise-premium-itinerary.js`, plus `itinerary-library/preset-loader.js`
(the merged cinematic itinerary preset library, ex-PR #63) and the
`platform-v5/` directory (cinematic opening/animation modules:
`atlas-shinobi.js`, `audio-only.js`, `cinematic-map-v51.js`,
`crowd-dodge.js`, `learning-consent.js`, `performance.js`).

### `worker/` — optional Cloudflare Worker (not loaded by the app by default)
`worker.js` (295 lines, single entry point) implements `/health`, `/ai`
(Groq proxy), `/news`, `/events`, `/events/refresh`, `/geo` (Nominatim
proxy), and `/leads` (OpenStreetMap-based partner lead finder), plus a
daily cron (`wrangler.toml`). See `FUTURE-ARCHITECTURE-PLAN.md` for its
role in the Cloudflare migration plan and a known dashboard
misconfiguration blocking its CI.

### `payments/` — server-side payment router (separate service, not `js/payments/`)
A Cloudflare Worker service (`worker.mjs`, `provider-registry.mjs`,
`router-core.mjs`, `webhook-verify.mjs`, `schema.sql`) that routes
checkout across Razorpay/Cashfree/Stripe/PayPal server-side so browser
code never sees a payment-provider secret. This is unrelated to the
`app.js` → `js/` modularization and is not touched by it. (Draft PR #112
would additionally add a `js/payments/checkout.js` for the
Gumroad/direct-crypto-wallet UI panels that live client-side today —
distinct from this server-side router.)

## Load order: why it's load-bearing

`index.html` loads scripts in a fixed sequence: Firebase SDKs and
`js/core/*` first, then root data files, then `js/data*`, `js/pricing`,
`js/audio`, `js/voice`, `js/booking`, `js/social`, `js/copilot`,
`js/itinerary`, `js/ui`, `js/game`, `js/misc`, then `tusk-learned.js` /
`destination-photos.js` / `tusk-data.js`, then `app.js` (deferred), then
`js/boot/init.js` (deferred), then `roamwise-premium-itinerary.js` and
`itinerary-library/preset-loader.js` (both deferred, last).

This order exists because the app's UI is built entirely from
string-templated `innerHTML` with inline `onclick="someFunction(...)"`
attributes — including markup generated dynamically at runtime by the
app's own template strings, not just what's in `index.html` statically.
A repo-wide scan for `onclick="funcName("` patterns across `index.html`,
`app.js`, and every `js/**/*.js` file currently finds **287 distinct
function names** referenced this way. Every one of them must be a real,
synchronously-available `window`-reachable global at the exact moment
the HTML referencing it is inserted into the DOM — there is no lazy
resolution. This is why the app cannot switch to ES modules (which are
deferred and scoped, not synchronous globals) or a bundler without a
much larger, separately-planned rewrite (see `FUTURE-ARCHITECTURE-PLAN.md`
for what that would actually take). Any new `js/` file must be inserted
into `index.html` in the correct position: after everything it depends
on, before anything that calls its globals.

## Line-limit enforcement: ESLint `max-lines` / `max-lines-per-function`

Line limits are now enforced via standard ESLint rules (`eslint.config.js`,
flat config), run with `npm run lint`, rather than the old bespoke
`tools/check-line-limits.js` script:

- **`max-lines`: 500 (error).** This is the hard enforcement ceiling for
  every file matched by the config (`js/**/*.js` and `app.js`), configured
  with `skipBlankLines: true, skipComments: true` (the standard way to
  configure this rule, so well-commented files aren't penalized). 500 lines
  matches common enterprise ESLint configs and this codebase's own prior
  300–500 "soft target" — it's now the enforced number rather than just a
  warning threshold.
- **`max-lines-per-function`: 50 (warning, not error).** An aspirational,
  industry-standard "clean code" target for new code — not a hard gate on
  this existing, already-substantially-modularized codebase, which still
  has plenty of pre-existing larger functions. Same `skipBlankLines` /
  `skipComments` options.

`app.js` is included in the lint scope (unlike the old script, which
exempted it) since ESLint's per-file `max-lines` finding is informational
either way; it isn't being split as part of this change.

**Current state (first ESLint pass, effective line counts —
i.e. `skipBlankLines`/`skipComments` — so they differ from raw `wc -l`):**
6 files exceed the 500-line `max-lines` ceiling and are deferred to a
future modularization pass rather than fixed in this PR (more than a
handful, so — per this codebase's own extraction methodology — a real
SRP-based split, not a mechanical chop, is warranted for each):
`app.js` (4866), `js/copilot/core.js` (721), `js/itinerary/pdf-export.js`
(664), `js/itinerary/certificates.js` (538), `js/data/destinations.js`
(515), `js/misc/misc-features-3.js` (508). None of these are in the
auth/payments-adjacent `js/boot/`, `js/data-sync/`, or `js/payments/`
directories.

`npm run lint` is **not** yet part of `npm run check` — this first pass
also surfaces several hundred `eslint:recommended` findings unrelated to
line limits (mostly pre-existing empty `catch` blocks flagged by
`no-empty`, plus a handful of `no-dupe-keys`/`no-redeclare`/
`no-useless-escape` findings), which are real but out of scope for this
PR to fix wholesale. `tools/check-line-limits.js` therefore remains wired
into `npm run check` as a stopgap for now; retiring it in favor of
`npm run lint` is a follow-up once the codebase is clean enough for
`lint` to be a passing CI gate.

## Extraction methodology (proven across ~10 merged phases)

When moving code out of `app.js` into `js/`, or splitting an oversized
`js/` file, follow the pattern established by the phases that got
`app.js` from ~19,300 to ~6,657 lines:

1. **Grep every call site first**, including dynamically-generated
   `onclick=` strings inside template literals — not just static HTML —
   before moving anything. Do not rely on memory or a prior session's
   grep; the codebase changes between sessions.
2. **Verbatim move.** Zero logic changes in the same commit as the
   relocation. Any actual behavior change is a separate, separately
   reviewed change — never bundle the two.
3. **Leave a one-line marker comment** in `app.js` at the original
   location so future greps and diffs stay orientable.
4. **Add the new file's `<script>` tag to `index.html`** in the correct
   dependency position per the load-order rule above.
5. **Verify before merging:** `node --check` on every touched file,
   `npm test`, `npm run check` (line-limit + syntax), then a Playwright
   regression pass that actually exercises rendered UI interactions
   (clicks, `onclick`-driven flows) — not just static/syntax checks.

High-risk code (auth, payments, Pro entitlement, Firestore) *can* be
relocated with this same verbatim-move rigor — file location isn't
special — but per `AI-ROLES-AND-HANDOFF.md` rule 7, any actual
behavior/logic change to that code requires separate, human review (see
PR #112 for how a real auth/payments relocation PR documents this).

## Related documents

- **`TYPESCRIPT-MIGRATION.md`** — not yet present in `main` as of this
  writing; TypeScript-readiness work is in progress on a separate branch
  (`claude/typescript-readiness`). Once it lands, it will describe the
  gradual JSDoc-based approach recommended for this codebase — see
  `FUTURE-ARCHITECTURE-PLAN.md` §3 for how it fits into the bigger
  picture. Don't duplicate its content here once it exists; link to it.
- **`FUTURE-ARCHITECTURE-PLAN.md`** — the honest, staged plan for
  Cloudflare Pages/Workers, TypeScript, and an eventual React/Next.js
  and/or Python adoption. Read that before proposing any of those as a
  short-term task.
