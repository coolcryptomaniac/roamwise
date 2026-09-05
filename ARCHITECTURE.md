# RoamWise Architecture

This is the current, ground-truthed source of truth for how the RoamWise
codebase is put together. It exists so a future AI agent or human
contributor can understand the project in one read instead of re-deriving
it via expensive repo-wide greps every session. Every number and file
path below was verified against the repo on the
`claude/modularization-round5-ai-optimizations` branch (2026-09-05) —
re-run the commands in each section's footnote if you suspect drift.

**Before grepping the repo for "where is function X defined?" or "which
file owns feature Y?", read `FUNCTION-INDEX.md` first** — see the
"Low AI credit usage: FUNCTION-INDEX.md" section below.

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

As of this commit, `app.js` is **629 lines** (down from ~19,300 at the
start of the modularization effort, down from 3,099 after the prior
"modularization-final" pass, and down from 1,207 after "round 4") and
there are **125 files** under `js/`, organized into 16 subdirectories,
plus **9 files** under `css/`. This is the state after the "round 5"
pass — see "Modularization round 5" near the bottom of this document for
what was found (a mis-categorization in round 4's own closing
assessment) and for the honest, re-verified case that what's left now
really is the practical floor.

### `js/core/` — shared low-level utilities (7 files)
- `app-utils.js` — `rwHaptic`/`showToast`/`scrollToId`/`offerOpen`/
  `_doOpenNow`/`saveOrDownload`: generic, `onclick=`-invoked UI utilities
  that used to live in app.js under a "core utilities" label that
  (per round 5's re-audit) didn't actually justify keeping them there —
  see "Modularization round 5" below
- `dom-utils.js` — DOM helper functions
- `error-guard.js` — global `window.onerror`/error-boundary wiring
- `include-partial.js` — lightweight static HTML partial includes
- `overlay-stack.js` — shared modal/overlay z-index and back-button stack
- `storage-utils.js` — `localStorage` read/write helpers
- `text-utils.js` — string/text formatting + HTML-escaping helpers

### `js/data/` — static reference data + lookup helpers (5 files)
- `destinations.js` (597 lines, pure data) — the `DB` destination database
- `iata.js` — airport/IATA code lookup
- `place-overrides.js` (111 lines) — curated lat/lon overrides for
  Indian destinations that population-ranked geocoders mis-resolve
- `regions.js` — region/country grouping data
- `country-info.js` — `COUNTRY_INFO` (per-country ISO/capital/currency/
  language) + `ALL_COUNTRIES` name list; moved verbatim from app.js in
  modularization round 4

### `js/data-sync/` — cross-device data portability (3 files)
- `rwdata.js` — `RWData`, the backend-portability abstraction layer
- `key-sync.js` — AI-key cross-device sync
- `config-sync.js` — remote-config sync

### `js/pricing/` — monetization mechanics (2 files)
- `tiers.js` (257 lines) — pricing tier definitions, plus `fmtMoney`/
  `proPriceLabel` (money-display helpers moved verbatim from app.js in
  round 5; they read app.js's `CURR`/`AC` currency state by name,
  resolved at call time)
- `referral.js` (262 lines) — referral/affiliate tracking: capture a
  `?ref=` link or typed code, validate against the referrer directory,
  persist it for the attribution window, and stamp it onto a purchase
  claim. Extracted from app.js in the modularization-final pass.
  Note: `submitUtr()` — the actual
  payment-claim writer that calls this file's `rwRefStamp()` — is
  payments/entitlement code and deliberately stays in `app.js`.

### `js/payments/` (3 files)
- `checkout.js` — Gumroad/direct-crypto-wallet checkout UI panels
- `partner-redeem.js` — `openPartnerRedeem()`, the partner claim-code ->
  Pro grant flow (NMIMS and future partners); moved verbatim from app.js
  in modularization round 4 (Pro-entitlement/Firestore code — relocation
  only, zero logic changes, per `CLAUDE.md`'s relocation-is-fine rule)
- `plan-picker.js` — the pay modal: UPI QR/deep-link helpers, the plan
  grid, the founder-offer countdown banner, rotating testimonials, and
  the pay/success overlay lifecycle; moved verbatim from app.js in
  modularization round 4. `submitUtr()` (the function that actually
  writes a payment claim) deliberately stays in app.js — see "Modularization
  round 4" below

### `js/audio/` (3 files)
- `cues.js` — manifest-driven one-shot sound cues
- `focus.js` — single-audible-owner arbitration across cues/music/speech/video
- `reminders.js` — local trip-countdown notification scheduling

### `js/voice/` (2 files)
- `tusk-speak.js` — TTS output (native bridge in-app, Web Speech on web)
- `voice-input.js` — speech-to-text input handling

### `js/booking/` (7 files)
- `actions.js` — on-trip action hub
- `affiliate-links.js` (168 lines) — central affiliate/deep-link builder,
  plus `rwSkyscannerUrl`/`rwSkyscannerToUrl` (moved verbatim from app.js
  in round 5 — natural fit, both build on this file's `rwAffLink()`)
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
  modularization-final pass and confirmed as one cohesive unit, not
  further split.
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

### `js/copilot/` — "Tusk" AI travel assistant (10 files)
- `core.js` (813 lines — over the soft target, but confirmed as one
  cohesive unit in a prior pass, not further split) — chat core,
  deterministic parser, intent memory, world resolver
- `rich-reply.js` (545 lines) — action rail, clarify-don't-guess, and
  `cpFinish`/`cpActionsHTML` (the answer-assembly dispatcher)
- `tusk-persona.js` — persona/voice definition (masala smalltalk, quips)
- `tusk-knowledge.js` — knowledge + learning layer
- `answer-cards.js` — structured answer-card rendering
- `agent.js` — the Ailon Tusk agent tool-use loop
- `agent-evals.js` — agent eval harness
- `clarify.js` — small clarify-flow helper
- `region-routes.js` — multi-city/region route building
- `ai-providers.js` — the provider-agnostic AI request layer
  (`aiRequest`/`aiCall`/`aiCallAny`/`testKey`/`testKeyFallbackChain`/
  `extractJSON`); moved verbatim from app.js in modularization round 4.
  Depends on `activeProv`/`AI_MODELS`/`lastAiSource`, which deliberately
  stayed in app.js (see "Modularization round 4" below)

### `js/itinerary/` — trip building and itinerary features (24 files)
(the round-4 doc said 25 here; a fresh `ls js/itinerary | wc -l` this
round found 24 — pre-existing drift in the prior doc, not a round-5
change, corrected here)
- `atlas-certificate.js` — the downloadable Atlas Certificate + Journey
  Card export actions; also now hosts `CONTINENT_BY_CC`/`continentForCC`/
  `continentForLatLon`/`continentFor` (moved from app.js in round 4 — this
  file is their only caller, the "N/7 continents" stat)
- `eco-certificate.js`, `journey-certificate.js`, `certificate-verify.js`
  — the rest of the downloadable-certificate family
- `build.js` — `buildItin`, the itinerary construction engine
- `camera-itinerary.js` — camera/photo-based itinerary capture
- `ground-costs.js`, `ground-truth.js` — real-world cost/scam ground-truth data
- `journey-log.js` (458 lines) — mood-tagged journal entries
- `journey-movie.js` — auto-generated trip recap video/slideshow
- `map-view.js` (334 lines) — Leaflet-based live world map
- `memories-studio.js` — the post-trip Memories Studio: AI-generated trip
  blog, photo collage, memory log (`openMemories` and friends); moved
  verbatim from app.js in round 4
- `meters.js` — pollution + happiness meters
- `ninja-hacks.js` — deterministic per-destination cheap/luxury hack suggestions
- `pdf-assets.js`, `pdf-export.js` (608 lines — over the soft target, but
  confirmed as one cohesive unit in a prior pass, not further split) —
  premium PDF itinerary export
- `place-disambiguation.js` — resolves ambiguous place names
- `rain-contingency.js` — weather-contingency day planning
- `real-attractions.js` — OSM-sourced real attraction listings
- `result-cards.js` — `runSearch()` (the search button's click handler)
  and `renderCards()` (the entire results DOM), plus card-level
  interactions (`swTab`/`swSub`/`addSpend`/`togPack`/`openLbox`/
  `closeLbox`); moved verbatim from app.js in round 4
- `search-engine.js` — `smartSearch()` (zero-API-key destination scorer),
  `flagEmoji`/`lookupCountryInfo`/`buildGenericDestination`, and the
  Wikipedia photo pipeline (`loadPhotosForCard` and friends); moved
  verbatim from app.js in round 4
- `shadow-budget.js` — models a trip's shadow/hidden budget
- `share.js` — generic multi-platform share sheet
- `trip-vault.js` — offline saved-trips vault (localStorage)

### `js/ui/` — cross-cutting UI chrome (15 files)
- `adaptive-shell.js` (402 lines) — adaptive app shell
- `card-painter.js` (239 lines) — card rendering, incl. `tkFold`/`tkToggle`
  (the shared fold/unfold accordion helper, relocated here from
  `js/social/group-chat.js` in the modularization-final pass)
- `currency-budget.js` (81 lines) — currency-grid + budget-slider boot
  wiring, added in round 5 via a deferred-init pattern: exposes
  `rwInitCurrencyBudget()`, called from app.js at the exact line the old
  top-level IIFE used to occupy — see "Modularization round 5" below
- `dest-autocomplete.js` (85 lines) — destination-autocomplete dropdown
  boot wiring, added in round 5 the same way, exposing
  `rwInitDestAutocomplete()`
- `form-modal.js` — generic form-in-a-modal builder (`rwForm`)
- `how-to-guide.js` — in-app how-to guide
- `key-wizard.js` — the 60-second AI key onboarding wizard plus the
  model comparison arena (`compareModels`); moved verbatim from app.js
  in modularization round 4
- `layout-modes.js` — layout/density mode switching
- `onboarding.js` (55 lines) — first-run onboarding flow, plus
  `killIntro()` + the first-launch trailer-dismiss IIFE (moved verbatim
  from app.js in round 5 — same "first-launch experience" concern this
  file already owned)
- `opening.js` — cinematic opening sequence glue
- `page-router.js` — lightweight client-side page routing
- `settings-modal.js` — settings modal
- `site-search.js` — in-app search
- `status-tier.js` — Pro/tier status display
- `themes.js` — theme switching

### `js/game/` — gamification (2 files)
- `badges.js` (278 lines) — badge progression system
- `realms.js` (430 lines) — "Realms of Roam" / Journey Passport game system

### `js/misc/` — miscellaneous feature groups (25 files)
Single-purpose feature files too small individually to warrant their own
subdirectory: `adsense-whatsapp.js` (65 lines) — the gated AdSense
loader + WhatsApp FAB boot IIFE; moved verbatim from app.js in round 5.
Unlike the true boot IIFEs handled with a deferred-init pattern in
`js/ui/currency-budget.js`, this one didn't need that treatment: it
already defensively checks `document.readyState` itself and defers to
`DOMContentLoaded` when needed, so it's safe to run as a plain
top-level script regardless of load position — see "Modularization
round 5" below. `athlete-mode.js`, `booking-platform-compare.js`,
`crowd-spotter.js` (24 lines) — `openCrowdSpot`, the Crowd Spotter
"Travel & Earn" report form; moved verbatim from app.js in round 5.
`destination-vibe.js`, `eco-safety.js` (473 lines),
`engagement.js` (142 lines) — five originally-adjacent app.js sections
(TRAVEL ECONOMY LIVE TICKER, SYNC CIRCLE, FUNNEL TRACKER, CONVERSION
NUDGE, TRAVEL PULSE) grouped here in round 5 because they share one
real, pre-existing theme (anonymous no-PII engagement signals +
conversion nudges) that app.js's own section comments already named —
`renderTicker`/`syncGo`/`track`/`rwTuskFeedback`/`rwTuskMiss`/
`maybeNudge`/`pulseKey`/`pulseBump`/`pulseShow`.
`event-radar-news.js` — the home-screen "world's biggest moments" event
radar and travel-pulse news panels (`EVENTS`/`activeEvents`/
`renderEventBanner`/`renderNewsPulse` and friends; moved verbatim from
app.js in round 4 — distinct from the unrelated `RW_EVENTS` partner
directory in `events.js` below), `events.js`, `experiences.js`,
`green-trip.js`, `listings.js`, `live-location.js`, `local-ecosystem.js`,
`misc-features.js` (393 lines), `misc-features-2.js` (371 lines —
sequentially-numbered grab-bag files from the same extraction phase),
`partners.js`, `profile.js` (78 lines) — `STYLE_POOL`/`openProfile`/
`profAv`/`profUpload`/`profPick`/`profSave`, the Profile + Lifetime List
feature; moved verbatim from app.js in round 5. `promo-music.js` — the
self-hosted promo-film player (`renderPromo`/`playPromo`/
`filmPlayerHTML` and friends) and the "My Music" Spotify/JioSaavn panel
(`openMusic`/`musRender`); moved verbatim from app.js in round 4.
`ratings.js` (62 lines) — `PLAYSTORE_URL`/`renderRatings`/
`openRateForm`/`paintStars`/`submitRating`; moved verbatim from app.js
in round 5. `signature-food.js`, `sound-of-place.js`, `trek-vault.js`,
`traveler-dna.js` (41 lines) — `DNA_QS`/`openDna`/`dnaPick`/`dnaSave`/
`applyDna`, the Traveler DNA personalization quiz; moved verbatim from
app.js in round 5 (the `try{ applyDna(); }catch(e){}` top-level call
stays in app.js — see "Modularization round 5" below). `trust-
conversion.js` (43 lines) — `openPrivacyBadge`/`rwHandoffToPhone`, the
privacy-trust-anchor modal and web-to-app QR handoff; moved verbatim
from app.js in round 5 (these two were already grouped under one
section header in app.js, a real pairing, not an artificial one).

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
doc):** as of round 5, `app.js` no longer appears in the `max-lines`
violation list at all — its 629 raw lines (down from 1,207 after round 4)
are now well under the 500-line effective-line ceiling, having crossed
that threshold sometime during round 5's extractions. Only **3 files**
now exceed the 500-line `max-lines` ceiling, all pre-existing and
untouched by round 5: `js/copilot/core.js` (616), `js/data/destinations.js`
(515, pure data), `js/itinerary/pdf-export.js` (531). Two files that were
over the raw-line soft target before the modularization-final pass —
`js/copilot/rich-reply.js` and `js/social/group-chat.js` — are now
**under** the enforced 500-line ceiling on an effective-line basis after
that pass's `tkFold`/`tkToggle` relocation, even though their raw `wc -l`
(545 and 545 respectively) is still marginally over the older 300–500
"soft target" convention used by `tools/check-line-limits.js`.

`app.js` is not literally exempted in the ESLint config (unlike the old
`tools/check-line-limits.js` script, which explicitly skipped it), but is
exempt in spirit: it is the shrinking migration source, not a normal
`js/` module, and `npm run lint` is informational for it, not a merge
gate — see below. (As of round 5, `app.js` is small enough — 629 raw
lines — that this distinction barely matters for it any more; it's
close to being an ordinary-sized file regardless.)

`npm run lint` is **not** part of `npm run check`, which still uses
`tools/check-line-limits.js` (raw-line-based, 1000-line hard cap,
300–500 soft-target warning) as the CI-blocking gate.
`npm run lint`'s full findings, as of round 5:

```
no-unused-vars:          1,100 warnings
no-empty:                  455 errors
max-lines-per-function:    32 warnings
no-useless-escape:         15 errors
max-lines:                   3 errors
--------------------------------------
TOTAL:  473 errors, 1,132 warnings
```

(`no-redeclare` and `no-useless-assignment` triaged to zero this round —
see "Modularization round 5" above for the fixes and "Known follow-ups"
below for how they were categorized.)

The `no-unused-vars` warning count rose from 1,095 (round 4) to 1,100
(+5) and `max-lines-per-function` from 31 to 32 (+1) purely as a
mechanical side effect of round 5's `app.js` splits, for the same reason
as round 4's own note below: ESLint lints each classic script file in
isolation and has no notion of "this global is actually called from a
different file's `onclick=` string" — so every top-level function that
moved out of `app.js` into its own small file now reads, from that one
file's perspective, as "declared but never used" even though its real
callers (verified by grep before every move) are exactly as before. This
is the same pre-existing false-positive category that already accounts
for a large share of the other ~100+ `js/` files' warnings in a
no-bundler/no-ES-modules codebase (see "no bundler, no ES modules" in
`CLAUDE.md`) — it is not a new or genuine problem. The **error** count —
the number that would actually matter if `lint` ever becomes a CI gate —
went *down* this round, twice: first 489 → 488 (one of the four
`max-lines` violations — `app.js` itself — dropped below the
500-effective-line threshold as a direct, genuine result of the
shrinkage, not a side effect), then 488 → 473 from triaging
`no-redeclare` (10) and `no-useless-assignment` (5) to zero — see
"Modularization round 5" above for the fixes and "Known follow-ups"
below for the categorization.

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

## Extraction methodology (proven across ~14 merged phases)

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
   above). If the code being moved is a top-level IIFE that queries a
   *specific* `index.html` element at parse time (a true "boot IIFE," not
   just a function that happens to be called from one) — the one case
   where a raw verbatim move genuinely would change execution order —
   use the **deferred-init pattern** round 5 established instead of
   leaving it in `app.js`: wrap the IIFE's body, unchanged, in a named
   function in the new file, and leave a single one-line call to that
   function in `app.js` at the *exact* line the old IIFE occupied. This
   preserves execution order byte-for-byte (the call site doesn't move,
   only the code's home file does) while still shrinking `app.js`. See
   `js/ui/currency-budget.js` and `js/ui/dest-autocomplete.js` for
   worked examples, and "Modularization round 5" below for how this was
   distinguished from IIFEs that only *look* order-sensitive but aren't
   (e.g. `js/misc/adsense-whatsapp.js`, which already defers to
   `DOMContentLoaded` itself and needed no wrapping at all).
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

## Modularization round 4 (2026-09-05): app.js 3,099 -> 1,207 lines

The prior pass ("modularization-final") had concluded `app.js`'s
remaining ~3,100 lines were a wide, shallow collection of small, diverse
feature handlers not worth splitting further. A fresh, skeptical re-audit
of that same file this round found that several of those "small handlers"
were in fact substantial (100-260+ line), genuinely single-purpose,
cleanly-separable chunks that had simply never been individually examined
at that granularity before. Nine were extracted, in order of extraction:

1. `js/copilot/ai-providers.js` — the AI provider request layer
   (`aiRequest`/`aiCall`/`aiCallAny`/`testKey`/`testKeyFallbackChain`/
   `extractJSON`), ~180 lines.
2. `js/itinerary/memories-studio.js` — the post-trip Memories Studio
   (AI blog + photo collage + memory log), ~160 lines.
3. `js/ui/key-wizard.js` — the 60-second AI key wizard + model comparison
   arena, ~160 lines.
4. `js/misc/event-radar-news.js` — the home-screen event radar + travel
   pulse news panels, ~125 lines.
5. `js/payments/partner-redeem.js` — the partner claim-code -> Pro grant
   flow, ~130 lines (Pro-entitlement/Firestore code, relocated per
   `CLAUDE.md`'s relocation-is-fine rule; zero logic changed).
6. `js/payments/plan-picker.js` — the pay modal, plan grid, founder-offer
   countdown banner, and testimonials, ~350 lines (same relocation-only
   rule as above).
7. `js/itinerary/search-engine.js` + `js/itinerary/result-cards.js` — the
   core "search for destinations, render result cards" pipeline
   (`smartSearch`/`runSearch`/`renderCards` and their helpers), the single
   largest remaining chunk at ~530 lines combined, split into two files
   by SRP (destination/photo resolution vs. search execution + card
   rendering).
8. `js/data/country-info.js` — pure static country data (`COUNTRY_INFO`/
   `ALL_COUNTRIES`), ~115 lines; and `CONTINENT_BY_CC`/`continentForCC`/
   `continentForLatLon`/`continentFor` colocated into
   `js/itinerary/atlas-certificate.js`, their only caller.
9. `js/misc/promo-music.js` — the promo-film player + "My Music" panel,
   ~125 lines.

All nine were verbatim moves (grepped every call site first, including
dynamically-generated `onclick=` strings, per the methodology below) and
verified with `node --check`, `npm test`, `npm run check`, `npm run lint`
(error count unchanged at 489 — see the lint note below), and a real
Playwright pass against a local static server: typed a search, clicked
Search, confirmed result cards render, switched a card tab, opened/closed
the photo lightbox, and opened the relocated wizard/pay-modal/music-panel
overlays — not just a static/syntax check.

**What's left in `app.js` (1,207 lines) and why it resists further
splitting:** a full top-level scan (`grep -n '^function \|^var \|^(function'
app.js`) shows the remainder is genuinely different in kind from what was
just extracted — not more of the same:

- **Top-level, parse-time boot wiring**, interleaved between the small
  functions rather than separable from them: the currency-grid IIFE, the
  budget-slider `addEventListener` wiring, the destination-autocomplete
  IIFE (live Photon API calls + `window.getDestVal`), the free-search
  daily-reset IIFE, the provisional-Pro-expiry-check IIFE, the one-time
  visit-tracking IIFE, and the intro/trailer dismiss IIFE. Each directly
  manipulates specific `index.html` element IDs (`el('currGrid')`,
  `el('budgetSlider')`, `el('destInput')`, etc.) at the exact moment
  `app.js` executes in the load order — moving any of them to a file that
  loads earlier or later changes *when* they run against the DOM, which
  is exactly the top-level/parse-time hazard this doc's load-order
  section warns about, not merely a relocation.
- **Core app state `var`s** other files close over by name at runtime:
  `isPro`, `freeLeft`, `activeProv`, `spends`, `itinBuilt`, `qrBuilt`,
  `AC`, `MONTHS`, `MO`, `CURR`, `AI_MODELS`, `lastAiSource`, `PRICE_IN`/
  `PRICE_WW`, `payRegion`, `LEGAL`. These aren't a "feature" to extract;
  they're the shared state the rest of the app (including the files
  extracted this round) reads and writes.
- **Core utilities called from `onclick=` attributes across the entire
  codebase**, not just app.js: `rwHaptic`, `showToast`, `fmtMoney`,
  `proPriceLabel`, `scrollToId`, `saveOrDownload`.
- **`submitUtr()`** (the function that actually writes a payment claim to
  Firestore) and **`detectRegion`/`setPayRegion`/`applyRegionUI`**
  (the latter called at top level via `applyRegionUI();` — another
  parse-time call site) were deliberately left untouched this round: the
  first is payments/entitlement logic best left minimally disturbed, and
  the second has the same top-level-call hazard described above.
- **A residual handful of genuinely small (15-70 line), diverse feature
  handlers** still sandwiched between the boot IIFEs above: the privacy
  badge / web-to-app handoff, profile + "Lifetime List", the WhatsApp
  button, ratings, Sync Circle, Tusk feedback/miss tracking, the
  conversion nudge, the anonymous "Travel Pulse" popularity counter, the
  intro/trailer, Traveler DNA, the Crowd Spotter + "open now" quick
  action, and `openLegal`. Each is too small and too entangled with the
  boot IIFEs immediately before/after it to safely relocate without
  either fragmenting into many trivial single-function files (worse to
  navigate, not better) or grouping unrelated features under an
  artificial theme — the same SRP violation this effort corrects, not
  one to reintroduce.

**Given this, `app.js`'s remaining ~1,200 lines are the genuine app
bootstrap/dispatch core** described by the task that requested this pass.
Future sessions: re-run the same fresh, skeptical top-level scan before
assuming this is still accurate — but do not force further splits of the
boot-wiring IIFEs or state vars listed above without first re-verifying,
against the current `index.html`, that doing so doesn't change execution
order relative to the DOM elements and globals they touch.

> **Correction (round 5):** the "too entangled to relocate" and
> "moving would change execution order" reasoning above turned out to be
> half right. It correctly identified a real hazard (true boot IIFEs that
> query specific DOM elements at parse time) but then over-applied that
> hazard to code that didn't actually have it — see "Modularization round
> 5" immediately below for the specifics and the fix. Read the round 5
> section as the current, corrected assessment; this round 4 section is
> kept as an accurate historical record of what round 4 actually found
> and did, not as standing guidance.

## Modularization round 5 (2026-09-05): app.js 1,207 -> 629 lines

Round 4's own closing assessment (immediately above) was the explicit
brief for this round: verify it with fresh eyes rather than rubber-stamp
it, specifically checking (a) whether any "boot IIFE" was actually *not*
order-dependent and could be extracted with a deferred-init pattern, and
(b) whether any of the "small handlers" were genuinely reusable/misplaced
utilities rather than core app logic. Both turned out to be true, for
different subsets of what was left:

**(a) Six "core utilities called from `onclick=` attributes"
(`rwHaptic`, `showToast`, `fmtMoney`, `proPriceLabel`, `scrollToId`,
`saveOrDownload`) were mis-categorized, not actually boot-order-sensitive.**
Round 4's reasoning for leaving these in app.js was that they're called
from `onclick=` attributes "across the entire codebase, not just
app.js" — but that's precisely the property that makes relocating them
*safe*, per this doc's own "Load order" section: an `onclick=` call only
ever fires after a user interaction, which is necessarily after every
script on the page (including wherever these functions now live) has
finished loading. Grepped every call site repo-wide first (including
dynamically-generated `onclick=` strings) and confirmed none of the six
is ever called at another file's top level / parse time — every call site
is inside a function body or an `onclick=` attribute. Moved `rwHaptic`/
`showToast`/`scrollToId`(+`VIEW_OF`)/`offerOpen`/`_doOpenNow`/
`saveOrDownload` to the new `js/core/app-utils.js`; moved `fmtMoney`/
`proPriceLabel` into the existing `js/pricing/tiers.js` (they read
app.js's `CURR`/`AC` currency state by name, which — same reasoning —
is resolved at call time, long after app.js has run).

**(b) Two genuine boot IIFEs *were* real (currency grid + budget slider,
destination autocomplete) — both handled with a new deferred-init
pattern, not a raw move.** These two directly query specific `index.html`
elements (`el('currGrid')`, `el('budgetSlider')`, `el('destInput')`) at
the exact moment they run, so moving the *code* to a file that loads at a
different point genuinely would have changed *when* it runs relative to
the DOM — round 4 was right that this is a real hazard. The fix, applied
for the first time this round: keep the code's *execution point* fixed by
leaving a single function call in `app.js` at the exact original line,
and move only the code's *definition* — as a named function, not an
anonymous IIFE — to an earlier-loading file. `rwInitCurrencyBudget()` and
`rwInitDestAutocomplete()` (`js/ui/currency-budget.js`,
`js/ui/dest-autocomplete.js`) are the result: execution order is
byte-for-byte identical to before (verified with a Playwright pass that
also diffed the exact same scripted checks against an unmodified
`origin/main` worktree on a separate port, to catch anything a same-repo
before/after diff might miss), but the code no longer lives in `app.js`.

**(c) A third category emerged that round 4 didn't distinguish: IIFEs
that *look* like boot IIFEs but are actually already-defensive and don't
need the deferred-init treatment at all.** The ADSense + WhatsApp-FAB
IIFE (`js/misc/adsense-whatsapp.js`) checks `document.readyState` itself
and defers to `DOMContentLoaded` when the DOM isn't ready yet, and the
first-launch trailer-dismiss IIFE (folded into `js/ui/onboarding.js`)
queries `#intro`, which sits immediately after `<body>` in `index.html` —
long before any `<script>` tag — so it's always available regardless of
load position. Both moved as plain verbatim code, no wrapping needed.

**(d) The "residual handful of genuinely small, diverse feature
handlers"** round 4 judged "too entangled with the boot IIFEs
immediately before/after [them] to safely relocate" turned out to have
no actual entanglement — each is a self-contained set of functions with
no shared local state with its neighbors, just topical proximity in a
large file. Round 4's fear (fragmenting into many trivial single-function
files, or grouping unrelated features under an artificial theme) is a
real failure mode, so each was checked against it individually rather
than moved reflexively:
- `openPrivacyBadge`/`rwHandoffToPhone` -> `js/misc/trust-conversion.js`
  (a real, pre-existing pairing — one app.js section header already
  named both "PRIVACY TRUST ANCHOR + WEB-TO-APP HANDOFF")
- `DNA_QS`/`openDna`/`dnaPick`/`dnaSave`/`applyDna` -> new
  `js/misc/traveler-dna.js` (the `try{ applyDna(); }catch(e){}` top-level
  call — genuinely parse-time — stays in `app.js` at its original line)
- `PLAYSTORE_URL`/`renderRatings`/`openRateForm`/`paintStars`/
  `submitRating` -> new `js/misc/ratings.js`
- `STYLE_POOL`/`openProfile`/`profAv`/`profUpload`/`profPick`/`profSave`
  -> new `js/misc/profile.js`
- `openCrowdSpot` -> new `js/misc/crowd-spotter.js`
- `renderTicker`/`syncGo`/`track`/`rwTuskFeedback`/`rwTuskMiss`/
  `maybeNudge`/`pulseKey`/`pulseBump`/`pulseShow` -> new
  `js/misc/engagement.js` — the one deliberate *grouping* this round,
  justified because these five originally-adjacent app.js sections
  (TRAVEL ECONOMY LIVE TICKER, SYNC CIRCLE, FUNNEL TRACKER, CONVERSION
  NUDGE, TRAVEL PULSE) all share one real, pre-existing theme —
  anonymous, no-PII engagement signals and conversion nudges — already
  named as such by app.js's own section comments, not an invented one
- `rwSkyscannerUrl`/`rwSkyscannerToUrl` -> appended to the existing
  `js/booking/affiliate-links.js` (both build on that file's
  `rwAffLink()`)

Every extraction this round was grepped for call sites first (including
dynamically-generated `onclick=` strings), and every block was extracted
*programmatically* from the pre-edit `app.js` — exact line ranges sliced
with a small Python script, not manually retyped — specifically to
eliminate transcription risk on the emoji/Unicode-heavy HTML template
strings many of these functions build. Verified with `node --check` on
every touched file, `npm test` (27/27), `npm run check`, `npm run lint`
(errors *dropped* from 489 to 488 — `app.js` crossed below the
`max-lines:500` effective-line threshold entirely as a genuine result of
the shrinkage, not a side effect; warnings rose by 6, the same
`no-unused-vars`/`max-lines-per-function` false-positive pattern round 4
already documented), and a Playwright pass against a local static server
for every commit, including diffing scripted before/after checks against
an unmodified `origin/main` worktree for the two true deferred-init
extractions and the trailer-dismiss move, to positively confirm zero
behavior difference rather than merely assume it from the diff.

**What's left in `app.js` (629 lines) and why this really is the
practical floor now** — a fresh top-level scan (`grep -n '^function \|^var
\|^(function\|^try{' app.js`) after all of the above:

- **Core app state `var`s** other files close over by name at runtime:
  `AC`, `AUTH_ENABLED`, `isPro`, `freeLeft`, `activeProv`, `spends`,
  `itinBuilt`, `qrBuilt`, `MONTHS`, `MO`, `CURR`, `AI_MODELS`,
  `lastAiSource`, `PRICE_IN`/`PRICE_WW`, `payRegion`, `LEGAL`. Unchanged
  from round 4's assessment — these are the shared state the rest of the
  app reads and writes, not a "feature" to extract.
- **Two small, genuinely state-mutating boot blocks**: the free-search
  daily-reset IIFE (directly reassigns app.js's own `freeLeft` var — if
  moved to a file that loads *before* app.js's `var freeLeft = 5;`
  declaration runs, that later `var freeLeft = 5` would silently
  overwrite whatever the moved code computed, a real behavior change,
  not just a load-order nicety) and the provisional-Pro-expiry-check
  IIFE. Both are ~5-7 lines; the deferred-init pattern *would* work here
  too, but the effort-to-benefit ratio is poor at this size — noted as a
  future micro-optimization, not done this round.
- **Two calls into deferred-init'd boot wiring**
  (`rwInitCurrencyBudget()`, `rwInitDestAutocomplete()`) plus one
  `addEventListener` (`#tagsContainer`) between them — all genuinely
  parse-time, all deliberately left as thin call sites per (a)/(b) above.
- **The `try{ applyDna(); }catch(e){}` and `logPaint();` top-level
  calls** — genuinely parse-time invocations of functions now defined in
  earlier-loading files; the call sites themselves can't move without
  either duplicating them or reintroducing the exact hazard this round
  fixed elsewhere.
- **`submitUtr()`** (the function that actually writes a payment claim to
  Firestore, ~90 lines) and **`detectRegion`/`setPayRegion`/
  `applyRegionUI`** (the latter called at top level via `applyRegionUI();`)
  were deliberately left untouched again this round. Unlike round 4's
  broader "payments/entitlement code stays" framing, `CLAUDE.md`'s
  current, corrected scope explicitly permits relocating this kind of
  code (file location isn't special; only behavior changes need separate
  review) — so this isn't a hard rule, it's a judgment call: `submitUtr()`
  is the single highest-blast-radius function left in the file (it
  directly grants Pro entitlement and handles the fraud/anti-bot gates),
  it's already a clean, self-contained, non-fragmenting block, and moving
  it would add real review burden for zero architectural benefit. A
  future session with a specific reason to touch this code (not just "it
  could move") should feel free to relocate it verbatim with the same
  rigor used elsewhere in this document — but doing so purely to shave
  ~90 more lines off `app.js` is not recommended.
- **`openLegal`/`LEGAL`** (~10 lines) and **the mode-chip IIFE** (~8
  lines) are the last of the truly small handlers — extracting either
  now would be exactly the "many trivial single-function files" failure
  mode this document has warned against throughout; left as-is.
- **~150 lines are marker comments** documenting where earlier phases'
  code went (dating back to round 1) — genuinely useful for future greps
  (see the extraction methodology's step 3), not dead weight to clean up.

**This is a materially smaller and more honest "floor" than round 4's:**
629 lines vs. round 4's ~1,200, with every remaining block re-justified
individually above rather than described in aggregate. A future session
should still re-run the same fresh, skeptical scan before assuming this
is unchanged — `index.html` and the app's DOM structure can shift — but
should expect genuinely diminishing returns: what's left is core state,
thin deferred-init call sites, two parse-time function calls that can't
relocate without duplication, one deliberately-conservative payments
function, and a handful of blocks under 15 lines each.

## Low AI credit usage: `FUNCTION-INDEX.md`

**Before grepping the repo to answer "where is function X defined?" or
"which file owns feature Y?", read `FUNCTION-INDEX.md` first.** It's a
generated, flat lookup table — function name, defining file, line number,
and a best-effort one-line purpose — covering every top-level
`function NAME(...)` and `window.NAME = function` declaration across
`app.js` and all of `js/**/*.js` (877 entries as of this pass). Reading
that one file in full is far cheaper, in tokens and turns, than even a
single repo-wide `grep -rn "function someFunc"` across 115+ files,
and it's usually a single Ctrl-F away from the answer.

It's generated by `tools/generate-function-index.js` (a small, one-off,
regex-based line scanner — not a real AST parser, by design: it's meant
to be a cheap, "good enough" lookup table, not a build tool) via
`npm run index`. **Regenerate it after any modularization change that
adds, moves, or removes a top-level function** — a stale index actively
misleads a future session, which is worse than no index at all. The
script's own header comment documents exactly what patterns it does and
doesn't recognize (see `tools/generate-function-index.js`).

Example of the workflow this replaces: a future session asked "where is
`compareModels` defined?" would previously need
`grep -rn "function compareModels" .` (or worse, a blind read through
app.js). Instead: open `FUNCTION-INDEX.md`, search for `compareModels`,
find `js/ui/key-wizard.js` at the listed line — done, no repo scan.

## Known follow-ups (not done in this pass, tracked here so they aren't re-discovered from scratch)

- **`no-empty` (455 occurrences)** — mostly `catch(e){}` defensive
  blocks. Needs its own triage pass to distinguish "genuinely fine to
  swallow" from "silently hiding a real failure," at a scale too large
  for a single pass alongside other work.
- **`no-useless-escape` (15 occurrences)** — regex escapes that are
  unnecessary but not wrong; low bug risk, cosmetic cleanup. Not
  triaged this round — genuinely lower value than `no-redeclare`/
  `no-useless-assignment` were, per the task that requested this pass.
- ~~`no-redeclare` (10 occurrences) and `no-useless-assignment` (5
  occurrences)~~ — **triaged in round 5, both now at zero.** All 15
  were the same pattern: a short-named local (`place`, `v`, `sx2`, `an`,
  `gx`, `p`, `html`, `txt`, `elev`, `vHtml`, `devclass`) reused across
  mutually-exclusive branches (an early-`return`ed `if`, or an
  exhaustive `if`/`else-if`/`else` chain) within one long function, or a
  defensive `var x=''`/`var x=null` initializer that every branch
  overwrites before any read. Confirmed each case individually by
  reading the surrounding control flow (not just applying the rule
  mechanically) before renaming/de-initializing — no logic changed, only
  identifier names and removed-but-dead initial values. Verified with
  `node --check` on every touched file, `npm test`, `npm run check`, and
  a Playwright pass exercising the affected code paths directly (all 4
  `group-chat-social.js` message-kind branches, `rwDetectDevice()`,
  `openBooking()`'s empty- and non-empty-basket paths). Lint errors:
  488 → 473.
- Retiring `tools/check-line-limits.js` in favor of `npm run lint` as
  the `npm run check` gate is now closer: only `no-empty` (455) and
  `no-useless-escape` (15) remain untriaged among the error-level rules.

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
