/* ============================================================================
   INVESTOR CONFIG — edit here or from the admin panel.
   ========================================================================= */
window.RW_INVEST = {
  bank: { name:'', account:'', ifsc:'', upi:'', holder:'' },

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
