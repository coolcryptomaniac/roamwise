// @ts-nocheck
/* Private booking evidence stays in memory; never persisted or trusted from localStorage. */
(function(root){
  'use strict';
  var snapshot={owner:null,state:'unloaded',rows:[],at:0},pending=null;
  function uid(){try{return root.firebase.auth().currentUser.uid;}catch(e){return null;}}
  function current(){return snapshot.owner===uid()&&uid()?snapshot:{owner:uid(),state:'unloaded',rows:[],at:0};}
  function refresh(){
    var owner=uid();if(!owner){snapshot={owner:null,state:'signed-out',rows:[],at:0};return Promise.resolve(snapshot);}
    if(pending&&pending.owner===owner)return pending.promise;
    var job=Promise.resolve().then(function(){return root.firebase.firestore().collection('roomBookings').where('guestUid','==',owner).limit(50).get();}).then(function(q){
      if(uid()!==owner)return current();
      var rows=[];q.forEach(function(doc){var b=doc.data();rows.push({id:doc.id,ref:b.ref||'',property:b.property||'Stay',kind:'stay',status:b.status||'requested',checkIn:b.checkIn||'',checkOut:b.checkOut||'',paymentStatus:b.paymentStatus||''});});
      rows.sort(function(a,b){return String(b.checkIn).localeCompare(String(a.checkIn));});
      snapshot={owner:owner,state:'ready',rows:rows,at:Date.now()};return snapshot;
    }).catch(function(){if(uid()===owner)snapshot={owner:owner,state:'error',rows:[],at:0};return current();}).finally(function(){if(pending&&pending.promise===job)pending=null;});
    pending={owner:owner,promise:job};return job;
  }
  root.RWTripBookings={current:current,refresh:refresh};
})(window);
