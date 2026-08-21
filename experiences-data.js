/* ============================================================================
   RW_EXPERIENCES — certified, curated, tested by RoamWise
   ============================================================================
   The rule that makes the badge mean something: nothing is listed until a
   RoamWise person (or a paid verifier) has actually DONE it. Every entry
   records who tested it and when. If we haven't been, it isn't here.

   `status`: 'certified' = we did it | 'scouting' = shortlisted, not yet tested
   ========================================================================= */
window.RW_EXPERIENCES = [
  { id:'x_spiti_green', tier:'green', status:'scouting',
    title:'The Spiti Slow Circuit', days:7, from:22000, zone:'Himachal',
    tag:'Green · High altitude',
    hook:'Seven days across the coldest desert in India, moving as slowly as the valley does.',
    bundle:[
      {k:'Mobility', v:'Shared EV from Shimla to Reckong Peo, then a hired diesel 4x4 — the only vehicle that safely does the high passes'},
      {k:'Stay', v:'Solar-powered homestays in Kaza, Langza and Dhankar'},
      {k:'Food', v:'Full vegetarian and largely vegan by default — this is Buddhist Spiti'},
      {k:'Doing', v:'Key Monastery at dawn, fossil hunting in Langza, Chandratal if the road is open'}
    ],
    honest:'We will not pretend this is fully electric. No EV can safely cross Kunzum La today, and the charging network stops at Reckong Peo. The EV leg is real; the mountain leg is not. Anyone selling you a "zero-emission Spiti trip" is lying.',
    best:'June to September only. The road is shut the rest of the year.' },

  { id:'x_kerala_green', tier:'green', status:'scouting',
    title:'Kerala Without a Diesel Engine', days:5, from:18000, zone:'Kerala',
    tag:'Green · Genuinely all-electric',
    hook:'Kochi to the backwaters and back, entirely on electric and human power.',
    bundle:[
      {k:'Mobility', v:'Kochi Water Metro (electric ferries), KSRTC electric buses, e-autos, and a bicycle in Fort Kochi'},
      {k:'Stay', v:'Solar homestay in Fort Kochi; an electric-motor houseboat in Alleppey — not a diesel one'},
      {k:'Food', v:'Kerala Sadya is vegan as standard; plus a coconut-farm lunch and a toddy-shop meal'},
      {k:'Doing', v:'Canoe through the narrow canals a houseboat cannot enter, a spice farm walk, Kathakali'}
    ],
    honest:'This one is genuinely close to fully electric — Kerala has the best public EV infrastructure in India. The weak link is electric houseboats: only a handful exist and they book out. If none is free, we will tell you rather than quietly putting you on a diesel boat.',
    best:'September to March. Avoid the monsoon unless you actively want it.' },

  { id:'x_goa_green', tier:'green', status:'scouting',
    title:'South Goa, Slowly', days:4, from:14000, zone:'Goa',
    tag:'Green · Vegan-friendly',
    hook:'The Goa that is still quiet, on two electric wheels.',
    bundle:[
      {k:'Mobility', v:'Electric scooter for the whole trip, charged at the homestay off solar'},
      {k:'Stay', v:'Solar-powered heritage homestay in Benaulim with rainwater harvesting'},
      {k:'Food', v:'A vegan Goan kitchen, a farm table inland, and a Saturday organic market'},
      {k:'Doing', v:'Backwater kayaking, birding at Carambolim, a spice plantation, empty southern beaches'}
    ],
    honest:'Electric scooters are perfect for South Goa\u2019s short distances. They are NOT suitable if you plan to ride up to North Goa nightly \u2014 the range will not take it and you will be stranded. Say so when you book and we will plan differently.',
    best:'November to February. October and March are quieter and still fine.' },

  { id:'x_ziro', tier:'culture', status:'scouting',
    title:'Ziro, Beyond the Festival', days:5, from:26000, zone:'Arunachal',
    tag:'Culture · Permit needed',
    hook:'The Apatani valley when the stages have been taken down.',
    bundle:[
      {k:'Mobility', v:'Shared taxi from Naharlagun, then bicycles in the valley'},
      {k:'Stay', v:'Apatani family homestays in Hong and Hari villages'},
      {k:'Food', v:'Home kitchens \u2014 bamboo shoot, smoked meat, rice beer. Vegan on request but tell us early'},
      {k:'Doing', v:'Rice-fish farming, pine groves, Talley Valley trek, weaving with the family you stay with'}
    ],
    honest:'You need an Inner Line Permit and the drive from Naharlagun is long and rough. This is a slow trip in a place that does not perform for tourists \u2014 which is precisely the point.',
    best:'March to October. September if you also want the festival.' }
];
window.RW_EXP_PROMISE = [
  'We have been. Nothing is listed until a RoamWise person has actually done the trip.',
  'We name the weak link. Every experience says where it falls short.',
  'Prices are what it really costs, not a lead-in figure.',
  'Local operators are paid properly. We take 12%, not 25%.'
];
