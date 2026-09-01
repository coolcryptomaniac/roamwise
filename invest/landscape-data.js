/* ============================================================================
   RW_LANDSCAPE — the whole field, researched August 2026
   ============================================================================
   Every figure here is from public reporting and may have moved. We show the
   ones that are unflattering to us as well as the ones that are not.
   ========================================================================= */

window.RW_RIVALS = [
  { name:'Mindtrip', flag:'\ud83c\uddfa\ud83c\uddf8', raised:'$19M', stage:'Series A',
    what:'AI planner with Priceline + Viator booking built in.',
    team:'11 founders, Palo Alto', model:'Booking commission, no subscription',
    edge:'The most polished output in the category. Agentic flight booking went live May 2026.',
    gap:'Reviewers repeatedly find it template-driven \u2014 "run the same destination with different preferences and the output changes less than it should." Booking integration introduces inventory bias.' },

  { name:'Layla', flag:'\ud83c\uddec\ud83c\udde7', raised:'undisclosed', stage:'Growth',
    what:'Conversational planner with live pricing from Skyscanner and Booking.com.',
    team:'Backed, London', model:'$49/year premium',
    edge:'Best end-to-end conversational plan. PriceLock alerts are genuinely useful.',
    gap:'Thin as a workspace. Solo-traveller shaped \u2014 group constraints are an afterthought.' },

  { name:'Wanderlog', flag:'\ud83c\uddfa\ud83c\uddf8', raised:'$150K', stage:'Seed (YC)',
    what:'Map-first itinerary builder with real collaboration.',
    team:'2 founders, SF, since 2008', model:'$40/year Pro',
    edge:'The best map and the strongest manual collaboration. Profitable-shaped.',
    gap:'AI bolted on in 2024 and behind a paywall. Static data misses closures and price changes.' },

  { name:'WeRoad', flag:'\ud83c\uddee\ud83c\uddf9', raised:'$58M', stage:'Series C',
    what:'Packaged group trips for solo travellers, led by a paid coordinator.',
    team:'Milan, \u20ac130M revenue 2025', model:'Owns the trip margin',
    edge:'Airbnb led their Series C. 100,000 travellers in 2025. Proof that group travel is fundable.',
    gap:'Matches strangers on AGE and LANGUAGE only \u2014 and leaves 30\u201340% of the itinerary for the group to decide, with no tool to decide it.' },

  { name:'WanderOn', flag:'\ud83c\uddee\ud83c\uddf3', raised:'~$5M', stage:'Series A',
    what:'India\u2019s largest group-travel operator for young travellers.',
    team:'Gurugram', model:'Sells the trip',
    edge:'Owns the Indian group-trip brand. Enormous Instagram distribution.',
    gap:'An operator, not a platform. They sell you their trip; they cannot help with the trip you already planned.' },

  { name:'Travala', flag:'\u26d3\ufe0f', raised:'Binance-backed', stage:'Public token',
    what:'Crypto-native OTA \u2014 book 3M+ properties with 100+ digital assets.',
    team:'Global', model:'OTA margin + AVA token',
    edge:'The only real proof that crypto travel booking works at scale. Genuinely useful for cross-border travellers.',
    gap:'A booking site with a payment gimmick. No planning, no coordination, no group layer. Solves how you pay, not what you do.' },

  { name:'Influencer trip operators', flag:'\ud83d\udcf1', raised:'\u2014', stage:'Fragmented',
    what:'Creators like Ritchie Shah and hundreds of others selling their own group trips.',
    team:'One creator + an ops partner', model:'Trip margin, 30\u201350%',
    edge:'Distribution is free and trust is enormous. A single reel fills a trip.',
    gap:'Every one rebuilds the same spreadsheet, WhatsApp group and payment chase from scratch. NOBODY has built the tool they all need \u2014 which is exactly what we are building.' }
];

/* The number that reframes the category. */
window.RW_CATEGORY_TRUTH = {
  competitors: 800,
  funded: 48,
  exited: 10,
  source: 'Tracxn, competitor counts for Mindtrip and Wanderlog, August 2026',
  read: 'Eight hundred companies are building an AI trip planner. Forty-eight have raised money. Ten have exited in the entire history of the category. If our plan were "build a better planner", the base rate says we lose.'
};

/* What every independent reviewer said, unprompted. */
window.RW_REVIEWER_QUOTES = [
  { src:'MonkeyTravel, 2026', line:'Most tools in this space still ignore the group use case.' },
  { src:'G8Trip, 2026',       line:'Real travel is messy \u2014 four friends flying from different continents trying to sync arrivals.' },
  { src:'Voyaige, 2026',      line:'Suggestions feel template-driven. Booking integration introduces inventory bias.' },
  { src:'Stardrift, 2026',    line:'Road trips are where most AI planners fall short \u2014 estimating realistic drive times is harder than it looks.' }
];

/* Funding reality, stated rather than dodged. */
window.RW_FUNDING_CLIMATE = [
  { k:'Travel-tech Q1 2026', v:'~$1B across 44 rounds \u2014 down from $1.2B / 66 rounds', note:'A decade low. Investors describe the market as tight and extremely selective.' },
  { k:'What still gets funded', v:'Companies that EXECUTE across systems and lift margins', note:'ROCH Ventures: "not ones that just recommend."' },
  { k:'Group travel', v:'WeRoad $58M led by Airbnb', note:'The one part of the category with fresh institutional conviction.' },
  { k:'India', v:'The Hosteller $16M \u00b7 named investor interest', note:'Skift flags appetite for the Indian travel economy specifically.' },
  { k:'AI planners', v:'AiRial raised $3M, ranks 6th of 158', note:'The crowded end. This is the trade we are deliberately not making.' }
];

/* ============================================================================
   RESILIENCE — why this survives a downturn that kills the rest
   ============================================================================
   Not a claim. A structure. Each line is a decision already made, not an
   intention.
   ========================================================================= */
window.RW_RESILIENCE = [
  { icon:'\ud83d\udd25', k:'Lean operating base',
    v:'One founder, three interns, no office and no agency. Confirmed intern payroll burn is \u20b921,000 per month, before any future founder/cofounder salaries.',
    why:'The base is lean, but it is not zero. Hiring and distribution spend should unlock only against retention, paid conversion and revenue milestones.' },

  { icon:'\ud83d\udcb0', k:'Revenue from day one, three ways',
    v:'\u20b9100 lifetime Pro \u00b7 8% booking commission \u00b7 partner listing fees.',
    why:'Not one revenue line waiting on scale. Three that work at twenty users and at twenty million.' },

  { icon:'\ud83c\udfe6', k:'We never hold anyone\u2019s money',
    v:'Guests pay properties directly. We invoice commission after the stay.',
    why:'No float, no settlement risk, no payment licence, nothing to freeze. The single largest failure mode in travel \u2014 an OTA collapsing with customer money \u2014 is structurally impossible here.' },

  { icon:'\ud83d\udee1\ufe0f', k:'No inventory risk',
    v:'We own no rooms, no buses, no trips.',
    why:'WeRoad carries trip cost. Hostellers carry leases. A bad quarter costs us traffic; it costs them rent.' },

  { icon:'\ud83e\uddf1', k:'The asset appreciates while we sleep',
    v:'Verified ground truth \u2014 real prices, honest road times, who checked and when.',
    why:'A downturn makes travellers MORE price-sensitive, which makes honest pricing data more valuable, not less. The moat grows in bad weather.' },

  { icon:'\u2696\ufe0f', k:'Costs are variable, not fixed',
    v:'Interns on stipends with sales incentive. Verifiers paid per verification. No salaried headcount.',
    why:'If revenue halves, cost halves. Most startups die because their costs cannot follow their revenue down.' },

  { icon:'\ud83c\uddee\ud83c\uddf3', k:'A domestic market that does not stop',
    v:'Indian domestic travel is structurally resilient \u2014 people trade international trips for domestic ones in a downturn.',
    why:'We benefit from the substitution that hurts outbound players.' }
];

/* ============================================================================
   DISTRIBUTION — the cheapest routes to a paying user, ranked by real cost
   ============================================================================ */
window.RW_DISTRIBUTION = [
  { rank:1, ch:'Referral links (staff + creators)', cac:'\u20b930',
    how:'30% of a \u20b9100 sale, paid only on a sale that completed.',
    why:'CAC is capped at 30% by arithmetic and can never exceed revenue. Nothing is spent on a sale that does not happen.',
    status:'Live \u00b7 built, tracked, paying' },

  { rank:2, ch:'Micro-creators (5k\u201350k followers)', cac:'\u20b940\u201380',
    how:'Barter first \u2014 a free verified trip in exchange for honest content. Cash only after a creator proves conversion.',
    why:'Engagement on a 10k account routinely beats a 500k account, and the ask is a trip rather than a fee. This is the arbitrage.',
    status:'Next \u00b7 lead-finder built' },

  { rank:3, ch:'College E-Cells and campus bodies', cac:'\u20b920\u201350',
    how:'Barter: Pro-for-life codes for every attendee. Face value \u20b91,00,000, real cost near zero.',
    why:'Group trips are what students actually do. NMIMS asked for \u20b920k\u20131L cash; we counter with codes and a founder talk.',
    status:'In discussion \u00b7 NMIMS' },

  { rank:4, ch:'Partner properties as a channel', cac:'\u20b90',
    how:'Every verified partner links "Planned via RoamWise" from their own page.',
    why:'They send us travellers because we charge them 8% instead of 20%. Distribution that pays us instead of costing us.',
    status:'Built \u00b7 needs signed partners' },

  { rank:5, ch:'Honest search content', cac:'\u20b95\u201315 amortised',
    how:'A small number of genuinely original guides built on data nobody else has.',
    why:'Compounds for years at zero marginal cost. Three guides already written; AdSense-safe because they are real.',
    status:'Live \u00b7 3 published' },

  { rank:6, ch:'WhatsApp communities', cac:'\u20b910\u201330',
    how:'Interns post in travel groups they are genuinely part of.',
    why:'Where Indian trips are actually planned. Free, but does not scale past the interns\u2019 own networks.',
    status:'Live \u00b7 intern targets set' },

  { rank:7, ch:'Paid ads', cac:'\u20b9250\u2013600',
    how:'Meta and Google, tested only after organic conversion is measured.',
    why:'At a \u20b9100 price point paid acquisition is mathematically underwater until lifetime value rises. We are NOT doing this.',
    status:'Deliberately not started' }
];
