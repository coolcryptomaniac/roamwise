/* RoamWise Partner Marketplace — canonical production runtime.
 * Consolidates the stable parts of the former v2/v3/v4 overlays into ONE listener,
 * ONE observer and ONE auth subscription. app.js remains the base renderer.
 */
(function(){
'use strict';

var Q=new URLSearchParams(location.search);
var DEMO=Q.get('mode')==='demo'||Q.get('lab')==='1';
var PROD=/^(www\.)?roamwise\.co\.in$/i.test(location.hostname);
var roomCache={},profileCache={},admin=false,syncing=false,hostBusy=false,repaintTimer=null,lastHostKey='',platformPay={};
var CURATION_LABELS={experience:'✦ Experience',hosted:'☕ Hosted',local:'⌂ Local',premium:'◇ Premium',signature:'★ Signature',live:'♪ Live',quiet:'◌ Quiet'};
var $=function(s,r){return(r||document).querySelector(s)};
var $$=function(s,r){return Array.from((r||document).querySelectorAll(s))};
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var now=function(){return new Date().toISOString()};
var money=function(n){return'₹'+Math.round(Number(n||0)).toLocaleString('en-IN')};
function svg(name){return'<svg aria-hidden="true"><use href="#i-'+name+'"></use></svg>'}

function fb(){try{return{db:firebase.firestore(),auth:firebase.auth()}}catch(e){return{db:null,auth:null}}}
function user(){try{return firebase.auth().currentUser}catch(e){return null}}
function safeHttps(v){try{var u=new URL(String(v||'').trim());return u.protocol==='https:'?u.href:''}catch(e){return''}}
function cleanHttp(v){try{var u=new URL(String(v||'').trim());return /^https?:$/.test(u.protocol)?u.href:''}catch(e){return''}}
function validUpi(v){return /^[\w.\-]{2,}@[A-Za-z][A-Za-z0-9.\-]{1,}$/.test(String(v||'').trim())}
function validPhone(v){v=String(v||'').trim();if(!/^[+()\-\s0-9]{7,24}$/.test(v))return false;var d=v.replace(/\D/g,'');return d.length>=7&&d.length<=15}
function isoDay(d){var y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return y+'-'+m+'-'+day}
function today(){var d=new Date();d.setHours(0,0,0,0);return isoDay(d)}
function dayAfter(v){var d=new Date(v+'T12:00:00');if(isNaN(d))return today();d.setDate(d.getDate()+1);return isoDay(d)}
function nightsBetween(a,b){var x=new Date(a+'T12:00:00'),y=new Date(b+'T12:00:00');if(isNaN(x)||isNaN(y))return 0;var n=Math.round((y-x)/86400000);return n>0?n:0}
function currentRole(){var r=$('.role.on[data-role]');return r?r.dataset.role:'customer'}
function modal(html){var m=$('#modal'),b=$('#modalbox');if(!m||!b)return;b.innerHTML=html;m.classList.add('open')}
function closeModal(){var m=$('#modal');if(m)m.classList.remove('open')}
function parseBookingButton(b){try{return JSON.parse(b.dataset.book||'{}')}catch(e){return null}}
function key(x){return String(x.partnerUid||'')+'/'+String(x.roomId||'')}
async function loadPlatformPay(){var F=fb();if(!F.db)return;try{var d=await F.db.collection('config').doc('partnerPayments').get();platformPay=d.exists?d.data()||{}:{};if(window.RWBusinessAccount)platformPay=window.RWBusinessAccount.paymentConfig(platformPay)}catch(e){platformPay={}}}

async function getRoom(listing,fresh){
  var F=fb(),k=key(listing);if(!fresh&&roomCache[k])return roomCache[k];
  if(!F.db||!listing.partnerUid||!listing.roomId)return null;
  try{var d=await F.db.collection('partners').doc(listing.partnerUid).collection('rooms').doc(listing.roomId).get();if(!d.exists)return null;var r=d.data()||{};r._id=d.id;roomCache[k]=r;return r}catch(e){return null}
}
async function getPublicProfile(uid,fresh){
  var F=fb(),id=String(uid||'');if(!id||!F.db)return null;if(!fresh&&Object.prototype.hasOwnProperty.call(profileCache,id))return profileCache[id];
  try{var d=await F.db.collection('partnerPublicProfiles').doc(id).get(),p=d.exists?d.data()||{}:null;profileCache[id]=p;return p}catch(e){profileCache[id]=null;return null}
}
function approved(room,listing){return!!(room&&room.marketplaceApproved===true&&room.open!==false&&String(room.partnerUid||'')===String(listing.partnerUid||''))}
function publicListing(listing,room,profile){
  var p=room.paymentPublic||{},raw=profile&&Array.isArray(profile.badges)?profile.badges:[],badges=raw.filter(function(x){return Object.prototype.hasOwnProperty.call(CURATION_LABELS,x)}).slice(0,7);
  var propertyName=room.property||listing.name,basePrice=Number(room.price||0),milan=!!(window.RW_MILAN_PILOT&&window.RW_MILAN_PILOT.isMilan(propertyName));
  return Object.assign({},listing,{
    partnerUid:room.partnerUid,roomId:room._id,propertyId:listing.propertyId||room.partnerUid,
    name:propertyName,room:room.room||listing.room,zone:room.zone||listing.zone,area:room.area||listing.area,
    basePrice:basePrice,price:milan?window.RW_MILAN_PILOT.grossFromBase(basePrice):basePrice,commissionPct:milan?7:Number(room.commissionPct||7),maxGuests:Number(room.maxGuests||2),heroImage:safeHttps(room.heroImage),
    amenities:Array.isArray(room.amenities)?room.amenities.slice(0,20):[],cancel:String(room.cancel||listing.cancel||'').slice(0,400),
    houseRules:String(room.houseRules||'').slice(0,1000),welcomeNote:milan?'':String(room.welcomeNote||'').slice(0,1000),
    curationBadges:badges,experienceSummary:milan?'':String(profile&&profile.experienceSummary||'').slice(0,280),hostNote:milan?'':String(profile&&profile.hostNote||'').slice(0,220),
    paymentPublic:{upiId:validUpi(p.upiId)?p.upiId:'',paymentLink:safeHttps(p.paymentLink)}
  })
}
function paymentConnector(listing){
  var p=listing.paymentPublic||{},methods=[];
  if(platformPay.cashfreeEnabled===true&&safeHttps(platformPay.workerBaseUrl))methods.push('Cashfree');
  if((platformPay.manualUpiEnabled===true&&validUpi(platformPay.publicUpiId))||validUpi(p.upiId))methods.push('UPI');
  if(safeHttps(p.paymentLink))methods.push('secure link');
  if(!methods.length)methods.push('pay at property');
  return methods.join(' / ')
}
function decoratePaymentConnector(card,listing){
  var side=$('.side',card),b=$('[data-book]',card);if(!side||!b)return;
  if(b.textContent!=='Request this room')b.textContent='Request this room';
  var note=$('[data-rw-payment-connector]',side);if(!note){note=document.createElement('small');note.className='rw-market-payment-connector';note.setAttribute('data-rw-payment-connector','');side.appendChild(note)}
  var text='Pay after host confirmation · '+paymentConnector(listing);if(note.textContent!==text)note.textContent=text
}

function dateGuard(){
  var ci=$('#checkin'),co=$('#checkout'),guests=$('#guests');if(!ci||!co)return;
  ci.min=today();if(ci.value&&ci.value<today())ci.value=today();co.min=dayAfter(ci.value||today());
  if(!co.value||co.value<=ci.value)co.value=dayAfter(ci.value||today());if(guests){guests.min='1';guests.max='12';guests.inputMode='numeric'}
}
function trip(){return{checkIn:String(($('#checkin')||{}).value||''),checkOut:String(($('#checkout')||{}).value||''),guests:Math.max(1,Number(($('#guests')||{}).value||1))}}

async function validateCards(){
  if(DEMO)return;
  await Promise.all($$('.result.direct').map(async function(card){
    var b=$('[data-book]',card),x=b&&parseBookingButton(b);if(!x)return;if(!window.RW_MILAN_PILOT||!window.RW_MILAN_PILOT.isMilan(x.name)){card.remove();return}card.classList.add('rw-market-checking');
    var r=await getRoom(x,false);if(!approved(r,x)){card.remove();return}
    var profile=await getPublicProfile(x.partnerUid,false),fresh=publicListing(x,r,profile);b.dataset.book=JSON.stringify(fresh);decoratePaymentConnector(card,fresh);
    card.classList.remove('rw-market-checking');card.classList.add('rw-market-verified');
    var pic=$('.pic',card);if(pic&&fresh.heroImage){pic.style.backgroundImage='url("'+fresh.heroImage.replace(/"/g,'%22')+'")';pic.textContent=''}
    var badge=$('.pill.green',card);if(badge)badge.textContent=fresh.curationBadges.indexOf('signature')>=0?'★ RoamWise Signature':'✓ Verified host';
    var body=card.children[1];if(body&&!$('.rw-market-listing-meta',body)){
      var m=document.createElement('div');m.className='rw-market-listing-meta';
      var curated=fresh.curationBadges.map(function(a){return'<span class="rw-curation rw-curation-'+esc(a)+'">'+esc(CURATION_LABELS[a])+'</span>'}).join('');
      m.innerHTML='<span>Direct</span><span>Request to book</span><span>₹0 guest fee</span>'+curated+fresh.amenities.slice(0,2).map(function(a){return'<span>'+esc(a)+'</span>'}).join('');body.appendChild(m);
      if(fresh.experienceSummary){var ex=document.createElement('p');ex.className='rw-market-experience';ex.textContent=fresh.experienceSummary;body.appendChild(ex)}
      if(fresh.hostNote){var hn=document.createElement('p');hn.className='rw-market-hostnote';hn.textContent=fresh.hostNote;body.appendChild(hn)}
    }
    updateCardTotal(card,fresh.price)
  }));
  var h=$('#results');if(h&&!$('.result.direct',h)&&!$('#rwMarketNoDirect'))h.insertAdjacentHTML('afterbegin','<div id="rwMarketNoDirect" class="rw-market-empty"><b>Milan Heights is the first RoamWise stay pilot.</b><span>If no matching room is shown, try other dates. Additional stays will appear after partner onboarding is complete.</span></div>')
}
function updateCardTotal(card,price){var c=trip(),n=nightsBetween(c.checkIn,c.checkOut),side=$('.side',card);if(!side||!n||!price)return;var old=$('.rw-market-total',side);if(old)old.remove();var d=document.createElement('div');d.className='rw-market-total';d.innerHTML='<b>'+money(price*n)+'</b><span>'+n+' night'+(n===1?'':'s')+' room total before property/local taxes, if any</span>';side.insertBefore(d,side.firstChild.nextSibling||null)}

function shareTripLink(){
  var dest=String(($('#dest')||{}).value||'').trim().slice(0,100),ci=String(($('#checkin')||{}).value||''),co=String(($('#checkout')||{}).value||''),g=Number(($('#guests')||{}).value||2);
  var query=new URLSearchParams({role:'customer',destination:dest||'Almora'});
  if(/^\d{4}-\d{2}-\d{2}$/.test(ci)&&/^\d{4}-\d{2}-\d{2}$/.test(co)&&ci>=today()&&nightsBetween(ci,co)>0&&nightsBetween(ci,co)<=90){query.set('checkin',ci);query.set('checkout',co)}
  if(Number.isInteger(g)&&g>=1&&g<=12)query.set('guests',String(g));
  return location.origin+'/partner/?'+query.toString()
}
function searchSupport(){
  var box=$('.search');if(!box||$('#rwMarketSearchSupport'))return;
  var n=document.createElement('div');n.id='rwMarketSearchSupport';n.className='rw-market-search-support';
  n.innerHTML='<span><b>Verified direct stays first</b><small>Host approval is checked again before a request.</small></span><span><b>No prepayment on requests</b><small>Payment unlocks only after host confirmation.</small></span><span><b>Host-confirmed availability</b><small>RoamWise does not fake real-time inventory.</small></span>';
  box.appendChild(n);
  var share=document.createElement('div');share.className='rw-market-share';share.innerHTML='<span><b>Send this stay search</b><small>Dates and guests travel with the link. The traveller requests a stay here; nothing is booked or charged by sharing.</small></span><div><a id="rwMarketShareWa" href="#" target="_blank" rel="noopener noreferrer">WhatsApp</a><a id="rwMarketShareTg" href="#" target="_blank" rel="noopener noreferrer">Telegram</a><button type="button" id="rwMarketShareCopy">Copy link</button><button type="button" id="rwMarketShareMore">More apps</button></div><small id="rwMarketShareStatus" role="status"></small>';
  box.appendChild(share);
  var wa=$('#rwMarketShareWa',share),tg=$('#rwMarketShareTg',share),copy=$('#rwMarketShareCopy',share),more=$('#rwMarketShareMore',share),status=$('#rwMarketShareStatus',share);
  wa.onclick=function(){wa.href='https://wa.me/?text='+encodeURIComponent('Explore verified RoamWise stays and request availability: '+shareTripLink())};
  tg.onclick=function(){tg.href='https://t.me/share/url?url='+encodeURIComponent(shareTripLink())+'&text='+encodeURIComponent('Explore verified RoamWise stays and request availability')};
  copy.onclick=async function(){try{await navigator.clipboard.writeText(shareTripLink());status.textContent='Link copied — paste it in Instagram DM, SMS or any chat.'}catch(e){status.textContent='Copy this link from your address bar to share it.'}};
  more.onclick=async function(){var url=shareTripLink();if(navigator.share)try{await navigator.share({title:'RoamWise stays',text:'Explore verified stays and request availability',url:url});return}catch(e){if(e.name==='AbortError')return}try{await navigator.clipboard.writeText(url);status.textContent='Link copied — share it in your preferred app.'}catch(e){status.textContent='Copy this link from your address bar to share it.'}}
}

function productionShell(){
  document.body.classList.add('rw-partner-marketplace');if(!PROD||DEMO)return;
  var role=currentRole(),e=$('#eyebrow'),t=$('#heroTitle'),p=$('#heroText'),a=$('#heroActions');if(!e||!t||!p)return;
  if(role==='customer'){
    e.textContent='ALMORA STAY · MILAN HEIGHTS';t.innerHTML='Stay in Almora. <em>Ask directly.</em>';
    p.textContent='Approx. ₹1,613–₹3,226 per room, per night. Confirm the room, dates and final total including applicable taxes with the hotel on WhatsApp.';
    if(a)a.innerHTML='<a class="btn" href="#view">Choose dates and enquire →</a>';
    var grid=$('#rolegrid');if(grid)grid.style.display='none';
    $$('.nav a[href="/partner/join/"],.nav a[href="/creators/match.html?role=property"],#modeBtn,#signOutBtn').forEach(function(n){n.style.display='none'});
  }else if(role==='owner'){
    e.textContent='HOST WITH ROAMWISE';t.innerHTML='Keep your rates. <em>Keep more.</em>';p.textContent='Verify your account, submit your property, pass review, then manage rooms and guest requests.';
    if(a)a.innerHTML='<a class="btn" href="/partner/join/">Start or continue application →</a><a class="btn secondary" href="/creators/match.html?role=property">Match with verified creators</a>';
  }else if(role==='partner'){
    e.textContent='HOST DASHBOARD';t.innerHTML='Your rooms. <em>Your guest relationship.</em>';p.textContent='Manage rooms, requests, public payment preferences and completed-stay earnings.';
    if(a)a.innerHTML='<a class="btn secondary" href="/creators/match.html?role=property">Find verified creators</a>';
  }
  var trust=$('#rwMarketTrust');if(trust)trust.remove();
  var f=$('.footer');if(f)f.textContent=role==='customer'?'RoamWise enquiry · WhatsApp goes to Milan Heights · final price confirmed by the hotel':'RoamWise Stays · verified direct hosts · host-controlled rates';
}

async function loadIdentity(){var u=user(),F=fb();admin=false;if(u&&F.db)try{admin=(await F.db.collection('admins').doc(u.uid).get()).exists}catch(e){}productionShell();if(admin)legacyRepair()}

async function approvePartner(uid){
  var F=fb(),u=user();if(!F.db||!u)throw Error('Sign in as founder/admin first.');var a=await F.db.collection('admins').doc(u.uid).get();if(!a.exists)throw Error('Founder/admin access required.');
  var ref=F.db.collection('partners').doc(uid),d=await ref.get();if(!d.exists)throw Error('Partner not found.');var p=d.data()||{},on=p.onboarding||{};
  if(!on.mouAcceptedAt||on.mouVersion!=='RW-PMOU-2026-09-27-V4')throw Error('Current property MOU is not accepted yet.');
  location.href='audit/?uid='+encodeURIComponent(uid)
}
function interceptApproval(event){var b=event.target.closest&&event.target.closest('[data-liveapprove]');if(!b)return false;event.preventDefault();event.stopImmediatePropagation();b.disabled=true;b.textContent='Approving…';approvePartner(b.dataset.liveapprove).catch(function(e){b.disabled=false;b.textContent='Approve';alert(e.message||e)});return true}
async function legacyRepair(){
  if(!admin||!$('#saveTravel')||$('#rwLegacyRepair'))return;var F=fb();try{var q=await F.db.collection('partners').where('status','==','active').limit(100).get(),bad=[];q.forEach(function(d){if((d.data()||{}).verified!==true)bad.push(d)});if(!bad.length)return;
    var n=document.createElement('div');n.id='rwLegacyRepair';n.className='rw-market-adminfix';n.innerHTML='<div><b>'+bad.length+' legacy active partner(s) need repair</b><span>Old approval used a non-boolean verification value; current rules require verified:true.</span></div><button>Repair now</button>';$('#view').insertBefore(n,$('#view').firstChild);$('button',n).onclick=async function(){this.disabled=true;for(var d of bad){await d.ref.set({verified:true,verifiedState:'verified'},{merge:true});var rq=await d.ref.collection('rooms').limit(100).get(),jobs=[];rq.forEach(function(r){jobs.push(r.ref.set({marketplaceApproved:true,partnerUid:d.id,partnerVerifiedAt:now(),updatedAt:now()},{merge:true}))});await Promise.all(jobs)}location.reload()}
  }catch(e){}
}

async function syncApprovedRooms(){
  if(DEMO||syncing)return;var u=user(),F=fb();if(!u||!F.db)return;syncing=true;try{var pd=await F.db.collection('partners').doc(u.uid).get(),p=pd.exists?pd.data():null;if(!p||p.status!=='active'||p.verified!==true||!p.pricingAudit||p.pricingAudit.status!=='passed'||!p.qualityReview||p.qualityReview.status!=='passed')return;var q=await pd.ref.collection('rooms').limit(100).get(),jobs=[];q.forEach(function(r){var x=r.data()||{};if(x.marketplaceApproved!==true||x.partnerUid!==u.uid)jobs.push(r.ref.set({marketplaceApproved:true,partnerUid:u.uid,partnerVerifiedAt:p.approvedAt||now(),updatedAt:now()},{merge:true}))});await Promise.all(jobs)}catch(e){}finally{syncing=false}
}

async function hostStudio(){
  if(DEMO||$('#rwHostStudio')||!$('#addRoom'))return;var u=user(),F=fb();if(!u||!F.db)return;var d;try{d=await F.db.collection('partners').doc(u.uid).get()}catch(e){return}if(!d.exists)return;var p=d.data()||{},pay=p.payout||{},gallery=Array.isArray(p.gallery)?p.gallery.join('\n'):'',amen=Array.isArray(p.amenities)?p.amenities.join(', '):'';
  var box=document.createElement('section');box.id='rwHostStudio';box.className='rw-market-host-studio';box.innerHTML='<div class="rw-market-host-head"><div><small>HOST STUDIO</small><h2>Marketplace profile</h2><p>One public-safe profile powers your direct listing and post-confirmation payment choices.</p></div></div><div class="rw-market-host-fields"><label>Hero image URL<input id="rwHostImage" value="'+esc(p.heroImage||'')+'" placeholder="https://…"></label><label>Gallery image URLs<textarea id="rwHostGallery" placeholder="One HTTPS URL per line">'+esc(gallery)+'</textarea></label><label>Amenities<input id="rwHostAmenities" value="'+esc(amen)+'" placeholder="Breakfast, Wi-Fi, parking, mountain view"></label><label>Cancellation policy<input id="rwHostCancel" value="'+esc(p.cancellation||'')+'" placeholder="Free cancellation up to 48h before"></label><label>UPI ID <small>optional · available only after confirmation</small><input id="rwHostUpi" value="'+esc(pay.upiId||'')+'" placeholder="name@bank"></label><label>Hosted payment page <small>optional · HTTPS only</small><input id="rwHostPayLink" value="'+esc(pay.paymentLink||'')+'" placeholder="https://…"></label><label>House rules<textarea id="rwHostRules">'+esc(p.houseRules||'')+'</textarea></label><label>Guest welcome note<textarea id="rwHostWelcome">'+esc(p.welcomeNote||'')+'</textarea></label></div><div class="rw-market-host-actions"><button id="rwHostSave">Save marketplace profile</button><span id="rwHostMsg"></span></div><div class="rw-market-security"><b>Security:</b> never paste card data, bank passwords or secret gateway keys here.</div>';
  $('#view').insertBefore(box,$('#view').firstChild);$('#rwHostSave').onclick=saveHostStudio
}
async function saveHostStudio(){
  var u=user(),F=fb();if(!u||!F.db)return;var rawLink=String(($('#rwHostPayLink')||{}).value||'').trim();if(rawLink&&!safeHttps(rawLink)){return $('#rwHostMsg').textContent='Hosted payment links must use HTTPS.'}
  var hero=safeHttps(($('#rwHostImage')||{}).value),gallery=String(($('#rwHostGallery')||{}).value||'').split(/\n|,/).map(safeHttps).filter(Boolean).slice(0,12),amen=String(($('#rwHostAmenities')||{}).value||'').split(',').map(function(s){return s.trim()}).filter(Boolean).slice(0,20),upi=String(($('#rwHostUpi')||{}).value||'').trim();
  var doc={heroImage:hero,gallery:gallery,amenities:amen,cancellation:String(($('#rwHostCancel')||{}).value||'').trim().slice(0,400),houseRules:String(($('#rwHostRules')||{}).value||'').trim().slice(0,1000),welcomeNote:String(($('#rwHostWelcome')||{}).value||'').trim().slice(0,1000),payout:{upiId:validUpi(upi)?upi:'',paymentLink:safeHttps(rawLink),updatedAt:now()},updatedAt:now()};
  var msg=$('#rwHostMsg'),btn=$('#rwHostSave');btn.disabled=true;msg.textContent='Saving…';try{await F.db.collection('partners').doc(u.uid).set(doc,{merge:true});var q=await F.db.collection('partners').doc(u.uid).collection('rooms').limit(100).get(),jobs=[];q.forEach(function(r){jobs.push(r.ref.set({heroImage:doc.heroImage,amenities:doc.amenities,cancel:doc.cancellation,houseRules:doc.houseRules,welcomeNote:doc.welcomeNote,paymentPublic:{upiId:doc.payout.upiId,paymentLink:doc.payout.paymentLink},updatedAt:now()},{merge:true}))});await Promise.all(jobs);await syncApprovedRooms();roomCache={};msg.textContent='✓ Saved and synced to your rooms.'}catch(e){msg.textContent='Could not save: '+(e.message||e)}finally{btn.disabled=false}
}

function paymentMethods(listing){var p=listing.paymentPublic||{},a=[];if(platformPay.cashfreeEnabled===true&&safeHttps(platformPay.workerBaseUrl))a.push({id:'roamwise_cashfree_after_confirmation',name:'Cashfree secure checkout',sub:'RoamWise checkout unlocks only after host confirmation.'});if(platformPay.manualUpiEnabled===true&&validUpi(platformPay.publicUpiId))a.push({id:'roamwise_upi_after_confirmation',name:'RoamWise UPI',sub:'Manual UPI fallback after host confirmation; payment is reconciled separately.'});if(validUpi(p.upiId))a.push({id:'upi_after_confirmation',name:'Host UPI after confirmation',sub:'The verified host’s UPI unlocks only after confirmation.'});if(safeHttps(p.paymentLink))a.push({id:'secure_link_after_confirmation',name:'Host secure payment page',sub:'HTTPS hosted checkout after confirmation.'});a.push({id:'pay_at_property',name:'Pay at property',sub:'No prepayment through RoamWise.'});return a}
function openBooking(listing,room){
  var c=trip(),n=nightsBetween(c.checkIn,c.checkOut);if(!n)return alert('Choose valid check-in and check-out dates.');if(c.checkIn<today())return alert('Check-in cannot be in the past.');if(n>90)return alert('For stays longer than 90 nights, contact the property/RoamWise directly.');if(c.guests>Number(room.maxGuests||2))return alert('This room sleeps up to '+Number(room.maxGuests||2)+' guests.');
  var x=publicListing(listing,room),total=x.price*n,commissionEstimate=Math.round(total*7)/100,rules=x.houseRules?'<div class="rw-market-policy"><b>House rules</b><span>'+esc(x.houseRules)+'</span></div>':'';
  modal('<div class="rw-market-book"><button id="rwMarketClose" class="rw-market-x">×</button><div class="rw-market-bookhero" '+(x.heroImage?'style="background-image:linear-gradient(180deg,rgba(6,8,15,.1),rgba(6,8,15,.94)),url(&quot;'+esc(x.heroImage)+'&quot;)"':'')+'><small>✓ VERIFIED ROAMWISE HOST</small><h2>'+esc(x.name)+'</h2><p>'+esc([x.room,x.area||x.zone].filter(Boolean).join(' · '))+'</p></div><div class="rw-market-bookgrid"><section><h3>Request this stay</h3><div class="rw-market-dates"><span><b>'+esc(c.checkIn)+'</b>Check-in</span><span><b>'+esc(c.checkOut)+'</b>Check-out</span><span><b>'+c.guests+'</b>Guests</span></div><label>Name<input id="rwMarketName" autocomplete="name"></label><label>Phone / WhatsApp<input id="rwMarketPhone" autocomplete="tel" inputmode="tel" placeholder="Phone number with country code"></label><label>Arrival note<textarea id="rwMarketNote" maxlength="500"></textarea></label><div class="rw-market-next"><b>What happens next</b><ol><li>Send a request — no payment is due.</li><li>The hotel confirms room size, availability, seasonal price and applicable tax.</li><li>After you accept the confirmed total, the selected payment option unlocks.</li></ol></div><div class="rw-market-pay"><b>Payment preference</b>'+paymentMethods(x).map(function(m,i){return'<label><input type="radio" name="rwMarketPay" value="'+m.id+'" '+(i?'':'checked')+'><span><strong>'+m.name+'</strong><small>'+m.sub+'</small></span></label>'}).join('')+'</div><div id="rwMarketAuth"></div><label class="rw-market-ack"><input id="rwMarketAck" type="checkbox"><span>I understand this is a request, not a confirmed reservation, and I will not prepay before the hotel confirms the full terms.</span></label><div id="rwMarketError" class="rw-market-error"></div><button id="rwMarketSend" class="rw-market-primary">Request this room</button><p class="rw-market-fine">The listed total includes RoamWise’s 7% commission. Hotel confirms the final room rate, tax and inclusions before payment.</p></section><aside><div class="rw-market-price"><span>'+money(x.price)+'/night</span><p>'+money(x.price)+' × '+n+' nights</p><b>'+money(total)+'</b><small>Room subtotal before applicable GST. Commission estimate at 7%: '+money(commissionEstimate)+'. Final room, seasonal price and tax are confirmed by the hotel before payment.</small></div><div class="rw-market-policy"><b>Cancellation</b><span>'+esc(x.cancel||'The host confirms terms before payment.')+'</span></div>'+rules+'</aside></div></div>');
  $('#rwMarketClose').onclick=closeModal;$('#rwMarketSend').onclick=function(){submitBooking(x,c,n)}
}
async function ensureVerifiedAuth(u){if(!u)return null;await u.reload();u=user();if(!u||!u.emailVerified)return null;await u.getIdToken(true);return u}
function authBox(listing,room){var h=$('#rwMarketAuth'),F=fb();if(!h||!F.auth)return;h.innerHTML='<div class="rw-market-auth"><b>Sign in to send the request</b><input id="rwMarketEmail" type="email" placeholder="Email"><input id="rwMarketPass" type="password" placeholder="Password (6+ characters)"><div><button id="rwMarketLogin">Sign in</button><button id="rwMarketCreate">Create account</button></div><small id="rwMarketMsg"></small></div>';async function go(create){var e=$('#rwMarketEmail').value.trim(),p=$('#rwMarketPass').value;if(!e||p.length<6)return $('#rwMarketMsg').textContent='Enter a valid email and 6+ character password.';try{var z=create?await F.auth.createUserWithEmailAndPassword(e,p):await F.auth.signInWithEmailAndPassword(e,p),u=await ensureVerifiedAuth((z&&z.user)||user());if(!u){var pending=user();if(pending)await pending.sendEmailVerification().catch(function(){});$('#rwMarketMsg').textContent='Verify your email, then reload and continue.';return}openBooking(listing,room)}catch(err){$('#rwMarketMsg').textContent=typeof friendly==='function'?friendly(err):(err.message||'Sign in failed.')}}$('#rwMarketLogin').onclick=function(){go(false)};$('#rwMarketCreate').onclick=function(){go(true)}}
function bookingError(text){var h=$('#rwMarketError');if(h){h.textContent=text||'';if(text)h.setAttribute('role','alert')}}
async function submitBooking(modalListing,c,n){
  bookingError('');var u=user();if(!u){var cached=await getRoom(modalListing,true);return authBox(modalListing,cached||modalListing)}u=await ensureVerifiedAuth(u);if(!u){var pending=user();if(pending)pending.sendEmailVerification().catch(function(){});return bookingError('Verify your email before booking. We sent the verification link again.')}
  var name=String(($('#rwMarketName')||{}).value||'').trim().slice(0,120),phone=String(($('#rwMarketPhone')||{}).value||'').trim().slice(0,80),note=String(($('#rwMarketNote')||{}).value||'').trim().slice(0,500),method=($('input[name="rwMarketPay"]:checked')||{}).value||'pay_at_property';if(!name)return bookingError('Add the traveller name.');if(!validPhone(phone))return bookingError('Add a valid phone number (7–15 digits).');if(!($('#rwMarketAck')||{}).checked)return bookingError('Review and accept the booking and prepayment terms first.');
  var room=await getRoom(modalListing,true);if(!approved(room,modalListing))return bookingError('This room is no longer approved for direct booking.');var latest=publicListing(modalListing,room);if(!latest.price||latest.price<=0)return bookingError('The host is updating this room price. Try again shortly.');if(c.guests>latest.maxGuests)return bookingError('The room capacity changed. It now sleeps up to '+latest.maxGuests+' guests.');
  var snap={kind:method};if(method==='roamwise_cashfree_after_confirmation'){if(platformPay.cashfreeEnabled!==true||!safeHttps(platformPay.workerBaseUrl))return bookingError('Cashfree checkout is temporarily unavailable. Choose another method.')}else if(method==='roamwise_upi_after_confirmation'){if(platformPay.manualUpiEnabled!==true||!validUpi(platformPay.publicUpiId))return bookingError('RoamWise UPI is temporarily unavailable.');snap.upiId=platformPay.publicUpiId;snap.payeeName=String(platformPay.publicPayeeName||'RoamWise').slice(0,100)}else if(method==='upi_after_confirmation'){if(!validUpi(latest.paymentPublic.upiId))return bookingError('UPI is no longer available. Choose another payment method.');snap.upiId=latest.paymentPublic.upiId}else if(method==='secure_link_after_confirmation'){var url=safeHttps(latest.paymentPublic.paymentLink);if(!url)return bookingError('The secure payment page is no longer available.');snap.url=url}else if(method!=='pay_at_property')return bookingError('That payment method is no longer available.');
  var amount=latest.price*n,rec={ref:'RW-'+Date.now().toString(36).toUpperCase(),status:'requested',bookingVersion:'marketplace',partnerUid:latest.partnerUid,propertyId:latest.propertyId||latest.partnerUid,roomId:latest.roomId,guestUid:u.uid,guestName:name,guestEmail:u.email||'',guestPhone:phone,note:note,property:latest.name||'',room:latest.room||'',zone:latest.zone||'',area:latest.area||'',checkIn:c.checkIn,checkOut:c.checkOut,guests:c.guests,nights:n,roomPrice:latest.price,amount:amount,commissionPctSnapshot:Number(latest.commissionPct||7),paymentMethod:method,paymentSnapshot:snap,paymentStatus:'awaiting_host_confirmation',createdAt:firebase.firestore.FieldValue.serverTimestamp(),at:now()};
  var b=$('#rwMarketSend');b.disabled=true;b.textContent='Sending…';try{await fb().db.collection('roomBookings').add(rec);modal('<div class="rw-market-success"><span>✓</span><small>REQUEST SENT</small><h2>'+esc(rec.ref)+'</h2><p>'+esc(rec.property)+' now has your request. Payment remains locked until the host confirms.</p><div class="rw-market-timeline"><span class="on"><b>1</b>Requested</span><i></i><span><b>2</b>Host response</span><i></i><span><b>3</b>Pay / stay</span></div><button id="rwMarketDone" class="rw-market-primary">Done</button></div>');$('#rwMarketDone').onclick=function(){closeModal();setTimeout(paymentStatuses,120)}}catch(e){b.disabled=false;b.textContent='Request to book';bookingError(e.message||e)}
}
function interceptBooking(event){if(DEMO)return false;var b=event.target.closest&&event.target.closest('[data-book]');if(!b)return false;event.preventDefault();event.stopImmediatePropagation();var x=parseBookingButton(b);if(!x)return true;b.disabled=true;var old=b.textContent;b.textContent='Checking…';getRoom(x,true).then(function(r){if(!approved(r,x))throw Error('This room is not currently verified for direct booking.');openBooking(x,r)}).catch(function(e){alert(e.message||e)}).finally(function(){b.disabled=false;b.textContent=old});return true}
function upiLink(b){var p=(b.paymentSnapshot||{}).upiId;if(!validUpi(p))return'';return'upi://pay?'+new URLSearchParams({pa:p,pn:b.property||'RoamWise Host',am:String(Number(b.amount||0).toFixed(2)),cu:'INR',tn:'RoamWise '+(b.ref||'booking')})}
function cashfreeSdk(){if(window.Cashfree)return Promise.resolve();return new Promise(function(resolve,reject){var old=$('#rwCashfreeSdk');if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}var s=document.createElement('script');s.id='rwCashfreeSdk';s.src='https://sdk.cashfree.com/js/v3/cashfree.js';s.onload=resolve;s.onerror=function(){reject(Error('Cashfree checkout could not load.'))};document.head.appendChild(s)})}
async function cashfreeStatus(base,id,token){for(var i=0;i<6;i++){if(i)await new Promise(function(r){setTimeout(r,1800)});var res=await fetch(base+'/partner/cashfree/order/'+encodeURIComponent(id)+'/status',{headers:{Authorization:'Bearer '+token}}),data=await res.json().catch(function(){return{}});if(res.ok&&data.order_status==='PAID')return true;if(!res.ok&&res.status!==409)throw Error(data.message||'Could not verify payment.')}return false}
async function startCashfree(id,button){var u=user(),base=safeHttps(platformPay.workerBaseUrl);if(!u||!base)return alert('Cashfree checkout is not available.');button.disabled=true;button.textContent='Preparing secure checkout…';try{var token=await u.getIdToken(true),res=await fetch(base+'/partner/cashfree/order',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({bookingId:id})}),data=await res.json().catch(function(){return{}});if(!res.ok||!data.payment_session_id)throw Error(data.message||'Could not create checkout.');await cashfreeSdk();var cf=window.Cashfree({mode:data.environment==='production'?'production':'sandbox'});await cf.checkout({paymentSessionId:data.payment_session_id,redirectTarget:'_modal'});button.textContent='Verifying payment…';var paid=await cashfreeStatus(base,id,token);button.textContent=paid?'Payment verified':'Check payment status';button.disabled=false;if(paid){roomCache={};var old=$('#rwMarketBookings');if(old)old.remove();paymentStatuses()}else alert('Payment is not confirmed yet. If you paid, use “Check payment status” shortly.')}catch(e){button.disabled=false;button.textContent='Pay securely with Cashfree';alert(e.message||e)}}
async function paymentStatuses(){
  if(DEMO||!$('#results')||$('#rwMarketBookings'))return;var u=user(),F=fb();if(!u||!F.db)return;try{var q=await F.db.collection('roomBookings').where('guestUid','==',u.uid).limit(50).get(),a=[];q.forEach(function(d){a.push(Object.assign({_id:d.id},d.data()||{}))});if(!a.length)return;a.sort(function(x,y){return String(y.at||'').localeCompare(String(x.at||''))});var s=document.createElement('section');s.id='rwMarketBookings';s.className='rw-market-bookings';s.innerHTML='<div class="rw-market-sectionhead"><small>MY DIRECT STAYS</small><h2>Requests & payment status</h2></div>'+a.map(function(b){var st=b.status||'requested',act='';if(b.paymentStatus==='paid')act='<span class="rw-market-payready">✓ Payment verified by Cashfree</span>';else if(st==='requested')act='<span class="rw-market-wait">Awaiting host confirmation — do not prepay.</span>';else if(st==='declined')act='<span class="rw-market-declined">Host could not confirm this request.</span>';else if(st==='confirmed'||st==='completed'){if(b.paymentMethod==='pay_at_property')act='<span class="rw-market-payready">Pay at property · no online payment needed</span>';else if(b.paymentMethod==='roamwise_cashfree_after_confirmation')act='<button class="rw-market-paybtn" data-rw-cashfree="'+esc(b._id)+'">Pay securely with Cashfree</button>';else if((b.paymentMethod==='roamwise_upi_after_confirmation'||b.paymentMethod==='upi_after_confirmation')&&upiLink(b))act='<a class="rw-market-paybtn" href="'+esc(upiLink(b))+'">Pay '+money(b.amount)+' by UPI</a>';else if(b.paymentMethod==='secure_link_after_confirmation'&&safeHttps((b.paymentSnapshot||{}).url))act='<a class="rw-market-paybtn" target="_blank" rel="noopener" href="'+esc(safeHttps(b.paymentSnapshot.url))+'">Open secure payment page ↗</a>';else act='<span class="rw-market-payready">Confirmed · contact host for payment</span>'}return'<article><div><b>'+esc(b.property||'Stay')+'</b><span>'+esc(b.room||'')+' · '+esc(b.checkIn||'')+' → '+esc(b.checkOut||'')+'</span></div><em>'+esc(st)+'</em><strong>'+money(b.amount||0)+'</strong>'+act+'</article>'}).join('');$('#results').appendChild(s);$$('[data-rw-cashfree]',s).forEach(function(b){b.onclick=function(){startCashfree(b.dataset.rwCashfree,b)}});$$('#results > .card').forEach(function(c){var h=$('h2',c);if(h&&h.textContent.trim()==='My trips')c.style.display='none'})}catch(e){}
}

async function hostOverview(){
  if(DEMO||!$('#addRoom'))return;var u=user(),F=fb();if(!u||!F.db||hostBusy)return;var k=u.uid+':'+currentRole();if($('#rwMarketHostOverview')&&lastHostKey===k)return;hostBusy=true;lastHostKey=k;try{var pd=await F.db.collection('partners').doc(u.uid).get();if(!pd.exists)return;var p=pd.data()||{},rq=await pd.ref.collection('rooms').limit(100).get(),bq=await F.db.collection('roomBookings').where('partnerUid','==',u.uid).limit(100).get(),rooms=0,live=0,requests=0,confirmed=0,potential=0,overdue=0,rows=[];rq.forEach(function(r){rooms++;var x=r.data()||{};if(x.open!==false&&x.marketplaceApproved===true)live++});bq.forEach(function(d){var x=d.data()||{},st=String(x.status||'requested');if(st==='requested')requests++;if(st==='confirmed')confirmed++;if(st==='requested'||st==='confirmed')potential+=Number(x.amount||0);var at=Date.parse(x.at||'');if(st==='requested'&&at&&Date.now()-at>86400000)overdue++;rows.push(x)});rows.sort(function(a,b){return String(b.at||'').localeCompare(String(a.at||''))});var old=$('#rwMarketHostOverview');if(old)old.remove();var s=document.createElement('section');s.id='rwMarketHostOverview';s.className='rw-market-host-overview';s.innerHTML='<div class="rw-market-host-summary"><div><small>HOST TODAY</small><h2>'+(requests?'You have '+requests+' request'+(requests===1?'':'s')+' to review':'Your hosting workspace is clear')+'</h2><p>'+(p.verified===true?'Verified host · ':'Verification pending · ')+live+' live room'+(live===1?'':'s')+' of '+rooms+'</p></div></div><div class="rw-market-host-stats"><span><b>'+requests+'</b><small>New requests</small></span><span><b>'+confirmed+'</b><small>Confirmed</small></span><span><b>'+live+'</b><small>Live rooms</small></span><span><b>'+money(potential)+'</b><small>Open booking value</small></span></div>'+(overdue?'<div class="rw-market-attention"><b>'+overdue+' request'+(overdue===1?'':'s')+' waiting over 24 hours</b><span>Respond or decline so guests can make another plan.</span></div>':'')+(rows.length?'<div class="rw-market-recent"><b>Recent reservation activity</b>'+rows.slice(0,3).map(function(x){return'<span><strong>'+esc(x.guestName||'Guest')+' · '+esc(x.room||x.property||'Stay')+'</strong><small>'+esc(x.checkIn||'')+' → '+esc(x.checkOut||'')+' · '+esc(x.status||'requested')+' · '+money(x.amount||0)+'</small></span>'}).join('')+'</div>':'');$('#view').insertBefore(s,$('#view').firstChild)}catch(e){}finally{hostBusy=false}
}
async function lifecyclePanel(){
  if(DEMO||!$('#addRoom')||$('#rwMarketLifecycle'))return;var u=user(),F=fb();if(!u||!F.db)return;
  try{var pd=await F.db.collection('partners').doc(u.uid).get();if(!pd.exists)return;var p=pd.data()||{},req=p.lifecycleRequest||{},stage=String(p.lifecycleStage||'live'),labels={application_submitted:'Application',review:'Verification',ready:'Ready to launch',live:'Live',paused:'Paused',offboarding:'Offboarding',offboarded:'Offboarded'},steps=['Application','Verification','Go live','Operate','Settle','Deboard responsibly'],idx=stage==='application_submitted'?0:stage==='review'?1:stage==='ready'?2:stage==='live'?3:stage==='paused'?3:stage==='offboarding'?5:stage==='offboarded'?5:3;
    var s=document.createElement('section');s.id='rwMarketLifecycle';s.className='rw-market-lifecycle';s.innerHTML='<div class="rw-market-sectionhead"><small>PARTNER LIFECYCLE</small><h2>'+esc(labels[stage]||stage)+'</h2><p>One accountable path from application to a clean final settlement and data handover.</p></div><div class="rw-market-lifecycle-steps">'+steps.map(function(x,i){return'<span class="'+(i<=idx?'done':'')+'"><b>'+svg(i===0?'home':i===1?'shield':i===2?'spark':i===3?'ops':i===4?'compass':'mountain')+'</b><small>'+x+'</small></span>'}).join('')+'</div>'+(req.status==='pending'?'<div class="rw-market-attention"><b>'+esc(req.kind||'Lifecycle')+' request pending</b><span>'+esc(req.reason||'The trust desk will review this request and protect open bookings before changing the listing.')+'</span></div>':'')+'<div class="rw-market-ops-check"><span><b>Daily</b><small>Respond to requests and keep room availability accurate.</small></span><span><b>Every stay</b><small>Confirm terms before payment; record issues and completion.</small></span><span><b>Monthly</b><small>Reconcile bookings, commission, refunds and destination details.</small></span></div><div class="actions">'+(req.status==='pending'?'<button class="btn secondary" data-lifecycle="cancel">Cancel request</button>':'<button class="btn secondary" data-lifecycle="pause">Request a pause</button><button class="btn red" data-lifecycle="offboard">Start deboarding</button>')+'</div><p class="rw-market-fine">A pause or deboarding request never deletes booking history. RoamWise reviews open stays, refunds, chargebacks and settlement before delisting.</p>';
    var anchor=$('#rwHostStudio')||$('#view').firstChild;$('#view').insertBefore(s,anchor);$$('[data-lifecycle]',s).forEach(function(b){b.onclick=function(){requestLifecycle(b.dataset.lifecycle)}})
  }catch(e){}
}
async function requestLifecycle(kind){
  var u=user(),F=fb();if(!u||!F.db)return;if(kind==='cancel'){if(!confirm('Cancel the pending lifecycle request?'))return;await F.db.collection('partners').doc(u.uid).set({lifecycleRequest:{kind:'none',status:'cancelled',cancelledAt:now()},updatedAt:now()},{merge:true});var old=$('#rwMarketLifecycle');if(old)old.remove();return lifecyclePanel()}
  var label=kind==='offboard'?'deboarding':'pause',reason=prompt('Why are you requesting '+label+'? Open bookings and settlements will be reviewed first.','');if(reason===null)return;reason=String(reason).trim().slice(0,500);if(!reason)return alert('Add a short reason so the trust desk can handle the request safely.');if(kind==='offboard'&&!confirm('Start deboarding review? Your listing is not deleted immediately; open guest and payment obligations are protected.'))return;
  await F.db.collection('partners').doc(u.uid).set({lifecycleRequest:{kind:kind,status:'pending',reason:reason,requestedAt:now()},updatedAt:now()},{merge:true});var old=$('#rwMarketLifecycle');if(old)old.remove();lifecyclePanel()
}
function adminTrust(){if($('#rwAdminTrust')||!$('#saveTravel'))return;var n=document.createElement('div');n.id='rwAdminTrust';n.className='rw-market-adminfix';n.innerHTML='<div><b>Verification standard</b><span>Before approval: confirm owner/contact, public location/rates and walkthrough readiness. Never request identity documents or gateway secrets in this static page.</span></div>';$('#view').insertBefore(n,$('#view').firstChild)}
function accessibility(){var m=$('#modal');if(m){m.setAttribute('role','dialog');m.setAttribute('aria-modal','true')}$$('button').forEach(function(b){if(!b.getAttribute('type'))b.setAttribute('type','button')})}
function repaint(){productionShell();dateGuard();accessibility();var role=currentRole();if(role==='customer'){if(DEMO){searchSupport();validateCards();setTimeout(paymentStatuses,60)}}else if(role==='partner'){hostOverview();hostStudio();lifecyclePanel()}else if(role==='admin'){adminTrust();if(admin)legacyRepair()}if($('#addRoom'))syncApprovedRooms()}
function scheduleRepaint(){clearTimeout(repaintTimer);repaintTimer=setTimeout(repaint,70)}
function captureClick(event){if(interceptApproval(event))return;if(event.target.closest&&event.target.closest('#roomSave'))setTimeout(function(){roomCache={};syncApprovedRooms()},900);interceptBooking(event)}

function init(){
  document.body.classList.add('rw-partner-marketplace');document.addEventListener('click',captureClick,true);document.addEventListener('change',function(e){if(e.target&&e.target.id==='checkin')dateGuard();if(e.target&&/^(checkin|checkout)$/.test(e.target.id))$$('.result.direct').forEach(function(c){var x=parseBookingButton($('[data-book]',c)||{});if(x)updateCardTotal(c,Number(x.price||0))})},true);
  var observer=new MutationObserver(scheduleRepaint),view=$('#view'),roles=$('#rolegrid');if(view)observer.observe(view,{childList:true,subtree:true});if(roles)observer.observe(roles,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  var F=fb();loadPlatformPay().then(scheduleRepaint);if(F.auth)F.auth.onAuthStateChanged(function(){roomCache={};lastHostKey='';setTimeout(function(){loadIdentity();loadPlatformPay().then(scheduleRepaint);syncApprovedRooms();repaint()},80)});repaint();setTimeout(repaint,350);setTimeout(repaint,1100)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.RWPartnerMarketplace={version:'5.0.2-canonical',validateCards:validateCards,syncRooms:syncApprovedRooms,payments:paymentStatuses};
})();
