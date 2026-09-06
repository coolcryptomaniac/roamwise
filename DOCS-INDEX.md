# Documentation index

Every `.md` file in the repo (root + nested), what it's actually for, and
whether it's still trustworthy. **Read this first, before opening any other
doc**, to avoid burning AI credits re-discovering which of the ~65 docs in
this repo are relevant to your task. Ordered by relevance-priority for a
typical new AI session: architecture/contract docs first, then generated
indexes, then feature-specific and business docs, then historical/superseded
ones — clearly marked so you can skip them unless your task specifically
needs that history.

Verified against the repo at commit `e96082d` (2026-09-05) on `main`. Status
meanings: **current** = actively accurate, keep reading it; **reference** =
accurate but narrow-scope/supplementary, read only if your task touches that
area; **historical** = describes a concluded task or superseded content, skip
unless you specifically need that history; **stale** = contains claims that
no longer match the repo — flagged explicitly below and in the PR summary.

## Core contract & architecture — read these for almost any task

| File | Purpose | Status | Read this when... |
|---|---|---|---|
| `CLAUDE.md` | The binding AI working contract: read-first order, modularization rules, extraction methodology, sensitive-code scope. | current (one stale figure — see note) | Every session, first. **Note:** its "app.js is down to ~10,600 lines" line is stale — `app.js` is actually 629 lines as of this commit (see `ARCHITECTURE.md`). Not fixed here per this task's scope (docs-only index, no content edits); flagged for a future update. |
| `ARCHITECTURE.md` | Ground-truthed module map, load order, script-tag dependency order, `js/` structure, "low AI credit usage" workflow. | current (dated 2026-09-05, matches repo) | Before any refactor, before asking "where does X live", before touching `index.html`'s script tags. |
| `AI-ROLES-AND-HANDOFF.md` | Repo-wide safety rules shared between ChatGPT/Claude sessions: rule 7 (auth/payments/entitlement/Firestore/deployment need separate review), PR handoff protocol. | current | Before any change touching auth, payments, Pro entitlement, or Firestore rules. |
| `FUNCTION-INDEX.md` | Auto-generated index of all ~877 top-level functions in `app.js`/`js/**` with file + line + purpose. | current (auto-gen, 2026-09-05, regen with `npm run index`) | Before grepping the repo to find where a function is defined — check here first. |
| `CSS-INDEX.md` | Auto-generated index of CSS class selectors, stylesheet links, and `data-include` partials. | current (auto-gen, 2026-09-05, regen with `npm run index:css`) | Before grepping for where a CSS class is styled, or which HTML files link a stylesheet. |
| `FUTURE-ARCHITECTURE-PLAN.md` | Honest staged plan for Cloudflare Pages/Workers, TypeScript, React/Next.js, Python, Capacitor upgrades, mesh networking — what's actionable now vs. real future work. | current, one stale detail | §3 says `TYPESCRIPT-MIGRATION.md` "doesn't exist yet in main" — it has since merged (see next row); everything else in the doc still holds. Read before proposing any hosting/framework/language change. |
| `TYPESCRIPT-MIGRATION.md` | How the JSDoc-based, zero-build-step TypeScript-readiness layer works (`tsc --noEmit`, `// @ts-check`, `js/global.d.ts`) and how to convert another file. | current (matches live `tsconfig.json`/`package.json`) | Before adding type annotations to a `js/` file, or running `npm run typecheck`. |
| `CLOUDFLARE-MIGRATION-SETUP.md` | Literal, dashboard-click-level guide for migrating hosting to Cloudflare Pages/Workers/R2/Workers AI while keeping Firestore. | current (verified line-by-line against `worker/wrangler.toml` — matches exactly) | Before touching Cloudflare Pages/Workers deployment, or `worker/wrangler.toml`. |

## Worker (Cloudflare) — read when touching `worker/`

| File | Purpose | Status | Read this when... |
|---|---|---|---|
| `worker/WHATS-LEFT.md` | Current wiring status of the Worker: what's deployed vs. not, `rw-config.js`'s `backend`/`workerUrl` state. | current (verified: `rw-config.js` still has `backend:'firebase'`, `workerUrl:''` — Worker is still disconnected exactly as this doc says) | Before deploying or wiring up the Worker — this is the "what actually needs doing" doc. |
| `worker/SETUP.md` | CLI (`wrangler`)-based Worker deploy guide, the `backend` switch, GitHub Actions auto-deploy. | current | Deploying the Worker from a computer with Node. |
| `worker/SETUP-STEP-BY-STEP.md` | Same CLI deploy path, more detailed/beginner-oriented, plus the free-tier CDN-caching math. | current | Same as above, if you want the fuller walkthrough + cost explanation. |
| `worker/TUTORIAL.md` | Condensed, phone-only (Cloudflare dashboard, no terminal) deploy walkthrough. | current — supersedes `SETUP-ON-ANDROID.md` | Deploying the Worker from a phone with no computer access. |
| `worker/SETUP-ON-ANDROID.md` | Earlier, longer version of the same phone-only dashboard deploy walkthrough. | historical/superseded — near-duplicate of `worker/TUTORIAL.md`, same steps, more verbose | Skip; use `worker/TUTORIAL.md` instead. Not deleted per this task's scope (see PR notes). |
| `worker/readme.md` | Empty (1-byte placeholder). | historical/empty | Skip. |

## Payments & marketplace — read when touching `payments/` or `partner/`

| File | Purpose | Status | Read this when... |
|---|---|---|---|
| `payments/README.md` | The server-side Smart Payment Router (separate Worker): provider routing, `/v1/payments/*` API, webhook signature verification, secrets list. | current | Before touching payment-provider routing/webhooks. Payments/entitlement code — separate review per `AI-ROLES-AND-HANDOFF.md` rule 7. |
| `PAYMENT-GATEWAY-ARCHITECTURE.md` | The client-side pluggable payment adapter (`js/payments/gateway-adapter.js` + `js/payments/providers/*`): the provider interface, how `RW_PAYMENT_PROVIDER`/`config/app.PAYMENT_PROVIDER` selects a provider, and the step-by-step guide for adding a new gateway. Corrects an earlier assumption that this checkout was Razorpay-based — it's actually the plain manual-UPI/UTR flow; see `REVENUE-INTEGRATIONS.md`/`BUSINESS-FINANCE-SETUP.md` (Razorpay is still a *future* option, not live). | current | Before touching `js/payments/**` or adding a second payment provider to this client checkout flow. Payments/entitlement code — separate review per `AI-ROLES-AND-HANDOFF.md` rule 7. |
| `partner/MARKETPLACE.md` | Canonical runtime contract for `/partner/`: trust/booking-integrity invariants, Host Studio fields, script load order. | current | Before touching anything under `/partner/`. |
| `partner/README.md` | `/partner/` overview: host/traveller lifecycle, data model, security-rules pointer. | current | Same as above — read alongside `MARKETPLACE.md`. |
| `partner/TEST-CHECKLIST.md` | Manual regression checklist (demo mode + live-account smoke test + provider setup) for the partner marketplace. | current | Before/after changing `/partner/` code, as a manual verification checklist. |
| `partner/PR-DESCRIPTION.md` | Description of the specific past PR that replaced the `/partner/` portal with the current role-based workspace. | historical | Only if you need the history of *why* the current `/partner/` shape exists. |
| `partner/readme.md` | Empty (1-byte placeholder; lowercase duplicate of `README.md` in the same folder). | historical/empty | Skip. |

## Itinerary / cinematic preset library

| File | Purpose | Status | Read this when... |
|---|---|---|---|
| `itinerary-library/README.md` | The preset library's own behavior/integration contract: what's in it, decision rule for when to use a cached preset vs. live planner, integration snippet. | historical task, but **content is still the accurate integration contract** — see `CLAUDE.md`'s "History" section, which explicitly keeps this one live as a reference | Before touching `itinerary-library/` or its `preset-loader.js` integration. |
| `itinerary-library/CLAUDE-CODE-MERGE-NOTES.md` | One-time merge checklist used to land `itinerary-library/` into `main`. | historical — task complete (PR #63 merged) | Only for historical context on how the initial merge was done. |
| `CLAUDE-ITINERARY-DEBUG-TEST.md` | The original task brief that scoped an earlier Claude session to debugging/validating the itinerary preset library + Cinematic v2 on `feature/itinerary-library-v1.1` (PR #63). | historical/superseded — explicitly closed out in `CLAUDE.md`'s own "History" section | Skip for current work; only relevant if you need to see what that specific verification task originally required. |
| `CINEMATIC-V2-CHANGELOG.md` | User-visible changelog for the Cinematic Journey v2 UX rewrite (horizontal carousel, Leaflet removal, Journey Cockpit). | historical record of a shipped, merged change set — describes real, still-live behavior | Reference if you need to understand why the current Cinematic UI looks the way it does. |

## Business / growth / operations docs

| File | Purpose | Status | Read this when... |
|---|---|---|---|
| `PROJECT-STATE.md` | Rolling dev diary (v52→v76+ feature-by-feature history) plus Android build/signing/Gradle notes. Written so a reset sandbox can recover context. | reference/rolling changelog — genuinely current as a log, but Android build paths (`/home/claude/rw2/...`) refer to an external build environment, not this repo's tree | Need feature history ("why does X work this way"), or doing an Android/Gradle build in that external environment. |
| `PRICING-REFERRAL-MATH.md` | Worked arithmetic for the pricing ladder + referral/creator commission economics, sourced from live `app.js`/`referral-data.js`/`finance-data.js` config. | current, most rigorously cross-checked doc in the repo | Before proposing any pricing or referral-commission change. |
| `AUTOPILOT-PLAYBOOK.md` | Weekly solo-founder operating rhythm (product/marketing/SEO/finance/research/community) and the "$1M/yr" revenue-stack math. | current | Planning the weekly cadence of founder work. |
| `BUSINESS-FINANCE-SETUP.md` | Practical India-specific business banking/UPI/bookkeeping setup (Udyam, current account, Zoho Books, intern access). | current (dated July 2026) | Setting up or explaining the business-finance stack. |
| `REVENUE-INTEGRATIONS.md` | Concrete affiliate/POD/payment programmes to sign up for, with rates and a priority order. | current (rates dated July 2026 — confirm on signup) | Adding or evaluating a revenue integration. |
| `CREATOR-OUTREACH.md` | Legitimate (non-scraping) creator discovery + outreach process, the Applied/Partner/Featured commission ladder, founder-offer hard cap. | current, one stale figure | Its worked example uses a ₹2,999 Pro-yearly price; live Pro yearly is ₹2,499 per `RWPricing.CONFIG` (`PRICING-REFERRAL-MATH.md` §3 already notes and re-derives this at the correct price — read that section alongside this doc). |
| `CONTENT-GROWTH-PLAN.md` | 3-month content/growth plan for Febin: pillars, weekly cadence, metrics, guardrails, cross-referenced to `SEO-BRAND-PLAN.md`/`CREATOR-OUTREACH.md`/`COMPETITOR-WATCH.md`. | current — appears to be the later, integrated version | Planning or executing content/growth work. |
| `CONTENT-GROWTH-PLAN-FEBIN.md` | An earlier 3-month content/growth plan for Febin covering the same channels, cadence and monthly goals as `CONTENT-GROWTH-PLAN.md`, as a week-by-week checklist. | historical/superseded — genuine content duplication with `CONTENT-GROWTH-PLAN.md` (same person, same 3-month scope, same channel cadence), not just topical overlap | Skip; use `CONTENT-GROWTH-PLAN.md`. Not merged/deleted per this task's scope. |
| `COMPETITOR-WATCH.md` | Why there's no scraping agent for competitor research, the legitimate manual method, and a standing competitor assessment. | current (dated July 2026, self-flagged "re-verify each quarter") | Doing competitor research, or asked to build a scraper (the doc explains why not to). |
| `SEO-BRAND-PLAN.md` | Brand/entity-SEO plan for owning "RoamWise" search results — structured data, Search Console, canonical domain, backlinks. | current | Any SEO/brand-search work. |
| `GROWTH-AND-MARKET-INTEL.md` | Dated (2026-08-28) market/competitive intel digest (Naval Ravikant, YC, travel-AI M&A) plus two concrete action items (unused config keys, a referral-sharing product decision). | current, explicitly self-flagged as decaying — re-run its own research prompt periodically | Needing outside-market context, or picking up its two flagged action items. |
| `BLOCKCHAIN-ASSESSMENT.md` | Per-idea verdict on blockchain/crypto features (payments, NFTs, loyalty tokens) — mostly "no", with reasoning and revisit conditions. | current | Asked to evaluate or build any blockchain/crypto feature — read this first. |
| `ROADMAP-AGENT.md` | How the weekly automated roadmap-review GitHub Actions agent works (two modes, boundaries, local testing). | current (verified against `tools/roadmap-agent/*` and `.github/workflows/roadmap-agent.yml`, both present) | Touching the roadmap-agent tooling or workflow. |
| `SETUP.md` (root) | 10-minute setup guide for the daily-ops GitHub Actions agent (health/funnel reports, SEO page publisher). | current (verified against `.github/workflows/roamwise-agent-daily.yml` / `roamwise-agent-weekly-seo.yml`, both present) | Setting up or explaining the daily ops agent. Note: shares its exact content with `agent/` conceptually but there is no separate `agent/readme.md` content — that file is an empty stub. |
| `firestore-rules-history/README.md` | How to snapshot and deploy `firestore.rules`: full-replace-only publishing, `meta/rulesVersion` bump. | current | Before deploying/publishing Firestore security rules. |
| `FIRESTORE-RULES-CHANGES.md` | Block-by-block walkthrough of `firestore.rules`, written for a **141-line** version of the file "shipped in this zip". | **stale** — the live `firestore.rules` is now **1,416 lines**; this doc's line numbers and "which blocks exist" list no longer match the current file at all | Do not rely on this for current rules content. For current deploy process use `firestore-rules-history/README.md`; for current rules content, read `firestore.rules` directly. Flagged for the repo owner — this is the most out-of-date doc found in this audit. |
| `MESH-NETWORK-PLAN.md` | Planning-only spec for Android Nearby Connections API (offline device-to-device mesh) — blocked on access to a separate `roamwiseapkaabbuild` repo. | current (explicitly spec-only, no implementation expected here) | Only relevant once access to `roamwiseapkaabbuild` exists; otherwise skip. |
| `PUBLIC-PRIVATE-INVENTORY.md` | Full inventory of public vs. private URLs/collections and who can read what, per Firestore rules. | current (dated 24 July 2026) | Before exposing/hiding a route, or auditing what's public. |

## Build / setup guides (companion Android build project)

These describe a **separate Capacitor/Android build package** (a `capacitor-roamwise`/`www/` folder distributed outside this repo's own `.github/workflows/`, which has no Android build workflow). Treat as reference for that companion build process, not for this repo's CI.

| File | Purpose | Status | Read this when... |
|---|---|---|---|
| `BUILD-STEPS.md` | Direct CLI commands (`npx cap ...`, `gradlew bundleRelease`) to build the Capacitor Android app on a computer. | reference — accurate for its own companion-project scope, not part of this repo's tracked build tooling | Building the Android APK/AAB from a computer. |
| `HOW-TO-BUILD-ON-PHONE.md` | Same Android build, via a phone-only GitHub Actions workflow in a **different** repo the user creates. | reference — same scope note as above; the workflow it describes is not `roamwise`'s own `.github/workflows/` | Building the Android APK/AAB from a phone with no computer. |

## Small / stub docs (still real content)

| File | Purpose | Status | Read this when... |
|---|---|---|---|
| `generator/README.md` | One-line note: this folder is the auto-SEO page generator for `/guide/`. | current | Touching `generator/`. |
| `icons/readme.md` | One-line note: canonical master icon source + which files are auto-generated from it. | current | Regenerating or replacing app icons. |

## Root README — flagged as orphaned/stale

| File | Purpose | Status | Read this when... |
|---|---|---|---|
| `README.md` (root) | Describes integrating a standalone "RoamWise Opening Bundle" (an intro-animation loader: `roamwise-opening.css`/`.js`, poster/video assets). | **stale/orphaned** — none of `roamwise-opening.css`, `roamwise-opening.js`, or any reference to them exist anywhere in the current repo (`index.html` included); this bundle was never integrated, or was removed, and the doc was never updated or replaced | Do not treat this as "the repo README" — it isn't a project overview. Flagged for the repo owner: either the bundle should be integrated, or this file should be rewritten to actually introduce the repo, or removed. Not changed here per this task's scope (docs-only index, no content edits/deletions). |

## Empty placeholder files (no content — directory git-keepers)

These are all 1-byte (effectively empty) `readme.md`/`Read.md` files that exist only to make otherwise-asset-only directories visible in git. None contain documentation.

`agent/readme.md`, `assets/readme.md`, `assets/audio/readme.md`, `blog/readme.md`, `career/Readme.md`, `careers/readme.md`, `data/readme.md`, `deck/readme.md`, `guides/Read.md`, `help/readme.md`, `invest/readme.md`, `legal/readme.md`, `nmims/readme.md`, `nmims/mou/readme.md`, `nmims/proposal/readme.md`, `partner/readme.md`, `staff/readme.md`, `team/readme.md`, `tools/readme.md`, `trips/readme.md`, `worker/readme.md`.

**Status: skip always** — opening any of these costs a tool call for zero information.

---

## Summary of meaningfully stale content found (beyond "historical by design")

Flagged here for the repo owner's attention — none of these were edited by this
docs-index PR (out of scope; see task notes), but they may be worth a
follow-up content fix:

1. **`CLAUDE.md`** — the "app.js is down to ~10,600 lines" claim in its
   "Current architecture" section is stale. Actual `app.js` is **629 lines**
   as of this commit (`ARCHITECTURE.md`'s own ground-truthed figure).
2. **`FIRESTORE-RULES-CHANGES.md`** — written against a 141-line
   `firestore.rules`; the live file is now 1,416 lines. Line numbers and the
   block list no longer correspond to the deployed rules at all. The most
   out-of-date doc found in this audit.
3. **`README.md`** (root) — describes an "Opening Bundle" integration
   (`roamwise-opening.css`/`.js`) that does not exist anywhere in the current
   repo or `index.html`. Either never integrated or since removed; the root
   README doesn't describe the project at all.
4. **`FUTURE-ARCHITECTURE-PLAN.md`** §3 — says `TYPESCRIPT-MIGRATION.md`
   "doesn't exist yet in main"; it has since merged (verified: `tsconfig.json`,
   `npm run typecheck`, and the doc itself are all present on `main`).
5. **`CREATOR-OUTREACH.md`** — its margin worked-example uses a ₹2,999
   Pro-yearly price; live config prices Pro yearly at ₹2,499
   (`PRICING-REFERRAL-MATH.md` §3 already carries the corrected figures).
