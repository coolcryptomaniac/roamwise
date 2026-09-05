# RoamWise Roadmap Agent

An automated, weekly strategic-review agent that reads a snapshot of the repo
and its own business docs and files the result as a GitHub Issue for a human
to read and triage. It never applies anything itself.

**No secret is required to run this by default.** Out of the box (no
`ANTHROPIC_API_KEY`), it posts a reminder Issue with the gathered context and
a call-to-action to run the actual analysis manually via a Claude Code
session. If you later add an `ANTHROPIC_API_KEY` repository secret, it
automatically switches to auto-generating the full report via the Claude API
instead — see "Two modes" below.

## What it does

Every Monday it:

1. Gathers context (`tools/roadmap-agent/gather-context.js`):
   - Recent commit history (`git log`, local — no network needed)
   - Recent closed/merged PR titles (GitHub API, best-effort)
   - Dependency staleness: every `package.json` dependency vs its latest
     version on the npm registry (best-effort)
   - `app.js` line count, as a proxy for modularization progress
   - Excerpts of `ARCHITECTURE.md` and `CLAUDE.md` for architectural grounding
   - Excerpts of `BUSINESS-FINANCE-SETUP.md`, `PRICING-REFERRAL-MATH.md`,
     `CREATOR-OUTREACH.md`, and `REVENUE-INTEGRATIONS.md` for business-strategy
     grounding
   - Writes all of the above to `context.md` (a workflow-run artifact, not
     committed to the repo)
2. **Default (no `ANTHROPIC_API_KEY` secret):** posts `context.md` straight
   into a reminder Issue (see "Two modes" below) — no Claude API call is made.
   **If `ANTHROPIC_API_KEY` is set:** generates a report
   (`tools/roadmap-agent/generate-report.js`) by sending `context.md` plus a
   system prompt to the Claude API, and writes the response to `report.md`.
3. Posts the result as a new GitHub Issue labeled `roadmap-agent` — either
   the full `report.md` (API-key path) or the reminder-plus-context (default
   path).

Every gathering step degrades gracefully on its own — a GitHub API hiccup or
an npm registry timeout produces a `(unavailable: ...)` note in that section
instead of failing the whole run. Since the default path no longer requires a
Claude API call, the workflow no longer fails on a missing key — it just
takes the reminder path instead.

## Two modes

| | Default (no secret) | With `ANTHROPIC_API_KEY` set |
|---|---|---|
| Setup required | None | Add the `ANTHROPIC_API_KEY` repository secret (see "Optional setup" below) |
| What runs | `gather-context.js` only | `gather-context.js` + `generate-report.js` (Claude API call) |
| Issue posted | `🔔 Weekly Roadmap Agent Reminder — <date>`, containing the gathered context and a call-to-action | `🗺️ Roadmap agent — weekly report — <date>`, containing the full 5-section analysis |
| Who does the analysis | You (or your Claude Code session), manually, from the linked context | The Claude API, automatically |
| Email reminder | Yes, if you have GitHub notifications on for this repo (see below) — plus a direct email if `MAIL_USERNAME`/`MAIL_APP_PASSWORD`/`TO_EMAIL` are already set for the daily ops workflow | Same |

Both modes post to the same `roadmap-agent`-labeled Issue stream, so nothing
about triage or history changes if you switch between them.

### Getting the reminder as an email (default mode)

The reminder Issue is created using the `GITHUB_TOKEN` Actions already
provides — **no new secret is needed for this to work.** Whether you get an
*email* about it depends on your own GitHub notification settings, since
GitHub only emails you automatically for a new Issue if you're watching the
repo (or have "Issues" custom notifications on) with email delivery enabled:

1. Go to this repo's page and confirm you're "Watching" it (or have a custom
   notification setup that includes "Issues").
2. In your GitHub account settings
   (https://github.com/settings/notifications), under "Participating and
   @mentions" / "Watching", make sure email is a selected delivery method.

If you'd rather not depend on that, and you already have `MAIL_USERNAME`,
`MAIL_APP_PASSWORD`, and `TO_EMAIL` repository secrets configured for
`.github/workflows/roamwise-agent-daily.yml`'s email step, the reminder
workflow reuses those same secrets to also send a direct email — no
additional setup, since those secrets already exist for that workflow. If you
don't have them, nothing new is needed there either; you'll still get the
Issue, and the GitHub notification email above if you've enabled it.

## Cadence

**Weekly**, Monday 06:00 UTC (`.github/workflows/roadmap-agent.yml`, cron
`0 6 * * 1`). Daily would be too noisy for strategic recommendations —
priorities and business posture don't meaningfully change day to day, and a
daily run would mostly repeat itself while spending Claude API budget for no
extra signal. This is separate from, and does not touch, the existing daily
ops report (`.github/workflows/roamwise-agent-daily.yml`) or the weekly SEO
refresh (`roamwise-agent-weekly-seo.yml`).

Trigger it on demand any time via the Actions tab -> "RoamWise Roadmap Agent
— Weekly" -> "Run workflow" (`workflow_dispatch` is enabled).

## Where the output lands

A new GitHub Issue labeled `roadmap-agent` — titled either
`🗺️ Roadmap agent — weekly report — <date>` (API-key path) or
`🔔 Weekly Roadmap Agent Reminder — <date>` (default, no-key path; see "Two
modes" above). It is never committed as a file and never opens or modifies a
pull request — issues are the right medium for something a human should read
and triage, not something that should be silently merged.

The full report (API-key path) covers five sections: new feature ideas,
upgrades, things to deprecate/delete/simplify, business strategy (grounded
against the docs above), and long-term project health/survivability
considerations. The reminder (default path) contains the same gathered
context plus a call-to-action asking you (or your Claude Code session) to
write that five-section analysis yourself, following the exact structure and
constraints in `tools/roadmap-agent/generate-report.js`'s `SYSTEM_PROMPT` —
issue #124 is a worked example of what that manual output looks like.

## Boundaries (hard constraints, enforced in the system prompt)

- **Suggest-only.** The agent never writes code, never commits, never opens
  or modifies a PR. Its entire output is one Markdown report in one Issue.
- **Never auth/payments/entitlement/Firestore/deployment.** The agent is not
  permitted to draft changes to authentication, payments, Pro-entitlement
  logic, Firestore security rules, or deployment configuration — those
  require separate, human-led review under `AI-ROLES-AND-HANDOFF.md` rule 7
  regardless of what the report recommends. It may still flag a *concern*
  about one of those areas (e.g. "the Firestore rules doc looks stale, a
  human should review it") without proposing the fix itself.
- **No fabricated metrics.** The system prompt instructs the model to say
  "no data available" rather than invent revenue figures, user counts, or
  conversion rates it wasn't given — see the "Business strategy" grounding
  rule in `tools/roadmap-agent/generate-report.js`.
- **No century-scale promises.** The "long-term health" section is framed as
  durable engineering practices that maximize long-term survivability
  (sustainable architecture, avoiding lock-in, documentation health, bus-
  factor risk for a solo founder) — not a literal, unverifiable prediction
  that this or any specific project will keep running for decades. No one
  can honestly promise that for any project; the report says so explicitly
  rather than overclaiming.

## Optional setup: auto-generation via the Claude API

**Nothing here is required.** By default (no secret set) the workflow just
posts the reminder Issue described above — that's a complete, working setup
on its own. This section only applies if you'd rather have the full report
generated automatically instead of doing it yourself each week:

1. Get an Anthropic API key with Messages API access.
2. In the repo: **Settings -> Secrets and variables -> Actions -> New
   repository secret**.
3. Name: `ANTHROPIC_API_KEY`. Value: the key from step 1.

As soon as that secret exists, the very next scheduled (or manually
dispatched) run automatically switches to the full auto-generated report —
no other change needed, and nothing about the reminder path is left half
-configured if you never add it.

Optional: to pin a specific model instead of the default
(`claude-sonnet-4-5`), set a repository **variable** (not secret) named
`ROADMAP_AGENT_MODEL` at **Settings -> Secrets and variables -> Actions ->
Variables** with the model ID to use. This is read at runtime rather than
hardcoded so it's easy to update as model names change. (This variable is
only read on the API-key path — it has no effect in the default reminder
mode.)

## Doing the manual analysis: via a Claude Code scheduled trigger

When the reminder Issue's call-to-action says "ask your Claude Code session
to review this context and post the full roadmap analysis," you can do that
by hand each time, or automate the asking itself:

If you already have a Claude Code plan, Claude Code on the web
(https://code.claude.com/docs/en/claude-code-on-the-web) supports scheduled
triggers: a saved prompt that fires on a cron-like cadence against this repo,
running as a normal Claude Code session under your existing plan — no extra
billed API key, and no GitHub Actions secret to manage.

To set this up (e.g. to fire shortly after the weekly reminder Issue, or on
the same Monday-morning cadence):

1. In Claude Code on the web, open this repo and create a scheduled trigger
   with roughly the cadence in `.github/workflows/roadmap-agent.yml`
   (Monday mornings).
2. Give it a prompt along these lines: *"Run
   `tools/roadmap-agent/gather-context.js` in this repo, then read the
   resulting `context.md` and write a roadmap report yourself — you have
   full reasoning ability, so skip calling a separate model API — following
   the exact five-section structure and constraints in
   `tools/roadmap-agent/generate-report.js`'s `SYSTEM_PROMPT` (new features,
   upgrades, deprecate/delete/simplify, business strategy grounded in the
   business docs, and long-term health framed as durable practices, never a
   specific lifespan promise). Post the result as a new GitHub Issue labeled
   `roadmap-agent`, titled with today's date."*
3. That's the whole setup — the trigger reuses the same `gather-context.js`
   script (nothing about that script changes), it just does the same thing
   the reminder Issue is asking a human to trigger manually, on its own
   schedule instead — the same way issue #124 was produced.

This and the weekly reminder Issue are not mutually exclusive — the reminder
will still post every Monday regardless of whether a Claude Code trigger is
also configured; think of the trigger as automating away the "ask your
Claude Code session" step rather than replacing the reminder.

## Local testing without a live API key

```
node tools/roadmap-agent/gather-context.js   # writes context.md
node tools/roadmap-agent/generate-report.js  # needs ANTHROPIC_API_KEY, writes report.md
node --test tests/roadmap-agent.test.js      # unit tests, fully mocked, no network/key needed
```

`generate-report.js` isolates the one network call that needs a real key
(`callClaude()` in `tools/roadmap-agent/generate-report.js`) from everything
else — prompt assembly, file I/O, and the missing-key failure path are all
covered by `tests/roadmap-agent.test.js` with a mocked `fetch`, so the whole
pipeline except the live Claude call itself is verified in CI without ever
needing a real key.
