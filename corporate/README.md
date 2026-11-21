# Corporate Retreat & Workation Studio — implementation and underwriting

Public page: `/corporate/` (linked from `/more/`). Worker endpoint: `POST /corporate/lead`.
This is **enquiry intake only**, not paid company wallet onboarding. It creates a restricted
`corporateLeads` Firestore document when `FIREBASE_SERVICE_ACCOUNT_JSON` is available,
then attempts an email alert to `founder@roamwise.co.in`. No mailer requirement for storage.
No checkout, refundable deposit, bonus issuance, gift-card instrument, company authentication,
supplier inventory hold or instant-confirmed reservation has been implemented.

## Corporate employer model (22 Nov 2026)

See [COINDCX-PARTNERSHIP.md](COINDCX-PARTNERSHIP.md) for the current phased employer-first, Web3-later approach, updated legal/financial guardrails and suggested CoinDCX outreach tracks. `/corporate/#enterprise` now contains an independently configurable 3-pillar annual employer scenario; it keeps programme licence billings separate from travel GMV and never creates coins, codes, payment orders or employee accounts.

## Non-negotiable approval rules

1. Sales may **never** promise a payment-linked credit or 10–35% promotional reward
   based only on the public calculator. Tiers are upper-bound **scenario illustrations**.
   Bonus is contractually assigned **only** to predefined eligible packages after sourcing
   and written founder approval. Do not add to the existing consumer credit wallet.
2. For every booked project, compare the customer's **cash actually earned / allocated**
   (excluding GST collected for government and refundable/unearned advances) with **all**
   supplier, payment, logistics, facilitation, tax-on-fees and variable support costs.
   Minimum project contribution after those costs: **10% of collected net cash**.
   Higher profit is a negotiation outcome, not a promised return or hidden fee.
3. The 10% code guard in `retreat-core.mjs` is **pure financial logic only**; it must be
   wired to an authenticated, admin-approved quote and settlement ledger before a
   corporate payment product can go live. The public form must not create payments.
4. Unapproved contracts and supplier inventory = **REQUEST QUOTE ONLY**. Written
   provider confirmation and a signed customer SOW precede a payment request.
5. Never use a corporate advance to finance operating runway or treat it as earned
   revenue before fulfilment. Obtain GST, refund, company-status, escrow/advance
   safeguarding and RBI PPI legal advice before accepting lump sums. A multi-merchant
   spendable wallet is **not** automatically exempt from payment-system regulation.
6. Paid capital, refund obligations, and conditional bonuses must be separate
   **accounting ledgers**, with holdbacks and final reconciled invoices.

## Fully redeemed ₹20L + ₹5L worked example

- Company pays ₹20,00,000 and asks for an advertised **up-to** ₹5,00,000
  promotional service value; total face value shown: ₹25,00,000.
- To retain 10% project contribution on ₹20 lakh earned cash, **ALL** supplier
  + fulfilment + variable ops costs must be no more than ₹18,00,000.
- If variable ops are 2% of paid cash (₹40,000), supplier costs must be at most
  ₹17,60,000, which is **70.4% of ₹25L face value**: a 29.6% effective supplier
  discount from face. This is seldom possible with a 7% standard hotel commission.
- At ₹14L total costs RoamWise keeps ₹6L (30% on collected cash). At ₹10L total
  costs the contribution is ₹10L (50% on cash, **100% markup over cost**).
  Do **not** market 100% net profit margin; that would imply zero costs.
- A lower-margin room booking should receive **zero or much lower extra value**.
  Extra points can apply to a negotiated add-on bundle only where economics pass.

## Source-of-truth venue intake checklist

Verify separately: signed supplier and allowed marketing relationship; total rooms and
*contracted* room allotment by date; licensed and safe bed occupancy; actual
plenary seating with chosen layout; accessible rooms and lift; power backup and
measured Wi-Fi; meal capacity and dietary handling; risk and evacuation plans;
fire approvals; GSTIN/entity; cancellation/attrition; transport coach parking;
AV/meeting rental; realistic door-to-door travel; local guide and excursion insurance.

**Currently represented in the site seed:** Tattwaa (60 keys, enquiry only),
Nanau (23 keys, enquiry only), Padma (6 keys / ~12 standard-share guests,
enquiry only), Woodbook (5 rooms / max 14 listed guests, signed stay partner),
Corbett Jungle View (6 rooms / 12 guests, founder-introduced enquiry only),
Big Bro (signed stay; 4 rooms in its nomad long-stay programme, not proof
of hotel-wide capacity). See `partners-data.js` for current statuses. Room keys are
not confirmed bed, plenary, meal or booking capacity.

**External sourcing leads, not RoamWise partners:** Resorts by the Baagh Corbett
(official site claims 90 rooms and a 600-person conference hall; 600 hall
seats does NOT imply 600 overnight guests); Corbett The Grand (official site
claims 150+ rooms, room block/venue setup to check). For 250+ guests, compare
a single large property versus a clustered 2–4 venue plan. Do not publish
uncontracted capacity as live inventory.

## Commercial pipeline (Nov 2026 to Mar 2027)

- **Pilot:** 25–75 staff, 2 nights, signed limited service SOW, supplier-confirmed
  quotes, 10% minimum project contribution **after** all variable costs.
- **Departmental:** 100–250 staff. Propose Corbett multi-property clusters or a
  sourced large resort; collect deposit only via approved invoicing/terms.
- **Annual master programme:** plan separate retreats and individually approved
  workations. Sell a master service agreement/PO and purchase-order releases
  rather than an open spend-anywhere wallet.
- **Prospect sequence:** procurement/HR discovery call → event brief →
  supplier-held quote → budget and safety diligence → signed SOW/PO →
  milestone invoicing → booking and employee travel support.
- **Targets to research:** CoinDCX (official 3-day company cruise offsite;
  attendee count not publicly verified), BrowserStack, Postman, Chargebee,
  Razorpay, Atlan and large GCCs. Confirm owners and real demand; the presence
  of an offsite does not imply a potential crore-sized purchase.
- **Illustrative per-head planning:** 50 × ₹25k = ₹12.5L;
  150 × ₹25k = ₹37.5L; 250 × ₹25k = ₹62.5L;
  400 × ₹25k = ₹1Cr. Prices are not supplier rates and exclude
  quote-specific taxes/transport uncertainty.

## Deployment checklist

- Merge only after `node --test tests/corporate-retreat.test.mjs` and full
  repository checks. Confirm Cloudflare Pages publishes `/corporate/`.
- Deploy the Worker with the existing `FIREBASE_SERVICE_ACCOUNT_JSON` secret.
  Do not hardcode a service account or payment credentials in the page.
- Send a **controlled test request** and confirm it appears in Firestore
  `corporateLeads` and the founder's approved inbox. Verify no false success
  on 404/503; if no backend, the email-draft option remains available.
- Confirm no client-accessible Firestore rule exposes `corporateLeads`.
- Check the 365-day retention cron and owner deletion procedure. Review privacy copy.
- Before **any money**, obtain finance/legal approval for advance handling, GST,
  supplier commitments, RBI/PPI classification and refund conditions.
