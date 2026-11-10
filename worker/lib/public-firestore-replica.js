/* Safe public-only Firestore -> Cloudflare KV replica.
 * This is an opt-in read cache, not an authoritative store.
 * Only copy records explicitly marked approvedForPublic=true.
 * Never cache availability, prices without expiry, personal data, financial records.
 */
export const PUBLIC_REPLICA_COLLECTIONS=Object.freeze(['destinations','publicProperties','publicCreators','publicExperiences']);
const FIELDS=Object.freeze({
 destinations:['name','region','description','heroImage','tags','updatedAt'],
 publicProperties:['name','region','description','publicImage','amenities','publicSlug','updatedAt'],
 publicCreators:['displayName','region','bio','publicSlug','portfolioImage','updatedAt'],
 publicExperiences:['title','region','summary','publicImage','publicSlug','updatedAt']
});
const SAFE_ID=/^[a-zA-Z0-9_-]{1,100}$/;
export function publicReplicaKey(collection,id){
 if(!FIELDS[collection]||!SAFE_ID.test(id||''))throw new Error('invalid_public_replica_key');
 return 'public-replica:v1:'+collection+':'+id;
}
export function sanitizePublicRecord(collection,id,record){
 publicReplicaKey(collection,id);
 if(!record||record.approvedForPublic!==true||record.visibility!=='public')return null;
 const out={id,collection};
 for(const field of FIELDS[collection]){
  const v=record[field];
  if(typeof v==='string'&&v.length<=2500)out[field]=v;
  else if(Array.isArray(v)&&v.length<=20&&v.every(x=>typeof x==='string'&&x.length<=80))out[field]=v;
 }
 return out;
}
export async function publishPublicReplica({kv,collection,id,record,ttlSeconds=3600}){
 if(!kv?.put||!kv?.delete)throw new Error('kv_binding_missing');
 const key=publicReplicaKey(collection,id);
 const sanitized=sanitizePublicRecord(collection,id,record);
 if(!sanitized){await kv.delete(key);return {status:'removed'};}
 if(ttlSeconds<300||ttlSeconds>86400)throw new Error('invalid_ttl');
 await kv.put(key,JSON.stringify({data:sanitized,cachedAt:new Date().toISOString()}),{expirationTtl:ttlSeconds});
 return {status:'cached'};
}
export async function readPublicReplica({kv,collection,id}){
 if(!kv?.get)return null;
 const raw=await kv.get(publicReplicaKey(collection,id));
 if(!raw)return null;
 try{
  const doc=JSON.parse(raw);
  if(!doc?.data||doc.data.collection!==collection||doc.data.id!==id)return null;
  return doc.data;
 }catch{return null;}
}
