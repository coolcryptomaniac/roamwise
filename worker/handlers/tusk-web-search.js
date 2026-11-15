/* Optional provider-backed lookup for Ailon Tusk when managed AI fails.
 * Disabled by default. Secret is Worker-only, never exposed to browsers.
 * This returns linked source snippets, NOT a synthesized verified answer. */
import { json } from '../lib/http.js';
export async function handleTuskWebSearch(request,env){
 if(request.method!=='GET')return json({error:'Method not allowed'},405);
 if(String(env.TUSK_WEB_SEARCH_ENABLED||'').toLowerCase()!=='true'||!env.BRAVE_SEARCH_API_KEY)
   return json({available:false,error:'Web search is not configured.'},503);
 const q=new URL(request.url).searchParams.get('q')||'';
 const query=q.replace(/\s+/g,' ').trim().slice(0,180);
 if(query.length<5||query.length>180||/[\r\n<>]/.test(q)||/\b[\w.+-]+@[\w.-]+\.[A-Z]{2,}\b/i.test(query))
   return json({error:'Enter a short public question without private details.'},400);
 if(/(?:\+?\d[\d\s()-]{9,}\d)/.test(query))
   return json({error:'Do not include phone numbers in public web searches.'},400);
 const url='https://api.search.brave.com/res/v1/web/search?q='+encodeURIComponent(query)+'&count=4&country=IN&safesearch=strict';
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),6500);
 try{
  const r=await fetch(url,{headers:{Accept:'application/json','X-Subscription-Token':env.BRAVE_SEARCH_API_KEY},signal:controller.signal});
  if(!r.ok)return json({available:false,error:'Search provider temporarily unavailable.'},503);
  const d=await r.json();
  const hits=(d.web&&Array.isArray(d.web.results)?d.web.results:[])
    .slice(0,4).filter(x=>{try{return new URL(x.url).protocol==='https:';}catch{return false;}})
    .map(x=>({title:String(x.title||'').slice(0,140),url:x.url,description:String(x.description||'').replace(/<[^>]*>/g,'').slice(0,240),source:'Brave Search'}));
  return json({available:true,source:'Brave Search',query:query,hits:hits,checkedAt:new Date().toISOString()});
 }catch(e){return json({available:false,error:'Search timed out or is unavailable.'},503);}
 finally{clearTimeout(timeout);}
}
