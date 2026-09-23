# RoamWise AI Tracker Control Plane

This is the read-only-first bridge for the shared RoamWise tracking spreadsheet.

## Security model

The tracker remains the source of observed operational facts. ChatGPT/OpenAI and Claude receive the same **sanitized, bounded snapshot**, analyze it independently, and return recommendations. A deterministic policy layer separates low-risk operational suggestions from founder-review items.

Version 1 is intentionally **report-only**. It does not write to Google Sheets, send email/WhatsApp, change pricing or commission, sign an MOU, move money, modify production, delete data, or make employment decisions.

The configured spreadsheet is:

`1DT6axL4O364ZRof5tOvNk8n6CxavF4UphWjhO2M65S0`

The exact tab/range allowlist is **not committed** because the connected ChatGPT Google account could not read the sheet on 2026-09-23. Set bounded ranges only after the owner grants the service identity access and the live sheet structure is inspected.

## Required GitHub Actions secrets

- `ROAMWISE_SHEETS_SERVICE_ACCOUNT_JSON`: JSON for a dedicated Google service account. Share only this tracker with that service account as **Viewer** for the report-only pilot.
- `OPENAI_API_KEY`: optional; enables the OpenAI reviewer.
- `ANTHROPIC_API_KEY`: optional; enables the Claude reviewer.
- `MAIL_USERNAME`, `MAIL_APP_PASSWORD`, `TO_EMAIL`: required private delivery path for this public repository. The workflow will not run tracker analysis unless these are present.

Never put any of those values in the Sheet, source code, Issues, or browser JavaScript.

## Required repository variable

`ROAMWISE_AI_SHEET_RANGES`

A semicolon-separated allowlist of bounded A1 ranges, for example:

`Deepanshi!A1:Z200;Febin!A1:Z200`

Use the real visible tab names. Whole-column ranges such as `A:Z` are rejected. End rows above the policy limit are rejected.

Optional model variables:

- `OPENAI_DECISION_MODEL` — defaults to `gpt-5.6-terra`.
- `ANTHROPIC_DECISION_MODEL` — defaults to `claude-sonnet-5`.

## Google setup

1. In Google Cloud, create a dedicated service account for RoamWise AI operations.
2. Enable the Google Sheets API in that project.
3. Copy the service account email.
4. Open the tracker in Google Sheets and share it with that email as **Viewer**.
5. Add the service-account JSON to the repository secret above.
6. After the live tab names are verified, add only the needed bounded ranges to `ROAMWISE_AI_SHEET_RANGES`.
7. Confirm the existing private founder-email secrets (`MAIL_USERNAME`, `MAIL_APP_PASSWORD`, `TO_EMAIL`) are configured.
8. Run **RoamWise AI Tracker Review** manually once before enabling reliance on its daily report.

Do not share an entire Drive folder when one Sheet is sufficient.

## What is sanitized before model calls

- Columns whose headers look like credentials, bank/identity documents or secrets are dropped.
- Email addresses and phone-like values in remaining cells are replaced with placeholders.
- Each range is row-bounded and capped again in code before it is serialized.
- Raw Sheet data is not written to GitHub Issues. The generated report contains model analysis and record references only.

Property names, task names, dates, stages, status, numeric KPIs and non-sensitive operational notes can remain because those are what the analysis needs.

## Decision policy

A recommendation is only marked **consensus / auto-eligible** when:

1. both configured models independently produce the same record ID + normalized action;
2. both label it low risk;
3. both are at or above the confidence threshold; and
4. the action is on the explicit allowlist.

Even then, V1 does not execute it. The first pilot is designed to measure false positives before any write-back path is enabled.

Anything involving payments, refunds, banking/UPI, commission, contracts, legal commitments, employee consequences, production, credentials/permissions, deletion or bulk outbound communication is founder review by policy.

## Direct ChatGPT / Claude access

This workflow is separate from the first-party app connectors.

For interactive ChatGPT analysis, connect Google Drive in ChatGPT using the Google account that can actually open the tracker. The account currently connected during setup returned permission denied for this Sheet, so reconnect/share before asking ChatGPT to edit it.

For interactive Claude analysis, use Claude's Google Drive/Workspace connector with an account that has access. Keep Claude read/review-only initially.

The service-account workflow exists so scheduled analysis does not depend on either personal account staying connected.

## Outputs

This repository is public, so tracker analysis must never be posted to an Issue, Actions artifact, commit, PR comment or workflow summary.

The workflow writes `ai-tracker-report.md` only on the ephemeral Actions runner, emails the founder review through the existing private Gmail/SMTP secret path, and then deletes the file. The email contains:

- data ranges reviewed (names only, never raw rows),
- OpenAI analysis,
- Claude analysis,
- consensus low-risk recommendations,
- founder-review recommendations,
- limitations/errors.

If the private email delivery secrets are absent, the tracker analysis does not run. If a model key is absent, the private report says that reviewer was not configured rather than inventing a second opinion.
