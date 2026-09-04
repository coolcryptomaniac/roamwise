// @ts-nocheck
/* ============================================================================
   EVENT ROI ENGINE (rw-v59)
   ============================================================================
   The user's ask: rank events by whether they LEAVE YOU BETTER OFF — money,
   career, head, culture, fun — minus what they take: cost and drain. And say
   so plainly when an event is a net negative rather than quietly listing it.

   Every score is visible and explained. This is a stated editorial opinion,
   not a measurement, and the UI says exactly that. An opaque "9.2/10" would be
   worse than useless — you could not argue with it.
   ========================================================================== */
var RW_ROI_DIMS=[
  {k:'prof',  label:'Career',    icon:'\ud83d\udcbc', good:'opens doors, meets people who matter'},
  {k:'money', label:'Money',     icon:'\ud83d\udcb0', good:'can pay for itself or lead to income'},
  {k:'mind',  label:'Headspace', icon:'\ud83e\udde0', good:'you come back restored, not wrecked'},
  {k:'cult',  label:'Culture',   icon:'\ud83c\udfad', good:'you see something you could not elsewhere'},
  {k:'fun',   label:'Joy',       icon:'\u2728', good:'straightforwardly a good time'}
];
function rwEventROI(e){
  var r=e&&e.roi; if(!r) return null;
  var gain=(r.prof||0)+(r.money||0)+(r.mind||0)+(r.cult||0)+(r.fun||0);   /* -10..25 */
  var give=(r.cost||0)+(r.drain||0);                                       /* 0..10  */
  var net=gain-give;
  var band, tone, why;
  if(net>=12){ band='MUST ATTEND'; tone='must'; }
  else if(net>=7){ band='WORTH IT'; tone='good'; }
  else if(net>=3){ band='GO IF NEARBY'; tone='ok'; }
  else if(net>=0){ band='ONLY IF IT\u2019S YOUR THING'; tone='meh'; }
  else { band='LIKELY NOT WORTH IT'; tone='bad'; }

  /* the single strongest reason, so the badge is arguable rather than magic */
  var best=RW_ROI_DIMS.slice().sort(function(a,b){ return (r[b.k]||0)-(r[a.k]||0); })[0];
  var worst = (r.cost||0)>=(r.drain||0) ? {k:'cost',label:'cost'} : {k:'drain',label:'drain'};
  if(tone==='bad') why='Takes more than it gives \u2014 high '+worst.label+' for what you get back.';
  else if(tone==='meh') why='Roughly break-even. Worth it only if '+best.label.toLowerCase()+' is what you\u2019re after.';
  else why='Strongest on '+best.label.toLowerCase()+' \u2014 '+best.good+'.';
  if((r.cost||0)>=4 && net>=3) why+=' Expensive, though \u2014 budget for it.';
  if((r.drain||0)>=4 && net>=3) why+=' It will wipe you out; plan a recovery day.';
  return {net:net, gain:gain, give:give, band:band, tone:tone, why:why, best:best, r:r};
}
function rwROIBadge(e){
  var v=rwEventROI(e); if(!v) return '';
  return '<span class="roi-badge roi-'+v.tone+'">'+v.band+'</span>';
}
function rwROIPanel(e){
  var v=rwEventROI(e); if(!v) return '';
  var bars=RW_ROI_DIMS.map(function(d){
    var raw=v.r[d.k]||0, pos=Math.max(0,raw), neg=Math.max(0,-raw);
    var pct=Math.round((pos/5)*100);
    return '<div class="roi-row"><span class="roi-lbl">'+d.icon+' '+d.label+'</span>'
      +'<span class="roi-bar"><i style="width:'+pct+'%"></i>'
      +(neg?'<u style="width:'+Math.round((neg/5)*100)+'%"></u>':'')+'</span>'
      +'<span class="roi-num'+(raw<0?' neg':'')+'">'+(raw>0?'+':'')+raw+'</span></div>';
  }).join('');
  var costs='<div class="roi-row"><span class="roi-lbl">\ud83d\udcb8 What it costs</span>'
    +'<span class="roi-bar cost"><i style="width:'+Math.round(((v.r.cost||0)/5)*100)+'%"></i></span>'
    +'<span class="roi-num neg">-'+(v.r.cost||0)+'</span></div>'
    +'<div class="roi-row"><span class="roi-lbl">\ud83d\ude29 What it takes out of you</span>'
    +'<span class="roi-bar cost"><i style="width:'+Math.round(((v.r.drain||0)/5)*100)+'%"></i></span>'
    +'<span class="roi-num neg">-'+(v.r.drain||0)+'</span></div>';
  return '<div class="roi-panel">'
    +'<div class="roi-head"><span class="roi-badge roi-'+v.tone+'">'+v.band+'</span>'
    +'<span class="roi-net">net '+(v.net>0?'+':'')+v.net+'</span></div>'
    +'<div class="roi-why">'+esc2(v.why)+'</div>'
    + bars + '<div class="roi-sep"></div>' + costs
    +'<div class="roi-note">This is our stated opinion, not a measurement \u2014 scored on what an event typically gives back versus what it takes. Disagree freely; you know your own life.</div>'
    +'</div>';
}

/* ============================================================================
   EVENT RADAR (rw-v58) — music, startup, sports & automobile events
   ============================================================================
   HONESTY FIRST: there is no free, reliable live-events API for India, so this
   is a CURATED calendar, not a scrape. Every event carries a `verified` flag
   and the UI shows it, because someone may book a flight on these dates:
     confirmed -> organiser-announced
     typical   -> runs around this time most years, NOT announced
   The differentiated part isn't the listing — it's turning an event into a
   real trip, with themed advice per category.
   ========================================================================== */
function rwEventDate(e){
  if(e.start){
    var a=new Date(e.start+'T00:00:00'), b=e.end?new Date(e.end+'T00:00:00'):null;
    var f=function(d){ return d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}); };
    return b? f(a)+'\u2013'+f(b)+' '+b.getFullYear() : f(a)+' '+a.getFullYear();
  }
  if(e.month){ return ['','January','February','March','April','May','June','July','August','September','October','November','December'][e.month]; }
  return 'dates vary';
}
/* days until it starts; null when we only know a month */
function rwEventDays(e){
  if(!e.start) return null;
  var d=new Date(e.start+'T00:00:00'), now=new Date(); now.setHours(0,0,0,0);
  return Math.round((d-now)/86400000);
}
function rwEventSoon(e){
  var d=rwEventDays(e);
  if(d!==null) return d>=0 && d<=45;
  if(e.month){ var m=new Date().getMonth()+1; return e.month===m || e.month===(m%12)+1; }
  return false;
}
function openEvents(cat){
  rwPageOpen('events', function(body){
    var sec=document.createElement('section'); sec.id='eventsSection'; sec.className='xsec';
    body.appendChild(sec);
  });
  var sec=el('eventsSection'); if(!sec) return;
  window._evCat=cat||window._evCat||'all';
  sec.innerHTML='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px">'
    +'<button class="ev-chip'+(window._evCat==='all'?' on':'')+'" onclick="openEvents(\'all\')">All</button>'
    + (window.RW_EVENT_CATS||[]).map(function(c){
        return '<button class="ev-chip'+(window._evCat===c.id?' on':'')+'" onclick="openEvents(\''+c.id+'\')">'+c.icon+' '+c.label+'</button>';
      }).join('')
    +'</div>'
    +'<input id="evSearch" placeholder="Search events, cities, countries\u2026" oninput="rwEventsRender()" '
    +'style="width:100%;background:var(--bg3,#1A1A20);border:1px solid var(--b2,#2A2A36);border-radius:11px;padding:11px;color:var(--t1);font:inherit;margin-bottom:14px">'
    +'<div id="eventsOut"></div>';
  rwEventsRender();
  try{ rwEventsSync(); }catch(e){}
}
function rwEventsRender(){
  var host=el('eventsOut'); if(!host) return;
  var all=(window.RW_EVENTS||[]).slice();
  var cat=window._evCat||'all';
  var q=((el('evSearch')&&el('evSearch').value)||'').trim().toLowerCase();
  var list=all.filter(function(e){
    if(cat!=='all' && e.cat!==cat) return false;
    if(!q) return true;
    return (e.name+' '+e.place+' '+e.country+' '+(e.vibe||'')).toLowerCase().indexOf(q)>-1;
  });
  if(!list.length){ host.innerHTML='<div class="note" style="text-align:center;padding:22px;color:var(--t3)">Nothing matches. Try a city, a country, or clear the search.</div>'; return; }
  /* soonest first; month-only events after dated ones */
  list.sort(function(a,b){
    var da=rwEventDays(a), db=rwEventDays(b);
    if(da!==null && db!==null) return da-db;
    if(da!==null) return -1;
    if(db!==null) return 1;
    var m=new Date().getMonth()+1;
    var oa=((a.month||13)-m+12)%12, ob=((b.month||13)-m+12)%12;
    return oa-ob;
  });
  var soon=list.filter(rwEventSoon), later=list.filter(function(e){ return !rwEventSoon(e); });
  /* within "later", surface the ones actually worth travelling for */
  later.sort(rwByROI);
  var C={}; (window.RW_EVENT_CATS||[]).forEach(function(c){ C[c.id]=c; });

  function card(e, hot){
    var c=C[e.cat]||{icon:'\ud83d\udcc5',color:'var(--gold)',label:''};
    var d=rwEventDays(e);
    var badge = e.verified==='confirmed'
      ? '<span class="ev-ok">\u2713 dates confirmed</span>'
      : '<span class="ev-maybe">~ typical timing \u00b7 verify before booking</span>';
    var count = (d!==null && d>=0) ? '<span class="ev-days">'+(d===0?'today':d===1?'tomorrow':'in '+d+' days')+'</span>' : '';
    return '<div class="ev-card'+(hot?' hot':'')+'" style="--evc:'+c.color+'">'
      +'<div class="ev-top"><span class="ev-ic">'+c.icon+'</span>'
      +'<span style="flex:1;min-width:0"><b class="ev-name">'+esc2(e.name)+'</b>'
      +'<div class="ev-where">'+esc2(e.place)+' \u00b7 '+esc2(e.country)+'</div></span>'
      + count +'</div>'
      +'<div class="ev-when">'+esc2(rwEventDate(e))+' '+badge+' '+rwROIBadge(e)+'</div>'
      +(e.vibe?'<div class="ev-vibe">'+esc2(e.vibe)+'</div>':'')
      +'<div class="ev-actions">'
      +'<button class="tact ev-go" onclick="rwEventPlan(\''+e.id+'\')">\u2728 Build my trip</button>'
      +'<button class="tact" onclick="rwEventTips(\''+e.id+'\')">\ud83d\udca1 Know before you go</button>'
      +'<button class="tact" onclick="rwEventWorth(\''+e.id+'\')">\u2696\ufe0f Is it worth it?</button>'
      +'</div></div>';
  }
  host.innerHTML =
     (soon.length? '<div class="ev-head">\ud83d\udd25 Happening soon</div>'+soon.map(function(e){return card(e,true);}).join('') : '')
    +(later.length? '<div class="ev-head">\ud83d\uddd3\ufe0f Later in the year</div>'+later.map(function(e){return card(e,false);}).join('') : '')
    +(window._evSynced? '<div style="font-size:11px;color:#4ADE80;margin-top:12px">\u21bb '+window._evSynced.count+' live events synced'+(window._evSynced.updated?' \u00b7 updated '+String(window._evSynced.updated).slice(0,10):'')+'</div>' : '')
    +'<div style="font-size:11px;color:var(--t3);margin-top:14px;line-height:1.6">Dates marked <b>~ typical</b> are our best estimate from previous years, not an announcement. Always confirm with the organiser before you book travel.</div>';
}

function rwEventWorth(id){
  var e=rwEventById(id); if(!e) return;
  var ov=el('evWorthOv');
  if(!ov){ ov=document.createElement('div'); ov.id='evWorthOv'; ov.className='overlay'; ov.style.zIndex='3200';
    ov.onclick=function(x){ if(x.target===ov) rwOverlayClose('evWorthOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:430px"><div class="sheet-h"><b>\u2696\ufe0f '+esc2(e.name)+'</b>'
    +'<button onclick="rwOverlayClose(\'evWorthOv\')" class="tact">\u2715</button></div>'
    +'<div style="font-size:12px;color:var(--t2);margin:2px 0 12px">'+esc2(e.place)+' \u00b7 '+esc2(rwEventDate(e))+'</div>'
    + rwROIPanel(e)
    +'<button class="tact" style="width:100%;margin-top:12px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwOverlayClose(\'evWorthOv\');rwEventPlan(\''+e.id+'\')">\u2728 Build my trip anyway</button></div>';
  ov.classList.add('open');
}
/* sort helper: highest net ROI first within a bucket */
function rwByROI(a,b){
  var va=rwEventROI(a), vb=rwEventROI(b);
  return ((vb?vb.net:0)-(va?va.net:0));
}


/* Pull weekly-refreshed events from the Worker when one is configured.
   SAFE BY DESIGN: curated events in events-data.js always win; fetched ones are
   appended, never overwrite. If the Worker is absent or fails, the app is
   exactly what it is today. */
function rwEventsSync(){
  try{
    var api = window.rwApi && rwApi('events');
    if(!api) return;                                  /* no worker configured */
    fetch(api).then(function(r){ return r.json(); }).then(function(d){
      if(!d || !d.events || !d.events.length) return;
      var have = {}; (window.RW_EVENTS||[]).forEach(function(e){ have[(e.name||'').toLowerCase()]=1; });
      var added = d.events.filter(function(e){ return e.name && !have[e.name.toLowerCase()]; });
      if(!added.length) return;
      window.RW_EVENTS = (window.RW_EVENTS||[]).concat(added);
      window._evSynced = { count: added.length, updated: d.updated };
      if(el('eventsOut')) rwEventsRender();
    }).catch(function(){});
  }catch(e){}
}

function rwEventById(id){ return (window.RW_EVENTS||[]).filter(function(e){ return e.id===id; })[0]; }
function rwEventTips(id){
  var e=rwEventById(id); if(!e) return;
  var C={}; (window.RW_EVENT_CATS||[]).forEach(function(c){ C[c.id]=c; });
  var generic={
    music:['Earplugs. Genuinely \u2014 the good ones cost little and save your hearing.','Cash still rules at most Indian festival grounds.','Phone battery pack; charging queues are long.'],
    startup:['Have a one-line answer to \u201cwhat do you do\u201d before you arrive.','The corridor and side events beat the main stage for meeting people.','Carry more business cards than feels sensible.'],
    sports:['Buy tickets only through the official channel \u2014 resale scams spike near event dates.','Arrive far earlier than you think; gates and security are slow.','Check the bag-size rule before you leave the hotel.'],
    auto:['Go on the first public morning \u2014 halls empty out by afternoon on day one.','Comfortable shoes; expo floors are enormous.','Photography rules vary by hall.']
  }[e.cat]||[];
  var ov=el('evTipsOv');
  if(!ov){ ov=document.createElement('div'); ov.id='evTipsOv'; ov.className='overlay'; ov.style.zIndex='3200';
    ov.onclick=function(x){ if(x.target===ov) rwOverlayClose('evTipsOv'); }; document.body.appendChild(ov); }
  ov.innerHTML='<div class="sheet" style="max-width:420px"><div class="sheet-h"><b>\ud83d\udca1 '+esc2(e.name)+'</b>'
    +'<button onclick="rwOverlayClose(\'evTipsOv\')" class="tact">\u2715</button></div>'
    +'<div style="font-size:12.5px;color:var(--t2);margin:2px 0 12px">'+esc2(e.place)+' \u00b7 '+esc2(rwEventDate(e))+'</div>'
    +((e.tips||[]).length? '<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin-bottom:7px">SPECIFIC TO THIS EVENT</div>'
      +(e.tips||[]).map(function(t){ return '<div class="ev-tip">\u2022 '+esc2(t)+'</div>'; }).join('') : '')
    +(generic.length? '<div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.06em;margin:14px 0 7px">'+(C[e.cat]?C[e.cat].label.toUpperCase():'GENERAL')+' EVENTS</div>'
      +generic.map(function(t){ return '<div class="ev-tip">\u2022 '+esc2(t)+'</div>'; }).join('') : '')
    +'<button class="tact" style="width:100%;margin-top:14px;font-weight:800;background:linear-gradient(135deg,var(--gold,#E8BA6C),var(--gold2,#C8913E));color:#0A0A0C;border:none" onclick="rwOverlayClose(\'evTipsOv\');rwEventPlan(\''+e.id+'\')">\u2728 Build my trip around this</button></div>';
  ov.classList.add('open');
}
/* The actual value: an event becomes a themed trip, with category-aware framing. */
function rwEventPlan(id){
  var e=rwEventById(id); if(!e) return;
  var theme={
    music:'Frame it around the festival: arrive a day early to settle in, plan recovery time, and suggest what to do in the area on non-show days.',
    startup:'Frame it around the conference: arrive the evening before, keep mornings free for meetings, and suggest good places to actually talk to people.',
    sports:'Frame it around the event day: getting to the venue, timing around traffic, and what to see nearby on the other days.',
    auto:'Frame it around the show: the best day and time to attend, and what else is worth seeing in the city.'
  }[e.cat]||'';
  var when=rwEventDate(e);
  var q='I want to go to '+e.name+' at '+e.place+', '+e.country+' ('+when+'). '
    +'Plan the trip around it. '+theme+' '
    +'Use honest India road times if travel is overland, give a realistic budget, and flag anything I must arrange in advance (permits, tickets, acclimatisation).';
  rwCloseSection('eventsSection');
  var inp=el('heroInput')||el('cpInput');
  if(inp){ inp.value=q; try{ copilotSend(!!el('heroInput')); }catch(err){} }
  showToast('\u2728 Planning your '+e.name+' trip');
}
