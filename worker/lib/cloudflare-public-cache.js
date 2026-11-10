/* Cloudflare-first, approved public display-only cache. Never source of truth. */
export const CACHE_COLLECTIONS=Object.freeze(['destinations','publicProperties','publicCreators','publicExperiences']);
const fields={
 destinations:['name','region','description','heroImage','tags'],
 publicProperties:['name','region','description','publicImage','amenities','publicSlug'],
 publicCreators:['displayName','region','bio','portfolioImage','publicSlug'],
 publicExperiences:['title','region','summary','publicImage','publicSlug']
};
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(id);
export function cacheKey(collection,id){
 if(!fields[collection]||!validId(id))throw new Error('invalid_public_cache_key');
 return 'public-display:v1:'+collection+':'+id;
}
export function projectPublicDisplay(collection,id,source){
 cacheKey(collection,id);
 if(!source||source.approvedForPublic!==true||source.visibility!=='public')return null;
 const out={id};
 for(const key of fields[collection]){
  const value=source[key];
  if(typeof value==='string'&&value.length<=1000)out[key]=value;
  if(Array.isArray(value)&&value.length<=15&&value.every(x=>typeof x==='string'&&x.length<=80))out[key]=value;
 }
 return out;
}
export async function updatePublicDisplayCache(kv,collection,id,source){
 if(!kv?.put||!kv?.delete)throw new Error('cache_not_configured');
 const key=cacheKey(collection,id);
 const record=projectPublicDisplay(collection,id,source);
 if(!record){await kv.delete(key);return 'removed';}
 await kv.put(key,JSON.stringify(record),{expirationTtl:3600});
 return 'cached';
}
export async function readPublicDisplayCache(kv,collection,id){
 if(!kv?.get)return null;
 const raw=await kv.get(cacheKey(collection,id));
 if(!raw)return null;
 try{const data=JSON.parse(raw);return data?.id===id?data:null;}catch{return null;}
}
