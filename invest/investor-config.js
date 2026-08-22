/* ============================================================================
   INVESTOR CONFIG — edit here or from the admin panel.
   ========================================================================= */
window.RW_INVEST = {
  bank: { name:'', account:'', ifsc:'', upi:'', holder:'' },

  /* Set these from the admin panel. Left blank the section shows nothing.
     This is a tip jar, NOT a security — no equity, no claim, no rights. */
  crypto: { eth:'', btc:'', upi:'coolmohit@ybl' },

  classes: [
    { id:'community', label:'Community backer', icon:'🌱', min:10000, max:200000,
      route:'spv', blurb:'You use RoamWise and want a piece of it.' },
    { id:'retail', label:'Retail investor', icon:'👤', min:10000, max:200000,
      route:'spv', blurb:'An individual putting in a considered amount.' },
    { id:'angel', label:'Angel investor', icon:'😇', min:1000000, max:5000000,
      route:'direct', blurb:'You back founders early, and usually bring more than money.' },
    { id:'vc', label:'Venture capital', icon:'🏛️', min:25000000, max:1000000000,
      route:'direct', blurb:'A fund leading or joining a priced round.' },
    { id:'institutional', label:'Institutional', icon:'🏦', min:2000000000, max:10000000000,
      route:'direct', blurb:'Balance-sheet and strategic capital at scale.' }
  ],

  useOfFunds: [
    { k:'Incorporation, legal & compliance', v:'₹2–3 L', pct:6 },
    { k:'Verified ground-truth data · 40 cities', v:'₹1.6 Cr', pct:40 },
    { k:'Two engineers · iOS + regional languages', v:'₹1.2 Cr', pct:30 },
    { k:'Reach · creator partnerships & growth', v:'₹1.2 Cr', pct:24 }
  ],
  longRunLegal: '₹20–50 lakh across 10–20 years',

  /* Cap table basis — 10,000,000 shares keeps every future round a clean
     integer, even at trillion-dollar scale. No fractional-share mess, ever. */
  /* 10,000,000 authorised shares keeps every future round clean integers,
     even at trillion-rupee scale. */
  shares: { authorised: 10000000, founderHeld: 8280000, poolReserved: 920000 },
  preMoney: 460000000,   /* ₹46 Cr pre-money */
  raising:  40000000,    /* ₹4 Cr for 8% */
  roundPct: 0.08,

  /* GENUINE ESOP — carved BEFORE the round, so the team is funded out of the
     founder's stake and not quietly out of investors' later. */
  esopPct: 0.10,

  /* Forward plan, favourable case. Selling less each round is what a company
     with real numbers earns the right to do. */
  roadmap: [
    { r:'Seed · now',  sell:8,  raise:'₹4 Cr',    post:'₹50 Cr',      founder:82.8 },
    { r:'Series A',    sell:12, raise:'₹40 Cr',   post:'₹333 Cr',     founder:71.4 },
    { r:'Series B',    sell:10, raise:'₹200 Cr',  post:'₹2,000 Cr',   founder:63.3 },
    { r:'Series C',    sell:8,  raise:'₹800 Cr',  post:'₹10,000 Cr',  founder:57.7 },
    { r:'IPO',         sell:6,  raise:'₹5,000 Cr',post:'₹83,333 Cr',  founder:54.2 }
  ],

  /* Angel founding-circle perks — first 10 who commit on faith. */
  circleSeats: 10,

  /* The tools and people we actually use — shown honestly, no invented logos. */
  stack: [
    { k:'Cap table & equity', v:'Carta (post-incorporation)' },
    { k:'Company formation', v:'MCA SPICe+ via a licensed CS' },
    { k:'Accounting & filings', v:'A chartered accountant on retainer' },
    { k:'Payments', v:'UPI today · Razorpay at scale' },
    { k:'Data & product', v:'Firebase · Cloudflare Workers' },
    { k:'Investor updates', v:'Written monthly, from this page' }
  ]
};

/* ============================================================================
   FIRST 100 — perks for the founding investors (rw-v100)
   ============================================================================
   Chosen against one test: does it cost RoamWise almost nothing, and would an
   investor genuinely value it? Anything that fails either half is not here.
   Nothing below requires a lawyer, a budget line, or a promise about returns.
   ========================================================================= */
window.RW_FOUNDING_PERKS = [
  { icon:'\ud83d\udd22', title:'Founding Investor #001\u2013#100',
    what:'A permanent number in the company record and on this page. #007 is #007 forever.',
    cost:'Costs us nothing. Cannot be recreated once the round closes.' },

  { icon:'\ud83d\udcca', title:'Live Numbers, permanently',
    what:'A private read-only link to the real dashboard \u2014 users, paid, revenue, burn \u2014 the same screen the founder opens each morning. Not a curated monthly PDF.',
    cost:'Already built. Most companies cannot afford to be seen mid-month; we can.' },

  { icon:'\ud83d\udcdd', title:'The monthly letter, written not generated',
    what:'One honest page each month: what worked, what did not, what worries me. Numbers pull in automatically; the judgement is human.',
    cost:'An hour a month.' },

  { icon:'\ud83d\udcde', title:'A real call, not a webinar',
    what:'Twenty minutes with the founder, one to one, whenever you want it \u2014 up to monthly.',
    cost:'Time, which at this stage is the thing worth spending on the people who backed you.' },

  { icon:'\ud83d\udc41\ufe0f', title:'See the deal flow before anyone',
    what:'Every future round, every strategic conversation, shown to Founding Investors first with a real window to act.',
    cost:'Nothing. Standard pro-rata courtesy, made explicit.' },

  { icon:'\ud83c\udfe1', title:'Pro for life \u2014 and for five people you name',
    what:'You and five others get everything RoamWise ever ships, permanently.',
    cost:'Six accounts. Marginal cost is effectively zero.' },

  { icon:'\ud83e\udded', title:'Name a place',
    what:'Add one destination, stay or route to RoamWise and we will send someone to verify it properly. Your find, credited to you in the app.',
    cost:'One verification trip we were going to make anyway.' },

  { icon:'\ud83e\uddea', title:'First look at everything unreleased',
    what:'Every feature reaches Founding Investors a fortnight before anyone else, and your feedback actually changes it.',
    cost:'Nothing \u2014 and it makes the product better.' },

  { icon:'\ud83e\udd1d', title:'Introductions, both directions',
    what:'We will make introductions for your portfolio companies where we honestly can, not just ask for them.',
    cost:'Nothing, and it is how a network should work.' },

  { icon:'\ud83c\udfd4\ufe0f', title:'The Almora invitation',
    what:'Come and see where it is built. Stay with us. We will take you somewhere no itinerary lists.',
    cost:'A few days of hospitality. The most memorable thing on this list.' }
];

/* Deliberately NOT offered, and we say why. */
window.RW_NOT_OFFERED = [
  { no:'Guaranteed returns or buybacks', why:'Nobody can promise this honestly. Anyone who does is telling you something else about themselves.' },
  { no:'Board seats for small cheques', why:'A crowded board kills early companies. Observer rights are discussed above a meaningful threshold.' },
  { no:'Discounted equity for being early', why:'Everyone in this round gets the same price. Different prices for the same round creates resentment later.' }
];
