/* Server-side curated knowledge. Only explicitly published records are exposed.
   Cache API reduces Firestore reads; this is NOT a live booking lookup. */
import { getDoc } from './firestore-rest.js';
const ID=/^[a-z0-9][a-z0-9_-]{1,79}$/;
const TYPES={destination:'destinations',property:'verified_properties'};
const TTL=3600;
function clean(v){return String(v||'').replace(/[<>]/g,'').trim().slice(0,400);}
export async function curatedAnswer(env,token,projectId,body){
  if(String(env.TUSK_CURATED_ENABLED||'').toLowerCase()!=='true')return null;
  const type=String(body.knowledgeType||''),id=String(body.knowledgeId||'').toLowerCase();
  if(!TYPES[type]||!ID.test(id))return null;
  const cacheKey=new Request('https://tusk-curated.invalid/v1/'+type+'/'+id);
  let doc=null;
  try{
    const cached=await caches.default.match(cacheKey);
    if(cached)doc=await cached.json();
  }catch(e){}
  if(!doc){
    doc=await getDoc(env,token,projectId,'tusk_curated_'+TYPES[type]+'/'+id);
    if(!doc||doc.published!==true||doc.verified!==true)return null;
    const safe={
      name:clean(doc.name),region:clean(doc.region),summary:clean(doc.summary),
      highlights:Array.isArray(doc.highlights)?doc.highlights.slice(0,8).map(clean):[],
      updatedAt:clean(doc.updatedAt),published:true,verified:true
    };
    if(type==='property'){
      safe.location=clean(doc.location);
      safe.bookingNote=clean(doc.bookingNote);
    }
    doc=safe;
    try{await caches.default.put(cacheKey,new Response(JSON.stringify(doc),{headers:{'Cache-Control':'public, max-age='+TTL}}));}catch(e){}
  }
  if(doc.published!==true||doc.verified!==true)return null;
  const parts=[doc.name,doc.region||doc.location,doc.summary,...(doc.highlights||[])].filter(Boolean);
  if(type==='property')parts.push(doc.bookingNote||'Ask the property to confirm availability, total price and booking terms.');
  else parts.push('Check current road conditions, weather and opening hours before travel.');
  return {text:parts.join('\n'),route:'firestore-curated',cached:true,verified:true,updatedAt:doc.updatedAt||null};
}
