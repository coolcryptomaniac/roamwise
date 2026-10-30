// Cloudflare Workers-compatible Cashfree webhook verification.
// Verify the original request bytes before parsing JSON. No Node.js crypto imports.
export async function verifyCashfreeWorkerWebhook({rawBody,headers,secret,now=()=>Date.now(),maxClockSkewSeconds=300}) {
 if (!(rawBody instanceof ArrayBuffer || rawBody instanceof Uint8Array) ||
     typeof secret!=='string' || secret.length<16 || !headers ||
     !Number.isSafeInteger(maxClockSkewSeconds) || maxClockSkewSeconds<0) return false;
 const get=(name)=>typeof headers.get==='function'?headers.get(name):Object.entries(headers).find(([k])=>k.toLowerCase()===name)?.[1];
 const timestamp=get('x-webhook-timestamp'),signature=get('x-webhook-signature');
 if(typeof timestamp!=='string'||!/^\d{10}$/.test(timestamp)||
    typeof signature!=='string'||!/^[A-Za-z0-9+/]{43}=$/.test(signature)) return false;
 if(Math.abs(now()/1000-Number(timestamp))>maxClockSkewSeconds)return false;
 const body=rawBody instanceof Uint8Array?rawBody:new Uint8Array(rawBody);
 const prefix=new TextEncoder().encode(timestamp);
 const message=new Uint8Array(prefix.length+body.length);
 message.set(prefix);message.set(body,prefix.length);
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const digest=new Uint8Array(await crypto.subtle.sign('HMAC',key,message));
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
 let encoded='';
 for(let i=0;i<digest.length;i+=3){
  const n=(digest[i]<<16)|((digest[i+1]||0)<<8)|(digest[i+2]||0);
  encoded+=alphabet[(n>>>18)&63]+alphabet[(n>>>12)&63]+(i+1<digest.length?alphabet[(n>>>6)&63]:'=')+(i+2<digest.length?alphabet[n&63]:'=');
 }
 // Compare complete, fixed-length encoded digests without early exit.
 let diff=encoded.length^signature.length;
 for(let i=0;i<encoded.length;i++)diff|=encoded.charCodeAt(i)^signature.charCodeAt(i);
 return diff===0;
}
