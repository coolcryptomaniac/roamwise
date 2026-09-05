// @ts-nocheck
/* ==================== CROWD SPOTTER (Travel & Earn) ====================
   Moved verbatim from app.js (modularization round 5) — a single plain
   function (no top-level DOM queries), so this file can load anywhere
   before app.js. Depends on rwForm() (js/ui/form-modal.js), showToast()
   and xpAdd() (js/game/badges.js), all resolved at call time. */
/* ---- Crowd Spotter (Travel & Earn) ---- */
function openCrowdSpot(place,lat,lon){
  var labels=['&#127881; Empty','&#129300; Quiet','&#128513; Moderate','&#128548; Busy','&#128561; Very crowded'];
  rwForm('&#128205; Report crowd now',[
    {key:'level',label:'How crowded is it right now?',widget:'buttons',options:labels.map(function(l,i){return {value:String(i+1),label:l};})},
    {key:'note',label:'Anything unusual? (optional)',placeholder:'festival, roadblock, weather event\u2026'}
  ],function(v){
    var level=parseInt(v.level||'3',10);
    if(!level||level<1||level>5){showToast('Pick a crowd level');return;}
    var rec={level:level,place:String(place||'').slice(0,80),lat:lat||null,lon:lon||null,at:Date.now(),note:String(v.note||'').slice(0,120)};
    if(window.user) rec.uid=window.user.uid;
    if(window.db){
      db.collection('crowdReports').doc(String(place||'spot').replace(/[^a-z0-9]/gi,'_').slice(0,40)+'_'+Date.now()).set(rec)
        .then(function(){ xpAdd(5,'Crowd Spotter report'); showToast('Report logged \u2014 +5 XP! Thank you from everyone planning this trip.'); })
        .catch(function(){ showToast('Saved locally \u2014 will sync when connection is back'); });
    } else { xpAdd(5,'Crowd Spotter report (offline)'); showToast('+5 XP! Report will sync when connected.'); }
  },'Your report helps other travellers and earns you Shinobi XP.');
}
