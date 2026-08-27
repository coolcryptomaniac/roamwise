# Pricing & referral economics — the actual numbers

This is the arithmetic behind the pricing ladder and the referral/creator
commission programme, worked from the live config in `app.js`'s `RWPricing`,
`referral-data.js`'s `RW_REFERRAL_TERMS`, and `finance-data.js`'s tax flags.
Nothing here is a proposal — it is what the numbers say about what's already
shipped, plus the projections needed for an on-campus referral push.

All figures in INR unless stated. Percentages are rounded to 2 decimal places
where it matters, rupee amounts to the nearest paisa then rounded for display.

---

## 1. Pricing structure decision: keep the 4-rung ladder

**Recommendation: keep Free / Plus ₹99 / Pro ₹299 / Elite ₹499 (monthly, with
yearly equivalents), the capped ₹100 Founder lifetime offer, and the long-term
and short-term passes.** Do not collapse this to a single Pro tier. Four
reasons, each backed by the numbers below:

1. **Referral commission is a flat 30% regardless of tier** (`RW_REFERRAL_TERMS.ratePct`
   in `referral-data.js`). A flat percentage rate doesn't care how many rungs
   the ladder has — it takes the same cut of ₹99 as it does of ₹499. Collapsing
   to one tier changes nothing about referral unit economics (see §2); it only
   removes price points that convert different buyers.
2. **₹99 Plus is the low-friction entry point.** A single "Pro-only" model
   throws away everyone who would pay ₹99 but hesitates at ₹299 — that's real,
   uncaptured revenue, not a wash, because the marginal cost of serving a Plus
   subscriber (AI calls, PDF export) is close to zero.
3. **₹499 Elite is margin headroom**, not a discount tier — it is the one rung
   priced to make money even after giving away things that cost real money
   (see point 4). Removing it removes the only tier that can absorb that cost.
4. **The tier config is a single data array** (`RWPricing.CONFIG.TIERS`), and
   `hasFeature()` is one `indexOf` check against a `features` array. Adding or
   removing a rung is editing one array entry, not new code — four tiers cost
   nothing extra in complexity.

The existing feature split already roughly tracks **cost-to-serve**, which is
the right way to draw the lines:

- **`adFree`** sits at Pro and above because it forgoes real ad revenue the
  moment it's granted — it can't be free-tier.
- **`movieFree`** sits at Elite only, because AI movie generation has a real
  marginal cost estimated at ~₹50/use — giving it away needs the highest-margin
  tier underneath it, not Plus or Pro.
- **`proAI` / `pdfExport` / `cardStylesBasic`** sit at Plus because they are
  bounded, cheap AI/render calls — the ₹99 price point covers them comfortably.
- **`unlimitedPdf` / `cardStylesAll` / `squadsPost`** sit at Pro because they're
  volume-sensitive (more PDF exports, more storage, more social posts) without
  being as expensive per-use as movie generation.
- **`earlyAccess` / `prioritySupport`** sit at Elite because they cost founder
  time, which is the scarcest resource in a solo-founder shop — gate them behind
  the tier that pays the most for it.

### Full tier / feature / price table (from `RWPricing.CONFIG`)

| Tier | Monthly | Yearly | Effective monthly (yearly ÷ 12) | Yearly discount vs. ×12 monthly | Features |
|---|---:|---:|---:|---:|---|
| **Free** | ₹0 | ₹0 | ₹0 | — | `smartAI` |
| **Plus** | ₹99 | ₹999 | ₹83.25 | 16% | + `proAI`, `pdfExport`, `cardStylesBasic` |
| **Pro** | ₹299 | ₹2,499 | ₹208.25 | 30% | + `cardStylesAll`, `adFree`, `squadsPost`, `unlimitedPdf` |
| **Elite** | ₹499 | ₹4,999 | ₹416.58 | 17% | + `movieFree`, `earlyAccess`, `prioritySupport` |

(Yearly discount = `1 − priceYearly/(priceMonthly×12)`. The underlying ratio is
15.91% / 30.35% / 16.51% respectively, but `RWPricing.yearlySavingsPct()` itself
`Math.round()`s that ratio to a whole percentage before returning it — so the
values above (16% / 30% / 17%) are what the function actually returns, not the
raw decimal. Pro's yearly is the deepest discount of the three paid tiers —
299×12 = 3,588 vs. 2,499 charged.)

### Long-term one-time passes (`RWPricing.CONFIG.LONG_TERM`)

| Tier | 3-year | 5-year | Longest option |
|---|---:|---:|---|
| Plus | ₹2,499 | ₹3,499 | 10-year: ₹4,999 |
| Pro | ₹7,499 | ₹9,999 | **Lifetime: ₹14,999** |
| Elite | ₹12,499 | ₹17,499 | 10-year: ₹24,999 |

Pro's longest option is a true lifetime pass, not a 10-year pass — it's priced
so nothing longer/cheaper undercuts the headline ₹14,999 lifetime price.

### Short-term Pro passes (`RWPricing.CONFIG.SHORT_TERM`)

| Pass | Price | Per-day cost |
|---|---:|---:|
| Day | ₹19 | ₹19.00 |
| Week | ₹99 | ₹14.14 |
| 3-Month | ₹749 | ₹8.32 |

### Founder offer

₹100 one-time → lifetime Elite (see §4).

---

## 2. Referral & commission math — net margin is a constant percentage

The referral programme (`RW_REFERRAL_TERMS`) is a flat **30%** of the sale.
Three real costs sit between the listed price and RoamWise's net:

- **(a) Referral commission**: 30% flat, per `referral-data.js`.
- **(b) Payment gateway fee**: Razorpay's published rate is ~2% + 18% GST on
  that fee. 2% × 1.18 = **2.36% effective**, per `BUSINESS-FINANCE-SETUP.md`
  and `REVENUE-INTEGRATIONS.md`.
- **(c) GST on the commission itself**: this is a hypothetical, conservative
  modelling assumption, not something `finance-data.js` currently asserts as
  actual tax treatment. `finance-data.js` has two distinct accounts that must
  not be conflated: `rev_commission` (an INCOME account — booking commission
  RoamWise itself earns, tagged at 18% GST) and `exp_referral` (an EXPENSE
  account — referral commission RoamWise *pays out*, tagged `tds:'194H'`, with
  **no** GST tag). Neither account currently records GST on a referral payout.
  The 5.4% figure below is a stress-tested worst case for a future scenario
  where a GST-registered creator/affiliate invoices RoamWise for their
  commission and charges GST on top — modelled here as 18% of the commission
  amount, i.e. 30% × 18% = **5.4% of the sale price**. In practice today's
  three staff referrers (Febin, Deepanshi, Adarsh) are paid an incentive on top
  of an internship stipend, not invoicing as GST-registered suppliers, so this
  leg is not currently triggered — it becomes relevant once creator/affiliate
  partners large enough to be GST-registered are added. Confirm actual
  applicability with a CA before relying on this figure.

**Core case (commission + gateway only) — this is the number that matters day
to day:**

Net % = 100% − 30% − 2.36% = **67.64%** of the listed price, for every tier,
every billing period. The percentage doesn't move because both deductions are
percentages of the same base.

| Tier | Price | Commission (30%) | Gateway fee (2.36%) | Net to RoamWise | Net % |
|---|---:|---:|---:|---:|---:|
| Plus monthly | ₹99 | ₹29.70 | ₹2.34 | ₹66.96 | 67.64% |
| Plus yearly | ₹999 | ₹299.70 | ₹23.58 | ₹675.72 | 67.64% |
| Pro monthly | ₹299 | ₹89.70 | ₹7.06 | ₹202.24 | 67.64% |
| Pro yearly | ₹2,499 | ₹749.70 | ₹58.98 | ₹1,690.32 | 67.64% |
| Elite monthly | ₹499 | ₹149.70 | ₹11.78 | ₹337.52 | 67.64% |
| Elite yearly | ₹4,999 | ₹1,499.70 | ₹117.98 | ₹3,381.32 | 67.64% |

**Compliance-conservative case (adding the GST-on-commission stress line):**

Net % = 100% − 30% − 2.36% − 5.4% = **62.24%** of the listed price.

| Tier | Price | + GST on commission (5.4%) | Net to RoamWise | Net % |
|---|---:|---:|---:|---:|
| Plus monthly | ₹99 | ₹5.35 | ₹61.62 | 62.24% |
| Plus yearly | ₹999 | ₹53.95 | ₹621.78 | 62.24% |
| Pro monthly | ₹299 | ₹16.15 | ₹186.10 | 62.24% |
| Pro yearly | ₹2,499 | ₹134.95 | ₹1,555.38 | 62.24% |
| Elite monthly | ₹499 | ₹26.95 | ₹310.58 | 62.24% |
| Elite yearly | ₹4,999 | ₹269.95 | ₹3,111.38 | 62.24% |

**Same table under UPI (0% gateway fee, per the "Plain business UPI" row in
`BUSINESS-FINANCE-SETUP.md` — `RW_REFERRAL_TERMS` itself only defines the
commission rate, hold period and payout floor, not any payment-rail terms):**

**Caveat: this 0% figure is not yet live.** `app.js` currently routes payment
to the personal UPI handle `coolmohit@ybl` (see `UPI_VPA` in `app.js` and
`BUSINESS-FINANCE-SETUP.md` §1, which explicitly warns against running
business money through it). The 0% assumption only holds once/if a registered
business UPI handle (e.g. `roamwise@icici`) is configured; personal UPI has no
GST/reconciliation setup backing it and shouldn't be treated as the permanent
production rail.

Core case: 100% − 30% = **70%** net. Conservative case: 70% − 5.4% = **64.6%** net.

| Tier | Price | Net (UPI, core) | Net (UPI, w/ GST-on-commission) |
|---|---:|---:|---:|
| Plus monthly | ₹99 | ₹69.30 | ₹63.95 |
| Plus yearly | ₹999 | ₹699.30 | ₹645.35 |
| Pro monthly | ₹299 | ₹209.30 | ₹193.15 |
| Pro yearly | ₹2,499 | ₹1,749.30 | ₹1,614.35 |
| Elite monthly | ₹499 | ₹349.30 | ₹322.35 |
| Elite yearly | ₹4,999 | ₹3,499.30 | ₹3,229.35 |

**The takeaway:** net margin is 67.64% (Razorpay) or 70% (UPI) of whatever the
customer paid, on *every single tier*, because both deductions are pure
percentages. Adding or removing a pricing rung changes how many people buy and
at what price point — it does not change the cut RoamWise keeps once they do.
That's the strongest argument for §1: pricing structure and referral economics
are two independent levers, so there's no economic reason to simplify the
ladder for the referral programme's sake.

---

## 3. Creator commission ladder economics

Reproducing and extending the worked example from `CREATOR-OUTREACH.md`.

### The original example — ₹2,999 Pro/yr, 15% audience discount

- Audience price: 2,999 × (1 − 0.15) = 2,999 × 0.85 = **₹2,549.15** (doc rounds to ₹2,549)
- **Applied tier (25% commission):** 2,549.15 × 0.25 = ₹637.29 (doc rounds to ₹637)
  RoamWise keeps: 2,549.15 − 637.29 = **₹1,911.86** ≈ ₹1,912 → 1,912 / 2,999 = **63.75% ≈ 64%** — matches the doc.
- **Partner tier (30% commission):** 2,549.15 × 0.30 = ₹764.75
  RoamWise keeps: 2,549.15 − 764.75 = **₹1,784.41** ≈ ₹1,784 → 1,784 / 2,999 = **59.5% ≈ 60%** — matches the doc.

### The same math on the current live Pro yearly price — ₹2,499

The ₹2,999 figure in `CREATOR-OUTREACH.md` predates the current config; live
Pro yearly is **₹2,499**. Same 15% audience discount, same two commission tiers:

- Audience price: 2,499 × 0.85 = **₹2,124.15**
- **Applied (25%):** commission = 2,124.15 × 0.25 = ₹531.04
  RoamWise keeps: 2,124.15 − 531.04 = **₹1,593.11** → 1,593.11 / 2,499 = **63.75% ≈ 64%**
- **Partner/Featured (30%):** commission = 2,124.15 × 0.30 = ₹637.25
  RoamWise keeps: 2,124.15 − 637.25 = **₹1,486.91** (rounding) → 1,486.91 / 2,499 = **59.5% ≈ 60%**

Same percentages as the ₹2,999 example, because both the discount and the
commission rate are unchanged — only the absolute rupees moved with the price.

### Pro Lifetime — ₹14,999 at 30% (Partner/Featured rate)

No audience discount modelled here (lifetime is sold as a fixed one-time price,
not run through the 15%-off affiliate link in the current setup):

- **Partner/Featured (30%):** 14,999 × 0.30 = **₹4,499.70** to the creator
  RoamWise nets: 14,999 − 4,499.70 = **₹10,499.30** before gateway fee/GST.
  If paid via Razorpay, the 2.36% gateway fee (per §2b) is a percentage of the
  **original ₹14,999 sale price**, not of the post-commission amount — it's
  deducted independently, in parallel with the commission, not stacked on top
  of it: 14,999 × 2.36% ≈ **₹353.98**. Net before any GST-on-commission stress
  line: 14,999 − 4,499.70 − 353.98 = **₹10,145.32**.
- For reference, **Applied (25%):** 14,999 × 0.25 = ₹3,749.75 to the creator;
  RoamWise nets ₹11,249.25 before gateway fee/GST.

A creator hits the 25-sale "Featured" threshold in `CREATOR-OUTREACH.md` having
generated roughly 25 × ₹1,784 ≈ ₹44,600–45,000 in RoamWise's net revenue by
that point (at the ₹2,999 example price) — which is the "cheap" comparison the
doc makes against handing them a ₹14,999-value lifetime pass for free.

---

## 4. Founder offer economics — a loss-leader, not a revenue line

`RWPricing.CONFIG.FOUNDER_OFFER`: **₹100 one-time, capped at 1,000 users or 365
days from launch, whichever comes first.** Buyers are grandfathered to `elite`
forever (`currentTier()` treats any legacy ₹100 buyer as permanent Elite).

- **Nominal cap: 1,000 seats × ₹100 = ≤₹100,000 one-time cash**, if every seat
  were sold.
- **Actual cap is lower.** The `FOUNDER_OFFER` comment in `app.js` specifies the
  1,000-seat cap is split **500 free NMIMS seats + 500 paid founders** — so the
  real maximum cash collected is **500 × ₹100 = ≤₹50,000**, not ₹100,000. The
  other 500 seats are pure acquisition cost (free Elite access, ₹0 in).

Either way, this is a **loss-leader / growth-hack**, not a revenue driver:
₹50,000–₹100,000 one-time against a *forever* Elite-tier service obligation
(AI calls, PDF exports, storage, support) for up to 1,000 users is a bet on
word-of-mouth and campus credibility, not on the ₹100 itself. This is exactly
the caution `CREATOR-OUTREACH.md` already raises: "Lifetime pricing is a
liability, not revenue" — the founder cohort is the one deliberate exception,
and it is capped precisely because it is a liability.

---

## 5. NMIMS campus referral projection

Flat 30% commission (`RW_REFERRAL_TERMS.ratePct`) on the two prices most likely
to anchor a campus push: **Pro yearly (₹2,499)** and **Pro lifetime (₹14,999)**.
Commission per sale:

- Pro yearly: 2,499 × 0.30 = **₹749.70/sale**
- Pro lifetime: 14,999 × 0.30 = **₹4,499.70/sale**

| Paid signups | Commission due — Pro yearly (₹2,499) | Commission due — Pro lifetime (₹14,999) |
|---:|---:|---:|
| 250 | ₹1,87,425 | ₹11,24,925 |
| 500 | ₹3,74,850 | ₹22,49,850 |
| 1,000 | ₹7,49,700 | ₹44,99,700 |
| 2,000 | ₹14,99,400 | ₹89,99,400 |

These are the raw commission line — drop the price and volume into the same
30% multiplier for any future on-page referral calculator; the formula is
just `signups × price × 0.30`.

---

## 6. TDS Section 194H — when it starts to matter

`finance-data.js`'s `tds_194h` flag: commission/brokerage above **roughly
₹20,000 to one person in a financial year** attracts TDS withholding (the
Finance Act 2025 threshold), and `exp_referral` is already tagged `tds:'194H'`
in the chart of accounts.

At the 30% rate on a ₹2,499 Pro-yearly sale (₹749.70 commission/sale), the
threshold is crossed at:

20,000 ÷ 749.70 = **26.68 sales** → **a referrer needs to close 27 Pro
yearly sales in one financial year** before RoamWise must start withholding TDS
on their payouts.

At the Pro lifetime price (₹4,499.70 commission/sale): 20,000 ÷ 4,499.70 =
**4.44 sales** → **just 5 lifetime sales** crosses the same threshold.

Today this is not yet operational — the only referrers on the books are the 3
staff members in `referral-data.js` (Febin, Deepanshi, Adarsh), and TDS on
their referral incentive is tracked per-person, per financial year. It becomes
a real compliance line item the moment either (a) a single staff referrer
closes ~27+ Pro-yearly sales or ~5+ lifetime sales in a year, or (b) a
creator/affiliate partner is added who could plausibly hit that volume on
their own — which a campus-scale push like NMIMS (§5) could do well within one
semester. As always, confirm actual applicability to staff/creator payouts
with a CA.

---

## 7. Appendix — known gap, not fixed in this pass

`RWPricing.hasFeature(name)` (`app.js`) is fully implemented — it checks
`currentTier().features.indexOf(name) > -1` — but as of this doc, it has **no
real callers gating any UI**. Tier storage (`rw_tier` in localStorage) and the
tier/feature config both exist and are correct, but:

- PDF export doesn't check `pdfExport` / `unlimitedPdf` before running.
- Ad display doesn't check `adFree` before showing an ad.
- Squads posting doesn't check `squadsPost` before allowing a post.
- Movie generation doesn't check `movieFree` before generating for free.

In other words, the pricing ladder is correctly *priced* and *sold*, but not
yet *enforced* anywhere in the product. Wiring `RWPricing.hasFeature()` into
those four call sites is the natural follow-up — flagged here, out of scope
for this pass.
