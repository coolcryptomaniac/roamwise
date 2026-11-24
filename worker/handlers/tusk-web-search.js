/* RoamWise public web discovery. Source-first, strict public-query scope.
 * 1: approved exact KV, 2: RoamWise reviewed facts, 3: optional Vectorize/R2,
 * 4: optional licensed Brave Search. No scraping, automatic publishing or LLM
 * synthesis from third-party snippets. Default route uses zero paid calls. */
import { json } from '../lib/http.js';
import { atlasAnswer } from '../lib/tusk-atlas-answer.js';
import { parsePublicQuery, isDynamicQuery, curatedMatches, getExactCache, putExactCache,
  approvedVectorMatch, status } from '../lib/tusk-hybrid-knowledge.js';

async function liveSearch(env,query){
 if(!status(env).liveBrave)return null;
 const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),6500);
 try{
  const url='https://api.search.brave.com/res/v1/web/search?q='+encodeURIComponent(query)+'&count=4&country=IN&safesearch=strict';
  const response=await fetch(url,{headers:{Accept:'application/json','X-Subscription-Token':env.BRAVE_SEARCH_API_KEY},signal:controller.signal});
  if(!response.ok)return null;
  const data=await response.json();
  const hits=(data.web&&Array.isArray(data.web.results)?data.web.results:[])
    .slice(0,4).filter(x=>{try{const u=new URL(x.url);return u.protocol==='https:'&&!u.username&&!u.password;}catch(e){return false;}})
    .map(x=>({title:String(x.title||'').replace(/<[^>]*>/g,'').slice(0,140),
      url:x.url,description:String(x.description||'').replace(/<[^>]*>/g,'').slice(0,240),source:'Brave Search'}));
  return hits.length?{available:true,source:'Brave Search',route:'live-links',summary:'Live search results are sources to verify, not a verified synthesized answer.',hits,
    checkedAt:new Date().toISOString(),requiresLiveVerification:true,cache:'none'}:null;
 }catch(e){return null;}
 finally{clearTimeout(timeout);}
}
export async function handleTuskWebSearch(request,env){
 if(request.method!=='GET')return json({error:'Method not allowed'},405);
 const url=new URL(request.url);
 if(url.searchParams.get('capabilities')==='1')return json({available:true,capabilities:status(env)});
 const query=parsePublicQuery(url.searchParams.get('q')||'');
 if(!query)return json({error:'Only a short public question is allowed. Do not send private contact details, phone numbers, passwords or tokens.'},400);
 const lang=String(url.searchParams.get('lang')||'en-IN').slice(0,10);
 const dynamic=isDynamicQuery(query);
 // Exact public cache is an opt-in optimisation. Never reuse for live prices,
 // schedule, availability, safety status or user-specific answers.
 const cached=dynamic?null:await getExactCache(env,query,lang);
 if(cached)return json({...cached,query,cache:'exact'});
 const curated=curatedMatches(query);
 // Atlas covers itineraries, food, culture, photo references and notable people.
 // Do not bypass the existing curated policy on live/price/safety questions.
 const atlas=atlasAnswer(query);
 const atlasIntent=/\b(?:itinerary|itineraries|plan|trip|days|food|eat|cuisine|dishes|photo|picture|image|people|notable|famous|culture|attractions|things to do)\b|यात्रा|खाना|भोजन|फोटो|तस्वीर|प्रसिद्ध/i.test(query);
 if(atlas&&atlasIntent&&!dynamic)return json({...atlas,query});
 if(curated && !dynamic){
   await putExactCache(env,query,lang,curated);
   return json({...curated,query,cache:'none'});
 }
 // Bare place queries also resolve locally without paid model inference.
 if(atlas&&!dynamic)return json({...atlas,query});
 const semantic=dynamic?null:await approvedVectorMatch(env,query);
 if(semantic){
   await putExactCache(env,query,lang,semantic);
   return json({...semantic,query,cache:'none'});
 }
 // On dynamic questions check the provider first; a stale curated fact must
 // never be presented as current availability or a live ticket quote.
 const live=url.searchParams.get('localOnly')==='1'?null:await liveSearch(env,query);
 if(live)return json({...live,query,context:curated||undefined});
 if(curated)return json({...curated,query,cache:'none',requiresLiveVerification:true,
   note:'No live source connected. Background information only; verify with the official site.'});
 if(atlas)return json({...atlas,query,requiresLiveVerification:true,note:'Editorial context only; live conditions and bookings require official verification.'});
 return json({available:false,route:'not-configured',query,hits:[],requiresLiveVerification:true,
   error:'No validated answer is available. Live search requires explicit provider configuration.'},503);
}
