# Growth & market intel — 2026-08-28

Read alongside `CONTENT-GROWTH-PLAN.md` (content cadence), `SEO-BRAND-PLAN.md`
(search/entity), `CREATOR-OUTREACH.md` (partnerships), `PRICING-REFERRAL-MATH.md`
(referral economics) and `AUTOPILOT-PLAYBOOK.md` (the weekly operating system).
This file doesn't repeat those — it covers what they don't: the gstack
decision, revenue already built but switched off, one growth loop worth a
founder decision, and a dated digest of outside signal (Naval Ravikant, YC,
NVIDIA's Jensen Huang, "physical AI" capital, and travel/finance/business AI
news) filtered for what's actually usable here. Everything below is dated
because it decays — re-run the research prompt in §5 periodically rather than
trusting this file forever.

---

## 1. gstack — verdict: skip it

[garrytan/gstack](https://github.com/garrytan/gstack) is 23 role-based Claude
Code slash-commands (PM, security officer, QA lead, release engineer, etc.)
built to turn a solo founder into a virtual team. It's real and popular (85k
GitHub stars in 6 weeks) — but this Claude Code environment already ships
`security-review`, `code-review`, `run` (launch-and-verify), and `design`
(mockups) as native skills, which is most of gstack's actual value here. The
rest (Bun runtime, its own GBrain memory store) would duplicate what
`PROJECT-STATE.md` already does for this project. **Not installing it.**

The one idea worth stealing without the toolkit: Tan runs 10-15 short
"sprints" in parallel across branches/agents. That doesn't fit well yet —
RoamWise is a single `index.html` + `app.js` monolith, so parallel branches
touching the same file would just create merge conflicts. Worth revisiting if
the codebase ever splits into modules.

---

## 2. Turn on revenue you've already built (do this first — ~15 min, no rebuild)

These are live in `app.js` behind a Firestore remote-config doc
(`config/app`), editable straight from the admin console — no code change, no
new APK needed:

| Key | Currently | Unlocks |
|---|---|---|
| `AFF_BOOKING` | blank | Booking.com affiliate commission on every hotel link tapped |
| `PLAYSTORE_URL` | blank | "Rate us on Play Store" nudges (two places in the UI already wired, just waiting on the URL) |
| `WA_NUMBER` | blank | The WhatsApp floating action button (code checks for this before rendering it — currently invisible to every user) |
| `WA_CHANNEL` / `WA_GROUP` | blank | Broadcast links referenced in `CONTENT-GROWTH-PLAN.md`'s weekly WhatsApp cadence |

`REVENUE-INTEGRATIONS.md` §1 has the Travelpayouts/GetYourGuide signup steps
for the affiliate IDs still missing (`AFF_SKYSCANNER`, `AFF_AGODA`, `AFF_GYG`,
`AFF_TRAVELPAYOUTS` — same blank-and-wired pattern). Filling these in is
higher-leverage than anything else in this file: it's shipped code sitting
idle, not new work.

---

## 3. A growth loop worth a founder decision (not shipped — needs your call)

The in-app "Share" button (`shareApp()`/`doShare()` in `app.js`) sends a
plain link with **no referral code attached**, even from a device that has an
active one. Two different fixes are possible and they imply different
products:

- **Narrow fix**: when a device arrived via a partner's `?ref=` link and that
  code is still active (`rwRefActive()`), stamp it onto that device's own
  outbound shares too — so a friend-of-a-referred-user chains back to the
  original partner. Low risk, doesn't change who's eligible to earn.
- **Wider option**: let any signed-in user see and share *their own*
  trackable code, not just the curated staff/creator/affiliate list in
  `referral-data.js`. This is the actual "get users on your own" viral loop —
  but `CREATOR-OUTREACH.md` deliberately keeps referral curated (DPDP Act
  exposure, spam/fraud surface, domain-reputation risk from bulk anything).
  Opening it to every user is a real product decision, not a bug fix.

Flagging, not shipping — say the word and I'll build whichever one you want
next session.

---

## 4. Signal digest — Naval Ravikant, YC, Jensen Huang, "physical AI" capital

**Naval Ravikant (2026)** — repeating the same thesis you're already running
on: AI collapses the marginal cost of design/copy/analytics, so the efficient
company size keeps shrinking toward 2-5 people holding equity rather than
drawing salary. [Forbes](https://www.forbes.com/sites/josipamajic/2026/03/15/naval-ravikants-ai-thesis-is-playing-out-in-public-markets/) · [Capitaly.vc](https://www.capitaly.vc/blog/naval-ravikants-wisdom-angel-investing-startups-and-wealth-creation)
— **Directly applicable**: confirms don't hire past Febin/Mohit + AI; keep leverage in tools, not headcount.

**Y Combinator (2026)** — Spring RFS pushes "AI-native, not human-augmented"
(replace workflow steps outright, don't just assist them); a quarter of the
W25 batch shipped with 95%+ AI-generated code and became YC's fastest-growing
batch ever. [TheVCCorner](https://www.thevccorner.com/p/yc-summer-2026-requests-for-startups-ideas) · [StartupHub.ai](https://www.startuphub.ai/ai-news/artificial-intelligence/2026/y-combinator-ceo-on-ai-founder-psychology)
— **Applicable**: matches how RoamWise is already built (single-file app, Claude driving most of the code + content + ops per `AUTOPILOT-PLAYBOOK.md`). No change needed, just confirmation you're already doing the thing YC is telling people to do.

**Jensen Huang / NVIDIA (2026)** — "physical AI" (robots, autonomous
vehicles, industrial automation) declared as 2026's dominant capital
narrative at CES and GTC. [Axios](https://www.axios.com/2026/01/05/nvidia-ces-2026-jensen-huang-speech-ai) · [Automate.org](https://www.automate.org/ai/industry-insights/nvidia-declares-big-bang-of-physical-ai-at-gtc-2026)
— **Context only.** Not a lever for a software travel app.

**Physical AI capital** — a16z raised $15B+ (largest VC raise ever), with
$1.176B of it explicitly earmarked for "AI for the physical world"; SoftBank
is spending $5B+ rolling up robotics (ABB Robotics, a planned ~$100B "Roze"
spinout); physical-AI funding overall hit $47.4B across H1 2026.
[a16z](https://a16z.com/ai-for-the-physical-world/) · [CNBC](https://www.cnbc.com/2026/04/30/softbank-roze-ai-robotics-ipo-100-billion-ft-report.html) · [Crunchbase News](https://news.crunchbase.com/venture/physical-ai-funding-startups-robotics-aerospace-h1-2026/)
— **Low relevance, one thin bridge**: none of this money is chasing travel software; it's chasing robots and autonomous vehicles. Worth knowing only so you don't chase "physical AI" positioning for RoamWise — it's not your capital pool, and pretending otherwise in a pitch would read as noise to anyone who's seen this data.

---

## 5. Travel AI, finance AI, business-AI GTM — the actionable half

**Travel AI (highest-priority thread)**
- Google's AI Mode shipped agentic in-chat hotel/flight booking on **Aug 27,
  2026** with Booking.com, Expedia, Hilton, Marriott, Trip.com as launch
  partners. [Skift](https://skift.com/2026/08/27/googles-agentic-hotel-booking-tool-comes-to-ai-mode/)
- Expedia **acquired Layla** (Jul 31, 2026), an AI trip planner that had
  processed $1B+ in trip value on only $5.7M raised — small AI travel
  planners are exiting via acquisition, not scaling standalone.
  [Skift](https://skift.com/2026/07/31/expedia-acquired-ai-trip-planner-layla-exclusive/)
- Travel startup funding is down year-over-year (~$1B/44 rounds Q1 2026 vs.
  ~$1.2B/66 rounds Q1 2025) even as AI product interest rises.
  [PhocusWire](https://www.phocuswire.com/news/startups/travel-startup-funding-acquisitions-q1-2026)

  **What this means for RoamWise**: Google and Expedia are commoditizing
  generic "chat to book" fast. Competing there head-on is a losing lane for a
  solo shop. This is exactly why `CONTENT-GROWTH-PLAN.md`'s edge — honest
  local prices, scam warnings, crowd calendars, offline itineraries — is the
  right wedge, not a consolation prize. Nobody in this list is building that.
  Keep pushing the niche, don't chase feature-parity with the platforms.

**Finance AI** — agentic checkout (pay-in-chat, like Google's flow above) is
becoming a user expectation in fintech generally; 21% of financial firms have
agentic AI in production, 52% piloting. [TechInformed](https://techinformed.com/agentic-ai-and-more-to-reshape-fintech-in-2026/)
— Mildly actionable: if/when RoamWise adds in-app booking or split-cost
payments, design it "agent prepares, human approves" rather than a full form.

**Business AI / GTM for solo founders** — directly actionable:
- AI-assisted SEO content (2+ posts/week on long-tail pain-point keywords)
  is cited as solo founders' highest-ROI channel in 2026, cutting CAC ~37%
  vs. traditional marketing. [fi.co](https://fi.co/insight/how-solo-founders-are-building-unicorns-with-ai-tools-in-2026-and-where-to-learn-it-live)
  — this is already the plan in `SEO-BRAND-PLAN.md`/`CONTENT-GROWTH-PLAN.md`;
  the data says keep it and don't dilute frequency.
- Common 2026 solo-founder stack beyond what you're using: Hypefury (~$19/mo)
  or Taplio (~$65/mo) for scheduled/automated LinkedIn+X posting — could
  absorb some of Febin's manual LinkedIn cadence if it ever becomes the
  bottleneck. Not urgent at current volume (3 posts/week is easily manual).
  [hireemma.ai](https://www.hireemma.ai/blog/solo-marketer-ai-tools-best-picks-all-in-one)

---

## 6. Priority order, this week

1. Fill in the blank config keys in §2 (15 min, unlocks revenue already shipped).
2. Decide on the referral-share question in §3 — reply here or next session.
3. Nothing else needs to change this week — the content/SEO/creator plans
   already in this repo match what the outside data says is working in 2026.
   Keep running them, don't add new channels on top.
