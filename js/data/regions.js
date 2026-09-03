/* ============================================================================
   js/data/regions.js
   ----------------------------------------------------------------------------
   Indian States & Regions data (RW_STATES, RW_STATE_ALIAS) plus the
   Country/Region Trips data (RW_COUNTRY_ROUTES) — moved verbatim out of
   app.js (Phase 1 of the app.js modularization). Pure data/config, no logic
   changes. The functions that consume this data (rwDetectState,
   rwStateHTML, rwDetectCountry, rwCountryRouteHTML, rwMergeExtData) stay in
   app.js for now since they build onclick-bearing HTML strings — only the
   leaf data moved here. Loaded as a plain classic <script> (not a module)
   in index.html, before app.js, so RW_STATES, RW_STATE_ALIAS and
   RW_COUNTRY_ROUTES stay bare globals exactly as before.
   ========================================================================= */
/* ==================== INDIAN STATES & REGIONS ====================
   States are not cities, so a global city geocoder has no entry for them —
   "Kerala" resolved to Kerälä, a village in Finland, and "Rajasthan" or
   "Himachal" would fail the same way. A state request is also not a single
   destination: the right answer is a route through it, sized to the days
   available. This handles both. */
var RW_STATES = {
  kerala:      {label:'Kerala', cc:'IN', lat:10.1632, lon:76.6413,
    circuits:[
      {name:'Backwaters & hills', minDays:6, stops:['Kochi','Alleppey','Munnar'], why:'The classic first Kerala trip \u2014 fort town, houseboat night, then tea country.'},
      {name:'Full south coast',   minDays:9, stops:['Kochi','Alleppey','Varkala','Kovalam'], why:'Add the cliff beaches and the quieter southern shore.'},
      {name:'Wild Kerala',        minDays:8, stops:['Kochi','Thekkady','Wayanad'], why:'Spice plantations and two of the better wildlife reserves.'},
      {name:'North Kerala',       minDays:7, stops:['Kozhikode','Wayanad','Kannur'], why:'Theyyam ritual season, Malabar food, and almost no tourists.'}
    ]},
  rajasthan:   {label:'Rajasthan', cc:'IN', lat:26.9124, lon:75.7873,
    circuits:[
      {name:'Golden Triangle+',   minDays:6, stops:['Jaipur','Agra','Delhi'], why:'The standard entry route into north India.'},
      {name:'Desert circuit',     minDays:9, stops:['Jaipur','Jodhpur','Jaisalmer'], why:'Forts to dunes, with overnight trains that work well.'},
      {name:'Lakes & forts',      minDays:8, stops:['Udaipur','Chittorgarh','Bundi'], why:'The softer, greener half of the state.'}
    ]},
  himachal:    {label:'Himachal Pradesh', cc:'IN', lat:31.1048, lon:77.1734,
    circuits:[
      {name:'Classic hills',      minDays:6, stops:['Shimla','Manali','Kasol'], why:'Easy road access, good for a first mountain trip.'},
      {name:'Spiti loop',         minDays:10, stops:['Manali','Kaza','Tabo'], why:'High desert. Only Jun\u2013Oct, and worth planning carefully.'},
      {name:'Dhauladhar',         minDays:7, stops:['Dharamshala','Bir','Barot'], why:'Monasteries and paragliding, quieter than Manali.'}
    ]},
  uttarakhand: {label:'Uttarakhand', cc:'IN', lat:30.0668, lon:79.0193,
    circuits:[
      {name:'Kumaon hills',       minDays:6, stops:['Nainital','Almora','Munsiyari'], why:'Lakes, then ridges, then the high Himalaya in view.'},
      {name:'Ganga & yoga',       minDays:5, stops:['Haridwar','Rishikesh','Devprayag'], why:'The river end-to-end \u2014 aarti, rafting, ashrams.'},
      {name:'Char Dham circuit',  minDays:12, stops:['Yamunotri','Gangotri','Kedarnath','Badrinath'], why:'The full pilgrimage. May\u2013Oct only, and physically demanding.'}
    ]},
  goa:         {label:'Goa', cc:'IN', lat:15.4909, lon:73.8278,
    circuits:[
      {name:'North Goa',          minDays:4, stops:['Anjuna','Baga','Vagator'], why:'Markets, nightlife and the busy stretch of coast.'},
      {name:'South Goa',          minDays:5, stops:['Palolem','Agonda','Colva'], why:'Quiet beaches. This is the Goa people mean when they say it changed.'},
      {name:'Inland Goa',         minDays:4, stops:['Panjim','Old Goa','Ponda'], why:'Portuguese quarters, churches and spice farms \u2014 barely visited.'}
    ]},
  karnataka:   {label:'Karnataka', cc:'IN', lat:15.3350, lon:76.4600,
    circuits:[
      {name:'Hampi & coast',      minDays:7, stops:['Hampi','Gokarna','Bengaluru'], why:'Ruins, then an unhurried beach town.'},
      {name:'Coffee country',     minDays:6, stops:['Bengaluru','Coorg','Mysuru'], why:'Plantations, palaces and easy roads.'}
    ]},
  tamilnadu:   {label:'Tamil Nadu', cc:'IN', lat:11.1271, lon:78.6569,
    circuits:[
      {name:'Temple trail',       minDays:8, stops:['Chennai','Mahabalipuram','Thanjavur','Madurai'], why:'Dravidian architecture at its best.'},
      {name:'Hills & coast',      minDays:7, stops:['Chennai','Pondicherry','Ooty'], why:'French quarter, then tea hills.'}
    ]},
  gujarat:     {label:'Gujarat', cc:'IN', lat:22.2587, lon:71.1924,
    circuits:[
      {name:'Rann & heritage',    minDays:7, stops:['Ahmedabad','Bhuj','Rann of Kutch'], why:'White desert \u2014 Nov\u2013Feb only.'},
      {name:'Wildlife',           minDays:6, stops:['Ahmedabad','Gir','Somnath'], why:'The only wild Asiatic lions on earth.'}
    ]},
  ladakh:      {label:'Ladakh', cc:'IN', lat:34.1526, lon:77.5771,
    circuits:[
      {name:'Leh & lakes',        minDays:8, stops:['Leh','Nubra','Pangong'], why:'Acclimatise in Leh for two days first \u2014 non-negotiable.'},
      {name:'Full Ladakh',        minDays:12, stops:['Leh','Nubra','Pangong','Tso Moriri'], why:'Add the quieter southern lakes and Hanle if permits allow.'}
    ]},
  sikkim:      {label:'Sikkim', cc:'IN', lat:27.5330, lon:88.5122,
    circuits:[
      {name:'East Sikkim',        minDays:6, stops:['Gangtok','Tsomgo','Nathula'], why:'Permits needed for Nathula \u2014 arrange in Gangtok.'},
      {name:'North Sikkim',       minDays:8, stops:['Gangtok','Lachung','Yumthang'], why:'Valley of flowers in spring, snow in winter.'}
    ]},
  meghalaya:   {label:'Meghalaya', cc:'IN', lat:25.4670, lon:91.3662,
    circuits:[
      {name:'Living root bridges',minDays:6, stops:['Shillong','Cherrapunji','Nongriat'], why:'The double-decker root bridge is a hard day hike down and back.'},
      {name:'Caves & canyons',    minDays:7, stops:['Shillong','Dawki','Mawlynnong'], why:'Clear-water river at Dawki, and Asia\u2019s cleanest village.'}
    ]}
};
var RW_STATE_ALIAS = {
  'kerala':'kerala','gods own country':'kerala',
  'rajasthan':'rajasthan',
  'himachal':'himachal','himachal pradesh':'himachal','hp':'himachal',
  'uttarakhand':'uttarakhand','uttaranchal':'uttarakhand','garhwal':'uttarakhand','kumaon':'uttarakhand',
  /* NOTE: Goa, Ladakh and Sikkim are states, but they are compact enough that a
     single destination card (photo, vibe, costs, food) serves better than a
     circuit picker. Their circuits stay reachable via "goa circuits". Only the
     large states auto-route to routes. */
  'goa circuits':'goa','kerala circuits':'kerala',
  'karnataka':'karnataka',
  'tamil nadu':'tamilnadu','tamilnadu':'tamilnadu',
  'gujarat':'gujarat',
  'ladakh circuits':'ladakh',
  'sikkim circuits':'sikkim',
  'meghalaya':'meghalaya'
};

/* ==================== COUNTRY / REGION TRIPS ====================
   "10 days all india trip" is not a request for a city — it's a request for a
   ROUTE. Previously the parser hunted for a single place, grabbed "all", and
   resolved it to a village in Catalonia. Country-scope requests now get a
   curated multi-stop suggestion sized to the days available, because the
   honest answer to "see all of India in 10 days" is "you can't, here are three
   routes that actually work". */
var RW_COUNTRY_ROUTES = {
  india: {
    label:'India', cc:'IN',
    circuits:[
      {name:'Golden Triangle', minDays:5, stops:['Delhi','Agra','Jaipur'],
       why:'The classic first trip \u2014 Mughal monuments, forts and the easiest logistics in the country.'},
      {name:'Rajasthan run', minDays:8, stops:['Jaipur','Jodhpur','Udaipur','Jaisalmer'],
       why:'Forts, lakes and desert. Long but comfortable overnight trains between stops.'},
      {name:'Kerala + coast', minDays:7, stops:['Kochi','Alleppey','Munnar','Varkala'],
       why:'Backwaters, tea hills and quiet beaches \u2014 the slowest-paced option here.'},
      {name:'Himalayan north', minDays:9, stops:['Delhi','Shimla','Manali','Dharamshala'],
       why:'Mountains and monasteries. Road-heavy; add buffer days for landslides in monsoon.'},
      {name:'Spiritual belt', minDays:6, stops:['Delhi','Rishikesh','Haridwar','Varanasi'],
       why:'The Ganga end-to-end \u2014 yoga, aarti and the oldest living city in the country.'},
      {name:'South temples', minDays:8, stops:['Chennai','Pondicherry','Madurai','Hampi'],
       why:'Dravidian temple architecture and the ruins at Hampi.'}
    ]
  },
  nepal:{label:'Nepal', cc:'NP', circuits:[
      {name:'Kathmandu + Pokhara', minDays:6, stops:['Kathmandu','Pokhara'], why:'Temples, then lakes and the Annapurna views.'},
      {name:'Everest foothills', minDays:12, stops:['Kathmandu','Lukla','Namche Bazaar'], why:'The EBC approach \u2014 needs permits and acclimatisation days.'}]},
  thailand:{label:'Thailand', cc:'TH', circuits:[
      {name:'North loop', minDays:7, stops:['Bangkok','Chiang Mai','Pai'], why:'City, then hills and slow towns.'},
      {name:'Islands', minDays:8, stops:['Bangkok','Krabi','Koh Phi Phi'], why:'Beaches and limestone karsts.'}]},
  vietnam:{label:'Vietnam', cc:'VN', circuits:[
      {name:'North to south', minDays:12, stops:['Hanoi','Hoi An','Ho Chi Minh City'], why:'The full length \u2014 internal flights between the three.'}]},
  japan:{label:'Japan', cc:'JP', circuits:[
      {name:'Golden route', minDays:8, stops:['Tokyo','Kyoto','Osaka'], why:'Shinkansen between all three; a rail pass pays for itself.'}]},
  italy:{label:'Italy', cc:'IT', circuits:[
      {name:'Classic three', minDays:8, stops:['Rome','Florence','Venice'], why:'Fast trains link all three; book those early.'}]}
};
