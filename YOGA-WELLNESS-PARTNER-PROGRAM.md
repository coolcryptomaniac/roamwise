# Yoga & Wellness Partner Program — package terms

Self-serve onboarding for yoga instructors, studio owners and retreat hosts
("yogapreneurs"). **Let them come on their own** — same principle as
`CREATOR-OUTREACH.md`: no cold outbound, no manual sales/BD touch. A public
page (`/yoga/`) explains the offer; they apply themselves; the founder
reviews and activates from the admin, same as every other inbound channel
this app already has.

This doc is the source of truth for the on-page copy on `/yoga/index.html`
and for `partnership/index.html`'s new track card. If the two ever drift,
this file wins.

---

## 1. Why this is a variant of the existing creator ladder, not a new one

`CREATOR-OUTREACH.md`'s offer ladder (25% Applied → 30% Partner → lifetime
Pro Featured) is **reused as-is, unchanged rate for unchanged rate**. A yoga
instructor referring students to a RoamWise Pro subscription is doing
exactly what a travel creator referring viewers is doing — the commission
math in `PRICING-REFERRAL-MATH.md` §3 doesn't care what content produced the
click, only that a sale happened and a code is attached to it. There is no
concrete, well-reasoned case for a wellness-specific commission rate: the
underlying unit economics (net margin 67.64% Razorpay / 70% UPI of whatever
the buyer paid, per §2) are identical regardless of vertical, so inventing a
different percentage here would just be arbitrary.

What *is* genuinely different for this vertical, and what this package
actually adds on top of the unchanged ladder, is a **second, real
distribution channel**: a bookable listing in RoamWise's existing Certified
Experience catalog (§3below), so a yoga partner earns from direct retreat/
class bookings, not only from Pro-subscription referrals.

## 2. Base: the referral ladder (identical rates, wellness-flavoured triggers)

| Step | Trigger | They get |
|---|---|---|
| **Applied** | anyone accepted | 30-day full Pro trial (zero marginal cost) + affiliate code live immediately: students get the standard checkout referral benefit, instructor keeps **25%** |
| **Partner** | first Certified Experience listing goes live (`status:'certified'`, §3) **or** 5 referred Pro sales | 1 year Pro free + commission to **30%** + roadmap input |
| **Featured** | 25 referred Pro sales **or** a dedicated in-app feature | Pro for life (earned) + listing routed featured in-app with credit + co-marketing |

The only change from the generic creator ladder is the Partner trigger's
first leg: "1 published piece" (a video/blog, for a travel creator) becomes
"first Certified Experience listing goes live" for a yoga partner — their
real equivalent of publishing content, since their most natural
demonstration of legitimacy is a verified class/retreat listing, not a Reel.
The "OR 5 referred sales" leg is untouched.

Same failsafes as `CREATOR-OUTREACH.md` apply without modification: tier,
`refSales` and `refRevenue` are founder/admin-set only, never
self-awardable; promotion at the 5-sale and 25-sale thresholds is automatic
in the admin, not claimable by the applicant; commission is only ever paid
on an approved, non-refunded, attributed sale.

## 3. Wellness-specific addition: Certified Experience listing

Reuses `js/misc/experiences.js` / `experiences-data.js`'s existing
`window.RW_EXPERIENCES` catalog schema verbatim — no new data structure.
Today an entry requires:

```
{ id, tier, status,      // status: 'certified' | 'scouting'
  title, days, from, zone, tag,
  hook, bundle:[{k,v}, ...],
  honest, best }
```

Two things about this catalog are load-bearing and are **not being
loosened** for this program:

- **The honesty rule is absolute.** `experiences-data.js`'s own header says
  it plainly: "nothing is listed until a RoamWise person... has actually
  done it." A self-serve *application* does not mean a self-serve
  *listing* — an accepted yoga partner's retreat/class starts at
  `status:'scouting'` (already a valid, existing value — "shortlisted, not
  yet tested by us") and only moves to `status:'certified'` once someone
  from RoamWise has actually attended a class or verified the retreat.
  That is exactly the same bar every other experience in the catalog
  clears; wellness gets no shortcut.
- **`tier` gets one new value: `'wellness'`.** The catalog currently uses
  `'green'` and `'culture'`; adding a plain string value to that field is a
  data-only change with precedent already in this repo — `referral-data.js`
  did the same thing for the campus partnership (`type:'campus'`, with a
  comment explicitly calling it "a judgment call... introduces a 4th
  type"). No schema/machinery change, no new financial mechanism — just a
  new label the existing `openExperiences()` tier-chip UI already renders
  automatically (it derives its filter chips from whatever tier values are
  present in the data).

**Commission on a direct experience booking: 12%**, not the referral
ladder's 25–30%. This is not invented for this program — it's the number
`experiences-data.js` itself already promises in `RW_EXP_PROMISE`: *"Local
operators are paid properly. We take 12%, not 25%."* It also matches
`RW_PARTNER_MODEL.adventure` (12%, "higher because activity margins are
higher") in `partners-data.js` — a yoga class or retreat is an activity
booking in the same sense a rafting trip or trek is, not a room-night stay
(8%) or a thin-margin transport booking (5%). Reusing that existing rate
avoids inventing a rate with no comparable in the codebase.

Booking commission is reconciled the same way every other partner/referral
payout in this app is: manually, by the founder, against an approved,
attributed transaction — there is no new automated checkout being added
for this program, and none is required by anything above.

This is genuinely additive distribution, not a rebrand of the referral
commission: a student can discover a listed retreat/class directly through
the Certified Experience catalog and book it without ever touching a Pro
subscription — a channel the base referral ladder does not offer any
creator vertical today.

## 4. Starter perk decision: reuse the existing trial, do not invent a new grant

Considered and **rejected**: a free/discounted-Pro perk for "verified
instructors," reasoning by analogy to the Founder offer. Rejected because
the analogy doesn't hold, for a concrete, cost-to-serve reason:

- The Founder offer (`PRICING-REFERRAL-MATH.md` §4) is a **hard-capped**
  liability — 1,000 seats total (500 paid + 500 free), closed the moment
  the cap or the 1-year window is hit, specifically *because* an uncapped
  free-forever grant against an ongoing service cost (AI calls, storage,
  support) is explicitly flagged there as "an unpayable debt" at scale.
- A self-serve "verified instructor" perk has **no natural cap**. India has
  tens of thousands of yoga teachers and studios; "let them come on their
  own" means there is no BD gatekeeper limiting how many apply. A
  standing free/discounted-Pro grant tied merely to "being a verified
  instructor" — not to any sale or revenue event — would be exactly the
  open-ended, revenue-disconnected liability `CREATOR-OUTREACH.md` warns
  against ("Lifetime pricing is a liability, not revenue... a hundred
  thousand of them would be an unpayable debt"), and unlike the Founder
  cohort it would have no seat cap or expiry to bound it.
- The creator ladder, by contrast, is **self-funding by construction** —
  "commission comes out of money that arrived," so free/lifetime Pro is
  only ever earned against real referred revenue, which caps itself
  naturally (nobody hits the 25-sale Featured tier without RoamWise
  already having netted far more than a ₹14,999 lifetime pass is worth,
  per `PRICING-REFERRAL-MATH.md` §3).

So: the starter trust-builder for a yoga partner is the **same 30-day full
Pro trial already granted at Applied tier** for every creator vertical —
already zero marginal cost, already time-bounded, already proven. No new
perk, no new grant path, no new entitlement code. Free/lifetime Pro beyond
that trial is earned exactly the way the existing ladder already earns it
for anyone else — referred sales or a certified listing, never simply for
holding a "verified instructor" status.

## 5. What this program does NOT introduce

- No new commission rate that isn't already live somewhere in this codebase
  (25% / 30% from `referral-data.js`, 12% from `experiences-data.js` /
  `partners-data.js`).
- No new Firestore collection — applications write to the existing `crm`
  collection (see `YOGA-WELLNESS-PARTNER-PROGRAM.md` §6 / the PR that ships
  this doc for the exact rule change needed to accept the new `seg` value).
- No new entitlement/payment code — Pro trial and tier promotion use the
  exact mechanisms already live for every other creator.
- No new checkout/booking payment flow for Certified Experience bookings —
  reconciled manually like every other partner payout today.

## 6. Firestore note (separate-review flag, not a silent change)

`firestore.rules`' existing `crm` create rule hardcodes
`request.resource.data.seg == 'creator'` and
`request.resource.data.source == 'creators page (inbound)'`. To let a
`seg:'yogapreneur'` application from `/yoga/` actually write (rather than
silently permission-denying and always falling back to the `mailto:` path),
that rule needs a small, narrowly-scoped extension — widening those two
exact-match checks to an allow-list of two values each, with every other
guard (consent, stage, tier, refSales, refRevenue, code, proGranted, size
caps) byte-for-byte unchanged. See the PR diff to `firestore.rules` for the
exact change.

Per `AI-ROLES-AND-HANDOFF.md` rule 7, Firestore/security rules changes
require separate review — this PR is left open rather than self-merged
specifically because of that rules diff, even though the change itself is a
minimal, same-pattern extension with no new collection and no loosened
guard rail.
