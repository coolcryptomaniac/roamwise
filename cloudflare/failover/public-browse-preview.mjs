/* Independent, opt-in preview gateway for public browsing only.
 * This is NOT a transparent production failover or payment/auth proxy.
 * No cookies, query parameters, private paths or request bodies cross origins. */
const ROUTES=new Set(['/guides/','/itinerary-library/','/team/','/more/']);
const MARKER={'/guides/':/RoamWise/i,'/itinerary-library/':/RoamWise/i,'/team/':/RoamWise/i,'/more/':/RoamWise/i};
function origin(value){
 const u=new URL(value);
 if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw Error('Invalid origin');
 if(!['roamwise.co.in','www.roamwise.co.in','roamwise-web.pages.dev','coolcryptomaniac.github.io'].includes(u.hostname))throw Error('Unexpected origin');
 return u;
}
async function healthy(fetcher,base,path){
 try{
  const response=await fetcher(new URL(path,base),{method:'GET',redirect:'manual',headers:{accept:'text/html'},signal:AbortSignal.timeout(3500)});
  if(response.status!==200)return false;
  if(response.url&&new URL(response.url).origin!==base.origin)return false;
  const contentType=response.headers.get('content-type')||'';
  if(!contentType.includes('text/html'))return false;
  // Do not buffer arbitrary large origin responses.
  const reader=response.body?.getReader();
  if(!reader)return false;
  let text='',bytes=0;
  try{
   while(bytes<32768){
    const {value,done}=await reader.read();if(done)break;
    bytes+=value.byteLength;text+=new TextDecoder().decode(value);
    if(MARKER[path].test(text))return true;
   }
   return false;
  }finally{await reader.cancel().catch(()=>{});}
 }catch(_){return false;}
}
export async function choosePublicOrigin(request,env,fetcher=fetch){
 const url=new URL(request.url);
 if(request.method!=='GET'||url.search||!ROUTES.has(url.pathname)||request.headers.has('authorization')||request.headers.has('cookie'))return new Response('Public browsing only; use the normal RoamWise website for accounts and bookings.',{status:403,headers:{'cache-control':'no-store'}});
 if(env.PUBLIC_FAILOVER_ENABLED!=='true')return new Response('Preview failover disabled',{status:503,headers:{'cache-control':'no-store'}});
 try{
  const primary=origin(env.PRIMARY_ORIGIN),backup=origin(env.BACKUP_ORIGIN);
  if(primary.origin===backup.origin||[primary.origin,backup.origin].includes(url.origin))throw Error('Origins must be independent');
  for(const base of [primary,backup]){
   if(await healthy(fetcher,base,url.pathname))return new Response(null,{status:302,headers:{location:new URL(url.pathname,base).href,'cache-control':'no-store','referrer-policy':'no-referrer'}});
  }
 }catch(_){}
 return new Response('Public browsing temporarily unavailable. No booking or payment has been attempted.',{status:503,headers:{'cache-control':'no-store'}});
}
export default {fetch(request,env){return choosePublicOrigin(request,env);}};
