import { COLLAB_TIERS, assessTrust, normalizeMatchProfile, recommendTier } from './match-core.mjs';

const CFG={apiKey:'AIzaSyBTfmJvHTmp0mNQqsIhWEwnLLwFKz0ExYQ',authDomain:'roamwisepro.firebaseapp.com',projectId:'roamwisepro',storageBucket:'roamwisepro.firebasestorage.app',messagingSenderId:'1039880917656',appId:'1:1039880917656:web:8b3e18e8a4b1c9f8e2c0d1'};
try { if (!firebase.apps.length) firebase.initializeApp(CFG); } catch (_) {}
const db = (() => { try { return firebase.firestore(); } catch (_) { return null; } })();
const auth = (() => { try { return firebase.auth(); } catch (_) { return null; } })();
const $ = selector => document.querySelector(selector);
let role = new URLSearchParams(location.search).get('role') === 'property' ? 'property' : 'creator';

function esc(value){return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function values(name){return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);}
function message(text,bad=false){$('#mmMessage').innerHTML=`<div class="mm-message${bad?' bad':''}">${esc(text)}</div>`;}
function setRole(next){role=next;document.querySelectorAll('[data-role]').forEach(button=>button.classList.toggle('on',button.dataset.role===role));$('#creatorFields').hidden=role!=='creator';$('#propertyFields').hidden=role!=='property';$('#profileLabel').textContent=role==='creator'?'Instagram, YouTube or portfolio link':'Website, Google Maps or Instagram link';$('#mmSubmit').textContent=role==='creator'?'Join creator matching →':'Continue property onboarding →';history.replaceState({},'',`${location.pathname}?role=${role}${new URLSearchParams(location.search).get('invite')?'&invite=founding':''}`);}

function profile(){
  return normalizeMatchProfile({
    role, dealModes:values('deal'), niches:$('#mmNiches').value, destinations:$('#mmDestinations').value,
    platforms:role==='creator'?['instagram','youtube']:['instagram'], services:role==='creator'?$('#mmServices').value:'reel,stories,ugc',
    profileUrl:$('#mmProfile').value, minimumCash:role==='creator'?$('#mmMinimum').value:0,
    maximumCash:role==='property'?$('#mmMaximum').value:0, hostedNights:role==='property'?$('#mmNights').value:0,
    mealsIncluded:role==='property'&&$('#mmMeals').checked, travelIncluded:role==='property'&&$('#mmTravel').checked,
    newOpening:role==='property'&&$('#mmOpening').checked, accountAgeDays:role==='creator'?$('#mmAge').value:365,
    claimedFollowers:role==='creator'?$('#mmFollowers').value:0, autopilot:$('#mmAutopilot').checked
  },role);
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
  const record={seg:'creator',name,email,handle:data.profileUrl,reach:'Prefer not to say',niche:data.niches.join(', '),note:`Match network application. Destinations: ${data.destinations.join(', ')||'open'}. Modes: ${data.dealModes.join(', ')}. Services: ${data.services.join(', ')}. WhatsApp: ${phone||'not supplied'}. Autopilot: ${data.autopilot?'yes':'no'}.`,creatorMinimum:data.minimumCash,reelRate:0,storyPackageRate:0,creatorServices:data.services,acceptsBarter:data.dealModes.includes('barter'),consent:true,source:'creators page (inbound)',stage:'new',tier:'applied',refSales:0,refRevenue:0,code:'',matchProfile:data,createdAt:new Date().toISOString()};
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
  sessionStorage.setItem('rwMatchDraft',JSON.stringify({ownerName:$('#mmName').value.trim(),propertyName:$('#mmPropertyName').value.trim(),email:$('#mmEmail').value.trim(),phone:$('#mmPhone').value.trim(),website:data.profileUrl,city:data.destinations[0]||'',destinations:data.destinations,niches:data.niches,matchProfile:data}));
}

$('#matchForm').addEventListener('submit',async event=>{
  event.preventDefault();message('');
  const name=$('#mmName').value.trim(),email=$('#mmEmail').value.trim(),url=$('#mmProfile').value.trim();
  if(name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return message('Add your name and a valid email.',true);
  if(role==='property'&&$('#mmPropertyName').value.trim().length<3)return message('Add the property name.',true);
  if(!/^https:\/\//i.test(url))return message('Paste a public https:// profile, property, Maps or portfolio link.',true);
  if(!$('#mmConsent').checked)return message('Please accept the contact consent.',true);
  const data=profile(),button=$('#mmSubmit');button.disabled=true;button.textContent='Saving…';
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
