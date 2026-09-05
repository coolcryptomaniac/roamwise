// @ts-nocheck
// Moved verbatim from app.js — Interactive how-to guide with voice
// narration (RW_GUIDE/openGuide/rwGuide*) walking through every major
// feature via tuskSpeak. Called from index.html (openGuide).
/* ================= HOW-TO GUIDE with voice narration (rw-v46) =============
   An interactive, step-by-step walkthrough of every major feature, with real
   voice narration via the device speech engine (tuskSpeak). No video files —
   this narrates live, works offline-ish, and stays in sync if features change.
   ========================================================================== */
var RW_GUIDE=[
  {id:'tusk', icon:'\u26a1', title:'Ask Ailon Tusk anything',
   steps:['Type how you actually talk \u2014 "chill 4 days near Rishikesh under 12k".',
          'Tusk replies, then gives you buttons: map it, plan it, budget it, remind me.',
          'Vague question? Tusk asks you one thing back instead of guessing.'],
   say:'Start with Ailon Tusk. Type your trip the way you would say it out loud. For example: chill four days near Rishikesh under twelve thousand. Tusk answers, then offers buttons to map it, plan it, or set a reminder. If your question is too vague, Tusk asks you one short question instead of inventing an answer.',
   go:'tabGo(\'copilot\')'},
  {id:'arrival', icon:'\ud83d\ude82', title:'Arrival mode \u2014 your ticket starts the trip',
   steps:['Booked a train? Enter the station you land at and the time.',
          'You get advice for that exact hour \u2014 landing at 3am is different from 3pm.',
          'Then: an itinerary built around your arrival, plus what\u2019s near the station.'],
   say:'Arrival mode turns a train ticket into a trip. Enter the station you arrive at and the time you land. RoamWise gives you advice for that exact hour, because arriving at three in the morning needs a very different plan from arriving at three in the afternoon. Then it builds an itinerary around your arrival and shows you what is near the station.',
   go:'openArrival()'},
  {id:'group', icon:'\ud83d\udc65', title:'Plan with friends without the chaos',
   steps:['Open a trip chat and invite the group.',
          'Tap "When can everyone go?" \u2014 everyone marks their free windows, best overlap wins.',
          '"Pick a train" lets everyone vote, then splits the fare automatically.',
          'Add expenses as you go \u2014 the kitty settles who owes whom, to the rupee.'],
   say:'Group trips die in long chat threads. In a RoamWise trip chat, tap When can everyone go, and everyone marks the dates that work. The best overlap wins automatically. Pick a train lets the group vote on options, and when you lock one, the fare is split for everyone straight away. Add expenses as you travel and the kitty works out exactly who owes whom.',
   go:'tabGo(\'trips\')'},
  {id:'beacon', icon:'\ud83d\udce1', title:'Beacon \u2014 find your people nearby',
   steps:['Light your beacon and pick your tags: founder, artist, runner, yoga.',
          'You see others lit within about a kilometre, shared interests highlighted.',
          'Your exact location never leaves your phone \u2014 it\u2019s blurred to an area.',
          'Beacons switch off by themselves after two hours. Go dark any time.'],
   say:'Beacon helps you find your people wherever you land. Light your beacon and choose your tags, like founder, artist, runner, or yoga. You will see others who are lit within about a kilometre, with shared interests highlighted. Your exact location never leaves your phone. We blur it to a rough area first, beacons switch themselves off after two hours, and you can go dark at any time.',
   go:'openBeacon()'},
  {id:'passport', icon:'\ud83d\udee1\ufe0f', title:'Journey Passport \u2014 verified proof',
   steps:['After a trip, stamp it. You get a permanent ID like RW-M3X7K-QP4TZ.',
          'Anyone can check it at roamwise.co.in/verify.html.',
          'It is a real record in the RoamWise network, not an editable image.'],
   say:'The Journey Passport is verified proof of where you have actually been. After a trip, stamp it, and you get a permanent identifier. Anyone can check that identifier on the RoamWise verify page. Unlike a photo or a certificate, it cannot be edited, because it is a real record in the RoamWise network.',
   go:'openPassport()'},
  {id:'realms', icon:'\u2694\ufe0f', title:'Realms of Roam \u2014 the game',
   steps:['Swear to a house: Himalaya, Tidewater, Ember, Verdant or Stonewatch.',
          'Seven realms across India. The only way to claim one is to really go there.',
          'Stamp a verified journey and the realm turns your house\u2019s colour.',
          'No grinding, no shortcuts \u2014 real travel is the only move.'],
   say:'Realms of Roam is a conquest game where the board is the real map of India. Swear to a house, then claim territory by actually travelling. The only way to take a realm is to go there and stamp a verified journey. You cannot grind it or buy it. Real travel is the only move in this game.',
   go:'openRealms()'},
  {id:'nearme', icon:'\ud83d\udccd', title:'Near me & Tatkal prep',
   steps:['Near me finds food and sights around you, widening if the area is quiet.',
          'Tatkal prep gives you a live countdown to the 10am and 11am windows.',
          'Save passengers once and copy them in instead of typing under pressure.'],
   say:'Near me finds food, sights and things to do around you, and widens the search automatically if you are somewhere quiet. Tatkal prep gives you a live countdown to the ten and eleven o clock booking windows, and lets you save your passengers once so you can paste them in instead of typing under pressure. RoamWise never logs into I R C T C for you, because automating it can get your account banned.',
   go:'openNearMe()'}
];
function openGuide(){
  try{ tabGo('home'); }catch(e){ /* best-effort nav helper, ignore */ }
  var sec=el('guideSection');
  if(!sec){ sec=document.createElement('section'); sec.id='guideSection'; sec.className='xsec v v-home';
    var host=el('copilotHero'); if(host&&host.parentNode) host.parentNode.insertBefore(sec,host.nextSibling); else document.body.appendChild(sec); }
  rwOpenSection(sec.id);
  sec.innerHTML='<div class="xsec-head"><h2 class="xsec-title">\ud83c\udf93 How to use <em>RoamWise</em></h2>'
    +'<button class="tact" onclick="rwGuideStop();rwCloseSection(\'guideSection\')">\u2715</button></div>'
    +'<p class="xsec-sub">Every feature, step by step \u2014 with narration if you\u2019d rather listen than read.</p>'
    +'<button class="tact" style="width:100%;margin-bottom:14px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none;padding:13px" onclick="rwGuidePlayAll()">\ud83c\udfa7 Play the whole walkthrough</button>'
    + RW_GUIDE.map(function(g,i){
        return '<div style="background:var(--bg2,#12151F);border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:16px;padding:15px;margin-bottom:11px">'
          +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'
          +'<span style="font-size:24px">'+g.icon+'</span>'
          +'<b style="flex:1;font-size:14.5px">'+g.title+'</b>'
          +'<span style="font-size:11px;color:var(--t3)">'+(i+1)+'/'+RW_GUIDE.length+'</span></div>'
          + g.steps.map(function(st,si){
              return '<div style="display:flex;gap:9px;margin-bottom:6px">'
                +'<span style="flex:0 0 18px;height:18px;border-radius:50%;background:var(--gold,#E8BA6C);color:#0A0A0C;font-size:10.5px;font-weight:800;display:flex;align-items:center;justify-content:center">'+(si+1)+'</span>'
                +'<span style="flex:1;font-size:12.5px;color:var(--t2);line-height:1.55">'+st+'</span></div>';
            }).join('')
          +'<div style="display:flex;gap:7px;margin-top:11px;flex-wrap:wrap">'
          +'<button class="tact" style="flex:1;min-width:120px;font-size:12px" onclick="rwGuideSay('+i+')">\ud83d\udd0a Listen</button>'
          +'<button class="tact" style="flex:1;min-width:120px;font-size:12px;font-weight:700" onclick="rwGuideStop();'+g.go+'">Try it \u2192</button>'
          +'</div></div>';
      }).join('');
}
function rwGuideSay(i){
  var g=RW_GUIDE[i]; if(!g) return;
  rwGuideStop();
  try{ tuskSpeak(g.say); showToast('\ud83d\udd0a '+g.title); }catch(e){ showToast('Narration unavailable here'); }
}
var _guideQueue=null;
function rwGuidePlayAll(){
  rwGuideStop();
  var i=0;
  showToast('\ud83c\udfa7 Playing the walkthrough \u2014 tap \u2715 to stop');
  function next(){
    if(i>=RW_GUIDE.length){ _guideQueue=null; return; }
    var g=RW_GUIDE[i++];
    try{ tuskSpeak(g.title+'. '+g.say); }catch(e){ /* voice narration best-effort, ignore */ }
    /* pace roughly to the length of the narration */
    _guideQueue=setTimeout(next, Math.max(9000, g.say.length*68));
  }
  next();
}
function rwGuideStop(){
  if(_guideQueue){ clearTimeout(_guideQueue); _guideQueue=null; }
  try{ if(window.speechSynthesis) speechSynthesis.cancel(); }catch(e){ /* voice narration best-effort, ignore */ }
  try{ if(window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.TextToSpeech) Capacitor.Plugins.TextToSpeech.stop(); }catch(e){ /* best-effort, ignore */ }
}
