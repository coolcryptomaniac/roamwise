# Cloudflare Migration Setup

This is a step-by-step, literally-followable setup guide for moving
RoamWise's hosting to Cloudflare (Pages for the static site, Workers for
the API, R2 for storage, Workers AI as an optional AI backend) while
keeping Firestore exactly as it is today.

This document is deliberately concrete: exact dashboard clicks, exact
field values, exact file syntax. It extends the "Cloudflare Pages
migration" and "Cloudflare Workers" sections already in
`FUTURE-ARCHITECTURE-PLAN.md` — read those first for the high-level
rationale; this doc is the "now open the dashboard and do it" companion.

It does **not** change any live app behavior. It adds documentation and
inert config (commented-out or clearly-placeholder blocks in
`worker/wrangler.toml`) only.

---

## 0. What's already known (don't re-diagnose this)

A prior session already diagnosed why the Cloudflare "Workers Builds:
roamwise" check has been failing since the repo's first commit:

1. The Cloudflare dashboard project's **Root Directory** is not set to
   `worker/` — it's building from the repo root, where there is no
   `wrangler.toml` for it to find.
2. **Name mismatch**: the Cloudflare dashboard project is named
   `roamwise`, but `worker/wrangler.toml` declares `name = "roamwise-api"`.
3. `worker/wrangler.toml`'s KV namespace `id` is still the literal
   placeholder string `PASTE_THE_ID_HERE`.

All three require a human with Cloudflare account/dashboard access to fix
— none are fixable by a code-only change. Section B below gives the exact
dashboard steps. **This document does not change `worker/wrangler.toml`'s
`name` field or its KV namespace `id`** — see §B for why, and what a human
needs to click instead.

---

## A. Cloudflare Pages (static site hosting — replaces GitHub Pages)

RoamWise is a 100%-static site today: `index.html` at the repo root,
`app.js` and `js/**` loaded via classic `<script>` tags, no build step
(`.github/workflows/static.yml` uploads the entire repo as-is). Cloudflare
Pages serves a static directory the exact same way — this is a
deploy-target swap, not an app change.

### A.1 Create the Pages project

1. Go to **dash.cloudflare.com** → **Workers & Pages** → **Create**.
2. Choose **Pages** → **Connect to Git**.
3. Authorize Cloudflare's GitHub App if prompted, then select the
   `coolcryptomaniac/roamwise` repository.
4. On the "Set up builds and deployments" screen, enter exactly:

   | Field | Value |
   |---|---|
   | Project name | `roamwise` (or `roamwise-pages` if you want it visually distinct from the Workers project in the dashboard list — either is fine since Pages and Workers projects live in separate namespaces and can share a name) |
   | Production branch | `main` |
   | Framework preset | **None** |
   | Build command | *(leave empty)* |
   | Build output directory | `/` (repo root — this is where `index.html` already lives; there is nothing to compile) |
   | Root directory (advanced) | `/` |

5. Click **Save and Deploy**. Cloudflare will do a first build (a no-op
   copy, since there's no build command) and give you a
   `https://<project-name>.pages.dev` preview URL.

### A.2 Environment variables — honest answer: none required

Checked `rw-config.js` and `app.js` for anything that looks like a
build-time secret or API key. `rw-config.js` is a plain, checked-in static
file — `window.RW_CONFIG` (backend mode, feature flags, map style URLs)
and the client-side Firebase config live directly in the repo as
committed JS, not injected via environment variables at build time. There
is no build step for Cloudflare Pages to inject anything into anyway.
**You do not need to set any environment variables for the Pages
project.** If a future change introduces a real build step (e.g. the
Vite/React path discussed in `FUTURE-ARCHITECTURE-PLAN.md` §4), revisit
this — that's out of scope today.

### A.3 Smoke-test the `.pages.dev` URL before touching DNS

Open `https://<project-name>.pages.dev` and manually verify the app loads
and matches the live site's real content (home screen renders, itinerary
search works, no console errors from missing assets/paths). Do this
before any DNS change — Cloudflare Pages and GitHub Pages can both serve
the repo simultaneously with zero conflict as long as the custom domain
still points at GitHub Pages.

### A.4 Custom domain cutover (`roamwise.co.in`)

The repo's `CNAME` file (`roamwise.co.in`) is GitHub Pages' custom-domain
marker. To move the domain to Cloudflare Pages **without downtime**, do
this in order:

1. **Add the domain to the Pages project first, before touching DNS**:
   Pages project → **Custom domains** → **Set up a custom domain** →
   enter `roamwise.co.in` → follow the prompt. Cloudflare will tell you
   it's "Pending" until DNS is updated — that's expected, and harmless;
   GitHub Pages keeps serving the domain in the meantime.
2. Cloudflare will show you the exact DNS record it needs. For a Pages
   custom domain this is almost always a **CNAME record** at the root
   (`roamwise.co.in` → `<project-name>.pages.dev`) — if your DNS provider
   doesn't support a CNAME at the zone apex, Cloudflare's own DNS supports
   "CNAME flattening" at the apex, which is one more reason to consider
   moving the domain's nameservers to Cloudflare DNS as part of this
   migration (optional, and a separate decision from Pages/Workers
   hosting — you can use Cloudflare Pages with any DNS provider that
   supports the record type it asks for).
3. Only **after** the domain shows verified/active in the Pages project
   dashboard, update the actual DNS record at your registrar/DNS provider
   to point at Cloudflare Pages per its exact instructions.
4. Once `roamwise.co.in` resolves to Cloudflare Pages and you've confirmed
   the live domain (not just the `.pages.dev` URL) serves the app
   correctly, go to the GitHub repo → **Settings → Pages** and remove the
   custom domain binding there (or leave the `CNAME` file in the repo but
   disable the GitHub Pages custom domain in the Pages settings UI) so
   GitHub Pages no longer claims the same hostname.

This order (Pages project verified working → then DNS flip → then remove
the old binding) is what avoids a window where the domain resolves to
nothing or to a broken half-configured state.

### A.5 What happens to `.github/workflows/static.yml`

Recommendation: **keep it, disabled but not deleted**, for a rollback
window. Two ways to "disable" without deleting:
- Comment out the `push: branches: [main]` trigger (leave
  `workflow_dispatch` so you can still run it manually if you need to
  roll back), or
- Leave the workflow as-is (it will keep deploying to GitHub Pages' own
  `*.github.io`/Pages Settings-configured URL) and simply don't point the
  custom domain at it anymore — it becomes a free, always-current mirror
  you can re-point DNS back to in minutes if Cloudflare Pages ever has an
  incident.

Either approach is a code-only change to `.github/workflows/static.yml`
if you choose to make one — this doc does not modify that file, since the
decision (disable vs. leave running as a silent mirror) is a judgment
call for whoever executes the cutover, not something to decide in a docs
PR.

---

## B. Cloudflare Workers (fix the existing `worker/` project)

### B.1 Fix the dashboard misconfiguration (exact steps)

1. **dash.cloudflare.com** → **Workers & Pages** → click the **`roamwise`**
   Workers project (the one with the failing build, not the new Pages
   project from §A).
2. **Settings** → **Build** (may be labeled "Build configuration" or
   under "Builds & deployments" depending on dashboard version).
3. Set **Root directory** to `worker` (no leading slash — this repo has
   `worker/wrangler.toml` and `worker/worker.js`, and the dashboard needs
   to be told to look inside that subdirectory instead of the repo root).
4. Save. Trigger a manual re-deploy (or push a no-op commit under
   `worker/`) to confirm the build now finds `wrangler.toml`.

### B.2 The `roamwise` vs `roamwise-api` name mismatch — recommended fix

The Cloudflare **dashboard project** is named `roamwise`. The
**version-controlled** `worker/wrangler.toml` declares
`name = "roamwise-api"`. These need to agree for `wrangler deploy` /
Workers Builds to map to the correct project unambiguously.

**Recommendation: rename the dashboard project to `roamwise-api`, not the
other way around.** Reasoning: `wrangler.toml`'s `name` field is
version-controlled, reviewed, and the source of truth Wrangler itself
uses for `wrangler deploy` from any machine or CI runner — changing it
would also change the deployed Worker's default
`*.workers.dev` subdomain URL (from `roamwise.*.workers.dev` to
`roamwise-api.*.workers.dev`), which `worker/SETUP.md` already documents
as the expected URL (see its Step 3 output example:
`https://roamwise-api.<your-subdomain>.workers.dev`). Renaming the
dashboard project instead is a pure label change with no URL/deploy-path
side effects.

Steps: Workers & Pages → `roamwise` project → **Settings** → **General**
(or the project name field at the top) → rename to `roamwise-api` → Save.

**This PR does not touch `worker/wrangler.toml`'s `name` field.** It's
already correct (`roamwise-api`); the fix is purely a dashboard-side
rename, not a code change.

### B.3 The KV namespace ID — do not paste a fake one

`worker/wrangler.toml` still has the placeholder
`id = "PASTE_THE_ID_HERE"`. This PR **does not** touch that value — a real
ID can only come from actually running:

```
npx wrangler kv namespace create RW_KV
```

against a real Cloudflare account, and pasting the ID it prints. Doing
this from a docs/config-scaffolding PR with no account access would mean
inventing a fake ID, which is worse than leaving the clearly-labeled
placeholder in place (a fake-but-plausible-looking ID could silently fail
in a more confusing way than the current obvious placeholder). Leave this
step to whoever has Cloudflare account access, per the existing
instructions already in `worker/wrangler.toml`'s comments and
`worker/SETUP.md` Step 5.

### B.4 What `worker/worker.js` actually does today (verified by reading the file)

| Route | Method | What it does |
|---|---|---|
| `/health` | GET | Returns `{ ok, service, configured: { ai, kv, events, refreshProtected } }` — booleans for whether `GROQ_API_KEY`, `RW_KV`, `TICKETMASTER_KEY`, `REFRESH_TOKEN` are set. No secrets are ever included in the response. |
| `/ai` | POST | Proxies a chat-completion prompt to Groq (`llama-3.3-70b-versatile` by default) so `GROQ_API_KEY` never reaches the browser. Truncates prompts to 6000 chars, caps `max_tokens` at 1500. Rate-limited to 1 request per IP per minute using the Cache API (`aiRateLimited`) — deliberately implemented without KV writes to stay inside KV's free write quota. Returns `501` if `GROQ_API_KEY` isn't configured, `429` if rate-limited. |
| `/news` | GET | Returns a cached travel-tech news feed. Reads from `env.RW_KV` (key `'news'`); the KV entry itself is written only by the cron job (`refreshNews`, which pulls from `hnrss.org`), never on a per-request basis. Edge-cached 30 minutes via the Cache API. |
| `/events` | GET | Returns cached events. Reads from `env.RW_KV` (key `'events'`); written only by the weekly cron (`refreshEvents`, sourced from Ticketmaster's API across 4 country/category combinations, deduplicated by name+date). Edge-cached 1 hour. |
| `/events/refresh` | GET | Forces an immediate events refresh. Token-protected via `env.REFRESH_TOKEN` if set (otherwise open — see the honest caveat already in `worker/SETUP.md`). |
| `/geo` | GET | Proxies OpenStreetMap Nominatim geocoding (`?q=`), edge-cached 30 days, with a `User-Agent` identifying RoamWise per Nominatim's usage policy. |
| `/leads` | GET | An OpenStreetMap-Overpass-based partner-property lead finder for a target town (`?town=`), token-gated via `env.LEADS_TOKEN` if set. Returns a reviewable list (name/phone/website/email where available) for a **human** to contact manually — deliberately does not auto-email or scrape Google/Booking.com. Edge-cached 7 days per town. |
| *(anything else)* | — | `404` with `{ error: 'not found', try: [...] }` listing the valid routes. |

Cron: one `scheduled()` handler, `30 5 * * *` UTC daily. Refreshes news
every run; refreshes events only on Mondays (`getUTCDay() === 1`), to
stay well inside Ticketmaster's free quota.

This is the accurate starting point for any future expansion of the
Worker (e.g. adding R2- or Workers-AI-backed routes per §D/§E below) —
nothing here has been changed by this PR.

---

## C. Firestore — unaffected, documented for clarity

**Firestore is Google's product, not Cloudflare's.** Migrating the static
site to Cloudflare Pages and/or expanding the `worker/` Cloudflare Worker
does **not** require migrating away from Firestore, and this document
does not propose that.

Verified by reading the actual client-side calls: `firebase.firestore()`
is used directly in the browser in `js/boot/auth-init.js` (line 61) and
referenced elsewhere in `js/social/*.js`, `js/game/realms.js`,
`js/misc/misc-features.js`, and `js/data-sync/key-sync.js`. These are all
**client-side Firebase SDK calls that run in the user's browser** —
they talk directly to Google's Firestore backend over the network. Moving
the *static files that contain this JavaScript* from GitHub Pages to
Cloudflare Pages changes nothing about how that JavaScript executes or
what it talks to. The browser doesn't know or care which CDN served
`auth-init.js` — it just runs it, and it still calls Firestore exactly as
before.

**If/when the Cloudflare Worker itself needs server-side Firestore
access** (for example, having `/leads` write qualified leads directly
into Firestore instead of only returning JSON, or any future
server-side logic that needs to read/write Firestore without going
through the browser): Cloudflare Workers run on the V8 isolate runtime,
**not Node.js**, so the official `firebase-admin` npm package (which
depends on Node.js-only APIs) cannot run inside a Worker. The two real
options are:

1. **Firestore's REST API directly** (`https://firestore.googleapis.com/v1/...`),
   authenticated with a Google service account's OAuth2 token — doable
   from a Worker with `fetch()` and a JWT-signing step (Workers support
   the Web Crypto API needed to sign a JWT for a Google OAuth token
   exchange).
2. A **fetch-based Firestore client library** built for edge/Worker
   runtimes (there are a few community options; evaluate at
   implementation time rather than picking one speculatively here, since
   none is needed yet).

**Wherever the service account credential ends up, it must be stored as
a Cloudflare Worker Secret** (`wrangler secret put FIRESTORE_SA_KEY` or
similar), exactly the same pattern already used for `GROQ_API_KEY`,
`TICKETMASTER_KEY`, and `REFRESH_TOKEN` in `worker/wrangler.toml`'s
existing comments. **Never** put a service account key in
`wrangler.toml` or anywhere else in the repo — `wrangler.toml` is
version-controlled and world-readable via the public GitHub repo.

No code changes are proposed here because no route in `worker/worker.js`
currently needs server-side Firestore access — this section exists so a
future "let's add server-side Firestore to the Worker" decision starts
from an accurate technical picture instead of assuming `firebase-admin`
will just work.

---

## D. Cloudflare R2 (object storage)

### D.1 Create the bucket

1. **dash.cloudflare.com** → **R2** → **Create bucket**.
2. Name it `roamwise-data` (recommended — generic enough to cover more
   than one use case below, and clearly distinguishes it from the KV
   namespace `RW_KV`, which is a different Cloudflare product with
   different semantics — R2 is blob/object storage, KV is a small
   key-value cache).
3. Leave default settings (Location: Automatic, Storage class: Standard)
   unless you have a specific reason to change them.

### D.2 Binding syntax added to `worker/wrangler.toml`

See the actual diff below in §2 of this doc for the exact block added.
It's commented out / placeholder-labeled, matching the existing pattern
this file already uses for the KV namespace (a clear `# <-- fill this in`
marker), so it doesn't silently activate a binding pointing at a
non-existent bucket.

### D.3 Honest, grounded use cases for R2 in this app

Checked what actually exists in the repo before proposing anything:

1. **Cached/pre-rendered PDF itinerary exports.** `js/itinerary/pdf-export.js`
   (`openPdfFlow`/`genPdf`) generates a multi-page PDF client-side, in the
   browser, using `jsPDF` (see `loadJsPdf` in that file) — it's a paid
   (₹10 one-off, or free with Pro) feature per `openPdfFlow`'s payment UI.
   Today every PDF is generated fresh in the browser on every request,
   which is fine since it's client-side and costs Cloudflare nothing. R2
   becomes useful **only if** PDF generation moves server-side (e.g. into
   the Worker, to produce a more consistent/higher-quality PDF, or to let
   a user re-download a previously-generated PDF without regenerating
   it) — at that point, caching generated PDFs in R2 keyed by
   destination+dates+party+pace would avoid regenerating an identical PDF
   twice. **This is a "when you build server-side PDF generation" use
   case, not something to build now** — there is no server-side PDF
   generation today for R2 to plug into.
2. **`itinerary-library/presets/` — optional, not urgent.** This
   directory (all preset JSON/assets under `itinerary-library/`) is
   currently **7.9 MB** (`du -sh itinerary-library` on this repo). That's
   small — well within a comfortable git repo size and nowhere near R2's
   free tier limit. Moving it to R2 would add complexity (a fetch call
   instead of a same-origin static file, cache invalidation on preset
   updates) for no current benefit. **Only reconsider this if the preset
   library grows an order of magnitude larger** (tens of MB of preset
   data) or if you want presets to be updatable without a full site
   redeploy — neither is true today.
3. **User-uploaded content.** Checked for this — there is no evidence in
   the repo of user-uploaded files (no upload endpoint in
   `worker/worker.js`, no file-upload UI found). Not proposing this as a
   current use case; noting only that if a future feature adds user
   uploads (e.g. trip photos), R2 is the natural place for them.

### D.4 Free tier math against this repo's real numbers

Cloudflare R2's free tier (as of this writing; **verify current numbers
on Cloudflare's pricing page before relying on them, since free-tier
terms change**) is **10 GB of storage** plus a monthly allowance of Class
A (write-type: PUT, POST, list) and Class B (read-type: GET, HEAD)
operations at no cost.

This repo's actual sizes, measured directly:

```
$ du -sh itinerary-library assets
7.9M    itinerary-library
20M     assets
```

Even if *both* directories were moved to R2 in full (which §D.3
recommends against doing today), that's **~28 MB total — about 0.28% of
the 10 GB free tier**. There is no realistic near-term scenario where
this app's data volume is a concern for R2's free tier; the constraint
that matters in practice, if/when server-side PDF caching is built, is
the operation-count quota (many small reads/writes) rather than storage
size.

---

## E. Cloudflare Workers AI (free tier) — realistic scale planning

### E.1 The honest constraint

Cloudflare Workers AI's free tier gives a limited **daily neuron
allowance** shared across all AI model calls from your account. The
exact numeric limits change over time and by model — **verify the
current number on Cloudflare's pricing page
(developers.cloudflare.com/workers-ai/platform/pricing) before budgeting
against it**, rather than trusting a specific figure written into this
doc, which could go stale.

The general shape that's safe to state without needing today's exact
number: it is **generous enough for a small-to-medium app's live AI
traffic**, but it is **not sufficient for "millions of users" all making
live, uncached AI calls every day** on the free tier alone. Any migration
plan that assumes otherwise will hit a wall in production.

### E.2 Strategy to make the free tier stretch as far as possible

This app already has two pieces of relevant infrastructure that this
strategy builds on rather than invents from scratch:

- A **deterministic, free, unlimited "Smart Search" template engine**
  (`smartSearch()` in `app.js`, using `DAY_TEMPLATES` per
  `js/itinerary/build.js`'s comment) that the app already falls back to
  whenever no AI key/provider is configured — see the "Smart engine
  (built-in templates)" badge text in `js/itinerary/build.js`.
- The **offline preset-library cache** (`itinerary-library/`, loaded via
  `itinerary-library/preset-loader.js`), which already serves common
  destination queries from static, pre-built cinematic itinerary content
  with **zero AI calls and zero network round-trip to any backend** —
  see the `preset-offline`/`presetBadge` handling in
  `js/itinerary/build.js`, which explicitly renders a "Ready-made ·
  offline/cached" badge when serving from this path.

Given that existing foundation, the concrete plan:

1. **Cache-first.** Before ever calling Workers AI, check (in order):
   (a) the static `itinerary-library/` presets for an exact or
   near-match, then (b) an R2- or KV-backed cache of previously
   AI-generated results for the same or a similar query. Real-world
   travel-query patterns cluster heavily around popular destinations
   (Bali, Goa, Ladakh, Kashmir, etc. — several of which are already
   `itinerary-library/presets/` entries in this repo), so even a
   60-80% cache-hit rate removes the large majority of would-be AI calls
   before they ever happen.
2. **Tiered fallback, not failure.** Only call Workers AI for a genuinely
   novel query (no preset match, no cache match). If the daily/period AI
   quota is exhausted, **fall back to the existing `smartSearch()`
   template engine** instead of showing an error — this is the same
   "never let the AI path being unavailable break the user experience"
   philosophy the app already applies (per `worker/SETUP.md`'s "Honest
   notes": the app works fully without the Worker at all, defaulting
   `rw-config.js`'s `backend` to `'firebase'`). Extend that same
   fall-back philosophy specifically to "AI quota exhausted" as one more
   reason to degrade to the free template engine, not just "Worker
   unreachable."
3. **Batching/precomputation for predictable high-value content.**
   Identify the top N destinations (the existing
   `itinerary-library/presets/` directory names — Iceland, Ladakh, UAE,
   Maldives, Markha Valley, Chardham, Kashmir Great Lakes, Kashmir,
   Northeast Grand, etc. — are a reasonable starting list) × common trip
   lengths, and precompute+cache each combination **once**, either during
   a scheduled low-traffic cron window (the Worker already has a cron
   trigger infrastructure — `[triggers] crons` in `worker/wrangler.toml`
   — this would be a new cron job, not a new pattern) or on-demand the
   first time a combination is requested, then cache the result in R2/KV
   forever (or until the underlying preset content is intentionally
   refreshed). This turns N×M AI calls total (ever) into the same
   N×M count, but **once**, rather than once per user.
4. **Per-user/IP rate limiting on live AI calls.** Cloudflare's own
   Rate Limiting Rules (available free on all plans, configured in the
   dashboard under the zone's **Security → WAF → Rate limiting rules**,
   or via the Rulesets API) can cap how many `/ai`-route requests a
   single IP can make per day, independent of and in addition to the
   existing per-IP-per-minute limiter already implemented in
   `worker/worker.js`'s `aiRateLimited()` function (which only prevents
   burst abuse within a minute, not sustained daily abuse). This protects
   the shared Workers AI quota from any single user/IP consuming a
   disproportionate share of it.
5. **Be explicit about what this does and doesn't buy you.** This
   strategy lets a **large number of users** read cached, precomputed, or
   preset-library content essentially for free and indefinitely, because
   Cloudflare Pages' bandwidth/request limits for static content are
   generous and R2/KV reads are cheap and covered by generous free
   quotas. What it does **not** do is make genuinely new, novel
   AI-generation requests free at unlimited scale — those remain bounded
   by the Workers AI free-tier quota no matter how good the caching
   strategy is. **Recommendation: monitor actual AI-call volume via the
   Cloudflare dashboard's Workers AI analytics, and budget for the paid
   Workers AI tier (usage-based, inexpensive per request per Cloudflare's
   published pricing) once real growth exceeds free-tier headroom** —
   don't plan around an assumption of infinite free AI generation at
   scale.

### E.3 Optional `[ai]` binding — added to `wrangler.toml`, not activated

See §2 below — a commented-out example `[ai]` binding block has been
added to `worker/wrangler.toml` showing the exact syntax, so that
whoever implements the Workers AI path later doesn't have to look it up
from scratch. It is not active by default (no live route in
`worker/worker.js` calls Workers AI today).

---

## F. Sequencing recommendation

In order of what to actually do:

1. **A — Cloudflare Pages migration.** Lowest risk (fully reversible via
   DNS), highest immediate value (fixes nothing that's broken today, but
   sets up the target hosting platform), and doesn't block or depend on
   anything else. Do this first.
2. **B — Fix the existing Workers dashboard misconfiguration.** Second,
   because it unblocks the `worker/` project's CI/CD pipeline (currently
   permanently red) and is a prerequisite for confidently building
   anything new on top of the Worker (R2, Workers AI, expanded routes) —
   there's little point adding new bindings to a project whose deploy
   pipeline doesn't work yet. Requires a human with Cloudflare dashboard
   access; not a code change.
3. **C — Firestore.** No action needed at all; it keeps working
   unchanged through both of the above. Listed here only for
   completeness of the migration story.
4. **D and E — R2 and Workers AI.** Only take these on once B is actually
   working (a green, working Workers Build pipeline) **and** there's a
   real, concrete need — e.g. server-side PDF generation actually being
   built (for R2) or a decision to add a live-AI itinerary-generation
   feature beyond the existing Groq `/ai` proxy (for Workers AI). Building
   either speculatively, before B works or before a concrete feature
   needs them, would be scaffolding without a consumer.

---

## 2. Config file changes made by this PR

`worker/wrangler.toml` gained two new, **inert** blocks:

- A commented `[[r2_buckets]]` example (binding `RW_BUCKET`, bucket name
  `roamwise-data` per §D.1's recommendation), with a comment pointing at
  the exact dashboard step to get a real bucket, matching the existing
  `PASTE_THE_ID_HERE` KV pattern's style.
- A commented `[ai]` example binding block (binding `AI`), per §E.3,
  showing the syntax without activating it.

**Not changed:** the existing `name = "roamwise-api"` field, the existing
`[[kv_namespaces]]` block (including its `PASTE_THE_ID_HERE` placeholder),
the `[triggers]` cron block, and every line of `worker/worker.js`. See §B.2
and §B.3 above for why those specific values are intentionally left alone
in this PR.
