/* RoamWise Trails · lean partner growth and itinerary toolkit.
   Deterministic templates, not fabricated AI or invented real-world trip facts. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const API='https://roamwise-api.founder-f53.workers.dev';
const form=$('packageForm');
if(!form)return;
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>Number(v||0).toLocaleString('en-IN');
const field=n=>String(form.elements[n]?.value||'').trim();
const link=id=>'https://roamwise.co.in/treks/'+(id?'?package='+encodeURIComponent(id)+'#discover':'#discover');
let packages=[],bookings=[],enquiries=[],generated='',selected=null;
function stats(){
 $('statPackages').textContent=packages.length;
 $('statLive').textContent=packages.filter(p=>p.status==='published').length;
 $('statBookings').textContent=bookings.length;
 $('statEnquiries').textContent=enquiries.length;
}
async function api(path){
 const user=window.firebase?.auth?.().currentUser;
 if(!user)return null;
 const token=await user.getIdToken();
 const r=await fetch(API+path,{headers:{authorization:'Bearer '+token}});
 if(!r.ok)throw Error('Could not load partner records ('+r.status+')');
 return r.json();
}
async function load(){
 try{
  const user=window.firebase?.auth?.().currentUser;
  if(!user){packages=[];bookings=[];enquiries=[];stats();return}
  const d=await api('/treks/mine');
  packages=d?.packages||[];bookings=d?.bookings||[];stats();
  if(packages.length&&!selected)selected=packages.find(p=>p.status==='published')||packages[0];
  const owner=d?.partner;
  if(owner?.status==='approved'){
   try{const q=await api('/treks/enquiries');enquiries=q?.items||[];}
   catch(_){enquiries=[];}
  }else enquiries=[];
  stats();renderEnquiries();
 }catch(e){$('promotionOutput').textContent=e.message}
}
function renderEnquiries(){
 const box=$('enquiryCards');
 box.replaceChildren();
 if(!enquiries.length){const p=document.createElement('p');p.className='muted';p.textContent='No customer enquiries yet. Only verified operator packages can receive enquiries.';box.appendChild(p);return}
 for(const q of enquiries.slice(0,30)){
  const card=document.createElement('article');card.className='card';
  const title=document.createElement('h3');title.textContent=q.packageName||'Trek enquiry';card.appendChild(title);
  const desc=document.createElement('p');
  desc.textContent=(q.name||'Traveller')+' · '+(q.message||'Request for details')+' · '+(q.createdAt||'');
  card.appendChild(desc);
  const contact=document.createElement('p');
  contact.textContent='Email: '+(q.email||'Not provided')+(q.phone?' · Phone: '+q.phone:'');
  card.appendChild(contact);box.appendChild(card);
 }
}
function build(){
 const name=field('name')||'Your upcoming trek';
 const start=field('start')||'Date to be confirmed';
 const duration=Number(field('duration'))||0;
 const detail=field('itinerary').split(/\n+/).map(x=>x.trim()).filter(Boolean);
 const lines=[
  '🏔️ '+name.toUpperCase(),'ROAMWISE TRAILS · OPERATOR DRAFT',
  'Departure: '+start+' · Duration: '+(duration||'Pending')+' days',
  'Pickup / assembly: '+(field('meetingPoint')||field('region')||'To be confirmed'),
  'Difficulty: '+(field('difficulty')||'Pending operator confirmation'),
  'Highest point: '+(field('altitude')||'Pending operator confirmation'),
  'Operator price: '+(field('unitPrice')?'₹'+fmt(field('unitPrice'))+' per '+(field('pricingUnit')||'person'):'Pending operator confirmation'),
  'Seats: '+(field('seats')||'Pending operator confirmation'),
  'Minimum group: '+(field('minGroupSize')||'Not specified'),'',
  'DAY-BY-DAY PLAN'
 ];
 if(detail.length)lines.push(...detail);
 else lines.push('Add your exact day-wise route, expected timings and stops in the package form. These details must be operator-confirmed.');
 lines.push('','INCLUDED\n'+(field('includes')||'Awaiting operator details'),
   'NOT INCLUDED\n'+(field('excludes')||'Awaiting operator details'),
   'PACKING AND FITNESS\n'+(field('packingList')||'Confirm required gear and fitness with operator'),
   'SAFETY AND PERMITS\n'+(field('safetyNote')||'Pending operator confirmation'),
   'CANCELLATION / REFUND\n'+(field('refundPolicy')||'Pending operator confirmation'),'',
   'All availability, pricing, route conditions and permit requirements are subject to operator review. No trek is confirmed until the operator accepts the booking.');
 return lines.join('\n');
}
function make(){
 generated=build();$('posterTitle').textContent=field('name')||'Your upcoming batch';$('itineraryOutput').textContent=generated;
 const url=field('imageUrl');
 if(/^https:\/\//.test(url)){$('posterPhoto').src=url;$('posterPhoto').alt='Operator-supplied trek image (use only with permission)';}
 $('itineraryPoster').scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function copy(text){
 if(!text)return;
 try{await navigator.clipboard.writeText(text);$('promotionOutput').textContent='Copied to clipboard. Review details before sending.'}
 catch(_){
  const textarea=document.createElement('textarea');textarea.value=text;textarea.style.cssText='position:fixed;left:0;top:0;z-index:9999;opacity:.01';
  document.body.appendChild(textarea);textarea.focus();textarea.select();
  let ok=false;try{ok=document.execCommand('copy')}catch(_){}
  textarea.remove();$('promotionOutput').textContent=ok?'Copied. Review before sharing.':'Select and copy this text manually:\n'+text;
 }
}
function share(kind){
 const p=packages.find(x=>x.status==='published')||packages[0]||null;
 selected=p;
 if(!p){$('promotionOutput').textContent='Save your first departure before creating a promotion.';return}
 const url=link(p.status==='published'?p.id:null);
 const price=p.unitPrice?'₹'+fmt(p.unitPrice)+' per '+(p.pricingUnit||'person'):'Price pending';
 const status=p.status==='published'?'View approved departure and booking options: ':'Application still under review; explore our trek platform: ';
 const caption=kind==='instagram'?
   '🥾 '+p.name+' | '+p.region+'\n📅 '+p.start+' · '+p.duration+' days\n💰 Operator rate: '+price+'\n'+'Included: '+(p.includes||'Ask us for details')+'\n'+status+url+'\n#RoamWise #HimalayanTreks':
   '🏔️ Upcoming trek: '+p.name+'\nDate: '+p.start+'\nMeeting point: '+(p.meetingPoint||p.region)+'\n'+price+'\nIncluded: '+(p.includes||'See itinerary')+'\n'+status+url;
 $('promotionOutput').textContent=caption;copy(caption);
}
$('makeItinerary').addEventListener('click',make);
$('copyItinerary').addEventListener('click',()=>copy(generated||build()));
$('copyPartnerLink').addEventListener('click',()=>copy(link()));
$('copyPromo').addEventListener('click',()=>share('whatsapp'));
$('copyCaption').addEventListener('click',()=>share('instagram'));
$('printItinerary').addEventListener('click',()=>{
 if(!generated)make();
 const title=field('name')||'Trek itinerary';
 const out='<html><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>body{margin:32px auto;max-width:760px;padding:0 25px;background:#fff;color:#211c2e;font:15px/1.6 system-ui}h1{color:#653c6a}pre{white-space:pre-wrap;word-wrap:break-word;font:14px/1.6 system-ui}small{color:#666}@media print{body{margin:10mm auto}}</style></head><body><h1>'+esc(title)+'</h1><small>RoamWise Trails · operator-submitted draft. Verify all facts and availability before distribution.</small><pre>'+esc(generated)+'</pre><p><small>Generated from the operator’s own batch details; not an independently verified itinerary.</small></p></body></html>';
 const blob=new Blob([out],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob);
 const win=window.open(url,'_blank','noopener,noreferrer');
 if(!win){const a=document.createElement('a');a.href=url;a.download='roamwise-trek-itinerary.html';a.click();$('promotionOutput').textContent='Pop-up blocked: an editable itinerary HTML file was saved. Open it and Print → Save as PDF.';}
 else $('promotionOutput').textContent='Itinerary opened in a new tab. Use Print → Save as PDF.';
 setTimeout(()=>URL.revokeObjectURL(url),60000);
});
if(window.firebase?.auth)window.firebase.auth().onAuthStateChanged(load);
document.addEventListener('click',e=>{
 const t=e.target;
 if(t instanceof Element && t.closest('[data-tab="studio"]'))setTimeout(load,250);
 if(t instanceof Element && t.closest('#packageForm button[type="submit"]'))setTimeout(load,1800);
});
})();