# ChatGPT Ads — RoamWise launch pack (test phase)

Status: DRAFT for owner approval. Nothing here spends money; the founder opens
Ads Manager, pastes the copy, sets the budget and pays. Figures about ChatGPT Ads
(India self-serve from ~1 Sep 2026, ~₹725/day minimum, CPC/CPM/oCPC bidding, ads only
for logged-in Free and Go users, landing page crawled by `OAI-AdsBot` before approval)
come from secondary press coverage — confirm each in Ads Manager before committing.

## Claude has no ads
Anthropic has publicly pledged Claude stays ad-free, so there is nothing to buy there.
To show up in Claude/ChatGPT/Perplexity *answers* (free, organic): keep `robots.txt`
open to their crawlers (done), keep `llms.txt` accurate, keep structured data on
pages, and publish genuinely useful guides. Do NOT bulk-generate thin pages (see the
AdSense lesson, v88).

## Pre-flight (done in this branch)
- [x] `robots.txt` explicitly allows OAI-AdsBot, OAI-SearchBot, GPTBot, ClaudeBot, Claude-SearchBot, Claude-User
- [x] Landing page returns full HTML (200) to all of those user agents; hosted on GitHub Pages, no bot wall
- [x] Real `/favicon.ico` (ad review checks for one)
- [x] Paid-click attribution: `js/misc/ad-attribution.js` -> anonymous daily counters
      `ad_visits`, `ad_signups`, `ad_purchases` in Firestore `stats/{day}` (needs the rules in this
      branch to be deployed — they deploy automatically when merged to `main`)
- [x] Homepage og/twitter/promo text now says the ₹100 lifetime is the founder offer (first 1,000 members), then standard plans

## Landing URL (use the apex host, avoids a redirect)
```
https://roamwise.co.in/?utm_source=chatgpt&utm_medium=cpc&utm_campaign=india_test1
```
**Never add `utm_content`** — `js/pricing/referral.js` treats it as a *referral code* and would
credit/route a fake referral. Attribution only accepts utm_medium = cpc | paid | ads | ppc.

## Test design
| Item | Setting |
|---|---|
| Budget | daily minimum (~₹725) for 14 days ≈ ₹10k total. One campaign, 2 ad variants. |
| Bidding | start with CPC (simplest to reason about) |
| Category | Travel — standard review (no licence docs needed) |
| Audience | India, 18+, travel-planning conversation context |
| Success metric | cost per **signup** (`ad_signups`), then per **purchase** (`ad_purchases`) |
| Stop rule | after ~₹5k spend, if `ad_visits` < 40 or 0 signups -> pause and revisit copy/landing |
| Scale rule | only if cost/signup is under what a Plus (₹99) buyer is worth after payment fees |

Read results in two places: ChatGPT Ads Manager (impressions, clicks, spend) and the admin
funnel (`stats` counters). Clicks >> `ad_visits` means the page is slow/blocked for those users.

## Ad copy drafts (approve or edit before use; keep claims true)
**Variant A — outcome**
- Headline: Plan your India trip in one line
- Body: Tell RoamWise "4 relaxed days near Rishikesh under ₹12k" and get a day-by-day plan with a real rupee budget and a map. Free to start.
- CTA: Plan my trip

**Variant B — group trips**
- Headline: Group trip? Split costs without the fights
- Body: Shared trip chat, fair expense splitting and one plan everyone can see. Built in India, free to start.
- CTA: Start a trip

Rules: no "guaranteed", no unverifiable numbers ("195+ destinations" etc.), no fake urgency,
no health claims for the yoga content. Financial/legal/health categories need manual review —
RoamWise ads should stay pure travel.

## Autopilot boundaries
Claude can draft copy, prepare reports and open PRs for this pack. It does not create the ad
account, enter payment details or approve spend. Weekly check: add ad spend + `ad_*` counters to the
Monday health report.
