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

/* Homepage pilot. The user confirmed Milan Heights has signed; availability,
   rates and the final reservation are still confirmed directly with the hotel. */
window.RW_PARTNER_SEED = [{
  id:'p_milan_heights', cat:'stay', zone:'Almora', area:'Dharanaula, opposite Milan Cafe',
  name:'Milan Heights', verified:'signed', listingReady:true, bookingMode:'whatsapp',
  bookingWhatsapp:'917302315845', supportEmail:'support@roamwise.co.in',
  badges:['partner'],
  photos:[
    {src:'assets/property-photos/milan-heights-front.jpg',alt:'Milan Heights building and restaurant entrance in Dharanaula, Almora',caption:'Milan Heights frontage · photo shared for this listing'},
    {src:'assets/property-photos/milan-heights-gaming.jpg',alt:'Milan Heights gaming zone with racing game screens and visitors',caption:'Gaming zone · photo from Milan Heights on Instagram'}
  ],
  instagramUrl:'https://www.instagram.com/milan_height/',
  hook:'A signed RoamWise stay in Almora. Ask the hotel on WhatsApp to confirm rooms, dates and the final total.'
},{
  /* Onboarded by the founder and approved in admin (partnerPublicProfiles, verifiedAt 2026-10-06).
     No WhatsApp number or photos are on file yet, so the listing routes guests through the
     RoamWise stays flow rather than a direct chat. Add bookingWhatsapp/photos when received. */
  id:'p_soulmate_homestay', cat:'stay', zone:'Almora', area:'Kotyura',
  name:'Soulmate Homestay', verified:'signed', listingReady:true,
  photos:[
    {src:'assets/property-photos/soulmate-front.jpg',alt:'Soulmate Homestay and restaurant entrance with yellow steps in Kotyura, Almora',caption:'Entrance · photo shared for this listing'},
    {src:'assets/property-photos/soulmate-cafe.jpg',alt:'Soulmate cafe seating with a wooden wall and cow mural',caption:'Cafe seating · photo shared for this listing'},
    {src:'assets/property-photos/soulmate-garden.jpg',alt:'Soulmate garden terrace with a children\'s play area and mountain views',caption:'Garden and play area · photo shared for this listing'},
    {src:'assets/property-photos/soulmate-walkway.jpg',alt:'Soulmate covered walkway lit with lanterns and star lights at night',caption:'Walkway at night · photo shared for this listing'}
  ],
  supportEmail:'support@roamwise.co.in',
  /* Signed partners book by WhatsApp only (never via an OTA). Hidden until bookingMode:'whatsapp' + bookingWhatsapp are saved from the partner admin. */
  mapsUrl:'https://www.google.com/maps/search/?api=1&query=Soulmate+Homestay+Kotyura+Almora',
  badges:['local','quiet'],
  hook:'Kumaoni cooking and Himalayan surroundings in Kotyura, Almora, with a local host. Ask RoamWise to confirm rooms, dates and the final total.'
},{
  /* Approved in the partner admin (MOU accepted 2026-09-30). Details below come from public
     travel-site listings (hotels.com / Expedia): Chachoga Road near Hotel Vintage, free
     breakfast, Wi-Fi and balconies, about 0.6 km from Mall Road. No rating or rate is shown
     until the Trust Desk price audit is complete. Add bookingWhatsapp/photos when received. */
  id:'p_new_himank', cat:'stay', zone:'Manali', area:'Chachoga Road, near Hotel Vintage',
  name:'New Himank', verified:'signed', listingReady:true,
  photos:[
    {src:'assets/property-photos/new-himank-room.webp',alt:'New Himank guest room with wooden panelling, large windows and a TV in Manali',caption:'Guest room · photo shared for this listing'},
    {src:'assets/property-photos/new-himank-dining.webp',alt:'New Himank attic dining hall with wooden ceiling and window views in Manali',caption:'Dining hall · photo shared for this listing'},
    {src:'assets/property-photos/new-himank-signboard.webp',alt:'New Himank signboard on the building front in Manali',caption:'Entrance signboard · photo shared for this listing'}
  ],
  supportEmail:'support@roamwise.co.in',
  /* Signed partners book by WhatsApp only (never via an OTA). Hidden until bookingMode:'whatsapp' + bookingWhatsapp are saved from the partner admin. */
  mapsUrl:'https://www.google.com/maps/search/?api=1&query=New+Himank+Homestay+Chachoga+Road+Manali',
  hook:'Homestay with an on-site restaurant on Chachoga Road, Manali, about a 7-minute walk to Mall Road. Public listings mention free breakfast, Wi-Fi and balconies in every room. Ask RoamWise to confirm rooms, dates and the final total.'
}];

/* Commission model — what we actually earn, stated plainly for both sides. */
window.RW_PARTNER_MODEL = {
  stay:      { pct:7,  label:'Homestays & boutique stays', note:'Partner Free is 7% after a completed stay; active paid partner plans are 5%. Protected B2B net-rate partners use the agreed net instead — never both.' },
  adventure: { pct:12, label:'Adventure & experiences',    note:'12% \u2014 higher because activity margins are higher' },
  transport: { pct:5,  label:'Drivers & transport',        note:'5% \u2014 thin margins, high volume' },
  agency:    { pct:10, label:'Travel agencies',            note:'10% on packages routed through RoamWise' },
  creator:   { pct:15, label:'Creator-led trips',          note:'15% \u2014 we bring the audience and the tooling' },
  listing:   { pct:0,  label:'Listing-only',               note:'One-time listing contribution applies; no booking commission when a property is informational-only.' }
};

window.RW_PARTNERS = window.RW_PARTNER_SEED.concat([
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
    propertyType:'Hotel', roomCount:6, listingTier:'small-hotel', suggestedListingFee:999,
    brochureReceived:true, pricingMode:'protected-net-rate', rateAuditRequired:true, breakfastIncluded:true, bookable:false,
    badges:['hotel','slow-travel','stargazing','orchard'],
    hook:'Six-room Manali hotel with orchard views, glass-roof stargazing rooms and a slow-travel positioning' },
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
]);
