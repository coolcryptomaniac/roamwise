// @ts-nocheck
/* RoamWise Travel Pressure — evidence-aware "where to go / where not to go".
   Static incidents MUST expire.  "Avoid" is only used for an attributable
   active restriction/severe incident, never inferred from normal crowd scores. */
var RW_TRAVEL_PRESSURE=[
  {
    id:'kumaon-gridlock-2026-10-04',
    status:'avoid',
    places:['nainital','bhowali','bhimtal','kainchi','kainchi dham','khairna','garampani','almora'],
    corridors:['Haldwani → Kathgodam → Bhowali','Bhowali → Kainchi Dham → Khairna → Almora'],
    headline:'Kumaon long-weekend gridlock',
    reason:'Exceptional congestion and traffic controls reported across the Nainital–Bhowali–Kainchi–Almora corridor.',
    advice:'Avoid non-essential entry during the active restriction window. Re-check Uttarakhand Traffic Police before departure; do not treat a suggested detour as guaranteed open.',
    alternatives:['Mukteshwar / Ramgarh only after checking their approach roads','Stay local and travel after traffic controls ease'],
    source:'Uttarakhand Traffic Police / current public reporting',
    sourceUrl:'https://uttarakhandtraffic.com/',
    observedAt:'2026-10-04T14:45:00+05:30',
    validUntil:'2026-10-04T22:00:00+05:30',
    restrictionWindow:'16:00–22:00 IST',
    confidence:'high'
  }
];

function rwPressureNow(){ return Date.now(); }
function rwPressureActive(x,now){
  now=now||rwPressureNow();
  var until=Date.parse(x.validUntil||'');
  return !!until && isFinite(until) && now<=until;
}
function rwPressureFor(place,now){
  var q=String(place||'').toLowerCase().trim();
  if(!q)return null;
  var hits=RW_TRAVEL_PRESSURE.filter(function(x){
    return rwPressureActive(x,now) && (x.places||[]).some(function(p){return q.indexOf(p)>=0||p.indexOf(q)>=0;});
  });
  return hits[0]||null;
}
function rwPressureLabel(x){
  if(!x)return {text:'GO',icon:'🟢'};
  if(x.status==='avoid')return {text:'AVOID / DELAY',icon:'🔴'};
  if(x.status==='caution')return {text:'CAUTION',icon:'🟠'};
  return {text:'GO',icon:'🟢'};
}
function rwPressureCardHTML(place){
  var x=rwPressureFor(place), l=rwPressureLabel(x);
  if(!x)return '<div class="mode-box" style="border-color:rgba(22,191,150,.35)">🟢 <b>GO</b> · No active RoamWise pressure alert for '+esc2(place)+'. Still check weather and official traffic updates before departure.</div>';
  var alts=(x.alternatives||[]).map(function(a){return '<li>'+esc2(a)+'</li>';}).join('');
  return '<div class="mode-box" style="border-color:rgba(196,48,43,.55)">'
    +'<div style="font-weight:900">🔴 '+esc2(l.text)+' · '+esc2(x.headline)+'</div>'
    +'<div style="font-size:11px;margin-top:5px">'+esc2(x.reason)+'</div>'
    +(x.restrictionWindow?'<div style="font-size:11px;margin-top:5px"><b>Reported control window:</b> '+esc2(x.restrictionWindow)+'</div>':'')
    +'<div style="font-size:11px;margin-top:5px"><b>RoamWise:</b> '+esc2(x.advice)+'</div>'
    +(alts?'<div style="font-size:11px;margin-top:5px"><b>Consider instead:</b><ul style="margin:4px 0 0 18px">'+alts+'</ul></div>':'')
    +'<div style="font-size:9.5px;color:var(--t3);margin-top:7px">Observed '+esc2(x.observedAt)+' · expires '+esc2(x.validUntil)+' · '+esc2(x.confidence)+' confidence · <a href="'+esc2(x.sourceUrl)+'" target="_blank" rel="noopener">official traffic source ↗</a></div>'
    +'</div>';
}
