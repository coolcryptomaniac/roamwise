import { COLLAB_TIERS, assessTrust, normalizeMatchProfile, recommendTier } from './match-core.mjs';
import { SEED_POLICIES, mergePolicies, termsText, barterOfferFromPolicy } from './property-terms-core.mjs';
import { recommendDeal } from './rate-guide-core.mjs';
import { PLACES, resolveLocation, proximity, termsFit, creatorQuality, normalizeCreatorAsk, offerText, mapsLink, directionsLink, waLink } from './local-barter-core.mjs';

const CFG={apiKey:'AIzaSyDlrtpzpOb1VEmVSd9tHmu7OpmvwWosYsU',authDomain:'roamwisepro.firebaseapp.com',projectId:'roamwisepro',storageBucket:'roamwisepro.firebasestorage.app',messagingSenderId:'299014744987',appId:'1:299014744987:web:d5c316743e6d7a10904f3e'};
try { if (!firebase.apps.length) firebase.initializeApp(CFG); } catch (_) {}
const db = (() => { try { return firebase.firestore(); } catch (_) { return null; } })();
const auth = (() => { try { return firebase.auth(); } catch (_) { return null; } })();
const $ = selector => document.querySelector(selector);
let role = new URLSearchParams(location.search).get('role') === 'property' ? 'property' : 'creator';

function esc(value){return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function values(name){return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);}
function message(text,bad=false){$('#mmMessage').innerHTML=`<div class="mm-message${bad?' bad':''}">${esc(text)}</div>`;}
function setRole(next){role=next;document.querySelectorAll('[data-role]').forEach(button=>button.classList.toggle('on',button.dataset.role===role));$('#creatorFields').hidden=role!=='creator';$('#propertyFields').hidden=role!=='property';if($('#appPromo'))$('#appPromo').hidden=role!=='creator';$('#profileLabel').textContent=role==='creator'?'Instagram, YouTube or portfolio link':'Website, Google Maps or Instagram link';$('#whereLabel').textContent=role==='creator'?'Where are you based?':'Where is the property?';$('#mmSubmit').textContent=role==='creator'?'Join creator matching →':'Continue property onboarding →';history.replaceState({},'',`${location.pathname}?role=${role}${new URLSearchParams(location.search).get('invite')?'&invite=founding':''}`);}

function profile(){
  return normalizeMatchProfile({
    role, dealModes:values('deal'), niches:$('#mmNiches').value, destinations:$('#mmDestinations').value,
    platforms:role==='creator'?['instagram','youtube']:['instagram'], services:role==='creator'?$('#mmServices').value:'reel,stories,ugc',
    profileUrl:$('#mmProfile').value, minimumCash:role==='creator'?$('#mmMinimum').value:0,
    maximumCash:role==='property'?$('#mmMaximum').value:0, hostedNights:role==='property'?$('#mmNights').value:0,
    mealsIncluded:role==='property'&&$('#mmOfferFood').value!=='none', travelIncluded:role==='property'&&$('#mmOfferTravel').value==='full',
    newOpening:role==='property'&&$('#mmOpening').checked, accountAgeDays:role==='creator'?$('#mmAge').value:365,
    claimedFollowers:role==='creator'?$('#mmFollowers').value:0, autopilot:$('#mmAutopilot').checked
  },role);
}

/* Location, stay ask and real numbers for local-first barter matching (see local-barter-core.mjs). */
let pinned=null;
const DESK_WA=()=>String(window.RW_CONFIG&&window.RW_CONFIG.creatorDeskWhatsapp||'919987379730');
const n=id=>{const v=Number($(id)&&$(id).value);return Number.isFinite(v)&&v>=0?v:0;};
function where(){const town=$('#mmTown').value.trim();const loc=resolveLocation(pinned?{town,lat:pinned.lat,lng:pinned.lng}:{town});return {town:loc.town||town.toLowerCase(),lat:loc.lat,lng:loc.lng,state:loc.state,country:loc.country,known:loc.known,source:loc.source};}
function barterExtras(){
  if(role==='creator')return {location:where(),ask:normalizeCreatorAsk({guests:n('#mmGuests'),nights:n('#mmAskNights'),food:$('#mmFood').value,travel:$('#mmTravelNeed').checked,cashMin:n('#mmMinimum'),negotiable:$('#mmNegotiable').checked}),metrics:{followers:n('#mmFollowers'),avgViews:n('#mmViews'),engagementPct:n('#mmEngagement'),postsLast30d:n('#mmPosts'),audienceLocalPct:n('#mmLocalPct'),accountAgeDays:n('#mmAge'),metricsVerified:false}};
  return {location:where(),offer:{guests:n('#mmOfferGuests'),nights:n('#mmNights')||1,food:$('#mmOfferFood').value,travel:$('#mmOfferTravel').value,cashMax:n('#mmMaximum')}};
}
function locate(){
  const status=$('#mmLocStatus');if(!navigator.geolocation){status.textContent='Location is not available here: type your town instead.';return;}
  status.textContent='Finding you…';
  navigator.geolocation.getCurrentPosition(pos=>{pinned={lat:Math.round(pos.coords.latitude*1e4)/1e4,lng:Math.round(pos.coords.longitude*1e4)/1e4};status.innerHTML=`Pinned · <a href="${esc(mapsLink(pinned))}" target="_blank" rel="noopener">see on Google Maps</a>`;renderOpenNow();},()=>{status.textContent='Could not get your location: type your town instead.';},{enableHighAccuracy:false,timeout:10000,maximumAge:600000});
}
function nearCards(extras,rows){
  const q=creatorQuality(extras.metrics),name=$('#mmName').value.trim(),handle=$('#mmProfile').value.trim();
  const cards=rows.map(p=>{
    const offer=barterOfferFromPolicy(p),prox=proximity(extras.location,offer.location),fit=termsFit(extras.ask,offer.offer,prox.tier);
    const ask=extras.ask,todo=fit.lines.filter(l=>l.status!=='ok').map(l=>l.text.replace(/^Creator asks /,'You asked for ').replace(/^Creator wants /,'You want ').replace(/; offer is /,'; the offer is '));
    const text=[`Hi RoamWise, I would like the creator stay at ${p.name}.`,`Me: ${name||'creator'} · ${handle}`,`Based in ${(extras.location.town||'not set').replace(/\b[a-z]/g,m=>m.toUpperCase())}${prox.km!=null?` (about ${prox.roadKm} km by road)`:''}`,`Numbers: ${extras.metrics.followers?extras.metrics.followers.toLocaleString('en-IN')+' followers':''}${q.engagementPct?' · '+q.engagementPct+'% engagement':''}${extras.metrics.avgViews?' · '+extras.metrics.avgViews.toLocaleString('en-IN')+' avg Reel views':''}`,`My ask: stay for ${ask.guests}, ${ask.nights} night${ask.nights>1?'s':''}, ${ask.food==='all'?'all meals':ask.food==='breakfast'?'breakfast':'no meals'}${ask.travel?', travel paid':''}${ask.cashMin?', ₹'+ask.cashMin.toLocaleString('en-IN')+' cash':''}${ask.negotiable?' (open to talk)':''}`,'Dates I can do: '].join('\n');
    const dir=directionsLink(extras.location,offer.location);
    return `<article class="mm-near-card"><div class="mm-badges"><span class="mm-badge ${prox.tier}">${esc(prox.label)}${prox.km!=null?` · ~${prox.roadKm} km by road`:''}</span><span class="mm-badge ${fit.fit}">${fit.fit==='ready'?'Terms match':fit.fit==='negotiate'?'Talk terms':'Does not fit'}</span></div><h3>${esc(p.name)}</h3>${(()=>{const rec=recommendDeal({followers:extras.metrics.followers,grade:q.grade,pkg:offer.package,offer:offer.offer,roomRate:offer.roomRate,cashBudget:offer.cashBudget});return offer.roomRate?`<p class="mm-hint">Fair for your level: ₹${rec.fair.low.toLocaleString('en-IN')}–₹${rec.fair.high.toLocaleString('en-IN')} · this stay is worth about ₹${rec.value.total.toLocaleString('en-IN')}${rec.verdict==='hybrid'?` · the property can add ₹${rec.topUp.toLocaleString('en-IN')}`:''}</p>`:''})()}${offer.instantAccept&&fit.fit==='ready'?'<p class="mm-hint"><b>Pre-agreed by the property:</b> say yes with dates and it is confirmed.</p>':''}<p>${esc(offerText(offer.offer))}${offer.contingentCashUpTo?` Plus up to ₹${offer.contingentCashUpTo.toLocaleString('en-IN')} if guests you bring book and stay.`:''}</p>${todo.length?`<ul>${todo.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}<div class="mm-near-actions">${fit.fit!=='no_fit'?`<a class="wa" target="_blank" rel="noopener" href="${esc(waLink(DESK_WA(),text))}">${fit.fit==='ready'?'Lock this on WhatsApp':'Talk terms on WhatsApp'}</a>`:''}${dir?`<a target="_blank" rel="noopener" href="${esc(dir)}">Route on Google Maps</a>`:''}</div></article>`;
  });
  return `<p class="mm-hint">Your grade: <b>${q.grade}</b> (${q.score}/100, self-reported until RoamWise checks your Insights).${q.why.length?' '+esc(q.why.join(', ').replace('for their size','for your size').replace(/^./,m=>m.toUpperCase()))+'.':''}</p><div class="mm-near">${cards.join('')||'<p>No open stays yet. We will message you when one opens near you.</p>'}</div>`;
}
async function openPolicies(){
  let override=[];
  try{if(db){const d=await db.collection('config').doc('creatorPolicies').get();if(d.exists&&Array.isArray((d.data()||{}).list))override=d.data().list;}}catch(_){}
  return mergePolicies(SEED_POLICIES,override);
}
async function renderNearYou(extras){
  const all=(await openPolicies()).filter(p=>p.status==='open');
  const rows=all.map(p=>({p,km:proximity(extras.location,barterOfferFromPolicy(p).location).km})).sort((a,b)=>(a.km??1e9)-(b.km??1e9)).map(x=>x.p);
  $('#nearYou').hidden=false;$('#nearYouList').innerHTML=nearCards(extras,rows);
}

function tierCards(){
  $('#tierCards').innerHTML=COLLAB_TIERS.map(tier=>`<article class="mm-tier"><span class="mm-kicker">${esc(tier.id.toUpperCase())}</span><b>${esc(tier.label)}</b><strong>${tier.cashMax===0?'₹0 cash · hosted value':tier.id==='custom'?'Open terms':`₹${tier.cashMin.toLocaleString('en-IN')}–₹${tier.cashMax.toLocaleString('en-IN')}`}</strong><p>${esc(tier.summary)}</p></article>`).join('');
}

function resultCard(data){
  const trust=assessTrust(data),counterpart=role==='creator'?normalizeMatchProfile({role:'property',dealModes:['barter','hybrid'],niches:data.niches,destinations:data.destinations,profileUrl:'https://roamwise.co.in/partner/',hostedNights:2,mealsIncluded:true,maximumCash:5000,accountAgeDays:365},'property'):normalizeMatchProfile({role:'creator',dealModes:['barter','hybrid'],niches:data.niches,destinations:data.destinations,platforms:data.platforms,services:['reel','stories'],profileUrl:'https://instagram.com/roamwise',accountAgeDays:365},'creator');
  const tier=role==='creator'?recommendTier(counterpart,data):recommendTier(data,counterpart);
  const score=Math.max(58,92-trust.riskScore);
  const review=trust.requiresManualReview?'Manual review before any introduction':'Eligible for automatic shortlisting after verification';
  const firstTasks=role==='creator'
    ? ['Confirm ownership of your main profile','Add 2 recent examples in Creator Studio','Set dates and destinations you can travel','Approve the exact brief before work starts']
    : ['Finish property and manager verification','Add room, meal and travel inclusions','Choose dates and content deliverables','Approve the exact brief before hosting'];
  $('#matchResult').hidden=false;
  $('#matchResult').innerHTML=`<div class="mm-result-grid"><div><span class="mm-kicker">MATCH READINESS</span><div class="mm-score">${score}%</div><h2>${esc(tier.label)}</h2><p>${esc(tier.summary)}</p></div><div><span class="mm-kicker">NEXT CHECKS</span><h2>${esc(review)}</h2><ul>${trust.checks.slice(0,4).map(item=>`<li>${esc(item)}</li>`).join('')}</ul></div><div><span class="mm-kicker">YOUR FIRST 4 TASKS</span><h2>${role==='creator'?'Creator launch checklist':'Property launch checklist'}</h2><ol>${firstTasks.map(item=>`<li>${esc(item)}</li>`).join('')}</ol></div></div><div class="mm-next"><button id="resultShare">Share this onboarding link</button><a href="${role==='creator'?'dashboard.html':'../partner/join/'}">${role==='creator'?'Open Creator Studio':'Finish verified property setup'} →</a></div>`;
  $('#resultShare').onclick=shareInvite;
  $('#matchResult').scrollIntoView({behavior:'smooth',block:'center'});
}

async function submitCreator(data){
  const name=$('#mmName').value.trim(),email=$('#mmEmail').value.trim(),phone=$('#mmPhone').value.trim();
  const extras=barterExtras();
  const appPromo=(document.querySelector('input[name="appPromo"]:checked')||{}).value||'none';
  const record={seg:'creator',name,email,handle:data.profileUrl,phone:phone.slice(0,24),barter:extras,appPromo,reach:'Prefer not to say',niche:data.niches.join(', '),note:`Match network application. App promo: ${appPromo}. Based in: ${extras.location.town||'not set'}. Destinations: ${data.destinations.join(', ')||'open'}. Modes: ${data.dealModes.join(', ')}. Services: ${data.services.join(', ')}. WhatsApp: ${phone||'not supplied'}. Autopilot: ${data.autopilot?'yes':'no'}.`,creatorMinimum:data.minimumCash,reelRate:0,storyPackageRate:0,creatorServices:data.services,acceptsBarter:data.dealModes.includes('barter'),consent:true,source:'creators page (inbound)',stage:'new',tier:'applied',refSales:0,refRevenue:0,code:'',matchProfile:data,createdAt:new Date().toISOString()};
  if(!db)throw Error('offline');
  await db.collection('crm').add(record);
}

async function saveVerifiedProfile(data){
  const base=String(window.RW_CONFIG&&window.RW_CONFIG.creatorProtectionUrl||'').replace(/\/+$/,'');
  const user=auth&&auth.currentUser;if(!base||!user||!user.emailVerified)return null;
  const response=await fetch(base+'/v1/creator-protection/match-profile',{method:'POST',headers:{authorization:'Bearer '+await user.getIdToken(),'content-type':'application/json'},body:JSON.stringify(data)});
  if(!response.ok)return null;return response.json();
}

function propertyDraft(data){
  sessionStorage.setItem('rwMatchDraft',JSON.stringify({ownerName:$('#mmName').value.trim(),propertyName:$('#mmPropertyName').value.trim(),email:$('#mmEmail').value.trim(),phone:$('#mmPhone').value.trim(),website:data.profileUrl,city:data.destinations[0]||'',destinations:data.destinations,niches:data.niches,matchProfile:data,barter:barterExtras()}));
}

$('#matchForm').addEventListener('submit',async event=>{
  event.preventDefault();message('');
  const name=$('#mmName').value.trim(),email=$('#mmEmail').value.trim(),url=$('#mmProfile').value.trim();
  if(name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return message('Add your name and a valid email.',true);
  if(role==='property'&&$('#mmPropertyName').value.trim().length<3)return message('Add the property name.',true);
  if(!/^https:\/\//i.test(url))return message('Paste a public https:// profile, property, Maps or portfolio link.',true);
  if(!$('#mmConsent').checked)return message('Please accept the contact consent.',true);
  const data=profile(),button=$('#mmSubmit');if(role==='creator')renderNearYou(barterExtras()).catch(()=>{});button.disabled=true;button.textContent='Saving…';
  try{
    if(role==='creator'){await submitCreator(data);await saveVerifiedProfile(data).catch(()=>null);message('Creator profile received. RoamWise will verify it before sending matches.');resultCard(data);}
    else{propertyDraft(data);await saveVerifiedProfile(data).catch(()=>null);message('Preferences saved on this device. Finish the verified property application next.');resultCard(data);setTimeout(()=>{location.href='../partner/join/?source=creator-match';},2200);}
  }catch(error){
    message('Could not save online. Opening an email fallback with the same details…',true);
    const body=`RoamWise ${role} match application\n\nName: ${name}\nEmail: ${email}\nProfile: ${url}\nModes: ${data.dealModes.join(', ')}\nDestinations: ${data.destinations.join(', ')}`;
    setTimeout(()=>{location.href=`mailto:founder@roamwise.co.in?subject=${encodeURIComponent('RoamWise match application')}&body=${encodeURIComponent(body)}`;},700);
  }finally{button.disabled=false;setRole(role);}
});

const inviteUrl=()=>`${location.origin}/creators/match.html?role=creator&invite=founding`;
async function shareInvite(){const url=inviteUrl(),text='Join the RoamWise verified creator × stay matching network. Barter, hybrid or paid—you choose.';try{if(navigator.share)await navigator.share({title:'RoamWise creator invite',text,url});else{await navigator.clipboard.writeText(url);message('Invite link copied.');}}catch(_){} }
$('#shareNative').onclick=shareInvite;$('#copyInvite').onclick=shareInvite;$('#shareWhatsApp').href=`https://wa.me/?text=${encodeURIComponent('Join the RoamWise creator × stay matching network: '+inviteUrl())}`;$('#shareEmail').href=`mailto:?subject=${encodeURIComponent('RoamWise creator invite')}&body=${encodeURIComponent('Join here: '+inviteUrl())}`;
document.querySelectorAll('[data-role]').forEach(button=>button.onclick=()=>setRole(button.dataset.role));
if(new URLSearchParams(location.search).get('invite'))$('#inviteLabel').textContent='FOUNDING CREATOR INVITATION · LIMITED PILOT';
tierCards();setRole(role);

/* Which properties take creators right now. Seed terms ship with the page; an admin can override them in Firestore config/creatorPolicies. */
async function renderOpenNow(){
  const host=$('#openNowList');if(!host)return;
  const rows=await openPolicies(),me=where();
  const label={open:'Open',pending:'Coming soon',closed:'Not right now'};
  const dist=p=>{const loc=barterOfferFromPolicy(p).location;return me.known?proximity(me,loc):null;};
  const sorted=rows.map(p=>({p,d:dist(p)})).sort((a,b)=>(a.p.status==='open'?0:1)-(b.p.status==='open'?0:1)||((a.d&&a.d.km)??1e9)-((b.d&&b.d.km)??1e9));
  host.innerHTML=sorted.map(({p,d})=>{const loc=barterOfferFromPolicy(p).location,map=mapsLink(loc.lat!=null?loc:(p.location.town||''));return`<article class="mm-tier"><span class="mm-kicker">${esc(label[p.status]||'').toUpperCase()}${d&&d.km!=null?' · ~'+d.roadKm+' KM FROM YOU':''}</span><b>${esc(p.name||p.propertyId)}</b><p>${p.status==='open'?esc(termsText(p)):p.status==='pending'?'We are confirming creator terms with the owner. Apply and we will tell you when they open.':'This property is not taking creator collaborations right now.'}</p>${p.location.town&&map?`<p><a href="${esc(map)}" target="_blank" rel="noopener">📍 ${esc(p.location.town)} on Google Maps</a></p>`:''}</article>`;}).join('')||'<p>No properties are open to creators yet.</p>';
}
renderOpenNow();
$('#mmLocate').onclick=locate;
$('#mmTown').addEventListener('change',()=>{pinned=null;$('#mmLocStatus').textContent='Only used to find stays near you.';renderOpenNow();});
$('#mmTowns').innerHTML=Object.keys(PLACES).map(t=>`<option value="${esc(t.replace(/\b[a-z]/g,m=>m.toUpperCase()))}">`).join('');
