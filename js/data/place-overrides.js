// @ts-nocheck
// Moved verbatim from app.js -> js/copilot/core.js (final modularization pass) —
// RW_PLACE_OVERRIDES: curated lat/lon overrides for Indian destinations that
// population-ranked geocoders mis-resolve to same-named places elsewhere.
// Pure data, no logic — same category as js/data/destinations.js and
// js/data/regions.js. Called from js/copilot/core.js (rwResolvePlace,
// rwKnownMap) and js/copilot/rich-reply.js.
/* Famous-destination overrides.
   Open-Meteo ranks by population, so India's tourist towns lose to same-named
   suburbs: "Manali" resolved to a Chennai neighbourhood instead of the Himachal
   hill station, "Bir" to Ukraine. For an India-first travel app those are the
   exact queries that must be right, so the best-known travel meaning wins. */
var RW_PLACE_OVERRIDES = {
  /* Famous Indian TOWNS/destinations that geocoders miss or mis-rank to foreign
     namesakes. Curated = never wrong, no network needed. */
  kanyakumari:{name:'Kanyakumari', admin:'Tamil Nadu', lat:8.0883, lon:77.5385},
  kanniyakumari:{name:'Kanyakumari', admin:'Tamil Nadu', lat:8.0883, lon:77.5385},
  capecomorin:{name:'Kanyakumari', admin:'Tamil Nadu', lat:8.0883, lon:77.5385},
  puducherry:{name:'Pondicherry', admin:'Puducherry', lat:11.9416, lon:79.8083},
  kodagu:{name:'Coorg (Kodagu)', admin:'Karnataka', lat:12.4244, lon:75.7382},
  alappuzha:{name:'Alleppey (Alappuzha)', admin:'Kerala', lat:9.4981, lon:76.3388},
  ranthambore:{name:'Ranthambore', admin:'Rajasthan', lat:26.0173, lon:76.5026},
  /* Indian STATES: absent from any city geocoder, which is how "Kerala"
     resolved to Kerälä in Finland. Anchored to their principal city so
     weather, costs and nearby lookups still work if used as a destination. */
  kerala:{name:'Kerala', admin:'Kerala (Kochi)', lat:9.9312, lon:76.2673},
  rajasthan:{name:'Rajasthan', admin:'Rajasthan (Jaipur)', lat:26.9124, lon:75.7873},
  himachal:{name:'Himachal Pradesh', admin:'Himachal (Shimla)', lat:31.1048, lon:77.1734},
  himachalpradesh:{name:'Himachal Pradesh', admin:'Himachal (Shimla)', lat:31.1048, lon:77.1734},
  uttarakhand:{name:'Uttarakhand', admin:'Uttarakhand (Dehradun)', lat:30.3165, lon:78.0322},
  karnataka:{name:'Karnataka', admin:'Karnataka (Bengaluru)', lat:12.9716, lon:77.5946},
  tamilnadu:{name:'Tamil Nadu', admin:'Tamil Nadu (Chennai)', lat:13.0827, lon:80.2707},
  gujarat:{name:'Gujarat', admin:'Gujarat (Ahmedabad)', lat:23.0225, lon:72.5714},
  ladakh:{name:'Ladakh', admin:'Ladakh (Leh)', lat:34.1526, lon:77.5771},
  sikkim:{name:'Sikkim', admin:'Sikkim (Gangtok)', lat:27.3389, lon:88.6065},
  meghalaya:{name:'Meghalaya', admin:'Meghalaya (Shillong)', lat:25.5788, lon:91.8933},
  punjab:{name:'Punjab', admin:'Punjab (Amritsar)', lat:31.6340, lon:74.8723},
  maharashtra:{name:'Maharashtra', admin:'Maharashtra (Mumbai)', lat:19.0760, lon:72.8777},
  westbengal:{name:'West Bengal', admin:'West Bengal (Kolkata)', lat:22.5726, lon:88.3639},
  odisha:{name:'Odisha', admin:'Odisha (Bhubaneswar)', lat:20.2961, lon:85.8245},
  assam:{name:'Assam', admin:'Assam (Guwahati)', lat:26.1445, lon:91.7362},
  telangana:{name:'Telangana', admin:'Telangana (Hyderabad)', lat:17.3850, lon:78.4867},
  andhrapradesh:{name:'Andhra Pradesh', admin:'Andhra Pradesh (Visakhapatnam)', lat:17.6868, lon:83.2185},
  madhyapradesh:{name:'Madhya Pradesh', admin:'Madhya Pradesh (Bhopal)', lat:23.2599, lon:77.4126},
  uttarpradesh:{name:'Uttar Pradesh', admin:'Uttar Pradesh (Lucknow)', lat:26.8467, lon:80.9462},
  bihar:{name:'Bihar', admin:'Bihar (Patna)', lat:25.5941, lon:85.1376},

  /* Major Indian anchors: the global geocoder betrays several of these
     ("Goa" the Indian state isn't a city in its dataset, so exact-match went
     to Goa, Philippines). Curated coordinates are checked FIRST, offline. */
  goa:{name:'Goa', admin:'Goa (Panaji)', lat:15.4909, lon:73.8278},
  delhi:{name:'Delhi', admin:'NCT of Delhi', lat:28.6139, lon:77.2090},
  newdelhi:{name:'New Delhi', admin:'NCT of Delhi', lat:28.6139, lon:77.2090},
  mumbai:{name:'Mumbai', admin:'Maharashtra', lat:19.0760, lon:72.8777},
  jaipur:{name:'Jaipur', admin:'Rajasthan', lat:26.9124, lon:75.7873},
  agra:{name:'Agra', admin:'Uttar Pradesh', lat:27.1767, lon:78.0081},
  kolkata:{name:'Kolkata', admin:'West Bengal', lat:22.5726, lon:88.3639},
  chennai:{name:'Chennai', admin:'Tamil Nadu', lat:13.0827, lon:80.2707},
  bengaluru:{name:'Bengaluru', admin:'Karnataka', lat:12.9716, lon:77.5946},
  bangalore:{name:'Bengaluru', admin:'Karnataka', lat:12.9716, lon:77.5946},
  hyderabad:{name:'Hyderabad', admin:'Telangana', lat:17.3850, lon:78.4867},
  pune:{name:'Pune', admin:'Maharashtra', lat:18.5204, lon:73.8567},
  kochi:{name:'Kochi', admin:'Kerala', lat:9.9312, lon:76.2673},
  amritsar:{name:'Amritsar', admin:'Punjab', lat:31.6340, lon:74.8723},
  jodhpur:{name:'Jodhpur', admin:'Rajasthan', lat:26.2389, lon:73.0243},
  lucknow:{name:'Lucknow', admin:'Uttar Pradesh', lat:26.8467, lon:80.9462},
  ahmedabad:{name:'Ahmedabad', admin:'Gujarat', lat:23.0225, lon:72.5714},
  srinagar:{name:'Srinagar', admin:'Jammu & Kashmir', lat:34.0837, lon:74.7973},
  guwahati:{name:'Guwahati', admin:'Assam', lat:26.1445, lon:91.7362},

  manali:{name:'Manali',admin:'Himachal Pradesh',lat:32.2432,lon:77.1892},
  shimla:{name:'Shimla',admin:'Himachal Pradesh',lat:31.1048,lon:77.1734},
  kasol:{name:'Kasol',admin:'Himachal Pradesh',lat:32.0100,lon:77.3152},
  tosh:{name:'Tosh',admin:'Himachal Pradesh',lat:31.9950,lon:77.3600},
  bir:{name:'Bir',admin:'Himachal Pradesh',lat:32.0419,lon:76.7204},
  kufri:{name:'Kufri',admin:'Himachal Pradesh',lat:31.0980,lon:77.2670},
  dharamshala:{name:'Dharamshala',admin:'Himachal Pradesh',lat:32.2190,lon:76.3234},
  mcleodganj:{name:'McLeod Ganj',admin:'Himachal Pradesh',lat:32.2396,lon:76.3200},
  spiti:{name:'Spiti Valley',admin:'Himachal Pradesh',lat:32.2264,lon:78.0716},
  kaza:{name:'Kaza',admin:'Himachal Pradesh',lat:32.2264,lon:78.0716},
  leh:{name:'Leh',admin:'Ladakh',lat:34.1526,lon:77.5771},
  rishikesh:{name:'Rishikesh',admin:'Uttarakhand',lat:30.0869,lon:78.2676},
  haridwar:{name:'Haridwar',admin:'Uttarakhand',lat:29.9457,lon:78.1642},
  nainital:{name:'Nainital',admin:'Uttarakhand',lat:29.3803,lon:79.4636},
  mussoorie:{name:'Mussoorie',admin:'Uttarakhand',lat:30.4598,lon:78.0644},
  almora:{name:'Almora',admin:'Uttarakhand',lat:29.5971,lon:79.6591},
  munsiyari:{name:'Munsiyari',admin:'Uttarakhand',lat:30.0672,lon:80.2386},
  auli:{name:'Auli',admin:'Uttarakhand',lat:30.5290,lon:79.5660},
  jaisalmer:{name:'Jaisalmer',admin:'Rajasthan',lat:26.9157,lon:70.9083},
  udaipur:{name:'Udaipur',admin:'Rajasthan',lat:24.5854,lon:73.7125},
  pushkar:{name:'Pushkar',admin:'Rajasthan',lat:26.4899,lon:74.5511},
  mountabu:{name:'Mount Abu',admin:'Rajasthan',lat:24.5926,lon:72.7156},
  gokarna:{name:'Gokarna',admin:'Karnataka',lat:14.5479,lon:74.3188},
  hampi:{name:'Hampi',admin:'Karnataka',lat:15.3350,lon:76.4600},
  coorg:{name:'Coorg (Madikeri)',admin:'Karnataka',lat:12.4244,lon:75.7382},
  munnar:{name:'Munnar',admin:'Kerala',lat:10.0889,lon:77.0595},
  alleppey:{name:'Alleppey',admin:'Kerala',lat:9.4981,lon:76.3388},
  wayanad:{name:'Wayanad',admin:'Kerala',lat:11.6854,lon:76.1320},
  ooty:{name:'Ooty',admin:'Tamil Nadu',lat:11.4064,lon:76.6932},
  kodaikanal:{name:'Kodaikanal',admin:'Tamil Nadu',lat:10.2381,lon:77.4892},
  pondicherry:{name:'Pondicherry',admin:'Puducherry',lat:11.9416,lon:79.8083},
  darjeeling:{name:'Darjeeling',admin:'West Bengal',lat:27.0360,lon:88.2627},
  gangtok:{name:'Gangtok',admin:'Sikkim',lat:27.3389,lon:88.6065},
  tawang:{name:'Tawang',admin:'Arunachal Pradesh',lat:27.5860,lon:91.8590},
  ziro:{name:'Ziro',admin:'Arunachal Pradesh',lat:27.5448,lon:93.8340},
  shillong:{name:'Shillong',admin:'Meghalaya',lat:25.5788,lon:91.8933},
  cherrapunji:{name:'Cherrapunji',admin:'Meghalaya',lat:25.3000,lon:91.7000},
  varanasi:{name:'Varanasi',admin:'Uttar Pradesh',lat:25.3176,lon:82.9739},
  khajuraho:{name:'Khajuraho',admin:'Madhya Pradesh',lat:24.8318,lon:79.9199},
  portblair:{name:'Port Blair',admin:'Andaman & Nicobar',lat:11.6234,lon:92.7265}
};
