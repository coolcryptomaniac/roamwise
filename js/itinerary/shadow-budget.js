// @ts-nocheck
// Moved verbatim from app.js (Phase 7a) — Shadow Budget: models the
// real day-by-day cash-flow (transfers, tips, SIM, FX spread, buffer) that
// headline weekly prices leave out. Called from js/copilot/rich-reply.js,
// js/copilot/answer-cards.js, js/copilot/tusk-persona.js, js/social/trip-board.js
// and js/itinerary/trip-vault.js.
/* ==================== SHADOW BUDGET — the costs nobody quotes ==============
   Competitors show a headline "$950/week". Travellers actually get ambushed by
   the gaps: airport transfers, daily metro fares, the ATM's FX spread, tipping
   norms, a tourist SIM, entry tickets. This computes those from the same data
   the app already holds (weekly cost tiers + the brk breakdown) and returns a
   day-by-day cash-flow prediction in USD and INR.
   Every number is a MODELLED ESTIMATE from the destination's own price band —
   labelled as such in the UI, never dressed up as live pricing. */
var TIP_BY_REGION = {
  'North America':0.18, 'Europe':0.07, 'Western Europe':0.07, 'Eastern Europe':0.08,
  'Southeast Asia':0.05, 'South Asia':0.05, 'East Asia':0.0, 'Japan':0.0,
  'Middle East':0.10, 'Africa':0.10, 'South America':0.10, 'Oceania':0.05
};
/* The curated DB covers 15 countries — none of them India, because it was
   built for international trips. Domestic trips (Manali, Rishikesh, Ziro) come
   from the live geocoder and had no cost band at all, so the shadow budget
   never fired for the app's core audience. This table gives any geocoded place
   a sensible band by country, falling back to a regional default. Daily USD,
   deliberately conservative and clearly labelled as an estimate. */
var RW_COST_HINTS = {
  IN:{d:{budget:22,mid:52,luxury:130}, region:'South Asia'},
  NP:{d:{budget:20,mid:45,luxury:110}, region:'South Asia'},
  LK:{d:{budget:24,mid:55,luxury:135}, region:'South Asia'},
  BT:{d:{budget:70,mid:120,luxury:250}, region:'South Asia'},
  TH:{d:{budget:28,mid:60,luxury:160}, region:'Southeast Asia'},
  VN:{d:{budget:25,mid:55,luxury:140}, region:'Southeast Asia'},
  ID:{d:{budget:26,mid:58,luxury:150}, region:'Southeast Asia'},
  MY:{d:{budget:30,mid:65,luxury:160}, region:'Southeast Asia'},
  SG:{d:{budget:70,mid:140,luxury:320}, region:'Southeast Asia'},
  AE:{d:{budget:65,mid:130,luxury:300}, region:'Middle East'},
  JP:{d:{budget:70,mid:135,luxury:320}, region:'East Asia'},
  GB:{d:{budget:80,mid:150,luxury:350}, region:'Europe'},
  FR:{d:{budget:70,mid:135,luxury:320}, region:'Europe'},
  IT:{d:{budget:65,mid:125,luxury:300}, region:'Europe'},
  ES:{d:{budget:60,mid:115,luxury:280}, region:'Europe'},
  DE:{d:{budget:70,mid:130,luxury:300}, region:'Europe'},
  US:{d:{budget:95,mid:180,luxury:420}, region:'North America'},
  AU:{d:{budget:85,mid:160,luxury:370}, region:'Oceania'},
  NZ:{d:{budget:80,mid:150,luxury:350}, region:'Oceania'}
};
var RW_REGION_DEFAULT = {d:{budget:45,mid:95,luxury:230}, region:'Europe'};
/* Turn a geocoded place into something shadowBudget() understands. */
function costEntryForPlace(geo){
  if(!geo) return null;
  var h = RW_COST_HINTS[(geo.cc||'').toUpperCase()] || RW_REGION_DEFAULT;
  return {
    name: geo.name, country: geo.country || '', region: h.region,
    cost: {budget:h.d.budget*7, mid:h.d.mid*7, luxury:h.d.luxury*7},
    brk: {flights:0, stay:h.d.mid*7*0.42, food:h.d.mid*7*0.26, act:h.d.mid*7*0.18, misc:h.d.mid*7*0.14},
    _estimated: true
  };
}
function shadowBudget(entry, days, style){
  days = Math.max(1, days||5);
  style = style || 'mid';
  var weekly = (entry.cost && entry.cost[style]) || (entry.cost && entry.cost.mid) || 700;
  var brk = entry.brk || {flights:0.30*weekly, stay:0.28*weekly, food:0.18*weekly, act:0.14*weekly, misc:0.10*weekly};
  var perDay = {
    stay:  (brk.stay||0)/7,
    food:  (brk.food||0)/7,
    act:   (brk.act||0)/7,
    local: ((brk.misc||0)/7) * 0.55   /* the metro/bus/tuk-tuk slice of misc */
  };
  var domestic = /^india$/i.test(entry.country||'');
  var tipRate  = TIP_BY_REGION[entry.region] != null ? TIP_BY_REGION[entry.region] : 0.07;
  var oneOff = {
    airport:   Math.round(perDay.local * 3.2),               /* both transfers */
    sim:       domestic ? 0 : 8,                             /* tourist eSIM/data */
    fxSpread:  0,                                            /* filled below */
    buffer:    0
  };
  var dailyBase = perDay.stay + perDay.food + perDay.act + perDay.local;
  var tips = perDay.food * tipRate;
  var dailyTotal = dailyBase + tips;
  var tripSub = dailyTotal*days + oneOff.airport + oneOff.sim;
  oneOff.fxSpread = domestic ? 0 : Math.round(tripSub * 0.025);  /* ATM + card spread */
  oneOff.buffer   = Math.round((tripSub + oneOff.fxSpread) * 0.10);
  var total = tripSub + oneOff.fxSpread + oneOff.buffer;
  return {
    days:days, style:style, domestic:domestic, tipRate:tipRate,
    perDay:perDay, tips:tips, dailyTotal:dailyTotal, oneOff:oneOff,
    total:total,
    cashShare: domestic ? 0.35 : ((entry.region==='Southeast Asia'||entry.region==='South Asia'||entry.region==='Africa') ? 0.55 : 0.25)
  };
}
function shadowBudgetHTML(entry, days, style){
  var b = shadowBudget(entry, days, style);
  var fx = (window._rwFxINR || 88);
  function money(usd){
    if(b.domestic) return '\u20b9'+Math.round(usd*fx).toLocaleString('en-IN');
    return '$'+Math.round(usd)+' <span style="opacity:.6">(\u20b9'+Math.round(usd*fx).toLocaleString('en-IN')+')</span>';
  }
  var rows = [
    ['\ud83c\udfe8 Stay',        b.perDay.stay],
    ['\ud83c\udf5c Food',        b.perDay.food],
    ['\ud83c\udfab Activities',  b.perDay.act],
    ['\ud83d\ude87 Local transit', b.perDay.local],
    ['\ud83d\udcb5 Tips ('+Math.round(b.tipRate*100)+'%)', b.tips]
  ].map(function(r){
    return '<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0">'
      +'<span style="color:var(--t2)">'+r[0]+'</span><b>'+money(r[1])+'</b></div>';
  }).join('');
  var extras = [
    ['\ud83d\ude95 Airport transfers (both ways)', b.oneOff.airport],
    b.oneOff.sim ? ['\ud83d\udcf1 Tourist SIM / eSIM', b.oneOff.sim] : null,
    b.oneOff.fxSpread ? ['\ud83c\udfe7 ATM + card FX spread (~2.5%)', b.oneOff.fxSpread] : null,
    ['\ud83d\udee1 Buffer (10%)', b.oneOff.buffer]
  ].filter(Boolean).map(function(r){
    return '<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0">'
      +'<span style="color:var(--t2)">'+r[0]+'</span><b>'+money(r[1])+'</b></div>';
  }).join('');
  return '<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:13px 15px;margin-top:10px">'
    +'<div style="font-weight:800;font-size:13px;margin-bottom:2px">\ud83d\udc7b Shadow budget \u2014 '+b.days+' days in '+String(entry.name).replace(/[<>]/g,'')+'</div>'
    +'<div style="font-size:10.5px;color:var(--t3);margin-bottom:9px">The costs headline prices leave out. '+(entry._estimated? 'Modelled from typical '+(entry.country||'regional')+' prices' : 'Modelled from this destination\u2019s '+b.style+' price band')+' \u2014 estimates, not live quotes.</div>'
    +'<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);margin-bottom:3px">Every day</div>'
    + rows
    +'<div style="display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;border-top:1px solid var(--b2,#2A2A36);margin-top:5px"><b>Daily burn</b><b style="color:var(--gold,#E8BA6C)">'+money(b.dailyTotal)+'</b></div>'
    +'<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold2,#C8913E);margin:9px 0 3px">Once per trip</div>'
    + extras
    +'<div style="display:flex;justify-content:space-between;font-size:14px;padding:8px 0 2px;border-top:1px solid var(--b2,#2A2A36);margin-top:6px"><b>Total</b><b style="color:var(--gold,#E8BA6C)">'+money(b.total)+'</b></div>'
    +'<div style="font-size:11px;color:var(--t3);margin-top:7px;line-height:1.6">\ud83d\udcb5 Carry roughly <b>'+money(b.total*b.cashShare)+'</b> as cash \u2014 the rest works on card here.</div>'
    +'</div>';
}
