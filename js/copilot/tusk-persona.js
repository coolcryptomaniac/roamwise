// @ts-nocheck
/* ==================== COPILOT: AILON TUSK PERSONA ====================
   Extracted verbatim from app.js (Phase 4b modularization).

   Two originally non-contiguous app.js sections, combined here because they
   are the same concern (Tusk's Bollywood-masala voice) even though they sat
   ~3,500 lines apart in the source — itself more evidence for Phase 4a's
   original "scattered across app.js" finding, now confirmed for Phase 4b:
     1) "AILON TUSK — FULL MASALA PERSONA": smalltalk replies (TK_SMALLTALK),
        opener/closer framing (TK_MASALA_OPEN/CLOSE, rwMasala/rwMasalaWrap),
        and the clarify/mini-card/route-card answer helpers that use that
        framing (tkClarifyHTML, tkMiniCard, tkRouteCard).
     2) "AILON TUSK — PERSONALITY & VOICE NOTES": the TUSK_QUIPS bank, voice
        toggle settings, and tuskVoiceNoteHTML.

   tkFold/tkToggle (the fold/unfold UI helper tkMiniCard uses) are NOT moved
   here — they are shared with js/copilot/rich-reply.js and app.js's own
   shadow-budget code, so they stay in app.js as a shared global rather than
   being arbitrarily assigned to one consumer. ==== */

/* ==================== AILON TUSK \u2014 FULL MASALA PERSONA ====================
   Big, dramatic Bollywood energy with light Hinglish sprinkles. The rule that
   keeps it from becoming annoying: personality lives in the OPENERS and
   WRAP-UPS; the facts in the middle stay clean and accurate. Filmi flavour is
   original wordplay \u2014 no real dialogues, no real star names put in quotes. */
var TK_SMALLTALK = {
  greet:["\u26a1 Picture abhi baaki hai, mere dost! Bol \u2014 kahaan ki tickets kaatun? Try \u201c5 days in Goa under 15k\u201d.",
         "Lights, camera, TRAVEL! \ud83c\udfac Destination bata, baaki main hero ki tarah sambhaal loonga. \u2708\ufe0f",
         "Hazir hoon boss, jaise chai ke saath biscuit. \ud83d\ude0e Kahaan ki hawa khaani hai is baar?",
         "Namaste ji \ud83d\ude4f Ek destination bolo aur dekho kaise poora plan filmi climax ban jaata hai."],
  thanks:["Arre mention not, boss \u2014 yeh toh mera farz banta hai. \ud83d\ude0e Agla trip kab?",
          "Khushi se dil garden-garden ho gaya! Ab bags pack karo, hero. \ud83c\udf92",
          "Anytime, meri jaan \u2014 Tusk 24x7 on duty, no interval. \u26a1"],
  bye:["Chalo, safe travels boss \u2014 jaa, jee le apni zindagi! \ud83d\udc4b",
       "The End... filhaal. Sequel toh pakka aayega. \u2708\ufe0f",
       "Bye boss! Yaad rakhna \u2014 kam saaman, zyada maza, full picture. \ud83c\udf92"],
  nice:["Haan na! Ab is feeling ko ek solid plan mein badalte hain? \ud83d\uddfa\ufe0f",
        "Wah wah, kya baat hai. Toh phir chalein? \ud83d\ude0e"],
  none:["Theek hai boss \u2014 hero ka naam poora bolo: city WITH country, e.g. \u201cGoa, India\u201d ya \u201cParis, France\u201d, taaki main galat gaadi mein na chadh jaaun. \ud83c\udfaf"]
};
function tkSmalltalk(kind){
  var pool = TK_SMALLTALK[kind]||TK_SMALLTALK.greet;
  return pool[Math.floor(Math.random()*pool.length)];
}
/* Masala openers/closers sprinkled onto destination answers. Kept short so the
   facts stay the star. rwMasala(true) = opener, rwMasala(false) = closer. */
var TK_MASALA_OPEN = [
  "Seedhi baat, no bakwaas \u2014 here\u2019s the scene:",
  "Taaliyaan baad mein, pehle plan \u2014 dekho:",
  "Iss destination ki kahaani sun, phir decide kar:",
  "Full filmy setup, zero fake drama \u2014 lo:",
  "Interval ke baad ka twist yahin milega \u2014 dekh:"
];
var TK_MASALA_CLOSE = [
  "\u2728 Baaki picture tumhaare haath mein \u2014 tap a chip aur climax likhte hain.",
  "\u2728 Ab tera move, hero. Ek chip dabaa aur scene aage badhaate hain.",
  "\u2728 Dialogue mila, ab action chahiye? Neeche wale button dabaa.",
  "\u2728 Trip ka trailer ready \u2014 full movie ke liye ek aur sawaal maar."
];
function rwMasala(open){
  var pool = open ? TK_MASALA_OPEN : TK_MASALA_CLOSE;
  return pool[Math.floor(Math.random()*pool.length)];
}
/* Wrap an answer body with masala framing, but only ~55% of the time so it
   feels spontaneous, not robotic. Opener as a styled line above, closer below. */
function rwMasalaWrap(bodyHTML){
  if(!bodyHTML) return bodyHTML;
  var out='';
  if(Math.random()<0.55) out += '<div style="font-size:12px;font-style:italic;color:var(--gold2,#C8913E);margin-bottom:7px">'+rwMasala(true)+'</div>';
  out += bodyHTML;
  if(Math.random()<0.45) out += '<div style="font-size:11.5px;color:var(--t3);margin-top:9px">'+rwMasala(false)+'</div>';
  return out;
}
/* clarify chips when the geocoder isn't sure */
function tkClarifyHTML(typed, place){
  var opts=[place].concat(place.alts||[]).slice(0,4);
  return '<div class="tk-card"><div class="tk-sec">'
    +'<div style="font-size:13px;line-height:1.6">\ud83e\udded I found a few places called <b>'+esc2(typed)+'</b> \u2014 which one did you mean?</div>'
    +'<div class="tk-chips" style="margin-top:9px">'
    + opts.map(function(o){
        var lbl=[o.name, o.admin, o.country].filter(Boolean).join(', ');
        return '<button class="tk-chip" onclick="cpFollow(\''+String(o.name+', '+o.country).replace(/'/g,"\\'")+'\')">'+esc2(lbl)+'</button>';
      }).join('')
    +'<button class="tk-chip" onclick="cpFollow(\'none of these\')">None of these</button>'
    +'</div></div></div>';
}
/* compact follow-up: answer ONLY the asked topic — repeating the whole card
   on every chip tap made the conversation feel like spam */
async function tkMiniCard(it){
  var dest=it.dest, out=[], used={};
  var dbHit = cpDbFind(String(dest));
  var geo = dbHit? null : await rwResolvePlace(dest);
  var lat = dbHit? dbHit.lat : (geo? geo.lat:null), lon = dbHit? dbHit.lon : (geo? geo.lon:null);
  var title = {eat:'\ud83c\udf5c Eating in', weather:'\u26c5 Weather in', reach:'\ud83d\ude8c Reaching', around:'\ud83d\udef5 Getting around', stay:'\ud83c\udfe8 Staying in', safe:'\ud83d\udee1\ufe0f Staying smart in', cost:'\ud83d\udcb0 Costs in'}[it.topic]||'\ud83e\udded';
  if(it.topic==='weather'){
    if(lat!=null && navigator.onLine){
      try{
        var w=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=3&timezone=auto').then(function(r){return r.json();});
        if(w&&w.daily){ used.wx=true;
          out.push(w.daily.time.map(function(d,i){
            var rain=w.daily.precipitation_probability_max[i];
            return '<div class="tk-bul">'+new Date(d).toLocaleDateString('en-IN',{weekday:'long'})+': '+Math.round(w.daily.temperature_2m_min[i])+'\u2013'+Math.round(w.daily.temperature_2m_max[i])+'\u00b0C'+(rain>=40? ' \u00b7 \ud83c\udf27\ufe0f '+rain+'% rain':'')+'</div>';
          }).join(''));
        }
      }catch(e){ out.push('<div class="tk-bul">Forecast unavailable right now.</div>'); }
    } else out.push('<div class="tk-bul">Forecast needs internet.</div>');
  } else {
    try{
      var wvS = await wvStructured(dest, it._raw||it.topic||'');
      if(wvS){ used.wv=wvS.title;
        wvS.secs.slice(0,2).forEach(function(sec){
          var bl=tkBullets(sec.text,5);
          if(bl.length) out.push('<div class="tk-lab">'+esc2(sec.line)+'</div>'+bl.map(function(b){return '<div class="tk-bul">'+esc2(b)+'</div>';}).join(''));
        });
      }
    }catch(e){}
    var g = rwGroundFor(geo || {cc: dbHit&&dbHit.country==='India' ? 'IN':''});
    if(g){
      if(it.topic==='stay') out.push('<div class="tk-lab">Typical per night</div><div style="font-size:12px;color:var(--t2)">'+g.d.stay.map(function(r){return r[0]+' <b>'+r[1]+'</b>';}).join(' \u00b7 ')+'</div>');
      if(it.topic==='safe') out.push('<div class="tk-lab">Don\u2019t get played</div>'+g.d.hacks.slice(0,4).map(function(h){return '<div class="tk-bul">'+h+'</div>';}).join(''));
      if(it.topic==='cost'){
        var ce = dbHit || costEntryForPlace(geo);
        if(ce && it.budget) out.push(rwBudgetFitHTML(ce, it));
      }
      if(it.topic==='cost' || it.topic==='around') out.push(tkFold('Full cost sheet & scam guide', groundHTML(geo||{cc:'IN'}, dest)));
    }
  }
  if(!out.length) out.push('<div class="tk-bul">Nothing solid on that yet \u2014 try the full name, or ask something else.</div>');
  return '<div class="tk-card tk-mini"><div class="tk-sec"><div style="font-weight:800;font-size:13.5px">'+title+' '+esc2(dest)+'</div></div>'
    +'<div class="tk-sec">'+out.join('')+'</div>'
    +'<div class="tk-sec"><div class="tk-chips">'+tkFollowChips(dest).replace('<div class="tk-chips">','').replace(/<\/div>$/,'')+'</div></div>'
    + tkCredits(used) + '</div>';
}
/* multi-stop route card */
async function tkRouteCard(it){
  var stops=it.stops, days=it.days || stops.length*2;
  var per=Math.max(1, Math.floor(days/stops.length)), rem=days-per*stops.length;
  var rows = stops.map(function(sname, i){
    var d = per + (i===stops.length-1? rem:0);
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
      +'<div style="display:flex;align-items:center;gap:9px"><b style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;display:inline-flex;align-items:center;justify-content:center;font-size:11px">'+(i+1)+'</b>'
      +'<span style="font-size:13.5px;font-weight:700">'+esc2(sname)+'</span><span style="font-size:11px;color:var(--t3)">'+d+' day'+(d>1?'s':'')+'</span></div>'
      +'<button class="tk-chip gold" style="font-size:11px;padding:5px 10px" onclick="cpGoPlan(\''+sname.replace(/'/g,'')+'\','+d+')">Plan \u2192</button></div>';
  }).join('');
  var legs = stops.slice(0,-1).map(function(sname,i){
    return '<a class="tk-chip" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.rome2rio.com/s/'+encodeURIComponent(sname)+'/'+encodeURIComponent(stops[i+1])+'">'+esc2(sname)+' \u2192 '+esc2(stops[i+1])+'</a>';
  }).join('');
  return '<div class="tk-card"><div class="tk-head" style="background:'+tkThemeGrad(stops[stops.length-1])+'">'
    +'<div class="tk-place" style="font-size:16px">'+stops.map(esc2).join(' \u2192 ')+'</div>'
    +'<div class="tk-meta">'+days+' days \u00b7 '+stops.length+' stops'+(it.budget? ' \u00b7 under \u20b9'+it.budget.toLocaleString('en-IN'):'')+'</div></div>'
    +'<div class="tk-sec"><div class="tk-lab">Day split (tap Plan for each stop)</div>'+rows
    +'<div style="font-size:10.5px;color:var(--t3);margin-top:7px">Even split with the extra days on the finale \u2014 drag numbers in your head as you like; each Plan button pre-fills that city and duration.</div></div>'
    +'<div class="tk-sec"><div class="tk-lab">Between stops</div><div class="tk-chips">'+legs+'</div></div>'
    +'<div class="tk-sec"><div class="tk-lab">Ask me next</div>'+tkFollowChips(stops[stops.length-1])+'</div>'
    +'</div>';
}

/* ---- (originally ~3,500 lines further into app.js: PERSONALITY & VOICE NOTES) ---- */

/* ==================== AILON TUSK — PERSONALITY & VOICE NOTES ================
   People come back to something that makes them smile. This gives Ailon Tusk a
   witty, masala Hinglish voice and lets it drop a short spoken "voice note"
   about a destination.

   IMPORTANT (copyright): these are ORIGINAL lines written in a Bollywood-ish,
   filmy flavour — NOT real film dialogue or song lyrics, which are copyrighted
   and would get the app pulled from Play. Audio is the device's own built-in
   text-to-speech (SpeechSynthesis) — free, offline, no rights issue, no files
   to host. In the Android app the native TTS is used via the same bridge. */
var TUSK_QUIPS = {
  beach:[
    "Beach vibes? Boss, sunscreen laga ke jaana \u2014 warna lobster ban ke aaoge. \ud83e\udd9e",
    "Sand, susegad aur sunset. Bas ek chai-tapri aur life set hai. \ud83c\udfd6\ufe0f",
    "Waves bulaa rahi hain, aur tera boss bhi. Dono ko ignore kar, chal nikal. \ud83c\udf0a",
    "Shack pe baith, feni try kar, phone silent kar. Yeh hai asli itinerary. \ud83c\udf79",
    "Sunset dekhne ke liye ticket nahi lagta \u2014 duniya ka best show free hai. \ud83c\udf05",
    "Beach pe ghadi mat pehen. Time waha kaam nahi karta. \u231a",
    "Paani thanda, dil garam, wallet halka \u2014 perfect beach trip. \ud83c\udfd6\ufe0f",
    "Bhai, shorts pack kar. Formal shoes ka yahaan koi kaam nahi. \ud83e\ude74",
    "Coconut water > energy drink. Nature ne pehle hi solve kar diya. \ud83e\udd65",
    "Low tide mein chalna, high tide mein sochna. Beach philosophy. \ud83d\udc0b",
    "Har wave ek naya chance hai \u2014 aur ek naya photo. \ud83d\udcf8",
    "Beach shack ka menu lamba, par order sirf ek: jo fresh ho. \ud83d\udc1f"
  ],
  mountains:[
    "Pahaad bula rahe hain! Oxygen kam, attitude zyada \u2014 perfect trip. \ud83c\udfd4\ufe0f",
    "Maggi at 3000m hits different, boss. Science bhi maan chuki hai. \ud83c\udf5c",
    "Mountains don\u2019t text back, par sukoon zaroor dete hain. Chalo. \u26f0\ufe0f",
    "Upar jaake network chala jaayega \u2014 aur wahi to plan hai. \ud83d\udcf5",
    "Ek sweater extra rakh. Pahaad mein mausam ka mood swing hota hai. \ud83e\udde5",
    "Chadhai mushkil, view mufti. Deal accept? \u26f0\ufe0f",
    "Sunrise ke liye 4 baje uthna padega. Worth it, promise. \ud83c\udf04",
    "Yahaan traffic nahi, bas bakriyaan. Peaceful jam. \ud83d\udc10",
    "Altitude gain slow rakh \u2014 pahaad race nahi, conversation hai. \ud83e\udd7e",
    "Thermos bhar le. Chai upar sona ban jaati hai. \u2615",
    "Har mod pe ek nazaara, har nazaare pe ek pause. \ud83d\udcf7",
    "Pahaad kuch nahi maangte, bas respect. Utna de dena. \ud83d\ude4f"
  ],
  spiritual:[
    "Aatma ki battery low? Chalo, thodi spiritual charging ho jaaye. \ud83d\uddff",
    "Ghanti bajao, selfie lo, thoda sukoon lo \u2014 balance hai boss. \ud83d\ude4f",
    "Yahaan network kam milega, par connection upar waale se pakka. \u2728",
    "Subah ki aarti miss mat karna \u2014 alarm laga le. \ud83d\udd14",
    "Chappal bahar, ego bhi bahar. Dono wapas mil jaayenge. \ud83e\ude74",
    "Bheed mein bhi shanti mil jaati hai, agar dhoondho. \ud83e\uddd8",
    "Prasad khana mat bhoolna \u2014 wahi asli review hai. \ud83c\udf6c",
    "Yahaan photo se zyada moment important hai. Phone jeb mein. \ud83d\udcf5",
    "Ganga kinare baithna \u2014 therapy ka sasta version. \ud83c\udf0a",
    "Chup rehna bhi ek activity hai. Try kar. \ud83e\udd2b"
  ],
  party:[
    "Party mode ON! Kal ki tension kal ka Tusk sambhaal lega. \ud83c\udf89",
    "Neend to ghar pe bhi aa jayegi \u2014 abhi nikal, DJ waiting hai. \ud83d\udd7a",
    "Budget alert baad mein, pehle beat drop hone de. \ud83c\udfa7",
    "Cab ka number pehle save kar, phir daaru. Order matters. \ud83d\ude95",
    "Wallet hotel mein, ID jeb mein, phone charged. Basics clear. \ud83d\udcb3",
    "Har city ka ek adda hota hai \u2014 locals se poochh, Google se nahi. \ud83c\udf7b",
    "Dance floor pe koi judge nahi karta. Utha le steps. \ud83d\udd7a",
    "Ek dost sober rakhna \u2014 woh kal ka hero hoga. \ud83e\uddb8",
    "Last metro ka time yaad rakh, warna surge pricing yaad rakhegi tujhe. \ud83d\ude87",
    "Raat lambi hai par subah ki flight nahi rukegi. Balance. \u2708\ufe0f"
  ],
  romantic:[
    "Do log, ek sunset, zero network \u2014 perfect date, boss. \u2764\ufe0f",
    "Romance ka budget mat dekh, memories priceless hoti hain (mostly). \ud83c\udf39",
    "Candlelight dinner ya street chaat \u2014 pyaar dono mein hai. \ud83d\udd6f\ufe0f",
    "Phone dono ka silent. Yeh hi asli gift hai. \ud83d\udcf5",
    "Ek acchi jagah + ek acchi baat = trip yaad reh jaayega. \ud83d\udc95",
    "Sunset point pe bheed hoti hai \u2014 10 min pehle pahunch. \ud83c\udf07",
    "Surprise plan karna, par mausam check karke. Practical romance. \u26c5",
    "Photos kam, moments zyada. Baad mein dono yaad rahenge. \ud83d\udcf8",
    "Sharing food = sharing life. Menu mein ek hi dish order kar. \ud83c\udf5d",
    "Sabse acchi memory woh hoti hai jiski photo nahi hoti. \u2728"
  ],
  budget:[
    "Kam paise, zyada maze \u2014 yeh apun ka funda hai, boss. \ud83d\udcb8",
    "Sasta trip, mehnga experience. Tusk guarantee. \ud83e\uddb5",
    "Paisa bachega toh ek aur trip banega. Simple maths. \ud83e\uddee",
    "Local bus pakad \u2014 kahani bhi milegi, paisa bhi bachega. \ud83d\ude8c",
    "Dhaba > restaurant. Swaad zyada, bill aadha. \ud83c\udf5b",
    "Off-season mein jaa \u2014 wahi jagah, aadha daam. \ud83d\udcc9",
    "Hostel dorm mein dost milte hain, hotel room mein bill. \ud83c\udfe0",
    "Advance booking = discount. Last minute = pachtawa. \ud83d\udcc5",
    "Paani ki bottle refill kar, roz 100 rupaye bach jaayenge. \ud83d\udca7",
    "Souvenir se acchi cheez hai ek extra din ruk jaana. \ud83c\udf92",
    "Sabse mehnga kharcha? Woh jo tune plan nahi kiya. \ud83d\udcca"
  ],
  adventure:[
    "Dil thaam ke baith \u2014 yeh trip roller-coaster hai, EMI nahi. \ud83e\udea2",
    "Comfort zone ko bye bol, adventure zone mein WiFi behtar hai. \ud83e\udd18",
    "Darr ke aage jeep hai, boss. Chal nikal. \ud83d\ude99",
    "Helmet pehen. Bahaduri aur bewakoofi mein woh hi farq hai. \ud83e\ude96",
    "Guide ko sun \u2014 usne yeh pahaad tere se zyada baar dekha hai. \ud83e\uddd7",
    "Shoes acche le. Baaki sab adjust ho jaata hai. \ud83e\udd7e",
    "Insurance boring lagta hai jab tak zaroorat na pade. \ud83d\udee1\ufe0f",
    "Adrenaline free hai, ambulance nahi. Soch samajh ke. \ud83d\ude91",
    "Sabse acchi kahaniyan wahi hoti hain jahan thoda darr laga tha. \ud83c\udf0b",
    "Raft mein paddle chalana padta hai \u2014 passenger mat ban. \ud83d\udea3"
  ],
  food:[
    "Jahaan local line lagi ho, wahi khana. Rule number one. \ud83c\udf5c",
    "Street food ka niyam: garam, taaza, bheed waala. \ud83d\udd25",
    "Menu ka sabse mehnga item best nahi hota. Aksar ulta hota hai. \ud83d\udcdc",
    "Ek din diet bhool ja \u2014 wapas jaake pachtaayega warna. \ud83c\udf5b",
    "Chai har sheher mein alag lagti hai. Compare karna hobby bana le. \u2615",
    "Jo cheez sirf yahaan milti hai, wahi order kar. Pizza ghar pe bhi hai. \ud83c\udf55",
    "Local sweet zaroor try karna \u2014 culture chakhne ka sabse tez tareeka. \ud83c\udf6e",
    "Paani bottled, khana garam, pet khush. \ud83d\udca7",
    "Sabse acchi review? Jo dukaan 20 saal se chal rahi ho. \ud83c\udfea"
  ],
  culture:[
    "Museum boring nahi hota \u2014 galat time pe jaana boring hota hai. \ud83c\udfdb\ufe0f",
    "Ek local se baat kar le. Guidebook se accha content milega. \ud83d\udde3\ufe0f",
    "Purani galiyon mein kho jaana \u2014 wahi asli tour hai. \ud83e\uddf5",
    "Har sheher ki ek kahani hai. Sunne ke liye rukna padta hai. \ud83d\udcd6",
    "Dress code respect kar. Guest ho, judge nahi. \ud83d\ude4f",
    "Sunday market miss mat karna \u2014 sheher ki asli shakal wahi hai. \ud83e\uddfa",
    "Local tyohaar mil jaaye toh plan badal dena. Worth it. \ud83c\udf8a"
  ],
  _default:[
    "Bags pack kar, excuses unpack kar \u2014 Tusk ready hai. \ud83c\udf92",
    "Zindagi ek safar hai, aur main tera co-pilot. Seatbelt baandh. \u2708\ufe0f",
    "Trip plan karna mujhpe chhod, tu bas haan bol. \ud83d\ude0e",
    "Best time to travel? Jab tu ticket book kar le. \ud83c\udfab",
    "Google bata dega kahaan jaana hai. Main bataunga kaise bachna hai. \ud83e\udded",
    "Plan A fail ho toh Plan B ready rakh \u2014 alphabet lamba hai. \ud83d\udcdd",
    "Photo se zyada important hai wahaan actually hona. \ud83d\udcf8",
    "Charger, ID, dawai \u2014 baaki sab wahaan mil jaayega. \ud83d\udd0c",
    "Jitna kam saaman, utna zyada maza. Physics hai. \ud83c\udf92",
    "Offline map download kar le \u2014 network sabse zaroori waqt pe jaata hai. \ud83d\uddfa\ufe0f",
    "Local SIM le lena, roaming bill se sasta padega. \ud83d\udcf1",
    "Hotel ka address screenshot kar. Bhulakkad hona normal hai. \ud83d\udcf7",
    "Cash thoda rakh \u2014 UPI har jagah nahi chalta. \ud83d\udcb5",
    "Subah nikal, bheed se pehle. Yeh ek trick sab kuch badal deti hai. \ud83c\udf05",
    "Trip ka best part? Wapas aake kisi ko sunana. \ud83d\udde3\ufe0f",
    "Har trip mein ek din bina plan ke rakh. Wahi yaad rahega. \ud83c\udfb2",
    "Rain check kar le nikalne se pehle. Chhata sasta hai, sardi mehngi. \u2614",
    "Copy of ID phone mein rakh. Paperwork boring par zaroori. \ud83d\udcc4"
  ]
};
var _tuskRecent=[];
function tuskQuip(vibeOrPlace, entry){
  var pool=null;
  if(entry){
    var tags=(typeof grpTagsFor==='function')? grpTagsFor(entry):[];
    for(var i=0;i<tags.length;i++){ if(TUSK_QUIPS[tags[i]]){ pool=TUSK_QUIPS[tags[i]]; break; } }
  }
  if(!pool && TUSK_QUIPS[vibeOrPlace]) pool=TUSK_QUIPS[vibeOrPlace];
  if(!pool) pool=TUSK_QUIPS._default;
  /* Don't repeat anything from the last 8 — with 100+ lines the same one kept
     surfacing purely by chance, which made it feel canned. */
  var fresh = pool.filter(function(q){ return _tuskRecent.indexOf(q)===-1; });
  if(!fresh.length){ _tuskRecent=[]; fresh=pool; }
  var pick = fresh[Math.floor(Math.random()*fresh.length)];
  _tuskRecent.push(pick); if(_tuskRecent.length>8) _tuskRecent.shift();
  return pick;
}
// tuskSpeakable moved to js/voice/tusk-speak.js
/* Voice narration (tuskSpeak) is a separate concern from the theme/SFX engine
   in platform-v5/audio-only.js — it's TTS, not media playback — so it gets its
   own Settings toggle rather than being silently controlled by rw_audio_enabled. */
var RW_VOICE_KEY = 'rw_voice_enabled';
function rwVoiceEnabled(){
  try{ var v=localStorage.getItem(RW_VOICE_KEY); return v===null ? true : v!=='0'; }catch(e){ return true; }
}
function rwVoiceSetEnabled(on){
  try{ localStorage.setItem(RW_VOICE_KEY, on?'1':'0'); }catch(e){}
  try{ if(!on && window.speechSynthesis) speechSynthesis.cancel(); }catch(e){}
}
function rwVoiceMountSetting(){
  if(el('rwVoiceSetting')) return;
  var body = document.querySelector('#settingsOverlay .modal-body');
  if(!body) return;
  var section = document.createElement('section');
  section.id = 'rwVoiceSetting';
  section.className = 'key-section rw-sound-settings';
  section.innerHTML = ''
    +'<div class="rw-sound-row">'
    +  '<div><strong>Voice narration</strong><span>Tusk’s read-aloud voice notes and guide narration</span></div>'
    +  '<label class="rw-sound-switch" aria-label="Mute or unmute voice narration">'
    +    '<input id="rwVoiceToggle" type="checkbox" role="switch"><i aria-hidden="true"></i>'
    +  '</label>'
    +'</div>';
  var anchor = el('rwAudioSetting');
  if(anchor && anchor.parentNode===body) anchor.insertAdjacentElement('afterend', section);
  else body.insertBefore(section, body.firstChild);
  var toggle = el('rwVoiceToggle');
  toggle.checked = rwVoiceEnabled();
  toggle.setAttribute('aria-checked', toggle.checked?'true':'false');
  toggle.addEventListener('change', function(){
    rwVoiceSetEnabled(toggle.checked);
    toggle.setAttribute('aria-checked', toggle.checked?'true':'false');
  });
}
// tuskSpeak moved to js/voice/tusk-speak.js
/* a shareable "voice note" bubble: shows the witty line + a play button */
function tuskVoiceNoteHTML(place, entry){
  var line=tuskQuip(place, entry);
  var id='vn_'+Math.random().toString(36).slice(2,8);
  window['_'+id]=line;
  return '<div style="display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,rgba(232,186,108,.14),rgba(200,145,62,.06));border:1px solid rgba(232,186,108,.3);border-radius:14px;padding:11px 13px;margin-top:8px">'
    +'<button onclick="tuskSpeak(window._'+id+')" style="flex:0 0 auto;width:40px;height:40px;border-radius:50%;border:none;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;font-size:16px;cursor:pointer">\u25b6</button>'
    +'<div style="flex:1;min-width:0"><div style="font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);margin-bottom:2px">\ud83c\udf99\ufe0f Tusk\u2019s voice note</div>'
    +'<div style="font-size:12px;line-height:1.5;color:var(--t2)">'+esc2(line)+'</div></div></div>';
}
