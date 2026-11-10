import {readPublicDisplayCache,cacheKey} from '../lib/cloudflare-public-cache.js';
export async function handlePublicDisplayCache(request,env,collection,id){
 if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:{'Cache-Control':'no-store'}});
 if(env.PUBLIC_DISPLAY_CACHE_ENABLED!=='true')return Response.json({error:'not_enabled'},{status:404,headers:{'Cache-Control':'no-store'}});
 try{cacheKey(collection,id);}catch{return Response.json({error:'invalid_key'},{status:400,headers:{'Cache-Control':'no-store'}});}
 const data=await readPublicDisplayCache(env.RW_KV,collection,id);
 if(!data)return Response.json({error:'not_cached'},{status:404,headers:{'Cache-Control':'no-store'}});
 return Response.json(data,{headers:{'Cache-Control':'public, max-age=60, stale-while-revalidate=60','X-RoamWise-Source':'cloudflare-kv-public-display','X-Content-Type-Options':'nosniff'}});
}
