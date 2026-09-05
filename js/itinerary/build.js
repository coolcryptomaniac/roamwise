// @ts-nocheck
// Moved verbatim from app.js (Phase 5c) — buildItin: the itinerary
// generation core (Classic planner). Called from onclick="buildItin(...)"
// in destination-card markup app.js generates dynamically, and internally
// wires up DAY_TEMPLATES (Smart-engine fallback), the itinerary-library
// preset cache, and live AI generation. togDay is the day-card expand/
// collapse handler used only by buildItin's rendered output.
/* ITINERARY */
var DAY_TEMPLATES = [
  {title:'Arrival & first explore', morning:'Check in, walk the historic centre, get oriented', afternoon:'Visit the main iconic landmark (less busy in afternoon)', evening:'Try local signature dish at nearby restaurant', tip:'Get local currency from a bank ATM on arrival'},
  {title:'Culture deep dive', morning:'Main historical site or museum — go at opening time', afternoon:'Local neighbourhood walk, coffee and people-watching', evening:'Street food tour or food market dinner', tip:'Dress modestly at religious sites — cover shoulders and knees'},
  {title:'Nature & day trip', morning:'Early start for natural attraction or national park', afternoon:'Picnic lunch from morning market, explore further', evening:'Sunset viewpoint, local dinner nearby', tip:'Book transport the night before, not morning of'},
  {title:'Food & market day', morning:'Morning food market — try local breakfast dishes', afternoon:'Cooking class or guided food tour', evening:'Signature multi-course local dinner', tip:'Eat where locals eat, not where tourists photograph'},
  {title:'Hidden gems day', morning:'Off-the-beaten-path attraction — start early', afternoon:'Explore a lesser-visited neighbourhood', evening:'Ask your hotel for their personal dinner favourite', tip:'The best experiences are rarely on review-site page 1'},
  {title:'Active adventure', morning:'Outdoor activity — hiking, cycling or water sports', afternoon:'Continue exploring or relax at scenic spot', evening:'Comfort food after active day', tip:'Start outdoor activities at sunrise — cooler and crowd-free'},
  {title:'Art & architecture', morning:'Galleries, cathedrals or ancient ruins at opening', afternoon:'Street art walk, artisan workshops, bookshops', evening:'Rooftop bar or sunset terrace', tip:'Many museums are free on the first Sunday of the month'},
  {title:'Slow travel day', morning:'Sunrise walk or meditation, no agenda', afternoon:'Spa, massage or hammam visit', evening:'Light dinner, reflect and recharge', tip:'Over-scheduling is the enemy of genuine travel experiences'},
  {title:'Local life immersion', morning:'Attend a local market, festival or community event', afternoon:'Visit a residential neighbourhood, chat with locals', evening:'Home-style cooking experience or family restaurant', tip:'Learning even 5 phrases in the local language transforms the trip'},
  {title:'Shopping & souvenirs', morning:'Artisan craft markets — buy direct from makers', afternoon:'Bespoke shopping or pottery workshop', evening:'Revisit your favourite spot from the week', tip:'Start bargaining at 60% of asking price, end around 75%'},
  {title:'Nearby town day trip', morning:'Early train or bus to nearby historic town or village', afternoon:'Explore at leisure — local lunch', evening:'Return to base for sunset, light dinner', tip:'Check return transport schedules before you leave'},
  {title:'Final experiences', morning:'Last items on your list — revisit favourites', afternoon:'Final souvenir shopping, packing', evening:'Best dinner of the trip — celebrate', tip:'Photograph your hotel room number so you remember it'},
  {title:'Departure day', morning:'Light breakfast, check out, store bags at hotel', afternoon:'Final wander through city streets', evening:'Transfer to airport or station', tip:'Keep all travel documents accessible in one pocket'},
  {title:'Bonus exploration', morning:'Revisit a favourite spot or explore a new district', afternoon:'Relax at a park, cafe, or scenic overlook', evening:'Try one more dish you have not had yet', tip:'The smallest unplanned moments often become the best memories'}
];

function buildItin(T, name, costMid, days){
  if(!isPro){ openPay(); return; }
  swTab(T,'it');
  if(itinBuilt[T]) return;
  var ph = el(T+'-iph'), cnt = el(T+'-ict');
  if(!ph || !cnt) return;
  ph.innerHTML = `<div class="mini-spin"></div><span>Building your ${days}-day plan for ${name}...</span>`;

  function renderDays(dayList, srcBadge){
    var DAY_ACCENTS=['#E8BA6C','#60A5FA','#4ADE80','#F87171','#A78BFA','#38BDF8','#FB923C','#F472B6'];
    var H = dayList.map(function(day,i){
      var did = 'day_'+T+'_'+i;
      var acc = DAY_ACCENTS[i%DAY_ACCENTS.length];
      var glow = 'rgba('+parseInt(acc.slice(1,3),16)+','+parseInt(acc.slice(3,5),16)+','+parseInt(acc.slice(5,7),16)+',.16)';
      var segs = '';
      var narrOpen = (i===0)
        ? 'The journey begins here \u2014 settle in, then let '+(day.title||'today')+' unfold.'
        : 'Day '+day.day+' opens into '+(day.title||'more of the trip')+'.';
      segs += '<div class="day-narr" style="font-style:italic;color:var(--t2);font-size:12.5px;padding:2px 0 10px;border-bottom:1px dashed var(--b2,#2A2A36);margin-bottom:10px">'+narrOpen+'</div>';
      if(day.morning) segs += '<div class="day-seg"><div class="seg-time"><span class="seg-ic">\u{1F305}</span>Morning</div><div class="seg-desc">'+day.morning+'</div></div>';
      if(day.afternoon) segs += '<div class="day-seg"><div class="seg-time"><span class="seg-ic">\u2600\uFE0F</span>Afternoon</div><div class="seg-desc">'+day.afternoon+'</div></div>';
      if(day.evening) segs += '<div class="day-seg"><div class="seg-time"><span class="seg-ic">\u{1F306}</span>Evening</div><div class="seg-desc">'+day.evening+'</div></div>';
      if(day.food) segs += '<div class="day-seg"><div class="seg-time"><span class="seg-ic">\u{1F35B}</span>Eat</div><div class="seg-desc">'+day.food+'</div></div>';
      return '<div class="day-card" style="--day-accent:'+acc+';--day-glow:'+glow+'"><div class="day-head" onclick="togDay(\''+did+'\')"><div><div class="day-num"><span class="day-dot"></span>Day '+day.day+'</div><div class="day-title">'+(day.title||'Exploration')+'</div></div><span class="day-arr" id="arr_'+did+'">\u25B6</span></div>'
        + '<div class="day-body" id="'+did+'"><div>'+segs+'</div>'+(day.tip?'<div class="day-tip">\u{1F4A1} '+day.tip+'</div>':'')+'</div></div>';
    }).join('');
    try{ badgeBump('trip'); }catch(e){ /* badge/progression update is a nice-to-have, ignore */ }
    var whyBanner = '<div style=\"text-align:center;padding:16px 14px;margin-bottom:14px;border:1px solid var(--b1,rgba(255,255,255,.07));border-radius:14px;background:var(--bg2,#12151F)\">'
      +'<div style=\"font-style:italic;color:var(--t1,#EDEAE2);font-size:13.5px;line-height:1.6\">Not rushed. Not a checklist. <b>'+esc2(name)+'</b>, paced the way a good trip should be.</div></div>';
    cnt.innerHTML = (srcBadge||'') + whyBanner + H
      + rwGreenNudge(name, days)
      + '<button class="tact" style="display:block;width:100%;margin-top:12px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="openTripMap(window._lastItin?_lastItin.name:\'\',null)">\ud83d\uddfa\ufe0f See this trip on a map</button>'
      + '<button class="tact" style="display:block;width:100%;margin-top:8px;font-weight:800" onclick="openJourneyCert()">\ud83c\udfc5 Mint journey certificate</button>'
      + '<button class="tact" style="display:block;width:100%;margin-top:8px;font-weight:800" onclick="rwShareTrip()">\ud83d\udce4 Share this trip</button>'
      + '<button class="tact" style="display:block;width:100%;margin-top:8px;font-weight:800" onclick="openMemories()">\u270d\ufe0f Turn trip into a blog &amp; collage</button>'
      + '<button class="tact" style="display:block;width:100%;margin-top:8px;font-weight:800" onclick="saveTripOffline()">\u2708\ufe0f Save offline \u2014 works with no signal</button>'
      + travelLinksHTML(name)
      + '<button class="tact" style="width:100%;margin-top:8px;border-color:rgba(22,191,150,.5);color:#16BF96" onclick="syncGo(\''+name.replace(/'/g,"\\'")+'\')">\ud83e\udd1d Sync Circle \u2014 I\u2019m going! See who else is</button>'
      + '<button class="tact" style="width:100%;margin-top:8px" onclick="compareModels(\''+name.replace(/'/g,"\\'")+'\','+days+')">\u2694\ufe0f Compare AI engines on this trip</button>'
      + '<button class="rzp-main-btn" style="margin-top:12px;background:linear-gradient(135deg,#9B59F5,#7A3FE0)" onclick="openPdfFlow(\''+T+'\',\''+name.replace(/'/g,"\\'")+'\','+days+',\''+((el('month')||{}).value||'')+'\')">\ud83d\udcd5 Premium PDF itinerary \u2014 \u20b910 (free for Pro)</button>';
    ph.style.display='none'; cnt.style.display='block'; itinBuilt[T]=true;
  }
  function smartBadge(extra){
    return '<div class="itin-src smart">\u26a1 Smart engine (built-in templates)'+(extra?' \u00b7 '+extra:'')+' \u2014 add a working AI key in Settings for a personalised plan</div>';
  }

  /* ---- Ready-made preset library (itinerary-library/) -----------------
     Additive cache in front of / behind the live planner. It never
     replaces this Classic renderer or the premium Cinematic engine.
     - Pre-check: try a cached preset first for broad, unconstrained asks
       so the user gets an instant result without spending an AI call.
     - Fallback: if the live AI generation actually fails (network error,
       timeout, broken reply), try the preset library again \u2014 loosening
       the query \u2014 before ever showing the user a bare error. */
  function rwPresetQuery(loose){
    var q = { destination:name, duration:days };
    if(!loose){
      q.month = (el('month')||{}).value||'';
      q.budgetExact = (el('budgetExact')||{}).value||'';
      q.crowd = (el('crowd')||{}).value||'';
    } else {
      q.forcePreset = true; /* bypass the "too specific" guard as a last resort */
    }
    return q;
  }
  function rwDisplayName(){
    try{ return (typeof user!=='undefined' && user && (user.displayName || (user.email||'').split('@')[0])) || lsGet('rw_name') || ''; }catch(e){ return ''; }
  }
  function presetBadge(offline){
    return '<div class="itin-src preset'+(offline?' preset-offline':'')+'">'
      + (offline ? '\ud83d\udcbe Ready-made \u00b7 offline/cached (live planner unavailable)' : '\ud83d\udce6 Ready-made \u00b7 cached itinerary for '+esc2(name))
      + '</div>';
  }
  function renderPreset(hit, offline){
    if(!hit) return false;
    var displayName = rwDisplayName();
    var ok = RW_PRESETS.renderInto(cnt, hit, displayName?{user:displayName}:{});
    if(!ok) return false;
    cnt.insertAdjacentHTML('afterbegin', presetBadge(offline));
    ph.style.display='none'; cnt.style.display='block'; itinBuilt[T]=true;
    window._lastItin={name:name, preset:true, hit:hit, offline:!!offline, days:hit.days};
    try{ badgeBump('trip'); }catch(e){ /* badge/progression update is a nice-to-have, ignore */ }
    return true;
  }
  function rwHasPresets(){ return typeof RW_PRESETS!=='undefined' && RW_PRESETS.find; }

  function smartFallback(err){
    var list=[]; for(var i=0;i<days && i<DAY_TEMPLATES.length;i++){ var t=DAY_TEMPLATES[i]; list.push({day:i+1,title:t.title,morning:t.morning,afternoon:t.afternoon,evening:t.evening,tip:t.tip}); }
    window._lastItin={name:name, days:list, ai:false};
    renderDays(list, err? '<div class="itin-src err">\u26a0 '+String(err).slice(0,90)+' \u2014 showing the built-in Smart plan instead. Test your key in Settings.</div>' : smartBadge());
  }
  /* Live generation failed (network/AI error) \u2014 try the cached preset
     library (progressively loosened) before ever surfacing an error. */
  function rwOfflineFallback(err){
    if(!rwHasPresets()){ smartFallback(err); return; }
    RW_PRESETS.find(rwPresetQuery(false)).then(function(hit){
      if(hit) return hit;
      return RW_PRESETS.find(rwPresetQuery(true));
    }).then(function(hit){
      if(!hit || !renderPreset(hit, true)) smartFallback(err);
    }).catch(function(){ smartFallback(err); });
  }

  function runLive(){
    var prov=activeProv, key=lsGet('rwKey_'+prov);
    if(prov!=='smart' && key){
      var p = 'You are an expert local guide. Build a '+days+'-day itinerary for '+name+' in '+((el('month')||{}).value||'any month')+'. Budget ~$'+Math.round(costMid/83.5)+' USD/person. Return ONLY JSON (no prose, no markdown): {"days":[{"day":1,"title":"short theme","morning":"SPECIFIC named place + what to do (with timing like 8:30 AM)","afternoon":"SPECIFIC named place + insider tip","evening":"named restaurant/street + exact dish to order","food":"one local speciality with 4-word description","tip":"practical money/crowd/culture tip"}]}. Exactly '+days+' days, every place REAL and specific to '+name+', each field under 110 chars.';
      aiCall(p, 2200, function(err, txt){
        if(txt){
          var d=extractJSON(txt);
          if(d && d.days && d.days.length){
            d.days.forEach(function(x,i){ x.day=x.day||i+1; });
            window._lastItin={name:name, days:d.days, ai:true, model:(lastAiSource||{}).model};
            var who = lastAiSource? (lastAiSource.prov.charAt(0).toUpperCase()+lastAiSource.prov.slice(1)+' \u00b7 '+lastAiSource.model) : 'AI';
            renderDays(d.days, '<div class="itin-src ai">\ud83e\udd16 AI \u00b7 '+who+' \u00b7 personalised for '+name+'</div>');
            return;
          }
          err='AI replied in a broken format';
        }
        rwOfflineFallback(err);
      }, true);
    } else {
      smartFallback();
    }
  }

  if(rwHasPresets()){
    RW_PRESETS.find(rwPresetQuery(false)).then(function(hit){
      if(!hit || !renderPreset(hit, false)) runLive();
    }).catch(function(){ runLive(); });
  } else {
    runLive();
  }
}

function togDay(id){
  var b=el(id), a=el('arr_'+id);
  if(!b) return;
  var o=b.classList.toggle('open');
  if(a) a.classList.toggle('open', o);
}
