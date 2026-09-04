// @ts-nocheck
/* ============================================================================
   CONFIG SYNC (rw-v85) — every data file is now editable from the admin panel
   ============================================================================
   ONE pattern for all of them. Each data file stays in the repo as a SEED and
   an offline fallback; Firestore config/<key> holds the live version; the app
   merges Firestore over the seed and caches to localStorage.

   Result: the founder never edits a .js file again, the app still works with
   no network, and adding a new editable dataset is one line in RW_SYNCED.
   ========================================================================= */
var RW_SYNCED = [
  { key:'rooms',     global:'RW_ROOMS',     matchBy:'id'   },
  { key:'partners',  global:'RW_PARTNERS',  matchBy:'id'   },
  { key:'referrers', global:'RW_REFERRERS', matchBy:'code' },
  { key:'events',    global:'RW_EVENTS',    matchBy:'id'   },
  { key:'regions',   global:'RW_REGIONS',   matchBy:'name' }
];
function rwConfigApply(cfg, list){
  /* Firestore entries WIN; seed entries not present in Firestore are kept. */
  var seed = window[cfg.global] || [];
  var k = cfg.matchBy;
  var have = {};
  list.forEach(function(x){ if(x && x[k]!=null) have[String(x[k]).toLowerCase()] = 1; });
  window[cfg.global] = list.concat(seed.filter(function(x){
    return !(x && x[k]!=null && have[String(x[k]).toLowerCase()]);
  }));
  try{ lsSet('rw_cfg_'+cfg.key, JSON.stringify(window[cfg.global])); }catch(e){}
}
function rwConfigSyncAll(){
  RW_SYNCED.forEach(function(cfg){
    /* cached copy first so the UI is right before the network answers */
    try{
      var c = lsGet('rw_cfg_'+cfg.key);
      if(c){ var l = JSON.parse(c); if(Array.isArray(l) && l.length) window[cfg.global] = l; }
    }catch(e){}
    try{
      if(typeof db === 'undefined' || !db) return;
      db.collection('config').doc(cfg.key).get().then(function(d){
        if(!d.exists) return;
        var list = (d.data() || {}).list;
        if(Array.isArray(list) && list.length){
          rwConfigApply(cfg, list);
          /* repaint whatever happens to be open */
          try{ if(el('staysOut'))    rwStaysRender(); }catch(e){}
          try{ if(el('partnersOut')) rwPartnersRender(); }catch(e){}
          try{ if(el('eventsOut'))   rwEventsRender(); }catch(e){}
        }
      }).catch(function(){});
    }catch(e){}
  });
}
