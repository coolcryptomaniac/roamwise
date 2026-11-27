/* Premium, accessible MCP Apps cards, using only host tools and approved site links.
 * No card collection, wallet token, personal information, or payment happens here.
 */
export const ROAMWISE_CARDS_URI='ui://roamwise-discovery/cards-v2.html';
export const ROAMWISE_CARDS_HTML=String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RoamWise · Discovery</title>
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;color:#172235;background:transparent}
*{box-sizing:border-box}body{margin:0}button,input,select{font:inherit}
.shell{padding:14px;background:#f8f9fc;border:1px solid #e7e6ed;border-radius:22px;max-width:100%;overflow:hidden}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
.brand{display:flex;align-items:center;gap:10px;min-width:0}
.mark{width:35px;height:35px;border-radius:12px;background:#262044;color:#eacf8e;display:grid;place-items:center;font-size:20px;flex-shrink:0}
.mark img{height:100%;width:100%;object-fit:contain;border-radius:12px}.eyebrow{font-size:10px;letter-spacing:.13em;font-weight:780;text-transform:uppercase;color:#73648c}
h1{font-size:16px;line-height:1.2;letter-spacing:-.02em;margin:2px 0 0;color:#242039}
.nav{display:flex;gap:6px}
button{cursor:pointer;border:1px solid #dcd9e7;background:white;color:#302743;border-radius:12px;min-height:44px;padding:10px 12px;touch-action:manipulation}
button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #986ee4;outline-offset:2px}
.nav button{min-width:44px}
.rail{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:thin;gap:12px;padding:0 1px 12px;overscroll-behavior-inline:contain}
.card{scroll-snap-align:start;flex:0 0 min(286px,84vw);background:white;border:1px solid #e7e7ef;border-radius:18px;overflow:hidden;box-shadow:0 8px 28px rgba(25,22,62,.065);display:flex;flex-direction:column}
.visual{height:165px;position:relative;display:grid;place-items:center;background:linear-gradient(135deg,#b9a0d1,#50467a 55%,#24233e);overflow:hidden}
.visual img{width:100%;height:100%;object-fit:cover}
.visual .placeholder{font-size:52px;filter:drop-shadow(0 6px 12px #0003)}
.visual .corner{position:absolute;top:10px;left:10px;color:white;font-size:10px;font-weight:750;padding:6px 9px;border-radius:18px;background:#191b319c;backdrop-filter:blur(5px)}
.content{padding:14px;display:flex;flex-direction:column;gap:8px;flex:1}
.kind{color:#76618d;font-size:11px;letter-spacing:.07em;font-weight:790;text-transform:uppercase}
h2{margin:0;font-size:18px;letter-spacing:-.035em;line-height:1.17;color:#242039}
.location{display:flex;align-items:center;gap:5px;font-size:12px;color:#585e6b}
.desc{margin:0;color:#646677;font-size:12px;line-height:1.45;max-height:3.9em;overflow:hidden}
.pills{display:flex;gap:5px;flex-wrap:wrap}
.pill{font-size:10px;border:1px solid #e5e2ec;color:#5f6070;padding:4px 7px;border-radius:99px}
.price{font-weight:790;color:#28213d;font-size:15px;letter-spacing:-.02em}
.small{font-size:11px;color:#666778}
.actions{display:flex;gap:7px;margin-top:auto;padding-top:4px;align-items:stretch}
.actions button{flex:1;font-weight:720;padding:8px;font-size:12px}
.primary{background:#372956;color:white;border-color:#372956}
.secondary{background:white;border-color:#dcd9e7}
.notice{color:#5e6072;font-size:11px;line-height:1.5;margin-top:8px}
.panel{border:1px solid #d7cdea;border-radius:16px;background:#fff;margin-top:9px;padding:14px;display:none}
.panel.open{display:block}
.panel h3{font-size:16px;margin:0 0 5px;line-height:1.25;color:#291d47}
.panel p{margin:0 0 12px;color:#5b5d6a;font-size:12px}
.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.fields label{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:720;color:#363145}
.fields input,.fields select{width:100%;min-width:0;min-height:44px;background:#fff;border-radius:10px;border:1px solid #ccc6da;color:#252039;padding:9px;font-size:13px}
.full{grid-column:1/-1}
.panelbuttons{display:flex;gap:8px;margin-top:12px}
.panelbuttons button{flex:1;font-weight:730}
.outcome{margin-top:11px;padding:11px;background:#f3f0f8;border-radius:10px;white-space:pre-wrap;font-size:12px;line-height:1.45;color:#312747}
.footer{font-size:11px;color:#646677;margin-top:8px}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation:none!important}}
</style></head>
<body><main class="shell" aria-label="RoamWise interactive discovery">
<header class="top"><div class="brand"><div class="mark"><img src="https://www.roamwise.co.in/assets/img/roamwise-logo-176.webp" width="35" height="35" alt="RoamWise"></div><div><div class="eyebrow">RoamWise · Curated by people</div><h1 id="headline">Discover the extraordinary.</h1></div></div><div class="nav"><button id="prev" type="button" aria-label="Previous card">‹</button><button id="next" type="button" aria-label="Next card">›</button></div></header>
<section class="rail" id="rail" aria-label="Listings" aria-live="polite"><p class="small">Loading approved listings…</p></section>
<section id="panel" class="panel" aria-label="Review quote"></section>
<p class="footer">Artwork and room availability are not guaranteed by a listing. Bookings and purchases happen only on roamwise.co.in, after you choose to go there.</p>
</main>
<script>
(()=>{'use strict';
const rail=document.getElementById('rail'),panel=document.getElementById('panel');
const requests=new Map();let serial=10;
const HOSTS=new Set(['www.roamwise.co.in','roamwise.co.in']);
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n}
function send(method,params,id){parent.postMessage({jsonrpc:'2.0',method,params,...(id!==undefined?{id}:{})},'*')}
function allowedUrl(raw){try{const u=new URL(raw);return u.protocol==='https:'&&HOSTS.has(u.hostname)?u.href:null}catch{return null}}
function open(raw){const url=allowedUrl(raw);if(!url)return;send('ui/open-link',{url},++serial)}
function tool(name,args){return new Promise((resolve,reject)=>{const id=++serial;requests.set(id,{resolve,reject});send('tools/call',{name,arguments:args},id);setTimeout(()=>{if(requests.has(id)){requests.delete(id);reject(Error('Chat host did not return a quote. Please continue on RoamWise.'))}},14000)})}
function money(paise){return '₹'+(Number(paise)/100).toLocaleString('en-IN',{maximumFractionDigits:2})}
function kind(i){return i.category==='product'?'Merchandise':i.category==='artist'?'Featured creator':i.category==='stay'?'Handpicked stay':i.category==='package'?'Curated experience':i.category==='itinerary'?'Shareable itinerary':'Travel copilot'}
function eligibleImage(url){try{const u=new URL(url);return u.protocol==='https:'&&HOSTS.has(u.hostname)}catch{return false}}
function showPanel(){panel.classList.add('open');panel.replaceChildren()}
function titleLine(t,sub){panel.append(el('h3','',t),el('p','',sub))}
function field(name,type,placeholder,required){const label=el('label','',name),control=el('input');control.type=type;control.placeholder=placeholder||'';control.required=!!required;label.append(control);return {label,control}}
function drawQuote(data,pageUrl){
 const previous=panel.querySelector('.outcome');if(previous)previous.remove();
 const outcome=el('div','outcome');
 if(!data?.ok){outcome.textContent='Quote unavailable: '+(data?.message||data?.error||'Please continue at RoamWise.');panel.append(outcome);return}
 if(data.listingId){const v=data.quote||{};outcome.textContent='Payment amount: '+money(v.payNowPaise)+'\n'+(v.totalPaise===null?'Final stay total: to be confirmed':'Total quoted: '+money(v.totalPaise))+'\nAvailability: supplier confirmation pending.\nNo room has been held and no payment has been made.'}
 else {outcome.textContent='Merchandise total: '+money(data.quote.totalPaise)+'\nIncluding delivery: '+money(data.quote.shippingPaise)+'\nNo order has been created.'}
 panel.append(outcome);
 const btn=el('button','primary','View on RoamWise');
 btn.style.width='100%';btn.style.marginTop='9px';btn.onclick=()=>open(data.pageUrl||pageUrl);panel.append(btn);
}
function stayQuote(i){
 showPanel();titleLine('Check dates · '+i.title,'RoamWise calculates the payment amount. The supplier still confirms the room.');
 const fields=el('div','fields');const a=field('Check-in','date','',true),b=field('Check-out','date','',true);const today=new Date().toISOString().slice(0,10);a.control.min=today;b.control.min=today;
 fields.append(a.label,b.label);panel.append(fields);
 const actions=el('div','panelbuttons');const submit=el('button','primary','Get server quote'),cancel=el('button','secondary','Close');actions.append(submit,cancel);panel.append(actions);
 cancel.onclick=()=>panel.classList.remove('open');
 submit.onclick=async()=>{
  if(!a.control.value||!b.control.value||b.control.value<=a.control.value){const o=el('div','outcome','Choose valid check-in and check-out dates.');panel.append(o);return}
  submit.disabled=true;submit.textContent='Checking…';
  try{const res=await tool('quote_roamwise_stay',{listingId:i.id,checkin:a.control.value,checkout:b.control.value,paymentType:'advance'});drawQuote(res.structuredContent||JSON.parse(res.content?.[0]?.text||'{}'),i.url)}
  catch(e){drawQuote({ok:false,message:e.message},i.url)}finally{submit.disabled=false;submit.textContent='Get server quote'}
 };
}
function shopQuote(i){
 showPanel();titleLine('Get delivery quote · '+i.title,'Shipping costs depend on your Indian PIN. No personal address is collected in chat.');
 const fields=el('div','fields');
 const variantWrap=el('label','full','Variant'),select=el('select');for(const v of i.variants||[]){const op=el('option','',v.label);op.value=v.id;select.append(op)}variantWrap.append(select);
 const qty=field('Quantity','number','1',true);qty.control.value='1';qty.control.min='1';qty.control.max=String(i.maxQty||1);
 const pin=field('6-digit PIN','text','e.g. 263601',true);pin.control.maxLength=6;pin.control.inputMode='numeric';pin.label.classList.add('full');
 fields.append(variantWrap,qty.label,pin.label);panel.append(fields);
 const actions=el('div','panelbuttons'),submit=el('button','primary','Check total'),cancel=el('button','secondary','Close');actions.append(submit,cancel);panel.append(actions);cancel.onclick=()=>panel.classList.remove('open');
 submit.onclick=async()=>{
  const q=Number(qty.control.value);
  if(!/^[1-9][0-9]{5}$/.test(pin.control.value)||!Number.isInteger(q)||q<1||q>Number(i.maxQty)||!select.value){panel.append(el('div','outcome','Select a variant, quantity, and six-digit PIN.'));return}
  submit.disabled=true;submit.textContent='Checking…';
  try{const res=await tool('quote_roamwise_shop',{items:[{id:i.id,variant:select.value,qty:q}],pin:pin.control.value});drawQuote(res.structuredContent||JSON.parse(res.content?.[0]?.text||'{}'),i.url)}
  catch(e){drawQuote({ok:false,message:e.message},i.url)}finally{submit.disabled=false;submit.textContent='Check total'}
 };
}
async function sharePublic(i){
 const url=allowedUrl(i.share_url||i.url);if(!url)return;
 try{
  if(navigator.share){await navigator.share({title:i.title,url});return}
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);const notice=el('div','outcome','Public itinerary link copied. It does not contain your private trip details.');showPanel();panel.append(notice);return}
 }catch(e){if(e?.name==='AbortError')return}
 open(url);
}
function drawCard(i){
 const card=el('article','card'),visual=el('div','visual');
 if(eligibleImage(i.image_url)){const img=el('img');img.src=i.image_url;img.alt=i.title+' picture';img.loading='lazy';visual.append(img)}
 else{visual.append(el('span','placeholder',i.category==='artist'?'🎨':i.category==='stay'?'🏡':i.category==='product'?'🛍️':i.category==='package'?'🌄':i.category==='itinerary'?'🗺️':'✦'))}
 visual.append(el('span','corner',i.category==='stay'?'Enquiry only':i.category==='product'?'New quote required':i.category==='artist'?'Artist profile':i.category==='itinerary'?'Ready-made route':'Explore'));
 const body=el('div','content');body.append(el('div','kind',kind(i)),el('h2','',i.title||'RoamWise listing'),el('div','location','⌖ '+(i.subtitle||i.region||'India')));
 if(i.description)body.append(el('p','desc',i.description));
 const tags=el('div','pills');
 tags.append(el('span','pill',i.category==='stay'?'Partner-listed':i.category==='product'?'RoamWise shop':i.category==='artist'?'Portfolio':'RoamWise'));
 if(i.category==='stay')tags.append(el('span','pill','Availability unconfirmed'));
 if(i.category==='itinerary'){tags.append(el('span','pill',String(i.days||'?')+'-day plan'));tags.append(el('span','pill','Routes need rechecking'))}
 if(i.category==='product')tags.append(el('span','pill','Delivery varies'));
 body.append(tags);
 if(i.price_text)body.append(el('div','price',i.price_text));
 else if(i.category==='stay')body.append(el('div','small','Quote and dates required'));
 const actions=el('div','actions'),view=el('button','secondary','View details');view.onclick=()=>open(i.url);actions.append(view);
 if(i.category==='stay'&&['milan-heights','soulmate-homestay','woodbook-the-devine','big-bro-hotel'].includes(i.id)){
  const check=el('button','primary','Check dates');check.onclick=()=>stayQuote(i);actions.append(check);
 }else if(i.category==='product'){
  const check=el('button','primary','Check total');check.onclick=()=>shopQuote(i);actions.append(check);
 }else if(i.category==='artist'){view.textContent='Explore portfolio'}
 else if(i.category==='itinerary'){view.textContent='View itinerary';const share=el('button','primary','Share');share.onclick=()=>sharePublic(i);actions.append(share)}
 else if(i.category==='package'){view.textContent='Enquire'}
 body.append(actions);card.append(visual,body);return card;
}
function render(data){
 if(!data)return;
 if(data.quote&&!data.cards){showPanel();titleLine('RoamWise price preview','Server-calculated amount; payment still requires your approval.');drawQuote(data,data.pageUrl);return}
 const cards=Array.isArray(data.cards)?data.cards:data.card?[data.card]:[];
 rail.replaceChildren();
 const headline=document.getElementById('headline');
 if(cards.length)headline.textContent=cards[0].category==='artist'?'Meet remarkable creators.':cards[0].category==='stay'?'Find your next quiet escape.':cards[0].category==='product'?'Curated for the journey.':cards[0].category==='package'?'Journeys worth sharing.':cards[0].category==='itinerary'?'Share a beautiful journey.':'Discover the extraordinary.';
 if(!cards.length){rail.append(el('p','small','No published listing matched your search.'));return}
 cards.slice(0,12).forEach(c=>rail.append(drawCard(c)));
}
function accept(reply){if(reply?.structuredContent)render(reply.structuredContent);else if(reply?.content?.[0]?.text){try{render(JSON.parse(reply.content[0].text))}catch{}}}
window.addEventListener('message',e=>{
 if(e.source!==parent||!e.data||e.data.jsonrpc!=='2.0')return;
 const m=e.data;
 if(requests.has(m.id)){const item=requests.get(m.id);requests.delete(m.id);m.error?item.reject(Error(m.error.message||'Quote failed')):item.resolve(m.result);return}
 if(m.id===1&&m.result)send('ui/notifications/initialized',{});
 if(m.method==='ui/notifications/tool-result')accept(m.params);
 if(m.method==='ui/resource-teardown'&&m.id)send('ui/resource-teardown',{},m.id);
});
document.getElementById('prev').onclick=()=>rail.scrollBy({left:-300,behavior:'smooth'});
document.getElementById('next').onclick=()=>rail.scrollBy({left:300,behavior:'smooth'});
if(window.openai?.toolOutput)accept({structuredContent:window.openai.toolOutput});
send('ui/initialize',{protocolVersion:'2026-01-26',appInfo:{name:'roamwise-discovery',version:'2.0.0'},appCapabilities:{availableDisplayModes:['inline','fullscreen']}},1);
})();
</script></body></html>`;
