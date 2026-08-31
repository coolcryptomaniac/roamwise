/* RoamWise Platform V5 — consented Ailon Tusk / Trip Chat improvement
 * Default: OFF. No private conversation is copied into the learning dataset
 * until the traveller explicitly opts in. Samples are redacted client-side,
 * bounded, attributable to a consent version, and can be revoked at any time.
 */
(function(){'use strict';
const KEY='rw_ai_learning_consent_v1', QKEY='rw_ai_learning_queue_v1', VERSION='2026-09-01-v1';
const MAX_TEXT=1400, MAX_QUEUE=40;
const get=(k,d='')=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(_){return d}};
const set=(k,v)=>{try{localStorage.setItem(k,v)}catch(_){}};
const del=k=>{try{localStorage.removeItem(k)}catch(_){}};
function enabled(){try{return JSON.parse(get(KEY,'null'))?.enabled===true}catch(_){return false}}
function state(){try{return JSON.parse(get(KEY,'null'))||{enabled:false,version:VERSION}}catch(_){return{enabled:false,version:VERSION}}}
function redact(v){
  let s=String(v||'').slice(0,MAX_TEXT*2);
  s=s.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,'[email]');
  s=s.replace(/(?:\+?91[-\s]?)?[6-9]\d{9}\b/g,'[phone]');
  s=s.replace(/\b\d{12,19}\b/g,'[number]');
  s=s.replace(/\b[A-Za-z0-9._-]{2,}@[A-Za-z]{2,}\b/g,'[payment-id]');
  s=s.replace(/\b(?:sk-|rk-|pk_live_|pk_test_|AIza|ghp_|github_pat_|xox[baprs]-)[A-Za-z0-9_\-]{8,}\b/g,'[secret]');
  s=s.replace(/\b(?:password|passwd|pwd|otp|pin|cvv|cvc|api[_ -]?key|secret)\s*[:=]\s*\S+/gi,'$1=[redacted]');
  return s.trim().slice(0,MAX_TEXT);
}
function safeMeta(meta){const o={};for(const k of ['destination','topic','provider','helpful','source'])if(meta&&meta[k]!=null)o[k]=redact(String(meta[k])).slice(0,100);return o}
function queueRead(){try{const q=JSON.parse(get(QKEY,'[]'));return Array.isArray(q)?q.slice(-MAX_QUEUE):[]}catch(_){return[]}}
function queueWrite(q){set(QKEY,JSON.stringify(q.slice(-MAX_QUEUE)))}
function user(){try{return window.firebase?.auth?.().currentUser||window.user||null}catch(_){return window.user||null}}
async function writeConsent(on){const u=user();if(!u||!window.db)return;try{await window.db.collection('aiLearningConsents').doc(u.uid).set({uid:u.uid,enabled:!!on,version:VERSION,updatedAt:window.firebase.firestore.FieldValue.serverTimestamp()},{merge:true})}catch(_){}}
async function flush(){if(!enabled()||!window.db)return false;const u=user();if(!u?.uid)return false;const q=queueRead();if(!q.length)return true;let done=0;for(const x of q){try{await window.db.collection('aiLearningSamples').add({...x,uid:u.uid,consentVersion:VERSION,createdAt:window.firebase.firestore.FieldValue.serverTimestamp()});done++}catch(_){break}}if(done)queueWrite(q.slice(done));return done===q.length}
function record(channel,role,text,meta){if(!enabled())return false;const t=redact(text);if(!t||t.length<2)return false;const item={channel:String(channel||'ailon').slice(0,24),role:String(role||'user').slice(0,16),text:t,meta:safeMeta(meta),clientAt:new Date().toISOString(),consentVersion:VERSION};const q=queueRead();q.push(item);queueWrite(q);setTimeout(flush,20);return true}
function setConsent(on){const s={enabled:!!on,version:VERSION,updatedAt:new Date().toISOString()};set(KEY,JSON.stringify(s));if(!on)del(QKEY);writeConsent(on);syncUi();try{window.showToast?.(on?'Private-chat improvement sharing enabled':'Private-chat improvement sharing off')}catch(_){}return s}
function ui(){const modal=document.querySelector('#settingsOverlay .modal-body');if(!modal||document.getElementById('rwLearningConsent'))return;const box=document.createElement('div');box.id='rwLearningConsent';box.className='key-section';box.innerHTML=`<div class="key-sec-title">Improve Ailon Tusk & Trip Chat <small style="font-size:10px;font-weight:400;color:var(--t3);text-transform:none;letter-spacing:0">— optional</small></div><label style="display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid var(--b2);border-radius:12px;background:var(--bg3);cursor:pointer"><input id="rwLearningToggle" type="checkbox" style="margin-top:3px;width:18px;height:18px;accent-color:var(--gold)"><span><b style="display:block;font-size:12.5px">Help improve RoamWise using my conversations</b><small style="display:block;color:var(--t2);line-height:1.55;margin-top:3px">When enabled, selected Ailon Tusk prompts/responses and your own Trip Chat messages may be used to improve travel quality. RoamWise redacts common emails, phone numbers, payment IDs, card-like numbers and secrets before upload. Never deliberately include passwords, OTPs, API keys or payment credentials. Turn this off anytime; future sharing stops immediately.</small></span></label><div style="font-size:10px;color:var(--t3);margin-top:6px">Off by default · consent ${VERSION} · existing Trip Chat privacy/retention rules still apply.</div>`;modal.appendChild(box);box.querySelector('#rwLearningToggle').addEventListener('change',e=>setConsent(e.target.checked));syncUi()}
function syncUi(){const t=document.getElementById('rwLearningToggle');if(t)t.checked=enabled()}
function patch(){
  if(typeof window.copilotSend==='function'&&!window.copilotSend.__rwLearn){const orig=window.copilotSend;const f=function(fromHero){try{const inp=document.getElementById(fromHero?'heroInput':'cpInput'),t=(inp?.value||'').trim();if(t)record('ailon','user',t,{source:fromHero?'hero':'copilot',provider:window.activeProv||'smart'})}catch(_){}return orig.apply(this,arguments)};f.__rwLearn=true;window.copilotSend=f}
  if(typeof window.cpFinish==='function'&&!window.cpFinish.__rwLearn){const orig=window.cpFinish;const f=async function(bubble,answerHTML,intents,raw){const out=await orig.apply(this,arguments);try{const text=bubble?.textContent||String(answerHTML||'').replace(/<[^>]+>/g,' ');if(text)record('ailon','assistant',text,{source:'copilot',destination:intents?.dest||'',topic:intents?.topic||'',provider:window.activeProv||'smart'})}catch(_){}return out};f.__rwLearn=true;window.cpFinish=f}
  if(typeof window.tripChatSend==='function'&&!window.tripChatSend.__rwLearn){const orig=window.tripChatSend;const f=function(){try{const inp=document.getElementById('chatInput'),t=(inp?.value||'').trim();if(t)record('trip_chat','user',t,{source:/^@?tusk\b/i.test(t)?'trip-chat-tusk':'trip-chat'})}catch(_){}return orig.apply(this,arguments)};f.__rwLearn=true;window.tripChatSend=f}
}
function boot(){ui();patch();flush();let n=0;const timer=setInterval(()=>{ui();patch();if(++n>120)clearInterval(timer)},500);document.addEventListener('visibilitychange',()=>{if(!document.hidden)flush()})}
window.RW_LEARNING={version:VERSION,enabled,state,setConsent,redact,record,flush};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
