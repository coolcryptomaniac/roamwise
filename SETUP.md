# 🥷 RoamWise Agent — 10-Minute Setup

Your autonomous ops agent: **daily health + funnel report (09:00 IST)** and
**weekly SEO regeneration (Sunday)**, running free on GitHub Actions.

## Why this is safe (your "encrypted + revocable" requirement)
- Secrets live in **GitHub Actions Secrets**: encrypted at rest, automatically
  masked if a log ever tries to print them, and **deletable in one click**
  (repo → Settings → Secrets and variables → Actions → 🗑 = instant revoke).
- You never use your real passwords: Gmail gets a **scoped App Password**
  (revocable at myaccount.google.com → Security → App passwords) and Firebase
  gets a **service-account key** (revocable at Firebase console → Project
  settings → Service accounts).
- The agent's code is in your repo — you can read every line it runs.
- NEVER paste real passwords into any chat, form, or DM. Nothing legitimate needs them.

## Step 1 — Upload these files (2 min)
Repo → Add file → Upload files → drag the **`.github`** and **`agent`** folders
(keep the folder structure) → Commit.
> Uploading folders is easiest from desktop. On phone: create each file via
> "Create new file" and type the path like `.github/workflows/roamwise-agent-daily.yml`.

## Step 2 — Turn it on (30 sec)
Repo → **Actions** tab → enable workflows if prompted → open
"RoamWise Agent — Daily Ops" → **Run workflow** (manual test).
Within ~1 minute an Issue titled "🥷 Daily report" appears. That's your agent alive.

## Step 3 — Unlock the money/funnel digest (3 min, optional but recommended)
Firebase console → ⚙️ Project settings → **Service accounts** →
**Generate new private key** → a JSON file downloads.
Repo → Settings → Secrets and variables → Actions → **New repository secret**:
- Name: `FIREBASE_SERVICE_ACCOUNT`
- Value: paste the ENTIRE contents of that JSON file
**Revoke anytime:** Firebase → Service accounts → manage keys → delete.

## Step 4 — Email delivery (3 min, optional — Issues work without it)
Gmail → myaccount.google.com → Security → 2-Step Verification ON →
**App passwords** → create one named "roamwise-agent" → copy the 16 chars.
Add three secrets:
- `MAIL_USERNAME` = your Gmail address
- `MAIL_APP_PASSWORD` = the 16-character app password
- `TO_EMAIL` = where reports should arrive (can be the same Gmail)
**Revoke anytime:** delete the app password. The agent falls back to Issues.

## What runs when
| Schedule (IST) | Job | Output |
|---|---|---|
| Daily 09:00 | Health checks (5 pages, speed, size) + 7-day funnel + revenue + pending claims + latest user ideas + auto-diagnosis | GitHub Issue + email |
| Daily 10:30 | **SEO Publisher: 3 new guide pages** built from REAL climate data (Open-Meteo ERA5) — best-months verdict, 12-month weather table, packing, FAQ schema, internal links — then auto-commits & updates the sitemap | Auto-commit "🤖 agent: +3 SEO pages" |
| Sunday 09:30 | Regenerates the core app-DB guides/blog + rescans the full sitemap | Auto-commit |
| Site down | Report title turns 🔴 SITE DOWN with fix steps | Issue + email |

## The 1,000-page compounding machine
- Seed queue: **147 destinations** (India-heavy + world). At 3/day ≈ **1,100 pages/year**.
- When the queue runs low it **self-extends**: every finished destination spawns
  12 "X in January/February/…" month pages → 1,700+ page runway built in.
- Change the pace anytime: Actions → Daily SEO Publisher → Run workflow → set
  pages (2–5). 5/day ≈ 1,800/yr. Quality guardrails: every page carries real
  per-coordinate climate data, computed verdicts, FAQ JSON-LD and internal
  links — data pages, not AI spam.
- **Optional secret `GEMINI_API_KEY`** (free at aistudio.google.com/apikey):
  upgrades each page's intro to unique model-written prose. Revoke = delete key.
- Honest Google note: new domains take 3–6 months to rank meaningfully.
  Submit the sitemap in Search Console once, then let compounding work.

## The human+AI loop
Every report ends with a **"paste this to Claude"** block. Monday, 5 minutes:
open the latest report → copy that block → paste to Claude → ship the update.
The agent maintains and watches; Claude and you build. That's the whole company.
