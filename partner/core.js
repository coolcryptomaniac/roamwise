(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.RWPartnerCore=api;
})(typeof self!=='undefined'?self:this,function(){
  'use strict';
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
  function money(v){return '₹'+Math.round(Number(v||0)).toLocaleString('en-IN');}
  function clamp(n,min,max){n=Number(n||0);return Math.max(min,Math.min(max,n));}
  function nights(a,b){var x=new Date(a+'T00:00:00'),y=new Date(b+'T00:00:00'),d=Math.round((y-x)/86400000);return isFinite(d)&&d>0?d:1;}
  function norm(s){return String(s||'').trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ');}
  function commission(amount,pct){amount=Math.max(0,Number(amount||0));pct=clamp(pct,0,100);var rw=Math.round(amount*pct)/100;return {gross:amount,pct:pct,roamwise:rw,partner:amount-rw};}
  function isCompleted(status,completedStatuses){return (completedStatuses||['completed','checked_out']).indexOf(String(status||''))>=0;}
  function partnerTotals(bookings,pct,completedStatuses){var done=(bookings||[]).filter(function(b){return isCompleted(b.status,completedStatuses);});var gross=done.reduce(function(a,b){return a+Number(b.amount||b.gross||0);},0);var e=commission(gross,pct);return {count:done.length,gross:gross,commission:e.roamwise,partner:e.partner};}
  function fillTemplate(tpl,ctx){ctx=ctx||{};return String(tpl||'').replace(/\{(destination|checkin|checkout|guests)\}/g,function(_,k){return encodeURIComponent(ctx[k]||'');});}
  function roomMatches(room,destination){if(!destination)return true;var q=norm(destination);var hay=norm([room.zone,room.area,room.property,room.city].join(' '));return hay.indexOf(q)>=0||q.split(' ').every(function(x){return !x||hay.indexOf(x)>=0;});}
  function sortDirectFirst(rows){return (rows||[]).slice().sort(function(a,b){
    var ad=a.source==='roamwise'?1:0,bd=b.source==='roamwise'?1:0;if(ad!==bd)return bd-ad;
    var av=Number(a.verified||0),bv=Number(b.verified||0);if(av!==bv)return bv-av;
    var ar=Number(a.rating||0),br=Number(b.rating||0);if(ar!==br)return br-ar;
    return Number(a.price||Infinity)-Number(b.price||Infinity);
  });}
  function bookingRef(){return 'RW-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();}
  return {esc:esc,money:money,nights:nights,norm:norm,commission:commission,isCompleted:isCompleted,partnerTotals:partnerTotals,fillTemplate:fillTemplate,roomMatches:roomMatches,sortDirectFirst:sortDirectFirst,bookingRef:bookingRef};
});
