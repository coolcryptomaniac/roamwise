#!/usr/bin/env node
/* ============================================================================
   RoadMap Agent — generate-report.js
   ----------------------------------------------------------------------------
   Reads context.md (written by gather-context.js), calls the Claude API to
   synthesize a weekly roadmap/strategy report, and writes report.md.

   Boundaries this report must respect (see ROADMAP-AGENT.md):
   - Suggest-only. Never applies code changes, never opens PRs, never touches
     auth/payments/entitlement/Firestore/deployment config itself — those
     stay under AI-ROLES-AND-HANDOFF.md rule 7's separate-review requirement
     no matter what this report recommends.
   - Every business-strategy claim should be grounded against the docs it was
     given (BUSINESS-FINANCE-SETUP.md, PRICING-REFERRAL-MATH.md,
     CREATOR-OUTREACH.md, REVENUE-INTEGRATIONS.md), not invented numbers.
   - Long-term framing is "durable engineering practices that maximize
     long-term survivability" — never an unverifiable multi-decade uptime
     promise for this specific project.

   The API call is isolated in callClaude() so everything else (prompt
   assembly, file I/O, the missing-key failure path) is testable without a
   real ANTHROPIC_API_KEY or network access. See gather-context.test.js /
   generate-report.test.js for a mocked-fetch run of the full pipeline.
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const MODEL = process.env.ROADMAP_AGENT_MODEL || 'claude-sonnet-4-5';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MAX_OUTPUT_TOKENS = 4000;

const SYSTEM_PROMPT = `You are the RoamWise Roadmap Agent, a weekly strategic-review assistant for a
solo-founder travel-planning app (RoamWise). You are given a snapshot of the
repo's recent activity, its architecture docs, its dependency staleness, and
its own business/finance/pricing/growth documentation.

Produce a written report with these sections, in this order:

1. **New feature ideas** — a short, prioritized list, each tied to a concrete
   signal from the gathered context (a recent commit, a gap in the docs, a
   competitor-relevant angle), not generic SaaS boilerplate.
2. **Upgrades** — improvements to existing features/infrastructure worth
   doing soon.
3. **Deprecate / delete / simplify** — call out anything the context suggests
   is stale, duplicated, or no longer earning its complexity (e.g. an
   outdated dependency, a module that looks superseded, a doc that
   contradicts a newer one).
4. **Business strategy** — ground every claim against the specific numbers
   and policies in the business docs you were given (pricing tiers, referral
   commission math, creator outreach rules, revenue integrations). Do not
   invent revenue figures, user counts, or conversion rates that are not in
   the provided context — say "no data available" rather than guessing.
5. **Long-term project health & survivability** — frame this as durable
   engineering practices that maximize long-term survivability (sustainable
   architecture, avoiding vendor lock-in, documentation health, bus-factor
   risk for a solo founder). Do NOT promise or imply a specific operating
   lifespan (e.g. do not say a feature or the project itself will "run for
   100 years" or similar) — that is not something anyone can honestly commit
   to for any project. Be explicit that this is about practices, not a
   guarantee.

Hard constraints:
- You are suggest-only. Never write as if a change has been applied, opened,
  or deployed — every item is a recommendation for a human to triage.
- Never recommend, imply, or draft a change to authentication, payments,
  Pro-entitlement logic, Firestore security rules, or deployment
  configuration as something this agent or its report should do directly —
  those require separate human-led review per this repo's own rules. You may
  still flag a *concern* about them (e.g. "the Firestore rules doc looks
  stale, a human should review it") without drafting the fix.
- Be honest about the limits of what you can see: you were given a bounded
  snapshot (recent commits/PRs, one dependency pass, doc excerpts), not full
  production telemetry. Do not fabricate metrics you were not given.
- Keep the whole report readable in under ~3 minutes: be concrete and
  concise, not exhaustive.

Output clean Markdown with the five numbered section headers above (use
"##" for each). Do not include a top-level title line — the workflow adds
one.`;

/* --------------------------------------------------------- isolated call */
async function callClaude({ apiKey, model, systemPrompt, userContent, maxTokens }) {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(`Anthropic API returned ${res.status}: ${bodyText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n')
    .trim();

  if (!text) throw new Error('Anthropic API returned no text content');
  return text;
}

/* --------------------------------------------------------- report shell */
function buildReportHeader() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });
  return [
    '# RoamWise Roadmap Agent — weekly report',
    `*${dateStr} · generated automatically, suggest-only — nothing in this report has been applied*`,
    '',
  ].join('\n');
}

function buildFooter() {
  return [
    '',
    '---',
    '*This report is advisory only. It never applies code changes, opens PRs, or ' +
      'touches auth/payments/Pro-entitlement/Firestore/deployment — see ' +
      'ROADMAP-AGENT.md and AI-ROLES-AND-HANDOFF.md rule 7 for why those stay ' +
      'human-reviewed. Runs weekly via .github/workflows/roadmap-agent.yml.*',
  ].join('\n');
}

/* --------------------------------------------------------------- main --- */
async function main() {
  const contextPath = path.join(process.cwd(), 'context.md');
  if (!fs.existsSync(contextPath)) {
    console.error('generate-report.js: context.md not found — run gather-context.js first.');
    process.exit(1);
  }
  const context = fs.readFileSync(contextPath, 'utf8');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fail gracefully/informatively, per ROADMAP-AGENT.md — the workflow
    // should show a clear reason in the Action log rather than a cryptic
    // stack trace, and must NOT silently write a fake/empty report.
    console.error(
      '\nERROR: ANTHROPIC_API_KEY is not set.\n' +
      'The RoamWise Roadmap Agent needs this repository secret to call the Claude API.\n' +
      'Add it at: Settings -> Secrets and variables -> Actions -> New repository secret\n' +
      '  Name:  ANTHROPIC_API_KEY\n' +
      '  Value: an Anthropic API key with Messages API access\n' +
      'See ROADMAP-AGENT.md for the one-time setup step. Exiting without writing report.md.\n'
    );
    process.exit(1);
  }

  const userContent =
    `Here is this week's gathered RoamWise context. Use it to write the report ` +
    `described in your system prompt.\n\n${context}`;

  let body;
  try {
    body = await callClaude({ apiKey, model: MODEL, systemPrompt: SYSTEM_PROMPT, userContent, maxTokens: MAX_OUTPUT_TOKENS });
  } catch (e) {
    console.error('generate-report.js: Claude API call failed:', String(e.message || e));
    process.exit(1);
  }

  const report = buildReportHeader() + '\n' + body + '\n' + buildFooter();
  fs.writeFileSync(path.join(process.cwd(), 'report.md'), report);
  console.log(`report.md written (${report.length} chars)`);
}

if (require.main === module) {
  main();
}

module.exports = { callClaude, buildReportHeader, buildFooter, SYSTEM_PROMPT, MODEL };
