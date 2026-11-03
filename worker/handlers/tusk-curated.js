/* Public, read-only curated Tusk knowledge. Only server-approved records leave
   Firestore; never expose owner contacts, draft listings, or admin fields.
   Optional AI_USAGE KV cache reduces repeated Firestore reads. */
import { json } from '../lib/http.js';
import { getDoc } from '../lib/firestore-rest.js';
import { parseServiceAccount, getServiceAccountAccessToken } from '../lib/service-account.js';
import { overLimit, clientIp } from '../lib/rate-limit.js';

const ID=/^[a-z0-9][a-z0-9_-]{1,79}$/;
const FIELDS={
  destination:['name','state','country','summary','highlights','bestSeason','culture','transportTips','safetyTips','updatedAt'],
  property:['name','destination','city','state','summary','amenities','category','priceFrom','currency','publicUrl','updatedAt']
};
const PATHS={destination:'tusk_destinations',property:'verified_properties'};
function safeRecord(type,doc){
  if(!doc || doc.verified!==true || doc.published!==true) return null;
  const out={};
  for(const key of FIELDS[type]){
    const value=doc[key];
    if(value==null)continue;
    if(typeof value==='string')out[key]=value.slice(0,1200);
    else if(typeof value==='number' && Number.isFinite(value))out[key]=value;
    else if(Array.isArray(value))out[key]=value.filter(v=>typeof v==='string').slice(0,12).map(v=>v.slice(0,120));
  }
  return out.name?out:null;
}
export async function handleTuskCurated(request,env,cacheImpl){
  const url=new URL(request.url),type=url.searchParams.get('type')||'destination';
  const id=String(url.searchParams.get('id')||'').toLowerCase();
  if(!FIELDS[type] || !ID.test(id))return json({hit:false},400);
  if(await overLimit('tusk-curated',clientIp(request),90,600,cacheImpl))return json({hit:false},429);
  const key='tusk-curated:v1:'+type+':'+id;
  try{
    if(env.AI_USAGE&&typeof env.AI_USAGE.get==='function'){
      const cached=await env.AI_USAGE.get(key,'json');
      if(cached && cached.v===1)return json({hit:!!cached.data,data:cached.data||null,cached:true});
    }
    const sa=parseServiceAccount(env);
    const token=await getServiceAccountAccessToken(env);
    const doc=await getDoc(env,token,sa.project_id,PATHS[type]+'/'+id);
    const data=safeRecord(type,doc);
    if(env.AI_USAGE&&typeof env.AI_USAGE.put==='function')
      await env.AI_USAGE.put(key,JSON.stringify({v:1,data}),{expirationTtl:data?3600:300});
    return json({hit:!!data,data:data||null,cached:false});
  }catch(e){return json({hit:false,error:'knowledge_temporarily_unavailable'},503);}
}
