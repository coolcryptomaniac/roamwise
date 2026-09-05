// @ts-nocheck
// Moved verbatim from app.js — Firestore rules version diagnostic: probes
// several collections so a permissions error can be told apart from
// not-yet-published rules.
/* ==================== RULES VERSION CHECK ====================
   "Missing or insufficient permissions" is the least helpful error in Firebase,
   because it looks identical whether the user lacks access or the rules simply
   were not published. This probes several collections and reports which
   features are actually live, so the answer is a fact rather than a guess. */
var RW_RULES_VERSION = '2026-07-24';
async function rwRulesCheck(){
  if(!window.db){ showToast('Not connected to the database'); return; }
  var checks = [
    ['Group chat',      function(){ return db.collection('tripchats').doc('_probe_'+Date.now()).get(); }],
    ['Staff logins',    function(){ return db.collection('staff').doc('_probe').get(); }],
    ['Moderation bans', function(){ return db.collection('bans').doc('_probe').get(); }],
    ['Founder gate',    function(){ return db.collection('pricing').doc('founder').get(); }],
    ['Rules version',   function(){ return db.collection('meta').doc('rulesVersion').get(); }]
  ];
  var rows=[], live=null;
  for(var i=0;i<checks.length;i++){
    try{
      var d = await checks[i][1]();
      if(checks[i][0]==='Rules version' && d && d.exists) live=(d.data()||{}).version||null;
      rows.push([checks[i][0], true, '']);
    }catch(e){
      rows.push([checks[i][0], false, (e && e.code) || 'error']);
    }
  }
  var allOk = rows.every(function(r){ return r[1]; });
  var html = '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(150deg,'
    +(allOk?'#14532D':'#7F1D1D')+',#0A0A0C)">'
    +'<div class="tk-place">'+(allOk?'\u2705 Rules look current':'\u26a0\ufe0f Rules are out of date')+'</div>'
    +'<div class="tk-meta">'+(live? 'Published version: '+esc2(live) : 'No version marker found on the server')+'</div></div>'
    +'<div class="tk-sec">'
    + rows.map(function(r){
        return '<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:12.5px">'
          +'<span>'+esc2(r[0])+'</span>'
          +'<b style="color:'+(r[1]?'#4ADE80':'#E05B5B')+'">'+(r[1]?'reachable':'blocked')+'</b></div>';
      }).join('')
    +'</div>'
    + (allOk
        ? '<div class="tk-sec"><div style="font-size:12px;color:var(--t2);line-height:1.6">Every collection responded. If a feature still fails, it is a code issue rather than a rules issue \u2014 tell me exactly what you tapped.</div></div>'
        : '<div class="tk-sec"><div style="font-size:12px;color:var(--t2);line-height:1.6">'
          +'Anything marked <b>blocked</b> needs the current rules published. Firebase Console \u2192 Firestore \u2192 Rules \u2192 paste <code>firestore.rules</code> \u2192 Publish. '
          +'Then set <code>meta/rulesVersion</code> to <code>{version:"'+RW_RULES_VERSION+'"}</code> so this check can confirm it next time.</div></div>')
    +'</div>';
  var log = el('heroLog');
  if(log){ log.style.display='block'; log.insertAdjacentHTML('beforeend','<div class="cp-msg bot">'+html+'</div>'); log.scrollTop=log.scrollHeight; }
  else showToast(allOk? 'Rules look current' : 'Rules need publishing');
}
