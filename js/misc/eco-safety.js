// @ts-nocheck
/* Eco / safety travel features — moved verbatim from app.js (Phase 6a).
   Covers: Green/Eco travel categories, the in-itinerary Functional Green
   Nudge, Off-Grid Safety (satellite/rescue guidance), Responsible Travel,
   the Green Hub (verified eco-transport/charging/stay links), Monkey
   Safety, Low-Carbon Travel (emission factors + the traveller's green
   ledger/badges), and the Over-Tourism Flag. */

/* ==================== GREEN / ECO TRAVEL ====================
   A dedicated space for low-impact travel: eco transport, plant-based food,
   sustainable stays, ethical shopping, and mindful choices. Each "I chose this"
   tap nudges the Green Traveller badge (5 green choices to earn it). */
var RW_GREEN_CATS=[
  {emoji:'\ud83d\udeb2', title:'Move green', accent:'#4ADE80',
   items:['Rent a bicycle or e-bike for the town','Take the bus or shared transport over a private cab','Choose EV taxis / e-rickshaws where available','Walk the old-town cores \u2014 you see more anyway','Prefer trains over short flights (far lower carbon)']},
  {emoji:'\ud83c\udf31', title:'Eat plant-forward', accent:'#22C55E',
   items:['Try the local vegan / veg thali \u2014 often the tastiest, cheapest option','Pick organic & farm-to-table cafes','Carry a refillable bottle \u2014 skip single-use plastic','Eat seasonal & local, not imported','Say no to disposable cutlery']},
  {emoji:'\ud83c\udfe1', title:'Stay light', accent:'#38BDF8',
   items:['Choose homestays & eco-lodges over big chains','Look for solar-powered or off-grid stays','Reuse towels; switch off AC when out','Support places that manage waste & water','Small, locally-owned beats large & corporate']},
  {emoji:'\ud83d\udecd\ufe0f', title:'Shop conscious', accent:'#A78BFA',
   items:['Buy handmade & local crafts (supports artisans)','Choose eco / natural-fibre clothes','Skip mass-produced souvenirs \u2014 buy less, buy meaningful','Carry a cloth bag','Avoid products from endangered species / materials']},
  {emoji:'\ud83c\udf3f', title:'Tread lightly', accent:'#10B981',
   items:['Leave no trace on treks \u2014 carry your waste out','Stick to marked trails; respect wildlife distance','Offset unavoidable flights via a verified programme','Attend local eco / community events','Travel slow \u2014 fewer places, deeper experience']}
];
/* ===== FUNCTIONAL GREEN NUDGE (in every itinerary) =====
   Not cosmetic: shows a concrete greener swap for THIS trip with a real rupee +
   CO2 estimate, and each "I'll do this" logs a green choice (feeds the badge).
   Estimates are honest ballparks, clearly labelled as approximate. */
function rwGreenNudge(dest, days){
  days = days||3;
  /* crude but honest: intercity trains emit ~80% less CO2 than flying and often
     cost less; a refillable bottle avoids ~1 plastic bottle/day. We show swaps
     that apply to almost any trip, with round-number estimates. */
  var swaps=[
    {id:'train', ic:'\ud83d\ude86', title:'Take the train, not a short flight',
     save:'\u2248\u20b91,500 + 120kg CO\u2082', why:'Trains to hill/heritage towns cost less than flights and cut ~80% of the carbon.'},
    {id:'refill', ic:'\ud83d\udca7', title:'Carry a refillable bottle',
     save:'\u2248\u20b9'+(days*20)+' + '+days+' plastic bottles', why:'Refill instead of buying water \u2014 saves money every day and skips single-use plastic.'},
    {id:'localstay', ic:'\ud83c\udfe1', title:'Pick a homestay over a chain hotel',
     save:'\u2248\u20b9'+(days*400)+' + supports locals', why:'Family homestays are cheaper, lower-impact, and the money stays in the community.'}
  ];
  var earnedGreen = (typeof badgeEarnedIds==='function') ? badgeEarnedIds().indexOf('green')>=0 : false;
  var rows = swaps.map(function(s){
    return '<div class="gn-row">'
      +'<span class="gn-ic">'+s.ic+'</span>'
      +'<div class="gn-body"><div class="gn-title">'+s.title+'</div>'
        +'<div class="gn-why">'+s.why+'</div>'
        +'<div class="gn-save">You save '+s.save+'</div></div>'
      +'<button class="gn-btn" id="gn_'+s.id+'" onclick="rwGreenPickInline(\''+s.id+'\')">I\u2019ll do this</button>'
      +'</div>';
  }).join('');
  return '<div class="green-nudge">'
    +'<div class="gn-head">\ud83c\udf31 Travel this trip greener \u2014 and save</div>'
    +'<div class="gn-sub">Small swaps for '+esc2(dest)+'. Each one you pick counts toward your \ud83c\udf31 Green Traveller badge'+(earnedGreen?' (earned \u2713)':'')+'.</div>'
    +rows
    +'</div>';
}
function rwGreenPickInline(id){
  var btn=el('gn_'+id); if(btn){ btn.textContent='\u2713 Nice!'; btn.disabled=true; btn.classList.add('on'); }
  try{ badgeBump('green'); }catch(e){}
  try{
    var gc=parseInt(lsGet('rw_ct_green')||'0',10)||0;
    var earned=(typeof badgeEarnedIds==='function')?badgeEarnedIds().indexOf('green')>=0:false;
    showToast(earned?'\ud83c\udf31 Green Traveller \u2014 nicely done!':'\ud83c\udf31 Green choice logged \u00b7 '+Math.max(0,5-gc)+' more for the badge');
  }catch(e){}
}
/* ==================== OFF-GRID SAFETY ====================
   The one "space tech" integration that genuinely belongs in a travel app.
   Satellite messaging is now in consumer hardware (iPhone 14+, Pixel 9+, Garmin
   inReach), and the people who most need it — trekkers above treeline in Spiti,
   Ladakh, the Everest region — are exactly RoamWise's users.

   HONEST SCOPE: RoamWise cannot send a satellite message. No web app can; it
   needs the device's own radio and a subscription. What it CAN do is make sure
   someone knows the option exists BEFORE they lose signal, because that is when
   the decision has to be made. Knowing your phone has satellite SOS is useless
   if you learn it after the accident. */
var RW_OFFGRID = {
  zones: ['spiti','ladakh','leh','zanskar','nubra','changthang','kaza','tabo','pin valley',
          'roopkund','goechala','stok kangri','everest base camp','annapurna','markha',
          'har ki dun','rupin','hampta','chadar','tso moriri','pangong','sandakphu'],
  hi: function(place){
    var k=String(place||'').toLowerCase().trim();
    return RW_OFFGRID.zones.some(function(z){ return k.indexOf(z)>-1 || z.indexOf(k)>-1; });
  }
};
function rwOffgridHTML(place){
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#312E81,#0A0A0C)">'
    +'<div class="tk-place">\ud83d\udef0\ufe0f Off-grid: '+esc2(place||'this route')+'</div>'
    +'<div class="tk-meta">You will lose mobile signal here. Decide this before you go.</div></div>'
    +'<div class="tk-sec"><div class="tk-lab">Satellite options that exist today</div>'
    +'<div class="tk-bul"><b>iPhone 14 and newer:</b> Emergency SOS via satellite is built in and free for the first years. Works with a clear view of sky. Nothing to buy \u2014 but practise it once using the built-in demo before you leave.</div>'
    +'<div class="tk-bul"><b>Pixel 9 and newer:</b> Satellite SOS on supported carriers. Check coverage for India specifically \u2014 availability differs by region.</div>'
    +'<div class="tk-bul"><b>Garmin inReach Mini:</b> \u20b935,000\u201345,000 plus a monthly plan. Two-way messaging and an SOS button routed to a 24/7 coordination centre. The serious option, and rentable in Manali and Leh.</div>'
    +'<div class="tk-bul"><b>Satellite phone:</b> illegal to carry in India without a licence from the DoT. Do not bring one in from abroad \u2014 people have been arrested for this.</div>'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">What actually saves people</div>'
    +'<div class="tk-bul">Leave your route and expected return with two people, one of whom is not on the trek.</div>'
    +'<div class="tk-bul">Download offline maps AND take a paper copy. Batteries fail in cold.</div>'
    +'<div class="tk-bul">Carry a power bank kept warm inside your jacket \u2014 lithium loses most of its capacity below freezing.</div>'
    +'<div class="tk-bul">Register with the local police or forest check-post where required. In Uttarakhand and Himachal this is often mandatory and is how search parties know where to start.</div>'
    +'<div class="tk-bul">A whistle and a mirror weigh nothing and work with no battery at all.</div>'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">Emergency numbers</div>'
    +'<div class="tk-bul">National emergency <b>112</b> \u00b7 ambulance <b>108</b> \u00b7 disaster response <b>1078</b></div>'
    +'<div class="tk-bul">Uttarakhand SDRF: <b>+91 135 2410197</b> \u00b7 Himachal SDMA: <b>1077</b></div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-top:6px">Verify current numbers locally \u2014 these change, and a wrong number in an emergency is worse than none.</div>'
    +'</div></div>';
}
/* ==================== RESPONSIBLE TRAVEL ====================
   Concrete and checkable. Not "respect the culture" — the specific behaviours
   that damage a place versus the ones that keep money and dignity local. */
var RW_RESPONSIBLE = {
  all: {
    harms:[
      ['Booking everything through aggregators','15\u201320% commission leaves the town. Book homestays and small hotels direct \u2014 the family keeps it.'],
      ['Bargaining hard with the poorest sellers','Haggling with a taxi fleet is fine. Grinding \u20b920 off a fruit vendor is not a win.'],
      ['Buying bottled water daily','Four bottles a day is \u20b980 and a lot of plastic in a town with no disposal system. Carry a bottle and refill.'],
      ['Feeding animals','Monkeys, dogs, elephants \u2014 feeding creates dependence and aggression that the next visitor pays for.'],
      ['Photographing people without asking','A face is not scenery. Ask, and accept no.'],
      ['Peak-season everything','Arriving when a place is already at capacity is the single biggest contributor to over-tourism.']
    ],
    helps:[
      ['Stay longer in fewer places','Better for you, far better for the place, and cheaper.'],
      ['Eat where locals eat','Money goes to the family running it, and the food is better.'],
      ['Hire local guides','A registered local guide costs little and is the difference between seeing a place and understanding it.'],
      ['Carry your waste out of trek routes','Especially above treeline where nothing decomposes.'],
      ['Travel off-season','Same place, a third of the crowd, and your money matters more when there is less of it around.'],
      ['Learn ten words','Namaste, thank you, how much, too expensive, delicious. It changes every interaction.']
    ]
  },
  nomad: {
    harms:[
      ['Long stays in short-let apartments','This is how residents get priced out of Goa, Bali and Lisbon. It is the biggest harm nomads do.'],
      ['Working from cafes without ordering','A four-hour laptop session on one coffee is using someone\u2019s rent as an office.'],
      ['Paying in dollars for everything','Inflating local prices for people earning local wages.']
    ],
    helps:[
      ['Book monthly with a landlord, not a platform','Longer, direct lets keep housing in the residential market.'],
      ['Use coworking spaces','That is what they are for, and they employ people.'],
      ['Hire locally','Fixers, guides, cleaners, teachers \u2014 pay properly and on time.']
    ]
  },
  solo: {
    harms:[
      ['Treating a place as a backdrop','Solo travel makes it easy to observe without engaging. That is a loss to both sides.']
    ],
    helps:[
      ['Eat at communal tables','Homestays and hostels \u2014 the conversations are the trip.'],
      ['Share your itinerary with someone','Not caution theatre \u2014 basic sense, especially on treks.'],
      ['Say yes to invitations, within reason','Most of the best travel stories start with an invitation you nearly declined.']
    ]
  }
};
function rwResponsibleHTML(kind){
  var K = RW_RESPONSIBLE[kind] || RW_RESPONSIBLE.all;
  var A = RW_RESPONSIBLE.all;
  function rows(list, colour, sign){
    return list.map(function(x){
      return '<div style="padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
        +'<div style="font-size:12.5px;font-weight:700;color:'+colour+'">'+sign+' '+esc2(x[0])+'</div>'
        +'<div style="font-size:11.5px;color:var(--t2);line-height:1.55;margin-top:2px">'+esc2(x[1])+'</div></div>';
    }).join('');
  }
  var title = kind==='nomad' ? 'Digital nomads' : kind==='solo' ? 'Solo travellers' : 'Every traveller';
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#0F766E,#0A0A0C)">'
    +'<div class="tk-place">\ud83e\udd1d Travelling well \u2014 '+title+'</div>'
    +'<div class="tk-meta">What damages a place, and what keeps it worth visiting</div></div>'
    + (K!==A ? '<div class="tk-sec"><div class="tk-lab" style="color:#E05B5B">Specific to '+title.toLowerCase()+' \u2014 avoid</div>'+rows(K.harms,'#E05B5B','\u2715')
              +'<div class="tk-lab" style="color:#4ADE80;margin-top:10px">Specific to '+title.toLowerCase()+' \u2014 do</div>'+rows(K.helps,'#4ADE80','\u2713')+'</div>' : '')
    +'<div class="tk-sec"><div class="tk-lab" style="color:#E05B5B">What quietly damages a place</div>'+rows(A.harms,'#E05B5B','\u2715')+'</div>'
    +'<div class="tk-sec"><div class="tk-lab" style="color:#4ADE80">What protects it</div>'+rows(A.helps,'#4ADE80','\u2713')+'</div>'
    +'<div class="tk-sec"><div class="tk-chips">'
    +'<button class="tk-chip" onclick="cpFollow(\'responsible travel for digital nomads\')">\ud83d\udcbb Nomads</button>'
    +'<button class="tk-chip" onclick="cpFollow(\'responsible travel for solo travellers\')">\ud83c\udf92 Solo</button>'
    +'<button class="tk-chip" onclick="cpFollow(\'green travel options\')">\ud83c\udf31 Green hub</button>'
    +'</div></div></div>';
}
/* ==================== GREEN HUB — every eco service in one place ==========
   All verified reachable in the July 2026 link-check pass. agent/link-check.js
   re-tests these on a schedule; anything returning 404 on its root domain gets
   pulled, which is the process that should have caught BluSmart. */
var RW_GREEN = {
  ride: [
    ['Evera',      'All-electric cabs, Delhi NCR',        'https://www.evera.co.in/',      '\u26a1', 'IN'],
    ['Xanh SM',    'VinFast all-EV fleet, SE Asia',       'https://xanhsm.com/',           '\ud83c\udf3f', 'SEA'],
    ['Uber Green', 'EV/hybrid category inside Uber',      'https://m.uber.com/',           '\ud83c\udf31', ''],
    ['Rapido',     'Electric bike taxis in many cities',  'https://onelink.to/rapido',     '\ud83c\udfcd\ufe0f','IN']
  ],
  bus: [
    ['NueGo',      'India\u2019s largest intercity electric coach network', 'https://www.nuego.in/', '\ud83d\ude8c', 'IN'],
    ['Chartered/State e-buses','Most metros now run electric city fleets',  'https://www.google.com/search?q=electric+city+bus', '\ud83d\ude8f', 'IN']
  ],
  twowheel: [
    ['Bounce',  'E-scooter rentals, dockless',      'https://bounceshare.com/',  '\ud83d\udef4', 'IN'],
    ['Yulu',    'E-bikes and e-mopeds, city hops',  'https://www.yulu.bike/',    '\ud83d\udeb2', 'IN'],
    ['Chalo',   'Live city-bus tracking incl. e-buses','https://chalo.com/',        '\ud83d\udef5', 'IN']
  ],
  charge: [
    ['PlugShare',     'Crowd-mapped chargers worldwide',   'https://www.plugshare.com/',              '\ud83d\udd0c', ''],
    ['Statiq',        'India\u2019s widest charging network',    'https://statiq.in/',                      '\u26a1', 'IN'],
    ['Tata Power EZ', 'Reliable highway-corridor charging','https://www.tatapower.com/ev-charging/',  '\ud83d\udd0b', 'IN'],
    ['ChargeZone',    'Highway fast-charging',             'https://chargezone.com/',                 '\ud83d\ude97', 'IN']
  ],
  solar: [
    ['PM Surya Ghar',  'Rooftop solar subsidy scheme',        'https://pmsuryaghar.gov.in/',  '\u2600\ufe0f', 'IN'],
    ['MNRE',           'Ministry portal \u2014 schemes and certified vendors','https://mnre.gov.in/', '\ud83c\udfe0', 'IN']
  ],
  farm: [
    ['WWOOF India',      'Work-stay on organic farms',        'https://wwoofindia.org/',  '\ud83c\udf31', 'IN'],
    ['Worldpackers',     'Eco-stay volunteering worldwide',   'https://www.worldpackers.com/', '\ud83c\udf0d', ''],
    ['Ecobnb',           'Verified eco-friendly stays worldwide','https://ecobnb.com/','\ud83c\udf3f', '']
  ]
};
function rwGreenHubHTML(cc){
  var reg = (['TH','VN','ID','MY','KH','LA','PH','SG'].indexOf(String(cc||'').toUpperCase())>-1) ? 'SEA'
          : (String(cc||'').toUpperCase()==='IN' ? 'IN' : '');
  function sect(title, key, note){
    var list = RW_GREEN[key].filter(function(a){ return !a[4] || !reg || a[4]===reg; });
    if(!list.length) return '';
    return '<div class="tk-lab">'+title+'</div>'
      + (note? '<div style="font-size:11px;color:var(--t3);margin-bottom:5px">'+note+'</div>':'')
      + list.map(function(a){
          return '<a class="tk-chip" style="text-decoration:none;margin:3px 4px 3px 0" target="_blank" rel="noopener" href="'+a[2]+'" title="'+esc2(a[1])+'">'+a[3]+' '+esc2(a[0])+'</a>';
        }).join('')
      + '<div style="font-size:10.5px;color:var(--t3);margin:5px 0 12px">'
      + list.map(function(a){ return esc2(a[0])+' \u2014 '+esc2(a[1]); }).join('<br>')
      + '</div>';
  }
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#14532D,#052E16)">'
    +'<div class="tk-place">\ud83c\udf31 Green travel hub</div>'
    +'<div class="tk-meta">Electric transport, charging, solar and farm stays \u2014 in one place</div></div>'
    +'<div class="tk-sec">'
    + sect('\ud83d\ude95 Electric rides','ride')
    + sect('\ud83d\ude8c Electric buses','bus','Intercity coaches at roughly a tenth of a flight\u2019s emissions per passenger-km.')
    + sect('\ud83d\udeb2 E-bikes & scooters','twowheel','~22 g CO\u2082e/km \u2014 the cleanest motorised option for city travel.')
    + sect('\ud83d\udd0c Charging','charge')
    + sect('\u2600\ufe0f Solar','solar','For your home, not your trip \u2014 but it is the biggest single lever most people have.')
    + sect('\ud83c\udf3f Organic farms & eco stays','farm','Work-stays trade a few hours a day for food and a bed, and teach you more about a place than any tour.')
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">What choosing these actually saves</div>'
    +'<div style="font-size:12px;line-height:1.65;color:var(--t2)">On a 500 km journey, an electric coach emits about <b>14 kg</b> CO\u2082e against roughly <b>125 kg</b> for a domestic flight \u2014 and typically costs <b>\u20b91,200 instead of \u20b95,000</b>. The greener option is usually also the cheaper one, which is the part nobody mentions.</div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-top:7px">Factors: DEFRA/BEIS 2023. Fares indicative.</div></div>'
    +'<div class="tk-foot">Links verified July 2026 \u00b7 re-checked automatically</div></div>';
}
/* ==================== MONKEY SAFETY ====================
   HONEST SCOPE: this is NOT a camera detection system. Shipping a "monkey
   detector" would mean an on-device vision model I cannot train, validate or
   keep accurate — and a false negative in a real encounter is worse than no
   feature at all. What genuinely prevents bites is knowing WHERE they gather
   and HOW to behave, which is what this provides. Guidance follows standard
   wildlife-authority advice; the medical protocol follows WHO rabies guidance,
   which is the part people get dangerously wrong. */
var RW_MONKEY = {
  almora:     {level:'high',   spots:['Mall Road and the bazaar steps','Kasar Devi temple approach','Bright End Corner at dusk']},
  shimla:     {level:'severe', spots:['Jakhu Temple and the ridge path','The Mall near Scandal Point','Sanjauli side lanes']},
  rishikesh:  {level:'high',   spots:['Ram Jhula and Lakshman Jhula bridges','Ghat steps near the ashrams','Roadside food stalls']},
  haridwar:   {level:'high',   spots:['Chandi Devi ropeway path','Har Ki Pauri surrounds','Mansa Devi trail']},
  nainital:   {level:'medium', spots:['Mall Road','Naina Devi temple','Snow View trail']},
  mussoorie:  {level:'medium', spots:['Camel\u2019s Back Road','Gun Hill','Mall Road food stalls']},
  vrindavan:  {level:'severe', spots:['Banke Bihari temple lanes','Rooftops near the ghats','Any street with prasad stalls'], note:'Vrindavan\u2019s macaques are notorious for taking spectacles and phones, then trading them back for food.'},
  varanasi:   {level:'medium', spots:['Durga Kund','Sankat Mochan temple','Ghat rooftops']},
  jaipur:     {level:'medium', spots:['Galtaji (the Monkey Temple)','Amer Fort steps','Nahargarh approach']},
  shimoga:    {level:'low',    spots:['Temple complexes']},
  dharamshala:{level:'medium', spots:['McLeod Ganj main square','Bhagsu waterfall path']}
};
function rwMonkeyFor(place){
  var k=String(place||'').toLowerCase().trim();
  return RW_MONKEY[k] || null;
}
function rwMonkeyHTML(place){
  var m=rwMonkeyFor(place); if(!m) return '';
  var col = m.level==='severe' ? '#E05B5B' : m.level==='high' ? '#E8BA6C' : '#4ADE80';
  var word = m.level==='severe' ? 'Very active' : m.level==='high' ? 'Active' : m.level==='medium' ? 'Present' : 'Occasional';
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#78350F,#0A0A0C)">'
    +'<div class="tk-place">\ud83d\udc12 Monkeys in '+esc2(place)+'</div>'
    +'<div class="tk-meta"><span style="color:'+col+'">'+word+'</span> \u00b7 where they gather and how not to get bitten</div></div>'
    +'<div class="tk-sec"><div class="tk-lab">Where they concentrate</div>'
    + m.spots.map(function(x){ return '<div class="tk-bul">'+esc2(x)+'</div>'; }).join('')
    + (m.note? '<div style="font-size:11.5px;color:var(--t2);margin-top:6px;line-height:1.6">'+esc2(m.note)+'</div>':'')
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">The four rules that prevent almost every incident</div>'
    +'<div class="tk-bul"><b>Never make eye contact.</b> A direct stare is a threat display to a macaque. Look down and to the side, and keep walking.</div>'
    +'<div class="tk-bul"><b>Never carry visible food or plastic bags.</b> A rustling bag reads as food. Put snacks inside a zipped backpack before you reach the area.</div>'
    +'<div class="tk-bul"><b>Never bare your teeth.</b> Smiling shows teeth, and to a monkey that is aggression. Keep your mouth closed if one approaches.</div>'
    +'<div class="tk-bul"><b>Never feed them.</b> It is what created the problem, and a fed troop learns to demand from the next person.</div>'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">If one approaches or grabs something</div>'
    +'<div class="tk-bul">Do not tug back. Let go \u2014 a phone is replaceable, a torn hand is not.</div>'
    +'<div class="tk-bul">Do not run or scream. Back away steadily, side-on, without turning your back.</div>'
    +'<div class="tk-bul">Stand tall and step forward once if one is being pushy \u2014 a firm posture usually ends it. A stick held low (never raised) is enough deterrent.</div>'
    +'<div class="tk-bul">Bags on your front, not your back. Spectacles inside a pocket near temples.</div>'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab" style="color:#E05B5B">If you are bitten or scratched \u2014 this part matters</div>'
    +'<div class="tk-bul"><b>Wash the wound with soap under running water for a full 15 minutes.</b> This single step removes most of the virus risk and people routinely skip it.</div>'
    +'<div class="tk-bul"><b>Get to a doctor the same day.</b> Monkey bites carry rabies risk and post-exposure vaccination must begin immediately \u2014 it is close to 100% effective when started promptly and there is no treatment once symptoms appear.</div>'
    +'<div class="tk-bul">Even a scratch or a lick on broken skin counts. Do not wait to see how it looks tomorrow.</div>'
    +'<div class="tk-bul">Government hospitals in India provide anti-rabies vaccine free. Ambulance <b>108</b>, emergency <b>112</b>.</div>'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-chips">'
    +'<button class="tk-chip gold" onclick="cpFollow(\'pharmacy near '+String(place).replace(/\'/g,'')+'\')">\ud83d\udc8a Nearest medical</button>'
    +'</div></div>'
    +'<div class="tk-foot">General guidance, not medical advice \u2014 for any bite, see a doctor today.</div></div>';
}
/* ==================== LOW-CARBON TRAVEL ====================
   Emission factors are published figures (gCO2e per passenger-km), not guesses:
   DEFRA/BEIS 2023 conversion factors and IPCC AR6 transport ranges. They are
   averages — occupancy, route and vehicle age all move the real number, and the
   UI says so. We never claim a trip "reverses climate change"; the honest frame
   is "this choice emitted less than the default one", which is both true and
   the thing a traveller can actually act on. */
var RW_EMIT = {            /* gCO2e per passenger-km */
  walk:      {g:0,    icon:'\ud83d\udeb6', label:'Walking'},
  cycle:     {g:0,    icon:'\ud83d\udeb2', label:'Cycling'},
  ev_2w:     {g:22,   icon:'\ud83d\udef5', label:'E-scooter'},
  ev_car:    {g:47,   icon:'\ud83d\udd0b', label:'EV car'},
  train_el:  {g:35,   icon:'\ud83d\ude86', label:'Electric train'},
  bus_city:  {g:80,   icon:'\ud83d\ude8c', label:'City bus'},
  bus_coach: {g:27,   icon:'\ud83d\ude8d', label:'Long-distance coach'},
  train_dsl: {g:60,   icon:'\ud83d\ude82', label:'Diesel train'},
  car_petrol:{g:170,  icon:'\ud83d\ude97', label:'Petrol car (solo)'},
  car_share: {g:57,   icon:'\ud83d\udc65', label:'Car, 3 sharing'},
  auto:      {g:110,  icon:'\ud83d\udefa', label:'Auto-rickshaw'},
  flight_dom:{g:250,  icon:'\u2708\ufe0f', label:'Domestic flight'},
  flight_int:{g:195,  icon:'\ud83d\udeeb', label:'Long-haul flight'}
};
function rwCO2(mode, km){ var m=RW_EMIT[mode]; return m? Math.round(m.g*km/1000) : null; }  /* kg */
function rwGreenSwapHTML(km){
  km = km || 300;
  var base = rwCO2('flight_dom', km);
  var rows = ['train_el','bus_coach','car_share','ev_car','cycle'].map(function(k){
    var m=RW_EMIT[k], kg=rwCO2(k,km), saved=base-kg;
    var pct = base? Math.round((saved/base)*100) : 0;
    return '<div style="display:flex;align-items:center;gap:9px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
      +'<span style="font-size:15px">'+m.icon+'</span>'
      +'<div style="flex:1"><div style="font-size:12.5px">'+m.label+'</div>'
      +'<div style="height:4px;background:var(--b2,#2A2A36);border-radius:2px;margin-top:3px;overflow:hidden">'
      +'<div style="width:'+Math.max(2,Math.min(100,pct))+'%;height:100%;background:linear-gradient(90deg,#4ADE80,#22C55E)"></div></div></div>'
      +'<div style="text-align:right"><b style="font-size:12px;color:#4ADE80">-'+pct+'%</b>'
      +'<div style="font-size:9.5px;color:var(--t3)">'+kg+' kg</div></div></div>';
  }).join('');
  return '<div style="background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.25);border-radius:13px;padding:12px 14px">'
    +'<div style="font-weight:800;font-size:12.5px">\ud83c\udf31 Lower-carbon ways to cover ~'+km+' km</div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-bottom:7px">Against a domestic flight ('+base+' kg CO\u2082e). Published average factors \u2014 real numbers shift with occupancy and route.</div>'
    + rows
    +'<div style="font-size:10px;color:var(--t3);margin-top:7px">Factors: DEFRA/BEIS 2023 \u00b7 IPCC AR6 ranges</div></div>';
}

/* ---- the traveller's own ledger ---- */
function rwEcoLoad(){
  try{ return JSON.parse(lsGet('rw_eco')||'{"trips":[],"kgSaved":0,"trees":0,"litres":0,"kwh":0}'); }
  catch(e){ return {trips:[],kgSaved:0,trees:0,litres:0,kwh:0}; }
}
function rwEcoSave(d){ lsSet('rw_eco', JSON.stringify(d)); }
function rwEcoLog(entry){
  var d=rwEcoLoad();
  d.trips.push(entry);
  d.kgSaved = Math.round((d.kgSaved||0) + (entry.saved||0));
  if(entry.trees)  d.trees  = (d.trees||0)  + entry.trees;
  if(entry.litres) d.litres = (d.litres||0) + entry.litres;
  if(entry.kwh)    d.kwh    = (d.kwh||0)    + entry.kwh;
  rwEcoSave(d);
  return d;
}
/* Badges are EARNED and the thresholds are visible — no participation trophies */
var RW_ECO_BADGES = [
  {id:'first_step',  need:1,    icon:'\ud83c\udf31', name:'First Step',      how:'Log one low-carbon leg'},
  {id:'sapling',     need:50,   icon:'\ud83c\udf3f', name:'Sapling',         how:'50 kg CO\u2082e avoided'},
  {id:'grove',       need:250,  icon:'\ud83c\udf33', name:'Grove Keeper',    how:'250 kg avoided'},
  {id:'forest',      need:1000, icon:'\ud83c\udf32', name:'Forest Guardian', how:'1 tonne avoided'},
  {id:'watershed',   need:2500, icon:'\ud83d\udca7', name:'Watershed',       how:'2.5 tonnes avoided'},
  {id:'earthkeeper', need:5000, icon:'\ud83c\udf0d', name:'Earthkeeper',     how:'5 tonnes avoided'}
];
function rwEcoBadges(kg){
  return RW_ECO_BADGES.map(function(b){ return Object.assign({}, b, {earned: kg >= b.need}); });
}
/* Equivalences are illustrative and labelled as such: one mature tree absorbs
   roughly 21 kg CO2/yr (US Forest Service figure widely cited). */
function rwEcoEquiv(kg){
  return { trees: (kg/21).toFixed(1), kmNotDriven: Math.round(kg*1000/170) };
}
function rwEcoPanelHTML(){
  var d = rwEcoLoad(), kg = d.kgSaved||0, eq = rwEcoEquiv(kg);
  var badges = rwEcoBadges(kg);
  var next = badges.filter(function(b){ return !b.earned; })[0];
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#14532D 0%,#052E16 90%)">'
    +'<div class="tk-place">\ud83c\udf31 Your green ledger</div>'
    +'<div class="tk-meta">'+kg.toLocaleString('en-IN')+' kg CO\u2082e avoided \u00b7 '+(d.trips.length)+' low-carbon legs</div></div>'
    +'<div class="tk-sec"><div class="tk-lab">What that compares to</div>'
    +'<div class="tk-bul">Roughly what '+eq.trees+' mature trees absorb in a year</div>'
    +'<div class="tk-bul">About '+eq.kmNotDriven.toLocaleString('en-IN')+' km not driven in a petrol car</div>'
    +(d.litres? '<div class="tk-bul">'+Math.round(d.litres).toLocaleString('en-IN')+' litres of water saved (logged stays)</div>':'')
    +(d.kwh? '<div class="tk-bul">'+Math.round(d.kwh).toLocaleString('en-IN')+' kWh not drawn from the grid (solar stays)</div>':'')
    +'<div style="font-size:10px;color:var(--t3);margin-top:6px">Comparisons are illustrative \u2014 avoided emissions are not the same as removing carbon already in the air.</div></div>'
    +'<div class="tk-sec"><div class="tk-lab">Badges</div><div class="tk-chips">'
    + badges.map(function(b){
        return '<span class="tk-chip'+(b.earned?' gold':'')+'" style="cursor:default;'+(b.earned?'':'opacity:.42')+'" title="'+esc2(b.how)+'">'+b.icon+' '+b.name+'</span>';
      }).join('')
    +'</div>'
    + (next? '<div style="font-size:11.5px;color:var(--t2);margin-top:8px">Next: <b>'+next.icon+' '+next.name+'</b> at '+next.need+' kg \u2014 '+(next.need-kg)+' kg to go.</div>' : '<div style="font-size:11.5px;color:#4ADE80;margin-top:8px">Every badge earned. Genuinely impressive.</div>')
    +'</div>'
    + (kg>=50? '<div class="tk-sec"><button class="tk-chip gold" style="width:100%;padding:11px" onclick="rwEcoCert()">\ud83c\udfc5 Generate your certificate</button></div>':'')
    +'</div>';
}
/* ==================== OVER-TOURISM FLAG ====================
   Places that were quiet and are now overwhelmed. Two honest sources:
   (1) the crowd index already in the destination DB, and (2) a short list of
   cases documented in mainstream reporting and by the destinations' own
   governments (entry fees, caps, permits). No invented claims, no "avoid" —
   this is about when to go and what changed, not about warning people off. */
var RW_TOURIST_PRESSURE = {
  'venice':     {was:'a working lagoon city', now:'day-tripper capped and charging an entry fee in peak season', since:'2024'},
  'barcelona':  {was:'a residential Mediterranean port', now:'protest marches over housing and cruise crowds', since:'2017'},
  'dubrovnik':  {was:'a quiet walled town', now:'cruise arrivals capped by the city after UNESCO pressure', since:'2019'},
  'bali':       {was:'a surf-and-temple island', now:'a tourist levy and dress/conduct rules after visitor incidents', since:'2024'},
  'kyoto':      {was:'residential machiya neighbourhoods', now:'Gion has closed private alleys to tourists', since:'2024'},
  'manali':     {was:'an apple-orchard hill town', now:'weekend traffic jams on the Rohtang road', since:'2015'},
  'rishikesh':  {was:'an ashram town', now:'a rafting-and-cafe circuit with heavy weekend load', since:'2016'},
  'kasol':      {was:'a quiet Parvati valley village', now:'a backpacker hub with waste-management problems', since:'2014'},
  'shimla':     {was:'a colonial summer capital', now:'periodic water shortages in peak season', since:'2018'},
  'goa':        {was:'sleepy Portuguese-era coast', now:'north Goa heavily developed; the south is still slow', since:'2010'},
  'maldives':   {was:'fishing atolls', now:'resort-island model with strict local-island rules', since:'2012'},
  'santorini':  {was:'a cliff village', now:'cruise-day crowd caps under discussion', since:'2019'},
  'machu picchu':{was:'open-access ruins', now:'timed-entry tickets and circuit routes, strictly capped', since:'2019'},
  'everest base camp':{was:'a trekking route', now:'permit caps and clean-up levies', since:'2023'}
};
function rwPressureHTML(place){
  var k = String(place||'').toLowerCase().trim();
  var p = RW_TOURIST_PRESSURE[k]; if(!p) return '';
  return '<div style="background:rgba(232,186,108,.07);border:1px solid rgba(232,186,108,.28);border-radius:12px;padding:11px 13px">'
    +'<div style="font-weight:800;font-size:12.5px">\u23f3 This place has changed</div>'
    +'<div style="font-size:12px;line-height:1.6;color:var(--t2);margin-top:4px">'
    +'Was '+esc2(p.was)+'. Now: '+esc2(p.now)+' \u2014 broadly since '+esc2(p.since)+'.</div>'
    +'<div style="font-size:11px;color:var(--t3);margin-top:6px">Not a reason to skip it \u2014 a reason to go off-season, start early, and check current rules before booking.</div>'
    +'</div>';
}

/* ---- Green Travel UI page (renders RW_GREEN_CATS above as a checklist) ---- */
function openGreenTravel(){
  try{ tabGo('home'); }catch(e){}
  /* BUG FIX (rw-v57): `sec` was used without ever being declared, so this
     threw a ReferenceError and the menu item did nothing at all. */
  var sec=el('greenSection');
  if(!sec){ sec=document.createElement('section'); sec.id='greenSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  var earned = (typeof badgeEarnedIds==='function') ? badgeEarnedIds().indexOf('green')>=0 : false;
  var gc = parseInt(lsGet('rw_ct_green')||'0',10)||0;
  var cards=RW_GREEN_CATS.map(function(c){
    var items=c.items.map(function(it){
      return '<label class="green-item"><input type="checkbox" onchange="rwGreenPick(this)"><span>'+esc2(it)+'</span></label>';
    }).join('');
    return '<div class="green-card" style="--gc:'+c.accent+'"><div class="green-cat">'+c.emoji+' '+c.title+'</div>'+items+'</div>';
  }).join('');
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83c\udf31 Green <em>travel</em></h2>'
    +'<button class="tact" onclick="rwCloseSection(\'greenSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Travel lighter on the planet \u2014 tick the choices you\u2019re making. 5 green choices earns the \ud83c\udf31 Green Traveller badge.</p>'
    +'<div class="green-prog"><div class="green-bar" style="width:'+Math.min(100,gc/5*100)+'%"></div></div>'
    +'<div class="green-progtxt">'+(earned?'\ud83c\udf31 Green Traveller badge earned! Keep it up.':gc+' / 5 green choices \u2014 '+(5-gc)+' to go')+'</div>'
    +cards
    +'<div class="green-foot">Every small choice counts. RoamWise is built for travel that leaves places better than it found them. \ud83c\udf0d</div>';
  rwOpenSection(sec.id); sec.scrollIntoView({behavior:'smooth',block:'start'});
}
function rwGreenPick(cb){
  if(cb.checked){
    try{ badgeBump('green'); }catch(e){}
    var gc=parseInt(lsGet('rw_ct_green')||'0',10)||0;
    var bar=document.querySelector('.green-bar'); if(bar) bar.style.width=Math.min(100,gc/5*100)+'%';
    var tx=document.querySelector('.green-progtxt');
    var earned=(typeof badgeEarnedIds==='function')?badgeEarnedIds().indexOf('green')>=0:false;
    if(tx) tx.textContent = earned?'\ud83c\udf31 Green Traveller badge earned! Keep it up.':gc+' / 5 green choices \u2014 '+Math.max(0,5-gc)+' to go';
    cb.disabled=true; cb.parentNode.style.opacity='.6';
  }
}
