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
let packages=[],bookings=[],enquiries=[],generated='',selected=null,currentOwner=null;
function readiness(){
 const box=$('readinessChecklist');if(!box)return;
 const p=packages.find(x=>x.status==='published')||packages[0];
 const checks=[
  ['Business application submitted',!!currentOwner],
  ['Operator approved by RoamWise',currentOwner?.status==='approved'],
  ['Upcoming departure set',!!p&&/^\d{4}-\d{2}-\d{2}$/.test(p.start||'')&&Date.parse(p.start+'T00:00:00Z')>Date.now()],
  ['Trek photograph URL supplied (rights to verify)',!!p&&Boolean(p.imageUrl||(Array.isArray(p.galleryUrls)&&p.galleryUrls.length))],
  ['Clear pickup, inclusions and exclusions',!!p&&Boolean(p.meetingPoint&&p.includes&&p.excludes)],
  ['Safety, packing and cancellation details',!!p&&Boolean(p.safetyNote&&p.packingList&&p.refundPolicy)],
  ['Trek reviewed and publicly published',!!p&&p.status==='published']
 ];
 box.replaceChildren();
 const title=document.createElement('strong');title.textContent='Listing readiness · '+checks.filter(x=>x[1]).length+'/'+checks.length;box.appendChild(title);
 const ul=document.createElement('ul');ul.style.cssText='margin:10px 0 0;padding-left:19px';
 for(const [label,ok] of checks){const li=document.createElement('li');li.textContent=(ok?'✓ ':'○ ')+label;ul.appendChild(li)}
 box.appendChild(ul);
 const foot=document.createElement('p');foot.className='terms';foot.textContent='Readiness helps operators improve presentation; it is not a safety certification, rating or promise of sales.';box.appendChild(foot);
}
function stats(){
 $('statPackages').textContent=packages.length;
 $('statLive').textContent=packages.filter(p=>p.status==='published').length;
 $('statBookings').textContent=bookings.length;
 $('statEnquiries').textContent=enquiries.filter(q=>q.status==='new').length;
}
async function api(path,body){
 const user=window.firebase?.auth?.().currentUser;
 if(!user)return null;
 const token=await user.getIdToken();
 const r=await fetch(API+path,{method:body?'POST':'GET',headers:{authorization:'Bearer '+token,...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 if(!r.ok)throw Error('Could not load partner records ('+r.status+')');
 return r.json();
}
async function load(){
 try{
  const user=window.firebase?.auth?.().currentUser;
  if(!user){packages=[];bookings=[];enquiries=[];currentOwner=null;stats();readiness();return}
  const d=await api('/treks/mine');
  packages=d?.packages||[];bookings=d?.bookings||[];stats();
  if(packages.length&&!selected)selected=packages.find(p=>p.status==='published')||packages[0];
  const owner=d?.partner;currentOwner=owner||null;
  $('copyPartnerLink').textContent=owner?.status==='approved'?'Copy verified operator page':'Copy marketplace link';
  if(owner?.status==='approved'){
   try{const q=await api('/treks/enquiries');enquiries=q?.items||[];}
   catch(_){enquiries=[];}
  }else enquiries=[];
  stats();renderEnquiries();readiness();
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
  card.appendChild(contact);
  const status=document.createElement('p');status.textContent='Follow-up: '+(q.status||'new');card.appendChild(status);
  if(q.status!=='closed'){
   const bar=document.createElement('div');bar.className='row';
   for(const action of (q.status==='new'?['contacted','closed']:['closed'])){
    const button=document.createElement('button');button.type='button';button.className='secondary';
    button.textContent=action==='contacted'?'Mark contacted':'Close enquiry';
    button.addEventListener('click',async()=>{
     button.disabled=true;
     try{await api('/treks/enquiries/status',{id:q.id,status:action,note:''});q.status=action;stats();renderEnquiries();}
     catch(e){$('promotionOutput').textContent='Could not update enquiry: '+e.message;button.disabled=false}
    });bar.appendChild(button);
   }
   card.appendChild(bar);
  }
  box.appendChild(card);
 }
}
function fillDayPlan(){
 const notes=String($('dayNotes').value||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const days=Number(field('duration'));
 if(!notes.length){$('promotionOutput').textContent='Add one real, operator-confirmed stop or activity per day first.';return}
 if(notes.length>60||days>0&&notes.length>days){
  $('promotionOutput').textContent='You entered more daily notes than the stated trek duration. Correct the duration or combine notes before generating.';return;
 }
 const itinerary=form.elements.itinerary;
 if(itinerary.value.trim()&&!confirm('Replace the current day-wise itinerary with these notes?'))return;
 const count=Number.isSafeInteger(days)&&days>=1&&days<=60?days:notes.length;
 const out=[];
 for(let i=0;i<count;i++){
  if(notes[i])out.push(/^day\s+\d+/i.test(notes[i])?notes[i]:'Day '+(i+1)+': '+notes[i]);
  else out.push('Day '+(i+1)+': [Add route, safety, food and timings before submitting]');
 }
 itinerary.value=out.join('\n');
 $('promotionOutput').textContent='Day-wise itinerary prepared from your real notes. Complete any bracketed gaps and verify all details before saving; no route or safety facts were invented.';
 itinerary.scrollIntoView({behavior:'smooth',block:'center'});
}
$('fillDayPlan').addEventListener('click',fillDayPlan);
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
 if(/^https:\/\//.test(url)){$('posterPhoto').src=url;$('posterPhoto').alt='Operator-supplied trek image (use only with permission)';$('posterCredit').textContent='Photograph supplied by the operator, who confirms they have permission for this use.';}
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
$('copyPartnerLink').addEventListener('click',()=>{
 const operatorUid=currentOwner?.ownerUid;
 if(currentOwner?.status==='approved'&&typeof operatorUid==='string'&&operatorUid.length<160)
  copy('https://roamwise.co.in/treks/?operator='+encodeURIComponent(operatorUid)+'#discover');
 else copy(link());
});
$('copyPromo').addEventListener('click',()=>share('whatsapp'));
$('copyCaption').addEventListener('click',()=>share('instagram'));
function openPrintable(html,filename){
 const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
 const win=window.open(url,'_blank','noopener,noreferrer');
 if(!win){const a=document.createElement('a');a.href=url;a.download=filename;a.click();$('promotionOutput').textContent='Pop-up blocked: downloaded an HTML poster. Open it and select Print → Save as PDF.';}
 else $('promotionOutput').textContent='Branded poster opened. Use browser Print → Save as PDF or share an image of the poster.';
 setTimeout(()=>URL.revokeObjectURL(url),120000);
}
$('printPromo').addEventListener('click',()=>{
 const p=packages.find(x=>x.status==='published')||packages[0];
 if(!p){$('promotionOutput').textContent='Save a trek departure first to make a poster.';return}
 const published=p.status==='published',target=link(published?p.id:null);
 const title=esc(p.name||'Upcoming Himalayan trek'),region=esc(p.region||'Location pending');
 const photo=[p.imageUrl,...(Array.isArray(p.galleryUrls)?p.galleryUrls:[])].find(u=>typeof u==='string'&&/^https:\/\/[^\s<>"']+$/i.test(u));
 const art=photo?'<img alt="Real operator-approved trek photograph" src="'+esc(photo)+'" style="width:100%;height:320px;object-fit:cover;border-radius:16px">':
   '<div style="height:190px;display:grid;place-items:center;background:linear-gradient(135deg,#563e78,#251638);border-radius:16px;font-size:52px">🏔️</div>';
 const rate=Number(p.unitPrice)>0?'₹'+fmt(p.unitPrice)+' / '+esc(p.pricingUnit||'person'):'Operator rate pending';
 const badge=published?'APPROVED DEPARTURE · OPERATOR CONFIRMATION REQUIRED':'DRAFT · NOT BOOKABLE';
 const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+' · RoamWise Trails</title><style>body{max-width:720px;margin:24px auto;padding:15px;font:18px/1.5 system-ui;background:#130c23;color:#fff5e6}.sheet{background:linear-gradient(145deg,#372448,#18142d);border:2px solid #c9a171;border-radius:24px;padding:22px;box-shadow:0 18px 60px #0007}h1{font:700 42px/1.1 Georgia,serif;margin:18px 0;color:#ffd28a}.row{display:flex;gap:12px;flex-wrap:wrap}.tag{background:#463152;padding:9px 13px;border-radius:30px}a{color:#ffd28a}small{color:#e4d7e6}footer{margin-top:25px;border-top:1px solid #987799;padding-top:14px}@media print{body{margin:0;background:white;padding:0}.sheet{box-shadow:none;border:0;border-radius:0;print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style><main class="sheet"><div style="color:#ffdfae;font-weight:800">✦ ROAMWISE TRAILS · LOCAL TREK OPERATORS</div><p style="font-size:12px;letter-spacing:1px">'+badge+'</p>'+art+'<h1>'+title+'</h1><p style="font-size:24px;color:#ffd28a">'+region+'</p><div class="row"><span class="tag">📅 '+esc(p.start||'Dates pending')+'</span><span class="tag">🥾 '+esc(p.duration||'?')+' days</span><span class="tag">🎒 '+esc(p.difficulty||'Difficulty pending')+'</span></div><p style="font-size:28px;font-weight:800;color:#ffe0ab">'+rate+'</p><p>Pickup: '+esc(p.meetingPoint||'Ask the operator')+'</p><p>Included: '+esc(p.includes||'Ask for details')+'</p><p style="word-break:break-word"><a href="'+esc(target)+'">'+esc(target)+'</a></p><footer><small>Photo: '+(photo?'Provided by operator; publication rights must be verified.':'No operator photograph provided.')+' All prices, availability, route conditions and permits require operator confirmation. No guaranteed seat or complimentary benefit.</small></footer></main></html>';
 openPrintable(html,'roamwise-trek-poster.html');
});
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