/* Explicit-ID, bounded, opt-in Firestore -> KV sync. Never scans collections.
 * Public display projection is field-allowlisted; Firebase remains authoritative.
 */
import {getServiceAccountAccessToken,parseServiceAccount} from './service-account.js';
import {getDoc} from './firestore-rest.js';
import {cacheKey,updatePublicDisplayCache} from './cloudflare-public-cache.js';
export function parseSyncTargets(raw){
 if(typeof raw!=='string'||raw.length>4000)return [];
 let arr;try{arr=JSON.parse(raw);}catch{return [];}
 if(!Array.isArray(arr)||arr.length>10)return [];
 const keys=new Set(),out=[];
 for(const item of arr){
  if(!item||typeof item!=='object')return [];
  try{
   const key=cacheKey(item.collection,item.id);
   if(keys.has(key))return [];
   keys.add(key);out.push({collection:item.collection,id:item.id});
  }catch{return [];}
 }
 return out;
}
export async function syncApprovedPublicTargets(env){
 if(env.PUBLIC_DISPLAY_SYNC_ENABLED!=='true')return {status:'disabled',processed:0};
 if(!env.RW_KV?.put||!env.RW_KV?.delete)return {status:'missing_kv',processed:0};
 const targets=parseSyncTargets(env.PUBLIC_DISPLAY_SYNC_TARGETS);
 if(!targets.length)return {status:'no_valid_targets',processed:0};
 const sa=parseServiceAccount(env);
 const token=await getServiceAccountAccessToken(env);
 let processed=0,removed=0;
 for(const {collection,id} of targets){
  // Fail closed on Firestore errors. Do not overwrite cached data on transient source failure.
  const doc=await getDoc(env,token,sa.project_id,`${collection}/${id}`);
  const result=await updatePublicDisplayCache(env.RW_KV,collection,id,doc);
  processed++;if(result==='removed')removed++;
 }
 return {status:'completed',processed,removed};
}
