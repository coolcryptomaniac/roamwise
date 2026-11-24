// @ts-nocheck
/* Ailon's itinerary-first safety net. Classic browser script, no paid AI.
   A clear planning request must not turn into unrelated Wikipedia search when
   the hosted AI quota is exhausted. Specific seed attractions below are
   anchored to official district/India Tourism pages (checked 2026-11-16).
   No live prices, opening hours, transport durations, permissions or closures
   are asserted here. */
(function(root){
 'use strict';
 const SOURCES={
   almora:'https://almora.nic.in/tourist-places/',
   bengaluru:'https://bengaluruurban.nic.in/en/tourism/',
   rishikesh:'https://uttarakhandtourism.gov.in/destination/rishikesh/'
 };
 // Short local-area clusters. A day is a suggestion, not a reservation.
 const SEEDS={
  almora:[
   ['Arrive in Almora','Arrive and settle in','Walk Lala Bazaar and the old town','Try a local Kumaoni meal'],
   ['Town heritage','Visit Nanda Devi Temple respectfully','Explore heritage lanes and local markets','Keep the evening unplanned'],
   ['Kasar Devi at an easy pace','Visit Kasar Devi Temple','Walk near Crank’s Ridge if conditions permit','Watch the ridgeline before returning'],
   ['Chitai and village life','Explore Chitai Golu Devta Temple','Slow lunch and a village walk','Rest in Almora'],
   ['Binsar forests','Visit the Binsar landscape if entry and roads permit','Choose a short guided nature walk','Return before dark'],
   ['Jageshwar temple heritage','Explore Jageshwar Dham temple complex respectfully','Walk the deodar surroundings','Return with a road buffer'],
   ['Katarmal heritage','Visit Katarmal Sun Temple if accessible','Learn about the region’s temple architecture','Keep a relaxed evening'],
   ['Ranikhet day','Explore the Ranikhet area','Visit a quiet viewpoint or Jhoola Devi if accessible','Return before a late hill drive'],
   ['Kausani landscape day','Take a separate day for Kausani views','Explore local villages or a short walk','Consider an overnight stop rather than rushing'],
   ['Slow Almora finish','Explore a favourite town neighbourhood','Shop for locally made crafts or Aipan work','Pack and prepare departure']
  ],
  bengaluru:[
   ['Arrive and get oriented','Check in and rest after travelling','Walk around Church Street and nearby central streets','Try a local South Indian meal'],
   ['Central gardens','Explore Cubbon Park','View the Vidhana Soudha exterior and historic surroundings','Choose a relaxed dinner nearby'],
   ['Lalbagh and old Bengaluru','Explore Lalbagh Botanical Garden','Visit Basavanagudi neighbourhood','Sample local vegetarian food'],
   ['Palace and heritage','Visit Bengaluru Palace if open','Explore a nearby museum or neighbourhood','Return without fighting rush-hour traffic'],
   ['Tipu-era heritage','Visit Tipu Sultan’s Summer Palace if open','Explore nearby historic markets','Enjoy a slow evening'],
   ['Museums and art','Explore the Museum of Art & Photography if open','Visit the National Gallery of Modern Art if open','Try local coffee and a quiet bookshop'],
   ['Aviation and innovation','Visit the HAL Heritage Centre & Aerospace Museum if open','Explore Bengaluru’s technology story','Relax over dinner'],
   ['Nandi Hills option','Consider an early Nandi Hills outing if access permits','Allow generous time for the return','Choose a low-key evening'],
   ['Nature outside the centre','Consider Bannerghatta Biological Park if open','Learn about conservation with a licensed operator','Return before heavy traffic'],
   ['Local life and departure','Revisit Cubbon Park or a favourite neighbourhood','Finish shopping or meet local friends','Pack and check transfers']
  ],
  rishikesh:[
   ['Arrival by the Ganga','Check in and rest','Walk towards Triveni Ghat respectfully','Watch the evening aarti if scheduled'],
   ['Ashram neighbourhoods','Explore Swargashram area','Visit Parmarth Niketan precinct respectfully','Enjoy a quiet riverside evening'],
   ['Beatles Ashram heritage','Explore Chaurasi Kutia / Beatles Ashram if open','Learn about its music and meditation history','Relax at a nearby cafe'],
   ['Wellness day','Join a teacher-led yoga session if confirmed','Try a gentle meditation or reading session','Keep the evening free'],
   ['Temples and local streets','Visit Bharat Mandir respectfully','Browse local markets without a rigid schedule','Rest early'],
   ['Neer Garh landscape','Consider Neer Garh waterfall if conditions allow','Choose a short nature walk with local guidance','Return before dark'],
   ['Kunjapuri views','Plan a Kunjapuri area outing if road and temple access permit','Allow time for the return','Keep an open evening'],
   ['Haridwar cultural day','Consider a separate Haridwar day trip','Visit the ghats respectfully; check ceremony times','Return without rushing'],
   ['Ganga landscape day','Explore another riverside neighbourhood','Try a confirmed wellness class or local cultural experience','Keep time for reflection'],
   ['Farewell Rishikesh','Return to a favourite riverfront walk','Collect belongings and confirm onward transport','Depart with a time buffer']
  ]
 };
 function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function key(name){return String(name||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g,'');}
 function canonical(name){let k=key(name);return k==='bangalore'?'bengaluru':k==='kasardevi'?'almora':k==='almorah'?'almora':k;}
 // Town-level coordinates are approximate map anchors, not navigation endpoints.
 const TOWN_ANCHORS={almora:[29.597,79.659],nainital:[29.38,79.46],ranikhet:[29.643,79.432],bhimtal:[29.346,79.55],jaipur:[26.912,75.787]};
 const EXTRA={
  jaipur:['Amber Fort','Panna Meena ka Kund','City Palace','Jantar Mantar','Hawa Mahal','Albert Hall Museum','Nahargarh Fort','Gaitor cenotaphs','Jal Mahal viewpoint','Johari Bazaar'],
  almora:['Lala Bazaar','Nanda Devi Temple','Kasar Devi Temple','Chitai Golu Devta Temple','Katarmal Sun Temple','Binsar landscape'],
  nainital:['Naini Lake','Naina Devi Temple','Mall Road','Snow View area','Governor’s House area','Naina Peak area'],
  ranikhet:['Chaubatia gardens','Jhoola Devi Temple','Ranikhet town','Upat area','Majkhali'],
  bhimtal:['Bhimtal Lake','Bhimeshwar Temple area','Sattal','Naukuchiatal','Bhimtal town']
 };
 function routePlaces(raw){
   const q=' '+String(raw||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu,' ').trim()+' ';
   const rows=Array.isArray(root.RW_LOCAL_ATLAS)?root.RW_LOCAL_ATLAS:[];
   const fallback=['Almora','Nainital','Ranikhet','Bhimtal','Jaipur'].map(name=>({name,id:name.toLowerCase(),country:'India'}));
   const candidates=new Map([...fallback,...rows].map(d=>[d.id,d]));
   let matches=[];
   for(const d of candidates.values()){
     const aliases=[d.name,d.id.replace(/-/g,' '),...(d.aliases||[])];
     for(const a of aliases){
       const v=String(a||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu,' ').trim();
       const index=v.length>=3?q.indexOf(' '+v+' '):-1;
       if(index>=0)matches.push({d,index,length:v.length});
     }
   }
   matches.sort((a,b)=>a.index-b.index||b.length-a.length);
   const out=[],seen=new Set();let end=-1;
   for(const m of matches){if(m.index<end||seen.has(m.d.id))continue;out.push(m.d);seen.add(m.d.id);end=m.index+m.length+1;}
   return out;
 }
 function isPlan(raw,intents){
  const t=String(raw||'').trim(),p=intents||{};
  if(!t||t.length>350||p.smalltalk||p._country||p._state||p._eventTrip)return null;
  if(/\b(?:refund|pay|buy|book|booking status|visa|passport|schedule of flights|ticket|reservation|how much is|price of|cost of|emergency|ambulance)\b|रिफंड|भुगतान|बुकिंग का स्टेटस/i.test(t))return null;
  let explicitDays=Number(p.days);
  if(!Number.isInteger(explicitDays)||explicitDays<1||explicitDays>30){
    const spoken=t.match(/(?:\b(\d{1,2})\s*(?:din|dino|days?)\b|(\d{1,2})\s*दिन|\b(das|paanch|teen|saat)\s+din\b|(दस|पांच|तीन|सात)\s*दिन)/i);
    const n={das:10,paanch:5,teen:3,saat:7,'दस':10,'पांच':5,'तीन':3,'सात':7};
    explicitDays=spoken?Number(spoken[1]||spoken[2]||n[String(spoken[3]||spoken[4]).toLowerCase()]):0;
  }
  if(!Number.isInteger(explicitDays)||explicitDays<1||explicitDays>30)return null;
  // A stay lasting ten days is not necessarily a request to construct an itinerary.
  const planWord=/(?:\b(?:plan|planning|itinerary|trip|holiday|visit|travel|explore|ghumna|ghumne)\b|यात्रा|घूमने|घूमना|घुमना)/i.test(t);
  if(!/\b(?:plan|planning|itinerary|trip|travel|visit|explore)\b|यात्रा|घूमने|घूमना/i.test(t)
     && /\b(?:package|packages|honeymoon|wedding|resort deal|offer)\b|हनीमून|पैकेज|शादी/i.test(t))return null;
  const durationVisit=/\b\d{1,2}\s*[- ]?\s*(?:days?|nights?|din)\s+(?:in|at|around|to)\s+[A-Za-z]/i.test(t)
    || /(?:\d{1,2}|दस|पांच|तीन|सात)\s*दिन\s*(?:के\s*लिए|की\s*यात्रा|में)/.test(t);
  if(!planWord&&!durationVisit)return null;
  if(!planWord&&/\b(?:hotel|room|stay|hostel|homestay|rent|price|rate|availability|flight|train|bus)\b/i.test(t))return null;
  const places=routePlaces(t);
  if(p._route&&places.length<2)return null;
  let dest=places.length===1?places[0].name:String(p.dest||'').trim();
  if(places.length>1){
    return {dest:places.map(d=>d.name).join(' → '),places,days:explicitDays,budget:Number(p.budget)||null,vibe:Array.isArray(p.vibe)?p.vibe:[],raw:t};
  }
  // Recognize a few common regional-script aliases; the full reviewed Hindi
  // lexicon and worldwide geocoder handle other supported locations.
  const regional={'ಬೆಂಗಳೂರು':'Bengaluru','ಬೆಂಗಳೂರಿನಲ್ಲಿ':'Bengaluru','ಅಲ್ಮೋರಾ':'Almora','ರಿಷಿಕೇಶ':'Rishikesh'};
  const kannada=Object.keys(regional).find(k=>t.indexOf(k)!==-1);
  if(kannada)dest=regional[kannada];
  // The core parser currently tokenizes Latin place names only. Recover
  // reviewed Hindi aliases from the existing atlas lexicon rather than
  // inventing a transliteration from arbitrary user text.
  if(root.RW_INDIA_LANG&&root.RW_INDIA_LANG.aliases){
    const aliases=Object.keys(root.RW_INDIA_LANG.aliases).sort((a,b)=>b.length-a.length);
    const nativeName=aliases.find(k=>t.indexOf(k)!==-1);
    if(nativeName)dest=root.RW_INDIA_LANG.aliases[nativeName];
  }
  if(!dest||dest.length>85||p._recommendCount)return null;
  if(p._notAPlace&&!(root.RW_INDIA_LANG&&Object.values(root.RW_INDIA_LANG.aliases||{}).includes(dest)))return null;
  // Explicit destination has priority. A follow-up '10 days there' can inherit
  // only if the parser recorded _inherited, not from a stale unrelated memory.
  if(p._inherited&&!/\b(?:there|here|that place|same|it)\b|वहाँ|वहा/i.test(t))return null;
  return {dest,days:explicitDays,budget:Number(p.budget)||null,vibe:Array.isArray(p.vibe)?p.vibe:[],raw:t,...(places.length===1?{places}: {})};
 }
 function genericDays(plan,db){
   // For places without a reviewed place-specific pack, be explicit about
   // what is a planning scaffold. Curated DB "gems" remain suggestions only.
   const gems=Array.isArray(db&&db.gems)?db.gems.filter(x=>typeof x==='string').slice(0,12):[];
   const food=Array.isArray(db&&db.food)?db.food.filter(x=>typeof x==='string').slice(0,8):[];
   const themes=[
     ['Arrival and orientation','Settle in and explore an accessible central neighbourhood','Check local transport and route options','Try a local food speciality'],
     ['Historic centre','Explore a historic area or museum with verified public entry','Walk a nearby market area','Keep the evening relaxed'],
     ['Natural landscape','Choose a safe park, beach, lake or viewpoint appropriate to the destination','Take a guided walk if needed','Watch the sunset only where access is allowed'],
     ['Culture and cuisine','Visit a local cultural institution','Browse an artisan market','Try a regional dish'],
     ['Nearby neighbourhoods','Explore a less-crowded neighbourhood','Learn about local crafts or communities','Rest'],
     ['Flexible day','Revisit a favourite site','Enjoy an optional low-effort activity','Free evening'],
     ['Local experiences','Choose a verified local class or guide','Spend time on a local experience','Reflect and relax'],
     ['Nature or museum day','Check a different verified attraction','Have a quiet afternoon','Sample another local speciality'],
     ['A day without rush','Sleep in and walk in a safe area','Revisit something you enjoyed','Prepare onward travel'],
     ['Departure preparations','Choose a nearby attraction if time permits','Pack and check onward transport','Leave adequate transfer time']
   ];
   return Array.from({length:plan.days},(_,i)=>{
     const t=themes[i%themes.length],suggestion=gems[i],meal=food[i%food.length];
     return {title:t[0],morning:suggestion?'Consider '+suggestion+' (confirm current access)':t[1],
       afternoon:t[2],evening:meal?'Try '+meal+' where available':t[3]};
   });
 }
 function render(plan,place,db,preset){
   const norm=canonical(plan.dest),seed=SEEDS[norm],route=plan.places||[{id:norm,name:plan.dest,country:place?.country||db?.country||''}];
   const rows=[],stops=[];
   const add=(day,base,local,first,last,source)=>{
     const id=canonical(base.name), names=EXTRA[id]||source?.highlights||[];
     const attraction=names[local];
     const title=first?'Arrive in '+base.name:last?'Departure from '+base.name:attraction||'Flexible day in '+base.name;
     const r={title,morning:attraction?'Explore '+attraction+' (check access before leaving)':first?'Settle in and orient yourself':'Choose an unvisited local attraction or rest',afternoon:first&&day>1?'Transfer from the previous base; allow time for hill roads and check-in':attraction?'Explore nearby streets or a local cultural stop; leave travel time':'Enjoy a slow local walk or a confirmed experience',evening:'Try local cuisine; keep an optional evening free'};
     rows.push({...r,base:base.name,attraction});
     if(first||route.length===1&&attraction){
       const point=TOWN_ANCHORS[id];
       stops.push({day,name:route.length===1&&attraction?attraction:base.name,city:base.name,note:route.length===1&&attraction?'Suggested attraction':'Approximate town base',...(route.length>1&&point?{lat:point[0],lon:point[1]}:{})});
     }
   };
   if(route.length>1){
     if(route.length>plan.days)return '<section class="tk-card"><div class="tk-sec">You requested '+route.length+' destinations in '+plan.days+' days. Please choose more days or fewer places so that each base has time for travel and rest.</div></section>';
     let day=0;
     route.forEach((d,i)=>{const count=Math.floor(plan.days/route.length)+(i<plan.days%route.length?1:0);for(let j=0;j<count;j++){day++;add(day,d,j,j===0,day===plan.days,d);}});
   }else if(seed){
     for(let i=0;i<plan.days;i++){if(i<seed.length){const d=seed[i];rows.push({title:d[0],morning:d[1],afternoon:d[2],evening:d[3],base:plan.dest});}else add(i+1,route[0],i,false,i===plan.days-1,route[0]);}
   }else if(EXTRA[norm]||route[0].highlights){
     for(let i=0;i<plan.days;i++)add(i+1,route[0],i,i===0,i===plan.days-1,route[0]);
   }else rows.push(...genericDays(plan,db));
   if(!stops.length){
     const point=TOWN_ANCHORS[norm];
     if(point)stops.push({day:1,name:plan.dest,city:plan.dest,note:'Approximate town base',lat:point[0],lon:point[1]});
     else stops.push({day:1,name:plan.dest,city:plan.dest,note:'Destination base'});
   }
   const destination=route.length>1?plan.dest:place&&place.name&&place.lowConf!==true?place.name:plan.dest;
   const country=place&&place.country?place.country:(db&&db.country)||'';
   let out='<section class="tk-card rw-tusk-itinerary" aria-label="'+esc(plan.days)+' day itinerary for '+esc(destination)+'" data-rw-map-name="'+esc(route[0].name)+'" data-rw-map-stops="'+esc(JSON.stringify(stops))+'">'
    +'<div class="tk-head"><div class="tk-place">🗺️ '+esc(plan.days)+'-day '+esc(destination)+' itinerary</div>'
    +'<div class="tk-meta">'+esc(country?country+' · ':'')+'Day-by-day draft · works when hosted AI is unavailable</div></div>'
    +'<div class="tk-sec" style="font-size:12.5px;line-height:1.55">'
    +'<p>Here is a <b>'+esc(plan.days)+'-day</b> plan, paced for a realistic visit. Named sights are suggestions, not confirmed entry or reservations.'
    +(plan.budget?' Your stated overall budget is ₹'+Math.round(plan.budget).toLocaleString('en-IN')+'; prices need an exact-date quote.':'')+'</p>';
   if(!seed)out+='<p style="color:#f3cb8a">This destination has no fully reviewed day-wise pack yet; the outline uses existing RoamWise place suggestions and flags unverified activities rather than inventing attraction names.</p>';
   if(route.length>1)out+='<p class="rw-route-overview"><b>Suggested circuit:</b> '+esc(route.map(d=>d.name).join(' → '))+' · '+plan.days+' days. Transfer days included; order follows your request, not a verified road optimization.</p>';
   out+='<div class="rw-itinerary-days" style="display:grid;gap:9px">';
   rows.forEach(function(day,i){
     const r=Array.isArray(day)?{title:day[0],morning:day[1],afternoon:day[2],evening:day[3]}:day;
     let cycle='';
     out+='<details'+(i===0?' open':'')+' class="rw-itinerary-day" style="border:1px solid #6c6486;border-radius:12px;padding:9px 11px;background:#141b30">'
       +'<summary style="font-weight:750;cursor:pointer;color:#f6d597">Day '+(i+1)+' · '+esc(r.title)+esc(cycle)+'</summary>'
       +'<div class="rw-day-body"><small class="rw-day-base">'+esc(r.base||destination)+'</small><div><b>Morning</b><p>'+esc(r.morning)+'</p></div><div><b>Afternoon</b><p>'+esc(r.afternoon)+'</p></div><div><b>Evening</b><p>'+esc(r.evening)+'</p></div></div></details>';
   });
   out+='</div>';
   const official=route.length===1?SOURCES[norm]:null;
   if(official)out+='<p style="margin-top:12px">Attractions reference: <a href="'+esc(official)+'" target="_blank" rel="noopener noreferrer">Official tourism guide ↗</a></p>';
   if(preset&&preset.html&&/^https?:|^\//.test(preset.html)===false){
     // The preset can be a DIFFERENT itinerary length/region. State it plainly.
     out+='<p>Also available: <a href="'+esc('/itinerary-library/'+preset.html)+'" target="_blank" rel="noopener">'+esc(preset.days)+'-day prepared '+esc(preset.name)+' route ↗</a> (a separate example, not this '+esc(plan.days)+'-day plan).</p>';
   }
   out+='<p style="font-size:11px;color:#bcb8cd">Confirm opening days, tickets, weather, road conditions and accessibility before leaving. This is not live inventory.</p>'
      +(route.length===1?'<div class="tk-chips"><button class="tk-chip" type="button" data-rw-itinerary-place="'+esc(destination)+'" data-rw-itinerary-days="'+plan.days+'">Open full trip planner</button></div>':'')
      +'</div></section>';
   return out;
 }
 function reply(bubble,intents,raw){
   const plan=isPlan(raw,intents);
   if(!plan)return false;
   intents._noGenericActions=true;intents._itinerary=true;
   const phases=['Understanding your destination and trip length…','Checking RoamWise place knowledge…','Building a paced day-by-day route…'];
   let phase=0,alive=true;
   const loading=()=>{
     if(!alive||!bubble)return;
     bubble.innerHTML='<section role="status" aria-live="polite" style="padding:12px;color:#f2d495"><span class="mini-spin" aria-hidden="true"></span> 🧭 '+esc(phases[Math.min(phase,phases.length-1)])+'</section>';
     if(phase<phases.length-1)phase++;
   };
   loading();
   if(plan.places?.length>1){
     intents.multi=true;intents.dest='';intents._rwCircuit=true;
     Promise.resolve().then(()=>{alive=false;cpFinish(bubble,render(plan,null,null,null),intents,raw);});
     return true;
   }
   const timer=setInterval(loading,850);
   const knownKey=canonical(plan.dest),isKnown=!!SEEDS[knownKey];
   // Only trust a recognised place, not a generic word the regex guessed.
   let known=false,db=null;
   try{db=typeof cpDbFind==='function'?cpDbFind(plan.dest):null;}catch(e){}
   try{known=!!(isKnown||db||plan.places?.length||EXTRA[knownKey]||(typeof rwKnownMap==='function'&&rwKnownMap()[plan.dest.toLowerCase()]));}catch(e){known=isKnown||!!db||!!plan.places?.length||!!EXTRA[knownKey];}
   const atlas=(root.RW_ATLAS&&root.RW_ATLAS.ready&&typeof root.rwAtlasFind==='function')?
     root.rwAtlasFind(plan.dest):null;
   const atlasPlace=atlas&&atlas.best&&!atlas.ambiguous?{
     name:atlas.best.name,country:atlas.best.country||atlas.best.where||'',
     lat:atlas.best.lat,lon:atlas.best.lng
   }:atlas&&atlas.ambiguous?{lowConf:true,alts:atlas.matches||[]}:null;
   const placeTask=known?Promise.resolve({name:plan.dest,country:db&&db.country||''}):
     atlasPlace?Promise.resolve(atlasPlace):
     (typeof rwResolvePlace==='function'?rwResolvePlace(plan.dest):Promise.resolve(null));
   // A locally reviewed 10-day seed is complete; don't delay it for a
   // separate, possibly mismatched preset manifest downloaded over the network.
   const presetTask=SEEDS[knownKey]?Promise.resolve(null):
     (root.RW_PRESETS&&root.RW_PRESETS.find)?root.RW_PRESETS.find({destination:plan.dest,duration:plan.days,forcePreset:false}).catch(()=>null):Promise.resolve(null);
   // A slow geocoder or unavailable preset library must not leave the spinner forever.
   Promise.race([
     Promise.all([placeTask,presetTask]),
     new Promise(resolve=>setTimeout(()=>resolve([null,null]),6500))
   ]).then(function(parts){
     const place=parts[0],preset=parts[1];alive=false;clearInterval(timer);
     if(!known&&(!place||place.lowConf)){
       const options=place&&place.alts?place.alts.map(x=>x.name+', '+(x.admin||x.country)).slice(0,3):[];
       const message=options.length?'There are several locations with this name. Please choose '+options.join(' or ')+'.':'I could not verify the place "'+plan.dest+'". Add its state or country to create a reliable plan.';
       return cpFinish(bubble,'<div class="tk-card"><div class="tk-sec">'+esc(message)+'</div></div>',intents,raw);
     }
     cpFinish(bubble,render(plan,place,db,preset),intents,raw);
   }).catch(function(){
     alive=false;clearInterval(timer);
     if(known)cpFinish(bubble,render(plan,{name:plan.dest},db,null),intents,raw);
     else cpFinish(bubble,'Could not verify this destination. Please add its state or country.',intents,raw);
   });
   return true;
 }
 document.addEventListener('click',function(e){
   const target=e.target&&e.target.closest&&e.target.closest('[data-rw-itinerary-place]');
   if(!target)return;
   e.preventDefault();
   const name=target.getAttribute('data-rw-itinerary-place');
   const days=Number(target.getAttribute('data-rw-itinerary-days'));
   if(typeof cpGoPlan==='function'&&name&&Number.isInteger(days)&&days>=1&&days<=30)cpGoPlan(name,days);
 });
 root.RWTuskItinerary={intent:isPlan,render:render,reply:reply,seedNames:Object.keys(SEEDS),routePlaces:routePlaces};
})(window);
