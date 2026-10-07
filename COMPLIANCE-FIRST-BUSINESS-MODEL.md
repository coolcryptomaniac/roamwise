# RoamWise compliance-first business model and stay ledger

Research checked 7 October 2026. This is an operating plan, not legal or tax
advice. Items marked **VERIFY** were not confirmed from a primary source in
this pass and need one short review by a CA or lawyer, once, before launch.

## Principle

RoamWise does not try to avoid the law. It chooses a shape where the law asks
for little, because **the guest pays the property and RoamWise invoices only
its own fee**. The heaviest obligations (GST TCS, payment-aggregator rules)
attach when a platform collects other people's money. If RoamWise never holds
guest money, those mostly do not arise. Two others, GST section 9(5) and
income-tax section 194-O, are **not** switched off by that, see the table. That keeps compliance
cheap *and* keeps demand, because guests keep paying the hotel the way they
already do.

| Obligation | Triggered by | Our shape |
|---|---|---|
| GST TCS under section 52 (0.5% since 10 Jul 2024) | The e-commerce operator **collects the consideration**. Listing or advertising only does not trigger it ([TaxAJ](https://www.taxaj.com/learn/gst-on-e-commerce-operators-tcs-under-section-52-step-by-step-guide/)) | Not triggered while the guest pays the property |
| Income-tax TDS 194-O (0.1% of gross) | Operator **facilitates a sale of goods or services through its platform**. The law treats a buyer's direct payment to the seller as credited to the seller, so paying the hotel directly does **not** switch it off ([ClearTax](https://cleartax.in/s/section-194o), [Income Tax Dept](https://www.incometaxindia.gov.in/w/section-194-o-5)) | **Not settled for a lead-only platform.** The repo's AI-CA already raises this as a review item. Correction: an earlier version of this table said "not triggered", which was too strong. Needs the one-time CA opinion |
| RBI payment-aggregator rules | Holding or routing others' funds. Razorpay's own docs say Route users must meet the September 2025 PA rules ([Razorpay](https://razorpay.com/docs/payments/route/)) | Avoided in Phase 1. Phase 2 uses a licensed gateway's split product, never our own account |
| GST on RoamWise's own fee (usually 18%) | Supplying an intermediary or marketing service | Always applies. Automated, see "GST made simple" |
| Stay GST (5% under ₹7,500 a night with no ITC, 18% from ₹7,500, since 22 Sep 2025) | The property's supply ([TheTaxCorp](https://thetaxcorp.in/article/gst-on-hotel-and-guest-house-accommodation-complete-legal-evolution-and-current)) | The property's job. Never quote a tax to a guest |
| GST section 9(5) accommodation | For hotel, guest-house and similar stays sold **through** an e-commerce operator by a supplier below the registration threshold, the operator pays the GST as if it were the supplier, and must register whatever its turnover ([TaxTMI](https://www.taxtmi.com/article/detailed?id=15913), [ClearTax](https://cleartax.in/s/gst-on-notified-services-ecommerce-operators-95)). Whether a page that only forwards a WhatsApp enquiry is "supplying through" it is **not settled** in the sources I could read | One written CA opinion before enabling instant booking or collecting guest money. Until then the AI-CA gate stays on |
| Competition law on price parity | Forcing a hotel to be no cheaper elsewhere | We never ask for parity. CCI fined MakeMyTrip-Goibibo ₹223.48 crore and OYO ₹168.88 crore and ordered the clauses removed ([Business Today](https://www.businesstoday.in/amp/latest/corporate/story/cci-imposes-rs-39236-cr-fine-on-makemytrip-goibibo-oyo-for-anti-competitive-conduct-350347-2022-10-19)) |
| DPDP Act consent duties | Substantive duties start **13 May 2027** ([AZB](https://www.azbpartners.com/bank/update-indias-digital-personal-data-protection-framework-comes-into-effect/)) | The ledger stores no guest name, phone or email |
| Influencer disclosure | Paid or barter promotion: penalties start at ₹10 lakh and reach ₹50 lakh for repeats ([exchange4media](https://www.exchange4media.com/digital-news/influencers-can-be-fined-upto-rs-50-lakh-for-misleading-consumers-as-per-new-guidelines-124905.html)) | Creator brief requires a visible "#ad / #collab" line |

## What makes commission collectible without holding money

Four independent signals, so no single party can quietly drop a booking:

1. **Booking code** on every WhatsApp enquiry (`RW-XXXXXX`). Implemented in
   `js/booking/stay-code.js` and wired into the WhatsApp button in
   `js/booking/routes.js`.
2. **Guest confirmation.** The message carries a link to `/stay/`. The guest's
   browser holds a secret; only its SHA-256 is stored, so a property cannot
   confirm or deny on a guest's behalf. A gentle nudge appears in the app
   three days after an enquiry.
3. **Property outcome**, recorded by an admin in **Admin → Stay ledger**
   ("completed", "cancelled", "no-show", plus the stay value).
4. **Monthly statement** with commission and GST computed in whole rupees.
   It flags three patterns for a human to review: the guest says they stayed
   but nothing was reported, a property says completed but the guest says no,
   and a property says cancelled but the guest says they stayed. Flags never
   change a bill automatically.

The MOU should say (have a lawyer word it): stays introduced through a
RoamWise code are commissionable for a fixed window; the property reports
outcomes monthly; RoamWise may compare against guest confirmations; fee unpaid
after the due date pauses the listing; and no price parity is required.

## Deploy (founder steps)

1. `cd worker && npx wrangler deploy` (routes `/stay/*` are new and need the
   existing `FIREBASE_SERVICE_ACCOUNT_JSON` secret, already used for push and
   partner checkout).
2. No Firestore rules change. The `stayLedger` collection has no client rule,
   so browsers cannot read or write it; only the Worker's service account can.
3. Merge the PR, then open **Admin → Stay ledger**, choose the month and Load.
4. To collect: copy the "Invoice text" for a property and send it on
   WhatsApp with a Cashfree payment link or the RoamWise UPI. This is RoamWise
   collecting its own fee, which is a normal merchant receipt.

## GST rates, one table, reviewed every year

All GST numbers in RoamWise code come from `features/finance-tax/gst-rules.js`
(rates, effective dates, sources, a confidence label per rule, calculators).
Rates checked 7 October 2026:

| Business | Rate | Input credit | Confidence |
|---|---|---|---|
| Room under ₹1,000 a night | exempt | n/a | secondary |
| Hotel, homestay, boutique, ₹1,000 to ₹7,500 a night | 5% | none | **primary** ([PIB, 56th Council FAQ](https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2163560)) |
| Hotel, boutique, five-star above ₹7,500 a night | 18% | full | secondary |
| Tour operator package | 5% (no credit) or 18% (credit) | by option | secondary |
| Travel agent commission or service fee | 18% on the fee only | full | secondary |
| Taxi or cab with driver | 5% (no credit) or 18% (credit), provider's option | by option | **primary** |
| Air travel | economy 5%, other classes 18% | full | **primary** |
| RoamWise's own fees (commission, plans, ads, creator match fee) | 18%, once registered | full | secondary |

Slabs are judged **per room per night**. A 3-night, 2-room stay at ₹6,000 is a
₹6,000 room, so 5%. A property below the registration threshold charges no
GST on its rooms unless section 9(5) puts the tax on a platform.

Open questions the table flags rather than hides: whether the slab measures
"declared tariff" or the "value of supply"; what a restaurant inside a hotel
pays (sources conflict, so RoamWise never calculates food); and the exact
treatment of exactly ₹7,500.

**The yearly review is built in:**

- `npm run gst:review` reports whether the table is in date (365 days), which
  rules a CA still has to confirm, and exits non-zero only when overdue.
- Admin → Stay ledger shows the same status as a banner, and the compliance
  checklist has a "Yearly GST rules review and CA sign-off" item.
- A scheduled task each September re-researches every rule and opens a PR for
  you to merge. It never changes a rate without citing a source.
- `META.caSignedOn` stays empty until a qualified CA has confirmed the
  non-primary rules. Nothing pretends that has happened.

## GST made simple (own fee only)

- The statement shows commission, GST at 18% **only once** `RW_GST_REGISTERED` is set to "true" in `worker/wrangler.toml` (default "false": no GST is billed before registration), and the invoice total, so one
  month-end export gives your CA the sales register. Rounding is per stay so
  invoice totals always equal the sum of lines.
- Whether RoamWise must register depends on its aggregate turnover and state
  (₹20 lakh for services, ₹10 lakh in some special-category states), and
  separately on the section 9(5) question above, since an e-commerce operator
  covered by 9(5) must register whatever its turnover.
  Once registered, issue a proper tax invoice (the "Invoice text" is a
  statement, not a tax invoice).
- Prefer prepaid plans (₹249/month Desk) over after-stay commission wherever a
  property will accept: UPI AutoPay or a Cashfree payment link on a fixed date
  needs no chasing and no reconciliation.

## Marketplace roles beyond stays

Same pattern for each: **introduce, record, invoice our own fee, never hold
the money**. Moving money later is a separate, reviewed phase.

| Side | Model | Collect | Watch |
|---|---|---|---|
| Creators | Fee on collaborations RoamWise matched, already in `creators/match-core.mjs` (8%, minimum ₹99, or ₹299 for barter). Align the Worker `CREATOR_PLATFORM_FEE_BPS` of 1500 first | RoamWise fee only | Disclosure line in every brief |
| Artists | Booking enquiry with code, 5–10% of confirmed fee, paid by the artist or venue after the show | Fee after the show | If RoamWise ever pays artists, TDS and GST on that payout apply (**VERIFY**) |
| Events | Listing plus affiliate or organiser's own ticket link; featured-slot fee | Flat prepaid slot | Selling tickets ourselves would make us the collector. Avoid for now |
| Travel agencies | Verified-agency listing, lead code, small lead fee or monthly plan | Plan fee | State tourism registration for agencies and trek operators (Uttarakhand, Himachal): **VERIFY** per state |
| Transport and drivers | Directory with call or WhatsApp. Driver quotes the fare directly. Flat monthly listing or lead fee | Flat fee, not a fare share | The 2025 Motor Vehicle Aggregator Guidelines cover platforms that take bookings, set or influence fares and take a cut: licence, driver insurance, an 80% driver share for owner-operators ([Deccan Herald](https://www.deccanherald.com/amp/story/india%2Fexplained-safety-security-welfare-what-the-new-ride-hailing-rules-mean-3614987)). Do **not** dispatch, set fares or take a fare percentage until a state-by-state review |
| Travellers | Free to use. Pro plan, affiliates | Pro plan | Keep disclosure on affiliate links |

## Phase 2 (only after review): advance with split settlement

Collecting a 10–30% advance through RoamWise and splitting it to the property
is the strongest anti-leakage step, but it makes RoamWise a payment-collecting
platform. Before building: Cashfree Easy Split must be activated on the
merchant account; each property completes provider KYC; GST TCS (0.5%) and
194-O TDS (0.1%) treatment must be confirmed; refunds, disputes and ledger
entries must be designed. `payments/marketplace-settlement.mjs` already holds
the integer-paise invariants. Per `AI-ROLES-AND-HANDOFF.md` rule 7 this is a
separate reviewed change, not part of the ledger PR.

## Not covered by this PR

- Expanding the matching engine to artists, events, agencies and drivers. The
  `match-core.mjs` scoring and fee quote can take new `kind` values; each kind
  needs its own required fields and the legal gates above, so it is a
  follow-up.
- Property self-reporting of outcomes in the partner portal (needs Firestore
  rules or a Worker route tied to partner identity).
- Any change to checkout, pricing or Cashfree code.
