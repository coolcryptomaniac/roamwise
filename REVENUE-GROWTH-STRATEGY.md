# Revenue growth & DAU strategy — grounded in what's actually shipped

Written against the repo at commit `fc7d721` (2026-09-07) on `main`, for a
product with **~29 registered users and ~5 Pro subscribers today**. Every
recommendation below cites the real file/feature it builds on. Where a number
is a projection rather than a fact, it's labelled as one, with the assumption
stated so the owner can swap in their own.

**A note on data grounding.** This doc uses the owner-supplied ~29
registered / ~5 Pro figures as ground truth for "today." There is no DAU
instrumentation anywhere in this codebase yet (checked: no `DAU`, "daily
active", or analytics-aggregation code outside one aspirational, unrelated
projection table in `AUTOPILOT-PLAYBOOK.md` — see the DAU section below).
`js/admin/business-metrics.js` (PR #140) computes real MRR/ARR/EBITDA from
live Firestore payment records the moment the owner opens the admin Business
tab, and should be the source of truth for revenue numbers going forward —
this doc doesn't restate live figures it can't independently query from this
session, and the owner should re-check that dashboard before acting on
anything time-sensitive here.

---

## 1. Revenue growth ideas, prioritized for a ~29-user product

The honest framing first: **at 29 users, no single lever is "big" in
absolute rupees.** The right question isn't "what maximizes revenue this
month" — it's "what compounds," because a 29-user base multiplied by a bad
channel stays 29 users, and multiplied by a good one becomes 300.

### Tier 0 — turn on revenue that's already built and switched off (do this first, ~15 minutes, zero new code)

This is the highest-leverage item in this entire document, and it isn't a
new idea — `GROWTH-AND-MARKET-INTEL.md` §2 already flagged it (2026-08-28)
and it appears to still be unclaimed:

- **`js/booking/affiliate-links.js`** and **`js/booking/affiliate-config.js`**
  implement a complete, working affiliate-link router (`rwAffLink()`,
  `RW_AFFILIATE_PROGRAMS`, the Travelpayouts/Cuelinks/EarnKaro/Admitad wrap
  helpers) that every "Book this trip" tap, stays/flights/things-to-do link,
  and the Compare Destinations booking grid already routes through. **Every
  `AFF_*` ID (`AFF_BOOKING`, `AFF_SKYSCANNER`, `AFF_AGODA`, `AFF_GYG`,
  `AFF_TRAVELPAYOUTS`, etc.) is currently blank.** The code silently falls
  back to a plain, non-monetized link when the ID is empty
  (`rwBookGridHTML()`'s own footer text literally says "Direct links... no
  affiliate relationship active yet" when this is the case). Filling these
  in via `config/app` in Firestore is a signup-and-paste job, not an
  engineering task — `REVENUE-INTEGRATIONS.md` §1 has the actual signup
  steps (Travelpayouts + GetYourGuide first, both approve small publishers).
- Same pattern for `PLAYSTORE_URL` (unlocks the two already-built "Rate us"
  nudges) and `WA_NUMBER`/`WA_CHANNEL`/`WA_GROUP` (unlocks the WhatsApp FAB
  and the broadcast cadence `CONTENT-GROWTH-PLAN.md` already assumes exists).
- **Why this is Tier 0 and not "Tier 3, ad revenue":** this isn't ad
  revenue — it's commission on bookings real users are already about to make
  regardless of whether RoamWise gets paid for the click. It costs the user
  nothing extra. At 29 users this will not be a lot of rupees, but it is the
  only lever on this list with **zero incremental cost, zero build time, and
  zero downside** — there is no version of "don't do this yet."

### Tier 1 — the campus channel (NMIMS), because it's the one lever that can 10x the user base in one motion

`nmims/index.html` already ships a live, public landing page offering **500
lifetime Pro passes split 50 (early/organiser) + 450 (general)**, at
**₹0 cost to NMIMS** (the page's own math: "₹1,49,500 reference value
(₹299/account × 500 passes) → ₹50,000 at the founder-offer price → ₹0 cost
to NMIMS" — RoamWise is absorbing the founder-offer economics as
acquisition cost, per `PRICING-REFERRAL-MATH.md` §4's "loss-leader, not
revenue" framing). Two things are already wired and live, not proposed:

1. **The free-seat claim path** (`js/payments/partner-redeem.js`,
   `partnerClaims` Firestore collection, one-time codes like
   `NMIMS-A1B2C3`) — this drives *users*, not revenue directly, but it's the
   only lever here that can plausibly move the user count from 29 to
   several hundred in one semester.
2. **`NMIMS2026`** — a live campus-referral code in `referral-data.js`
   (`type: 'campus'`), paid at the same flat **30%** everyone else is on.
   Anyone who buys a paid plan via `roamwise.co.in/nmims/?ref=NMIMS2026`
   pays RoamWise directly and NMIMS/the campus champion earns commission —
   this is the *monetization* half the free-seat claim page doesn't cover.
   `PRICING-REFERRAL-MATH.md` §5 has the raw commission-owed table at
   250/500/1,000/2,000 signups (e.g. 500 Pro-yearly signups ≈ ₹3,74,850 in
   commission *owed out*, meaning ≈₹8.7L net to RoamWise after the 30% cut
   and gateway fee — real money at real campus scale, not a rounding error).

**What actually needs the owner's judgment here, not this doc's:** whether
the 500-seat claim page has actually been distributed to NMIMS students yet,
and what the real activation timeline looks like (a signed MOU existing in
`nmims/mou/` doesn't by itself mean seats have been claimed — check the live
`seatsLeft` counter via `nmims/admin.html` or the `meta/signupCounter`
Firestore doc before assuming any of this has started). If it hasn't
launched yet, this is the single highest-leverage thing to prioritize
launching over anything else in this document — campus partnerships are the
one growth motion here that can scale distribution *fast* (hundreds of
seats in weeks, not the linear trickle of one-at-a-time creator outreach).

### Tier 2 — the referral/creator-commission system, because it compounds (not because it's fast)

`CREATOR-OUTREACH.md`'s Applied → Partner → Featured ladder (30-day trial →
30% commission + 1yr free → lifetime Pro at 25 sales) is fully built:
public landing page, admin CRM, four pitch-composer templates, an automated
promotion trigger, and hard Firestore-rule guardrails against self-dealing
(`refSales` only moves via an admin "+1 sale" button — nothing client-side
can inflate it). **This is real infrastructure sitting mostly idle** — the
active roster in `referral-data.js` today is 3 staff members
(Febin/Deepanshi/Adarsh) plus the NMIMS campus code; the creator-partner
slots (`RW-C01-...`, `RW-A01-...`) are commented-out placeholders, meaning
**zero external creators or affiliates have actually been signed yet.**

Why this is Tier 2 (real, but slower than the campus channel): a referral
program's payoff is proportional to the number of active referrers ×
their reach, and right now that number is effectively 3 people plus one
campus code. `CREATOR-OUTREACH.md` itself is honest about the discipline
this needs ("twenty researched emails outperform five hundred blasts") —
it's a compounding channel, not a fast one. The highest-leverage move here
isn't more code, it's **actually signing the first 3-5 external creator
partners** through the already-built `/creators/` page and admin CRM. Every
week this sits at 3 internal referrers is a week of a built system doing
nothing.

One specific, already-flagged gap worth closing here: `GROWTH-AND-MARKET-INTEL.md`
§3 notes the in-app Share button (`shareApp()`/`doShare()` in `app.js`)
sends a **plain link with no referral code attached**, even from a device
that arrived via one. Stamping an active `?ref=` code onto that device's own
outbound shares (the "narrow fix" that doc proposes) is a small, low-risk
change that would let the existing 3 staff referrers' networks chain
further than one hop — worth doing before recruiting more external
creators, since it makes every creator's own shares compound instead of
dead-ending.

### Tier 3 — the new Cashfree one-off payment capability: a conversion-rate lever, not a growth lever

`CASHFREE-INTEGRATION-SETUP.md` documents a real, shipped (but likely not
yet flipped on — see below) integration: `worker/handlers/cashfree.js` +
`js/payments/providers/cashfree-adapter.js` add automatic, self-serve
checkout for **one-off/one-time purchases only** (Founder offer, long-term
passes, short-term passes — Cashfree is not yet approved for recurring
subscriptions on this merchant account, so Plus/Pro/Elite monthly/yearly
still route through manual UPI). This doesn't create new demand — it
removes friction from demand that already exists:

- Today, a one-off purchase (e.g. a ₹19 day-pass or the ₹100 Founder offer)
  requires the buyer to manually pay via UPI and wait for the owner to
  verify and grant access. That gap between "wants to pay" and "has access"
  is exactly where casual buyers abandon.
- Turning it on is one Firestore field (`config/app.PAYMENT_PROVIDER =
  "cashfree"`) once the Worker secrets are set — see the setup doc's step 4.
  **Check whether this has actually been flipped on in production** before
  assuming it's live; the doc's own default note says `PAYMENT_PROVIDER`
  still defaults to `manual_upi`.
- Real cost to weigh: Cashfree takes **~2% per transaction** vs. 0% on
  manual UPI (`roamwise@ybl`) — worth it once the hour-a-week manual
  verification cost exceeds the fee (same threshold logic
  `BUSINESS-FINANCE-SETUP.md` §4 already lays out for Razorpay). At ~5 Pro
  subscribers, manual verification almost certainly costs less than an hour
  a week today, so this is a "turn on before the NMIMS push, not urgently
  today" item, not a Tier-0 fire drill.

### What genuinely won't move the needle yet (be honest about this)

- **Any form of ad revenue.** `AUTOPILOT-PLAYBOOK.md`'s own aspirational
  ₹8 Cr/yr table prices AdMob at "₹150 eCPM-blended per 1K DAU-yr" against a
  **500K MAU** assumption — three to four orders of magnitude past a
  29-user base. At current scale, ad revenue rounds to ₹0 and the UX cost
  of showing ads to 29 people who might become paying advocates is not
  worth it. Don't build this yet.
- **B2B/API/white-label deals** (also in that same aspirational table) —
  these need a track record and volume to even get a meeting. Not a near-
  term lever.
- **Merch/print-on-demand** (`REVENUE-INTEGRATIONS.md` §3, Qikink) — real
  ~34% margin per tee, but it's a demand-side, not distribution-side, lever:
  it only pays off once there's an audience large enough to sell
  merchandise *to*. Sequence it after Tier 1/2 grow the base, not before.
- **The 4-rung pricing ladder itself.** `PRICING-REFERRAL-MATH.md` §1
  already made the case (and this doc isn't re-litigating it) that
  restructuring Free/Plus/Pro/Elite is not the lever to pull — referral
  margin is a flat 67.64%/70% regardless of which rung a sale lands on, so
  distribution (Tiers 0-2 above), not pricing structure, is where the
  leverage is at 29 users.

---

## 2. DAU targets — staged, with explicit reasoning, not a fabricated number

**There is no DAU instrumentation in this codebase today.** This is a real
gap, not just a documentation gap — before setting any target, the first
concrete action is instrumenting daily-active tracking (Firebase Analytics
already loads in this app per its config; a `daily_active` or session-start
event is the minimum viable version). Everything below is a *planning
range*, not a measured baseline, and should be replaced with real numbers
the moment tracking exists.

### Reasoning from what's known

- **~29 registered users today.** Registered ≠ daily active. For an early,
  mostly-organic product with no retention loop proven yet, a realistic
  DAU/registered ratio is commonly cited in the 5-15% range for consumer
  apps without a strong daily-use hook — and RoamWise's core use case
  (trip *planning*) is inherently bursty, not daily, for any one user
  outside of an active trip. **A defensible current-state estimate is
  low single digits (2-5 DAU)** — this is an assumption, not a measured
  fact, and the owner should sanity-check it against Firebase Auth's own
  "recently active" filter or Firestore `lastSeen` timestamps (if either is
  already tracked) rather than trust this document's guess.
- **The NMIMS 500-seat cohort is the one lever that can change the order of
  magnitude, not just the count.** If even a conservative 5-10% of a
  500-seat claimed cohort opens the app on a given day during
  active-semester weeks (a plausible range for a claimed-but-optional
  utility app, well below what a required-use app would see), that alone
  is **25-50 DAU** — roughly 5-10x today's entire registered base, from one
  channel. This is explicitly a **claimed-seats** assumption: it only
  applies once/if the 500 seats are actually distributed and activated, not
  from the MOU/proposal existing on paper.
- **Content funnel targets already exist and are conservative.**
  `CONTENT-GROWTH-PLAN.md`'s own month-3 target is "150 installs / 20 Pro"
  from the whole content funnel (Reels/LinkedIn/YouTube/WhatsApp combined)
  — that's *installs*, not DAU, over 3 months, from a channel that's
  slower and less concentrated than the campus channel above.

### Staged milestones (ranges, not point estimates)

| Horizon | DAU range | Primary driver | Key assumption to validate |
|---|---:|---|---|
| **Today (baseline, to be measured)** | 2-5 | Organic/existing 29 | Needs real instrumentation before this is more than a guess |
| **30 days** | 5-15 | Content funnel (`CONTENT-GROWTH-PLAN.md` Month 1) + any NMIMS seats claimed so far | Content cadence is actually being run at the stated weekly baseline; NMIMS distribution has started |
| **60 days** | 15-40 | NMIMS claim-page distribution reaching a meaningful share of the 500-seat cohort, referral loop (Tier 2 above) starting to chain | 10-15% of NMIMS's 500 seats claimed by day 60, at the 5-10% same-day-activity rate above → 25-50 DAU from that cohort alone once claimed, even before content/referral add more |
| **90 days** | 30-80 | Full NMIMS cohort activation during active semester weeks + `CONTENT-GROWTH-PLAN.md` Month 3 target (150 installs/20 Pro) landing + first external creator partners live | Requires the Tier 1/2 items above to actually ship (creator partners signed, share-button ref-code fix), not just exist as capability |

**Why these are ranges, not one number:** the single biggest unknown is
NMIMS activation timing and rate, which this doc cannot know without the
owner's real read on the partnership's current status (has distribution
started? what's the campus champion's actual cadence?). A 25-50 DAU jump
from that cohort is *conditional on activation happening*, not a schedule
this document can commit to on the owner's behalf.

---

## 3. Offers/promotions strategy — mechanics that already exist, or need one small addition

Every mechanic below is graded honestly: **buildable now** (the Firestore
schema/UI/rule already exists, it's a content/config change) vs. **needs a
small addition** (new field or one new UI surface, not a new subsystem).

### Buildable now

1. **Time-boxed "second cohort" campus offer.** The Founder offer pattern
   (`RWPricing.CONFIG.FOUNDER_OFFER`, capped at seats *or* days, whichever
   first — `PRICING-REFERRAL-MATH.md` §4) and the NMIMS partner-claim
   pattern (`partnerClaims` collection, `js/payments/partner-redeem.js`)
   are both generic, not NMIMS-specific in their mechanics. A second campus
   (or a second NMIMS cohort — e.g. next semester's incoming batch) can
   reuse the identical claim-code flow with a new prefix (e.g.
   `NMIMS2027-XXXXXX`) and its own seat cap, with **no new code** — it's a
   new Firestore `partnerClaims` batch plus a landing-page copy of
   `nmims/index.html`. **One explicit caution from `CREATOR-OUTREACH.md`
   itself applies directly here:** "Do not reopen [a closed lifetime
   offer]... price a *new* offer" — so a second cohort should be a
   genuinely new, separately-priced/scoped offer, not a reopening of the
   original 500-seat NMIMS batch once it closes.
2. **Campus-specific promo/referral code for a new partner.** Adding a row
   to `RW_REFERRERS` in `referral-data.js` (`type: 'campus'`, same flat 30%
   everyone else is on) is a one-line addition per new campus/partner —
   this is exactly how `NMIMS2026` itself was added. Zero new engineering.
3. **Referral-code stamping on shares** (see Tier 2 above) turns every
   existing referrer/creator/campus code into a self-propagating promo
   mechanic — worth building before recruiting more partners, since it
   makes each one more valuable.

### Needs a small addition (flagging scope honestly, not building it here)

4. **Referral-streak bonus.** The app already has a working daily-return
   streak mechanic — `js/game/badges.js`'s `rw_streak` (localStorage-backed,
   XP bonus scaled by streak length, `'3-day streak'` Scout badge) and its
   display in `js/itinerary/journey-log.js`. This is currently **pure
   engagement gamification with no revenue/referral tie-in.** A
   referral-streak bonus (e.g. "refer someone every week for N weeks, bonus
   commission or a tier upgrade") would need: (a) moving streak state from
   localStorage to a per-user Firestore doc so it's visible server-side to
   whoever approves referral payouts, and (b) a small rule linking streak
   length to a bonus in the existing referral-payout admin flow. Neither
   piece exists today — this is a real but small addition, not a rebuild.
5. **Auto-generated per-user trackable codes for every signed-in user**
   (the "wider option" `GROWTH-AND-MARKET-INTEL.md` §3 explicitly flags as
   a founder decision, not a bug fix) — this is the real "invite your
   friends" viral loop, distinct from the curated staff/creator/campus list
   in `referral-data.js` today. `CREATOR-OUTREACH.md` deliberately keeps
   referral curated today because of DPDP Act exposure and fraud/spam
   surface at any scale — opening this to all 29+ users is low-risk at
   *this* size (curation exists mainly to survive scale, and DPDP/fraud
   surface both grow with volume, not headcount at 29 users) but is
   explicitly the owner's call, not a default recommendation here.

---

## 4. Push notifications' role in retention/DAU — a content list, not the build

This app already has real, partially-wired push infrastructure to build
this feature on top of, not from scratch:

- **`firebase-messaging-sw.js`** — a Firebase Cloud Messaging service worker
  already handling background push display (`self.registration.showNotification`),
  wired for Firebase Console's own notification composer.
- **`js/boot/init.js`** — Capacitor `PushNotifications` and `LocalNotifications`
  plugin wiring for the native app shell (permission requests, foreground/
  background listeners, tap-to-navigate via `tabGo('home')`).
- **`js/audio/reminders.js`** — browser `Notification` API–based trip
  reminders already exist (permission request flow, `rw_notify` localStorage
  flag gating whether reminders fire), scoped to reminders the user set
  themselves.
- **`js/game/badges.js`'s streak mechanic** (see §3.4 above) is the natural
  trigger source for a retention-notification content stream, once it moves
  server-side.

None of the above is a general marketing/retention push channel yet — it's
reminder- and FCM-composer-scoped. Below is the **trigger content list**
for the separate push-notification feature being built this session — what
to notify on, ranked by expected retention value for a *travel-planning,
inherently bursty-use* product, not a to-do-list app that's used daily by
default:

1. **Trip reminders (already exists as a pattern — extend, don't invent).**
   `js/audio/reminders.js` already has the mechanic; the natural extension
   is server-triggered reminders (upcoming-trip countdown, day-of checklist)
   that fire even when the app isn't open — the single highest-confidence
   trigger because it's tied to something the user already asked for.
2. **Streak reminders.** Directly reuses `rw_streak` — "your 4-day streak
   ends today" is a proven retention pattern (Duolingo-style) and the app
   already computes and displays this number; it just isn't pushed
   proactively yet.
3. **Price-drop / crowd-calendar alerts.** RoamWise's stated differentiator
   is real local prices and crowd calendars (`CONTENT-GROWTH-PLAN.md`'s "one
   honest, specific, useful thing" framing) — a notification when a
   saved/watched destination's crowd calendar or price data changes is the
   single trigger most aligned with the product's actual value prop, not a
   generic engagement hack. This is the trigger most likely to bring back a
   *lapsed* planner, not just remind an active one.
4. **New-guide-published / itinerary-library additions.** The itinerary
   preset library (`itinerary-library/`, wired via
   `itinerary-library/preset-loader.js`) already exists as a content
   source; notifying users when a new cinematic preset/guide relevant to
   their saved destinations goes live gives a reason to open the app with
   no trip currently planned — useful specifically for the DAU (not just
   retained-during-a-trip) goal.
5. **Referral/streak-bonus milestone notifications** (once §3.4 above is
   built) — "you're 2 sales from Partner tier" mirrors the automatic
   promotion logic `CREATOR-OUTREACH.md` already describes in the admin,
   surfaced proactively to the referrer instead of them checking manually.
6. **Founder/campus-offer urgency notifications** (seats-remaining or
   days-remaining countdowns) — directly reuses the live `seatsLeft`/
   `founderOfferOpen()` data already computed in `js/pricing/one-off-plans.js`
   and rendered on `nmims/index.html`'s seat bar; a push version of the same
   real, non-fabricated countdown.

**What NOT to build into this list:** generic "come back!" pushes with no
concrete trigger. `js/game/badges.js`'s own code comment is explicit about
this design philosophy already: *"streaks, no notifications nagging you
back — those train a habit of checking [not of using]."* The list above is
deliberately all trigger-based (something real changed) rather than
schedule-based (a timer fired), consistent with that existing product
stance — the push feature should extend that philosophy, not override it.

---

## 5. Open questions that need the owner's judgment, not this doc's

- **Real marketing/ad budget**, if any — every recommendation above assumes
  ~₹0 paid acquisition, because that's what a 29-user pre-revenue-scale
  product typically has. If there is a real budget, the priority order
  changes (paid campus-targeted ads could accelerate Tier 1 rather than
  waiting on organic distribution).
- **Actual NMIMS partnership status** — whether the 500-seat page has been
  distributed, what the campus champion's real cadence is, and whether the
  signed MOU (`nmims/mou/`) has a concrete activation date. This single
  fact changes the 60/90-day DAU ranges more than anything else in this
  doc.
- **Whether Cashfree (`config/app.PAYMENT_PROVIDER`) has actually been
  flipped on in production**, or is still sandbox-only per
  `CASHFREE-INTEGRATION-SETUP.md`'s default-off note.
- **Whether to open referral codes to all users** (§3.5) — a real product/
  risk decision `GROWTH-AND-MARKET-INTEL.md` already flagged as the
  owner's call, not a default this doc is making.
- **DAU/analytics instrumentation** — this doc's staged targets are
  unverifiable without it; standing up basic daily-active tracking should
  be treated as a prerequisite task, not a nice-to-have, before the 30-day
  milestone above can be checked against reality.
