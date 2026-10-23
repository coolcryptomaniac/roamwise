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
  { id:'founder-approved', label:'Founder introduced', icon:'', note:'Enquiries only; property agreement pending' },
  { id:'listed',  label:'Researched',        icon:'\ud83d\udcdd', note:'Found in our research, not yet a partner' }
];

/* Founder introductions are public enquiries, never signed inventory or payment approval.
   Unapproved research stays remain hidden. The explicit review marker is required. */
window.rwStayPublicEligible = function(p){
  return !!p && p.listingReady===true && (p.verified==='signed' ||
    (p.verified==='founder-approved' && p.enquiryOnly===true && p.founderApproval==='Mohit Pandey · 2026-10-18'));
};

/* Homepage pilot. The user confirmed Milan Heights has signed; availability,
   rates and the final reservation are still confirmed directly with the hotel. */
window.RW_PARTNER_SEED = [{
  id:'p_milan_heights', cat:'stay', zone:'Almora', area:'Milan Chowk, Almora',
  name:'Milan Heights', verified:'signed', listingReady:true, bookingMode:'whatsapp',
  bookingWhatsapp:'917302315845', supportEmail:'support@roamwise.co.in',
  badges:['partner'],
  photos:[
    {src:'assets/property-photos/milan-heights-front.jpg',alt:'Milan Heights building and restaurant entrance at Milan Chowk, Almora',caption:'Milan Heights frontage · photo shared for this listing'},
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
},{
  /* MOU V4 signed by the property and countersigned by RoamWise on 15 Oct 2026 (RW-MOU-WOODBOOK-20261015,
     check at /partner/mou/verify/). Details from the property's written confirmation and its own site
     (thedevinehomestay.com). Partner Free, 7% on completed stays; availability confirmed on WhatsApp and calls.
     Photos: uploaded by the business owner to its Justdial listing (16 Oct 2026); the MOU authorises their use. */
  id:'p_woodbook_devine', cat:'stay', zone:'Tirthan Valley', area:'Galoon, P.O. Deotha, Banjar (near Laida Secret Waterfall)',
  name:'Woodbook The Devine Homestay', verified:'signed', listingReady:true, bookingMode:'whatsapp',
  bookingWhatsapp:'917807491275', supportEmail:'support@roamwise.co.in',
  propertyType:'Homestay', roomCount:5, maxGuests:14,
  photos:[
    {src:'assets/property-photos/woodbook-treehouse.webp',alt:'A-frame wooden treehouse with a balcony and the cottage beside it, Woodbook, Banjar',caption:'Treehouse \u00b7 photo from the property\u2019s own listing'},
    {src:'assets/property-photos/woodbook-cottages.webp',alt:'Twin wooden cottages under a clear blue sky at Woodbook, Galoon',caption:'Cottages \u00b7 photo from the property\u2019s own listing'},
    {src:'assets/property-photos/woodbook-room-window.webp',alt:'Wooden room with a large window, colourful bedding and a tree trunk inside',caption:'Room with a valley window \u00b7 photo from the property\u2019s own listing'},
    {src:'assets/property-photos/woodbook-room-loft.webp',alt:'Wooden loft room with a double bed and stairs',caption:'Loft room \u00b7 photo from the property\u2019s own listing'},
    {src:'assets/property-photos/woodbook-balcony-view.webp',alt:'Balcony with prayer flags looking down the green valley',caption:'Balcony view \u00b7 photo from the property\u2019s own listing'},
    {src:'assets/property-photos/woodbook-garden.webp',alt:'Garden seating with a red table and umbrella facing the mountains',caption:'Garden \u00b7 photo from the property\u2019s own listing'},
    {src:'assets/property-photos/woodbook-snow.webp',alt:'Wooden cottages covered in winter snow',caption:'In winter snow \u00b7 photo from the property\u2019s own listing'},
    {src:'assets/property-photos/woodbook-attic-sitout.webp',alt:'Attic sit-out with floor cushions and a carpet under the A-frame roof',caption:'Attic sit-out \u00b7 photo from the property\u2019s own listing'}
  ],

  website:'https://thedevinehomestay.com/',
  mapsUrl:'https://www.google.com/maps/search/?api=1&query=Woodbook+The+Devine+Homestay+Galoon+Banjar+Kullu',
  badges:['partner','quiet'],
  hook:'A treehouse and a cottage in an apple orchard at Galoon in the Banjar side of Tirthan Valley, near the Laida Secret Waterfall, with an outdoor fireplace and forest views. Five rooms for up to 12 to 14 guests. Ask the hosts on WhatsApp to confirm rooms, dates and the final total.'
},{
  /* Big Bro Hotel, Ghurson, Almora. MOU V4 + Schedule B (Partner Free, 7%, no listing fee) prepared 16 Oct 2026;
     the founder met the owner (Akshit Pandey) in person and confirmed the partnership. Kept minimal on purpose:
     seed fields win over the live Firestore entry on merge, so contact, route and policy stay in the partner admin.
     Photos: supplied by the founder on 16 Oct 2026 for this listing under the MOU content permission (clause 12).
     Replace with the owner's own photos when received. "RoamWise Checked" is computed by RWTrust, not set here. */
  id:'p_big_bro_hotel', cat:'stay', zone:'Almora', area:'Ghurson', name:'Big Bro Hotel', verified:'signed', listingReady:true,
  /* Long stays (MOU Annexure A1 / Schedule B B3): 15 nights Rs 30,000; 1 month Rs 50,000; 3 months Rs 1,50,000 in total
     (Rs 50,000 a month); 4 rooms; minimum 15 nights. Owner told the founder on 17 Oct 2026: Wi-Fi 100 Mbps, inverter backup. Owner confirmed the inverter covers the rooms (backup 'full'), a desk and chair
     and a quiet spot for calls exist. No guest kitchen and no shared work area; meals means the paid hotel restaurant, not included in the rate. verified:false until a speed test is on file. */
  nomad:{enabled:true, rooms:4, minNights:15, mbps:100, backup:'full', desk:'basic', callRoom:true, meals:true, rate15:30000, rate30:50000, rate90:50000, includes:[], verified:false},
  photos:[
    {src:'assets/property-photos/big-bro-room.webp',alt:'Double room with a grey tufted headboard, white bedding, a floral blanket and a window with cream curtains at Big Bro Hotel, Almora',caption:'Guest room \u00b7 Big Bro Hotel'},
    {src:'assets/property-photos/big-bro-sunset-lounge.webp',alt:'Sunset over hazy hills seen through the large lounge windows at Big Bro Hotel, Almora',caption:'Sunset from the lounge \u00b7 Big Bro Hotel'},
    {src:'assets/property-photos/big-bro-lounge.webp',alt:'Glass-walled lounge with wooden benches, red cushions and a view of the pine-covered hills at Big Bro Hotel, Almora',caption:'Lounge with a hill view \u00b7 Big Bro Hotel'},
    {src:'assets/property-photos/big-bro-room-2.webp',alt:'Double room with a tufted headboard, a window facing garden steps, two chairs and a table at Big Bro Hotel, Almora',caption:'Guest room with a window \u00b7 Big Bro Hotel'},
    {src:'assets/property-photos/big-bro-meal.webp',alt:'Paratha, curd and a lemon drink on a table beside a large window with a hill view at Big Bro Hotel, Almora',caption:'Table by the window \u00b7 Big Bro Hotel'}
  ]
},{
  /* Founder explicitly approved public enquiries for his relatives' property on 18 Oct 2026.
     Owner MOU signatures, tariffs and paid inventory remain pending. This is NOT signed supply.
     Facts/photos: supplied property card and Airbnb room 1662787644512775118; contacts supplied by founder. */
  id:'p_corbett_jungle_view', cat:'stay', zone:'Lansdowne', area:'Ghildiyal Gaon, P.O. Bansi, Pauri Garhwal 246155',
  name:'Corbett Jungle View Homestay', verified:'founder-approved', listingReady:true,
  founderApproval:'Mohit Pandey · 2026-10-18', enquiryOnly:true, ownerMouAccepted:false,
  bookingMode:'whatsapp', bookingWhatsapp:'917037365263', bookingPhone:'919867012129',
  supportEmail:'support@roamwise.co.in', propertyType:'Family homestay', roomCount:6, maxGuests:12,
  badges:['founder'],
  mapsUrl:'https://www.google.com/maps/search/?api=1&query=Corbett+Jungle+View+Homestay+Ghildiyal+Gaon+Bansi+Lansdowne',
  photos:[
    {src:'assets/property-photos/corbett-jungle-view-front.jpg',alt:'View from Corbett Jungle View Homestay balcony over nearby hills',caption:'Balcony view from the property’s Airbnb listing'},
    {src:'assets/property-photos/corbett-jungle-view-room.jpg',alt:'Double bedroom at Corbett Jungle View Homestay',caption:'Bedroom photo from its Airbnb listing'}
  ],
  videoUrl:'https://www.youtube.com/shorts/g_Nl3QI5HOo',
  instagramUrl:'https://www.instagram.com/reel/DZXJj9ATtyB/',
  hook:'A peaceful six-bedroom homestay in Ghildiyal Gaon near Bansi, in the Lansdowne region. Public listings mention attached bathrooms, Wi-Fi, kitchen access and parking. Ask owner Rekha Shastri on WhatsApp to confirm rooms, meals, rates and timings. Founder-introduced; enquiries only, property agreement pending.'

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
