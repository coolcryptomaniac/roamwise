/* RoamWise Platform V5 — Crowd Dodge
 * Blends the existing month baseline + anonymous RoamWise demand pulse + a
 * server-published aggregate live signal. Raw camera/satellite imagery is NOT
 * read in the browser and no person is identified/tracked. Publishers may
 * write only aggregate density/confidence into crowdSignals via trusted admin.
 */
(function(){'use strict';
const ttl=20*60*1000, cache=new Map();
const LOCAL={
  goa:[
    {name:'Galgibaga Beach',where:'South Goa',score:24,why:'Long turtle-nesting beach with far fewer day crowds; respect seasonal nesting restrictions.'},
    {name:'Agonda Beach',where:'South Goa',score:34,why:'Quieter long-stay beach; walk the south/north ends rather than the central restaurant strip.'},
    {name:'Cola Beach',where:'South Goa',score:28,why:'Small lagoon-backed cove; access is slower, which naturally filters day traffic.'},
    {name:'Betul & Mobor edge',where:'South Goa',score:31,why:'River-mouth and beach combination away from the Baga/Calangute concentration.'},
    {name:'Divar + Chorao',where:'Goa islands',score:22,why:'Heritage villages, ferries and wetlands when the coast is overloaded.'}
  ],
  kedarnath:[
    {name:'Madhyamaheshwar',where:'Garhwal',score:27,why:'Remote Panch Kedar trek with a much smaller visitor flow. It is not a substitute for Kedarnath darshan.'},
    {name:'Kalpeshwar',where:'Urgam Valley',score:22,why:'Panch Kedar shrine reachable year-round more quietly; religious significance is distinct.'},
    {name:'Chopta–Tungnath',where:'Rudraprayag',score:42,why:'Shorter mountain/spiritual alternative when the Kedarnath corridor is saturated; can also become busy on weekends.'},
    {name:'Deoria Tal–Sari',where:'Rudraprayag',score:31,why:'Scenic Himalayan option with easier logistics when pilgrimage queues are the main constraint.'}
  ],
  manali:[{name:'Sethan',where:'Hamta side',score:31,why:'Small village above the valley floor, normally calmer than central Manali.'},{name:'Jana–Naggar',where:'Kullu Valley',score:34,why:'Heritage village/waterfall circuit away from Mall Road pressure.'}],
  rishikesh:[{name:'Neer Garh–Kyarki',where:'Rishikesh hills',score:36,why:'Shift uphill and start early rather than concentrating at Tapovan/Laxman Jhula.'},{name:'Kunjapuri–Narendra Nagar',where:'Tehri edge',score:29,why:'Sunrise/ridge alternative when the riverfront is overloaded.'}],
  jaipur:[{name:'Gaitor + Nahargarh foothills',where:'Jaipur',score:38,why:'Heritage/photography loop with lower mid-day concentration than Amber/Hawa Mahal.'},{name:'Sanganer',where:'Jaipur',score:27,why:'Block-printing and craft alternative to the old-city monument circuit.'}]
};
const clean=s=>String(s||'').trim(), norm=s=>clean(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim(), slug=s=>norm(s).replace(/\s+/g,'-').slice(0,70);
const monthIndex=()=>{const v=document.getElementById('month')?.value;if(v==null||v==='')return new Date().getMonth();const n=Number(v);if(Number.isFinite(n))return n>=1&&n<=12?n-1:Math.max(0,Math.min(11,n));const ms=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];const i=ms.findIndex(x=>String(v).toLowerCase().startsWith(x));return i>=0?i:new Date().getMonth()};
function dbPlace(name){const n=norm(name);return (window.DB||[]).find(d=>norm(d.name)===n||norm(d.name).includes(n)||n.includes(norm(d.name)))||null}
function interests(d){return new Set([...(d?.interests||[]),...(d?.tags||[])].map(norm))}
function overlap(a,b){const A=interests(a),B=interests(b);let n=0;A.forEach(x=>{if(B.has(x))n++});return n}
function hav(a,b){if(!a||!b)return 99999;const R=6371,p=Math.PI/180,dlat=(+b.lat-+a.lat)*p,dlon=(+b.lon-+a.lon)*p,x=Math.sin(dlat/2)**2+Math.cos(+a.lat*p)*Math.cos(+b.lat*p)*Math.sin(dlon/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
function baseline(d,m){const x=Number(d?.crowd?.[m]);return Number.isFinite(x)?Math.max(0,Math.min(100,x)):50}
async function doc(path){if(!window.db)return null;try{const d=await window.db.doc(path).get();return d.exists?d.data():null}catch(_){return null}}
async function liveSignal(name,m){const key=slug(name)+'-'+m,hit=cache.get(key);if(hit&&Date.now()-hit.at<ttl)return hit.v;let pulse=null,signal=null;try{const k=typeof window.pulseKey==='function'?window.pulseKey(name,m):slug(name+'-'+m);[pulse,signal]=await Promise.all([doc('pulse/'+k),doc('crowdSignals/'+slug(name))])}catch(_){}const v={pulseCount:Number(pulse?.count||0),signal:signal||null};cache.set(key,{at:Date.now(),v});return v}
function freshness(v){const raw=v?.updatedAt;let t=0;try{t=raw?.toMillis?raw.toMillis():new Date(raw||0).getTime()}catch(_){}if(!t)return .35;const h=(Date.now()-t)/36e5;if(h<=2)return 1;if(h<=8)return .8;if(h<=24)return .55;if(h<=72)return .3;return .12}
function compute(base,live){const s=live?.signal||{},fresh=freshness(s),vals=[];for(const k of ['densityScore','authorityScore','mobilityScore','newsScore','cameraScore','satelliteScore']){const n=Number(s[k]);if(Number.isFinite(n)&&n>=0&&n<=100)vals.push(n)}const ext=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;/* pulse is demand intent, not a literal head-count: use a logarithmic small weight */const p=Math.min(100,Math.log2(1+Math.max(0,live?.pulseCount||0))*13);let score=base*.68+p*.12;if(ext!=null)score=base*(.55-.15*fresh)+p*.10+ext*(.35+.15*fresh);return Math.max(0,Math.min(100,Math.round(score)))}
function label(s){return s>=85?'Extreme':s>=70?'Very busy':s>=55?'Busy':s>=38?'Moderate':'Quiet'}
function genericAlts(d,m){if(!d)return[];const base=baseline(d,m),all=(window.DB||[]).filter(x=>x!==d&&x.lat!=null&&x.lon!=null);return all.map(x=>({name:x.name,where:x.country||x.region||'',score:baseline(x,m),dist:Math.round(hav(d,x)),ov:overlap(d,x),why:x.local||''})).filter(x=>x.score+10<base&&x.dist<1000).sort((a,b)=>(b.ov-a.ov)||(a.score-b.score)||(a.dist-b.dist)).slice(0,5)}
function localKey(name){const n=norm(name);return Object.keys(LOCAL).find(k=>n.includes(k))||''}
async function suggest(name){const m=monthIndex(),d=dbPlace(name),base=baseline(d,m),live=await liveSignal(d?.name||name,m),score=compute(base,live),local=LOCAL[localKey(name)]||[],alts=(local.length?local:genericAlts(d,m)).slice(0,5);return{name:d?.name||clean(name),month:m,base,score,label:label(score),live,alts,confidence:Number(live?.signal?.confidence||0),updatedAt:live?.signal?.updatedAt||null}}
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function card(r){const high=r.score>=55,src=(r.live.signal?.sourceLabels||[]).slice?.(0,4)||[];return `<section id="rwCrowdDodgeCard" style="margin:12px 0;border:1px solid ${high?'rgba(239,68,68,.42)':'rgba(74,222,128,.34)'};border-radius:16px;padding:14px;background:linear-gradient(135deg,${high?'rgba(239,68,68,.08)':'rgba(74,222,128,.06)'},rgba(12,16,32,.82))"><div style="display:flex;gap:10px;align-items:center"><div style="font-size:25px">🥷</div><div style="flex:1"><b style="font-size:14px">Crowd Dodge · ${esc(r.name)}</b><div style="font-size:11px;color:var(--t2)">${r.label} · live score <b style="color:${high?'#fb7185':'#4ade80'}">${r.score}/100</b> · seasonal baseline ${r.base}/100</div></div></div>${high&&r.alts.length?`<div style="font-size:11px;color:var(--t2);margin:10px 0 7px">Crowd pressure is elevated. Same-intent alternatives right now:</div><div style="display:grid;gap:7px">${r.alts.map(a=>`<button class="tact" style="text-align:left;padding:9px 10px;border-radius:11px" onclick="RW_CROWD_DODGE.use('${esc(a.name).replace(/'/g,"\\'")}')"><b>${esc(a.name)}</b> <span style="color:#4ade80">${a.score}/100</span><br><small style="color:var(--t3)">${esc(a.where)}${a.dist?` · ~${a.dist} km`:''} · ${esc(a.why).slice(0,155)}</small></button>`).join('')}</div>`:`<div style="font-size:11px;color:var(--t2);margin-top:9px">No urgent diversion suggested. Start early and keep Crowd Dodge on for changes.</div>`}<div style="font-size:9.5px;color:var(--t3);margin-top:10px">Signal = seasonality + anonymous RoamWise intent${r.live.signal?' + published aggregate live feeds':''}. ${src.length?'Sources: '+esc(src.join(', '))+'. ':''}Camera/satellite inputs, when used by the server pipeline, must be aggregate density only—never face/person identification.</div></section>`}
async function show(){const dest=clean(document.getElementById('destInput')?.value||window._lastItin?.name||'');if(!dest)return;const r=await suggest(dest),results=document.getElementById('results');if(!results)return;document.getElementById('rwCrowdDodgeCard')?.remove();results.insertAdjacentHTML('afterbegin',card(r));window._rwCrowdLast=r}
function use(name){const el=document.getElementById('destInput');if(el)el.value=name;try{window.showToast?.('Crowd Dodge switched to '+name)}catch(_){}try{window.runSearch?.()}catch(_){}setTimeout(show,300)}
function patch(){if(typeof window.runSearch==='function'&&!window.runSearch.__rwCrowd){const o=window.runSearch,f=function(){const r=o.apply(this,arguments);Promise.resolve(r).finally(()=>setTimeout(show,250));return r};f.__rwCrowd=true;window.runSearch=f}}
function boot(){patch();let n=0,t=setInterval(()=>{patch();if(++n>80)clearInterval(t)},500)}
window.RW_CROWD_DODGE={version:'5.0.0',suggest,show,use,compute};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
