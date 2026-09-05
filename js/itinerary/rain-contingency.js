// @ts-nocheck
// Moved verbatim from app.js — Rain Contingency: reads a saved trip's 7-day
// forecast, flags the first outdoor day that lands on a wet forecast, and
// offers a swap with an indoor day. Called from js/itinerary/trip-vault.js.
/* ==================== RAIN CONTINGENCY ====================
   A forecast is useless if the itinerary ignores it. This reads the 7-day
   outlook already fetched for a saved trip, classifies each planned day as
   indoor or outdoor from its own text, and offers a concrete swap. It rewrites
   the SAVED trip only when the traveller accepts — never silently. */
var OUTDOOR_RE = /trek|hike|beach|walk|market|park|safari|boat|kayak|cycl|sunset|viewpoint|garden|waterfall|snorkel|dive|ride/i;
var INDOOR_RE  = /museum|gallery|cafe|caf\u00e9|spa|mall|palace|fort|temple|shrine|aquarium|workshop|class|brewery|restaurant/i;
function dayIsOutdoor(d){
  var txt = [d.title,d.morning,d.afternoon,d.evening].filter(Boolean).join(' ');
  var out = (txt.match(OUTDOOR_RE)||[]).length, ind = (txt.match(INDOOR_RE)||[]).length;
  return out > ind;
}
function rainSwapHTML(trip, daily){
  if(!trip || !trip.days || !daily || !daily.time) return '';
  var wet = [];
  daily.time.forEach(function(d,i){ if((daily.precipitation_probability_max||[])[i] >= 55) wet.push(i); });
  if(!wet.length) return '';
  var wetIdx = wet[0];                       /* first soggy day of the trip */
  if(wetIdx >= trip.days.length) return '';
  if(!dayIsOutdoor(trip.days[wetIdx])) return '';
  var swapWith = -1;
  for(var i=0;i<trip.days.length;i++){
    if(i!==wetIdx && wet.indexOf(i)===-1 && !dayIsOutdoor(trip.days[i])){ swapWith=i; break; }
  }
  if(swapWith<0) return '';
  var when = new Date(daily.time[wetIdx]).toLocaleDateString('en-IN',{weekday:'long'});
  return '<div style="background:rgba(92,200,255,.08);border:1px solid rgba(92,200,255,.35);border-radius:14px;padding:12px 14px;margin-top:10px">'
    +'<div style="font-weight:800;font-size:12.5px;color:#5CC8FF">\ud83c\udf27 '+when+' looks wet ('+daily.precipitation_probability_max[wetIdx]+'% rain)</div>'
    +'<div style="font-size:12px;color:var(--t2);line-height:1.6;margin-top:5px">Day '+(wetIdx+1)+' is mostly outdoors, Day '+(swapWith+1)+' is mostly indoors. Swapping them keeps the trip intact and moves the walking into dry weather.</div>'
    +'<button class="tact" style="font-size:11.5px;padding:7px 12px;margin-top:8px;font-weight:800" onclick="rainSwapApply(\''+trip.id+'\','+wetIdx+','+swapWith+')">Swap Day '+(wetIdx+1)+' \u2194 Day '+(swapWith+1)+'</button>'
    +'</div>';
}
function rainSwapApply(tripId, a, b){
  var list = vaultGet();
  list.forEach(function(t){
    if(t.id!==tripId || !t.days[a] || !t.days[b]) return;
    var tmp = t.days[a]; t.days[a] = t.days[b]; t.days[b] = tmp;
    /* keep the day numbers in reading order after the swap */
    t.days.forEach(function(d,i){ d.day = i+1; });
  });
  vaultSave(list);
  showToast('\ud83c\udf27 Swapped \u2014 outdoor day moved to drier weather');
  openVaultTrip(tripId);
}
