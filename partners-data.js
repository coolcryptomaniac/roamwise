/* ============================================================================
   RW_PARTNERS — B2B partner directory
   ============================================================================
   Seeded from Deepanshi's field research (18 Aug 2026): boutique homestays and
   adventure operators across Goa, Manali and Rishikesh, with real Google
   ratings and review counts.

   HONESTY RULES BAKED IN:
   · `verified` — 'signed' (MoU in hand) | 'listed' (researched, not yet a partner)
     Only 'signed' partners get the RoamWise badge. We never imply a
     relationship that doesn't exist.
   · `addr:'verify'` means the exact street address was NOT reliably found.
     Deepanshi's sheet flagged these rather than inventing an address — we keep
     that flag rather than quietly dropping it.

   THIS FILE IS A SEED. The live list lives in Firestore (config/partners),
   editable from the admin panel — same pattern as referrers.
   ========================================================================= */
window.RW_PARTNER_TIERS = [
  { id:'signed',  label:'RoamWise Partner',  icon:'\u2705', note:'MoU signed \u2014 verified by us' },
  { id:'listed',  label:'Researched',        icon:'\ud83d\udcdd', note:'Found in our research, not yet a partner' }
];

/* Commission model — what we actually earn, stated plainly for both sides. */
window.RW_PARTNER_MODEL = {
  stay:      { pct:8,  label:'Homestays & boutique stays', note:'8% of the booking value, paid after checkout' },
  adventure: { pct:12, label:'Adventure & experiences',    note:'12% \u2014 higher because activity margins are higher' },
  transport: { pct:5,  label:'Drivers & transport',        note:'5% \u2014 thin margins, high volume' },
  agency:    { pct:10, label:'Travel agencies',            note:'10% on packages routed through RoamWise' },
  creator:   { pct:15, label:'Creator-led trips',          note:'15% \u2014 we bring the audience and the tooling' },
  listing:   { pct:0,  label:'Free listing',               note:'No commission. Get discovered, pay nothing.' }
};

window.RW_PARTNERS = [
  /* ---------- GOA · STAYS ---------- */
  { id:'p_quintaverde', cat:'stay', zone:'Goa', area:'Benaulim, South Goa',
    name:'Quinta Verde', rating:5.0, reviews:70, verified:'listed', priority:'high',
    hook:'Portuguese heritage feel; intimate South Goa homestay' },
  { id:'p_secretgarden', cat:'stay', zone:'Goa', area:'Saligao, North Goa',
    name:'The Secret Garden Goa', rating:4.8, reviews:48, verified:'listed', priority:'high',
    hook:'Garden setting; peaceful village stay' },
  { id:'p_capella', cat:'stay', zone:'Goa', area:'Parra, North Goa',
    name:'Capella Forest Retreat', rating:4.9, reviews:268, verified:'listed', priority:'high',
    hook:'Forest retreat; tranquil boutique nature stay' },
  { id:'p_mystic', cat:'stay', zone:'Goa', area:'Arpora, North Goa',
    name:'Mystic Homestay', rating:4.9, reviews:39, verified:'listed', priority:'high',
    hook:'Convenient North Goa base; relaxed' },
  { id:'p_astor', cat:'stay', zone:'Goa', area:'Candolim', addr:'verify',
    name:'The Astor Goa', rating:4.9, reviews:1259, verified:'listed', priority:'high',
    hook:'Luxury boutique suites near Candolim Beach' },
  { id:'p_postcard', cat:'stay', zone:'Goa', area:'Old Goa', addr:'verify',
    name:'The Postcard Velha', rating:5.0, reviews:263, verified:'listed', priority:'high',
    hook:'High-end heritage stay in a quiet historic setting' },
  { id:'p_ahilya', cat:'stay', zone:'Goa', area:'Nerul, North Goa', addr:'verify',
    name:'Ahilya By The Sea', rating:4.9, reviews:234, verified:'listed', priority:'high',
    hook:'Intimate coastal retreat; sea views' },
  { id:'p_casamenezes', cat:'stay', zone:'Goa', area:'Batim, Tiswadi',
    name:'Casa Menezes', rating:4.6, reviews:294, verified:'listed', priority:'medium',
    hook:'Heritage Goan home; traditional hospitality' },

  /* ---------- MANALI · STAYS ---------- */
  { id:'p_hygge', cat:'stay', zone:'Manali', area:'Khaknal',
    name:'Hygge Home Manali', rating:5.0, reviews:72, verified:'listed', priority:'high',
    hook:'Scandinavian-inspired comfort in the mountains' },
  { id:'p_nush', cat:'stay', zone:'Manali', area:'Aleo, Naggar Road',
    name:'The Nush Stays', rating:4.9, reviews:224, verified:'listed', priority:'high',
    hook:'Contemporary comfort; high-rated' },
  { id:'p_ehsaas', cat:'stay', zone:'Manali', area:'Shanag',
    name:'Ehsaas by Ostello', rating:4.9, reviews:82, verified:'listed', priority:'high',
    hook:'Cafe + boutique stay; social traveller appeal' },
  { id:'p_himalayanlotus', cat:'stay', zone:'Manali', area:'Vashisht',
    name:'Himalayan Lotus', rating:4.8, reviews:92, verified:'listed', priority:'high',
    hook:'Boutique homestay; convenient Vashisht base' },
  { id:'p_tranquility', cat:'stay', zone:'Manali', area:'Siyal',
    name:'Tranquility Homestay', rating:4.8, reviews:35, verified:'listed', priority:'high',
    hook:'Quiet mountain ambience' },
  { id:'p_orchards', cat:'stay', zone:'Manali', area:'Old Manali',
    name:'Orchards House', rating:4.6, reviews:823, verified:'listed', priority:'medium',
    hook:'Popular Old Manali base; orchard character' },

  /* ---------- RISHIKESH · STAYS ---------- */
  { id:'p_lamrin', cat:'stay', zone:'Rishikesh', area:'Rishikesh', addr:'verify',
    name:'Lamrin Boutique Cottages', rating:4.9, reviews:381, verified:'listed', priority:'high',
    hook:'Private cottages; personalised service' },
  { id:'p_seventh', cat:'stay', zone:'Rishikesh', area:'Rishikesh', addr:'verify',
    name:'Seventh Heaven Inn', rating:4.8, reviews:306, verified:'listed', priority:'high',
    hook:'Family-run feel; walkable to the river' },
  { id:'p_gangakinare', cat:'stay', zone:'Rishikesh', area:'Rishikesh', addr:'verify',
    name:'Ganga Kinare', rating:4.7, reviews:2883, verified:'listed', priority:'medium',
    hook:'Riverside setting with a private ghat' },

  /* ---------- ADVENTURE OPERATORS ---------- */
  { id:'p_tayal', cat:'adventure', zone:'Rishikesh', area:'ISBT Road',
    name:'Tayal Adventure Tours', rating:4.8, reviews:1372, verified:'listed', priority:'high',
    hook:'High-volume operator; rafting and adventure packages' },
  { id:'p_inbound', cat:'adventure', zone:'Rishikesh', area:'Tapovan',
    name:'Inbound Adventure Tours', rating:4.9, reviews:227, verified:'listed', priority:'high',
    hook:'Adventure packages from Tapovan' },
  { id:'p_himalayasadv', cat:'adventure', zone:'Rishikesh', area:'Laxman Jhula',
    name:'Himalayas Adventure', rating:4.9, reviews:196, verified:'listed', priority:'high',
    hook:'Central tourist-zone adventure experiences' },
  { id:'p_treksnrapids', cat:'adventure', zone:'Rishikesh', area:'Dhalwala',
    name:'Treks N Rapids', rating:null, reviews:null, verified:'listed', priority:'high',
    badge:'ATOAI member',
    hook:'ATOAI-member operator: trekking, rafting, mountain sports' },
  { id:'p_goaadv', cat:'adventure', zone:'Goa', area:'Calangute',
    name:'Goa Adventure Tours', rating:4.9, reviews:669, verified:'listed', priority:'high',
    hook:'Sightseeing and Goa experiences' },
  { id:'p_gac', cat:'adventure', zone:'Goa', area:'Panaji',
    name:'GAC Holidays', rating:4.9, reviews:316, verified:'listed', priority:'high',
    hook:'Strongly rated Goa trip planning' },
  { id:'p_dkgoa', cat:'adventure', zone:'Goa', area:'Calangute Beach',
    name:'Adventure Goa DK Tours', rating:4.8, reviews:800, verified:'listed', priority:'high',
    hook:'Tour packages with beachside access' },
  { id:'p_sandygoa', cat:'adventure', zone:'Goa', area:'Calangute Market',
    name:'SandyGoa Tours', rating:4.7, reviews:11529, verified:'listed', priority:'medium',
    hook:'Very high review volume; broad Goa tours' }
];
