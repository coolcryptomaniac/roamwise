/* RoamWise public knowledge reader — independent, read-only Worker.
 * Deploy ONLY to a dedicated preview Worker with dedicated D1/R2 bindings.
 * Absolutely no Firebase users, supplier net rates, customer chats or payments.
 * Both D1 schemas under knowledge/schema/ must be installed on a NEW database.
 */
const JSON_HEADERS={ 'content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff' };
const LICENSES=['owned','licensed','public-domain'];
const IMG_TYPES=['image/avif','image/webp','image/jpeg','image/png'];
function response(body,status=200,headers={}){
 return new Response(JSON.stringify(body),{status,headers:{...JSON_HEADERS,'cache-control':'public, max-age=120',...headers}});
}
function safeQuery(value){
 const s=String(value||'').trim().replace(/\s+/g,' ');
 return s.length>=2 && s.length<=80 && !/[\x00-\x1F<>]/.test(s) ? s:null;
}
function safeSlug(s){ return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s||'') && s.length<=96; }
function approved(row){
 return !!(row && row.status==='published' && row.indexed===1 && row.human_approved_at);
}
function mediaApproved(row){
 return !!(row && row.status==='published' && LICENSES.includes(row.rights_status)
   && typeof row.license_proof==='string' && row.license_proof.trim().length>=12
   && row.reviewed_at && row.published_at && row.r2_key
   && /^[a-zA-Z0-9_-]{1,96}$/.test(row.id)
   && typeof row.alt_text==='string' && row.alt_text.trim()
   && IMG_TYPES.includes(row.mime_type)
   && row.size_bytes>0 && row.size_bytes<=4*1024*1024);
}
function allowedOrigin(origin,env){
 if(!origin)return null;
 const allowed=String(env.PUBLIC_ALLOWED_ORIGINS||'https://roamwise-web.pages.dev,https://roamwise.co.in,https://www.roamwise.co.in,https://roamwise.tech').split(',').map(s=>s.trim());
 return allowed.includes(origin)?origin:null;
}
function corsHeaders(request,env){
 const origin=allowedOrigin(request.headers.get('origin'),env);
 return origin?{'access-control-allow-origin':origin,'vary':'Origin'}:{'vary':'Origin'};
}
function cleanCanonical(value){
 try{
  const u=new URL(String(value));
  if((u.hostname==='roamwise.co.in'||u.hostname==='www.roamwise.co.in')
    && u.protocol==='https:' && u.pathname.startsWith('/places/'))return u.href;
 }catch(_e){}
 return null;
}
async function searchDestination(db,term){
 // Escape LIKE wildcard characters: a search term must not turn into a full table scan.
 const like='%'+term.replace(/[\\%_]/g,'\\$&')+'%';
 const rows=await db.prepare(`SELECT id, slug, name, country_iso, region, summary, canonical_url, human_approved_at,
 status, indexed FROM public_destination
 WHERE status='published' AND indexed=1 AND human_approved_at IS NOT NULL
 AND (next_review_at IS NULL OR date(next_review_at)>=date('now'))
 AND (name LIKE ? ESCAPE '\\' OR slug LIKE ? ESCAPE '\\')
 ORDER BY name LIMIT 12`).bind(like,like).all();
 return (rows.results||[]).filter(approved).map(r=>({
   id:r.id,slug:r.slug,name:r.name,country:r.country_iso,region:r.region||null,
   summary:r.summary||'',url:cleanCanonical(r.canonical_url),reviewedAt:r.human_approved_at
 }));
}
async function getDestination(db,slug){
 const row=await db.prepare(`SELECT id, slug, name, country_iso, region, summary, canonical_url,
 human_approved_at, source_checked_at, status, indexed FROM public_destination
 WHERE slug=? AND status='published' AND indexed=1 AND human_approved_at IS NOT NULL
 AND (next_review_at IS NULL OR date(next_review_at)>=date('now')) LIMIT 1`).bind(slug).first();
 if(!approved(row))return null;
 const faqs=await db.prepare(`SELECT question,answer,reviewed_at FROM public_destination_faq
 WHERE destination_id=? AND status='published' AND reviewed_at IS NOT NULL
 AND (valid_until IS NULL OR date(valid_until)>=date('now')) LIMIT 12`).bind(row.id).all();
 const itineraries=await db.prepare(`SELECT id,title,days,itinerary_json,approved_at FROM public_destination_itinerary
 WHERE destination_id=? AND status='published' AND approved_by IS NOT NULL AND approved_at IS NOT NULL
 ORDER BY days LIMIT 6`).bind(row.id).all();
 const items=(itineraries.results||[]).map(x=>{
   let value=null;
   try{value=JSON.parse(x.itinerary_json)}catch(_e){}
   return value?{id:x.id,title:x.title,days:x.days,plan:value,reviewedAt:x.approved_at}:null;
 }).filter(Boolean);
 return {id:row.id,slug:row.slug,name:row.name,country:row.country_iso,
 region:row.region||null,summary:row.summary||'',url:cleanCanonical(row.canonical_url),
 humanReviewedAt:row.human_approved_at,sourceCheckedAt:row.source_checked_at,
 faq:(faqs.results||[]).map(x=>({question:x.question,answer:x.answer,reviewedAt:x.reviewed_at})),
 itineraries:items,pricesVerified:false,availabilityVerified:false};
}
function mediaOrigin(env){
 const s=String(env.PUBLIC_MEDIA_ORIGIN||'').replace(/\/$/,'');
 return s==='https://assets.roamwise.co.in'?s:null;
}
async function getMediaIndex(db,env){
 const origin=mediaOrigin(env);
 if(!origin||!env.PUBLIC_MEDIA_BUCKET)return {version:1,assets:{},ready:false,reason:'media-service-not-configured'};
 const out={};
 const rows=await db.prepare(`SELECT m.id,m.destination_id,m.r2_key,m.alt_text,m.attribution,m.rights_status,
 m.license_proof,m.mime_type,m.size_bytes,m.status,m.reviewed_at,m.published_at,d.slug FROM public_destination_media m
 JOIN public_destination d ON d.id=m.destination_id
 WHERE m.status='published' AND m.rights_status IN ('owned','licensed','public-domain')
 AND length(trim(m.license_proof))>=12 AND m.r2_key IS NOT NULL
 AND m.reviewed_at IS NOT NULL AND m.published_at IS NOT NULL
 AND d.status='published' AND d.indexed=1 AND d.human_approved_at IS NOT NULL
 AND (d.next_review_at IS NULL OR date(d.next_review_at)>=date('now'))
 ORDER BY m.published_at DESC LIMIT 150`).all();
 for(const row of rows.results||[]){
  if(!safeSlug(row.slug)||!mediaApproved(row)||out[row.slug])continue;
  out[row.slug]={src:origin+'/media/'+encodeURIComponent(row.id),
   note:row.attribution||'RoamWise licensed destination image',
   alt:row.alt_text,rightsStatus:row.rights_status,status:'published',
   licenseProof:'verified-in-d1-editorial-ledger'};
 }
 return {version:1,assets:out,ready:true};
}
async function getMedia(db,bucket,id){
 if(!/^[a-zA-Z0-9_-]{1,96}$/.test(id))return new Response('Not found',{status:404});
 const row=await db.prepare(`SELECT id,r2_key,mime_type,size_bytes,rights_status,license_proof,status,reviewed_at,published_at,alt_text
 FROM public_destination_media WHERE id=? LIMIT 1`).bind(id).first();
 if(!mediaApproved(row))return new Response('Not found',{status:404});
 const file=await bucket.get(row.r2_key);
 if(!file||file.size>4*1024*1024)return new Response('Not found',{status:404});
 return new Response(file.body,{headers:{
  'content-type':row.mime_type,'x-content-type-options':'nosniff',
  'content-security-policy':"default-src 'none'; sandbox",
  'cache-control':'public, max-age=3600','cross-origin-resource-policy':'cross-origin',
  'access-control-allow-origin':'*','vary':'Accept-Encoding'
 }});
}
export default {
 async fetch(request,env){
  const url=new URL(request.url),path=url.pathname;
  const headers=corsHeaders(request,env);
  if(request.method==='OPTIONS'){
   return new Response(null,{status:204,headers:{...headers,'access-control-allow-methods':'GET, HEAD, OPTIONS','access-control-allow-headers':'content-type','access-control-max-age':'600'}});
  }
  if(request.method!=='GET'&&request.method!=='HEAD')return response({error:'method_not_allowed'},405,headers);
  if(path==='/health')return response({service:'roamwise-public-knowledge',ready:!!env.PUBLIC_KNOWLEDGE_DB,mediaReady:!!env.PUBLIC_MEDIA_BUCKET},200,{...headers,'cache-control':'no-store'});
  if(!env.PUBLIC_KNOWLEDGE_DB)return response({error:'knowledge_not_configured'},503,headers);
  try{
   if(path==='/v1/search'){
    const q=safeQuery(url.searchParams.get('q'));
    if(!q)return response({error:'query_must_be_2_to_80_characters'},400,headers);
    return response({version:1,items:await searchDestination(env.PUBLIC_KNOWLEDGE_DB,q),liveBooking:false},200,headers);
   }
   if(path==='/v1/media-manifest')return response(await getMediaIndex(env.PUBLIC_KNOWLEDGE_DB,env),200,headers);
   const dest=path.match(/^\/v1\/destinations\/([a-z0-9-]+)$/);
   if(dest){
    const slug=dest[1];if(!safeSlug(slug))return response({error:'invalid_slug'},400,headers);
    const row=await getDestination(env.PUBLIC_KNOWLEDGE_DB,slug);
    return row?response(row,200,headers):response({error:'not_found'},404,headers);
   }
   const media=path.match(/^\/media\/([a-zA-Z0-9_-]+)$/);
   if(media){
    if(!env.PUBLIC_MEDIA_BUCKET)return response({error:'media_not_configured'},503,headers);
    return getMedia(env.PUBLIC_KNOWLEDGE_DB,env.PUBLIC_MEDIA_BUCKET,media[1]);
   }
   return response({error:'not_found'},404,headers);
  }catch(_e){
   // Do not reveal SQL, bucket names or customer data to browsers.
   return response({error:'knowledge_temporarily_unavailable'},503,{...headers,'cache-control':'no-store'});
  }
 }
};
export {safeQuery,safeSlug,approved,mediaApproved,mediaOrigin,searchDestination,getDestination,getMediaIndex};
