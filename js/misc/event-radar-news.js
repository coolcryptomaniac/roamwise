// @ts-nocheck
// EVENT RADAR + TRAVEL PULSE NEWS — extracted verbatim from app.js
// (modularization round 4). Two related home-screen live-info panels:
// (1) Event Radar — the hardcoded `EVENTS` list of world-scale travel
// triggers (World Cup, Olympics, stadium tours, etc.) with activeEvents/
// renderEventBanner/eventPlan/renderEvents/renderSpotlight; (2) Travel Pulse
// News — renderNewsPulse/rwNewsPulseFallback, which reads news.json and
// falls back to curated + AI-crunched tips. Distinct from the unrelated
// `RW_EVENTS` partner-directory data in events-data.js / js/misc/events.js.
// Depends on runtime globals from app.js (el, tabGo, showToast, esc2,
// rwOpenSection, track, DB) and js/copilot/ai-providers.js (aiCallAny) —
// all resolved at call time, so load order relative to those files doesn't
// matter. Called from js/boot/init.js's boot sequence.
/* ===== EVENT RADAR/* ===== EVENT RADAR — the world's biggest moments as travel triggers ===== */
var EVENTS=[
{id:'fifa26',ic:'\u26bd',n:'FIFA World Cup 2026',from:'2026-06-11',to:'2026-07-19',city:'New York',month:6,ac:'#1F8A3B',
 places:'USA \u00b7 Mexico \u00b7 Canada \u2014 16 host cities',idea:'Fan-fest cities beat stadium cities on price: watch group games in Mexico City (electric + cheap), semis atmosphere in NYC. Book stays 40km out on transit lines \u2014 half price, 30 min in.'},
{id:'iphone26',ic:'\ud83d\udcf1',n:'iPhone launch week',from:'2026-09-07',to:'2026-09-20',city:'Dubai',month:8,ac:'#8E8E93',
 places:'Dubai \u00b7 Singapore \u00b7 NYC 5th Ave',idea:'Launch-day tourism is real: Dubai Mall and Singapore Orchard get the first stock hours ahead of the West \u2014 pair a city break with a day-one pickup and skip home-country markups.'},
{id:'wc27',ic:'\ud83c\udfcf',n:'ICC Cricket World Cup 2027',from:'2027-10-01',to:'2027-11-15',city:'Cape Town',month:9,ac:'#D4A017',
 places:'South Africa \u00b7 Zimbabwe \u00b7 Namibia',idea:'The first African ODI World Cup in decades \u2014 combine Newlands cricket with the Garden Route. Book Cape Town stays 9+ months out; match-week prices triple.'},
{id:'la28',ic:'\ud83c\udfc5',n:'LA Olympics 2028',from:'2028-07-14',to:'2028-07-30',city:'Los Angeles',month:6,ac:'#E8524A',
 places:'Los Angeles, USA',idea:'Olympic cities empty out AROUND the venues \u2014 Santa Monica and Malibu run below normal occupancy while Downtown surges. Stay coastal, train in.'},
{id:'expo',ic:'\ud83c\udfd7\ufe0f',n:'Next mega-tower & expo watch',from:'2026-01-01',to:'2028-12-31',city:'Riyadh',month:10,ac:'#9B59F5',
 places:'Jeddah Tower \u00b7 Riyadh Expo 2030 build-up',idea:'Skyline tourism: Jeddah Tower aims to take the world-tallest crown from Burj Khalifa \u2014 the construction-boom years are the cheap years to see a city being born.'},
{id:'concerts',ic:'\ud83c\udfa4',n:'Stadium tour season',from:'2026-05-01',to:'2026-09-30',city:'London',month:6,ac:'#FF5CA8',
 places:'Global stadium tours \u2014 pop\u2019s biggest names',idea:'Concert arbitrage: the same world tour costs 40\u201360% less in Warsaw, Bangkok or S\u00e3o Paulo than London or NYC \u2014 fly there, see the show, get a holiday free.'},
{id:'f1',ic:'\ud83c\udfce\ufe0f',n:'F1 season flyaways',from:'2026-03-01',to:'2026-11-30',city:'Singapore',month:8,ac:'#E10600',
 places:'Singapore night race \u00b7 Monaco \u00b7 Suzuka',idea:'Singapore\u2019s night GP is the most tourist-perfect race \u2014 the track wraps the city, so a regular hotel IS a grandstand. Book Marina Bay view rooms 6 months out.'},
{id:'lambo',ic:'\ud83d\udc02',n:'Supercar launch pilgrimages',from:'2026-01-01',to:'2026-12-31',city:'Bologna',month:4,ac:'#DDB321',
 places:'Sant\u2019Agata (Lamborghini) \u00b7 Maranello (Ferrari)',idea:'Italy\u2019s Motor Valley: factory museums, test-track days and launch events cluster around Bologna \u2014 one base, three legendary marques, best in spring.'}];
function activeEvents(){ var t=new Date().toISOString().slice(0,10);
  return EVENTS.filter(function(e){ return e.from<=t && t<=e.to; }); }
function renderEventBanner(){
  var live=activeEvents(); if(!live.length) return;
  var e=live[0];
  var b=document.createElement('div');
  b.style.cssText='position:sticky;top:52px;z-index:60;margin:0 12px;border-radius:12px;padding:9px 14px;display:flex;align-items:center;gap:9px;font-size:12px;font-weight:700;color:#fff;background:linear-gradient(90deg,'+e.ac+'CC,'+e.ac+'66);border:1px solid '+e.ac+';cursor:pointer;animation:fadeup .5s ease';
  b.innerHTML=e.ic+' <span>'+e.n+' is LIVE \u2014 plan the trip \u2192</span>';
  b.onclick=function(){ eventPlan(e.id); };
  var host=document.querySelector('.hero-sky'); if(host) host.parentNode.insertBefore(b, host);
}
function eventPlan(id){
  var e=EVENTS.find(function(x){return x.id===id;}); if(!e) return;
  var i=el('destInput'); if(i) i.value=e.city;
  var m=el('month'); if(m) m.selectedIndex=e.month;
  tabGo('plan'); showToast(e.ic+' '+e.n+' \u2014 destination & month pre-filled. Hit Search!');
  try{ track('event_plans'); }catch(x){ /* analytics best-effort, ignore */ }
}
function renderEvents(){
  var g=el('evtGrid'); if(!g) return;
  var t=new Date().toISOString().slice(0,10);
  g.innerHTML = EVENTS.map(function(e){
    var live = e.from<=t && t<=e.to;
    return '<div class="exp" style="border-color:'+e.ac+'55">'
      +'<div class="exp-ic">'+e.ic+(live?' <span style="font-size:9px;color:#fff;background:'+e.ac+';border-radius:99px;padding:2px 8px;vertical-align:middle">LIVE NOW</span>':'')+'</div>'
      +'<div class="exp-name">'+e.n+'</div><div class="exp-where">'+e.places+'</div>'
      +'<div class="exp-desc">'+e.idea+'</div>'
      +'<button class="tact red" style="margin-top:9px;width:100%" onclick="eventPlan(\''+e.id+'\')">'+(live?'\ud83d\udd25 Plan it now':'\ud83d\uddd3 Build the itinerary')+'</button></div>';
  }).join('');
}
function renderSpotlight(){
  var host=el('brief'); if(!host) return;
  var live=activeEvents(), e=live[0];
  var doy=Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0))/864e5);
  var dod=(typeof DB!=='undefined' && DB.length)? DB[doy%DB.length] : null;
  var title, sub, city, ac, yt;
  if(e){ title=e.ic+' '+e.n; sub=e.idea; city=e.city; ac=e.ac; yt=e.n+' travel guide'; }
  else if(dod){ title='\ud83c\udf0d Spotlight: '+dod.name; sub='Today\u2019s destination of the day \u2014 tap Plan for the crowd calendar, budget and itinerary.'; city=dod.name; ac='#C8913E'; yt=dod.name+' travel guide 4k'; }
  else return;
  var card=document.createElement('div');
  card.className='exp';
  card.style.cssText='margin:12px 0 0;border-color:'+ac+'66;background:linear-gradient(135deg,'+ac+'14,transparent)';
  card.innerHTML='<div class="exp-ic">\ud83c\udfaf <span style="font-size:9px;color:#fff;background:'+ac+';border-radius:99px;padding:2px 8px;vertical-align:middle">TODAY\u2019S THEME</span></div>'
    +'<div class="exp-name">'+title+'</div>'
    +'<div class="exp-desc">'+sub+'</div>'
    +'<div style="display:flex;gap:7px;margin-top:10px">'
    +'<button class="tact red" style="flex:1" onclick="'+(e? 'eventPlan(\''+e.id+'\')' : '(function(){el(\'destInput\').value=\''+city.replace(/'/g,'')+'\';tabGo(\'plan\')})()')+'">\ud83d\uddd3 Plan this</button>'
    +'<a class="tact" style="flex:1;text-align:center;text-decoration:none" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query='+encodeURIComponent(yt)+'">\u25b6 Watch</a></div>'
    +'<div style="font-size:10px;color:var(--gold2);margin-top:8px">\ud83d\udd25 Founding offer live: lifetime Pro \u20b9100 \u2014 rises after the first wave</div>';
  host.appendChild(card);
}
/* ===== TRAVEL PULSE NEWS — daily-crunched, honest about not being live-live ===== */
function renderNewsPulse(){
  var g=el('newsGrid'); if(!g) return;
  var done=false;
  var giveUp=setTimeout(function(){ if(done) return; done=true; rwNewsPulseFallback(g); }, 6000);
  fetch('news.json',{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(d){
    if(done) return; done=true; clearTimeout(giveUp);
    if(!d.items || !d.items.length){ rwNewsPulseFallback(g); return; }
    var upd=d.updated? new Date(d.updated) : null;
    var when = upd? upd.toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '';
    g.innerHTML = d.items.map(function(it){
      return '<div class="exp"><div class="exp-ic">\ud83d\udcf0</div>'
        +'<div class="exp-where" style="color:var(--gold2);font-size:10.5px;text-transform:uppercase;letter-spacing:.06em">'+(it.tag||'Travel')+'</div>'
        +'<div class="exp-name" style="font-size:14.5px">'+String(it.crunch||it.headline||'').replace(/[<>]/g,'')+'</div>'
        +'<div class="exp-desc" style="font-size:11px;color:var(--t3)">'+(it.source||'')+(when? ' \u00b7 '+when:'')+'</div>'
        +(it.url? '<a class="tact" style="display:block;text-align:center;text-decoration:none;margin-top:9px;font-size:12px" target="_blank" rel="noopener" href="'+it.url+'">Read more \u2192</a>' : '')
        +'</div>';
    }).join('');
  }).catch(function(){
    if(done) return; done=true; clearTimeout(giveUp);
    rwNewsPulseFallback(g);
  });
}
/* When there's no daily news.json (no backend cron yet), populate the pulse with
   AI-generated fresh travel headlines so the section is never empty. Falls back
   to curated evergreen tips if the AI engine isn't reachable. */
function rwNewsPulseFallback(g){
  var CURATED=[
    {tag:'Visa', crunch:'Thailand, Malaysia & Sri Lanka keep visa-free/eVisa access for Indians — check the latest window before booking.', source:'Travel desk'},
    {tag:'Money', crunch:'UPI now works at many merchants in UAE, Singapore, France & Sri Lanka — carry less forex.', source:'Payments'},
    {tag:'Season', crunch:'Monsoon (Jun–Sep) is the cheapest window for Goa, Kerala & the Western Ghats if you don\u2019t mind rain.', source:'Seasonal'},
    {tag:'Rail', crunch:'IRCTC opens bookings 60 days ahead — set an alarm for Himalayan toy-train and Vande Bharat routes.', source:'Rail'},
    {tag:'Safety', crunch:'High-altitude trips (Leh, Spiti) need 48h acclimatisation — plan a slow first two days.', source:'Health'}
  ];
  function paint(items){
    var when=new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short'});
    g.innerHTML=items.map(function(it){
      return '<div class="exp"><div class="exp-ic">\ud83d\udcf0</div>'
        +'<div class="exp-where" style="color:var(--gold2);font-size:10.5px;text-transform:uppercase;letter-spacing:.06em">'+esc2(it.tag||'Travel')+'</div>'
        +'<div class="exp-name" style="font-size:14.5px">'+esc2(String(it.crunch||'')).replace(/[<>]/g,'')+'</div>'
        +'<div class="exp-desc" style="font-size:11px;color:var(--t3)">'+esc2(it.source||'RoamWise')+' \u00b7 '+when+'</div>'
        +'</div>';
    }).join('');
    var sec=el('newspulse'); if(sec) rwOpenSection(sec.id);
  }
  paint(CURATED); /* show curated instantly */
  /* then try to upgrade with AI-crunched fresh angles (best-effort) */
  if(typeof aiCallAny==='function'){
    var prompt='Give 5 short, useful, CURRENT-style travel tips for Indian travellers (visa windows, best seasons, money/UPI abroad, rail booking, safety). Each: a 2-4 word TAG, then a one-sentence crunch under 22 words. Format each line as TAG | crunch. No preamble.';
    aiCallAny(prompt, 300, function(err,txt){
      if(!txt) return;
      var items=txt.split('\n').map(function(l){ var p=l.split('|'); return p.length>=2?{tag:p[0].replace(/^[-*\d.\s]+/,'').trim(), crunch:p.slice(1).join('|').trim(), source:'AI travel desk'}:null; }).filter(Boolean);
      if(items.length>=3) paint(items.slice(0,6));
    });
  }
}

