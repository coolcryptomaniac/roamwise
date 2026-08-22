/* ============================================================================
   RW_INCORP — where RoamWise should incorporate, decided in the open
   ============================================================================
   Researched August 2026 from provider pricing pages and independent
   comparisons. Pricing in this category changes often — every figure here is
   marked with what it covers, and investors are told to verify before relying
   on it.

   WHY THIS IS ON THE INVESTOR PAGE AT ALL: RoamWise is not yet incorporated.
   Rather than hide that, we show the decision, the real costs, and let the
   people funding it vote. An investor who helped choose the structure is an
   investor who understands it.
   ========================================================================= */

window.RW_INCORP_OPTIONS = [
  { id:'atlas', name:'Stripe Atlas', flag:'\ud83c\uddfa\ud83c\uddf8', juris:'Delaware C-Corp',
    setup:'$500 one-time', year2:'~$550/yr',
    y3:'$3,100\u2013$4,600',
    covers:['Delaware filing + state fees','EIN','83(b) election filed','Founder equity issued','1st year registered agent','$50k Stripe processing credits'],
    strength:'The default. Forms ~25% of all new Delaware corporations. Most internationally tested \u2014 founders in 140+ countries.',
    weakness:'Standardised only. No ongoing legal templates, no tax help, no compliance nagging. You handle year two yourself.',
    bestIf:'You want the fastest, cheapest clean C-Corp and will handle documents separately.' },

  { id:'clerky', name:'Clerky', flag:'\ud83c\uddfa\ud83c\uddf8', juris:'Delaware C-Corp',
    setup:'$425 formation (or $819 lifetime)', year2:'+$99/yr Library',
    y3:'~$700 yr1, ~$650 yr2',
    covers:['Attorney-grade document templates','SAFEs, convertible notes, option grants','Board consents and bylaws','83(b) support','Lifetime access on the higher tier'],
    strength:'What startup lawyers and YC companies use. Paperwork that survives Series A diligence without cleanup.',
    weakness:'Documents, not a full service. Some tiers do not file the incorporation for you. Overwhelming if you do not know what a board consent is.',
    bestIf:'You are raising venture capital within 18 months. The premium over Atlas is the cheapest diligence insurance available.' },

  { id:'firstbase', name:'Firstbase', flag:'\ud83c\uddfa\ud83c\uddf8', juris:'Delaware or Wyoming',
    setup:'$399 one-time', year2:'~$999/yr for the full platform',
    y3:'~$3,276',
    covers:['Delaware OR Wyoming','State filing fees included','Expedited EIN','Post-incorporation docs','Compliance calendar','Live cap table'],
    strength:'Cleanest option without a US passport. The compliance calendar nags you about franchise tax and 83(b) deadlines.',
    weakness:'Subscription, not one-and-done. Costs more than Atlas by year two.',
    bestIf:'You would rather pay to never think about admin than do it yourself with a spreadsheet.' },

  { id:'doola', name:'doola', flag:'\ud83c\udf0d', juris:'US LLC or C-Corp',
    setup:'from $297/yr', year2:'bundled',
    y3:'~$6,474 with Total Compliance',
    covers:['LLC-first','EIN without an SSN','Bookkeeping','Tax filing','Money transfers in 100+ countries'],
    strength:'Built for non-US founders. Strongest at the EIN-without-SSN problem that traps Indian founders.',
    weakness:'The most expensive over three years once compliance is bundled. LLC-first, which is the wrong shape for venture equity.',
    bestIf:'You are selling globally as a one-person shop, not raising a priced round.' },

  { id:'capbase', name:'Capbase', flag:'\ud83c\uddfa\ud83c\uddf8', juris:'Delaware C-Corp',
    setup:'$99/month', year2:'$1,188/yr',
    y3:'~$3,564',
    covers:['Formation','Ongoing cap table','SAFE and option issuance','Compliance reminders','Registered agent'],
    strength:'Cap table tooling included \u2014 Carta charges roughly $2,400/yr for the same thing at this stage.',
    weakness:'By year two you have spent more than Atlas plus a lawyer would have cost.',
    bestIf:'You want formation and cap table in one subscription and will actually use both.' },

  { id:'india', name:'India Pvt Ltd', flag:'\ud83c\uddee\ud83c\uddf3', juris:'MCA SPICe+',
    setup:'\u20b910,000\u201320,000', year2:'\u20b915,000\u201340,000/yr (CA + filings)',
    y3:'\u20b950,000\u2013\u20b91,00,000',
    covers:['Registration via MCA SPICe+','PAN, TAN, DIN','GST registration if needed','CCPS for angel investment','Local bank account'],
    strength:'Where the customers, the revenue, the UPI rails and the founder actually are. Indian angels invest through CCPS, not SAFEs.',
    weakness:'Compliance is real and ongoing \u2014 board meetings, annual filings, a CA on retainer. Foreign VCs sometimes prefer a Delaware parent.',
    bestIf:'Your revenue is in rupees and your first investors are Indian. Which, for RoamWise today, is both.' },

  { id:'flip', name:'India + Delaware parent', flag:'\ud83d\udd04', juris:'Two entities',
    setup:'\u20b920,000 + $500', year2:'both sets of compliance',
    y3:'\u20b91,00,000+ / $3,000+',
    covers:['Indian subsidiary operates','Delaware parent holds equity','US investors buy into the parent','Classic "flip" structure'],
    strength:'What most India-origin startups end up doing if they raise US venture money. Best of both once you actually need both.',
    weakness:'Two of everything. Doing it BEFORE you need it burns money and founder time on structure instead of product. Flipping later costs more but only if you succeed.',
    bestIf:'You have a term sheet from a US fund. Not before.' },

  { id:'dubai', name:'Dubai / UAE free zone', flag:'\ud83c\udde6\ud83c\uddea', juris:'IFZA / DMCC',
    setup:'AED 12,500\u201325,000', year2:'renewal similar',
    y3:'AED 40,000\u201375,000',
    covers:['0% personal income tax','100% foreign ownership','Residence visa possible','9% corporate tax above AED 375k profit'],
    strength:'Genuinely low tax, fast setup, good for a holding company.',
    weakness:'Substance requirements are tightening. No Indian customers care where you are registered, and it adds distance from your market for no product benefit.',
    bestIf:'You are already profitable and optimising tax. Not a first entity.' },

  { id:'diy', name:'Do it unbundled', flag:'\ud83d\udee0\ufe0f', juris:'Delaware, direct',
    setup:'~$90 + $50\u2013150 agent', year2:'~$500/yr',
    y3:'~$1,600',
    covers:['File the Certificate of Formation yourself (~$90)','EIN direct from the IRS (free)','Registered agent hired separately','You choose the address'],
    strength:'$200\u2013300 cheaper than any bundle, and you understand every piece because you did it.',
    weakness:'Requires knowing each step. A missed 83(b) deadline costs far more than the saving.',
    bestIf:'You have done this before, or you have more time than money.' }
,
{ id:'inkle', name:'Inkle', flag:'\ud83c\uddee\ud83c\uddf3\ud83c\uddfa\ud83c\uddf8', juris:'US entity, run from India',
    setup:'from $99/mo', year2:'$99\u2013500/mo by stage',
    y3:'~$3,500\u2013$18,000',
    covers:['US bookkeeping and tax filing','Form 5472 and 1120 handled','Delaware franchise tax','India-US transfer pricing','Built for the India-Delaware flip'],
    strength:'Built specifically for Indian founders running a US entity \u2014 the exact problem the flip creates. Handles the cross-border filings a normal CA will not touch.',
    weakness:'Ongoing subscription, not a formation service. You still incorporate elsewhere first. Only worth it once you actually have both entities.',
    bestIf:'You have already flipped, or are about to. Not a first purchase.' },

  { id:'angellist', name:'AngelList Stack', flag:'\ud83c\uddfa\ud83c\uddf8', juris:'Delaware C-Corp',
    setup:'Free formation', year2:'free tier, paid at scale',
    y3:'$0\u2013$2,000',
    covers:['Free Delaware incorporation','Cap table','SAFEs and rolling closes','Banking','Free for early-stage'],
    strength:'Free is genuinely free at this stage, and the SAFE tooling is what US angels already expect to receive.',
    weakness:'Deeply tied to the US angel ecosystem. Little use if your investors are Indian and writing CCPS cheques.',
    bestIf:'Your cap table is going to be mostly US angels writing SAFEs.' },

  { id:'razorpay_rize', name:'Razorpay Rize', flag:'\ud83c\uddee\ud83c\uddf3', juris:'India Pvt Ltd',
    setup:'\u20b912,000\u201325,000', year2:'compliance packages',
    y3:'\u20b960,000\u2013\u20b91,20,000',
    covers:['MCA incorporation end to end','PAN, TAN, DIN, bank account','Compliance calendar','Integrated with Razorpay payments','India-first support'],
    strength:'The cleanest Indian incorporation path. Built by a company that already understands Indian startup payments, and the support actually answers.',
    weakness:'India only \u2014 no help if you later need a US parent. Slightly pricier than filing through a local CA directly.',
    bestIf:'You want an Indian Pvt Ltd done properly without finding your own CA.' },

  { id:'carta', name:'Carta', flag:'\ud83d\udcc8', juris:'Cap table, not formation',
    setup:'~$2,400/yr at seed', year2:'scales with holders',
    y3:'~$7,200+',
    covers:['Cap table of record','409A valuations','Option grants and vesting','Investor reporting','What most VCs expect at Series A'],
    strength:'The standard. At Series A an investor will ask which cap table you use, and this is the answer that ends the conversation.',
    weakness:'Expensive before you have a cap table worth managing. A spreadsheet is genuinely fine for one founder and ten angels.',
    bestIf:'You have raised a priced round. Before that it is a status purchase.' }
];

/* The combinations investors actually argue about. */
window.RW_INCORP_COMBOS = [
  { id:'c_india_only', label:'India Pvt Ltd only',
    what:'One entity, where the business is.',
    cost:'\u20b910\u201320k setup \u00b7 \u20b915\u201340k/yr',
    fit:'Indian angels, rupee revenue, UPI. Simplest possible.' },
  { id:'c_atlas_carta', label:'Stripe Atlas + Carta',
    what:'Delaware C-Corp with proper cap table software from day one.',
    cost:'$500 + ~$2,400/yr',
    fit:'US-first fundraising. Expensive cap table at pre-seed.' },
  { id:'c_clerky_only', label:'Clerky alone',
    what:'Attorney-grade paperwork, self-filed incorporation.',
    cost:'$425\u2013819 + $99/yr',
    fit:'Raising VC within 18 months and want zero diligence cleanup.' },
  { id:'c_capbase', label:'Capbase all-in-one',
    what:'Formation, cap table and compliance in one subscription.',
    cost:'$1,188/yr',
    fit:'One vendor, no thinking. Costs more by year two.' },
  { id:'c_flip_later', label:'India now, flip if needed',
    what:'Incorporate in India today. Add a Delaware parent only when a US fund actually issues a term sheet.',
    cost:'\u20b910\u201320k now',
    fit:'Cheapest path that keeps every door open.' },
  { id:'c_dual_now', label:'Dual structure immediately',
    what:'Delaware parent and Indian subsidiary from the start.',
    cost:'\u20b920k + $500, doubled compliance',
    fit:'Only if a US round is already agreed.' }
];

/* Recorded honestly so nobody has to ask. */
window.RW_INCORP_NOTE =
  'RoamWise is not yet incorporated. Part of this round pays for it. We are '
+ 'showing the real options and the real costs, and letting the people funding '
+ 'us weigh in \u2014 rather than presenting a decision already made. '
+ 'Pricing here was researched in August 2026 and moves often; verify before relying on it. '
+ 'This is not legal or tax advice, and we will have a lawyer and a CA review whatever wins.';
