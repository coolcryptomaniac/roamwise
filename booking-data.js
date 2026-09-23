/* ============================================================================
   RW_BOOKING — the request-to-book engine + the commercial model
   ============================================================================
   WHY REQUEST-TO-BOOK, NOT INSTANT BOOKING:
   Instant booking needs supplier inventory APIs, payment settlement, a
   cancellation engine and an incorporated entity carrying liability. We have
   none of those yet. But Indian homestays and operators already run on
   WhatsApp and phone confirmation — so a REQUEST that reaches the partner in
   seconds and gets confirmed by a human is not a downgrade. It is how this
   market actually works, and it earns commission from day one.

   The path: request-to-book (now) -> confirmed inventory for top partners
   (once signed) -> instant booking + payments (post-incorporation).
   ========================================================================= */

/* Stay pricing guardrail: the platform supports TWO supplier models, never both
   on the same booking. Private wholesale/net rates stay server/admin-side. */
window.RW_STAY_PRICING_POLICY = {
  commissionPct: 8,
  netMarkupTargetPct: 8,
  netMarkupMaxPct: 10,
  minimumViableMarginPct: 3,
  customerSavingTargetPct: 3,
  models: {
    commission: 'Property supplies its public/direct sell rate; RoamWise earns 8% only after a completed stay.',
    protectedNet: 'Property supplies a confidential B2B net rate; RoamWise targets an 8% gross markup, capped at 10%, while aiming to keep the like-for-like guest rate at least 3% below the best audited public rate.'
  },
  noDoubleCharge: true,
  parityRule: 'Same room, occupancy, meals, cancellation terms, taxes and stay dates must be compared. If the audited public rate leaves less than 3% gross margin, request a better net rate or switch that date to request-to-book; never inflate the guest price just to preserve margin.',
  foundingPartnerFee: 299,
  minimumListingFee: 299,
  negotiatedListingFee: 'Suggested tiers are anchors, not rigid tariffs. RoamWise may agree a lower, higher or waived one-time contribution case by case; any waiver must be explicitly recorded and never buys ranking or changes booking economics.',
  supporterContribution: 'A property may voluntarily contribute above its suggested listing fee to support RoamWise operations. Extra support does not buy ranking, reviews, preferential guest treatment or a lower commission.',
  propertyTypeRule: 'Listing contribution scales with property type/operational complexity. A small homestay can stay near the floor; a hotel pays more even if it has relatively few rooms.',
  feeReviewCadence: 'Annual review each April using India CPI / operating-cost changes; round changes to simple customer-friendly amounts.',
  rankingRule: 'Commercial terms never buy ranking. Quality, guest outcomes, reliability and verified value decide ordering.'
};

window.RW_BOOK_CATS = [
  { id:'stay',      icon:'\ud83c\udfe1', label:'Stay',        pct:8,  blurb:'Homestays, boutique and eco stays' },
  { id:'guide',     icon:'\ud83e\uddd1\u200d\ud83c\udfeb', label:'Guide',       pct:15, blurb:'Local guides who actually know the place' },
  { id:'transport', icon:'\ud83d\ude96', label:'Transport',   pct:5,  blurb:'Drivers, transfers, EV rentals' },
  { id:'food',      icon:'\ud83c\udf72', label:'Food',        pct:10, blurb:'Home kitchens, food walks, farm tables' },
  { id:'do',        icon:'\ud83e\udde1', label:'Things to do',pct:12, blurb:'Rafting, treks, workshops, experiences' },
  { id:'wedding',   icon:'\ud83d\udc90', label:'Celebrations',pct:6,  blurb:'Destination weddings and events' }
];

/* ---------------------------------------------------------------------------
   THE COMMERCIAL MODEL — and the one line that protects it.

   Curate hard and charge only for work or value we actually deliver. A property
   may pay a verification/onboarding fee and use a commission model, OR give us
   a protected B2B net rate that we mark up modestly. Never take commission on
   top of a protected net rate for the same booking.

     ONBOARDING FEE  = paid once, for VERIFICATION WORK we actually do
                       (site visit, document checks, photos, price audit).
                       It buys a badge, never a ranking position.
     COMMISSION      = paid on completed bookings only. Aligned: we earn when
                       the traveller is served, not when a venue pays us.

   RANKING IS NEVER FOR SALE. If money could buy position, "only the best are
   here" becomes a claim nobody can trust — and trust is the entire product.
   This is written into the page the partner signs up on, not just in code.
--------------------------------------------------------------------------- */
window.RW_BOOK_MODEL = {
  onboarding: [
    { tier:'verified', label:'Verified Partner', fee:4999, period:'one-time',
      gets:['On-ground verification visit','Price and safety audit','Photo set','Verified badge','Listed in the app'] },
    { tier:'premium', label:'Premium Partner', fee:14999, period:'per year',
      gets:['Everything in Verified','Quarterly re-verification','Priority in booking requests','Featured in one seasonal collection','Performance dashboard'] }
  ],
  commissionNote:'Commission is charged only on completed bookings. Nothing is charged for a cancelled or unfulfilled request.',
  rankingPledge:'Ranking is never for sale. Partners are ordered by verified quality, traveller feedback and reliability \u2014 never by what they pay us.',
  b2b: [
    { k:'Travel intelligence', v:'Anonymised crowd, pricing and demand data sold to tourism boards, hotels and operators.' },
    { k:'Operator dashboard',  v:'Partners see demand for their area, seasonality and what travellers ask for. Subscription.' },
    { k:'White-label planning',v:'Our planner embedded in an agency or hotel site, per-seat.' }
  ],
  b2b2c: [
    { k:'Corporate offsites',  v:'Companies plan team trips through RoamWise; we take commission and sell the coordination tools.' },
    { k:'College trips',       v:'Student groups plan and split costs with us; volume at low margin, huge word of mouth.' },
    { k:'Creator-led trips',   v:'A creator brings the audience, we run planning, booking and money-splitting. 15%.' }
  ]
};

/* ---------------------------------------------------------------------------
   ROAMWISE GREEN — the premium electric / eco / vegan tier.
   A genuinely differentiated product, not a label: every element of the trip
   has to qualify, and we say honestly what "qualifies" means.
--------------------------------------------------------------------------- */
window.RW_GREEN_PILLARS = [
  { id:'mobility', icon:'\u26a1', title:'Electric mobility end to end',
    items:['EV taxi or self-drive electric car','Electric bike, scooter or cycle for local runs','EV bus on intercity legs where it exists','Charging stops planned into the route, not hoped for'],
    honest:'India\u2019s charging network is thin outside cities. We plan the charge stops and tell you where it gets tight \u2014 rather than pretending the range is fine.' },
  { id:'stay', icon:'\ud83c\udf3f', title:'Genuinely eco stays',
    items:['Solar powered or solar-assisted','Rainwater harvesting or water reuse','No single-use plastic in rooms','Waste segregated and composted'],
    honest:'We ask for evidence \u2014 a solar bill, a photo of the setup. "Eco-friendly" on a website means nothing without it.' },
  { id:'food', icon:'\ud83e\udd57', title:'Vegan & local-cultural food',
    items:['Full vegan menus, not just a side salad','Organic farm tables where the farm is real','Regional cooking taught by the people who cook it'],
    honest:'We separate VEGAN from LOCAL-CULTURAL. Some of the best regional food is not vegan; we let you choose rather than blurring the two.' },
  { id:'energy', icon:'\ud83d\udd0b', title:'Clean energy on site',
    items:['Solar water heating','Biogas or biomass kitchens','Composting and greywater systems'],
    honest:'Biomass is cleaner than diesel, not zero-carbon. We say which it is.' },
  { id:'do', icon:'\ud83c\udfd4\ufe0f', title:'Nature-first activities',
    items:['Guided walks, birding, forest bathing','River and mountain activity with licensed operators','Farm work, foraging and craft with local families','No captive-animal attractions, ever'],
    honest:'We refuse elephant rides and captive-animal shows outright. That is a rule, not a preference.' }
];

/* ============================================================================
   LISTING FEES — permanent one-time contribution
   ============================================================================
   Every live supplier contributes at least the permanent floor. The fee scales
   with property type and operational complexity, not only room count. This
   keeps tiny owner-run stays affordable while hotels/resorts contribute more
   toward verification, support and long-term platform operations.

   Listing fee != ranking. Paying more never buys a better position.
   Separate on-ground verification/photo work can be quoted when actually done.
   ========================================================================= */
window.RW_LISTING_FEES = [
  { id:'micro-homestay', label:'Small homestay / treehouse / cottage stay', fee:299,
    rooms:'1-4 sellable units',
    gets:['Verification call','Basic price audit','Partner portal access','Eligible for Verified badge after checks'] },
  { id:'boutique-homestay', label:'Boutique homestay / villa / guesthouse', fee:499,
    rooms:'5-12 rooms or units',
    gets:['Verification call','Price audit','Partner portal access','Eligible for Verified badge after checks'] },
  { id:'small-hotel', label:'Small hotel', fee:999,
    rooms:'hotel classification, typically up to 12 rooms',
    gets:['Business verification','Rate/policy audit','Partner portal access','Hotel listing setup'] },
  { id:'hotel', label:'Hotel / resort', fee:2499,
    rooms:'typically 13-30 rooms',
    gets:['Business verification','Deeper rate/policy audit','Partner portal access','Hotel/resort listing setup'] },
  { id:'large-hotel', label:'Large hotel / resort', fee:4999,
    rooms:'typically 31+ rooms',
    gets:['Full commercial onboarding','Rate/policy audit','Partner portal access','Operational setup review'] },
  { id:'operator', label:'Adventure operator / agency', fee:999,
    rooms:'licence / operator checks',
    gets:['Licence and safety-document review','Partner portal access','Experience listing setup'] },
  { id:'chain', label:'Chain / multi-property group', fee:9999,
    rooms:'portfolio onboarding',
    gets:['Portfolio setup','Account coordination','Verification plan per property','Partner portal access'] }
];

/* Nobody pays zero. Strategic partners receive a discount to the permanent
   minimum listing fee instead of a complete waiver, so every live supplier
   contributes something to verification and platform operations. */
window.RW_FEE_WAIVERS = [
  { id:'solar', label:'Runs on Sunshine', test:'Solar powered with evidence we have seen \u2014 a bill or the panels',
    why:'Discount to the permanent minimum fee; genuinely solar supply is strategically valuable.' },
  { id:'family', label:'Family run', test:'Owned and run by the family who lives there',
    why:'Discount to the permanent minimum fee; keep family-run supply accessible without making platform operations free.' },
  { id:'experience', label:'Part of a RoamWise Experience', test:'We have used you in a curated trip',
    why:'Discount to the permanent minimum fee; RoamWise still funds basic verification and operating work.' },
  { id:'remote', label:'Somewhere underserved', test:'A district with fewer than five listings',
    why:'Discount to the permanent minimum fee; underserved coverage is strategically valuable.' },
  { id:'first50', label:'Founding partner', test:'One of our first 50 partners',
    why:'Founding partners receive the permanent minimum fee rather than a full waiver.' }
];


/* Tax/payment policy is deliberately rule-based rather than hard-coded to one
   country forever. Server/admin tax profiles must be versioned by jurisdiction. */
window.RW_TAX_AND_PRICE_POLICY = {
  reviewedAt:'2026-09-23',
  commissionBase:'Accommodation/package consideration accepted by the guest before statutory taxes. Excludes government taxes, refundable deposits, RoamWise platform/payment fees and post-stay incidentals; includes mandatory package components and extra-person charges accepted before check-in.',
  guestFeeDefaultPct:0,
  guestFeeCapPct:1.5,
  allInSavingTargetPct:2,
  preferredSavingBandPct:[2,5],
  minimumContributionMarginPct:3,
  minimumContributionMarginInr:150,
  noPriceWar:true,
  comparisonRule:'Compare final payable totals for the same dates, occupancy, room/rate plan, meals, cancellation policy, mandatory fees and taxes. Coupons funded by banks/OTAs are shown separately rather than treated as supplier parity.',
  marginRule:'If RoamWise cannot remain competitive without dropping below its margin floor, request a better supplier rate, pause instant booking, offer a genuine value-add, or use request-to-book. Do not sell at a structural loss simply to be the cheapest.',
  india:{
    accommodationNote:'Tax rate and liable party must be resolved from current GST rules, room value, supplier registration status and marketplace role at booking time.',
    platformFeeNote:'RoamWise invoices/taxes its own commission, listing, subscription or service fees as required by law.',
    withholdingNote:'Apply statutory GST TCS / income-tax TDS or other withholding only when legally applicable; show it separately in partner reconciliation rather than disguising it as commission.'
  },
  global:{
    rule:'Use destination-jurisdiction VAT/GST/sales, occupancy, tourism and city-tax profiles; determine marketplace deemed-supplier/remittance obligations separately from property obligations.',
    display:'Guest checkout should show one final payable amount plus a transparent tax/fee breakdown before payment.'
  }
};
