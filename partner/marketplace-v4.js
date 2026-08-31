/* RoamWise Partner Marketplace v4 — simpler marketplace UX, safer booking guardrails,
 * and a host-focused operating view. This is a progressive enhancement over v3.
 * It never bypasses Firebase auth, partner verification, marketplaceApproved, or
 * the canonical Firestore rules. No card data, KYC documents, gateway secrets,
 * escrow, insurance, or instant-book inventory claims are introduced here.
 */
(function(){
'use strict';

var Q=new URLSearchParams(location.search);
var DEMO=Q.get('mode')==='demo'||Q.get('lab')==='1';
var PROD=/^(www\.)?roamwise\.co\.in$/i.test(location.hostname);
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.from((r||document).querySelectorAll(s))};
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var money=function(n){return '₹'+Math.round(Number(n||0)).toLocaleString('en-IN')};
var timer=null,hostLoading=false,lastHostKey='';

function fb(){
  try{return {db:firebase.firestore(),auth:firebase.auth()}}catch(e){return {db:null,auth:null}}
}
function user(){try{return firebase.auth().currentUser}catch(e){return null}}
function isoDay(d){return d.toISOString().slice(0,10)}
function today(){var d=new Date();d.setHours(0,0,0,0);return isoDay(d)}
function dayAfter(v){var d=new Date(v+'T12:00:00');if(isNaN(d))return today();d.setDate(d.getDate()+1);return isoDay(d)}
function nights(a,b){
  var x=new Date(a+'T12:00:00'),y=new Date(b+'T12:00:00');
  if(isNaN(x)||isNaN(y))return 0;
  var n=Math.round((y-x)/86400000);
  return n>0?n:0;
}
function tripCtx(){
  return {
    checkIn:String(($('#checkin')||{}).value||''),
    checkOut:String(($('#checkout')||{}).value||''),
    guests:Math.max(1,Number(($('#guests')||{}).value||1))
  };
}
function phoneOk(v){
  v=String(v||'').trim();
  if(!v)return false;
  if(!/^[+()\-\s0-9]{7,24}$/.test(v))return false;
  var digits=v.replace(/\D/g,'');
  return digits.length>=7&&digits.length<=15;
}
function currentRole(){var r=$('.role.on[data-role]');return r?r.dataset.role:'customer'}
function setText(el,text){if(el)el.textContent=text}

function dateGuard(){
  var ci=$('#checkin'),co=$('#checkout'),g=$('#guests');
  if(!ci||!co)return;
  ci.min=today();
  if(ci.value&&ci.value<today())ci.value=today();
  co.min=dayAfter(ci.value||today());
  if(!co.value||co.value<=ci.value)co.value=dayAfter(ci.value||today());
  if(g){g.min='1';g.max='12';g.inputMode='numeric'}
}

function roleNav(){
  var grid=$('#rolegrid');
  if(!grid)return;
  grid.setAttribute('role','tablist');
  $$('.role[data-role]',grid).forEach(function(b){
    b.setAttribute('role','tab');
    b.setAttribute('aria-selected',b.classList.contains('on')?'true':'false');
    var r=b.dataset.role;
    if(r==='customer')b.setAttribute('aria-label','Find stays');
    if(r==='owner')b.setAttribute('aria-label','List your place');
    if(r==='partner')b.setAttribute('aria-label','Host dashboard');
  });
}

function searchSupport(){
  var box=$('.search');
  if(!box||$('#rwV4SearchSupport'))return;
  var n=document.createElement('div');
  n.id='rwV4SearchSupport';
  n.className='rw-v4-search-support';
  n.innerHTML='<span><b>Verified direct stays first</b><small>RoamWise checks host approval before a direct room can be requested.</small></span>'+
    '<span><b>No prepayment on a request</b><small>Payment stays locked until the property confirms availability.</small></span>'+
    '<span><b>Host-confirmed availability</b><small>Request-to-book avoids pretending a static calendar is live inventory.</small></span>';
  box.appendChild(n);
}

function cardTotal(card){
  var c=tripCtx(),ns=nights(c.checkIn,c.checkOut);
  if(!ns)return;
  var priceEl=$('.money',card),side=$('.side',card);
  if(!priceEl||!side)return;
  var raw=(priceEl.textContent||'').replace(/[^0-9.]/g,'');
  var price=Number(raw||0);
  var old=$('.rw-v4-total',side);if(old)old.remove();
  if(price>0){
    var d=document.createElement('div');
    d.className='rw-v4-total';
    d.innerHTML='<b>'+money(price*ns)+'</b><span>'+ns+' night'+(ns===1?'':'s')+' total before property taxes/fees, if any</span>';
    side.insertBefore(d,side.firstChild.nextSibling||null);
  }
}

function listingCards(){
  $$('.result.direct').forEach(function(card){
    if(!card.dataset.rwV4){
      card.dataset.rwV4='1';
      card.classList.add('rw-v4-listing');
      var body=card.children[1];
      if(body){
        var meta=document.createElement('div');
        meta.className='rw-v4-listing-meta';
        meta.innerHTML='<span>Direct</span><span>Request to book</span><span>₹0 RoamWise guest fee</span>';
        body.appendChild(meta);
      }
      var btn=$('[data-book]',card);
      if(btn){btn.textContent='Check availability';btn.setAttribute('aria-label','Check availability for this stay')}
    }
    cardTotal(card);
  });
  $$('.externalGroup').forEach(function(g){
    if(g.dataset.rwV4)return;g.dataset.rwV4='1';
    var h=$('h3',g);if(h)h.insertAdjacentHTML('beforebegin','<div class="rw-v4-provider-label">MORE INVENTORY</div>');
  });
}

function inlineError(text){
  var h=$('#rwV4BookError');
  if(!h){
    h=document.createElement('div');h.id='rwV4BookError';h.className='rw-v4-book-error';
    var b=$('#rwV3Send');if(b)b.parentNode.insertBefore(h,b);
  }
  h.textContent=text||'';
  if(text)h.setAttribute('role','alert');
}

function bookingPolish(){
  var send=$('#rwV3Send');
  if(!send||send.dataset.rwV4)return;
  send.dataset.rwV4='1';
  send.textContent='Request to book';
  var phone=$('#rwV3Phone');
  if(phone){phone.required=true;phone.inputMode='tel';phone.autocomplete='tel';phone.placeholder='Phone number with country code'}
  var pay=$('.rw-v3-pay');
  if(pay&&!$('#rwV4BookingSafety')){
    var box=document.createElement('div');
    box.id='rwV4BookingSafety';
    box.className='rw-v4-book-safety';
    box.innerHTML='<strong>What happens next</strong><ol><li>You send a request — no payment is due.</li><li>The host checks real availability and confirms or declines.</li><li>Only after confirmation does your chosen payment instruction unlock.</li></ol>';
    pay.parentNode.insertBefore(box,pay);
  }
  var fine=$('.rw-v3-fine');
  if(fine&&!$('#rwV4Ack')){
    var ack=document.createElement('label');
    ack.id='rwV4Ack';ack.className='rw-v4-ack';
    ack.innerHTML='<input id="rwV4AckBox" type="checkbox"><span>I have reviewed the stay dates, cancellation terms and the rule to <b>never prepay before host confirmation</b>.</span>';
    fine.parentNode.insertBefore(ack,fine);
  }
  var aside=$('.rw-v3-bookgrid aside');
  if(aside&&!$('#rwV4PriceNote')){
    var note=document.createElement('div');note.id='rwV4PriceNote';note.className='rw-v4-price-note';
    note.innerHTML='<b>Price clarity</b><span>The amount shown is the room total stored with your request. Any mandatory property tax or local charge must be disclosed by the host before you pay.</span>';
    aside.appendChild(note);
  }
}

function bookingGuard(e){
  var b=e.target&&e.target.closest&&e.target.closest('#rwV3Send');
  if(!b)return;
  inlineError('');
  var c=tripCtx(),ns=nights(c.checkIn,c.checkOut);
  if(!c.checkIn||!c.checkOut||c.checkIn<today()||ns<1){
    e.preventDefault();e.stopImmediatePropagation();inlineError('Choose valid future stay dates.');return;
  }
  if(ns>90){e.preventDefault();e.stopImmediatePropagation();inlineError('For stays longer than 90 nights, contact RoamWise support instead of sending a direct request.');return}
  if(!phoneOk(($('#rwV3Phone')||{}).value)){
    e.preventDefault();e.stopImmediatePropagation();inlineError('Add a valid phone number (7–15 digits). This is used for the booking request.');return;
  }
  if(!($('#rwV4AckBox')||{}).checked){
    e.preventDefault();e.stopImmediatePropagation();inlineError('Please review and accept the booking and prepayment terms before sending the request.');return;
  }
}

function successPolish(){
  var s=$('.rw-v3-success');
  if(!s||s.dataset.rwV4)return;s.dataset.rwV4='1';
  var p=$('p',s);if(p)p.insertAdjacentHTML('afterend','<div class="rw-v4-request-timeline"><span class="on"><b>1</b>Requested</span><i></i><span><b>2</b>Host response</span><i></i><span><b>3</b>Pay / stay</span></div><p class="rw-v4-response-note">RoamWise asks hosts to respond promptly. If your request remains unanswered, choose another stay rather than sending money off-platform.</p>');
}

function bookingRows(){
  $$('.rw-v3-bookings article').forEach(function(a){
    if(a.dataset.rwV4)return;a.dataset.rwV4='1';
    var em=$('em',a),st=(em&&em.textContent||'').trim().toLowerCase();
    a.classList.add('rw-v4-state-'+st.replace(/[^a-z0-9]+/g,'-'));
    if(st==='requested'){
      var wait=$('.rw-v3-wait',a);if(wait)setText(wait,'Awaiting host confirmation — do not prepay. You can keep browsing other stays.');
    }
  });
}

function ownerSteps(){
  if(!$('#submitOwner')||$('#rwV4OwnerSteps'))return;
  var u=user(),verified=!!(u&&u.emailVerified);
  var n=document.createElement('section');n.id='rwV4OwnerSteps';n.className='rw-v4-owner-steps';
  n.innerHTML='<div><small>START HOSTING</small><h2>Four clear steps</h2></div><ol>'+
    '<li class="'+(verified?'done':'')+'"><b>1</b><span><strong>Verify account</strong><small>'+(verified?'Email verified':'Verify your Firebase sign-in email')+'</small></span></li>'+
    '<li><b>2</b><span><strong>Add property</strong><small>Basics, rooms, rates and public location</small></span></li>'+
    '<li><b>3</b><span><strong>RoamWise review</strong><small>Ownership/contact and property readiness</small></span></li>'+
    '<li><b>4</b><span><strong>Go live</strong><small>Manage direct requests from Host dashboard</small></span></li></ol>'+
    '<p>Do not upload Aadhaar, passport, PAN, bank passwords or card data into this public form.</p>';
  var v=$('#view');if(v)v.insertBefore(n,v.firstChild);
}

function findBookingsAnchor(){
  var candidates=$$('#view h2,#view h3,#view b');
  return candidates.find(function(x){return /booking|request/i.test(x.textContent||'')})||$('#addRoom');
}
function scrollToRequests(){var a=findBookingsAnchor();if(a)a.scrollIntoView({behavior:'smooth',block:'center'})}

async function hostOverview(){
  if(!$('#addRoom')||DEMO)return;
  var u=user(),F=fb();if(!u||!F.db)return;
  var key=u.uid+':'+currentRole();
  if(hostLoading||($('#rwV4HostOverview')&&lastHostKey===key))return;
  hostLoading=true;lastHostKey=key;
  try{
    var p=await F.db.collection('partners').doc(u.uid).get();
    if(!p.exists)return;
    var pd=p.data()||{};
    var rq=await p.ref.collection('rooms').limit(100).get();
    var bq=await F.db.collection('roomBookings').where('partnerUid','==',u.uid).limit(100).get();
    var rooms=0,live=0,requests=0,confirmed=0,completed=0,potential=0,overdue=0,rows=[];
    rq.forEach(function(r){rooms++;var x=r.data()||{};if(x.open!==false&&x.marketplaceApproved===true)live++});
    bq.forEach(function(d){
      var x=d.data()||{},st=String(x.status||'requested');
      if(st==='requested')requests++;
      if(st==='confirmed')confirmed++;
      if(st==='completed')completed++;
      if(st==='requested'||st==='confirmed')potential+=Number(x.amount||0);
      var at=Date.parse(x.at||'');if(st==='requested'&&at&&Date.now()-at>86400000)overdue++;
      rows.push(x);
    });
    rows.sort(function(a,b){return String(b.at||'').localeCompare(String(a.at||''))});
    var old=$('#rwV4HostOverview');if(old)old.remove();
    var s=document.createElement('section');s.id='rwV4HostOverview';s.className='rw-v4-host-overview';
    s.innerHTML='<div class="rw-v4-host-head"><div><small>HOST TODAY</small><h2>'+(requests?'You have '+requests+' request'+(requests===1?'':'s')+' to review':'Your hosting workspace is clear')+'</h2><p>'+(pd.verified===true?'Verified host · ':'Verification pending · ')+live+' live room'+(live===1?'':'s')+' of '+rooms+'</p></div>'+(requests?'<button id="rwV4ReviewRequests">Review requests</button>':'')+'</div>'+
      '<div class="rw-v4-host-stats"><span><b>'+requests+'</b><small>New requests</small></span><span><b>'+confirmed+'</b><small>Confirmed</small></span><span><b>'+live+'</b><small>Live rooms</small></span><span><b>'+money(potential)+'</b><small>Open booking value</small></span></div>'+
      (overdue?'<div class="rw-v4-attention"><b>'+overdue+' request'+(overdue===1?'':'s')+' waiting over 24 hours</b><span>Respond quickly or decline so guests can make another plan.</span></div>':'')+
      (rows.length?'<div class="rw-v4-recent"><b>Recent reservation activity</b>'+rows.slice(0,3).map(function(x){return '<span><strong>'+esc(x.guestName||'Guest')+' · '+esc(x.room||x.property||'Stay')+'</strong><small>'+esc(x.checkIn||'')+' → '+esc(x.checkOut||'')+' · '+esc(x.status||'requested')+' · '+money(x.amount||0)+'</small></span>'}).join('')+'</div>':'');
    var v=$('#view');if(v)v.insertBefore(s,v.firstChild);
    var btn=$('#rwV4ReviewRequests');if(btn)btn.onclick=scrollToRequests;
  }catch(e){
    /* Keep the existing host dashboard usable if optional overview reads fail. */
  }finally{hostLoading=false}
}

function productionCopy(){
  if(!PROD||DEMO)return;
  var foot=$('.footer');
  if(foot)foot.textContent='RoamWise Stays · verified direct hosts · request-to-book · no prepayment before confirmation';
  var nav=$('.nav');if(nav&&!$('#rwV4SafetyNav')){
    var n=document.createElement('span');n.id='rwV4SafetyNav';n.className='rw-v4-nav-trust';n.textContent='Verified direct stays';
    var space=$('.navspace');if(space)space.parentNode.insertBefore(n,space);
  }
}

function accessibility(){
  $$('button').forEach(function(b){if(!b.getAttribute('type'))b.setAttribute('type','button')});
  var modal=$('#modal');if(modal){modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true')}
}

function upgrade(){
  document.body.classList.add('rw-partner-v4');
  dateGuard();roleNav();productionCopy();accessibility();
  var role=currentRole();
  if(role==='customer'){searchSupport();listingCards();bookingRows()}
  if(role==='owner')ownerSteps();
  if(role==='partner')hostOverview();
  bookingPolish();successPolish();
}
function schedule(){clearTimeout(timer);timer=setTimeout(upgrade,70)}

function init(){
  document.body.classList.add('rw-partner-v4');
  document.addEventListener('click',bookingGuard,true);
  document.addEventListener('change',function(e){if(e.target&&e.target.id==='checkin'){dateGuard();listingCards()}if(e.target&&e.target.id==='checkout')listingCards()},true);
  var v=$('#view');if(v)new MutationObserver(schedule).observe(v,{childList:true,subtree:true});
  var roles=$('#rolegrid');if(roles)new MutationObserver(schedule).observe(roles,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  var F=fb();if(F.auth)F.auth.onAuthStateChanged(function(){lastHostKey='';setTimeout(upgrade,90)});
  upgrade();setTimeout(upgrade,350);setTimeout(upgrade,1200);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.RWPartnerMarketplaceV4={version:'4.0.0',upgrade:upgrade,dateGuard:dateGuard,phoneOk:phoneOk};
})();
