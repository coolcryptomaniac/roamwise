// @ts-nocheck
/* signature-food.js — Signature Food: the one dish each destination is actually
   known for, with a generated (non-copyrighted) illustration (RW_FOOD, rwFoodFor,
   rwFoodHTML). Split out of js/misc/misc-features-3.js (an 8-feature grab-bag left
   over from Phase 6a modularization) as an SRP cleanup; verbatim move, zero logic
   changes. rwFoodFor calls rwMergeExtData() (in app.js) to merge in RW_FOOD_EXT
   (tusk-data.js) before lookup — pre-existing cross-file behavior, unchanged. */

/* ==================== SIGNATURE FOOD ====================
   The one dish a place is actually known for, with a generated illustration.
   Photographs of real food are copyrighted; Pollinations art is free to use and
   avoids lifting someone's restaurant photography. */
var RW_FOOD = {
  mumbai:     ['Vada pav',            'The city in a bun \u2014 spiced potato fritter, garlic chutney, eaten standing up.',        'vada pav indian street food'],
  almora:     ['Bal mithai',          'Roasted khoya fudge under white sugar pearls. Also: bhatt ki churkani and dubke.',      'bal mithai kumaoni sweet'],
  nagpur:     ['Oranges',             'The city is named for them \u2014 and saoji mutton will take the roof off your mouth.',     'nagpur oranges'],
  prayagraj:  ['Guava',               'Allahabadi amrood is a protected variety, sweetest in winter.',                          'fresh guava fruit'],
  ahmedabad:  ['Fafda-jalebi',        'Saturday morning ritual \u2014 crisp gram-flour strips with hot jalebi and papaya chutney.','fafda jalebi gujarati'],
  kolkata:    ['Rosogolla',           'The disputed one. Also kathi rolls, and phuchka the city insists is superior.',           'rosogolla bengali sweet'],
  lucknow:    ['Galouti kebab',       'Minced so fine it dissolves \u2014 made for a Nawab who had lost his teeth.',                'galouti kebab lucknow'],
  delhi:      ['Chole bhature',       'And sohan halwa in the old city, and daulat ki chaat only in winter mornings.',           'chole bhature indian'],
  jaipur:     ['Dal baati churma',    'Baked wheat balls drowned in ghee. Order once, share between two.',                       'dal baati churma rajasthani'],
  varanasi:   ['Kachori sabzi',       'Breakfast at 6am on a ghat, followed by a clay cup of malaiyo in winter.',                'kachori sabzi banarasi'],
  amritsar:   ['Amritsari kulcha',    'Stuffed, blistered, drenched in butter, with chole and a raw onion.',                     'amritsari kulcha punjabi'],
  hyderabad:  ['Biryani',             'The dum version, with mirchi ka salan. The argument with Lucknow is eternal.',            'hyderabadi biryani'],
  chennai:    ['Filter coffee',       'Poured between tumbler and davara until it froths. Also idli at a mess, not a hotel.',    'south indian filter coffee'],
  goa:        ['Fish thali',          'Rawa-fried mackerel, kokum curry, rice \u2014 \u20b9150 at any local canteen.',                   'goan fish thali'],
  kochi:      ['Karimeen pollichathu','Pearl spot fish grilled in a banana leaf.',                                              'karimeen pollichathu kerala'],
  indore:     ['Poha-jalebi',         'Breakfast, and Sarafa bazaar opens at midnight for the rest.',                            'poha jalebi indore'],
  jodhpur:    ['Mirchi vada',         'A whole chilli, stuffed, battered and fried. Braver than it looks.',                      'mirchi vada rajasthani'],
  udaipur:    ['Laal maas',           'Fiery mutton with mathania chillies \u2014 order a plain roti to survive it.',               'laal maas rajasthani'],
  darjeeling: ['Momos & thukpa',      'Steamed, then a bowl of noodle broth in the cold. And the tea, obviously.',              'momos thukpa himalayan'],
  shillong:   ['Jadoh',               'Red rice cooked with pork \u2014 Khasi comfort food.',                                       'jadoh khasi meghalaya'],
  manali:     ['Siddu',               'Steamed stuffed bread with ghee \u2014 mountain food built for cold.',                        'siddu himachali bread'],
  rishikesh:  ['Aloo puri',           'No meat, no alcohol in the holy zone \u2014 but the German Bakery cakes are legendary.',     'aloo puri indian'],
  bengaluru:  ['Masala dosa',         'The Bangalore version at a darshini, standing, with a second filter coffee.',            'masala dosa karnataka'],
  pune:       ['Misal pav',           'Sprout curry under farsan, heat that builds. Breakfast of the city.',                     'misal pav maharashtrian'],
  bhopal:     ['Poha & seekh',        'Indori-style poha in the morning, kebabs by the old city at night.',                      'poha indian breakfast'],
  patna:      ['Litti chokha',        'Roasted sattu-stuffed dough with mashed vegetables and mustard oil.',                     'litti chokha bihari'],
  bangkok:    ['Pad kra pao',         'Holy basil stir-fry over rice with a fried egg \u2014 what Thais actually eat.',             'pad kra pao thai'],
  hanoi:      ['Pho bo',              'Breakfast broth, twenty years in the making at the good places.',                         'pho bo vietnamese'],
  kyoto:      ['Yudofu',              'Simmered tofu, deceptively simple, temple food raised to an art.',                        'yudofu kyoto tofu'],
  bali:       ['Babi guling',         'Suckling pig \u2014 the ceremonial dish, best at a warung before noon.',                     'babi guling balinese']
};
function rwFoodFor(place){
  try{ rwMergeExtData(); }catch(e){ /* best-effort, ignore */ }
  var k=String(place||'').toLowerCase().trim().replace(/\s+/g,'');
  return RW_FOOD[k] || RW_FOOD[String(place||'').toLowerCase().trim()] || null;
}
function rwFoodHTML(place){
  var f=rwFoodFor(place); if(!f) return '';
  var img = rwArtURL(f[2]+', food illustration, warm, appetising, flat colour', 512, 320);
  return '<div style="border-radius:14px;overflow:hidden;border:1px solid var(--b2,#2A2A36);position:relative;min-height:130px;'
    +'background-image:url('+img+');background-size:cover;background-position:center">'
    +'<div style="background:linear-gradient(0deg,rgba(6,6,10,.92) 22%,rgba(6,6,10,.25));padding:38px 14px 13px">'
    +'<div style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold,#E8BA6C);font-weight:800">Eat this here</div>'
    +'<div style="font-size:17px;font-weight:900;margin-top:2px;text-shadow:0 2px 10px rgba(0,0,0,.9)">'+esc2(f[0])+'</div>'
    +'<div style="font-size:11.5px;color:rgba(255,255,255,.86);line-height:1.55;margin-top:3px;text-shadow:0 1px 8px rgba(0,0,0,.9)">'+esc2(f[1])+'</div>'
    +'</div></div>';
}
