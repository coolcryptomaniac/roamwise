// @ts-nocheck
/* ============================================================================
   js/core/alert-follow.js — "Get alerts for these places" hand-off
   ============================================================================
   /uttarakhand-road-status/ and /uttarakhand-travel-rules/ are static pages with
   no Firebase. Their "Get alerts" button opens the app as /?follow=almora,nainital
   (or /?unfollow=1). This module:
     1. reads that query once, keeps it in localStorage until the visitor is signed in
        (asks them to sign in if they are not),
     2. saves users/{uid}.alertRegions (array of region ids) + alertRegionsAt on their
        own user doc, merged with what they already follow, and
     3. turns push on (rwPushSetOptIn) so alerts can arrive; email is the fallback.
   The Worker (worker/handlers/advisory-alerts.js) reads alertRegions with the service
   account. No firestore.rules change: like pushTokens and lastActive, these fields ride
   the existing users/{uid} self-write rule (not in the Pro-field blocklist).
   Loaded deferred after js/core/push-notifications.js. */
var RW_ALERT_PENDING_KEY = 'rw_alert_follow_pending';
var RW_ALERT_REGIONS = ['almora', 'nainital', 'pithoragarh', 'bageshwar', 'champawat', 'rudraprayag', 'chamoli', 'uttarkashi', 'tehri', 'pauri', 'dehradun', 'haridwar'];

function rwAlertParse(search){
  var q;
  try{ q = new URLSearchParams(search || ''); }catch(e){ return null; }
  if(q.get('unfollow') === '1') return { unfollow: true, regions: [] };
  var raw = q.get('follow');
  if(!raw) return null;
  var out = [];
  raw.split(',').forEach(function(x){
    var id = String(x || '').trim().toLowerCase();
    if(RW_ALERT_REGIONS.indexOf(id) !== -1 && out.indexOf(id) === -1) out.push(id);
  });
  return out.length ? { unfollow: false, regions: out } : null;
}

function rwAlertSave(){
  var raw = '';
  try{ raw = lsGet(RW_ALERT_PENDING_KEY); }catch(e){ return; }
  if(!raw) return;
  var p;
  try{ p = JSON.parse(raw); }catch(e){ lsSet(RW_ALERT_PENDING_KEY, ''); return; }
  if(typeof user === 'undefined' || !user || !user.uid || typeof db === 'undefined' || !db) return;
  var ref = db.collection('users').doc(user.uid);
  ref.get().then(function(d){
    var cur = (d.exists && Array.isArray(d.data().alertRegions)) ? d.data().alertRegions : [];
    var next = p.unfollow ? [] : cur.concat(p.regions).filter(function(x, i, a){ return RW_ALERT_REGIONS.indexOf(x) !== -1 && a.indexOf(x) === i; }).slice(0, 12);
    return ref.set({ alertRegions: next, alertRegionsAt: new Date().toISOString() }, { merge: true }).then(function(){
      lsSet(RW_ALERT_PENDING_KEY, '');
      try{ showToast(p.unfollow ? 'Travel alerts stopped' : '🔔 Alerts on for ' + next.length + (next.length === 1 ? ' region' : ' regions')); }catch(e){ /* toast optional */ }
      if(!p.unfollow){ try{ if(typeof rwPushOptedIn === 'function' && !rwPushOptedIn() && typeof rwPushSetOptIn === 'function') rwPushSetOptIn(true); }catch(e){ /* push optional; email is the fallback */ } }
    });
  }).catch(function(){ /* retried on the next sign-in or page load */ });
}

function rwAlertFollowInit(){
  var p = rwAlertParse(location.search);
  if(p){
    try{ lsSet(RW_ALERT_PENDING_KEY, JSON.stringify(p)); }catch(e){ /* storage off: nothing to keep */ }
    try{
      var u = new URL(location.href);
      u.searchParams.delete('follow'); u.searchParams.delete('unfollow');
      history.replaceState(null, '', u.pathname + (u.search || '') + (u.hash || ''));
    }catch(e){ /* cosmetic */ }
  }
  if(typeof AUTH_READY !== 'undefined' && AUTH_READY && typeof firebase !== 'undefined'){
    try{
      firebase.auth().onAuthStateChanged(function(u){
        if(u) setTimeout(rwAlertSave, 400);
        else if(p){
          try{ showToast('Sign in to turn on travel alerts'); }catch(e){ /* optional */ }
          try{ if(typeof openAuth === 'function') openAuth(); }catch(e){ /* optional */ }
        }
      });
    }catch(e){ /* auth unavailable */ }
  }
}

if(typeof window !== 'undefined' && typeof document !== 'undefined'){
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rwAlertFollowInit); else rwAlertFollowInit();
}
if(typeof module !== 'undefined' && module.exports) module.exports = { rwAlertParse: rwAlertParse, RW_ALERT_REGIONS: RW_ALERT_REGIONS };
