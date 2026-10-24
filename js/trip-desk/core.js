// @ts-nocheck
/* Device-local, account-scoped travel workspace. No raw chat or contact details. */
(function(root){
  'use strict';
  var memory={}, prefix='rw_trip_desk_v1:';
  function owner(){try{return root.firebase.auth().currentUser.uid;}catch(e){return 'guest';}}
  function empty(){return {remember:false,origin:'',destination:'',start:'',end:'',budget:'',electric:true,bookingIds:[],arranged:[],items:[]};}
  function load(){var key=owner();if(memory[key])return memory[key];try{var v=JSON.parse(root.localStorage.getItem(prefix+key));if(v&&v.remember&&Array.isArray(v.items))return memory[key]=Object.assign(empty(),v);}catch(e){}return memory[key]=empty();}
  function save(patch){var d=Object.assign(load(),patch);d.items=d.items.slice(-100);memory[owner()]=d;try{if(d.remember)root.localStorage.setItem(prefix+owner(),JSON.stringify(d));else root.localStorage.removeItem(prefix+owner());}catch(e){d.remember=false;return false;}return true;}
  function add(item){var d=load();if(d.items.some(function(x){return x.id===item.id;}))return;save({items:d.items.concat({id:String(item.id).slice(0,120),kind:item.kind||'stay',title:String(item.title||'Stay inquiry').slice(0,140),status:item.status==='inquiry'?'inquiry':'shortlist',date:new Date().toISOString()})});}
  function summary(){
    var d=load(),history=root.RWTripBookings?root.RWTripBookings.current():{state:'unloaded',rows:[],at:0};
    var fresh=history.state==='ready'&&Date.now()-history.at<300000;
    var selected=fresh?history.rows.filter(function(b){return (d.bookingIds||[]).indexOf(b.id)>=0;}):[];
    var confirmed=selected.filter(function(b){return b.status==='confirmed';});
    var pending=d.items.filter(function(x){return x.status==='inquiry';}).concat(selected.filter(function(b){return b.status==='requested';}));
    var stayCovered=!!(d.start&&d.end&&confirmed.some(function(b){return b.checkIn<=d.start&&b.checkOut>=d.end;}));
    return {origin:d.origin,destination:d.destination,freeFrom:d.start,freeUntil:d.end,budgetINR:d.budget,electricPreferred:d.electric,
      bookingEvidence:fresh?'server-read snapshot':'not loaded or stale; open trip desk to refresh',confirmed:confirmed,pending:pending,
      shortlist:d.items.filter(function(x){return x.status==='shortlist';}),travellerMarkedArranged:d.arranged||[],
      missing:['stay','transport','itinerary','guide'].filter(function(k){return !(k==='stay'&&stayCovered)&&(d.arranged||[]).indexOf(k)<0;}),
      note:'Only attached, server-confirmed stays appear as confirmed. Traveller-marked arrangements are unverified. Prices, availability and payment require a fresh provider check.'};
  }
  function validDates(start,end){try{return /^\d{4}-\d{2}-\d{2}$/.test(start)&&/^\d{4}-\d{2}-\d{2}$/.test(end)&&new Date(start).toISOString().slice(0,10)===start&&new Date(end).toISOString().slice(0,10)===end&&end>=start;}catch(e){return false;}}
  function fmt(d){try{return new Date(d+'T00:00:00Z').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});}catch(e){return d;}}
  /* What the traveller sees in the chat: one plain sentence, no data or field names. The fuller instruction for the AI lives in plan.js (aiPrompt). */
  function prompt(){var s=summary(),b=Number(s.budgetINR);return 'Plan my trip from '+s.origin+' to '+(s.destination||'a place that suits me')+', '+fmt(s.freeFrom)+' to '+fmt(s.freeUntil)+(b>0?', with a budget of \u20b9'+b.toLocaleString('en-IN'):'')+'.'+(s.electricPreferred?' I would like electric buses and taxis where available.':'')+' Do not book anything for me.';}
  root.RWTripDesk={attachBooking:function(id){var d=load();save({bookingIds:Array.from(new Set((d.bookingIds||[]).concat(id)))});},detachBooking:function(id){save({bookingIds:(load().bookingIds||[]).filter(function(x){return x!==id;})});},owner:owner,load:load,save:save,add:add,summary:summary,validDates:validDates,prompt:prompt,clear:function(){save(empty());},remove:function(id){save({items:load().items.filter(function(x){return x.id!==id;})});}};
})(typeof window!=='undefined'?window:globalThis);
