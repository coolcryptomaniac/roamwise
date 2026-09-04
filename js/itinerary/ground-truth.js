// @ts-nocheck
/* ========== INDIA GROUND-TRUTH LAYER (rw-v51) ==============================
   THE PROBLEM this fixes: every LLM reasons about distance as if roads are
   European. It will happily claim Dehradun to Rishikesh is 30 minutes, or that
   you can "pop over" to Spiti for a day. On the ground, 30km of Himalayan road
   is two hours. This is RoamWise's single biggest correctness flaw, and it is
   fixable with real terrain rules rather than hoping the model behaves.
   ========================================================================== */
var RW_TERRAIN={
  himalayan: {mult:3.2, kmh:22, note:'hairpin mountain road \u2014 assume roughly a third of plains speed'},
  hill:      {mult:2.2, kmh:32, note:'ghat section \u2014 slower than the map suggests'},
  ghats:     {mult:2.0, kmh:35, note:'Western Ghats climbs and switchbacks'},
  desert:    {mult:1.2, kmh:55, note:'open highway, but few stops \u2014 carry water'},
  coastal:   {mult:1.4, kmh:45, note:'narrow coastal roads through villages'},
  plains:    {mult:1.35,kmh:48, note:'plains highway with real Indian traffic'},
  metro:     {mult:1.9, kmh:18, note:'city traffic \u2014 budget far more than the map says'}
};
var RW_TERRAIN_KEYS={
  himalayan:['ladakh','leh','spiti','kaza','tawang','zanskar','nubra','kinnaur','chitkul','sikkim','lachung','munsiyari','auli','badrinath','kedarnath','gangotri','yamunotri','rohtang','manali-leh','sach pass','khardung'],
  hill:['manali','shimla','mussoorie','nainital','almora','kausani','dharamshala','mcleod','kasol','bir','chopta','ranikhet','darjeeling','gangtok','shillong','cherrapunji','ooty','kodaikanal','munnar','coorg','chikmagalur','wayanad','mount abu','dalhousie','khajjiar','pithoragarh','rishikesh','dehradun','haridwar'],
  ghats:['lonavala','mahabaleshwar','matheran','igatpuri','amboli','agumbe'],
  desert:['jaisalmer','bikaner','jodhpur','barmer','kutch','rann'],
  coastal:['goa','gokarna','varkala','alleppey','kochi','pondicherry','mahabalipuram','diu','konkan','ratnagiri','alibaug','andaman'],
  metro:['delhi','mumbai','bengaluru','bangalore','chennai','kolkata','hyderabad','pune','ahmedabad','jaipur','lucknow']
};
function rwTerrainOf(place){
  var t=String(place||'').toLowerCase();
  for(var k in RW_TERRAIN_KEYS){
    var arr=RW_TERRAIN_KEYS[k];
    for(var i=0;i<arr.length;i++){ if(t.indexOf(arr[i])>-1) return k; }
  }
  return 'plains';
}
/* Honest travel time for a road distance, given the terrain. */
function rwRoadTime(km, place){
  var T=RW_TERRAIN[rwTerrainOf(place)]||RW_TERRAIN.plains;
  var hrs=km/T.kmh;
  var h=Math.floor(hrs), m=Math.round((hrs-h)*60);
  if(m===60){ h++; m=0; }
  return {hours:hrs, label:(h?h+'h ':'')+(m?m+'m':(h?'':'a few min')), note:T.note, terrain:rwTerrainOf(place)};
}
/* A human-readable reality check we can show under any itinerary. */
function rwGroundTruth(place){
  var k=rwTerrainOf(place), T=RW_TERRAIN[k];
  if(k==='plains') return '';
  var lines={
    himalayan:'High-mountain roads. Distances here lie \u2014 100km can take 5 hours. Roads close for snow/landslides, and altitude means you should plan a rest day before anything strenuous.',
    hill:'Hill roads with hairpins. Budget roughly double the time a map app suggests, and avoid night driving.',
    ghats:'Ghat climbs and switchbacks \u2014 slower than they look, and slippery in monsoon.',
    desert:'Open roads but long empty stretches. Carry water, fuel up early, and avoid midday in summer.',
    coastal:'Narrow roads through villages. Short distances still eat time.',
    metro:'City traffic. Whatever the map says, add half again \u2014 more in peak hours.'
  };
  return lines[k]||'';
}

/* ===== CYCLE MODE SAFETY (rw-v51) — elevation, monsoon, and honest limits ==
   Cycle Mode routes people through narrow old-city lanes on a folding cycle.
   That is brilliant in flat Varanasi lanes and dangerous on a Himalayan
   gradient in July. These checks fire BEFORE we suggest it. */
var RW_MONSOON={ 6:'heavy', 7:'peak', 8:'peak', 9:'retreating' };
function rwCycleSafety(place, monthIdx){
  var m=(typeof monthIdx==='number')? monthIdx+1 : (new Date().getMonth()+1);
  var terrain=rwTerrainOf(place);
  var warn=[], block=false;
  if(terrain==='himalayan'){ block=true; warn.push({lvl:'stop', t:'Not suitable here', d:'Sustained high-altitude climbs and unlit hairpins \u2014 a folding cycle is the wrong tool. Use shared taxis.'}); }
  else if(terrain==='hill'||terrain==='ghats'){ warn.push({lvl:'warn', t:'Steep gradients', d:'Expect sustained climbs. Fine going down, hard going up \u2014 plan a one-way route and a taxi back.'}); }
  if(RW_MONSOON[m]){
    var sev=RW_MONSOON[m];
    warn.push({lvl: sev==='peak'?'stop':'warn', t:'Monsoon '+(sev==='peak'?'peak':'season'),
      d: sev==='peak' ? 'Waterlogged lanes, poor visibility and slick stone. Skip cycling this month.' : 'Rain likely \u2014 carry a poncho and avoid flooded underpasses.'});
    if(sev==='peak') block=true;
  }
  if(terrain==='metro'){ warn.push({lvl:'warn', t:'Traffic', d:'Stay in the old-city lanes as planned. Do not take a folding cycle onto arterial roads.'}); }
  if(terrain==='desert' && m>=4 && m<=6){ warn.push({lvl:'stop', t:'Extreme heat', d:'40\u00b0C+ by mid-morning. Cycle at dawn only, or not at all.'}); block=true; }
  return {ok:!block, warnings:warn, terrain:terrain};
}
function rwCycleCard(place, monthIdx){
  var c=rwCycleSafety(place, monthIdx);
  if(!c.warnings.length) return '<div style="border:1px solid rgba(74,222,128,.4);background:rgba(74,222,128,.07);border-radius:12px;padding:12px;margin:10px 0">'
    +'<b style="color:#4ADE80;font-size:13px">\ud83d\udeb2 Good conditions for Cycle Mode</b>'
    +'<div style="font-size:12px;color:var(--t2);margin-top:4px">Flat lanes and dry season \u2014 park at the old-city edge and ride in.</div></div>';
  return c.warnings.map(function(w){
    var stop=w.lvl==='stop', col=stop?'#E05B5B':'#F0A63B';
    return '<div style="border:1px solid '+col+'55;background:'+col+'12;border-radius:12px;padding:12px;margin:8px 0">'
      +'<b style="color:'+col+';font-size:13px">'+(stop?'\u26d4':'\u26a0\ufe0f')+' '+esc2(w.t)+'</b>'
      +'<div style="font-size:12px;color:var(--t2);margin-top:4px">'+esc2(w.d)+'</div></div>';
  }).join('');
}
