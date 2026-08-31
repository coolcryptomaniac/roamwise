const enc=new TextEncoder();
async function hmacBytes(secret,message,hash='SHA-256'){var key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(message)))}
function hex(bytes){return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('')}
function b64(bytes){var s='';for(var b of bytes)s+=String.fromCharCode(b);return btoa(s)}
function constant(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;var x=0;for(var i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}

export async function verifyRazorpay(raw,headers,env){var sig=headers.get('x-razorpay-signature');if(!env.RAZORPAY_WEBHOOK_SECRET||!sig)return false;return constant(hex(await hmacBytes(env.RAZORPAY_WEBHOOK_SECRET,raw)),sig)}
export async function verifyCashfree(raw,headers,env){var sig=headers.get('x-webhook-signature'),ts=headers.get('x-webhook-timestamp');if(!env.CASHFREE_WEBHOOK_SECRET||!sig||!ts)return false;return constant(b64(await hmacBytes(env.CASHFREE_WEBHOOK_SECRET,ts+raw)),sig)}
export async function verifyStripe(raw,headers,env){var header=headers.get('stripe-signature');if(!env.STRIPE_WEBHOOK_SECRET||!header)return false;var parts={};header.split(',').forEach(function(p){var i=p.indexOf('=');if(i>0){var k=p.slice(0,i),v=p.slice(i+1);(parts[k]||(parts[k]=[])).push(v)}});var t=Number((parts.t||[])[0]||0);if(!t||Math.abs(Date.now()/1000-t)>300)return false;var expected=hex(await hmacBytes(env.STRIPE_WEBHOOK_SECRET,t+'.'+raw));return (parts.v1||[]).some(v=>constant(v,expected))}

/* Instamojo's payment-request webhook uses a SHA-1 HMAC over the values of
 * all form fields except `mac`, sorted case-insensitively by key. */
export async function verifyInstamojo(form,env){
  if(!env.INSTAMOJO_WEBHOOK_SALT||!form||!form.mac)return false;
  var keys=Object.keys(form).filter(k=>k!=='mac').sort((a,b)=>a.toLowerCase().localeCompare(b.toLowerCase()));
  var message=keys.map(k=>String(form[k]??'')).join('|');
  var expected=hex(await hmacBytes(env.INSTAMOJO_WEBHOOK_SALT,message,'SHA-1'));
  return constant(expected,String(form.mac));
}

async function paypalToken(env){var base=String(env.PAYPAL_ENV||'sandbox')==='live'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';var auth=btoa(env.PAYPAL_CLIENT_ID+':'+env.PAYPAL_CLIENT_SECRET),r=await fetch(base+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+auth,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials'});if(!r.ok)throw new Error('PayPal OAuth '+r.status);var j=await r.json();return{base,token:j.access_token}}
export async function verifyPayPal(event,headers,env){if(!env.PAYPAL_CLIENT_ID||!env.PAYPAL_CLIENT_SECRET||!env.PAYPAL_WEBHOOK_ID)return false;var a=await paypalToken(env),body={auth_algo:headers.get('paypal-auth-algo'),cert_url:headers.get('paypal-cert-url'),transmission_id:headers.get('paypal-transmission-id'),transmission_sig:headers.get('paypal-transmission-sig'),transmission_time:headers.get('paypal-transmission-time'),webhook_id:env.PAYPAL_WEBHOOK_ID,webhook_event:event};var r=await fetch(a.base+'/v1/notifications/verify-webhook-signature',{method:'POST',headers:{Authorization:'Bearer '+a.token,'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)return false;var j=await r.json();return j.verification_status==='SUCCESS'}
