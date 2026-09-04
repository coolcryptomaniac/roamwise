// @ts-nocheck
/* trek-vault.js — Trek Vault: trek grades/seasons and an honest DIY-vs-organised
   cost comparison across operators (RW_TREK_GRADE, RW_TREKS, RW_TREK_OPS,
   rwTrekListHTML, rwTrekOps, rwTrekDone, rwTrekLog). Split out of
   js/misc/misc-features-3.js (an 8-feature grab-bag left over from Phase 6a
   modularization) as an SRP cleanup; verbatim move, zero logic changes.
   rwTrekDone() is also called from js/game/badges.js. */

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
