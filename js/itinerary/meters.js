// @ts-nocheck
// Moved verbatim from app.js (Phase 7a) — Pollution + Happiness Meters:
// indicative, country-level air-quality and World-Happiness-Report bands
// rendered on destination cards. Called from renderCards() in app.js.
/* ===== POLLUTION + HAPPINESS METERS (indicative, country-level) ===== */
var METERS={'Finland':[1,5],'Denmark':[1,5],'Iceland':[1,5],'Sweden':[1,5],'Norway':[1,5],'Switzerland':[1,5],'Netherlands':[2,5],'New Zealand':[1,4],'Australia':[1,4],'Canada':[2,4],'Austria':[2,4],'Germany':[2,4],'United Kingdom':[2,4],'France':[2,4],'Spain':[2,4],'Italy':[2,4],'Portugal':[2,4],'Greece':[2,3],'Japan':[2,4],'South Korea':[3,3],'Taiwan':[2,4],'Singapore':[2,4],'United States':[2,4],'Mexico':[3,4],'Brazil':[3,3],'Argentina':[2,3],'Peru':[3,3],'Colombia':[3,3],'Thailand':[3,3],'Vietnam':[4,3],'Indonesia':[4,3],'Malaysia':[3,3],'Philippines':[3,3],'India':[5,3],'Nepal':[4,3],'Sri Lanka':[3,3],'Bhutan':[2,4],'China':[4,3],'Turkey':[3,3],'Morocco':[3,3],'Egypt':[4,2],'Kenya':[3,3],'South Africa':[3,3],'UAE':[3,4],'Georgia':[3,3],'Armenia':[3,3],'Pakistan':[5,2]};
function metersBlock(d){
  var m = METERS[d.country]; if(!m) return '';
  var airPct=[95,75,55,35,18][m[0]-1], airTxt=['Excellent','Good','Moderate','Poor','Very poor'][m[0]-1];
  var airClr=['#16BF96','#7BC96F','#E09030','#E8524A','#C4302B'][m[0]-1];
  var hapPct=[20,40,60,80,96][m[1]-1], hapTxt=['Low','Below avg','Average','High','Very high'][m[1]-1];
  return '<div class="meter"><div class="meter-top"><span>\ud83c\udf2b\ufe0f Air quality (typical)</span><span style="color:'+airClr+'">'+airTxt+'</span></div><div class="meter-track"><div class="meter-fill" style="width:'+airPct+'%;background:'+airClr+'"></div></div></div>'
    +'<div class="meter"><div class="meter-top"><span>\ud83d\ude0a Happiness index</span><span style="color:#E8BA6C">'+hapTxt+'</span></div><div class="meter-track"><div class="meter-fill" style="width:'+hapPct+'%;background:linear-gradient(90deg,#C8913E,#E8BA6C)"></div></div></div>'
    +'<div style="font-size:9.5px;color:var(--t3);margin:-4px 0 10px">Country-level indicative bands (WHO air data \u00b7 World Happiness Report tiers)</div>';
}
