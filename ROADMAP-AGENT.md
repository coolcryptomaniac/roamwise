# RoamWise Roadmap Agent

An automated, weekly strategic-review agent that reads a snapshot of the repo
and its own business docs, asks the Claude API for judgment-based
recommendations, and files the result as a GitHub Issue for a human to read
and triage. It never applies anything itself.

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
2. Generates a report (`tools/roadmap-agent/generate-report.js`): sends
   `context.md` plus a system prompt to the Claude API and writes the
   response to `report.md`.
3. Posts `report.md` as a new GitHub Issue labeled `roadmap-agent`.

Every gathering step degrades gracefully on its own — a GitHub API hiccup or
an npm registry timeout produces a `(unavailable: ...)` note in that section
instead of failing the whole run. Only a missing/failing Claude API call
fails the job (see "Setup" below), since a report can't be generated without it.

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

A new GitHub Issue, titled `🗺️ Roadmap agent — weekly report — <date>`,
labeled `roadmap-agent`. It is never committed as a file and never opens or
modifies a pull request — issues are the right medium for something a human
should read and triage, not something that should be silently merged.

The report covers five sections: new feature ideas, upgrades, things to
deprecate/delete/simplify, business strategy (grounded against the docs
above), and long-term project health/survivability considerations.

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

## One-time setup required (repo owner action)

The workflow needs a **repository secret** that does not exist yet:

1. Get an Anthropic API key with Messages API access.
2. In the repo: **Settings -> Secrets and variables -> Actions -> New
   repository secret**.
3. Name: `ANTHROPIC_API_KEY`. Value: the key from step 1.

Until this secret is added, the workflow **will run on schedule and fail**
with a clear `::error::` message in the Action log naming the missing secret
and pointing back to this doc — that is expected and safe to leave as-is; it
does not affect any other workflow, the site, or production data.

Optional: to pin a specific model instead of the default
(`claude-sonnet-4-5`), set a repository **variable** (not secret) named
`ROADMAP_AGENT_MODEL` at **Settings -> Secrets and variables -> Actions ->
Variables** with the model ID to use. This is read at runtime rather than
hardcoded so it's easy to update as model names change.

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
