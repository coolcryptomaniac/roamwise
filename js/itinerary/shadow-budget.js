// @ts-nocheck
/* Shadow Budget v2: all public return values remain USD for legacy callers.
   Curated India DB rows use INR PER DAY; international DB rows and geocoder
   hints use USD PER WEEK. Neither data source is a live, bookable price. */
var TIP_BY_REGION = {
  'North America':0.18, 'Europe':0.07, 'Western Europe':0.07,
  'Eastern Europe':0.08, 'Southeast Asia':0.05, 'South Asia':0.05,
  'East Asia':0, 'Japan':0, 'Middle East':0.10, 'Africa':0.10,
  'South America':0.10, 'Oceania':0.05
};
var RW_COST_HINTS = {
  IN:{d:{budget:22,mid:52,luxury:130},region:'South Asia'},
  NP:{d:{budget:20,mid:45,luxury:110},region:'South Asia'},
  LK:{d:{budget:24,mid:55,luxury:135},region:'South Asia'},
  BT:{d:{budget:70,mid:120,luxury:250},region:'South Asia'},
  TH:{d:{budget:28,mid:60,luxury:160},region:'Southeast Asia'},
  VN:{d:{budget:25,mid:55,luxury:140},region:'Southeast Asia'},
  ID:{d:{budget:26,mid:58,luxury:150},region:'Southeast Asia'},
  MY:{d:{budget:30,mid:65,luxury:160},region:'Southeast Asia'},
  SG:{d:{budget:70,mid:140,luxury:320},region:'Southeast Asia'},
  AE:{d:{budget:65,mid:130,luxury:300},region:'Middle East'},
  JP:{d:{budget:70,mid:135,luxury:320},region:'East Asia'},
  GB:{d:{budget:80,mid:150,luxury:350},region:'Europe'},
  FR:{d:{budget:70,mid:135,luxury:320},region:'Europe'},
  IT:{d:{budget:65,mid:125,luxury:300},region:'Europe'},
  ES:{d:{budget:60,mid:115,luxury:280},region:'Europe'},
  DE:{d:{budget:70,mid:130,luxury:300},region:'Europe'},
  US:{d:{budget:95,mid:180,luxury:420},region:'North America'},
  AU:{d:{budget:85,mid:160,luxury:370},region:'Oceania'},
  NZ:{d:{budget:80,mid:150,luxury:350},region:'Oceania'}
};
var RW_REGION_DEFAULT={d:{budget:45,mid:95,luxury:230},region:'Europe'};
function costEntryForPlace(geo){
  if(!geo)return null;
  var h=RW_COST_HINTS[String(geo.cc||'').toUpperCase()]||RW_REGION_DEFAULT;
  return {name:geo.name,country:geo.country||'',region:h.region,
    cost:{budget:h.d.budget*7,mid:h.d.mid*7,luxury:h.d.luxury*7},
    brk:{flights:0,stay:h.d.mid*7*.42,food:h.d.mid*7*.26,
      act:h.d.mid*7*.18,misc:h.d.mid*7*.14},
    _estimated:true,_priceCurrency:'USD',_pricePeriod:'week'};
}
function shadowBudget(entry,days,style){
  entry=entry||{};
  days=Math.min(60,Math.max(1,Math.round(Number(days)||5)));
  style=(style==='budget'||style==='luxury')?style:'mid';
  var fx=Number(typeof window!=='undefined'&&window._rwFxINR)||88;
  if(!isFinite(fx)||fx<=0)fx=88;
  var india=String(entry.country||'').toLowerCase()==='india';
  var explicitPriceCurrency=String(entry._priceCurrency||'').toUpperCase();
  var inrDaily=explicitPriceCurrency==='INR' || (!explicitPriceCurrency && String(entry.cur||'').toUpperCase()==='INR');
  var priceCurrency=explicitPriceCurrency || (inrDaily?'INR':'USD');
  var scale=inrDaily?1/fx:1/7;
  var bands=entry.cost||{};
  var mid=Number(bands.mid)||0;
  var selected=Number(bands[style])||mid;
  if(!(mid>0))mid=inrDaily?2600:700;
  if(!(selected>0))selected=mid;
  var ratio=selected/mid;
  var source=entry.brk||{};
  var breakdown=['stay','food','act','misc'];
  var sourceSum=breakdown.reduce(function(n,k){return n+(Number(source[k])||0);},0);
  var amounts={};
  if(sourceSum>0){
    breakdown.forEach(function(k){amounts[k]=Math.max(0,Number(source[k])||0)*ratio*scale;});
  }else{
    var base=selected*scale;
    amounts={stay:base*.42,food:base*.26,act:base*.18,misc:base*.14};
  }
  var perDay={stay:amounts.stay,food:amounts.food,act:amounts.act,
    local:amounts.misc*.55,other:amounts.misc*.45};
  // Indian domestic trips have no mandatory percentage tip. Others are only an allowance.
  var tipRate=india?0:(TIP_BY_REGION[entry.region]!=null?TIP_BY_REGION[entry.region]:.07);
  var tips=perDay.food*tipRate;
  var dailyTotal=perDay.stay+perDay.food+perDay.act+perDay.local+perDay.other+tips;
  // Do not invent a taxi fare from a daily transport multiplier: origin, route and
  // exact dates are unknown. Only include an explicitly supplied verified quote.
  var transfer=Number(entry.verifiedAirportTransferUSD);
  var oneOff={airport:isFinite(transfer)&&transfer>0?transfer:0,
    sim:india?0:8,fxSpread:0,buffer:0};
  var tripSub=dailyTotal*days+oneOff.airport+oneOff.sim;
  oneOff.fxSpread=india?0:Math.round(tripSub*.025);
  oneOff.buffer=Math.round((tripSub+oneOff.fxSpread)*.10);
  return {days:days,style:style,domestic:india,tipRate:tipRate,perDay:perDay,
    tips:tips,dailyTotal:dailyTotal,oneOff:oneOff,
    total:tripSub+oneOff.fxSpread+oneOff.buffer,
    cashShare:india?.10:.25,sourceCurrency:priceCurrency,
    sourcePeriod:inrDaily?'day':'week',hasTransferQuote:oneOff.airport>0,
    estimated:true,flightsIncluded:false};
}
function shadowBudgetHTML(entry,days,style){
  var b=shadowBudget(entry,days,style),fx=Number(window._rwFxINR)||88;
  function money(usd){return b.domestic?'\u20b9'+Math.round(usd*fx).toLocaleString('en-IN'):
    '$'+Math.round(usd).toLocaleString('en-US');}
  function row(label,value){return '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;padding:3px 0">'
    +'<span style="color:var(--t2)">'+label+'</span><b>'+money(value)+'</b></div>';}
  var rows=row('\ud83c\udfe8 Stay',b.perDay.stay)+row('\ud83c\udf5c Food',b.perDay.food)
    +row('\ud83c\udfab Activities',b.perDay.act)+row('\ud83d\ude87 Local transit',b.perDay.local)
    +row('\ud83e\uddf3 Other local expenses',b.perDay.other)
    +(b.tips?row('\ud83d\udcb5 Optional tip allowance',b.tips):'');
  var extras=(b.oneOff.airport?row('\ud83d\ude95 Quoted airport transfers',b.oneOff.airport):'')
    +(b.oneOff.sim?row('\ud83d\udcf1 Indicative tourist SIM',b.oneOff.sim):'')
    +(b.oneOff.fxSpread?row('\ud83c\udfe7 Indicative FX allowance',b.oneOff.fxSpread):'')
    +row('\ud83d\udee1 Contingency (10%)',b.oneOff.buffer);
  var name=String(entry&&entry.name||'destination').replace(/[<>&"']/g,'');
  return '<div style="background:var(--bg2,#12121C);border:1px solid var(--b2,#2A2A36);border-radius:14px;padding:13px 15px;margin-top:10px">'
    +'<div style="font-weight:800;font-size:13px;margin-bottom:2px">\ud83d\udc7b Shadow budget \u2014 '+b.days+' days in '+name+'</div>'
    +'<div style="font-size:11px;color:var(--t3);margin:5px 0 10px;line-height:1.5">Illustrative '+b.style+' budget from '+b.sourceCurrency+'-per-'+b.sourcePeriod+' destination bands; NOT live rates or a booking quote. Per person unless stated otherwise. Dates, origin and room sharing can change the cost.</div>'
    +'<div style="font-size:10px;color:var(--gold2,#C8913E);margin-bottom:4px">EVERY DAY</div>'+rows
    +'<div style="display:flex;justify-content:space-between;padding:7px 0;border-top:1px solid var(--b2,#2A2A36)"><b>Daily estimate</b><b>'+money(b.dailyTotal)+'</b></div>'
    +'<div style="font-size:10px;color:var(--gold2,#C8913E);margin:9px 0 4px">ONCE PER TRIP</div>'+extras
    +'<div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid var(--b2,#2A2A36)"><b>Illustrative total</b><b style="color:var(--gold,#E8BA6C)">'+money(b.total)+'</b></div>'
    +'<div style="font-size:11px;color:var(--t3);margin-top:8px;line-height:1.5">Flight/train to destination and unquoted airport transfers are EXCLUDED. Compare actual fares and partner availability before booking; contingency is an allowance, not a charge.</div></div>';
}
