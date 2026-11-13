/* RoamWise Trails: user-operated portal, never auto-publishes unverified operators. */
(function(){
'use strict';
const API='https://roamwise-api.founder-f53.workers.dev';
const $=id=>document.getElementById(id);
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toLocaleString('en-IN');
// Founder-confirmed public business WhatsApp number used for Hike & Seek trek bookings.
const HIKE_SEEK_WHATSAPP='919286322067';
const whatsappLink=(phone,trek,operator='Hike & Seek')=>'https://wa.me/'+String(phone).replace(/[^0-9]/g,'')+'?text='+encodeURIComponent('Hi '+operator+', I found '+trek+' on RoamWise. Please share available dates, operator price, inclusions, pickup point and how to book.');
const HIKES=[
 ['Tungnath / Chandrashila','3 days on listing; 4 days in itinerary','https://hikeandseek.in/trip/tungnath/'],
 ['Brahmatal','Operator details pending','https://hikeandseek.in/trip/brahmatal/'],
 ['Kedarkantha','5 days listed','https://hikeandseek.in/trip/kedarkantha/'],
 ['Kuari Pass','Operator details pending','https://hikeandseek.in/trip/kuari-pass-trek/'],
 ['Dayara Bugyal','Operator details pending','https://hikeandseek.in/trip/dayara-bugyal/'],
 ['Nag Tibba','Operator details pending','https://hikeandseek.in/trip/nag-tibba-trek/'],
 ['Kedarnath Dham','Operator details pending','https://hikeandseek.in/trip/kedarnath-dham/']
];
const state={user:null,auth:null,items:[],packages:[],active:null,nonce:null,deepLinked:false,checkoutEnabled:false};
/* Plain-language text for every server answer, so nobody sees a raw code. */
const FIELD_LABEL={role:'partner type',name:'name',region:'region',phone:'business phone',email:'email',consent:'the authorisation tick box',
 start:'departure date (must be in the future)',unitPrice:'price (₹100 to ₹2,00,000)',seats:'seats (1 to 100)',duration:'duration (1 to 60 days)',
 itinerary:'day-by-day plan',includes:"what's included",refundPolicy:'cancellation and refund terms',safetyNote:'safety and emergency plan'};
const ERRORS={verified_login_required:'Please sign in with Google first (top right).',email_must_match_login:'The email must be the Google account you signed in with. Sign in with your business account, or use "Switch Google account".',
 complete_required_fields:'Please fill in: ',missing_or_invalid_package_details:'Please check: ',partner_application_required:'Apply in "Become a partner" first; then you can add departures.',
 approved_operator_required:'This opens once RoamWise approves your business.',forbidden:'That belongs to another account.',not_found:'Not found. Refresh the page and try again.',
 departure_not_available:'This departure is no longer open.',invalid_gallery_urls:'Gallery photos: up to 4 links, each starting with https://, one per line.',
 operator_reference_required:'Add a short reference (at least 8 characters), e.g. your booking or seat number.',review_note_required:'Write a short note so the operator knows what to change.',
 approve_provider_first:'Approve the operator before publishing their departure.',booking_not_awaiting_decision:'This booking was already decided.',
 checkout_fields_required:'Add your phone, use the email you signed in with, and tick both boxes.',complete_enquiry_and_consent:'Add your name, email, a short question and tick the consent box.',trek_service_unavailable:'Trails is busy right now. Please try again in a minute.'};
function humanError(data,status){
 const code=data&&data.error,fields=Array.isArray(data&&data.fields)?data.fields:[];
 if(fields.length&&ERRORS[code])return ERRORS[code]+fields.map(f=>FIELD_LABEL[f]||f).join(', ')+'.';
 return ERRORS[code]||(/unavailable$/.test(code||'')?'Something went wrong on our side. Please try again in a minute.':'Request failed ('+(code||status)+'). Please try again.');
}
const STATUS={pending_review:['In review','RoamWise checks it, usually within 2 working days. We email you.'],approved:['Approved','You can sell. Each new departure is checked once before it goes live.'],
 changes_requested:['Changes needed','See the note, update and save again.'],paused:['Paused','Hidden from travellers.'],published:['Live','Travellers can see, enquire and book.'],
 paid_pending_operator_confirmation:['Paid · confirm seats','Confirm the seats or tell us you cannot.'],operator_confirmed:['Confirmed','Seats confirmed.'],refund_review_required:['Refund review','RoamWise is handling the refund.']};
const statusLabel=s=>(STATUS[s]||[String(s||'')])[0];
const statusHelp=s=>(STATUS[s]||['',''])[1];
let toastTimer=null;
function message(s,bad){
 $('msg').textContent=s||'';$('msg').style.color=bad?'#ff989c':'#ffd395';
 let t=$('rwToast');if(!t){t=document.createElement('div');t.id='rwToast';t.setAttribute('role',bad?'alert':'status');document.body.appendChild(t)}
 t.textContent=s||'';t.className=bad?'bad':'';t.hidden=!s;clearTimeout(toastTimer);
 if(s)toastTimer=setTimeout(()=>{t.hidden=true},bad?9000:6000);
}
function tab(id){
 for(const s of document.querySelectorAll('.view'))s.classList.toggle('active',s.id===id);
 for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-selected',String(b.dataset.tab===id));
 if(id==='studio')mine();if(id==='review')review();if(id==='discover')catalog();
 if(location.hash!=='#'+id)history.replaceState(null,'','#'+id);
 $('checkoutPanel').classList.add('hidden');
}
for(const b of document.querySelectorAll('[data-tab]'))b.addEventListener('click',()=>tab(b.dataset.tab));
function checkLogin(){
 if(!state.user){message('Please sign in with a verified Google email to continue.',true);return false}
 if(!state.user.emailVerified){message('Verify your email before submitting.',true);return false}
 return true;
}
async function token(){
 if(!checkLogin())throw Error('A verified sign-in is required.');
 return state.user.getIdToken();
}
async function api(path,body,authenticated){
 const headers={'content-type':'application/json'};
 if(authenticated)headers.authorization='Bearer '+await token();
 let r;
 try{r=await fetch(API+path,{method:body==null?'GET':'POST',headers,
  ...(body==null?{}:{body:JSON.stringify(body)})});}
 catch(_){throw Error('Network unavailable. Please check connection.')}
 const data=await r.json().catch(()=>({}));
 if(!r.ok){const e=Error(humanError(data,r.status));e.fields=data.fields||[];throw e}
 return data;
}
async function switchAccount(){
 if(!state.auth){message('Google sign-in is unavailable.',true);return}
 try{await state.auth.signOut();const provider=new firebase.auth.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
  try{await state.auth.signInWithPopup(provider)}catch(e){if(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment')await state.auth.signInWithRedirect(provider);else throw e}
 }catch(e){message('Account switch failed: '+(e.message||'Try signing in again.'),true)}
}
$('switchAccountBtn').addEventListener('click',switchAccount);
async function login(){
 try{
  if(state.user){await state.auth.signOut();return}
  await state.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
 }catch(e){
  if(['auth/popup-blocked','auth/popup-closed-by-user','auth/operation-not-supported-in-this-environment'].includes(e.code)){
   try{await state.auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());return}
   catch(x){message(x.message,true);return}
  }
  message(e.message||'Sign-in unavailable',true);
 }
}
$('loginBtn').addEventListener('click',login);
function signedIn(u){
 state.user=u;
 $('loginBtn').textContent=u?'Sign out · '+(u.email||'account'):'Sign in with Google';
 $('adminTab').classList.add('hidden');
 $('switchAccountBtn').classList.toggle('hidden',!u);
 const accountWarning=$('accountWarning');
 if(new URLSearchParams(location.search).get('invite')==='hikeandseek'&&u){accountWarning.classList.remove('hidden');accountWarning.textContent='Signed in as '+(u.email||'an account')+'. Hike & Seek must be submitted by Gaurav, Aanchal or another authorised representative using their own Google account. If this is your personal RoamWise account, choose Switch Google account before submitting.';}
 else accountWarning.classList.add('hidden');
 if(u){api('/treks/admin',null,true).then(()=>{$('adminTab').classList.remove('hidden')}).catch(()=>{});}
 if(u){const email=$('joinForm').elements.email;email.value=u.email||'';
  const bill=$('checkoutForm').elements.email;bill.value=u.email||'';}
 else{$('joinForm').elements.email.value='';$('checkoutForm').elements.email.value='';}
 if(location.search.includes('order_id='))checkReturned();
 joinGate();
 const open=document.querySelector('section.view.active');
 if(open&&open.id==='studio')mine();if(open&&open.id==='review')review();
}
/* Step 1 of joining is signing in: say so plainly instead of letting the form fail. */
function joinGate(){
 const signed=!!state.user,f=$('joinForm');
 $('joinSignIn').classList.toggle('hidden',signed);
 f.querySelector('button[type=submit]').textContent=signed?'Submit for review':'Sign in with Google to submit';
 f.elements.email.readOnly=true;
 for(const n of document.querySelectorAll('.steps li'))n.classList.remove('done');
 if(signed)document.querySelector('.steps li[data-step="1"]')?.classList.add('done');
}
window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if($(id)&&$(id).classList.contains('view'))tab(id)});
function showHikePreview(){
 $('hikeBusinessContact').innerHTML='<strong>Hike &amp; Seek business WhatsApp for bookings &amp; enquiries: <a href="tel:+919286322067">+91 92863 22067</a></strong><p>This is the company booking contact supplied by the RoamWise founder. Enquiries go directly to Hike &amp; Seek; RoamWise does not confirm or collect payment for these invitation-only treks.</p><a class="button" href="'+esc(whatsappLink(HIKE_SEEK_WHATSAPP,'Hike & Seek trekking packages'))+'" target="_blank" rel="noopener noreferrer">WhatsApp Hike &amp; Seek →</a>';
 $('hikePreview').innerHTML=HIKES.map(([title,detail,url])=>'<article class="card"><div class="head"><span class="mini">SOURCE-LINKED CANDIDATE</span><span class="chip">Not onboarded</span></div><h3>'+esc(title)+'</h3><p>'+esc(detail)+'</p><p class="terms">Price, seats, dates and route details to be confirmed by Hike &amp; Seek.</p><p><a class="button" href="'+esc(whatsappLink(HIKE_SEEK_WHATSAPP,title))+'" target="_blank" rel="noopener noreferrer">Enquire on Hike &amp; Seek WhatsApp →</a></p><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">View original listing ↗</a></article>').join('');
}
async function catalog(){
 $('catalog').innerHTML='<p class="muted">Loading approved departures…</p>';
 try{
  const r=await api('/treks/catalog');
  state.items=r.items||[];state.checkoutEnabled=r.checkoutEnabled===true;
  const operatorFilter=new URLSearchParams(location.search).get('operator');
  const displayItems=operatorFilter?state.items.filter(p=>p.provider?.id===operatorFilter):state.items;
  $('discoverTitle').textContent=displayItems.length&&operatorFilter?'Verified departures · '+displayItems[0].provider.name:'Upcoming verified departures';
  $('catalog').innerHTML=displayItems.length?displayItems.map(p=>{
   const photos=[...new Set([...(Array.isArray(p.galleryUrls)?p.galleryUrls:[]),p.imageUrl].filter(u=>typeof u==='string'&&/^https:\/\//i.test(u)))].slice(0,4);
   const image=photos.length?'<div class="trek-photo-strip" aria-label="Real photos provided by the approved operator">'+photos.map((u,i)=>'<img loading="lazy" decoding="async" src="'+esc(u)+'" alt="Operator-provided trek photograph '+(i+1)+' of '+photos.length+'">').join('')+'</div>':'';
   return '<article class="card">'+image+'<div class="head"><span class="mini">'+esc(p.provider.role).toUpperCase()+' · VERIFIED PARTNER</span><span class="chip">'+esc(p.start)+'</span></div><h3>'+esc(p.name)+'</h3><p>'+esc(p.provider.name)+' · '+esc(p.region)+'</p>'+(p.provider.cofounders?'<p class="terms">Founders: '+esc(p.provider.cofounders)+'</p>':'')+(p.provider.instagram?'<p class="terms"><a href="'+esc(p.provider.instagram)+'" target="_blank" rel="noopener noreferrer">Operator Instagram ↗</a></p>':'')+(p.provider.businessWhatsapp?'<p><a class="button" href="'+esc(whatsappLink(p.provider.businessWhatsapp,p.name,p.provider.name))+'" target="_blank" rel="noopener noreferrer">Ask operator on WhatsApp ↗</a></p>':'')+'<p>'+esc(p.duration)+' day(s) · '+esc(p.difficulty||'Difficulty pending')+(p.meetingPoint?' · Meet: '+esc(p.meetingPoint):'')+'</p><div class="price">'+money(p.unitPrice)+' <small>operator rate / '+esc(p.pricingUnit||'person')+'</small></div><p class="terms">RoamWise fee: 1%, max ₹99 per booking. Booking subject to operator confirmation.</p><div class="row">'+(state.checkoutEnabled?'<button type="button" data-checkout="'+esc(p.id)+'">View price &amp; book securely →</button>':'<span class="chip">Direct checkout pending approval</span>')+'<button type="button" class="secondary" data-enquire="'+esc(p.id)+'">Ask operator →</button></div></article>';
  }).join(''):'<div class="card"><h3>No verified departures published yet</h3><p>Applications and draft itineraries are not bookable until an authorised operator and RoamWise complete review.</p><a href="/treks/#discover">Browse the RoamWise Trails network →</a></div>';
  for(const b of $('catalog').querySelectorAll('[data-checkout]'))b.addEventListener('click',()=>checkout(b.dataset.checkout));
  for(const b of $('catalog').querySelectorAll('[data-enquire]'))b.addEventListener('click',()=>enquire(b.dataset.enquire));
  if(!state.deepLinked){
   state.deepLinked=true;
   const queryId=new URLSearchParams(location.search).get('package');
   if(queryId&&state.items.some(p=>p.id===queryId)){checkout(queryId)}
  }
 }catch(e){$('catalog').innerHTML='<p class="notice">Catalog temporarily unavailable: '+esc(e.message)+'</p>'}
}
function toObject(form){return Object.fromEntries(new FormData(form).entries())}
function markFields(form,fields){
 for(const el of form.querySelectorAll('[aria-invalid]'))el.removeAttribute('aria-invalid');
 const first=(fields||[]).map(n=>form.elements[n]).filter(Boolean);
 for(const el of first)el.setAttribute('aria-invalid','true');
 if(first[0]){first[0].scrollIntoView({behavior:'smooth',block:'center'});first[0].focus({preventScroll:true})}
}
async function submitJoin(ev){
 ev.preventDefault();
 if(!state.user){message('Choose your business Google account. The form stays filled in.');await login();return}
 if(!checkLogin())return;
 const form=ev.currentTarget;
 form.elements.phone.value=form.elements.phone.value.replace(/[\s().-]/g,'');
 const b=toObject(form);
 b.consent=!!form.elements.consent.checked;b.showBusinessWhatsapp=!!form.elements.showBusinessWhatsapp.checked;b.showFounderNames=!!form.elements.showFounderNames.checked;
 try{
  const out=await api('/treks/apply',b,true);
  markFields(form,[]);
  message(out.message||'Application sent. Founder review pending.');tab('studio');
  setTimeout(()=>$('nextStep').scrollIntoView({behavior:'smooth',block:'start'}),300);
 }catch(e){markFields(form,e.fields);message(e.message,true)}
}
$('joinForm').addEventListener('submit',submitJoin);
$('joinForm').elements.consent.required=false; // checked by the server, so the reason is explained in words
$('joinForm').elements.phone.removeAttribute('pattern');
$('joinSignInBtn').addEventListener('click',login);
async function mine(){
 if(!state.user){$('studioSummary').textContent='Sign in to view your operator application and add departure packages.';$('mineCards').innerHTML='';return}
 try{
  const d=await api('/treks/mine',null,true);
  state.packages=d.packages||[];
  state.partner=d.partner||null;
  $('studioSummary').innerHTML=d.partner?
   'Organisation: <strong>'+esc(d.partner.name)+'</strong> · <span class="status">'+esc(statusLabel(d.partner.status))+'</span> '+esc(statusHelp(d.partner.status))+
   (d.partner.reviewNote?'<br><strong>Note from RoamWise:</strong> '+esc(d.partner.reviewNote):'')+
   '<br><small>0% commission on your price for your first three years. <a href="#join" data-edit-profile>Edit business details</a></small>':
   'You have not applied yet. Open <strong>Become a partner</strong> and submit your professional details.';
  nextStep(d.partner,state.packages);
  $('mineCards').innerHTML=state.packages.length?state.packages.map(p=>
   '<div class="card"><div class="head"><span class="status">'+esc(statusLabel(p.status))+'</span><span class="mini">'+esc(p.start)+'</span></div><h3>'+esc(p.name)+'</h3><p>'+esc(p.region)+' · '+money(p.unitPrice)+' / '+esc(p.pricingUnit||'person')+'</p><p class="terms">'+esc(statusHelp(p.status))+'</p>'+(p.reviewNote?'<p class="notice">Note from RoamWise: '+esc(p.reviewNote)+'</p>':'')+'<div class="row"><button type="button" class="secondary" data-edit="'+esc(p.id)+'">Edit / resubmit</button><button type="button" class="secondary" data-clone="'+esc(p.id)+'">New batch from this trek</button>'+(['published','pending_review'].includes(p.status)?'<button type="button" class="secondary" data-close="'+esc(p.id)+'">Close departure</button>':'')+'</div></div>').join(''):
   '<div class="card"><h3>Ready for your first package?</h3><p>Create a trip, guided walk, group experience or private transport itinerary. Pricing stays unpublished until approved.</p></div>';
  for(const b of $('mineCards').querySelectorAll('[data-edit]'))b.addEventListener('click',()=>editPackage(b.dataset.edit));
  for(const a of $('studioSummary').querySelectorAll('[data-edit-profile]'))a.addEventListener('click',()=>editProfile(d.partner));
  for(const b of $('mineCards').querySelectorAll('[data-clone]'))b.addEventListener('click',()=>clonePackage(b.dataset.clone));
  for(const b of $('mineCards').querySelectorAll('[data-close]'))b.addEventListener('click',async()=>{
   if(!confirm('Close this trek departure to new customers? Existing paid requests must still be managed. Reopening requires review.'))return;
   b.disabled=true;
   try{const res=await api('/treks/package/close',{packageId:b.dataset.close},true);
    message(res.note||'Departure closed to new enquiries and payment requests.');await mine();await catalog();
   }catch(e){message('Could not close this departure: '+e.message,true);b.disabled=false}
  });
  $('partnerBookingCards').innerHTML=(d.bookings||[]).length?(d.bookings||[]).map(o=>
    '<article class="card"><span class="chip">'+esc(statusLabel(o.state))+'</span><h3>'+esc(o.packageName)+'</h3><p>Departure '+esc(o.departure)+' · '+esc(o.travellers)+' traveller(s)</p><p>Operator booking value '+money(o.operatorTotal)+'</p><p>'+esc(o.guestEmail||'Customer email held privately by RoamWise')+(o.guestPhone?' · '+esc(o.guestPhone):'')+'</p><p>Ref '+esc(o.id)+'</p>'+
    (o.state==='paid_pending_operator_confirmation'?'<div class="row"><button data-op-action="confirm" data-id="'+esc(o.id)+'" type="button">Confirm booking</button><button data-op-action="refund_review" data-id="'+esc(o.id)+'" class="secondary" type="button">Cannot fulfil</button></div>':'<p class="muted">Decision: '+esc(o.operatorDecisionNote||o.state)+'</p>')+'</article>').join(''):
    '<p class="muted">No verified paid bookings for your operator account yet.</p>';
  for(const b of $('partnerBookingCards').querySelectorAll('[data-op-action]'))b.addEventListener('click',async()=>{
    const note=prompt(b.dataset.opAction==='confirm'?'Enter actual reservation/seat confirmation reference (required):':'Explain availability problem and request manual customer refund review:');
    if(!note)return;
    try{await api('/treks/operator/decision',{bookingId:b.dataset.id,action:b.dataset.opAction,note},true);
      message('Decision recorded. No money transferred or refunded automatically.');mine();}
    catch(e){message(e.message,true)}
  });
 }catch(e){$('studioSummary').textContent='Could not load studio: '+e.message}
}
/* One clear next action at the top of the studio. */
function nextStep(partner,packages){
 const box=$('nextStep');if(!box)return;
 const live=packages.filter(p=>p.status==='published'),fixes=packages.filter(p=>p.status==='changes_requested');
 let title,body,label,go;
 if(!partner){title='Step 2 · Tell us about your business';body='It takes about 3 minutes. Your details stay private until you choose to show them.';label='Open the partner form';go=()=>tab('join');}
 else if(partner.status==='changes_requested'){title='RoamWise asked for a few changes';body=partner.reviewNote||'See the note above.';label='Update business details';go=()=>editProfile(partner);}
 else if(fixes.length){title='Update '+fixes[0].name;body=fixes[0].reviewNote||'RoamWise asked for changes to this departure.';label='Edit this departure';go=()=>editPackage(fixes[0].id);}
 else if(!packages.length){title='Step 3 · Add your first departure';body='Date, price, seats, the day-by-day plan, inclusions and your safety plan. You can reuse it for future batches in one tap.';label='Add a departure';go=()=>openPackageForm();}
 else if(partner.status!=='approved'){title='Step 4 · RoamWise is reviewing';body='We check your business and departure, usually within 2 working days, and email '+(partner.email||'you')+'. You can add more departures meanwhile.';label='Add another departure';go=()=>openPackageForm();}
 else if(!live.length){title='Approved · departure in review';body='Your business is approved. We email you the moment your departure goes live.';label='Add another departure';go=()=>openPackageForm();}
 else{title='You are live 🎉';body=live.length+' departure'+(live.length>1?'s':'')+' open to travellers. Share your page; enquiries and paid bookings arrive here and by email.';label='Copy my trek page link';go=()=>$('copyPartnerLink').click();}
 box.innerHTML='<strong>'+esc(title)+'</strong><p>'+esc(body)+'</p><button type="button">'+esc(label)+'</button>';
 box.querySelector('button').addEventListener('click',go);
}
function openPackageForm(){
 const f=$('packageForm');f.reset();f.elements.id.value='';
 $('packageFormTitle').scrollIntoView({behavior:'smooth',block:'start'});
 setTimeout(()=>f.elements.name.focus({preventScroll:true}),400);
}
function editProfile(p){
 if(!p)return;const f=$('joinForm');
 for(const n of ['role','name','region','website','instagram','cofounders','phone','registration','safetyCredentials','vehiclePermit','description','refundPolicy'])if(f.elements[n]&&p[n]!=null)f.elements[n].value=p[n];
 f.elements.showBusinessWhatsapp.checked=!!p.showBusinessWhatsapp;f.elements.showFounderNames.checked=!!p.showFounderNames;
 tab('join');f.scrollIntoView({behavior:'smooth',block:'start'});
 message(p.status==='approved'?'Edit and save. You stay approved and live treks keep selling.':'Update the details and submit again.');
}
function clonePackage(id){
 const p=state.packages.find(x=>x.id===id);if(!p)return;
 const f=$('packageForm');f.reset();
 for(const e of Array.from(f.elements)){if(e.name&&e.name in p&&e.name!=='id'&&e.name!=='start')e.value=e.name==='galleryUrls'&&Array.isArray(p.galleryUrls)?p.galleryUrls.join('\n'):p[e.name];}
 f.elements.id.value='';f.elements.start.value='';
 f.scrollIntoView({behavior:'smooth',block:'center'});
 message('New draft batch copied from '+p.name+'. Set the new date and verify the price, seats, itinerary, permits and safety details. Nothing is published until reviewed.');
}
function editPackage(id){
 const p=state.packages.find(x=>x.id===id);if(!p)return;
 const f=$('packageForm');f.reset(); // Never retain another operator batch's unsaved fields/photos.
 for(const e of Array.from(f.elements)){if(e.name&&e.name in p)e.value=e.name==='galleryUrls'&&Array.isArray(p.galleryUrls)?p.galleryUrls.join('\n'):p[e.name];}
 f.scrollIntoView({behavior:'smooth',block:'center'});message('Editing '+p.name+'. Saving will return it to review.');
}
$('packageForm').addEventListener('submit',async ev=>{
 ev.preventDefault();if(!checkLogin())return;
 const f=ev.currentTarget,b=toObject(f);
 b.unitPrice=Number(b.unitPrice);b.seats=Number(b.seats);b.duration=Number(b.duration);
 try{const d=await api('/treks/package',b,true);markFields(f,[]);
  message(d.wasLive?'Saved. This departure is hidden until RoamWise checks the change (usually same day); we email you when it is live again.':'Saved. RoamWise checks it, usually within 2 working days, and emails you when it is live.');
  f.reset();await mine();$('nextStep').scrollIntoView({behavior:'smooth',block:'start'});}
 catch(e){markFields(f,e.fields);message(e.message,true)}
});
async function review(){
 if(!state.user){$('reviewCards').innerHTML='<p>Sign in as the founder/admin to review.</p>';return}
 try{
  const d=await api('/treks/admin',null,true),rank={pending_review:0,changes_requested:1,approved:2,published:2,paused:3},pending=(d.partners||[]).concat(d.packages||[]).sort((x,y)=>(rank[x.status]??2)-(rank[y.status]??2));
  $('reviewCards').innerHTML=pending.length?pending.map(p=>{
   const isPkg=!!p.ownerUid&&!!p.unitPrice,kind=isPkg?'package':'provider',id=isPkg?p.id:p.ownerUid;
   return '<article class="card"><span class="chip">'+esc(kind==='package'?'Departure':'Operator')+' · '+esc(statusLabel(p.status))+'</span><h3>'+esc(p.name)+'</h3><p>'+esc(p.region||'')+'</p><p>'+esc(isPkg?money(p.unitPrice)+' / '+esc(p.pricingUnit||'person')+' • '+p.start:(p.email||'')+' • '+(p.website||''))+'</p><p>'+esc(isPkg?p.safetyNote||'No safety notes':p.safetyCredentials||'No certificates supplied')+'</p><div class="row"><button data-action="'+(isPkg?'publish':'approve')+'" data-kind="'+kind+'" data-id="'+esc(id)+'">'+(isPkg?'Publish':'Approve')+'</button><button class="secondary" data-action="changes" data-kind="'+kind+'" data-id="'+esc(id)+'">Request changes</button><button class="secondary" data-action="pause" data-kind="'+kind+'" data-id="'+esc(id)+'">Pause</button></div></article>';
  }).join(''):'<p>No submissions yet.</p>';
  $('bookingCards').innerHTML=(d.bookings||[]).length?(d.bookings||[]).map(o=>
   '<article class="card"><span class="status">'+esc(o.state)+'</span><h3>'+esc(o.packageName)+'</h3><p>Departure '+esc(o.departure)+' · '+esc(o.travellers)+' traveller(s)</p><p>'+esc(o.guestEmail)+' · '+esc(o.guestPhone)+'</p><p>Collected '+money(o.amount)+' · operator price '+money(o.operatorTotal)+' · RoamWise fee '+money(o.roamwiseServiceFee)+'</p><p>Reference '+esc(o.id)+'</p>'+(o.state==='paid_pending_operator_confirmation'?'<div class="row"><button type="button" data-bookact="confirm" data-id="'+esc(o.id)+'">Confirm with operator</button><button type="button" class="secondary" data-bookact="refund_review" data-id="'+esc(o.id)+'">Flag refund review</button></div>':'<p class="muted">Operator decision: '+esc(o.operatorDecisionNote||'Not yet recorded')+'</p>')+'</article>').join(''):
   '<p class="muted">No trek bookings recorded.</p>';
  for(const b of $('bookingCards').querySelectorAll('[data-bookact]'))b.addEventListener('click',async()=>{
   const note=prompt(b.dataset.bookact==='confirm'?'Enter written operator confirmation/reference (required):':'Explain why the booking needs manual refund review:');
   if(!note)return;
   try{await api('/treks/admin/action',{kind:'booking',id:b.dataset.id,action:b.dataset.bookact,note},true);message('Decision recorded. No automatic payout or refund was initiated.');review();}
   catch(e){message(e.message,true)}
  });
  for(const b of $('reviewCards').querySelectorAll('[data-action]'))b.addEventListener('click',async()=>{
   let note='';
   if(b.dataset.action==='changes'||b.dataset.action==='pause'){note=prompt(b.dataset.action==='changes'?'What should they change? (they get this by email)':'Reason for pausing (sent to the operator):')||'';if(b.dataset.action==='changes'&&!note)return}
   else if(!confirm('Verify all source details and apply '+b.dataset.action+' to this '+b.dataset.kind+'?'))return;
   try{await api('/treks/admin/action',{kind:b.dataset.kind,id:b.dataset.id,action:b.dataset.action,note},true);message('Done. The operator has been emailed.');review();catalog();}
   catch(e){message(e.message,true)}
  });
 }catch(e){$('reviewCards').innerHTML='<p class="notice">Founder-only review: '+esc(e.message)+'</p>'}
}
$('refreshReview').addEventListener('click',review);
function enquire(id){
 const p=state.items.find(x=>x.id===id);
 if(!p){message('This departure is not available for enquiries.',true);return}
 const el=$('enquiryPanel'),f=$('enquiryForm');f.reset();f.elements.packageId.value=p.id;
 if(state.user?.email)f.elements.email.value=state.user.email;
 $('enquiryTitle').textContent='Ask '+p.provider.name+' about '+p.name;
 el.classList.remove('hidden');el.scrollIntoView({behavior:'smooth',block:'center'});
}
$('closeEnquiry').addEventListener('click',()=>$('enquiryPanel').classList.add('hidden'));
$('enquiryForm').addEventListener('submit',async ev=>{
 ev.preventDefault();
 const f=ev.currentTarget,b=toObject(f);b.consent=f.elements.consent.checked;
 const button=f.querySelector('button[type="submit"]');button.disabled=true;
 try{
  const response=await api('/treks/enquiry',b);
  message('Enquiry saved for the operator. Reference: '+response.reference+' · No payment or reservation made.');
  $('enquiryPanel').classList.add('hidden');
 }catch(e){message('Could not send enquiry: '+e.message,true)}
 finally{button.disabled=false}
});
function checkout(id){
 if(!state.checkoutEnabled){enquire(id);message('Direct payment is not enabled yet. Enquire with the verified operator instead.');return}
 const p=state.items.find(x=>x.id===id);if(!p){message('Departure no longer available.',true);return}
 state.active=p;state.nonce=crypto.randomUUID();
 $('checkoutPanel').classList.remove('hidden');$('checkoutTitle').textContent=p.name+' · '+p.provider.name;
 $('checkoutForm').elements.packageId.value=id;
 $('checkoutSeats').max=Math.min(p.seats,12);
 for(const o of $('checkoutSeats').options)o.disabled=Number(o.value)>p.seats;
 $('checkoutSeats').value='1';refreshQuote();
 $('checkoutPanel').scrollIntoView({behavior:'smooth'});
}
async function refreshQuote(){
 if(!state.active)return;
 const seats=Number($('checkoutSeats').value);
 $('checkoutQuote').textContent='Verifying price…';
 try{
  const r=await api('/treks/quote',{packageId:state.active.id,seats}),q=r.quote;
  $('checkoutQuote').innerHTML='<p><b>'+esc(q.name)+'</b> · '+esc(q.departure)+'</p><p>Operator price: '+money(q.unitPrice)+(q.pricingUnit==='person'?' × '+q.travellers:' / '+esc(q.pricingUnit))+' = '+money(q.operatorTotal)+'</p><p>RoamWise booking/service fee: '+money(q.roamwiseServiceFee)+'</p><p class="price">Total payable: '+money(q.total)+'</p><p class="terms">Package inclusions: '+esc(state.active.includes)+'</p><p class="terms">Exclusions: '+esc(state.active.excludes||'None listed')+'</p><p class="terms">Refund/cancellation: '+esc(state.active.refundPolicy)+'</p><p class="terms">Safety: '+esc(state.active.safetyNote)+'</p>';
  $('payBtn').disabled=false;
 }catch(e){$('checkoutQuote').textContent=e.message;$('payBtn').disabled=true}
}
$('checkoutSeats').addEventListener('change',()=>{state.nonce=crypto.randomUUID();refreshQuote()});
$('closeCheckout').addEventListener('click',()=>$('checkoutPanel').classList.add('hidden'));
$('checkoutForm').addEventListener('submit',async ev=>{
 ev.preventDefault();if(!checkLogin()||!state.active)return;
 const f=ev.currentTarget,b=toObject(f);b.seats=Number(b.seats);b.nonce=state.nonce;
 b.acknowledgePending=f.elements.acknowledgePending.checked;b.agreeTerms=f.elements.agreeTerms.checked;b.shareContactWithOperator=f.elements.shareContactWithOperator.checked;
 $('payBtn').disabled=true;message('Creating secure Cashfree order…');
 try{
  const r=await api('/treks/order',b,true);
  if(!window.Cashfree)throw Error('Cashfree SDK unavailable; keep this order reference: '+r.orderId);
  const gateway=window.Cashfree({mode:r.environment==='production'?'production':'sandbox'});
  message('Redirecting to Cashfree. Reference '+r.orderId);
  await gateway.checkout({paymentSessionId:r.paymentSessionId,redirectTarget:'_self'});
 }catch(e){message(e.message,true);$('payBtn').disabled=false}
});
async function checkReturned(){
 const id=new URLSearchParams(location.search).get('order_id');
 if(!/^rwtrek_[a-f0-9]{32}$/.test(id||'')||!state.user)return;
 try{
  const r=await api('/treks/order/'+id+'/status',null,true);
  message(r.state==='operator_confirmed'?'Operator confirmed your booking. Your reference: '+id:r.state==='refund_review_required'?'Your booking requires refund review; contact support using reference: '+id:r.state==='paid_pending_operator_confirmation'?'Cashfree payment verified. Operator confirmation is pending. Your reference: '+id:
   'Payment not verified yet ('+r.state+'). Do not pay a second time until this reference is checked: '+id);
 }catch(e){message('Could not verify order '+id+'. Contact support before paying again. '+e.message,true)}
}
function invited(){
 const params=new URLSearchParams(location.search);
 if(params.get('invite')==='hikeandseek'){
  const f=$('joinForm');f.elements.role.value='company';f.elements.name.value='Hike & Seek';
  f.elements.website.value='https://hikeandseek.in/';f.elements.region.value='Dehradun, Uttarakhand';
  f.elements.instagram.value='https://www.instagram.com/hike_and__seek/';
  f.elements.cofounders.value='Gaurav Aswal; Aanchal Kandari';
  f.elements.phone.value='+'+HIKE_SEEK_WHATSAPP;
  f.elements.showFounderNames.checked=false;f.elements.showBusinessWhatsapp.checked=false;
  const banner=$('inviteMessage');banner.classList.remove('hidden');
  banner.textContent='Hike & Seek invitation preview. Cofounder names, Instagram and the RoamWise-founder-confirmed business booking WhatsApp are prefilled for an authorised representative to verify or edit. No application is submitted automatically. Public contact display on approved operator pages requires opt-in.';
  tab('join');
 }else if(location.hash){const id=location.hash.slice(1);if($(id)&&$(id).classList.contains('view'))tab(id)}
}
try{
 const cfg=window.RW_PARTNER_CONFIG?.firebase;
 if(!cfg||!window.firebase)throw Error('Firebase configuration unavailable');
 if(!firebase.apps.length)firebase.initializeApp(cfg);
 state.auth=firebase.auth();
 state.auth.getRedirectResult().catch(e=>message(e.message,true));
 state.auth.onAuthStateChanged(signedIn);
}catch(e){message('Sign-in unavailable: '+e.message,true)}
showHikePreview();invited();joinGate();catalog();
})();