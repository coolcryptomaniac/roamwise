// @ts-nocheck
// Moved verbatim from app.js (Phase 7a) — RWData: the backend-portability
// migration seam (a thin pass-through to Firestore today; new data code
// should call RWData.* instead of db.collection(...) directly so a future
// swap to another backend touches only this file). Depends on the global
// `db`/`user` variables, now declared in js/boot/auth-init.js (moved there
// in the final modularization pass, loaded before this file's callers run).
/* ===================== RWData — BACKEND PORTABILITY LAYER =====================
   The migration seam. Today a thin pass-through to Firestore, but ALL NEW data
   code should call RWData.* instead of db.collection(...) directly. To move to
   PocketBase / Supabase / self-hosted later, reimplement these methods against
   the new backend and change RWData.backend — the rest of the app won't change.
   See RoamWise-Architecture-Migration-Guide.md. Existing db.collection calls
   still work; migrate them in here incrementally. */
var RWData = {
  backend: 'firestore',
  col: function(name){ return db.collection(name); },
  subscribe: function(name, buildQuery, onData){
    try{
      var q = buildQuery ? buildQuery(db.collection(name)) : db.collection(name);
      return q.onSnapshot(function(snap){
        var rows=[]; snap.forEach(function(d){ var o=d.data()||{}; o._id=d.id; rows.push(o); });
        onData(rows);
      }, function(err){ console.warn('RWData.subscribe', name, err); });
    }catch(e){ console.warn('RWData.subscribe', e); return function(){}; }
  },
  add: function(name, obj){ return db.collection(name).add(obj); },
  set: function(name, id, obj, opts){ return db.collection(name).doc(id).set(obj, opts||{}); },
  get: function(name, id){ return db.collection(name).doc(id).get().then(function(d){ return d.exists?d.data():null; }); },
  del: function(name, id){ return db.collection(name).doc(id).delete(); },
  uid: function(){ return (user&&user.uid)||null; }
};
function rwInitDataLayer(){ /* hook for future backend init; no-op for Firestore today */ }
