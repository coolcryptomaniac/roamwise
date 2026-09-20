# RoamWise AI employee pilot — review-first, low-error operations

This pilot extends existing automation instead of creating competing agents. It does **not** authorize any model to spend money, alter accounts, change production configuration, or send messages to customers without founder approval. Read `AI-ROLES-AND-HANDOFF.md` first.

## The three roles

| Role | Trigger and existing implementation | Inputs | Output and allowed actions | Must escalate |
|---|---|---|---|---|
| **Ops Desk** | Existing `.github/workflows/roamwise-agent-daily.yml`, 09:00 IST (schedule is best effort). | Public site checks; Firebase counts only if the repository owner has configured its existing service-account secret. | One GitHub daily-report Issue; highlight observed changes and missing data. No account mutations. | Payment complaints, sign-in failures, sensitive user data, outage alerts. |
| **QA Scout** | New `.github/workflows/roamwise-ai-qa-watch.yml`, 09:45 IST, plus existing `repo-health-check.yml` on code changes. | Public Cloudflare Worker `/health` and an unauthenticated payment-status request; CI test outcomes. | Two read-only GET requests; one deduplicated GitHub incident Issue if a check fails; no PR or deployment. | Any money/identity/security problem; any mismatch between green health and a real customer's failed checkout. |
| **Support Drafter** | Founder invokes ChatGPT with the relevant support case; optional Claude Code session for an evidenced reproducible bug. Not scheduled or connected to an inbox in this pilot. | A redacted customer report and the relevant public docs or authorized connected email. | A polite reply draft plus a GitHub issue with reproduction steps, evidence, and confidence. Founder reviews and sends. | Refunds, disputes, threats, account recovery, identity requests, unsafe travel or SOS concerns. |

A **weekly Roadmap agent already exists** in `.github/workflows/roadmap-agent.yml`: it produces a reminder by default and can optionally use Claude via the `ANTHROPIC_API_KEY` Actions secret. Keep it separate from daily operations; do not create duplicate daily strategic reports.

## How the tools cooperate

1. **GitHub** is the task ledger: observed incident -> one Issue; narrow proposal -> branch/PR; CI -> evidence; founder -> approval. An Issue is not evidence a fix was deployed.
2. **Cloudflare** runs the existing Worker and exposes read-only health. Never place Cloudflare, Cashfree or Firebase secrets in Issues, repo source, or model prompts. Worker health checks report *presence* of credentials, not their validity or payment success.
3. **Claude Code** may investigate a reproducible, low-risk issue and propose a small PR. It must report exact tests and leave auth, payments, Firestore rules, Pro entitlements, bank details and deployment for separate human review.
4. **ChatGPT** can triage Issue context, research, review a PR, draft support responses and write a founder briefing when invoked or through an explicitly enabled scheduled task. A chat session is not an always-on background worker.

## QA Scout activation

After reviewing/merging this PR, open **Actions -> RoamWise AI QA — Payment Health Watch -> Run workflow** once. It requires no model API key and no Cloudflare account token. Optionally set repository variable `ROAMWISE_WORKER_URL` to the correct public HTTPS Worker origin; otherwise the script uses the current `roamwise-api` origin. The workflow reads no customer accounts or payment records. On failure it files at most one open Issue with the exact title `[AI QA] RoamWise payment health check failed`; close it manually after investigation. The monitor does **not** create orders or certify payment success.

## Support Drafter prompt contract

When a founder-authorized case is supplied, use this instruction: "Summarize the customer's issue in one sentence. Separate observed evidence from hypotheses. If payment may have been debited, tell the customer not to pay twice and request a redacted order ID, never credentials. Draft one short response and an internal reproduction checklist. Do not send, refund, grant Pro, change account access or claim the issue is solved. Escalate money, security and emergency cases to a human." Never ingest full phone numbers, private keys, bearer tokens or unnecessary personal data into GitHub Issues.

## Low-error release gates

- **Read-only first:** each new role spends its first week reporting only. Review false positives and duplicate issues before adding any write actions.
- **One owner per task:** no two agents independently modify the same file or send the same customer reply. Assign a GitHub Issue before Claude starts; ChatGPT reviews the finished PR.
- **No silent fallback:** unknown metrics must be shown as unavailable, not invented; failed checks do not imply customer money was lost.
- **Human sign-off always:** payments, refunds, subscriptions, bank/UPI changes, secret rotation, user deletion, bulk outreach, production merges and deployments are founder-approved operations.
- **Bound costs and noise:** start with existing GitHub Actions schedules and manual model calls, cap API usage when enabling Claude, keep read-only outputs short, and turn off a role that repeatedly produces false alerts.

## Current limits and what completion means

A healthy Worker, a passing test suite and a Cashfree checkout opening are three different facts. An end-to-end payment is verified only by Cashfree `PAID`, matching recorded INR amount/order/UID, durable entitlement, and a second login. This pilot is not a production customer-support integration; the Support Drafter only operates when a case is explicitly provided. Do not represent the three roles as fully autonomous employees until their triggers, permissions, outputs and real-world acceptance checks have all been verified.
