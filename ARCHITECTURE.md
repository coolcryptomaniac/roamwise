# RoamWise Architecture

This is the current, ground-truthed source of truth for how the RoamWise
codebase is put together. It exists so a future AI agent or human
contributor can understand the project in one read instead of re-deriving
it via expensive repo-wide greps every session. Every number and file
path below was verified against the repo at commit `e74eaa2` on the
`claude/modularization-final-pass` branch (2026-09-05) — re-run the
commands in each section's footnote if you suspect drift.

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

As of this commit, `app.js` is **3,099 lines** (down from ~19,300 at the
start of the modularization effort) and there are **105 files** under
`js/`, organized into 16 subdirectories, plus **9 files** under `css/`.
This is the state after the "modularization-final" pass — see the closing
note at the bottom of this document.

### `js/core/` — shared low-level utilities (6 files)
- `dom-utils.js` — DOM helper functions
- `error-guard.js` — global `window.onerror`/error-boundary wiring
- `include-partial.js` — lightweight static HTML partial includes
- `overlay-stack.js` — shared modal/overlay z-index and back-button stack
- `storage-utils.js` — `localStorage` read/write helpers
- `text-utils.js` — string/text formatting + HTML-escaping helpers

### `js/data/` — static reference data + lookup helpers (4 files)
- `destinations.js` (597 lines, pure data — see "Confirmed unchanged"
  below) — the `DB` destination database
- `iata.js` — airport/IATA code lookup
- `place-overrides.js` (111 lines) — curated lat/lon overrides for
  Indian destinations that population-ranked geocoders mis-resolve
- `regions.js` — region/country grouping data

### `js/data-sync/` — cross-device data portability (3 files)
- `rwdata.js` — `RWData`, the backend-portability abstraction layer
- `key-sync.js` — AI-key cross-device sync
- `config-sync.js` — remote-config sync

### `js/pricing/` — monetization mechanics (2 files)
- `tiers.js` (212 lines) — pricing tier definitions
- `referral.js` (262 lines) — referral/affiliate tracking: capture a
  `?ref=` link or typed code, validate against the referrer directory,
  persist it for the attribution window, and stamp it onto a purchase
  claim. Extracted from app.js in the modularization-final pass (see
  "Structural changes" below). Note: `submitUtr()` — the actual
  payment-claim writer that calls this file's `rwRefStamp()` — is
  payments/entitlement code and deliberately stays in `app.js`.

### `js/payments/` (1 file)
- `checkout.js` — Gumroad/direct-crypto-wallet checkout UI panels

### `js/audio/` (3 files)
- `cues.js` — manifest-driven one-shot sound cues
- `focus.js` — single-audible-owner arbitration across cues/music/speech/video
- `reminders.js` — local trip-countdown notification scheduling

### `js/voice/` (2 files)
- `tusk-speak.js` — TTS output (native bridge in-app, Web Speech on web)
- `voice-input.js` — speech-to-text input handling

### `js/booking/` (7 files)
- `actions.js` — on-trip action hub
- `affiliate-links.js` — central affiliate/deep-link builder
- `arrival-mode.js` — first-hours-at-destination arrival flow
- `form.js` (288 lines) — booking form + pay flow
- `local-rides.js` — local rides + stranded-traveler flows
- `pnr-parser.js` — train/flight PNR text parsing
- `tatkal-prep.js` — Indian Railways Tatkal booking prep flow

### `js/social/` (13 files)
- `compat.js` — travel-compatibility quiz
- `coordkit.js` — group coordination + shared-money layer
- `expense-split.js` — expense splitting
- `group-chat.js` (545 lines) — secure trip group chat: room lifecycle
  (open/send/close/minimize/panel-vs-full sizing), the in-room Tusk-bot
  answering path, and the in-room games. Re-audited in the
  modularization-final pass — see "Confirmed unchanged" below for why
  it isn't split further.
- `group-chat-social.js` (477 lines) — reactions/streak/presence/member/
  moderation layer that renders on top of `group-chat.js`'s rooms
- `group-compromise.js` — group decision/compromise engine
- `group-state.js` — shared group-chat state
- `train-picker.js` — group train-pick coordination
- `travel-matching.js` — travel-buddy matching
- `tribe-beacon.js` — tribe/beacon/trip-squad discovery
- `trip-board.js` — shared trip planning board
- `trip-scheduling-poll.js` — "when can everyone go" scheduling polls
- `upi-settle.js` — UPI-based group expense settle-up

### `js/copilot/` — "Tusk" AI travel assistant (9 files)
- `core.js` (813 lines — over the soft target, see "Confirmed unchanged"
  below) — chat core, deterministic parser, intent memory, world resolver
- `rich-reply.js` (545 lines) — action rail, clarify-don't-guess, and
  `cpFinish`/`cpActionsHTML` (the answer-assembly dispatcher)
- `tusk-persona.js` — persona/voice definition (masala smalltalk, quips)
- `tusk-knowledge.js` — knowledge + learning layer
- `answer-cards.js` — structured answer-card rendering
- `agent.js` — the Ailon Tusk agent tool-use loop
- `agent-evals.js` — agent eval harness
- `clarify.js` — small clarify-flow helper
- `region-routes.js` — multi-city/region route building

### `js/itinerary/` — trip building and itinerary features (21 files)
- `atlas-certificate.js`, `eco-certificate.js`, `journey-certificate.js`,
  `certificate-verify.js` — the downloadable-certificate family
- `build.js` — `buildItin`, the itinerary construction engine
- `camera-itinerary.js` — camera/photo-based itinerary capture
- `ground-costs.js`, `ground-truth.js` — real-world cost/scam ground-truth data
- `journey-log.js` (458 lines) — mood-tagged journal entries
- `journey-movie.js` — auto-generated trip recap video/slideshow
- `map-view.js` (334 lines) — Leaflet-based live world map
- `meters.js` — pollution + happiness meters
- `ninja-hacks.js` — deterministic per-destination cheap/luxury hack suggestions
- `pdf-assets.js`, `pdf-export.js` (608 lines — over the soft target, see
  "Confirmed unchanged" below) — premium PDF itinerary export
- `place-disambiguation.js` — resolves ambiguous place names
- `rain-contingency.js` — weather-contingency day planning
- `real-attractions.js` — OSM-sourced real attraction listings
- `shadow-budget.js` — models a trip's shadow/hidden budget
- `share.js` — generic multi-platform share sheet
- `trip-vault.js` — offline saved-trips vault (localStorage)

### `js/ui/` — cross-cutting UI chrome (12 files)
- `adaptive-shell.js` (402 lines) — adaptive app shell
- `card-painter.js` (239 lines) — card rendering, incl. `tkFold`/`tkToggle`
  (the shared fold/unfold accordion helper, relocated here from
  `js/social/group-chat.js` in the modularization-final pass — see
  "Structural changes" below)
- `form-modal.js` — generic form-in-a-modal builder (`rwForm`)
- `how-to-guide.js` — in-app how-to guide
- `layout-modes.js` — layout/density mode switching
- `onboarding.js` — first-run onboarding flow
- `opening.js` — cinematic opening sequence glue
- `page-router.js` — lightweight client-side page routing
- `settings-modal.js` — settings modal
- `site-search.js` — in-app search
- `status-tier.js` — Pro/tier status display
- `themes.js` — theme switching

### `js/game/` — gamification (2 files)
- `badges.js` (278 lines) — badge progression system
- `realms.js` (430 lines) — "Realms of Roam" / Journey Passport game system

### `js/misc/` — miscellaneous feature groups (16 files)
Single-purpose feature files too small individually to warrant their own
subdirectory: `athlete-mode.js`, `booking-platform-compare.js`,
`destination-vibe.js`, `eco-safety.js` (473 lines), `events.js`,
`experiences.js`, `green-trip.js`, `listings.js`, `live-location.js`,
`local-ecosystem.js`, `misc-features.js` (393 lines),
`misc-features-2.js` (371 lines — sequentially-numbered grab-bag files
from the same extraction phase), `partners.js`, `signature-food.js`,
`sound-of-place.js`, `trek-vault.js`.

### `js/runtime/` (2 files)
- `freshness.js` — keeps an installed PWA updated to the newest deployed
  code while preserving offline fallback
- `rules-check.js` — live Firestore-rules diagnostic (surfaced to users
  when a permission-denied error looks like a stale-rules problem)

### `js/boot/` (2 files)
- `init.js` (379 lines) — boot sequence: push notification setup, PWA
  install prompt, status bar, back-button handling, DOMContentLoaded wiring
- `auth-init.js` (383 lines) — Firebase Auth init + `onAuthStateChanged`
  UI wiring (sign-in button state, account drawer trigger, device cap,
  trial grant, account-bound Pro listener) and auth helper functions
  (`openAuth`/`closeAuth`/`loginGoogle`/`loginEmail`/etc.)

### `css/` (9 files)
`base/` (shared base styles, pulled into 194 of 198 `guides/*.html`
pages), `guide-page.css`, `legal-page.css`, `marketing-page.css`, plus
others — split out of inline `<style>` blocks in a prior modularization
phase so guide/legal/marketing pages share real stylesheets instead of
each carrying its own copy-pasted CSS.

### Root-level scripts (not under `js/`, still classic globals)
`rw-config.js`, `events-data.js`, `referral-data.js`, `partners-data.js`,
`booking-data.js`, `affiliate-config.js`, `rooms-data.js`,
`experiences-data.js`, `badges-data.js`, `compat-data.js`,
`finance-data.js`, `regions-data.js`, `resource-data.js`,
`investors-data.js`, `team-data.js`, `tusk-learned.js`,
`destination-photos.js`, `tusk-data.js`, `app.js`,
`roamwise-premium-itinerary.js`, `sw.js`, `firebase-messaging-sw.js`,
plus `itinerary-library/preset-loader.js` (the merged cinematic itinerary
preset library, ex-PR #63) and the `platform-v5/` directory (cinematic
opening/animation modules: `atlas-shinobi.js`, `audio-only.js`,
`cinematic-map-v51.js`, `crowd-dodge.js`, `learning-consent.js`,
`performance.js`).

### `worker/` — optional Cloudflare Worker (not loaded by the app by default)
`worker.js` implements `/health`, `/ai` (Groq proxy), `/news`, `/events`,
`/events/refresh`, `/geo` (Nominatim proxy), and `/leads` (OpenStreetMap-
based partner lead finder), plus a daily cron (`wrangler.toml`). See
`FUTURE-ARCHITECTURE-PLAN.md` for its role in the Cloudflare migration
plan.

### `payments/` — server-side payment router (separate service, not `js/payments/`)
A Cloudflare Worker service (`worker.mjs`, `provider-registry.mjs`,
`router-core.mjs`, `webhook-verify.mjs`, `schema.sql`) that routes
checkout across Razorpay/Cashfree/Stripe/PayPal server-side so browser
code never sees a payment-provider secret. This is unrelated to the
`app.js` → `js/` modularization and is not touched by it.

## Load order: why it's load-bearing

`index.html` loads scripts in a fixed sequence: `js/runtime/freshness.js`
and `js/core/*` first, then `js/ui/form-modal.js`, then root config/data
files, then `js/data*`, `js/pricing`, `js/payments`, `js/data-sync`,
`js/runtime/rules-check.js`, `js/audio`, `js/voice`, `js/booking`,
`js/social`, `js/copilot`, `js/itinerary`, `js/ui` (the rest),
`js/game`, `js/misc`, then `tusk-learned.js` / `destination-photos.js` /
`tusk-data.js`, then `js/boot/auth-init.js` (deferred), `app.js`
(deferred), `js/boot/init.js` (deferred), then
`roamwise-premium-itinerary.js` and `itinerary-library/preset-loader.js`
(both deferred, last).

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

Note that this "before anything that calls its globals" rule is about
**top-level, parse-time** references only (e.g. an IIFE that runs
immediately, or a top-level `var x = fn()`). A function *body* that
references another file's function — `cpActionsHTML()` calling
`tkFold()`, `submitUtr()` calling `rwRefStamp()`, an `onclick=` attribute
calling anything — is not order-sensitive, because it's resolved when
that function actually *runs* (a user click, a message send), long after
every script on the page has finished loading. This distinction is why
most of this codebase's cross-file coupling is safe to relocate freely,
while a small number of top-level boot-sequence blocks (documented
inline where they occur, e.g. `js/copilot/core.js`'s header comment) are
not.

## Line-limit enforcement: ESLint `max-lines` / `max-lines-per-function`

Line limits are enforced via standard ESLint rules (`eslint.config.js`,
flat config), run with `npm run lint`:

- **`max-lines`: 500 (error).** The hard enforcement ceiling for every
  file matched by the config (`js/**/*.js` and `app.js`), configured with
  `skipBlankLines: true, skipComments: true`.
- **`max-lines-per-function`: 50 (warning, not error).** An aspirational
  target for new code, not a hard gate on this already-substantially-
  modularized codebase.

**Current state (effective line counts — i.e. after `skipBlankLines`/
`skipComments` — so these differ from raw `wc -l` used elsewhere in this
doc):** 4 files exceed the 500-line `max-lines` ceiling: `app.js` (2,276
effective lines — `max-lines` counts only non-blank/non-comment lines,
so this is well below the raw 3,099 and is not a normal `js/` module
subject to the same expectation — see "app.js is exempt in spirit"
below), `js/copilot/core.js` (616), `js/data/destinations.js` (515, pure
data), `js/itinerary/pdf-export.js` (531). Two files that were over the
raw-line soft target before this pass — `js/copilot/rich-reply.js` and
`js/social/group-chat.js` — are now **under** the enforced 500-line
ceiling on an effective-line basis after this pass's `tkFold`/`tkToggle`
relocation, even though their raw `wc -l` (545 and 545 respectively) is
still marginally over the older 300–500 "soft target" convention used by
`tools/check-line-limits.js`.

`app.js` is not literally exempted in the ESLint config (unlike the old
`tools/check-line-limits.js` script, which explicitly skipped it), but is
exempt in spirit: it is the shrinking migration source, not a normal
`js/` module, and `npm run lint` is informational for it, not a merge
gate — see below.

`npm run lint` is **not** part of `npm run check`, which still uses
`tools/check-line-limits.js` (raw-line-based, 1000-line hard cap,
300–500 soft-target warning) as the CI-blocking gate.
`npm run lint`'s full findings, as of this pass:

```
no-unused-vars:          1,073 warnings
no-empty:                  455 errors
max-lines-per-function:    31 warnings
no-useless-escape:         15 errors
no-redeclare:              10 errors
no-useless-assignment:      5 errors
max-lines:                  4 errors
--------------------------------------
TOTAL:  489 errors, 1,104 warnings
```

The modularization-final pass fixed every occurrence in the four
categories most likely to hide a real latent bug — `no-dupe-keys`,
`no-constant-condition`, `no-constant-binary-expression`,
`no-misleading-character-class` — bringing errors down from 512 to 489
(23 fewer; those four categories are now at zero). `no-empty` (455
occurrences, mostly pre-existing empty `catch(e){}` blocks — a defensive
pattern, not obviously a bug, but numerous enough to need its own
triage pass) and `no-useless-escape` were explicitly out of scope for
this pass and remain open follow-ups. Retiring
`tools/check-line-limits.js` in favor of `npm run lint` as the CI gate is
a follow-up once `no-empty` is triaged.

## Extraction methodology (proven across ~12 merged phases)

When moving code out of `app.js` into `js/`, or splitting an oversized
`js/` file, follow the pattern established by the phases that got
`app.js` from ~19,300 to 3,099 lines:

1. **Grep every call site first**, including dynamically-generated
   `onclick=` strings inside template literals — not just static HTML —
   before moving anything. Do not rely on memory or a prior session's
   grep; the codebase changes between sessions.
2. **Verbatim move.** Zero logic changes in the same commit as the
   relocation. Any actual behavior change is a separate, separately
   reviewed change — never bundle the two.
3. **Leave a one-line marker comment** in the old location so future
   greps and diffs stay orientable.
4. **Add the new file's `<script>` tag to `index.html`** in the correct
   dependency position per the load-order rule above (remembering that
   only top-level/parse-time references are order-sensitive — see
   above).
5. **Verify before merging:** `node --check` on every touched file,
   `npm test`, `npm run check` (line-limit + syntax + typecheck),
   `npm run lint` (confirm the error count went down, not up), then a
   real Playwright regression pass — an actual headless browser against
   a local static server, clicking through the affected UI (not just a
   static/syntax check) — before merging. This pass used exactly that:
   headless Chromium loading `index.html`, confirming every moved
   function is still a defined global, clicking a rendered `tkFold`
   button to confirm it still opens, driving the real `#authRefCode`
   input through `rwRefLiveCheck()`, and confirming `RW_PLACE_OVERRIDES`
   resolves to the exact same values as before its dead-duplicate-key
   cleanup — i.e., verifying zero behavior change at runtime, not just
   by reading the diff.

High-risk code (auth, payments, Pro entitlement, Firestore) *can* be
relocated with this same verbatim-move rigor — file location isn't
special — but per `AI-ROLES-AND-HANDOFF.md` rule 7, any actual
behavior/logic change to that code requires separate, human review.
`js/pricing/referral.js` (added in this pass) is an example: the
referral-tracking functions were moved verbatim, but `submitUtr()` — the
function that actually writes a payment claim — was deliberately left in
`app.js` rather than swept along with it, because touching the payment
write path is out of scope for a pure-relocation change.

## Modularization status: considered complete as of 2026-09-05

As of this commit (`e74eaa2`, `claude/modularization-final-pass`),
`app.js` is 3,099 lines (from ~19,300), there are 105 files under `js/`
across 16 subdirectories, and every genuinely self-contained, cleanly-
extractable chunk found by this pass's fresh audit — `tkFold`/`tkToggle`
(misfiled generic UI helper) and the referral-tracking block — has been
extracted. The files still over the raw-line soft target
(`js/copilot/core.js`, `js/itinerary/pdf-export.js`,
`js/data/destinations.js`, `js/social/group-chat.js`) were each
individually re-examined with fresh eyes (not just trusting prior
comments) and confirmed to be either pure data, or genuinely
tightly-interleaved logic that a split would only fragment across files
without reducing real complexity — see the per-file notes above.

**This modularization effort is considered complete and stable.**
Further splits of `js/` files or of `app.js` should only happen for a
*genuine new single-responsibility violation* discovered in the course
of other work — e.g. a file that grows because two unrelated features
got bolted onto it, or a helper that's misfiled the way `tkFold`/
`tkToggle` were — not as a mechanical exercise to chase a smaller
line-count number. `app.js`'s remaining ~3,100 lines are a wide,
shallow collection of many small (10–60 line), genuinely diverse
feature handlers (profile/lifetime-list, music panel, ratings, AI-key
wizard, model-comparison arena, event radar, travel-pulse news, funnel
tracking, post-trip memories studio, traveler DNA, the payment/plan-
picker flow, global commerce/region detection, etc.) — extracting these
further would mean either dozens of very small single-function files
(worse for an AI agent or human to navigate, not better) or grouping
unrelated features together under an artificial theme (the same SRP
violation this whole effort has been correcting). Prefer leaving `app.js`
as the intentionally-exempt, still-shrinking miscellany file it already
is, and extract from it opportunistically when a real, nameable, reusable
concern (like the referral system in this pass) is found.

## Known follow-ups (not done in this pass, tracked here so they aren't re-discovered from scratch)

- **`no-empty` (455 occurrences)** — mostly `catch(e){}` defensive
  blocks. Needs its own triage pass to distinguish "genuinely fine to
  swallow" from "silently hiding a real failure," at a scale too large
  for a single pass alongside other work.
- **`no-useless-escape` (15 occurrences)** — regex escapes that are
  unnecessary but not wrong; low bug risk, cosmetic cleanup.
- **`no-redeclare` (10 occurrences)** and **`no-useless-assignment` (5
  occurrences)** — not yet triaged; worth a look before treating
  `npm run lint` as a CI-blocking gate.
- Retiring `tools/check-line-limits.js` in favor of `npm run lint` as
  the `npm run check` gate, once the above are triaged enough that
  `lint` can pass cleanly (or with an intentional, documented allowlist).

## Related documents

- **`TYPESCRIPT-MIGRATION.md`** — gradual JSDoc-based TypeScript-readiness
  plan. See `FUTURE-ARCHITECTURE-PLAN.md` §3 for how it fits into the
  bigger picture.
- **`FUTURE-ARCHITECTURE-PLAN.md`** — the honest, staged plan for
  Cloudflare Pages/Workers, TypeScript, and an eventual React/Next.js
  and/or Python adoption. Read that before proposing any of those as a
  short-term task.
- **`AI-ROLES-AND-HANDOFF.md`** — shared ChatGPT/Claude responsibilities
  and repo-wide safety rules (rule 7: auth/payments/entitlement/
  Firestore/deployment behavior changes need separate human review).
