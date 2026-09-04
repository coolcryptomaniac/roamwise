// @ts-nocheck
/* ==================== COPILOT: TUSK ANSWER CARDS ====================
   Extracted verbatim from app.js (Phase 4b modularization).
   One themed, animated card per destination answer instead of a stack of
   loose blocks. Everything the traveller needs in reading order: place
   header (photo + theme gradient), what it is, what to do, itinerary
   shortcuts, budget, ground costs, voice note, follow-up chips.

   Also carries the budget-fit helpers (rwIntlHTML, rwStyledSheet,
   rwBudgetFit/rwBudgetFitHTML) that shipped physically bundled under this
   same app.js header with no sub-heading of their own, and that render
   directly into these answer cards (js/copilot/rich-reply.js's
   cpActionsHTML calls rwBudgetFitHTML). ==== */

/* ==================== TUSK ANSWER CARDS ====================
   One themed, animated card per destination answer instead of a stack of
   loose blocks. Everything the traveller needs in reading order: place header
   (photo + theme gradient), what it is, what to do, itinerary shortcuts,
   budget, ground costs, voice note, follow-up chips. Attribution lives ONCE
   in a compact footer instead of link lines scattered through the answer —
   the CC BY-SA credit is still always present, just tidy. */
async function wvStructured(place, question){
  var g = await wvGuide(place);
  if(!g) return null;
  /* Search can return an unrelated first hit ("Say" -> Natchitoches, Louisiana).
     If the guide title doesn't resemble the place, showing it is worse than
     showing nothing. */
  var pl=String(place).toLowerCase(), tl=String(g.title).toLowerCase();
  if(tl.indexOf(pl)===-1 && pl.indexOf(tl)===-1) return null;
  var picks = wvPickSections(question||'', g.sections||[]);
  var out = {title:g.title, intro:(g.extract||'').slice(0,300), secs:[]};
  for(var i=0;i<picks.length;i++){
    var body = await wvSection(g.title, picks[i].index);
    if(body && body.length>40) out.secs.push({line:picks[i].line, text:body});
  }
  return out;
}
function tkBullets(text, n){
  /* readable bullets out of guide prose: whole sentences, medium length */
  var sents = String(text).split(/(?<=[.!?])\s+/).map(function(x){ return x.trim(); });
  return sents.filter(function(x){ return x.length>=30 && x.length<=150 && !/==/.test(x); }).slice(0, n||4);
}
function tkThemeGrad(name){
  var th = themeFor({name:name, tags:[], interests:[]});
  var a=th.acc, d=th.deep;
  return 'linear-gradient(150deg, rgb('+a[0]+','+a[1]+','+a[2]+') 0%, rgb('+d[0]+','+d[1]+','+d[2]+') 90%)';
}
function tkHeadStyle(name){
  var img = (typeof RW_PHOTOS!=='undefined' && RW_PHOTOS && RW_PHOTOS[name]) ? RW_PHOTOS[name] : null;
  if(img) return 'background-image:url('+img+')';
  return 'background:'+tkThemeGrad(name);
}
function cpFollow(q){
  var i=el('heroInput'); if(!i) return;
  i.value=q; copilotSend(true);
}
function tkFollowChips(dest){
  var qs=[['\ud83c\udf5c Food', 'what should I eat there?'],
          ['\ud83d\ude8c Reaching', 'how do I reach?'],
          ['\ud83c\udfe8 Stay', 'where to stay?'],
          ['\ud83d\udee1\ufe0f Safety', 'is it safe? any scams?'],
          ['\u26c5 Weather', 'weather there?']];
  return '<div class="tk-chips">'
    + qs.map(function(q){ return '<button class="tk-chip" onclick="cpFollow(\''+q[1].replace(/'/g,"\\'")+'\')">'+q[0]+'</button>'; }).join('')
    + '</div>';
}
function tkItinChips(dest){
  var d = String(dest).replace(/'/g,'');
  return '<div class="tk-chips">'
    + [3,5,7].map(function(n){
        var tag = n===3?'\u26a1 3-day sprint' : n===5?'\ud83c\udfaf 5-day classic' : '\ud83c\udf0a 7-day deep';
        return '<button class="tk-chip gold" onclick="cpGoPlan(\''+d+'\','+n+')">'+tag+'</button>';
      }).join('')
    + '</div>';
}
function tkCredits(used){
  var bits=[];
  if(used.wv) bits.push('Guide text: <a target="_blank" rel="noopener" href="https://en.wikivoyage.org/wiki/'+encodeURIComponent(used.wv)+'">Wikivoyage</a> (CC BY-SA)');
  if(used.photo) bits.push('Photo: Wikipedia');
  if(used.osm) bits.push('Places: \u00a9 OpenStreetMap contributors');
  if(used.wx) bits.push('Weather: Open-Meteo');
  if(!bits.length) return '';
  return '<div class="tk-foot">'+bits.join(' \u00b7 ')+'</div>';
}



/* ---- INTERNATIONAL CHECKLIST ----
   The shadow budget deliberately excludes flights ("costs headline prices
   leave out") — fine domestically, badly misleading for Switzerland where the
   flight IS the biggest line. For any non-home-country destination, show the
   on-top items: visa, return-flight ballpark, insurance, passport validity.
   Ranges are typical for Indian passport holders and say so; rules change, so
   the official-source reminder is always printed. */
function rwIntlHTML(geo){
  if(!geo || !geo.cc) return '';
  var cc = String(geo.cc).toUpperCase();
  var HOME = (typeof RW_HOME_CC!=='undefined' && RW_HOME_CC) ? RW_HOME_CC : 'IN';
  if(cc===HOME) return '';
  var SCHENGEN=['CH','FR','DE','IT','ES','PT','NL','BE','AT','GR','CZ','PL','HU','DK','SE','NO','FI','IS','SK','SI','EE','LV','LT','LU','MT','HR','LI'];
  var visa, flight, extra='';
  if(SCHENGEN.indexOf(cc)>-1){
    visa='Schengen visa required \u2014 fee \u224880\u20ac (\u2248\u20b97,500) + VFS charges; apply 4\u20138 weeks ahead with itinerary, stay proof and bank statements.';
    flight='Return flights India \u2194 Europe: \u2248\u20b935,000\u201360,000 if booked 6\u201310 weeks out.';
    extra='Travel insurance is MANDATORY for Schengen (\u2248\u20b91,000\u20132,000/week).';
  } else if(['TH','ID','VN','MY','KH','LA','PH','SG'].indexOf(cc)>-1){
    var m={TH:'Thailand: visa-free entry for Indians (60 days, current policy)',ID:'Indonesia: visa on arrival \u2248\u20b92,600',VN:'Vietnam: e-visa \u2248\u20b92,100, apply online 1\u20132 weeks ahead',MY:'Malaysia: visa-free (30 days) \u2014 fill the MDAC form online first',KH:'Cambodia: e-visa \u2248\u20b93,000',LA:'Laos: visa on arrival \u2248\u20b93,500',PH:'Philippines: e-visa needed for most Indian passports',SG:'Singapore: visa required \u2248\u20b92,500\u20133,500 via authorised agents'};
    visa=m[cc]||'Check visa requirements for your passport.';
    flight='Return flights India \u2194 Southeast Asia: \u2248\u20b912,000\u201328,000.';
  } else if(cc==='NP' || cc==='BT'){
    visa=(cc==='NP'?'Nepal':'Bhutan')+': no visa needed for Indian citizens \u2014 carry passport or voter ID'+(cc==='BT'?'; Bhutan charges a daily Sustainable Development Fee (\u20b91,200/day for Indians)':'')+'.';
    flight='Flights \u2248\u20b98,000\u201318,000 return, or overland by road/rail.';
  } else if(cc==='LK'){
    visa='Sri Lanka: free ETA for Indians currently \u2014 apply online before flying.';
    flight='Return flights \u2248\u20b910,000\u201320,000.';
  } else if(cc==='AE'){
    visa='UAE: e-visa \u2248\u20b96,000\u20137,500, usually 3\u20134 working days.';
    flight='Return flights \u2248\u20b914,000\u201330,000.';
  } else {
    visa='Visa: check the official embassy site for Indian passport requirements \u2014 rules vary and change.';
    flight='Compare return fares on any aggregator; book 6\u201310 weeks out for the best band.';
  }
  return '<div style="background:rgba(92,200,255,.06);border:1px solid rgba(92,200,255,.25);border-radius:12px;padding:11px 13px">'
    +'<div style="font-weight:800;font-size:12.5px;margin-bottom:6px">\ud83d\udec2 International trip \u2014 these sit ON TOP of the sheet below</div>'
    +'<div class="tk-bul">'+visa+'</div>'
    +'<div class="tk-bul">'+flight+'</div>'
    +(extra? '<div class="tk-bul">'+extra+'</div>':'')
    +'<div class="tk-bul">Passport must be valid 6+ months beyond travel; keep 2 blank pages.</div>'
    +'<div style="font-size:10px;color:var(--t3);margin-top:6px">Typical figures for Indian passport holders \u2014 verify on the official embassy/VFS site before paying anyone.</div>'
    +'</div>';
}
function rwStyledSheet(entry, days, style){
  entry = JSON.parse(JSON.stringify(entry));
  delete entry.brk;
  if(entry.cost && !entry.cost.budget) entry.cost.budget = Math.round(entry.cost.mid*0.55);
  var fx = window._rwFxINR || 88;
  var tot = Math.round(shadowBudget(entry, days, style).total * fx);
  var label = style==='budget' ? '\ud83c\udf92 Shoestring plan \u2248 \u20b9'+tot.toLocaleString('en-IN')+' (ex-flights)'
            : '\ud83d\udc51 Luxury plan \u2248 \u20b9'+tot.toLocaleString('en-IN')+' (ex-flights)';
  return '<div style="font-size:12px;color:var(--t2)">'+label+' \u2014 breakdown below.</div>'
    + tkFold('\ud83d\udc7b '+(style==='budget'?'Shoestring':'Luxury')+' budget \u2014 breakdown', shadowBudgetHTML(entry, days, style));
}

/* ---- BUDGET FIT: answer the budget the user actually stated ----
   "5 days in Almora under 5000" used to get the standard mid-range sheet
   totalling ~27k — which reads as ignoring the person. Now: try to FIT the cap
   (drop to the budget tier), and when even that can't fit, say so plainly with
   the real minimum and two honest ways out (fewer days, or a higher cap).
   Numbers come from the same model as the sheet — no fudging to please. */
function rwBudgetFit(entry, days, capINR){
  var fx = window._rwFxINR || 88;
  /* Estimated entries carry only a mid price; without a real shoestring tier
     the "bare-bones" number silently showed MID prices — dishonest twice over.
     Model shoestring as 55% of mid (hostel/bus/street-food ratio), and the
     sheet itself already labels everything as an estimate. */
  /* entries carry a FIXED brk (absolute $ split); shadowBudget prefers it over
     the tier weekly, so 'budget' and 'mid' produced identical totals — the fit
     silently didn't fit. For fitting we clone and drop brk so the tier weekly
     drives the split (the sheet is labelled an estimate either way). */
  entry = JSON.parse(JSON.stringify(entry));
  delete entry.brk;
  if(entry.cost && !entry.cost.budget) entry.cost.budget = Math.round(entry.cost.mid*0.55);
  function tot(style){ try{ return Math.round(shadowBudget(entry, days, style).total * fx); }catch(e){ return null; } }
  var tMid = tot('mid'), tLo = tot('budget');
  if(tMid!=null && capINR >= tMid) return {fit:'mid', total:tMid};
  if(tLo!=null && capINR >= tLo)  return {fit:'budget', total:tLo};
  /* how many days DOES the cap buy at the budget tier? */
  var okDays = 0;
  for(var d=days-1; d>=1; d--){
    var td = Math.round(shadowBudget(entry, d, 'budget').total * fx);
    if(td <= capINR){ okDays=d; break; }
  }
  return {fit:'none', minINR:tLo, okDays:okDays};
}
function rwBudgetFitHTML(entry, it){
  var days = it.days||5, cap = it.budget;
  entry = JSON.parse(JSON.stringify(entry));
  delete entry.brk;
  if(entry.cost && !entry.cost.budget) entry.cost.budget = Math.round(entry.cost.mid*0.55);
  var f = rwBudgetFit(entry, days, cap);
  var nm = String(entry.name||it.dest).replace(/[<>]/g,'');
  if(f.fit==='mid')
    return '<div style="font-size:12px;color:var(--t2)">\u2705 \u20b9'+cap.toLocaleString('en-IN')+' comfortably covers '+days+' days \u2014 the sheet below is the standard mid-range plan (\u2248\u20b9'+f.total.toLocaleString('en-IN')+').</div>'
      + tkFold('\ud83d\udc7b Budget \u2014 full breakdown', shadowBudgetHTML(entry, days, 'mid'));
  if(f.fit==='budget')
    return '<div style="font-size:12px;color:var(--t2)">\ud83c\udfaf Fitted to your \u20b9'+cap.toLocaleString('en-IN')+': the <b>shoestring</b> plan below lands at \u2248\u20b9'+f.total.toLocaleString('en-IN')+' \u2014 hostels/homestays, local buses, street food. Tight but real.</div>'
      + tkFold('\ud83d\udc7b Shoestring budget \u2014 breakdown', shadowBudgetHTML(entry, days, 'budget'));
  /* can't be done — say it straight, then give real options */
  var chips='';
  if(f.okDays>=1) chips += '<button class="tk-chip gold" onclick="cpGoPlan(\''+nm.replace(/'/g,'')+'\','+f.okDays+')">\u2702\ufe0f '+f.okDays+' day'+(f.okDays>1?'s':'')+' under \u20b9'+cap.toLocaleString('en-IN')+'</button>';
  chips += '<button class="tk-chip" onclick="cpFollow(\''+days+' days in '+nm.replace(/'/g,'')+' under '+Math.ceil((f.minINR||0)/500)*500+'\')">\ud83d\udcc8 Raise to \u2248\u20b9'+(Math.ceil((f.minINR||0)/500)*500).toLocaleString('en-IN')+'</button>';
  return '<div style="background:rgba(224,91,91,.07);border:1px solid rgba(224,91,91,.3);border-radius:12px;padding:11px 13px">'
    +'<div style="font-size:12.5px;line-height:1.65;color:var(--t1)"><b>Straight answer:</b> \u20b9'+cap.toLocaleString('en-IN')+' won\u2019t cover '+days+' days in '+nm+'. Bare-bones (hostel dorm, bus, street food) runs \u2248<b>\u20b9'+(f.minINR||0).toLocaleString('en-IN')+'</b> all-in \u2014 that includes transfers and a safety buffer, which is where most "cheap" plans blow up.</div>'
    +'<div class="tk-chips" style="margin-top:9px">'+chips+'</div></div>'
    + tkFold('\ud83d\udc7b The \u20b9'+ (f.minINR||0).toLocaleString('en-IN') +' bare-bones breakdown', shadowBudgetHTML(entry, days, 'budget'));
}
