/* Misc travel features (3/3) — moved verbatim from app.js (Phase 6a).
   Covers Sound of Place, Signature Food, Destination Vibe, the Trek Vault
   (grades/costs/operators comparison), Athlete Mode (medical + fitness
   POI lookups, training-on-the-road guidance), Live Location ("near me"
   geolocation answer), Booking Platform Comparison, and Local Ecosystem
   (homestays/artists/researchers worth knowing about). */

/* ==================== SOUND OF PLACE ====================
   The genuinely defensible half of the "media layer" idea: no travel planner
   ships localised sound. This maps destinations to their actual regional music
   traditions and living artists, with a Tusk-narrated audio intro using the
   device's own TTS (free, offline-capable, no licensing exposure).

   DELIBERATELY NOT: hosting or streaming copyrighted tracks. We link out to
   Spotify/JioSaavn/YouTube searches so playback happens on a licensed platform
   where the artist gets paid. Hosting audio ourselves would be infringement,
   and "curating a playlist" that streams from our servers is the same thing
   with a nicer name. */
var RW_SOUND = {
  goa:        {genre:'Konkani & Goan trance', why:'Portuguese-era mando meets the 90s Goa trance the state exported worldwide.',
               artists:['Remo Fernandes','Lorna Cordeiro','Goa Trance classics'], mood:'sunset beach'},
  rajasthan:  {genre:'Manganiyar & Langa folk', why:'Hereditary desert musician communities \u2014 khartal, kamaicha, voices built for open sky.',
               artists:['Mame Khan','Manganiyar Seduction','Anwar Khan Manganiyar'], mood:'desert night'},
  jaipur:     {genre:'Rajasthani folk', why:'Ghoomar rhythms and courtly compositions from the old city.',
               artists:['Mame Khan','Rajasthani folk ensembles'], mood:'fort courtyard'},
  jaisalmer:  {genre:'Manganiyar desert folk', why:'The purest form of it \u2014 sung in dunes it was written for.',
               artists:['Manganiyar','Anwar Khan'], mood:'dune sunset'},
  varanasi:   {genre:'Benares gharana \u00b7 Hindustani classical', why:'One of the great lineages of Indian classical music, still performed at the ghats.',
               artists:['Ravi Shankar','Girija Devi','Bismillah Khan'], mood:'dawn on the river'},
  kolkata:    {genre:'Rabindra Sangeet & Bengali folk', why:'Tagore wrote over 2,000 songs. The city still sings them.',
               artists:['Rabindra Sangeet','Baul folk','Kishore Kumar'], mood:'monsoon afternoon'},
  kerala:     {genre:'Sopana & Carnatic', why:'Temple-step singing and the percussion of chenda melam.',
               artists:['Sopana Sangeetham','Carnatic vocal'], mood:'backwater morning'},
  chennai:    {genre:'Carnatic classical', why:'The December music season is one of the largest classical festivals on earth.',
               artists:['M.S. Subbulakshmi','Carnatic vocal'], mood:'margazhi morning'},
  punjab:     {genre:'Punjabi folk & bhangra', why:'Dhol, tumbi, and a rhythm built for harvest.',
               artists:['Gurdas Maan','Punjabi folk'], mood:'harvest evening'},
  amritsar:   {genre:'Gurbani kirtan & Punjabi folk', why:'Continuous kirtan at the Golden Temple, and the folk outside it.',
               artists:['Gurbani kirtan','Punjabi folk'], mood:'temple dawn'},
  almora:     {genre:'Kumaoni folk', why:'Jhoda, chhapeli and hurka rhythms \u2014 hill music built around a single drum.',
               artists:['Kumaoni folk','Gopal Babu Goswami'], mood:'pine ridge morning'},
  manali:     {genre:'Himachali & Nati folk', why:'Nati, the circle dance, holds a Guinness record for the largest folk dance performed.',
               artists:['Himachali Nati','Pahari folk'], mood:'valley evening'},
  darjeeling: {genre:'Nepali & Gorkha folk', why:'Madal-driven hill songs, and a strong Nepali indie scene.',
               artists:['Nepali folk','Bipul Chettri'], mood:'misty morning'},
  shillong:   {genre:'Khasi folk & rock', why:'India\u2019s rock capital \u2014 an unusual overlap of Khasi tradition and guitar culture.',
               artists:['Soulmate','Khasi folk','Lou Majaw'], mood:'rainy evening'},
  mumbai:     {genre:'Bollywood & Marathi lavani', why:'The industry that soundtracks the country, and the folk form it keeps borrowing from.',
               artists:['Bollywood classics','Lavani','Indian Ocean'], mood:'monsoon city night'},
  bali:       {genre:'Gamelan', why:'Bronze percussion orchestras \u2014 you will hear rehearsals from village compounds at dusk.',
               artists:['Balinese gamelan','Gamelan Semar Pegulingan'], mood:'temple dusk'},
  kyoto:      {genre:'Shakuhachi & koto', why:'Bamboo flute and thirteen-string zither \u2014 music written around silence.',
               artists:['Shakuhachi','Koto traditional'], mood:'temple garden'},
  lisbon:     {genre:'Fado', why:'Saudade set to guitar in the Alfama\u2019s small rooms.',
               artists:['Am\u00e1lia Rodrigues','Mariza'], mood:'old quarter night'},
  marrakech:  {genre:'Gnawa', why:'Trance music with sub-Saharan roots \u2014 guembri, qraqeb, all night.',
               artists:['Gnawa','Maalem Mahmoud Guinia'], mood:'medina night'},
  havana:     {genre:'Son & rumba', why:'The root of everything later called salsa.',
               artists:['Buena Vista Social Club','Cuban son'], mood:'street corner evening'}
};
function rwSoundFor(place){
  var k=String(place||'').toLowerCase().trim();
  if(RW_SOUND[k]) return RW_SOUND[k];
  /* fall back to the state/region a city sits in */
  var REGION={jodhpur:'rajasthan', udaipur:'rajasthan', pushkar:'rajasthan',
              kochi:'kerala', munnar:'kerala', alleppey:'kerala',
              nainital:'almora', mussoorie:'almora', ranikhet:'almora',
              kasol:'manali', shimla:'manali', dharamshala:'manali',
              ludhiana:'punjab', chandigarh:'punjab', gangtok:'darjeeling'};
  var r=REGION[k];
  return r? RW_SOUND[r] : null;
}
function rwSoundHTML(place){
  var snd=rwSoundFor(place); if(!snd) return '';
  var q = encodeURIComponent(snd.artists[0]+' '+snd.genre);
  var id='snd_'+Math.random().toString(36).slice(2,7);
  window['_'+id] = 'Yeh hai '+place+' ki awaaz. '+snd.genre+'. '+snd.why;
  return '<div style="background:linear-gradient(135deg,rgba(167,139,250,.12),rgba(124,58,237,.05));border:1px solid rgba(167,139,250,.3);border-radius:13px;padding:12px 14px">'
    +'<div style="display:flex;align-items:center;gap:10px">'
    +'<button onclick="tuskSpeak(window._'+id+')" style="flex:0 0 auto;width:38px;height:38px;border-radius:50%;border:none;'
    +'background:linear-gradient(135deg,#A78BFA,#7C3AED);color:#fff;font-size:15px;cursor:pointer">\u25b6</button>'
    +'<div style="flex:1;min-width:0">'
    +'<div style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#A78BFA;font-weight:800">The sound of '+esc2(place)+'</div>'
    +'<div style="font-size:13.5px;font-weight:800;margin-top:1px">'+esc2(snd.genre)+'</div></div></div>'
    +'<div style="font-size:11.5px;color:var(--t2);line-height:1.55;margin-top:7px">'+esc2(snd.why)+'</div>'
    +'<div class="tk-chips" style="margin-top:8px">'
    + snd.artists.slice(0,3).map(function(a){
        return '<a class="tk-chip" style="font-size:11px;padding:5px 10px;text-decoration:none" target="_blank" rel="noopener" '
          +'href="https://open.spotify.com/search/'+encodeURIComponent(a)+'">\ud83c\udfb5 '+esc2(a)+'</a>';
      }).join('')
    +'<a class="tk-chip" style="font-size:11px;padding:5px 10px;text-decoration:none" target="_blank" rel="noopener" '
    +'href="https://www.jiosaavn.com/search/'+q+'">JioSaavn</a>'
    +'</div>'
    +'<div style="font-size:10px;color:var(--t3);margin-top:7px">Plays on Spotify or JioSaavn so the artists get paid \u2014 we don\u2019t host audio.</div>'
    +'</div>';
}

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
  try{ rwMergeExtData(); }catch(e){}
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
/* ==================== DESTINATION VIBE ====================
   Each place gets its own character in the card header — colours, a one-line
   read of what it actually feels like, and what it suits. Curated rather than
   generated: a wrong vibe is worse than none. */
var RW_VIBES = {
  goa:        {t:'Dreamy · Party · Coastal', g:['#F97316','#7C2D12'], line:'Two Goas in one state — the north is a party that never quite ends, the south is a hammock and a book.', suits:'First-timers, groups, anyone who wants both options open'},
  rishikesh:  {t:'Calm · Spiritual · Scenic', g:['#0EA5E9','#0C4A6E'], line:'Bells at dawn, rapids by noon. The Ganga sets the pace and nobody argues with it.', suits:'Solo travellers, yoga, quiet resets with an adrenaline option'},
  manali:     {t:'Alpine · Backpacker · Crisp', g:['#38BDF8','#1E3A5F'], line:'Apple orchards below, snow above, and Maggi at every altitude.', suits:'Mountain first-timers, road trips, snow'},
  leh:        {t:'Stark · High · Otherworldly', g:['#A78BFA','#312E81'], line:'Thin air, enormous silence, and light that makes everything look unreal.', suits:'Riders, photographers, people who like being small'},
  mumbai:     {t:'Bustling · Nightlife · Relentless', g:['#EC4899','#4C1D95'], line:'The city that genuinely does not sleep — and will not wait for you either.', suits:'Nightlife, food, art, anyone who likes momentum'},
  delhi:      {t:'Layered · Historic · Loud', g:['#F59E0B','#7C2D12'], line:'Seven cities stacked on each other, and all of them still open for business.', suits:'History, food, and using it as a hub for the north'},
  jaipur:     {t:'Regal · Colourful · Grand', g:['#F43F5E','#831843'], line:'Pink sandstone, rooftop sunsets, and forts that were built to be seen from far away.', suits:'First trips to Rajasthan, families, photographers'},
  udaipur:    {t:'Romantic · Serene · Filmy', g:['#60A5FA','#1E3A8A'], line:'Lakes, palaces and the softest evening light in Rajasthan.', suits:'Couples, slow trips, anyone tired of noise'},
  varanasi:   {t:'Ancient · Intense · Sacred', g:['#FB923C','#7C2D12'], line:'The oldest living city on earth, and it does not soften itself for visitors.', suits:'Travellers who want the real thing over the comfortable one'},
  kerala:     {t:'Green · Slow · Restorative', g:['#22C55E','#14532D'], line:'Backwaters, tea hills and a pace that lowers your heart rate within a day.', suits:'Families, monsoon travel, recovering from a hard year'},
  darjeeling: {t:'Misty · Colonial · Tea', g:['#34D399','#064E3B'], line:'Cloud in the streets, Kanchenjunga on a clear morning, and tea that ruins you for other tea.', suits:'Slow mornings, trains, tea people'},
  jaisalmer:  {t:'Golden · Desert · Cinematic', g:['#FBBF24','#78350F'], line:'A living fort in the middle of the Thar, gold at sunset, freezing by midnight.', suits:'Desert camps, forts, dramatic photographs'},
  bali:       {t:'Lush · Spiritual · Social', g:['#10B981','#064E3B'], line:'Rice terraces and temples in the middle, surf and crowds at the edges.', suits:'Long stays, remote work, surf'},
  bangkok:    {t:'Electric · Street · 24-hour', g:['#F472B6','#581C87'], line:'The best street food on earth, moving at the speed of a scooter.', suits:'Food, nightlife, and using it as a SEA hub'},
  kyoto:      {t:'Refined · Seasonal · Still', g:['#F87171','#7F1D1D'], line:'Temples, wooden lanes and an almost unfair sense of order.', suits:'Slow walkers, autumn and cherry season, culture'}
};
function rwVibe(place){
  var k=String(place||'').toLowerCase().trim();
  return RW_VIBES[k] || null;
}
function rwVibeHTML(place){
  var v=rwVibe(place); if(!v) return '';
  return '<div style="background:linear-gradient(135deg,'+v.g[0]+'22,'+v.g[1]+'11);border:1px solid '+v.g[0]+'44;border-radius:12px;padding:11px 13px">'
    +'<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:'+v.g[0]+';font-weight:800">'+esc2(v.t)+'</div>'
    +'<div style="font-size:12.5px;line-height:1.6;color:var(--t1);margin-top:5px">'+esc2(v.line)+'</div>'
    +'<div style="font-size:11px;color:var(--t3);margin-top:5px">Suits: '+esc2(v.suits)+'</div></div>';
}

/* ==================== TREKKING ====================
   Grades, seasons, and an honest cost comparison between organised operators
   and doing it yourself. Operator prices are indicative published bands — they
   change per departure, so the app links out rather than quoting a live price
   it cannot guarantee. */
var RW_TREK_GRADE = {
  easy:      {icon:'\ud83d\udfe2', label:'Easy',      who:'First trek. No prior fitness needed beyond walking comfortably for a few hours.'},
  moderate:  {icon:'\ud83d\udfe1', label:'Moderate',  who:'You walk or run occasionally. Long days, some steep sections.'},
  difficult: {icon:'\ud83d\udfe0', label:'Difficult', who:'Regular training needed. Altitude, exposure, or consecutive long days.'},
  hard:      {icon:'\ud83d\udd34', label:'Hard',      who:'Serious fitness and prior high-altitude experience. Technical sections.'},
  extreme:   {icon:'\u26ab',      label:'Very hard', who:'Expedition grade. Mountaineering skills, permits, and a real risk profile.'}
};
var RW_TREKS = [
  {n:'Triund',            r:'Himachal',    g:'easy',      d:2,  alt:2828, best:'Mar–Jun, Sep–Nov', diy:1500,  org:3500,  note:'The best first trek in India. Doable as an overnight.'},
  {n:'Kedarkantha',       r:'Uttarakhand', g:'easy',      d:6,  alt:3810, best:'Dec–Apr',          diy:6000,  org:9500,  note:'The classic winter snow trek — busy in peak weeks.'},
  {n:'Valley of Flowers', r:'Uttarakhand', g:'moderate',  d:6,  alt:3658, best:'Jul–Sep',          diy:8000,  org:13000, note:'Only worth doing in monsoon, which is the point.'},
  {n:'Hampta Pass',       r:'Himachal',    g:'moderate',  d:5,  alt:4270, best:'Jun–Sep',          diy:8000,  org:12500, note:'Green valley to barren Spiti in one crossing.'},
  {n:'Sandakphu',         r:'West Bengal', g:'moderate',  d:6,  alt:3636, best:'Oct–Dec, Mar–May', diy:9000,  org:14000, note:'Four of the five highest peaks visible on a clear day.'},
  {n:'Roopkund',          r:'Uttarakhand', g:'difficult', d:8,  alt:5029, best:'May–Jun, Sep–Oct', diy:12000, org:17500, note:'Check current permit status — access has been restricted at times.'},
  {n:'Rupin Pass',        r:'Himachal',    g:'difficult', d:8,  alt:4650, best:'May–Jun, Sep–Oct', diy:12000, org:18000, note:'Changes landscape almost every day.'},
  {n:'Goechala',          r:'Sikkim',      g:'difficult', d:10, alt:4940, best:'Apr–May, Oct–Nov', diy:16000, org:24000, note:'The Kanchenjunga viewpoint trek. Permits required.'},
  {n:'Stok Kangri',       r:'Ladakh',      g:'hard',      d:9,  alt:6153, best:'Jul–Sep',          diy:25000, org:38000, note:'Closed for conservation in recent years — verify before planning.'},
  {n:'Everest Base Camp', r:'Nepal',       g:'hard',      d:14, alt:5364, best:'Mar–May, Sep–Nov', diy:75000, org:120000,note:'Permits, TIMS card and acclimatisation days are non-negotiable.'},
  {n:'Annapurna Circuit', r:'Nepal',       g:'difficult', d:14, alt:5416, best:'Mar–May, Oct–Nov', diy:60000, org:95000, note:'Teahouse route — genuinely DIY-friendly.'},
  {n:'Kilimanjaro',       r:'Tanzania',    g:'hard',      d:8,  alt:5895, best:'Jan–Mar, Jun–Oct', diy:0,     org:180000,note:'Guides are legally mandatory — DIY is not an option here.'}
];
var RW_TREK_OPS = [
  {n:'Indiahikes',        best:'Safety systems, documented trails, solo-friendly',  watch:'Books out months ahead on popular treks', url:'https://indiahikes.com/'},
  {n:'Trek The Himalayas',best:'Wide Uttarakhand/Himachal calendar, good value',    watch:'Group sizes can be large in peak season', url:'https://trekthehimalayas.com/'},
  {n:'Bikat Adventures',  best:'Harder grades and expeditions, strong on skills',   watch:'Priced above entry-level operators',      url:'https://www.bikatadventures.com/'},
  {n:'Himalayan High',    best:'Smaller batches, offbeat routes',                   watch:'Fewer fixed departures',                  url:'https://himalayanhigh.in/'},
  {n:'India Trekking',    best:'Budget end of the market',                          watch:'Verify inclusions carefully before booking', url:'https://www.indiatrekking.com/'}
];
function rwTrekListHTML(filter){
  var list = RW_TREKS.filter(function(t){ return !filter || t.g===filter || t.r.toLowerCase()===String(filter).toLowerCase(); });
  if(!list.length) list = RW_TREKS;
  var done = rwTrekDone();
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#065F46,#0A0A0C)">'
    +'<div class="tk-place">\u26f0\ufe0f Trek vault</div>'
    +'<div class="tk-meta">'+list.length+' routes \u00b7 graded, costed, and compared against doing it yourself</div></div>'
    +'<div class="tk-sec"><div class="tk-lab">Filter by grade</div><div class="tk-chips">'
    + Object.keys(RW_TREK_GRADE).map(function(g){
        return '<button class="tk-chip'+(filter===g?' gold':'')+'" onclick="cpFollow(\''+RW_TREK_GRADE[g].label.toLowerCase()+' treks\')">'+RW_TREK_GRADE[g].icon+' '+RW_TREK_GRADE[g].label+'</button>';
      }).join('')
    +'</div></div>'
    +'<div class="tk-sec">'
    + list.slice(0,8).map(function(t){
        var G=RW_TREK_GRADE[t.g], saved=t.diy? Math.round(((t.org-t.diy)/t.org)*100):0;
        var isDone = done.indexOf(t.n)>-1;
        return '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
          +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
          +'<b style="font-size:13.5px">'+G.icon+' '+esc2(t.n)+(isDone?' \u2705':'')+'</b>'
          +'<span style="font-size:10.5px;color:var(--t3)">'+t.d+'d \u00b7 '+t.alt+'m</span></div>'
          +'<div style="font-size:11.5px;color:var(--t2);margin-top:3px;line-height:1.5">'+esc2(t.r)+' \u00b7 best '+esc2(t.best)+'</div>'
          +'<div style="font-size:11.5px;color:var(--t2);margin-top:2px;line-height:1.5">'+esc2(t.note)+'</div>'
          +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;font-size:11px">'
          + (t.diy? '<span style="color:#4ADE80">DIY \u2248\u20b9'+t.diy.toLocaleString('en-IN')+'</span>':'<span style="color:var(--t3)">DIY not permitted</span>')
          +'<span style="color:var(--t3)">Organised \u2248\u20b9'+t.org.toLocaleString('en-IN')+'</span>'
          + (saved>0? '<span style="color:var(--gold,#E8BA6C)">save '+saved+'%</span>':'')
          +'</div>'
          +'<div class="tk-chips" style="margin-top:7px">'
          +'<button class="tk-chip" onclick="rwTrekLog(\''+t.n.replace(/'/g,'')+'\')">'+(isDone?'\u2713 Logged':'+ I did this')+'</button>'
          +'<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(t.n+' trek '+t.r)+'">\ud83d\uddfa\ufe0f Trail</a>'
          +'<button class="tk-chip gold" onclick="rwTrekOps(\''+t.n.replace(/'/g,'')+'\','+t.org+')">Compare operators</button>'
          +'</div></div>';
      }).join('')
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">DIY vs organised \u2014 the honest version</div>'
    +'<div class="tk-bul"><b>Organised costs 40\u201360% more</b> and buys you: permits handled, a guide who knows the weather signs, evacuation cover, and food you do not carry.</div>'
    +'<div class="tk-bul"><b>DIY works well</b> on teahouse routes (Annapurna, Sandakphu, Triund) where you can walk village to village.</div>'
    +'<div class="tk-bul"><b>Do not DIY</b> above 4,500m without prior altitude experience, on glacier routes, or where guides are legally required.</div>'
    +'<div class="tk-bul">Whatever you choose, check the CURRENT permit status \u2014 Stok Kangri and Roopkund have both been closed at times for conservation.</div>'
    +'</div></div>';
}
function rwTrekOps(name, orgPrice){
  var body = RW_TREK_OPS.map(function(o){
    return '<div style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
      +'<b style="font-size:13px">'+esc2(o.n)+'</b>'
      +'<a class="tk-chip" style="font-size:10.5px;padding:4px 9px;text-decoration:none" target="_blank" rel="noopener" href="'+o.url+'">Check dates \u2197</a></div>'
      +'<div style="font-size:11.5px;color:var(--t2);margin-top:3px">\u2714\ufe0f '+esc2(o.best)+'</div>'
      +'<div style="font-size:11.5px;color:#E8BA6C;margin-top:2px">\u26a0\ufe0f '+esc2(o.watch)+'</div></div>';
  }).join('');
  var ov=el('trekOpsOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='trekOpsOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="sheet"><div class="sheet-head"><b>\u26f0\ufe0f Operators</b><button class="x" onclick="rwOverlayClose(\'trekOpsOverlay\')">\u2715</button></div>'
      +'<div id="trekOpsBody" style="overflow-y:auto;flex:1 1 auto;min-height:0;padding:4px 2px 16px"></div></div>';
    document.body.appendChild(ov);
  }
  el('trekOpsBody').innerHTML =
     '<div style="font-weight:800;font-size:15px;margin-bottom:4px">'+esc2(name)+'</div>'
    +'<div style="font-size:11.5px;color:var(--t3);margin-bottom:10px">Typical organised price \u2248\u20b9'+Number(orgPrice).toLocaleString('en-IN')+'. Actual fares vary by departure and inclusions.</div>'
    + body
    +'<div style="background:var(--bg3,#1A1A20);border-radius:12px;padding:11px 13px;margin-top:12px;font-size:11.5px;line-height:1.6;color:var(--t2)">'
    +'<b>Before you pay anyone, check:</b> what is included (transport from where? equipment? insurance?), the group size cap, '
    +'the guide-to-trekker ratio, and their cancellation terms for weather. A cheap trek that excludes transport and rents you a jacket is not cheap.'
    +'</div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-top:10px">RoamWise does not sell treks or take a booking fee \u2014 these links go directly to the operators so you pay them, not a middleman.</div>';
  rwOverlayOpen('trekOpsOverlay');
}
function rwTrekDone(){ try{ return JSON.parse(lsGet('rw_treks')||'[]'); }catch(e){ return []; } }
function rwTrekLog(name){
  var d=rwTrekDone(), i=d.indexOf(name);
  if(i>-1) d.splice(i,1); else d.push(name);
  lsSet('rw_treks', JSON.stringify(d));
  showToast(i>-1? 'Removed' : '\u26f0\ufe0f Logged \u2014 '+d.length+' trek'+(d.length>1?'s':'')+' done');
  try{ rwXpAdd(25, 'trek logged'); }catch(e){}
}

/* ==================== ATHLETE MODE ====================
   Travel wrecks training. This finds the practical things — a gym, a place to
   run, protein-heavy food, drinking water, EV charging — using OSM tags that
   genuinely exist rather than inventing a database we cannot maintain. */
var RW_MED_TAGS = [
  ['amenity','pharmacy','\ud83d\udc8a','Pharmacies'],
  ['amenity','doctors','\ud83e\ude7a','Clinics'],
  ['amenity','hospital','\ud83c\udfe5','Hospitals'],
  ['amenity','clinic','\ud83e\ude7a','Clinics'],
  ['amenity','veterinary','\ud83d\udc36','Vets']
];
async function rwMedNear(lat, lon, radius){
  radius = radius || 5000;
  var key='rw_med_'+lat.toFixed(2)+'_'+lon.toFixed(2);
  try{ var c=JSON.parse(lsGet(key)||'null'); if(c && Date.now()-c.at < 30*864e5) return c.items; }catch(e){}
  if(!navigator.onLine) return [];
  var q='[out:json][timeout:12];('
    + RW_MED_TAGS.map(function(t){ return 'node["'+t[0]+'"="'+t[1]+'"](around:'+radius+','+lat+','+lon+');'; }).join('')
    + ');out body 40;';
  try{
    var r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)})
      .then(function(x){return x.json();});
    var items=(r.elements||[]).map(function(e){
      var t=e.tags||{}, hit=RW_MED_TAGS.filter(function(x){ return t[x[0]]===x[1]; })[0];
      if(!hit) return null;
      return {name:t.name||hit[3].replace(/s$/,''), icon:hit[2], group:hit[3], lat:e.lat, lon:e.lon,
              open:t.opening_hours||'', phone:t['phone']||t['contact:phone']||''};
    }).filter(Boolean);
    lsSet(key, JSON.stringify({at:Date.now(), items:items}));
    return items;
  }catch(e){ return []; }
}
function rwMedHTML(place, items){
  var groups={};
  (items||[]).forEach(function(i){ (groups[i.group]=groups[i.group]||[]).push(i); });
  var body=Object.keys(groups).map(function(g){
    return '<div class="tk-lab">'+esc2(g)+'</div><div class="tk-chips">'
      + groups[g].slice(0,8).map(function(i){
          return '<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+i.lat+','+i.lon+'">'+i.icon+' '+esc2(i.name)+(i.open?' \u00b7 '+esc2(i.open.slice(0,18)):'')+'</a>';
        }).join('') + '</div>';
  }).join('');
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#0F766E,#0A0A0C)">'
    +'<div class="tk-place">\ud83d\udc8a Medical near '+esc2(place||'you')+'</div>'
    +'<div class="tk-meta">Pharmacies, clinics and hospitals mapped nearby</div></div>'
    + (body? '<div class="tk-sec">'+body+'</div>'
           : '<div class="tk-sec"><div class="tk-bul">Nothing mapped nearby. Ask your hotel \u2014 they always know the closest chemist.</div></div>')
    +'<div class="tk-sec"><div class="tk-lab">Worth knowing in India</div>'
    +'<div class="tk-bul">\ud83d\udcde Ambulance: <b>108</b> \u00b7 national emergency: <b>112</b></div>'
    +'<div class="tk-bul">Most pharmacies dispense without a prescription for common medicines, but carry your own prescription for anything ongoing.</div>'
    +'<div class="tk-bul">Generic equivalents are far cheaper and equally regulated \u2014 ask for the generic by name.</div>'
    +'<div class="tk-bul">Jan Aushadhi stores sell government generics at a fraction of branded prices.</div>'
    +'<div class="tk-bul">For anything serious, a private hospital in a bigger town beats a small-town clinic \u2014 the extra hour of travel is usually worth it.</div>'
    +'</div>'
    +'<div class="tk-foot">Places: \u00a9 OpenStreetMap contributors \u00b7 Not medical advice</div></div>';
}
var RW_FIT_TAGS = [
  ['leisure','fitness_centre','\ud83c\udfcb\ufe0f','Gyms'],
  ['leisure','sports_centre','\ud83c\udfdf\ufe0f','Sports centres'],
  ['leisure','pitch','\u26bd','Grounds & courts'],
  ['leisure','track','\ud83c\udfc3','Running tracks'],
  ['leisure','swimming_pool','\ud83c\udfca','Pools'],
  ['amenity','drinking_water','\ud83d\udeb0','Drinking water'],
  ['amenity','charging_station','\ud83d\udd0c','EV charging']
];
async function rwFitNear(lat, lon, radius){
  radius = radius || 6000;
  var key='rw_fit_'+lat.toFixed(2)+'_'+lon.toFixed(2);
  try{ var c=JSON.parse(lsGet(key)||'null'); if(c && Date.now()-c.at < 30*864e5) return c.items; }catch(e){}
  if(!navigator.onLine) return [];
  var q='[out:json][timeout:12];('
    + RW_FIT_TAGS.map(function(t){ return 'node["'+t[0]+'"="'+t[1]+'"](around:'+radius+','+lat+','+lon+');'; }).join('')
    + ');out body 50;';
  try{
    var r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)})
      .then(function(x){return x.json();});
    var items=(r.elements||[]).map(function(e){
      var t=e.tags||{}, hit=RW_FIT_TAGS.filter(function(x){ return t[x[0]]===x[1]; })[0];
      if(!hit) return null;
      return {name:t.name||hit[3].replace(/s$/,''), icon:hit[2], group:hit[3], lat:e.lat, lon:e.lon};
    }).filter(Boolean);
    lsSet(key, JSON.stringify({at:Date.now(), items:items}));
    return items;
  }catch(e){ return []; }
}
function rwAthleteHTML(place, items){
  var groups={};
  (items||[]).forEach(function(i){ (groups[i.group]=groups[i.group]||[]).push(i); });
  var body = Object.keys(groups).map(function(g){
    return '<div class="tk-lab">'+esc2(g)+'</div><div class="tk-chips">'
      + groups[g].slice(0,8).map(function(i){
          return '<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+i.lat+','+i.lon+'">'+i.icon+' '+esc2(i.name)+'</a>';
        }).join('') + '</div>';
  }).join('');
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#7F1D1D,#0A0A0C)">'
    +'<div class="tk-place">\ud83d\udcaa Training in '+esc2(place||'this place')+'</div>'
    +'<div class="tk-meta">Gyms, grounds, water and charging \u2014 mapped nearby</div></div>'
    + (body? '<div class="tk-sec">'+body+'</div>'
           : '<div class="tk-sec"><div class="tk-bul">Nothing mapped nearby in OpenStreetMap. Hotel gyms often sell day passes for \u20b9200\u2013500 \u2014 worth asking at reception.</div></div>')
    +'<div class="tk-sec"><div class="tk-lab">Eating for training on the road</div>'
    +'<div class="tk-bul">\ud83e\udd5a Anda bhurji / boiled eggs \u2014 the cheapest reliable protein in India, on almost every street corner</div>'
    +'<div class="tk-bul">\ud83e\uded8 Rajma, chana, dal \u2014 15\u201320g protein a bowl, in every dhaba</div>'
    +'<div class="tk-bul">\ud83e\uddc0 Paneer over potato when a thali offers the choice</div>'
    +'<div class="tk-bul">\ud83e\udd5b Curd or lassi with every meal \u2014 protein plus the gut adjustment travellers need</div>'
    +'<div class="tk-bul">\ud83c\udf57 Tandoori chicken beats curry: grilled, portioned, no oil-heavy gravy</div>'
    +'<div class="tk-bul">\ud83e\udd5c Roasted chana in your bag \u2014 the best travel snack nobody packs</div>'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">Training that survives a trip</div>'
    +'<div class="tk-bul">A hotel-room circuit needs no kit: push-ups, squats, lunges, plank. Twenty minutes holds your base for weeks.</div>'
    +'<div class="tk-bul">Run at sunrise \u2014 cooler, emptier, and you see the town waking up, which is the best sightseeing there is.</div>'
    +'<div class="tk-bul">At altitude drop intensity for the first 48 hours. Your usual pace at 3,000m is a different effort entirely.</div>'
    +'<div class="tk-bul">Carry a bottle and refill. Most Indian towns have public taps; buying 4 bottles a day is \u20b980 and a lot of plastic.</div>'
    +'</div>'
    +'<div class="tk-foot">Places: \u00a9 OpenStreetMap contributors</div></div>';
}

/* ==================== LIVE LOCATION ("near me") ====================
   Permission is asked only when the traveller actually asks for something
   nearby — never on load. Coordinates are used for the query and are not stored
   or transmitted anywhere except the OSM lookup that answers the question. */
function rwGeoNow(){
  return new Promise(function(res, rej){
    if(!navigator.geolocation) return rej(new Error('no geolocation'));
    navigator.geolocation.getCurrentPosition(
      function(p){ res({lat:p.coords.latitude, lon:p.coords.longitude, acc:p.coords.accuracy}); },
      function(e){ rej(e); },
      {enableHighAccuracy:true, timeout:9000, maximumAge:60000}
    );
  });
}
function rwIsNearMe(t){
  return /\b(near me|nearby|around me|close by|where am i|current location|my location|near here|around here)\b/i.test(String(t||''));
}
async function rwNearMeHTML(rawq){
  var pos;
  try{ pos = await rwGeoNow(); }
  catch(e){
    return '<div class="tk-card tk-mini"><div class="tk-sec">'
      +'<div style="font-size:13px;line-height:1.6">\ud83d\udccd I need location access to answer that.</div>'
      +'<div style="font-size:11.5px;color:var(--t2);margin-top:5px">Allow it in your browser or app settings, or just tell me the place name \u2014 works the same.</div>'
      +'</div></div>';
  }
  var place = await rwReverse(pos.lat, pos.lon);
  var spots = [];
  try{ spots = await osmAttractions(pos.lat, pos.lon, 6000); }catch(e){}
  var kind = rwActionIntent(rawq);
  var extra = kind ? rwActionHubHTML(kind, rwActionQuery(rawq, kind, place||''), place||'', pos.lat, pos.lon) : '';
  return '<div class="tk-card tk-mini"><div class="tk-sec">'
    +'<div style="font-weight:800;font-size:13.5px">\ud83d\udccd Around you'+(place? ' \u00b7 '+esc2(place):'')+'</div>'
    +'<div style="font-size:10.5px;color:var(--t3)">Accurate to about '+Math.round(pos.acc||0)+' m \u00b7 location used for this answer only, never stored</div>'
    + (spots.length
        ? '<div class="tk-chips" style="margin-top:9px">'
          + spots.slice(0,10).map(function(sp){
              return '<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+sp.lat+','+sp.lon+'">'+sp.icon+' '+esc2(sp.name)+'</a>';
            }).join('')
          + '</div>'
        : '<div class="tk-bul" style="margin-top:8px">Nothing mapped within 6 km \u2014 try a wider search or name the town.</div>')
    +'</div>'
    + (extra? '<div class="tk-sec">'+extra+'</div>':'')
    +'<div class="tk-sec"><div class="tk-chips">'
    +'<button class="tk-chip" onclick="cpFollow(\'order food near me\')">\ud83c\udf5c Food near me</button>'
    +'<button class="tk-chip" onclick="cpFollow(\'cab from my location\')">\ud83d\ude95 Ride</button>'
    +'<button class="tk-chip" onclick="cpFollow(\'hotel near me\')">\ud83c\udfe8 Stay</button>'
    +'</div></div>'
    +'<div class="tk-foot">Places: \u00a9 OpenStreetMap contributors</div></div>';
}
function rwReverse(lat, lon){
  if(!navigator.onLine) return Promise.resolve(null);
  return fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m&timezone=auto')
    .then(function(r){ return r.json(); })
    .then(function(){ return null; })
    .catch(function(){ return null; });
}

/* ==================== BOOKING PLATFORM COMPARISON ====================
   STATIC and dated on purpose. Live comparison would need each platform's
   pricing API — none of which are public — and the only alternative is
   scraping, which we've ruled out. What IS honest and useful is a structural
   comparison: what each is genuinely good at, and where each tends to sting.
   Every row is checkable from their own published terms. Prices move; the
   structural strengths don't, which is why this ages well. */
var RW_PLATFORMS = [
  {n:'MakeMyTrip', ico:'\ud83c\uddee\ud83c\uddf3', best:'Domestic India flights + hotel bundles',
   watch:'Convenience fee and "assured" add-ons pre-ticked at checkout \u2014 untick them',
   url:'https://www.makemytrip.com/'},
  {n:'ixigo', ico:'\ud83d\ude82', best:'Trains and PNR tracking \u2014 the best rail UX in India',
   watch:'Flight prices are usually fine but always cross-check the airline direct',
   url:'https://www.ixigo.com/'},
  {n:'Skyscanner', ico:'\ud83d\udd0d', best:'Comparing every airline at once; "everywhere" search for cheap dates',
   watch:'It is a search engine \u2014 you book on the airline/OTA it sends you to',
   url:'https://www.skyscanner.co.in/', aff:'skyscanner'},
  {n:'Google Flights', ico:'\ud83d\udee9\ufe0f', best:'Fastest date-grid and price tracking alerts',
   watch:'Does not show every budget carrier; check IndiGo/Akasa direct too',
   url:'https://www.google.com/travel/flights'},
  {n:'Booking.com', ico:'\ud83c\udfe8', best:'Largest stay inventory; free-cancellation filter is excellent',
   watch:'Prices exclude taxes until late in the flow \u2014 compare the final page',
   url:'https://www.booking.com/', aff:'booking'},
  {n:'Agoda', ico:'\ud83c\udf0f', best:'Often cheapest across Asia for the same room',
   watch:'Check whether breakfast/taxes are included before comparing',
   url:'https://www.agoda.com/', aff:'agoda'},
  {n:'Airbnb', ico:'\ud83c\udfe1', best:'Homestays and longer stays; kitchens for budget trips',
   watch:'Cleaning + service fees can add 20\u201330% \u2014 judge on the total, not the nightly',
   url:'https://www.airbnb.co.in/'},
  {n:'Thomas Cook / SOTC', ico:'\ud83e\uddf3', best:'Packaged group tours, visa assistance, forex',
   watch:'Packages bundle margin \u2014 price the same trip independently before committing',
   url:'https://www.thomascook.in/'},
  {n:'IRCTC', ico:'\ud83c\uddee\ud83c\uddf3', best:'The only official source for Indian Railways tickets',
   watch:'Tatkal opens 10\u201311am one day ahead; agents charging extra are unnecessary',
   url:'https://www.irctc.co.in/'}
];
function rwPlatformsHTML(){
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#1E3A8A,#0A0A0C)">'
    +'<div class="tk-place">Where to book</div>'
    +'<div class="tk-meta">What each platform is actually good at \u2014 and where it stings</div></div>'
    +'<div class="tk-sec">'
    + RW_PLATFORMS.map(function(p){
        var href = p.aff ? rwAffLink(p.aff, p.url) : p.url;
        return '<div style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
          +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
          +'<b style="font-size:13px">'+p.ico+' '+esc2(p.n)+'</b>'
          +'<a class="tk-chip" style="font-size:10.5px;padding:4px 9px;text-decoration:none" target="_blank" rel="noopener" href="'+href+'">Open \u2197</a></div>'
          +'<div style="font-size:11.5px;color:var(--t2);margin-top:3px;line-height:1.5">\u2714\ufe0f '+esc2(p.best)+'</div>'
          +'<div style="font-size:11.5px;color:#E8BA6C;margin-top:2px;line-height:1.5">\u26a0\ufe0f '+esc2(p.watch)+'</div>'
          +'</div>';
      }).join('')
    +'<div style="font-size:10px;color:var(--t3);margin-top:9px">Structural comparison, not live prices \u2014 none of these publish a public pricing API. Always compare the FINAL checkout total, taxes and fees included. Reviewed periodically; last review July 2026.</div>'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">Rules that beat any platform</div>'
    +'<div class="tk-bul">Search in an incognito window, then book on the airline\u2019s own site \u2014 it is often the same fare without the OTA fee, and changes are far easier.</div>'
    +'<div class="tk-bul">Compare the FINAL page, not the headline. Convenience fees, seat charges and taxes appear late.</div>'
    +'<div class="tk-bul">Tuesday/Wednesday departures booked 3\u20136 weeks out are usually the cheapest band on Indian routes.</div>'
    +'<div class="tk-bul">For a package, price the same flights + hotel separately first. If the package is not clearly cheaper, it is selling convenience.</div>'
    +'</div></div>';
}

/* ==================== LOCAL ECOSYSTEM ====================
   Naming the people who make a place itself: homestays over chains, working
   artists, musicians, writers, and the research stations that quietly sit in
   these landscapes. Curated and small on purpose \u2014 a short honest list beats a
   long invented one, and every entry here is a documented, checkable thing. */
var RW_ECOSYSTEM = {
  'almora':   [['\ud83c\udfe1','Kumaoni homestays','Family-run houses around Binsar and Kasar Devi \u2014 book direct, not through an aggregator'],
               ['\u270d\ufe0f','Writers\u2019 hill','Kasar Devi drew Uttarakhand\u2019s writer-and-seeker crowd for decades'],
               ['\ud83c\udfb5','Kumaoni folk','Hurka and Jhoda traditions still performed at village festivals']],
  'varanasi': [['\ud83c\udfb6','Benares gharana','One of Hindustani music\u2019s major lineages \u2014 evening riverside recitals'],
               ['\ud83e\uddf5','Weavers','Banarasi handloom families in Madanpura; buy from the weaver, not the showroom']],
  'jaipur':   [['\ud83c\udfa8','Blue pottery','A Jaipur craft kept alive by a handful of workshops'],
               ['\ud83d\udcda','Literature','The city\u2019s literature festival is India\u2019s largest free one']],
  'rishikesh':[['\ud83e\uddd8','Teachers','Long-standing yoga schools \u2014 look for Yoga Alliance registration, not Instagram following'],
               ['\ud83c\udfe1','Ashram stays','Simple rooms at working ashrams cost a fraction of the riverside hotels']],
  'goa':      [['\ud83c\udfb7','Goan jazz','Live jazz and Konkani music in Panjim\u2019s Latin Quarter'],
               ['\ud83c\udfe1','Portuguese-era homestays','Restored family houses inland \u2014 cheaper and quieter than the beach strip'],
               ['\ud83d\udd2c','Marine research','The National Institute of Oceanography is headquartered in Dona Paula']],
  'leh':      [['\ud83d\udd2d','Astronomy','The Indian Astronomical Observatory at Hanle \u2014 one of the world\u2019s highest, now a Dark Sky Reserve'],
               ['\ud83c\udfe1','Village homestays','The Sham and Markha valley networks pay families directly']],
  'kochi':    [['\ud83c\udfa8','Kochi-Muziris Biennale','South Asia\u2019s largest contemporary art event, in warehouse spaces'],
               ['\ud83c\udfad','Kathakali','Nightly performances \u2014 arrive an hour early to watch the makeup being applied']],
  'darjeeling':[['\ud83c\udf75','Tea gardens','Estate walks and tastings direct with growers'],
               ['\ud83d\ude82','Himalayan Railway','A working UNESCO World Heritage steam line, not a museum']]
};
function rwEcosystemHTML(place){
  var k=String(place||'').toLowerCase().trim(), list=RW_ECOSYSTEM[k];
  if(!list) return '';
  return '<div style="background:rgba(168,85,247,.06);border:1px solid rgba(168,85,247,.25);border-radius:12px;padding:11px 13px">'
    +'<div style="font-weight:800;font-size:12.5px">\u2728 The people who make this place</div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-bottom:6px">Spend here and the money stays here</div>'
    + list.map(function(e){
        return '<div style="display:flex;gap:9px;padding:5px 0"><span style="font-size:15px">'+e[0]+'</span>'
          +'<div><b style="font-size:12px">'+esc2(e[1])+'</b>'
          +'<div style="font-size:11.5px;color:var(--t2);line-height:1.5">'+esc2(e[2])+'</div></div></div>';
      }).join('')
    +'</div>';
}
