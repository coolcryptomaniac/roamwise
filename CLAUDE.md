# Claude Code working contract for RoamWise

This file is the binding, auto-injected working contract for every AI session
in this repo. Keep it current — a stale contract here actively blocks
legitimate work (see "History" below for why this rewrite happened).

## Read first (in this order)

1. `ARCHITECTURE.md` (if present) — the current module map and load order.
   This doc is meant to save future sessions from re-deriving the `js/`
   structure via expensive repo-wide greps every time. If it doesn't exist
   yet, treat creating it as a good first task before large refactors, and
   fall back to `find js -name "*.js" | sort` plus the script-tag block in
   `index.html` to ground-truth the current structure.
2. `AI-ROLES-AND-HANDOFF.md` — shared ChatGPT/Claude responsibilities and
   repo-wide safety rules (still active; not specific to any one past task).

## Current architecture: app.js -> js/ modularization (active, ongoing)

RoamWise is mid-migration from a single ~19,300-line `app.js` into small,
single-purpose modules under `js/{core,data,pricing,audio,voice,booking,
social,copilot,itinerary,ui,runtime}/*.js`. As of this writing `app.js` is
down to ~10,600 lines; roughly 8-10 phased PRs have already landed this
(search `git log --oneline --all | grep -i modulariz` for the full history:
Phase 0+1, 2, 3, 4a, 4b, 4c, 5a, 5b, ...). This is an active, human-authorized,
ongoing workstream — treat it as the default context for this repo, not an
exception.

Key constraints, by design:

- **No bundler, no ES modules.** Everything loads via classic `<script>`
  tags in `index.html`, in dependency order (data/config files first, then
  audio/voice/booking/social/copilot/itinerary, then ui, then `app.js` last).
  This is required because roughly 290 distinct function names are invoked
  via inline `onclick="..."` HTML attributes — including markup `app.js`
  itself generates dynamically at runtime — so every one of those functions
  must remain a real, synchronously-available `window`-reachable global at
  the moment the HTML referencing it is inserted. Converting to ES modules
  or a bundler would break these without a much larger, separately-planned
  rewrite.
- **`tools/check-line-limits.js`** enforces the target for new `js/` files:
  soft target 300-500 lines (warns above), hard cap 1000 lines (fails CI
  above). `app.js` itself is explicitly exempted from this check until the
  migration is complete — it's the shrinking migration source, not a normal
  module.

## Extraction/verification methodology (proven across ~10 merged phases)

When moving code out of `app.js` into `js/`, follow the pattern the prior
phases established:

1. Fresh `grep` for every call site of the functions/data being moved
   (including dynamically-generated `onclick=` strings) before moving
   anything — do not rely on memory or a prior session's grep.
2. Verbatim move: zero logic changes in the same commit as the move. Behavior
   changes are a separate, separately-reviewed change.
3. Leave a one-line marker comment in `app.js` at the original location.
4. Add the new file's `<script>` tag to `index.html` in the correct
   dependency position (before anything that references its globals, after
   anything it depends on).
5. Verify: `node --check` on every touched file, `npm test`, `npm run check`
   (line-limit + syntax check), then a Playwright regression pass that
   actually exercises rendered UI interactions (clicks, onclick-driven flows)
   — not just static/syntax checks — before merging.

## Scope of "sensitive" code during this refactor

Pro-entitlement, payment, and auth **code may be relocated** (moved verbatim,
same rigor as anything else above) as part of this modularization — file
location is not special. What still requires careful, separately-reviewed
treatment is any actual **behavior/logic change** to entitlement, payment, or
auth code — not simply moving it from `app.js` into `js/`. (A prior phase
skipped moving an auth/Firestore-bound block specifically because an earlier,
task-scoped version of this file blanket-forbade touching it; that block is
still fair game for a verbatim move.) Firestore security rules and deployment
bindings still fall under `AI-ROLES-AND-HANDOFF.md` rule 7 (separate review
for auth/payments/entitlement/Firestore/deployment) for behavior changes.

## History: itinerary-library-v1.1 verification (concluded)

An earlier, narrower version of this file scoped Claude's entire role in this
repo to debugging/validating the cinematic itinerary preset library on
`feature/itinerary-library-v1.1` (PR #63), including a rule not to touch the
Classic planner or Pro-entitlement/auth/Firestore code. **That workstream is
done**: `itinerary-library/` is merged into `main`, wired up via
`itinerary-library/preset-loader.js` in `index.html` and called from
`app.js`, and PR #63 was merged (not just closed). Those restrictions were
scoped to that specific debugging task and are not a standing, repo-wide
rule — see the corrected scope above for the modularization work.

`AI-ROLES-AND-HANDOFF.md`, `CLAUDE-ITINERARY-DEBUG-TEST.md`,
`itinerary-library/README.md`, and `itinerary-library/CLAUDE-CODE-MERGE-NOTES.md`
remain in the repo as historical records of that task and of the preset
library's behavior/integration contract, but should not be read as defining
the current, repo-wide role for AI sessions here.
