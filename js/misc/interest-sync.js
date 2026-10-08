// @ts-nocheck
/* ============================================================================
   interest-sync.js — remembers the user's last searched destination
   ============================================================================
   Used only to personalise the optional "come back" email (worker/lib/
   reminder-core.js): "Still waiting for your next trip to Manali?".
   Stores ONE short string + a timestamp on the user's own doc
   (users/{uid}.lastDestination / lastDestinationAt) — no history, no dates,
   no budget. Signed-in users only, best-effort, rides the existing self-write
   rule (not in the pro-field blocklist). Unsubscribing from emails does not
   stop this write; it is the same single field and is never shown to others. */
function rwRememberDestination(dest){
  try{
    var d = String(dest||'').trim().slice(0,60);
    if(!d || /^(anywhere|any|surprise me)$/i.test(d)) return;
    if(typeof AUTH_READY==='undefined' || !AUTH_READY || typeof firebase==='undefined') return;
    var u = firebase.auth().currentUser; if(!u) return;
    firebase.firestore().collection('users').doc(u.uid).set({
      lastDestination: d,
      lastDestinationAt: firebase.firestore.FieldValue.serverTimestamp()
    }, {merge:true}).catch(function(){ /* best-effort */ });
  }catch(e){ /* never break search */ }
}
