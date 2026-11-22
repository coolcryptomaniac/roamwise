/* Dependency-free MCP Apps HTML resource. Rendered in an isolated host iframe.
 * This UI never handles payment, owner data, credentials or booking state.
 */
export const ROAMWISE_CARDS_URI='ui://roamwise-discovery/cards-v1.html';
export const ROAMWISE_CARDS_HTML=String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RoamWise listings</title>
<style>
:root{color-scheme:light dark;font:14px/1.45 system-ui,-apple-system,sans-serif}
*{box-sizing:border-box}body{margin:0;color:var(--color-text-primary,#f9f8ff);background:transparent}
.wrap{padding:14px;border-radius:20px;background:linear-gradient(135deg,#10172b,#261940);color:#fff}
header{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px}
h1{font-size:17px;line-height:1.2;margin:0;font-weight:750}small{color:#c3c4d3}
.controls{display:flex;gap:5px}button{cursor:pointer;border:1px solid #69657c;background:#262c43;color:#fff;border-radius:11px;min-height:40px;padding:8px 12px;font:inherit}
button:focus-visible{outline:3px solid #cfadff;outline-offset:2px}
.rail{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:12px;padding:4px 2px 12px;scrollbar-width:thin}
.card{scroll-snap-align:start;flex:0 0 min(250px,81vw);min-width:0;border:1px solid #625573;border-radius:16px;overflow:hidden;background:#25263d;display:flex;flex-direction:column}
.media{height:145px;background:radial-gradient(circle at 40% 20%,#574777,#1e253b);display:flex;align-items:center;justify-content:center;overflow:hidden}
.media img{width:100%;height:100%;object-fit:cover}.fallback{font-size:42px}
.inner{padding:12px;display:flex;flex-direction:column;gap:5px;flex:1}
.pill{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:#f3cf91}
h2{font-size:16px;line-height:1.2;margin:0;color:white}p{margin:0;color:#d0ccdd;font-size:12px}
.action{margin-top:auto;width:100%;background:#ead7ff;color:#20112f;border:0;font-weight:700;text-align:center}
footer{margin-top:8px;color:#c3bfd4;font-size:11px}
.empty{padding:18px 5px;color:#d0ccdd}
@media (prefers-reduced-motion:reduce){.rail{scroll-behavior:auto}}
</style></head>
<body><section class="wrap" aria-label="RoamWise discovery cards">
<header><div><h1>RoamWise discoveries</h1><small id="count" aria-live="polite">Curated travel &amp; art</small></div><div class="controls"><button id="back" aria-label="Previous listing">‹</button><button id="next" aria-label="Next listing">›</button></div></header>
<div id="rail" class="rail" aria-live="polite"><div class="empty">Looking up public listings…</div></div>
<footer>Availability, prices and bookings require fresh confirmation on RoamWise.</footer>
</section>
<script>
(()=>{'use strict';
const rail=document.getElementById('rail'),count=document.getElementById('count');
const send=(method,params,id)=>parent.postMessage({jsonrpc:'2.0',...(id?{id}:{}),method,params},'*');
let serial=1,ready=false;
function openSafe(url){try{const u=new URL(url);if(u.protocol!=='https:'||u.hostname!=='www.roamwise.co.in')return;send('ui/open-link',{url:u.href},++serial)}catch{}}
function render(payload){
 const cards=Array.isArray(payload?.cards)?payload.cards:payload?.card?[payload.card]:[];
 rail.replaceChildren();count.textContent=cards.length+' reviewed listing'+(cards.length===1?'':'s');
 if(!cards.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='No matching approved public listings.';rail.append(empty);return}
 for(const item of cards.slice(0,12)){
  const card=document.createElement('article');card.className='card';
  const media=document.createElement('div');media.className='media';
  if(typeof item.image_url==='string'&&item.image_url.startsWith('https://www.roamwise.co.in/')){
   const img=document.createElement('img');img.src=item.image_url;img.alt='Photo for '+item.title;img.loading='lazy';img.referrerPolicy='no-referrer';media.append(img);
  }else{const icon=document.createElement('span');icon.className='fallback';icon.textContent=item.category==='artist'?'🎨':item.category==='stay'?'🏡':item.category==='package'?'🧭':'✦';media.append(icon)}
  const inner=document.createElement('div');inner.className='inner';
  const category=document.createElement('span');category.className='pill';category.textContent=item.category==='stay'?'Stay · Enquire':item.category==='package'?'Package · Enquire':item.category==='artist'?'Featured artist':'Travel assistant';
  const title=document.createElement('h2');title.textContent=item.title||'RoamWise listing';
  const desc=document.createElement('p');desc.textContent=item.subtitle||item.region||'';
  const btn=document.createElement('button');btn.className='action';btn.textContent=['stay','package'].includes(item.category)?'View & enquire':'View profile';btn.addEventListener('click',()=>openSafe(item.url));
  inner.append(category,title,desc,btn);card.append(media,inner);rail.append(card);
 }
}
function accept(result){if(result?.structuredContent)render(result.structuredContent);
 else if(result?.content?.[0]?.text){try{render(JSON.parse(result.content[0].text))}catch{}}}
window.addEventListener('message',e=>{
 if(e.source!==parent||!e.data||typeof e.data!=='object'||e.data.jsonrpc!=='2.0')return;
 const m=e.data;
 if(m.id===1&&m.result&&!ready){ready=true;send('ui/notifications/initialized',{});}
 if(m.method==='ui/notifications/tool-result')accept(m.params);
 if(m.method==='ui/resource-teardown'&&m.id)parent.postMessage({jsonrpc:'2.0',id:m.id,result:{}},'*');
});
document.getElementById('back').addEventListener('click',()=>rail.scrollBy({left:-265,behavior:'smooth'}));
document.getElementById('next').addEventListener('click',()=>rail.scrollBy({left:265,behavior:'smooth'}));
if(window.openai?.toolOutput)accept({structuredContent:window.openai.toolOutput});
send('ui/initialize',{protocolVersion:'2026-01-26',appInfo:{name:'roamwise-cards',version:'1.0.0'},appCapabilities:{availableDisplayModes:['inline','fullscreen']}},1);
})();
</script></body></html>`;
