import seed from '../../design/catalogue.json' with { type: 'json' };
import schema from '../../design/catalogue-core.js';
import { CORS } from '../lib/http.js';

export const DESIGN_CATALOGUE_KEY = 'design:catalogue:' + seed.version;
/* Read-only runtime. Only the reviewed main-branch publisher writes design:* keys. */
export async function handleDesignCatalogue(request, env){
  if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:{...CORS,Allow:'GET'}});
  let catalogue=seed,storage='bundled';
  try{
    const stored=await env.RW_KV?.get(DESIGN_CATALOGUE_KEY,'json');
    if(schema.validate(stored)&&stored.version===seed.version){catalogue=stored;storage='kv';}
  }catch(e){/* The design must survive a storage outage. */}
  return new Response(JSON.stringify({catalogue,storage}),{headers:{...CORS,'Content-Type':'application/json','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'}});
}
