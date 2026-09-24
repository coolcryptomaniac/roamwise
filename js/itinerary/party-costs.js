// @ts-nocheck
/* Party-aware trip costing.
   Destination rows remain per-person planning estimates. This layer turns that
   baseline into an honest group estimate without pretending every expense is
   shareable: rooms and local vehicles get a bounded saving; meals, tickets and
   long-distance fares still scale with each traveller. */
var RW_PARTY_OPTIONS = [
  {size:1,label:'Solo',vehicle:'Public transport / solo cab',saving:0},
  {size:2,label:'Duo · couple · besties',vehicle:'Shared cab',saving:.10},
  {size:3,label:'Trio · friends / family',vehicle:'Cab or compact SUV',saving:.14},
  {size:4,label:'4 friends / family',vehicle:'Sedan or SUV',saving:.17},
  {size:5,label:'5 travellers',vehicle:'6-seater MPV / SUV',saving:.18},
  {size:6,label:'6 travellers',vehicle:'7-seater MPV / SUV',saving:.20},
  {size:8,label:'7–8 travellers',vehicle:'7–8 seater or two cabs',saving:.22},
  {size:10,label:'9–10 travellers',vehicle:'Tempo Traveller',saving:.21},
  {size:15,label:'11–15 travellers',vehicle:'Tempo Traveller / mini coach',saving:.24},
  {size:20,label:'16–20 travellers',vehicle:'Mini coach / two Tempo Travellers',saving:.27},
  {size:30,label:'21–30 travellers',vehicle:'Coach',saving:.28},
  {size:50,label:'31–50 travellers',vehicle:'Coach + group rooms',saving:.30}
];

function rwClampPartySize(value){
  var n=Math.round(Number(value)||1);
  return Math.min(50,Math.max(1,n));
}
function rwPartyMeta(value){
  var n=rwClampPartySize(value), picked=RW_PARTY_OPTIONS[0];
  for(var i=0;i<RW_PARTY_OPTIONS.length;i++){
    if(n>=RW_PARTY_OPTIONS[i].size) picked=RW_PARTY_OPTIONS[i];
  }
  var label=n===1?'Solo':n===2?'Duo · couple · besties':n===3?'Trio · friends / family':n+' travellers';
  return {size:n,label:label,vehicle:picked.vehicle,saving:picked.saving};
}
function rwGetPartySize(){
  var field=(typeof document!=='undefined')?document.getElementById('partySize'):null;
  if(field && field.value) return rwClampPartySize(field.value);
  try{ return rwClampPartySize(localStorage.getItem('rw_party_size')||1); }catch(e){ return 1; }
}
function rwPartyEstimate(perPersonAmount,size){
  var meta=rwPartyMeta(size==null?rwGetPartySize():size);
  var base=Math.max(0,Number(perPersonAmount)||0);
  var soloEquivalent=base*meta.size;
  var groupTotal=soloEquivalent*(1-meta.saving);
  return {
    size:meta.size,label:meta.label,vehicle:meta.vehicle,savingRate:meta.saving,
    soloEquivalent:soloEquivalent,groupTotal:groupTotal,
    perPerson:meta.size?groupTotal/meta.size:groupTotal,
    saving:soloEquivalent-groupTotal
  };
}
function rwPartySelectHTML(selected){
  var n=rwClampPartySize(selected);
  return RW_PARTY_OPTIONS.map(function(o){
    return '<option value="'+o.size+'"'+(o.size===n?' selected':'')+'>'+o.size+' · '+o.label+'</option>';
  }).join('');
}
function rwPartyChanged(){
  var field=document.getElementById('partySize'),n=rwClampPartySize(field&&field.value),meta=rwPartyMeta(n);
  if(field) field.value=String(n);
  try{
    if(typeof rwPersonalisationEnabled!=='function' || rwPersonalisationEnabled()) localStorage.setItem('rw_party_size',String(n));
  }catch(e){ /* optional storage */ }
  var note=document.getElementById('partyCostNote');
  if(note) note.textContent=n===1?'Costs shown for one traveller.':meta.vehicle+' · shared rooms/local rides are adjusted; personal expenses still scale per traveller.';
  try{ if(typeof rwRememberPlanningPreferences==='function') rwRememberPlanningPreferences(); }catch(e){ /* optional personalisation */ }
  var results=document.getElementById('results');
  if(results && results.children.length && typeof showToast==='function') showToast('Party updated — search again to recalculate group costs');
}
function rwInitPartyPicker(){
  var field=document.getElementById('partySize'); if(!field)return;
  var saved=rwGetPartySize();
  field.innerHTML=rwPartySelectHTML(saved);
  field.value=String(saved);
  field.addEventListener('change',rwPartyChanged);
  rwPartyChanged();
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',rwInitPartyPicker,{once:true});
  else rwInitPartyPicker();
}
