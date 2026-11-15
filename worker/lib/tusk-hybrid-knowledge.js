/* Ailon Tusk public hybrid retrieval, v1.
 * Curated public facts -> optional opt-in KV exact cache -> optional opt-in
 * Vectorize + R2 APPROVED documents -> licensed live search.
 * No user data, no speculative answers, and no automatic content ingestion.
 * Internal functions are exported for deterministic Node tests.
 */
import { TUSK_FACTS } from '../data/tusk-facts.js';
import { matchFacts } from './tusk-facts.js';

const EMBEDDING_MODEL = '@cf/baai/bge-m3';
const MAX_QUESTION = 180;
const ID_RE = /^[a-z0-9][a-z0-9-]{0,59}$/;
const SECRET_RE = /(?:\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|\b(?:\+?\d[\d\s().-]{9,}\d)\b|\b(?:password|api[ _-]?key|private key|access token|otp|account number|credit card)\b)/i;
const DYNAMIC_RE = /\b(?:live|latest|today|now|right now|tomorrow|current|this week|price|cost|fare|booking|available|availability|open now|status|news|flight|train|ticket|weather|traffic|closed|schedule|rates?|stock|investor meeting|reservation)\b|आज|अभी|ಇಂದು|ಈಗ/i;
const STOP = new Set('the and of on in is a an for to from do can you me my at with what how this that please want about when which trip travel tourism india tell give around'.split(' '));

export const parsePublicQuery = (text) => {
  const query = String(text || '').normalize('NFKC').replace(/\s+/g,' ').trim();
  if(query.length < 5 || query.length > MAX_QUESTION || /[\r\n<>\u0000-\u001f]/.test(query) || SECRET_RE.test(query)) return null;
  return query;
};
export const isDynamicQuery = q => DYNAMIC_RE.test(String(q||''));
export const normalizePublicQuery = q => String(q||'').normalize('NFKC').toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();
export const publicTokens = q => normalizePublicQuery(q).split(' ').filter(x=>x.length>2 && !STOP.has(x)).slice(0,25);
export function lexicalMatch(q, text){
  const a=publicTokens(q),b=new Set(publicTokens(text));
  if(!a.length)return false;
  return a.some(x=>b.has(x));
}
export function validSource(url){
  try{const u=new URL(url);return u.protocol==='https:' && !!u.hostname && !u.username && !u.password && !/^(?:localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname);}
  catch(e){return false;}
}
const plain = text => String(text||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export function recordValid(doc, date = new Date()){
  if(!doc || doc.approved !== true || !ID_RE.test(String(doc.id||'')))return false;
  if(!Array.isArray(doc.sources) || !doc.sources.length || !doc.sources.every(validSource))return false;
  if(typeof doc.title !== 'string' || !doc.title || typeof doc.summary !== 'string' || doc.summary.length > 12000)return false;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(doc.checkedAt||'')) || !/^\d{4}-\d{2}-\d{2}$/.test(String(doc.validUntil||'')))return false;
  const today=date.toISOString().slice(0,10);
  if(doc.checkedAt>today || (doc.validUntil && doc.validUntil<today))return false;
  return true;
}
export function curatedMatches(q, date = new Date()){
  const dynamic=isDynamicQuery(q);
  const items=matchFacts(q,{pack:TUSK_FACTS,now:date});
  if(!items.length)return null;
  const hits=[];
  for(const it of items.slice(0,2)){
    if(!it.sources || !it.sources.some(validSource))continue;
    hits.push({title:String(it.title||'').slice(0,110),description:plain((it.facts||[]).join(' ')).slice(0,340),url:it.sources.find(validSource),source:'RoamWise fact pack',checkedAt:it.checkedAt});
  }
  if(!hits.length)return null;
  return {available:true,source:'RoamWise verified facts',route:'curated',summary:dynamic?'Background guidance only. Live prices, availability and schedules require an up-to-date official or licensed source.':hits[0].description,hits,checkedAt:hits[0].checkedAt,requiresLiveVerification:dynamic};
}
function flag(env,name){return String(env&&env[name]||'').toLowerCase()==='true';}
export function useExactCache(env){return flag(env,'TUSK_EXACT_KV_ENABLED') && !!(env.RW_KV&&env.RW_KV.get&&env.RW_KV.put);}
const digest=async(s)=>{
 const bytes=new TextEncoder().encode(s), hash=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
};
export async function exactCacheKey(q,locale){
 return 'tusk-public-v1:'+await digest(normalizePublicQuery(q)+'|'+String(locale||'en').slice(0,10));
}
export async function getExactCache(env,q,locale,now=new Date()){
 if(!useExactCache(env) || isDynamicQuery(q))return null;
 try{
  const raw=await env.RW_KV.get(await exactCacheKey(q,locale));
  if(!raw)return null;
  const record=JSON.parse(raw);
  if(!record || record.cacheVersion!==1 || !['curated','approved-vector'].includes(record.route))return null;
  if(!record.checkedAt || record.checkedAt>now.toISOString().slice(0,10) || (record.validUntil && record.validUntil<now.toISOString().slice(0,10)))return null;
  if(!Array.isArray(record.hits) || !record.hits.every(h=>validSource(h.url)))return null;
  return {...record,cache:'exact'};
 }catch(e){return null;}
}
export async function putExactCache(env,q,locale,answer,now=new Date()){
 if(!useExactCache(env) || isDynamicQuery(q) || !answer || !['curated','approved-vector'].includes(answer.route))return false;
 if(!answer.checkedAt || answer.checkedAt>now.toISOString().slice(0,10))return false;
 if(!Array.isArray(answer.hits) || !answer.hits.length || !answer.hits.every(h=>validSource(h.url)))return false;
 const payload={...answer,cacheVersion:1};
 if(JSON.stringify(payload).length>6000)return false;
 try{await env.RW_KV.put(await exactCacheKey(q,locale),JSON.stringify(payload),{expirationTtl:Math.max(60,Math.min(86400,Number(env.TUSK_KV_TTL_SECONDS)||3600))});return true;}
 catch(e){return false;}
}
export function useVectorize(env){
 return flag(env,'TUSK_VECTOR_SEARCH_ENABLED') && !!(env.AI&&env.AI.run&&env.TUSK_VECTOR_INDEX&&env.TUSK_VECTOR_INDEX.query&&env.TUSK_KB_BUCKET&&env.TUSK_KB_BUCKET.get);
}
export async function approvedVectorMatch(env,question,{now=new Date()}={}){
 if(!useVectorize(env) || isDynamicQuery(question))return null;
 try{
  // One embedding per uncached public query. No embedding writes on requests.
  const output=await env.AI.run(EMBEDDING_MODEL,{text:[question.slice(0,MAX_QUESTION)]});
  const vec=output&&output.data&&output.data[0];
  if(!Array.isArray(vec) || vec.length!==1024 || vec.some(x=>!Number.isFinite(x)))return null;
  const matches=await env.TUSK_VECTOR_INDEX.query(vec,{topK:3,returnMetadata:'all'});
  for(const match of matches&&matches.matches||[]){
    const id=String(match.id||'');
    const metadata=match.metadata||{};
    // No universal "85% correctness": first require index AND record approval
    // and at least one lexical token shared with approved title/keywords.
    const min=Math.max(0.7,Math.min(0.99,Number(env.TUSK_VECTOR_MIN_SCORE)||0.87));
    if(!ID_RE.test(id)||Number(match.score)<min||metadata.approved!==true)continue;
    if(!lexicalMatch(question, String(metadata.title||'')+' '+String(metadata.keywords||'')))continue;
    const obj=await env.TUSK_KB_BUCKET.get('tusk-approved/v1/'+id+'.json');
    if(!obj)continue;
    const doc=await obj.json();
    if(doc.id!==id || !recordValid(doc,now))continue;
    if(!lexicalMatch(question,doc.title+' '+String(doc.keywords||'')))continue;
    return {available:true,route:'approved-vector',source:'RoamWise approved knowledge',summary:plain(doc.summary).slice(0,650),
      hits:doc.sources.slice(0,3).map(url=>({title:doc.title.slice(0,110),description:plain(doc.summary).slice(0,280),url,source:'Approved primary source',checkedAt:doc.checkedAt})),
      checkedAt:doc.checkedAt,validUntil:doc.validUntil||null,score:Math.round(Number(match.score)*1000)/1000,requiresLiveVerification:false};
  }
 }catch(e){/* Optional index not ready, wrong dimensions, AI quota, R2 unavailable. Skip safely. */}
 return null;
}
export const status = (env) => ({
  curated:true,
  exactCache:useExactCache(env),
  semantic:useVectorize(env),
  liveBrave:flag(env,'TUSK_WEB_SEARCH_ENABLED')&&!!env.BRAVE_SEARCH_API_KEY,
  automaticWebIngestion:false,
  publicQueryOnly:true,
  automaticPaidGrounding:false
});
