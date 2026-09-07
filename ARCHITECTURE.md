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

As of this commit (post PRs #138-143, plus the subscription-vs-one-off
Cashfree gating pass), `app.js` is **575 lines** (down from ~19,300 at the
start of the modularization effort, down from 3,099 after the prior
"modularization-final" pass, down from 1,207 after "round 4", and down from
629 after "round 5" — the further changes since round 5 are incidental to
unrelated feature PRs #138-143 and this pass's `submitUtr()` one-line
rewire, not a new extraction round) and there are **137 files** under `js/`,
organized into **17 top-level subdirectories** (16 from round 5 plus the
new `js/admin/`) plus one nested subdirectory (`js/payments/providers/`),
plus **9 files** under `css/`. Two new top-level feature areas landed
since round 5:

- **`js/admin/` (6 files, added in PR #140)** — a real, data-grounded
  internal admin dashboard (business metrics, compliance, staff,
  referral liability, dev requests, investor summary). Loaded only by
  `admin/index.html` (a separate page, not part of the main app's
  `index.html` script chain) — see the `js/admin/` entry below.
- **`js/payments/providers/` (2 files, added in PR #142)** — provider
  implementations for the new pluggable payment gateway adapter
  (`js/payments/gateway-adapter.js`, also added in PR #142) — see the
  `js/payments/` entry below.

Run `npm run mod-status` before trusting any of these numbers — it
cross-checks this section's headline figures against the live repo and
prints PASS/DRIFT per number in under a second.

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

### `js/pricing/` — monetization mechanics (4 files)
- `subscription-plans.js` (149 lines) — the RECURRING subscription half of
  the former `tiers.js` (split in the subscription-vs-one-off Cashfree
  gating pass): defines the `RWPricing` global, `CONFIG.TIERS`
  (Free/Plus/Pro/Elite monthly+yearly), `FEATURE_LABELS`, and the
  tier-lookup helpers (`tierById`/`currentTier`/`hasFeature`/
  `yearlySavingsPct`) every purchase category resolves its granted
  benefits through — plus `fmtMoney` (generic currency display, moved
  verbatim from app.js in round 5; reads app.js's `CURR`/`AC` currency
  state by name, resolved at call time).
- `one-off-plans.js` (186 lines) — the ONE-OFF/one-time-purchase half:
  extends the `RWPricing` object `subscription-plans.js` creates (loaded
  right after it in `index.html`) with `CONFIG.FOUNDER_OFFER`/`LONG_TERM`/
  `SHORT_TERM`, the founder-offer gate helpers
  (`founderOfferOpen`/`founderGateLoad`/`founderGate`/`founderGateSnap`/
  `daysSinceLaunch`), and `proPriceLabel` (every call site passes the
  Founder offer's ₹100). See `PAYMENT-GATEWAY-ARCHITECTURE.md`'s
  "Subscription vs. one-off gating" section for the full plan-category
  mapping (this is the same mapping `js/payments/plan-picker.js`'s
  `pickPlan()` category argument uses to gate the Cashfree checkout
  option).
- `founder-seats.js` — PUBLIC Founder-offer seat-counter math (isolated,
  well-commented, unit-tested — see `tests/founder-seats.test.js`). Computes
  "seats left" from `pricing/founder.count` (the one counter every seat-grant
  path can legally increment, per firestore.rules) and the NMIMS
  Proposed/Official flag (`partnerships/nmims2026.officialConfirmed`),
  additionally reserving 500 seats once that partnership is Official. Read
  this file's header comment for the root-cause writeup of why the counter
  used to be wrong. Merged in from main after round 5's PR was opened —
  unrelated to the modularization effort, a bug-fix pass that landed
  concurrently.
- `referral.js` (262 lines) — referral/affiliate tracking: capture a
  `?ref=` link or typed code, validate against the referrer directory,
  persist it for the attribution window, and stamp it onto a purchase
  claim. Extracted from app.js in the modularization-final pass.
  Note: `submitUtr()` — the actual
  payment-claim writer that calls this file's `rwRefStamp()` — is
  payments/entitlement code and deliberately stays in `app.js`.

### `js/admin/` (6 files, added in PR #140)
Internal admin dashboard logic, loaded only by `admin/index.html` (a
separate page from the main app — not part of `index.html`'s script
chain). Each file is a self-contained tab's worth of read-mostly
reporting logic, deliberately honest about what it can and can't compute
from real data (per each file's own header comment, several explicitly
avoid fabricating a number/score where the underlying data doesn't
support one):
- `business-metrics.js` (189 lines) — real, data-grounded MRR/ARR/EBITDA
  for the "Business" tab, computed from approved payment claims matched
  against `RWPricing.CONFIG` (`js/pricing/tiers.js`) — nothing invented.
- `referral-liability.js` (110 lines) — real total commission owed to
  referrers/creators, computed from the same claims data.
- `compliance-checklist.js` (124 lines) — a plain, honest compliance
  checklist (not a fabricated "compliance score").
- `staff-manager.js` (111 lines) — view/edit UI for the existing
  referrer/staff registry.
- `dev-requests.js` (109 lines) — dev-request tracking; its own header
  notes there's no real, safe way for this web page to do more than
  track/display requests (no live code-execution capability implied).
- `investor-summary.js` (60 lines) — a clean, read-only rollup meant to
  be screenshotted for an investor update.

### `js/payments/` (4 files, plus a nested `providers/` subdirectory)
- `gateway-adapter.js` (added in PR #142; extended in the subscription-vs-
  one-off Cashfree gating pass) — the pluggable payment gateway adapter:
  `RWPaymentGateway`, the provider interface every concrete payment method
  implements, `register()`/`current()` (the original single-active-provider
  swap mechanism, still used by any future n-th provider and covered by
  tests/payment-gateway-adapter.test.js), and the newer `provider(id)`
  accessor that fetches one specific registered adapter by id — what
  `plan-picker.js`'s real checkout flow now uses instead of `current()`,
  since manual UPI must be a permanent baseline no `RW_PAYMENT_PROVIDER`
  flip can replace, and Cashfree needs to be simultaneously AVAILABLE
  alongside it (not swapped in for it) on one-off plans. Modeled on the
  same one-registry pattern `js/booking/affiliate-links.js` already uses
  for affiliate routing. See `PAYMENT-GATEWAY-ARCHITECTURE.md` for the full
  provider-interface contract, and its "Subscription vs. one-off gating"
  section for why `current()` stopped being what the real checkout flow
  uses for its two concrete gateways.
- `checkout.js` — Gumroad/direct-crypto-wallet checkout UI panels
- `partner-redeem.js` — `openPartnerRedeem()`, the partner claim-code ->
  Pro grant flow (NMIMS and future partners); moved verbatim from app.js
  in modularization round 4 (Pro-entitlement/Firestore code — relocation
  only, zero logic changes, per `CLAUDE.md`'s relocation-is-fine rule)
- `plan-picker.js` (489 lines) — the pay modal: UPI QR/deep-link helpers,
  the plan grid (now tagging every plan with a 'subscription'/'oneoff'
  category — see `pickPlan()`), the Cashfree-gating functions
  (`_renderCashfreeOption`/`payViaCashfree`), the founder-offer countdown
  banner, rotating testimonials, the pay/success overlay lifecycle, and the
  shared per-product fulfillment helpers `rwTierForPlan()`/
  `grantPurchase()` (extracted from manual-upi-adapter.js's verifyPayment()
  in the Cashfree fulfillment-gap fix, so Cashfree's real-time PAID
  confirmation grants the correct tier for whatever was actually
  purchased, not a blanket Pro grant). Moved verbatim from app.js in
  modularization round 4. `submitUtr()` (the function that actually
  writes a payment claim) deliberately stays in app.js — see "Modularization
  round 4" below

#### `js/payments/providers/` (3 files, added in PR #142; Cashfree added
in a later pass)
- `manual-upi-adapter.js` (184 lines) — implements the
  `RWPaymentGateway` provider interface for RoamWise's real, currently-live
  checkout method (manual UPI/UTR entry, the same flow `plan-picker.js`'s
  UI drives) — reached via `RWPaymentGateway.provider('manual_upi')` as a
  permanent baseline for every purchase category (see `gateway-adapter.js`
  above), not via `current()`.
- `cashfree-adapter.js` (160 lines) — implements the `RWPaymentGateway`
  provider interface for Cashfree, a real payment gateway (approved for
  one-off/one-time payments only so far — see
  `CASHFREE-INTEGRATION-SETUP.md`). Offered only for one-off-category
  plans via `plan-picker.js`'s `payViaCashfree()`
  (`RWPaymentGateway.provider('cashfree')`), gated on
  `RW_PAYMENT_PROVIDER==='cashfree'`. On a confirmed `PAID` status (polled
  from `worker/handlers/cashfree.js`'s status endpoint), calls
  `grantPurchase()` (plan-picker.js) with the actual purchased plan id —
  not a blanket Pro grant.
- `mock-adapter.js` (39 lines) — a test-only mock provider implementation.
  Explicitly **not** wired into production: not referenced by
  `index.html`, and no config value ever resolves `RW_PAYMENT_PROVIDER` to
  it (per the file's own header comment) — exists purely so the adapter
  interface has a second, trivial implementation to test against.

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
`worker.js` is a thin entry point (routing table + `fetch()`/`scheduled()`
dispatch only) that routes `/health`, `/ai` (Groq proxy), `/news`, `/events`,
`/events/refresh`, `/geo` (Nominatim proxy), and `/leads` (OpenStreetMap-
based partner lead finder) to per-route handlers under `worker/handlers/`
(`health.js`, `ai.js`, `news.js`, `events.js`, `geo.js`, `leads.js`), plus
shared HTTP helpers (`CORS`, `json`, `cached`, `EDGE`) in `worker/lib/http.js`,
and runs a daily cron (`wrangler.toml`). See `FUTURE-ARCHITECTURE-PLAN.md`
for its role in the Cloudflare migration plan.

Unlike the frontend's classic-`<script>`-tag / `app.js` constraint, this
Worker deploys via Cloudflare's "modules" format (`worker.js` uses
`export default { fetch, scheduled }`), which wrangler bundles with esbuild
before upload — real ES `import`/`export` between files works here, same as
Node, verified via `wrangler deploy --dry-run` producing one bundled output
containing all handlers. The one real constraint (inherent to Cloudflare,
not this codebase) is that exactly one file may be the `main` entry with
`export default { fetch, scheduled }` — every other file, including
`worker/handlers/*.js` and `worker/lib/http.js`, must stick to named
exports. A prior in-session attempt broke because a second file
(`events-refresh.js`) had its *own* competing `export default`, which
`wrangler.toml`'s single `main = "worker.js"` silently never invoked — not
because imports themselves don't work. See the header comment in
`worker/worker.js` for the full account.

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
`npm run lint`'s full findings, as of the `no-useless-escape` triage pass
(2026-09-06, following the `no-empty` pass / PR #133):

```
no-unused-vars:          1,103 warnings
max-lines-per-function:     32 warnings
max-lines:                    3 errors
--------------------------------------
TOTAL:    3 errors, 1,135 warnings
```

(`no-redeclare` and `no-useless-assignment` triaged to zero in round 5 —
see "Modularization round 5" above. `no-empty` triaged to zero in the
follow-up pass immediately after (PR #133), and `no-useless-escape`
triaged to zero in the pass immediately after that — see "Known
follow-ups" below for how all three were categorized. The `no-unused-vars`
baseline drifted from round 5's own recorded 1,100 to 1,103 in the
meantime — unrelated to any triage pass; per this doc's "Module map" note,
`js/pricing/founder-seats.js` merged into `main` from a concurrent,
unrelated bug-fix pass after round 5's PR landed, adding a few more of the
same pre-existing per-file-isolation false positives described below.
Both the `no-empty` and `no-useless-escape` passes changed zero warnings —
one added a comment inside an already-empty catch block, the other
removed only backslashes that regex/string semantics didn't need; neither
touched variable usage or logic.)

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
that pass and were tracked as open follow-ups; `no-empty` was triaged
to zero in PR #133 immediately after round 5 (see "Known follow-ups"
below) — every one of the 455 occurrences turned out to be an empty
`catch` block (no non-catch empty-block bugs were found), and every one
was a legitimate best-effort/defensive swallow, not a latent bug; each
got a one-line clarifying comment rather than a behavior change.
`no-useless-escape` (15) was triaged to zero in the pass immediately
after that (see "Known follow-ups" below) — every occurrence was a
genuinely-unnecessary escape (verified with before/after regex tests
against representative sample input, not just read-and-assume), so all
15 were mechanically removed with zero behavior change. Only `max-lines`
(3, pre-existing and re-confirmed as still the practical judgment — see
"Module map" above) remains as an open error-level follow-up.
`tools/check-line-limits.js` could now be retired in favor of `npm run
lint` as the CI gate with only 3 pre-existing, already-documented
`max-lines` violations standing between `npm run lint` and a clean run.

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
`app.js` and all of `js/**/*.js` (878 entries as of this doc's latest
regeneration — regenerate with `npm run index` any time you suspect
drift, per the note above). Reading that one file in full is far
cheaper, in tokens and turns, than even a single repo-wide
`grep -rn "function someFunc"` across 135+ files, and it's usually a
single Ctrl-F away from the answer.

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

### `CSS-INDEX.md`: the same idea for CSS classes, stylesheets, and partials

`FUNCTION-INDEX.md` only covers JS functions. Two other "where is X
defined/used?" questions come up just as often and previously meant a
repo-wide grep across 462+ HTML files: "where is `.tk-fold` actually
styled?" and "which pages include `partials/marketing-footer.html`?"
(or, just as commonly, "which pages link `guide-page.css`?"). Added in
round 5: `tools/generate-css-index.js` (sibling to
`tools/generate-function-index.js`, `npm run index:css`) generates
`CSS-INDEX.md` with three tables — CSS class -> defining file(s):line(s)
(859 classes across `css/**/*.css`, including selectors nested inside
`@media`/`@supports` blocks), stylesheet -> which HTML pages `<link>` it
(9 stylesheets, 462 HTML files scanned), and `data-include` partial ->
which pages include it (4 partials, `js/core/include-partial.js`'s
mechanism). Like `generate-function-index.js`, it's a deliberately
simple scanner, not a real CSS/HTML parser — its known limitations and
scope boundary (only `css/**/*.css` for the class table; the codebase's
other stylesheet, `itinerary-library/assets/preset-library.css`, is a
separate subsystem — see `CLAUDE.md`'s ex-PR #63 note — and isn't
covered there, though the stylesheet-usage table does track who links
it) are documented in the script's own header comment. Regenerate with
`npm run index:css` after adding/removing/renaming a CSS class, a
stylesheet `<link>`, or a `data-include` reference; `npm run index:all`
regenerates both indexes in one command.

### `sitemap.xml` / related-links: regenerate after adding any content page

Two more generated artifacts drift the same way `FUNCTION-INDEX.md` and
`CSS-INDEX.md` do, and PR #138's `repo-health-check.yml` (added in PR #146)
now runs `npm test` in CI, which includes `npm run sitemap:check` and
`npm run related-links:check` — so drift here fails the build, not just
looks stale. `tools/generate-sitemap.js` (`npm run sitemap`) rebuilds
`sitemap.xml` from every file actually on disk under `guides/`, `blog/`,
and `trips/`; `tools/generate-related-links.js` (`npm run related-links`)
rewrites the auto-generated "Related guides/articles/itineraries" block
(delimited by `<!-- rw:related-links:start/end -->`) near the bottom of
every page in those same three directories. **Any change that adds,
removes, or renames a page under `guides/`, `blog/`, or `trips/` — whether
by hand, by upload, or by an agent script — must run
`npm run sitemap && npm run related-links` and commit the result before
merging**, or the next `npm test` run (locally or in CI) fails on drift.
The two scheduled content-publishing workflows that write new `guides/`
pages automatically (`.github/workflows/roamwise-agent-publisher.yml`,
daily, and `.github/workflows/roamwise-agent-weekly-seo.yml`, weekly) each
run both commands as a step before their commit step, specifically to
prevent this recurring — a manual page addition (e.g. via the GitHub
web upload UI) is the remaining case that still needs a human to remember
this rule.

### `npm run mod-status`: "is there more to do here, and is this doc still accurate?"

Also added in round 5: `tools/modularization-status.js` answers two
questions a session otherwise has to re-derive by hand at the start of
every modularization pass. First, a **drift check** — it parses the
three headline numbers out of this document's own "Module map" opening
paragraph (app.js line count, js/ file count, css/ file count), compares
them against the actual current repo state, and prints a clear
PASS/DRIFT verdict per number, so a stale ARCHITECTURE.md is caught in
under a second instead of silently misleading a session (see this
file's own "History" section for why that matters — it's the exact
failure mode a stale contract file caused once already in this repo).
Second, a **recent-history view** — the last 15 commits matching
`git log --oneline --all -i --grep=modulariz` (the same command this
document's own "History" section already tells a session to run by
hand), so "what did the last few passes actually do" is a single `npm
run mod-status` instead of a manual `git log` + grep + read. Both checks
together typically answer "is there more to do here" well enough that a
session doesn't need to open this whole ~850-line document just to get
oriented — though for anything beyond a quick sanity check, this
document (and a fresh top-level `grep` of `app.js`, per "Modularization
round 5"'s own advice) remains the source of truth.

## Known follow-ups (not done in this pass, tracked here so they aren't re-discovered from scratch)

- ~~`no-empty` (455 occurrences)~~ — **triaged to zero in PR #133.**
  Every one of the 455 turned out to be an empty `catch(e){}` (or a
  differently-named binding — `e2`, `err`, `_`) with genuinely nothing
  else in the block — not a single non-catch empty block (`if(x){}`,
  an incomplete function body, etc.) was found anywhere in the codebase,
  so the "empty stub that looks like a forgotten bug" and "dead/vestigial
  block, safe to delete" categories this kind of triage usually has to
  split out both turned out to be empty sets here. Every catch was one of
  a small number of repeated best-effort/defensive-swallow patterns —
  analytics pings (`track(...)`), non-critical Firestore writes/reads,
  `localStorage`/`JSON.parse` best-effort caching, haptics/toast/voice/
  render calls that are nice-to-haves not blocking paths, and boot-sequence
  steps deliberately isolated so one failing step (e.g. push-notification
  setup) can't take down the rest of app init — including in
  `js/payments/plan-picker.js`, `js/pricing/referral.js`, and
  `js/boot/auth-init.js`, which were read first and most carefully given
  their entitlement/payment/auth proximity, per `CLAUDE.md`'s rule that
  behavior changes there need separate review (none were made — this pass
  is comment-only). Fixed with a scripted pass: for each occurrence,
  brace-matched backward from the `catch` to its own `try` block (handling
  nested `try`/`catch` on the same line correctly, e.g.
  `js/itinerary/journey-movie.js`'s `try{ctx=new AC(); try{ctx.resume();}catch(e2){}...}catch(e){}`)
  and classified the try-body text against the pattern list above to pick
  a matching one-line clarifying comment (e.g. `/* analytics best-effort,
  ignore */`, `/* best-effort Firestore write, ignore */`), falling back to
  a generic `/* best-effort, ignore */` when no more specific pattern
  matched — never a blind, context-free comment. A hand-reviewed sample
  (roughly 1-in-15, stratified across all 84 touched files, plus every
  occurrence in the three payments/auth/referral files above) confirmed
  no case was actually a latent bug worth flagging for a human decision.
  Verified with `node --check` on all 84 touched files, `npm test`
  (45/45), `npm run check`, and `npm run lint` (455 → 0 `no-empty`
  errors, 473 → 18 total errors, zero change to the 1,135 warnings since
  no variable usage or logic changed — only comments were inserted into
  already-empty blocks).
- ~~`no-useless-escape` (15 occurrences)~~ — **triaged to zero
  (2026-09-06).** Every occurrence was inspected individually rather than
  bulk-autofixed, split into two genuine patterns, both confirmed
  behavior-neutral with a before/after regex or string test against
  representative sample input, not just by reading the diff:
  (1) `\/` and `\-` inside regex character classes
  (`js/booking/pnr-parser.js` lines 12/14, `js/itinerary/pdf-assets.js`
  line 41, `js/ui/card-painter.js` line 101) — `/` never needs escaping
  inside a `[...]` class per the ECMAScript grammar (only the bare
  delimiter-adjacent `/` outside a class does, which is why some `\/` in
  these same lines were correctly left alone), and a trailing `-` in a
  class isn't treated as a range starter; tested each regex against
  train-SMS/date/wikimedia-thumbnail-URL sample strings before and after
  and confirmed identical match results. (2) `\'` inside `'...'`-delimited
  plain strings or inside regex literals (`js/itinerary/build.js` lines
  53-54, `js/itinerary/share.js` line 20, `js/misc/eco-safety.js` line
  301, `js/social/group-chat.js` line 30) — a backslash-escaped quote
  character that doesn't match the enclosing string's own quote style (or
  that appears inside a regex literal, which isn't quote-delimited at
  all) is a no-op; confirmed each string/regex's runtime value is
  byte-for-byte identical before and after. No occurrence changed
  semantics; all 15 were safe, mechanical removals. Verified with
  `node --check` on every touched file, `npm test`, `npm run check`, and
  `npm run lint` (18 → 3 total errors, zero change to the 1,135 warnings
  since no variable usage or logic changed — only redundant backslashes
  were removed).
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
- `npm run lint` is now down to 3 total errors, all `max-lines`
  (`js/copilot/core.js`, `js/data/destinations.js`,
  `js/itinerary/pdf-export.js` — pre-existing, re-confirmed in this pass
  as still the correct judgment, not re-split; see "Module map" above
  for why each is a cohesive unit). `no-empty`, `no-redeclare`,
  `no-useless-assignment`, and `no-useless-escape` are all at zero.
  This is likely the practical floor for `npm run lint`'s error count
  without either (a) further splitting the 3 `max-lines` files, which
  prior passes and this one both judged not worth the SRP cost, or
  (b) raising the `max-lines` threshold — neither is a mechanical/
  comment-only change, so neither was done here. Retiring
  `tools/check-line-limits.js` in favor of `npm run lint` as the
  `npm run check` gate is now realistic whenever a future session wants
  to make that switch.

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
- **`PAYMENT-GATEWAY-ARCHITECTURE.md`** — the provider interface for
  `js/payments/gateway-adapter.js` + `js/payments/providers/*`, and the
  step-by-step guide for adding a new payment gateway. Read before
  touching `js/payments/**`.
