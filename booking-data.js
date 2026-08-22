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

   The founder's instinct is right: curate hard, only high-trust venues, charge
   to be on the platform AND take commission. But there is a trap in it, so the
   model below separates the two payments deliberately:

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
   LISTING FEES (rw-v91)
   ============================================================================
   A one-time fee that pays for the VERIFICATION WORK — the visit, the price
   audit, the photos. It buys a listing and a badge. It never buys a ranking
   position, and the partner page says so.

   WAIVED for places we actively want: genuinely solar-powered stays,
   family-run homes, and anything we would put in an Experience. Waiving the
   fee for the best properties is not charity — it is how the directory stays
   worth reading. The ones who most deserve to be here are usually the least
   able to pay ₹10,000 up front.
   ========================================================================= */
window.RW_LISTING_FEES = [
  { id:'homestay', label:'Family homestay / small guesthouse', fee:500,
    rooms:'up to 4 rooms',
    gets:['Verification call + price check','Listed with a Verified Real badge','Partner portal access'] },
  { id:'boutique', label:'Boutique stay / villa', fee:2500,
    rooms:'5-12 rooms',
    gets:['On-ground or video verification','Photo set','Verified Real badge','Partner portal access'] },
  { id:'hotel', label:'Hotel / resort', fee:5000,
    rooms:'13+ rooms',
    gets:['Full on-ground verification','Photo set','Priority in booking requests','Partner portal access'] },
  { id:'operator', label:'Adventure operator / agency', fee:5000,
    rooms:'licence checked',
    gets:['Licence and safety-equipment check','Verified Real badge','Listed under experiences'] },
  { id:'chain', label:'Chain / multi-property group', fee:10000,
    rooms:'per property, 3+ properties',
    gets:['Verification per property','Account manager','Quarterly re-verification','Priority placement in booking requests'] }
];

/* Who pays nothing, and why. */
window.RW_FEE_WAIVERS = [
  { id:'solar', label:'Runs on Sunshine', test:'Solar powered with evidence we have seen \u2014 a bill or the panels',
    why:'We want every genuinely solar property in India on this list.' },
  { id:'family', label:'Family run', test:'Owned and run by the family who lives there',
    why:'The places that most deserve to be found are usually the least able to pay to be found.' },
  { id:'experience', label:'Part of a RoamWise Experience', test:'We have used you in a curated trip',
    why:'If we are sending travellers to you, charging you to be listed is backwards.' },
  { id:'remote', label:'Somewhere underserved', test:'A district with fewer than five listings',
    why:'Coverage where nobody else goes is worth more to us than the fee.' },
  { id:'first50', label:'Founding partner', test:'One of our first 50 partners',
    why:'You took a chance on a platform with no traffic. That is worth more than \u20b95,000.' }
];
