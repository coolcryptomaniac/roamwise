// @ts-nocheck
/* Misc travel features (2/3) — moved verbatim from app.js (Phase 6a).
   Covers the Daily Briefing (date/location/weather aware), house ad slots,
   the Trek Vault + Fresh Experiences (with the shared wishlist), Travel
   Modes (EV/walk/cycle/hybrid/luxury/eco budget multipliers), Commute &
   Track, Festivals/Events lookup, and Trip Merch (AI-art print-on-demand
   + stock beachwear routing). */

/* ===== DAILY BRIEFING — date + location + weather aware ===== */
var WCODE={0:['\u2600\ufe0f','Clear'],1:['\ud83c\udf24\ufe0f','Mostly clear'],2:['\u26c5','Partly cloudy'],3:['\u2601\ufe0f','Overcast'],45:['\ud83c\udf2b\ufe0f','Foggy'],48:['\ud83c\udf2b\ufe0f','Foggy'],51:['\ud83c\udf26\ufe0f','Drizzle'],61:['\ud83c\udf27\ufe0f','Rain'],63:['\ud83c\udf27\ufe0f','Rain'],65:['\u26c8\ufe0f','Heavy rain'],71:['\ud83c\udf28\ufe0f','Snow'],80:['\ud83c\udf26\ufe0f','Showers'],95:['\u26a1','Thunderstorm']};
function dayBriefing(){
  var B=el('brief'); if(!B) return;
  var now=new Date();
  el('bDate').textContent = now.toLocaleDateString('en-IN',{weekday:'long', day:'numeric', month:'long'});
  /* destination of the day — deterministic by date */
  var seed = now.getFullYear()*372 + now.getMonth()*31 + now.getDate();
  var d = DB[seed % DB.length];
  var mi = now.getMonth();
  el('bDest').innerHTML = '<span class="bi">\ud83c\udfaf</span><span><b>Destination of the day: '+d.name+', '+d.country+'</b> \u2014 '+(d.crowd? d.crowd[mi]+'% crowds this month':'')+'. '+((d.tags||[]).slice(0,3).join(' \u00b7 '))+'<span class="brief-cta" onclick="briefPlan(\''+d.name.replace(/'/g,"\\'")+'\')">Plan this \u2192</span></span>';
  /* festival today anywhere we track */
  var fhits=[];
  for(var c in FESTS){ if(FESTS[c][mi]) fhits.push(FESTS[c][mi]+' ('+c+')'); }
  if(fhits.length){ var f=fhits[seed % fhits.length]; el('bFest').style.display=''; el('bFest').innerHTML='<span class="bi">\ud83c\udf89</span><span><b>This month somewhere amazing:</b> '+f+'</span>'; }
  B.style.display='';
  /* location + weather via IP (no permission popups) */
  fetch('https://ipwho.is/').then(function(r){return r.json();}).then(function(loc){
    if(!loc || !loc.success) throw 0;
    return fetch('https://api.open-meteo.com/v1/forecast?latitude='+loc.latitude+'&longitude='+loc.longitude+'&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1')
      .then(function(r){return r.json();}).then(function(w){
        var cw=w.current_weather||{}; var code=WCODE[cw.weathercode]||['\ud83c\udf24\ufe0f','Weather'];
        var hi=(w.daily&&w.daily.temperature_2m_max&&Math.round(w.daily.temperature_2m_max[0]))||'';
        el('bWx').innerHTML='<div class="wt">'+code[0]+' '+Math.round(cw.temperature)+'\u00b0C</div><div class="wm"><b>'+ (loc.city||'') +(loc.city&&loc.country?', ':'')+(loc.country||'')+'</b><br>'+code[1]+(hi!==''?' \u00b7 high '+hi+'\u00b0C':'')+' \u2014 '+(cw.temperature>=18&&cw.temperature<=30&&cw.weathercode<3?'a perfect day to plan the next escape.':'a good day to plan the next escape from the couch.')+'</div>';
      });
  }).catch(function(){ el('bWx').innerHTML='<div class="wm">\ud83c\udf0f Somewhere on Earth \u2014 a good day to plan an escape.</div>'; });
  /* on this day — Wikipedia free feed */
  var mm=('0'+(now.getMonth()+1)).slice(-2), dd=('0'+now.getDate()).slice(-2);
  fetch('https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected/'+mm+'/'+dd).then(function(r){return r.json();}).then(function(j){
    var evs=(j.selected||[]).filter(function(e){return e.text && e.text.length<160;});
    if(!evs.length) return;
    var e=evs[seed % evs.length];
    el('bFact').style.display='';
    el('bFact').innerHTML='<span class="bi">\ud83d\udcf0</span><span><b>On this day, '+e.year+':</b> '+e.text+'</span>';
  }).catch(function(){});
}
function briefPlan(name){ var i=el('destInput'); if(i){ i.value=name; } tabGo('plan'); showToast('Pick a month and hit Search'); }
setTimeout(dayBriefing, 400);

var ADS=[
 {ic:'\ud83d\udcd8',lbl:'From the maker',t:'AI Ki Pathshala \u2014 learn AI in simple Hindi',s:'The practical AI guide for students & families. By Mohit Pandey, RoamWise\u2019s creator.',u:'https://amzn.in/d/0b8CZwlG',c:'Get the book'},
 {ic:'\u25b6\ufe0f',lbl:'From the maker',t:'@mohucool \u2014 Himalayan travel + AI on YouTube',s:'Kumaoni music, mountain routes and build-in-public videos.',u:'https://youtube.com/@mohucool',c:'Subscribe'},
 {ic:'\ud83c\udfe8',lbl:'Partner slot',t:'Your hotel / agency featured here',s:'This spot reaches every trip search. Contact via YouTube to sponsor.',u:'https://youtube.com/@mohucool',c:'Sponsor'}
];
function adCard(i){
  var a=ADS[i%ADS.length]; if(!a) return '';
  return '<div class="adcard"><div class="ad-ic">'+a.ic+'</div><div><span class="ad-lbl">'+a.lbl+'</span><div class="ad-t">'+a.t+'</div><div class="ad-s">'+a.s+'</div></div><a class="ad-cta" href="'+a.u+'" target="_blank" rel="noopener">'+a.c+'</a></div>';
}

/* ===== TREK VAULT ===== */
var TREKS=[
{n:'Kedarkantha',w:'Uttarakhand, India',c:'pop',d:6,alt:3810,df:'Easy\u2013Moderate',bm:'Dec\u2013Apr',it:['Dehradun \u2192 Sankri (10hr drive)','Sankri \u2192 Juda ka Talab','Base camp via pine forests','Summit 3,810m at sunrise \u2192 Hargaon','Descend to Sankri','Drive back to Dehradun']},
{n:'Valley of Flowers + Hemkund',w:'Uttarakhand, India',c:'pop',d:6,alt:4329,df:'Moderate',bm:'Jul\u2013Sep',it:['Haridwar \u2192 Govindghat','Trek to Ghangaria (9km)','Valley of Flowers day walk','Hemkund Sahib 4,329m','Return Govindghat','Drive back']},
{n:'Hampta Pass',w:'Himachal, India',c:'pop',d:5,alt:4270,df:'Moderate',bm:'Jun\u2013Sep',it:['Manali \u2192 Jobra \u2192 Chika','Chika \u2192 Balu ka Ghera','Cross Hampta Pass 4,270m \u2192 Shea Goru','Shea Goru \u2192 Chhatru \u2192 Chandratal','Drive back to Manali']},
{n:'Everest Base Camp',w:'Nepal',c:'pop',d:12,alt:5364,df:'Moderate\u2013Hard',bm:'Mar\u2013May, Oct\u2013Nov',it:['Fly Lukla \u2192 Phakding','Namche Bazaar (acclimatise +1)','Tengboche monastery','Dingboche (acclimatise +1)','Lobuche \u2192 Gorak Shep','EBC 5,364m + Kala Patthar sunrise','Descend over 3\u20134 days']},
{n:'Tour du Mont Blanc',w:'France/Italy/Switzerland',c:'pop',d:10,alt:2665,df:'Moderate',bm:'Jun\u2013Sep',it:['Chamonix \u2192 Les Contamines','Col du Bonhomme crossing','Courmayeur (Italy)','Rifugio Bonatti balcony trail','Swiss Val Ferret \u2192 Champex','La Fouly \u2192 Trient','Col de Balme back to Chamonix']},
{n:'Nag Tibba Weekend',w:'Uttarakhand, India',c:'pop',d:2,alt:3022,df:'Easy',bm:'Year-round',it:['Dehradun \u2192 Pantwari \u2192 base camp','Summit sunrise 3,022m \u2192 descend \u2192 drive back']},
{n:'Pin Bhaba Pass',w:'Himachal\u2013Spiti, India',c:'hid',d:8,alt:4915,df:'Hard',bm:'Jul\u2013Sep',it:['Shimla \u2192 Kafnu','Mulling meadows','Kara \u2192 Phustirang','Cross Pin Bhaba 4,915m into Spiti\u2019s moonscape','Mudh village \u2192 Kaza','Explore Spiti before return']},
{n:'Kagbhusandi Tal',w:'Uttarakhand, India',c:'hid',d:7,alt:5230,df:'Hard',bm:'Jun, Sep',it:['Joshimath \u2192 Bhyundar','Semartoli meadows','Raj Kharak','Kagbhusandi lake beneath Hathi Parvat','Return via Kankul Pass 5,230m','Descend to Govindghat']},
{n:'Bara Bhangal',w:'Himachal, India',c:'hid',d:9,alt:4850,df:'Very hard',bm:'Jun\u2013Sep',it:['Manali \u2192 Lama Dugh','Cross Kalihani Pass 4,850m','Glacier camps (2 days)','Bara Bhangal \u2014 India\u2019s most isolated village','Cross Thamsar Pass 4,750m','Descend to Billing (paragliding site)']},
{n:'Kungsleden (King\u2019s Trail)',w:'Swedish Lapland',c:'hid',d:8,alt:1150,df:'Moderate',bm:'Jul\u2013Sep',it:['Abisko \u2192 Abiskojaure','Alesjaure hut','Tj\u00e4ktja Pass','S\u00e4lka \u2192 Singi','Kebnekaise base (optional summit)','Exit to Nikkaluokta']},
{n:'Lycian Way (best section)',w:'Turkey',c:'hid',d:6,alt:1800,df:'Moderate',bm:'Mar\u2013May, Oct',it:['Fethiye \u2192 Faralya over Butterfly Valley','Kaba\u011f \u2192 Alinca cliff path','Patara beach ruins','Kalkan \u2192 Ka\u015f coast','Aperlai sunken city','Finish at Simena castle']},
{n:'Roopkund (restricted)',w:'Uttarakhand, India',c:'dan',d:8,alt:5029,df:'Hard',bm:'May\u2013Jun, Sep',it:['NOTE: closed by court order since 2019 \u2014 status changes, check before planning','Classic route: Lohajung \u2192 Didna','Ali & Bedni Bugyal meadows','Bhagwabasa','Skeleton Lake 5,029m \u2192 return']},
{n:'Kalindi Khal',w:'Gangotri\u2192Badrinath, India',c:'dan',d:12,alt:5947,df:'Extreme (mountaineering)',bm:'Jun, Sep',it:['Gangotri \u2192 Bhojwasa \u2192 Gaumukh','Tapovan beneath Shivling','Vasuki Tal','Glacier camps + crevasse zones (rope required)','Kalindi Khal 5,947m crossing','Arwa valley \u2192 Badrinath']},
{n:'Snowman Trek',w:'Bhutan',c:'dan',d:25,alt:5320,df:'Extreme',bm:'Sep\u2013Oct',it:['Paro \u2192 Jomolhari base','Lingshi \u2192 Laya (5 days)','Eleven passes above 4,500m over two weeks','Lunana \u2014 the most remote district in the Himalaya','Exit via Sephu; fewer people finish it yearly than summit Everest']},
{n:'K2 Base Camp & Gondogoro La',w:'Pakistan Karakoram',c:'dan',d:14,alt:5585,df:'Extreme',bm:'Jul\u2013Aug',it:['Skardu \u2192 Askole','Baltoro glacier (4 days)','Concordia \u2014 amphitheatre of 8000m peaks','K2 Base Camp 5,150m','Cross Gondogoro La 5,585m (ropes, pre-dawn)','Exit Hushe valley']},
{n:'Huayhuash Circuit',w:'Peru',c:'dan',d:10,alt:5050,df:'Very hard',bm:'May\u2013Sep',it:['Huaraz \u2192 Quartelhuain','Five passes 4,600\u20135,050m across the week','Siula Grande viewpoint (Touching the Void)','Hot springs at Viconga','Exit Llamac']},
{n:'Transcaucasian Trail (Armenia leg)',w:'Armenia',c:'new',d:7,alt:3000,df:'Moderate',bm:'Jun\u2013Oct',it:['Dilijan \u2192 Parz Lake','Gosh village monasteries','Newly-cut single track through oak forests (route opened 2020s)','Haghartsin \u2192 Fioletovo','Vanadzor exit \u2014 you may meet zero other trekkers']},
{n:'Khimloga Pass',w:'Uttarakhand\u2013Himachal, India',c:'new',d:9,alt:5500,df:'Extreme',bm:'Jun, Sep',it:['Sankri \u2192 Taluka \u2192 Har ki Dun','Borasu junction camps','Khimloga 5,500m \u2014 crossed by only a handful of teams ever','Descend to Chitkul, India\u2019s \u201clast village\u201d','Buffer + exit day']},
{n:'Sinai Trail',w:'Egypt',c:'new',d:6,alt:2285,df:'Moderate',bm:'Oct\u2013Apr',it:['St Catherine start with Bedouin guides (community-created trail, 2015+)','Wadi crossings + desert camps','Jebel Abbas Basha','Mt Sinai sunrise 2,285m','Blue Desert exit \u2014 Egypt\u2019s first long-distance hiking trail']}
];
var trekF='all';
function trekFilter(btn){ trekF=btn.dataset.f; document.querySelectorAll('#trekChips .fchip').forEach(function(b){b.classList.toggle('on',b===btn);}); renderTreks(); }
var WISH=JSON.parse(lsGet('rw_wish')||'[]');
function wishTog(ev,id){ ev.stopPropagation();
  var i=WISH.indexOf(id);
  if(i<0){ WISH.push(id); ev.target.textContent='\u2665'; ev.target.style.color='#E8524A'; showToast('Saved to your list \u2665 (+5 XP)'); xpAdd(5,'Saved a dream'); }
  else { WISH.splice(i,1); ev.target.textContent='\u2661'; ev.target.style.color=''; }
  lsSet('rw_wish', JSON.stringify(WISH));
}
function wishHeart(id){ var on=WISH.indexOf(id)>-1;
  return '<span class="wsh" onclick="wishTog(event,\''+id.replace(/'/g,'')+'\')" style="cursor:pointer;font-size:17px;margin-left:auto;padding:0 4px;'+(on?'color:#E8524A':'color:var(--t3)')+'">'+(on?'\u2665':'\u2661')+'</span>'; }
function showSaved(){
  var ov=el('savedOverlay');
  if(!ov){ ov=document.createElement('div'); ov.id='savedOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="modal" style="max-width:400px"><button class="modal-close" onclick="el(\'savedOverlay\').classList.remove(\'open\')">\u00d7</button><div class="modal-head"><div class="modal-title">\u2665 Saved for later</div><div class="modal-sub">Your dream list</div></div><div class="modal-body" id="savedBody"></div></div>';
    document.body.appendChild(ov); }
  el('savedBody').innerHTML = WISH.length? WISH.map(function(w){ return '<div class="ti-day"><b>\u2665</b><span>'+w+'</span></div>'; }).join('') + '<button class="tact" style="width:100%;margin-top:10px" onclick="WISH=[];lsSet(\'rw_wish\',\'[]\');showSaved();renderTreks();renderExps()">Clear all</button>'
    : '<div class="mode-box">Nothing saved yet \u2014 tap the \u2661 on any trek or experience.</div>';
  ov.classList.add('open');
}
function renderTreks(){
  var g=el('trekGrid'); if(!g) return;
  var CATN={pop:'POPULAR',hid:'HIDDEN',dan:'DANGEROUS',new:'NEW'};
  g.innerHTML = TREKS.map(function(t,i){
    if(trekF!=='all' && t.c!==trekF) return '';
    return '<div class="trek" id="trek'+i+'">'
      +'<div class="trek-top"><div class="trek-name">'+t.n+'</div>'+wishHeart(t.n)+'<span class="tbadge '+t.c+'">'+CATN[t.c]+'</span></div>'
      +'<div class="trek-where">'+t.w+'</div>'
      +'<div class="trek-meta"><span class="tm"><b>'+t.d+'</b> days</span><span class="tm"><b>'+t.alt+'m</b> max</span><span class="tm">'+t.df+'</span><span class="tm">'+t.bm+'</span></div>'
      +'<div class="trek-itin">'+t.it.map(function(s,di){return '<div class="ti-day"><b>Day '+(di+1)+'</b><span>'+s+'</span></div>';}).join('')+'</div>'
      +'<div class="trek-acts"><button class="tact red" onclick="trekOpen('+i+')">\ud83d\uddfa\ufe0f Itinerary</button><button class="tact" onclick="trekMap('+i+')">\ud83d\udccd Map</button><button class="tact" onclick="shareTrek('+i+')">\ud83d\udce4 Share</button></div>'
      +'</div>';
  }).join('') + adCard(1);
}
function trekMap(i){ var t=TREKS[i]; window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(t.n+' trek '+t.w),'_blank'); }
var trekXPd={};
function trekOpen(i){
  var c=el('trek'+i); if(!c) return; c.classList.toggle('open');
  if(c.classList.contains('open') && !trekXPd[i]){ trekXPd[i]=1; xpAdd(5,'Trek scouted'); }
}

/* ===== FRESH EXPERIENCES ===== */
var EXPS=[
{ic:'\ud83e\udeb8',n:'Bioluminescent kayaking',w:'Havelock, Andamans',x:'Paddle through water that glows electric blue with every stroke \u2014 new-moon nights only.',t:'Nov\u2013Feb, moonless nights'},
{ic:'\ud83d\udd2d',n:'Hanle Dark Sky Reserve',w:'Ladakh, India',x:'India\u2019s first astro-village at 4,500m \u2014 homestays with telescopes and Milky Way so bright it casts shadows.',t:'Apr\u2013Sep'},
{ic:'\ud83d\udc06',n:'Snow leopard tracking',w:'Spiti / Ulley, Ladakh',x:'Winter expeditions with local spotters \u2014 sightings now more likely than ever thanks to community conservation.',t:'Jan\u2013Mar'},
{ic:'\ud83c\udfb6',n:'Ziro Festival homestays',w:'Arunachal, India',x:'Indie music in a rice-valley amphitheatre, staying with Apatani families.',t:'Sep'},
{ic:'\ud83c\udf09',n:'Living root bridge trek',w:'Meghalaya, India',x:'Sleep in Nongriat village between double-decker bridges grown \u2014 not built \u2014 over centuries.',t:'Oct\u2013Apr'},
{ic:'\u2728',n:'Firefly synchronous bloom',w:'Bhandardara, Maharashtra',x:'For 2\u20133 weeks pre-monsoon, entire valleys blink in sync. Camp it.',t:'Late May\u2013Jun'},
{ic:'\ud83e\uddca',n:'Glacier lagoon kayaking',w:'J\u00f6kuls\u00e1rl\u00f3n, Iceland',x:'Paddle between calving icebergs where seals surface beside your boat.',t:'Jun\u2013Sep'},
{ic:'\ud83c\udfdc\ufe0f',n:'Rann Utsav full-moon night',w:'Kutch, Gujarat',x:'White salt desert glowing under the moon \u2014 time your visit to purnima.',t:'Nov\u2013Feb'},
{ic:'\ud83c\udf88',n:'Cappadocia balloon dawn',w:'T\u00fcrkiye',x:'A hundred balloons over fairy chimneys \u2014 book the 1st morning of your stay; weather cancels ~30%.',t:'Apr\u2013Jun, Sep\u2013Oct'},
{ic:'\ud83c\udf05',n:'Midnight-sun sailing',w:'Svalbard / Lofoten',x:'Sail at 2am in full daylight past walrus colonies \u2014 the strangest jetlag of your life.',t:'Jun\u2013Jul'},
{ic:'\ud83c\ud337',n:'Tulip bloom + shikara',w:'Srinagar, Kashmir',x:'Asia\u2019s largest tulip garden peaks for ~3 weeks against the Zabarwan range.',t:'Late Mar\u2013mid Apr'},
{ic:'\ud83c\udfe1',n:'Kumaoni village slow-stay',w:'Almora belt, Uttarakhand',x:'Terrace-farm mornings, oak forests, no itinerary \u2014 the anti-trip that fixes burnout.',t:'Year-round; Mar\u2013Jun best'}
];
function renderExps(){
  var g=el('expGrid'); if(!g) return;
  g.innerHTML = EXPS.map(function(e){
    return '<div class="exp"><div class="exp-ic" style="display:flex;align-items:center">'+e.ic+wishHeart(e.n)+'</div><div class="exp-name">'+e.n+'</div><div class="exp-where">'+e.w+'</div><div class="exp-desc">'+e.x+'</div><div class="exp-when">\ud83d\uddd3 '+e.t+'</div></div>';
  }).join('');
}
renderTreks(); renderExps();

/* ===== TRAVEL MODES ===== */
var MODES={
 std:null,
 ev:{ic:'\u26a1',n:'EV road trip',m:1.05,t:'Plan legs of 200\u2013250km between charges and always know your next TWO chargers. India: PlugShare + Statiq/Tata Power apps; Europe/US: ABRP (A Better Routeplanner) is the gold standard. Hotels with destination chargers turn charging time into sleep time.'},
 walk:{ic:'\ud83d\udeb6',n:'Walk / slow travel',m:0.55,t:'Budget drops ~45% \u2014 your feet are free. Plan 15\u201320km/day max with a rest day every 4th. One town per 2\u20133 days beats five towns in five days, and you\u2019ll actually remember them.'},
 cycle:{ic:'\ud83d\udeb4',n:'Cycle touring',m:0.6,t:'50\u201380km/day loaded is sustainable. Warmshowers.org = free stays with cyclist hosts worldwide. Pack spare spokes \u2014 the one part no small-town shop stocks.'},
 hybrid:{ic:'\ud83d\udd04',n:'Hybrid',m:0.9,t:'Trains/buses between hubs + walk/cycle within them \u2014 the efficiency sweet spot. Book long legs early, keep local days unplanned.'},
 lux:{ic:'\u2728',n:'Luxury',m:3.2,t:'Book marquee hotels 3+ months out but leave 30% of nights flexible for upgrades. Shoulder season = same suites, 40% less, emptier spas. A private guide for day one recalibrates the whole trip.'},
 eco:{ic:'\ud83c\udf3f',n:'Eco / sustainable',m:0.75,t:'Trains over flights where under 8hr, homestays over chains, refill over bottled. One long trip beats three short ones \u2014 in both carbon and depth.'}
};
var EV_BENCH = [
 ['🚗 Car','Lucid Air Grand Touring — <b>512 mi / 824 km</b> EPA, the only production EV above 500 mi. Efficiency king: 410 real-world miles from just 112 kWh.'],
 ['⚡ Fast charge','Mercedes CLA: 320 kW — 10–80% in ~20 min. Lucid Gravity: ~200 mi added in 15 min. 800V architecture is the spec to look for.'],
 ['🏍️ Motorcycle','Verge TS Pro (solid-state) — up to <b>~600 km</b> claimed, +300 km in 10 min. India champion: Ultraviolette F77 Mach 2 — ~323 km IDC.'],
 ['🚲 E-cycle','Optibike R22 Everest — ~<b>480 km</b> claimed (3.26 kWh, biggest production e-bike pack). Typical tourers: 80–150 km.'],
 ['🚌 Bus','Ebusco 3.0 — up to <b>~700 km</b> claimed (lightweight composite body); BYD/Yutong city buses commonly 400–500+ km.'],
 ['🚛 Truck','Chevy Silverado EV — <b>493 mi / 793 km</b> EPA (pickup, 200 kWh). Heavy haul: Tesla Semi — ~500 mi loaded.']
];
function evBenchTable(){
  return '<div class="evb"><div class="evb-title">⚡ EV range benchmarks — mid-2026</div><table>'
    + EV_BENCH.map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>';}).join('')
    + '</table><div class="src">EPA / WLTP / IDC / manufacturer figures; real-world is typically 10–30% lower (more in cold or hills).</div></div>';
}
function modeBox(d){
  var k = (el('tmode')||{}).value||'std';
  var m = MODES[k]; if(!m) return '';
  var adj = fmtMoney(Math.round(d.cost.mid*m.m));
  return '<div class="mode-box">'+m.ic+' <b>'+m.n+' mode:</b> adjusted budget ~<b>'+adj+'</b>. '+m.t+(k==='ev'? evBenchTable():'')+'</div>';
}
/* ===== COMMUTE & TRACK ===== */
function mapsRoute(dest){
  var o=(el('origin')||{}).value||'';
  return 'https://www.google.com/maps/dir/?api=1'+(o?'&origin='+encodeURIComponent(o):'')+'&destination='+encodeURIComponent(dest)+'&travelmode=driving';
}
function openStrava(){
  var t0=Date.now();
  window.location.href='strava://record';
  setTimeout(function(){ if(!document.hidden && Date.now()-t0<2200) window.open('https://www.strava.com/mobile','_blank'); },1300);
  xpAdd(5,'Tracking armed');
}
function shareLive(dest){
  var txt='🛰️ Heading to '+dest+'! Tracking my route — planned with RoamWise 🥷 '+APP_URL_SHARE;
  window.open('https://wa.me/?text='+encodeURIComponent(txt),'_blank');
}
function trackBar(d){
  var full=d.name+', '+(d.country||'');
  var safe=d.name.replace(/[^A-Za-z0-9 ,-]/g,'');
  return '<div class="sec-label">🛰️ Commute & track</div><div class="track-bar">'
    +'<a class="track-btn" href="'+mapsRoute(full)+'" target="_blank" rel="noopener">🗺️ Route in Maps</a>'
    +'<button class="track-btn strava" onclick="openStrava()">🟠 Record in Strava</button>'
    +'<button class="track-btn" onclick="shareLive(&quot;'+safe+'&quot;)">📡 Share live plan</button>'
    +'</div>';
}

/* ===== FESTIVALS / EVENTS ===== */
var FESTS={'India':{2:'Holi \u2014 the festival of colours',10:'Diwali \u2014 the festival of lights'},'Thailand':{3:'Songkran water festival',10:'Loy Krathong lantern nights'},'Japan':{2:'Cherry blossom season begins',3:'Peak sakura + hanami picnics',6:'Gion Matsuri, Kyoto'},'Germany':{8:'Oktoberfest, Munich'},'Spain':{7:'La Tomatina, Bu\u00f1ol',6:'San Ferm\u00edn, Pamplona'},'Brazil':{1:'Carnival \u2014 Rio explodes'},'Mexico':{10:'D\u00eda de los Muertos'},'Italy':{1:'Venice Carnival masks'},'Turkey':{6:'Cappadocia hot-air balloon festival'},'Vietnam':{0:'T\u1ebft \u2014 Lunar New Year',1:'T\u1ebft \u2014 Lunar New Year'},'Indonesia':{2:'Nyepi \u2014 Bali\u2019s day of total silence'},'Nepal':{9:'Dashain \u2014 the biggest festival',10:'Tihar lights'},'United Kingdom':{7:'Edinburgh Fringe \u2014 world\u2019s biggest arts fest',11:'Hogmanay, Scotland'},'France':{6:'Bastille Day + Tour de France'},'United States':{6:'July 4th fireworks everywhere'},'China':{0:'Chinese New Year',1:'Lantern Festival'},'Peru':{5:'Inti Raymi sun festival, Cusco'},'Morocco':{5:'F\u00e8s Festival of Sacred Music'}};
function festLine(d, mi, month){
  var f = FESTS[d.country]; if(!f || !(mi in f)) return '';
  return '<div class="fest-line">\ud83c\udf89 '+f[mi]+' happens in '+month+' \u2014 plan around it (or into it)!</div>';
}
/* ==================== TRIP MERCH ====================
   HONEST ROUTING, because the obvious idea doesn't work:
   Blinkit and Zepto are 10-minute delivery of STOCKED goods. They do not print
   anything on demand — no quick-commerce platform does, because printing +
   curing + QC takes hours at best. So:
     - CUSTOM printed tee  -> print-on-demand (Qikink / Printrove, India, both
       have dropship APIs). 4-7 days, so it's an order-before-you-go product,
       or ship-to-hotel if the trip is a week out.
     - NEED IT TODAY at the destination -> stock beachwear via Blinkit/Zepto/
       Myntra deep links. Plain, but it arrives.
   Saying "custom tee in 10 minutes at the beach" would be a lie that generates
   refunds and one-star reviews, so the UI states the timeline up front.

   Artwork uses Pollinations (free, keyless, no signup) — verified returning
   real 768x768 JPEGs. */
var RW_SLOGAN_BANK = {
  _pattern: [
    '{P} ka {N}, mind kare {R}',
    '{P} mein {N}, tension ko {R}',
    'Dil bola {P}, dimaag bola {R}',
    '{P} calling \u2014 excuses on hold',
    'Kam paisa, zyada {P}',
    '{P} ke aage {R} nahi',
    'Roz ka traffic vs {P} ka {N}',
    'Ek ticket {P} ka, ek zindagi apni',
    '{P} \u2014 jahaan clock band ho jaati hai',
    'Boss ne kaha no. {P} ne kaha chal.'
  ],
  goa:      {N:['breeze','susegad','sunset'], R:['freeze','please','tease'], extra:['Susegad mode: ON','Beach pe body, office mein soul nahi','Feni first, questions later','Goa ka scene, baaki sab routine']},
  manali:   {N:['thand','pahaad','sukoon'], R:['band','anand','majboor'], extra:['Maggi at 3000m hits different','Oxygen kam, attitude zyada','Pahaad bulaye, boss ruk jaye','Snow pe photo, dil pe kabza']},
  leh:      {N:['height','sannata','raasta'], R:['light','shaanta','waasta'], extra:['18,000 ft aur still chill','Ladakh: jahaan network bhi haar gaya','Pangong ya kuch nahi','Road trip? Ye road hi trip hai']},
  jaipur:   {N:['rang','kila','shaan'], R:['sang','dila','jaan'], extra:['Pink city, full colour','Rajaon wali feeling','Hawa Mahal, hawa hi hawa']},
  rishikesh:{N:['dhaara','shanti','raftaar'], R:['sahaara','kranti','rehdaar'], extra:['Ganga ke saath, dimaag shaant','Rafting: darr ke aage paani hai','Yoga subah, chai shaam']},
  udaipur:  {N:['jheel','mahal','sheher'], R:['feel','kamaal','behtar'], extra:['Lake city, full filmy','Sunset pe boat, dil pe note']},
  varanasi: {N:['aarti','ghaat','subah'], R:['baat','saath','wah'], extra:['Kashi: sabse purani, sabse zinda','Ghaat pe baith, life samajh']},
  kerala:   {N:['backwater','haryali','naariyal'], R:['better','khushali','kamaal'],extra:['God\u2019s own, phone off','Houseboat pe ghar jaisa']},
  _default: {N:['hawa','safar','raasta'], R:['dawa','asar','waasta'], extra:['Bags packed, excuses unpacked','Kam din, zyada kahaani','Ghoomna zaroori hai']}
};
function rwSlogans(place, n){
  var key = String(place||'').toLowerCase().trim();
  var bank = RW_SLOGAN_BANK[key] || RW_SLOGAN_BANK._default;
  var P = String(place||'Safar').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  var out = (bank.extra||[]).slice();
  RW_SLOGAN_BANK._pattern.forEach(function(pat){
    var N = bank.N[Math.floor(Math.random()*bank.N.length)];
    var R = bank.R[Math.floor(Math.random()*bank.R.length)];
    out.push(pat.replace(/\{P\}/g,P).replace(/\{N\}/g,N).replace(/\{R\}/g,R));
  });
  /* de-dupe, shuffle lightly, cap */
  out = out.filter(function(x,i,a){ return a.indexOf(x)===i; });
  for(var i=out.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=out[i]; out[i]=out[j]; out[j]=t; }
  return out.slice(0, n||8);
}
/* free, keyless AI artwork */
function rwArtURL(prompt, w, h){
  return 'https://image.pollinations.ai/prompt/'+encodeURIComponent(prompt)
    +'?width='+(w||768)+'&height='+(h||768)+'&nologo=true&seed='+Math.floor(Math.random()*99999);
}
var RW_ART_STYLES = [
  ['Retro poster','vintage 1970s travel poster, flat colour, screen print, bold'],
  ['Line art',    'minimal single-line ink drawing, white on dark, elegant'],
  ['Watercolour', 'loose watercolour wash, soft edges, artistic'],
  ['Bold graphic','high contrast graphic tee print, thick outlines, streetwear']
];
/* Retail Rs 499; POD base for a printed tee in India runs ~Rs 280-330 incl.
   shipping, so the margin below is real and conservative. */
var RW_MERCH = { retail:499, podCost:315, get margin(){ return this.retail - this.podCost; } };

function rwMerchHTML(place){
  var P = String(place||'your trip');
  var sl = rwSlogans(place, 6);
  var art = rwArtURL(P+' travel, '+RW_ART_STYLES[0][1], 512, 512);
  return '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,#7C3AED,#0A0A0C)">'
    +'<div class="tk-place">\ud83d\udc55 '+esc2(P)+' tee</div>'
    +'<div class="tk-meta">Your slogan, your artwork, printed and shipped</div></div>'
    +'<div class="tk-sec"><div class="tk-lab">Pick a line (or write your own)</div>'
    +'<div class="tk-chips">'
    + sl.map(function(x){ return '<button class="tk-chip" onclick="rwMerchPick(this)" data-sl="'+esc2(x)+'">'+esc2(x)+'</button>'; }).join('')
    +'</div>'
    +'<input id="merchSlogan" class="k-inp" placeholder="\u2026or type your own line" style="width:100%;margin-top:9px" value="'+esc2(sl[0])+'">'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">Artwork style</div>'
    +'<div class="tk-chips">'
    + RW_ART_STYLES.map(function(a,i){ return '<button class="tk-chip'+(i===0?' gold':'')+'" onclick="rwMerchArt('+i+',\''+P.replace(/'/g,'')+'\',this)">'+a[0]+'</button>'; }).join('')
    +'</div>'
    +'<div style="margin-top:10px;border-radius:14px;overflow:hidden;border:1px solid var(--b2,#2A2A36);background:#000;aspect-ratio:1;position:relative">'
    +'<img id="merchArt" src="'+art+'" style="width:100%;height:100%;object-fit:cover;display:block" alt="">' 
    +'<div id="merchOverlay" style="position:absolute;left:0;right:0;bottom:0;padding:14px;background:linear-gradient(0deg,rgba(0,0,0,.82),transparent);'
    +'font-weight:900;font-size:17px;text-align:center;text-shadow:0 2px 12px rgba(0,0,0,.9)">'+esc2(sl[0])+'</div></div>'
    +'<div style="font-size:10px;color:var(--t3);margin-top:6px">Artwork generated free via Pollinations \u00b7 regenerate as often as you like</div>'
    +'</div>'
    +'<div class="tk-sec"><div class="tk-lab">How it gets to you</div>'
    +'<div class="tk-bul"><b>Printed &amp; shipped \u2014 4\u20137 days.</b> Order before you travel, or ship to your hotel if the trip is a week out.</div>'
    +'<div class="tk-bul"><b>Need something today at the destination?</b> Nobody prints custom in 10 minutes \u2014 quick-commerce carries stock only. Use the buttons below for plain beachwear that actually arrives.</div>'
    +'<div class="tk-chips" style="margin-top:8px">'
    +'<button class="tk-chip gold" onclick="rwMerchOrder(\''+P.replace(/'/g,'')+'\')">\ud83d\udc55 Order custom \u2014 \u20b9'+RW_MERCH.retail+'</button>'
    +'<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.myntra.com/beachwear">\ud83c\udfd6\ufe0f Stock beachwear</a>'
    +'<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://blinkit.com/s/?q=t-shirt">\u26a1 Blinkit (stock)</a>'
    +'</div></div></div>';
}
function rwMerchPick(btn){
  var v=btn.dataset.sl||'';
  var inp=el('merchSlogan'); if(inp) inp.value=v;
  var ov=el('merchOverlay'); if(ov) ov.textContent=v;
}
function rwMerchArt(i, place, btn){
  var a=RW_ART_STYLES[i]; if(!a) return;
  [].forEach.call(btn.parentNode.querySelectorAll('.tk-chip'), function(b){ b.classList.remove('gold'); });
  btn.classList.add('gold');
  var img=el('merchArt'); if(img) img.src = rwArtURL(place+' travel, '+a[1], 512, 512);
}
function rwMerchOrder(place){
  var slogan = (el('merchSlogan')||{}).value || '';
  var art = (el('merchArt')||{}).src || '';
  if(!slogan.trim()){ showToast('Add a line first'); return; }
  var ov=el('merchOverlayBox');
  if(!ov){
    ov=document.createElement('div'); ov.id='merchOverlayBox'; ov.className='overlay';
    ov.innerHTML='<div class="sheet"><div class="sheet-head"><b>\ud83d\udc55 Order your tee</b><button class="x" onclick="rwOverlayClose(\'merchOverlayBox\')">\u2715</button></div>'
      +'<div id="merchOrderBody" style="overflow-y:auto;flex:1 1 auto;min-height:0;padding:4px 2px 16px"></div></div>';
    document.body.appendChild(ov);
  }
  el('merchOrderBody').innerHTML =
     '<img src="'+art+'" style="width:100%;border-radius:12px;border:1px solid var(--b2,#2A2A36)">'
    +'<div style="font-weight:900;font-size:15px;text-align:center;margin:9px 0">'+esc2(slogan)+'</div>'
    +'<div class="key-box"><div class="key-box-name">Size</div>'
    +'<div class="tk-chips" style="margin-top:6px">'
    + ['S','M','L','XL','XXL'].map(function(z,i){ return '<button class="tk-chip'+(i===2?' gold':'')+'" onclick="[].forEach.call(this.parentNode.children,function(b){b.classList.remove(\'gold\')});this.classList.add(\'gold\');window._merchSize=\''+z+'\'">'+z+'</button>'; }).join('')
    +'</div></div>'
    +'<div class="key-box" style="margin-top:9px"><div class="key-box-name">Deliver to</div>'
    +'<input id="merchAddr" class="k-inp" placeholder="Full address with PIN code" style="width:100%;margin-top:6px">'
    +'<input id="merchPhone" class="k-inp" placeholder="Phone for the courier" style="width:100%;margin-top:7px">'
    +'<div class="key-box-hint" style="margin-top:6px">Shipping to a hotel? Add the hotel name and your check-in date so they hold it.</div></div>'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:14px">'
    +'<span>Total</span><b style="font-size:19px;color:var(--gold,#E8BA6C)">\u20b9'+RW_MERCH.retail+'</b></div>'
    +'<div style="font-size:10.5px;color:var(--t3);line-height:1.6;margin-top:4px">Printed on demand in India \u00b7 4\u20137 days \u00b7 free replacement for print defects.</div>'
    +'<button class="g-btn" style="width:100%;min-height:46px;margin-top:12px" onclick="rwMerchSubmit(\''+place.replace(/'/g,'')+'\')">Place order \u2192</button>'
    +'<p style="font-size:10.5px;color:var(--t3);margin-top:9px">Your order goes to RoamWise, who sends it to the print partner. You will get a tracking link by email.</p>';
  window._merchSize = window._merchSize || 'L';
  rwOverlayOpen('merchOverlayBox');
}
function rwMerchSubmit(place){
  var slogan=(el('merchSlogan')||{}).value||'', addr=(el('merchAddr')||{}).value||'',
      phone=(el('merchPhone')||{}).value||'', art=(el('merchArt')||{}).src||'';
  if(!addr.trim() || !phone.trim()){ showToast('Address and phone, please'); return; }
  var order = { place:place, slogan:slogan, art:art, size:window._merchSize||'L',
                addr:addr.trim(), phone:phone.trim(), retail:RW_MERCH.retail,
                status:'new', at:new Date().toISOString(),
                uid:(window.user&&user.uid)||null, email:(window.user&&user.email)||null };
  function done(){
    el('merchOrderBody').innerHTML='<div style="text-align:center;padding:26px 10px">'
      +'<div style="font-size:42px">\ud83d\udc55</div>'
      +'<b style="display:block;font-size:16px;margin-top:8px">Order received</b>'
      +'<p style="font-size:12.5px;color:var(--t2);line-height:1.6;margin-top:8px">It goes to the print partner today. Tracking arrives by email in 1\u20132 days, delivery in 4\u20137.</p></div>';
  }
  if(!window.db || !window.user || !user.uid){
    showToast('Sign in first \u2014 the order needs an account to track it');
    try{ openAuth(); }catch(e){}
    return;
  }
  db.collection('merch').add(order).then(done).catch(function(e){
    var m = (e && e.code==='permission-denied')
      ? 'Order blocked by the server. If you were just signed out, sign in and retry.'
      : ('Could not place order: '+((e&&e.message)||e));
    el('merchOrderBody').insertAdjacentHTML('afterbegin',
      '<div style="background:rgba(224,91,91,.1);border:1px solid rgba(224,91,91,.35);border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:12px">'+esc2(m)+'</div>');
  });
}
