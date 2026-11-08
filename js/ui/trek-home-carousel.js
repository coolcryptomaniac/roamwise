/* Approved treks only. Never publicise unverified/unclaimed partner previews. */
(function(){
'use strict';
var API='https://roamwise-api.founder-f53.workers.dev/treks/catalog';
var root=document.getElementById('rwSalesTreks');
if(!root)return;
function text(tag,value,cls){var n=document.createElement(tag);n.textContent=value;if(cls)n.className=cls;return n}
function fallback(){
 root.replaceChildren();
 var p=text('p','No verified trekking departures have been published yet. Discover the RoamWise Trails network.');
 p.style.cssText='color:#dac9dc;padding:12px';root.appendChild(p);
 var a=text('a','Discover treks and operators →','rw-sales-card');
 a.href='/treks/';a.style.cssText='padding:22px;justify-content:center;min-height:125px;flex:0 0 220px;align-items:center;text-align:center';
 root.appendChild(a);
}
fetch(API,{method:'GET',cache:'no-store'}).then(function(r){
 if(!r.ok)throw Error('Unavailable');
 return r.json();
}).then(function(data){
 var items=Array.isArray(data.items)?data.items.filter(function(p){
  return /^tp_[a-f0-9]{32}$/.test(p.id||'')&&p.provider&&p.name&&p.start&&Number(p.unitPrice)>0;
 }).slice(0,18):[];
 if(!items.length){fallback();return}
 root.replaceChildren();
 items.forEach(function(p){
  var a=document.createElement('a');a.className='rw-sales-card';a.href='/treks/?package='+encodeURIComponent(p.id)+'#discover';
  a.setAttribute('aria-label','View '+p.name+' departure and secure booking options');
  if(/^https:\/\//.test(p.imageUrl||'')){
   var img=document.createElement('img');img.loading='lazy';img.decoding='async';img.src=p.imageUrl;
   img.alt='Photo provided by '+p.provider.name+' for '+p.name;a.appendChild(img);
  }else{
   var placeholder=text('div','🏔️ Real trek photo pending','');
   placeholder.style.cssText='display:flex;align-items:center;justify-content:center;height:158px;background:linear-gradient(130deg,#54416c,#271b3d);color:#f5d6a5;font-weight:700';
   a.appendChild(placeholder);
  }
  var box=document.createElement('span');box.className='rw-sales-copy';
  box.appendChild(text('strong',p.name+' · '+p.duration+' days'));
  box.appendChild(text('small',p.provider.name+' · '+p.region));
  box.appendChild(text('small','Starts '+p.start+' · '+(p.difficulty||'Difficulty to confirm')));
  if(p.meetingPoint)box.appendChild(text('small','Pickup/meet: '+p.meetingPoint));
  if(p.includes)box.appendChild(text('small','Includes: '+p.includes.slice(0,190)));
  box.appendChild(text('span','Operator price ₹'+Number(p.unitPrice).toLocaleString('en-IN')+' / '+(p.pricingUnit||'person'),'rw-price'));
  box.appendChild(text('b',data.checkoutEnabled===true?'View itinerary · checkout options →':'View itinerary · request booking details →'));
  a.appendChild(box);root.appendChild(a);
 });
}).catch(fallback);
})();