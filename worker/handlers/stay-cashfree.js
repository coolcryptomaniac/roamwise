/* Accommodation-only, pay-first Cashfree checkout on the existing roamwise-api Worker.
   Orders are NOT Pro entitlements. Amounts are calculated here, never accepted from the client. */
import { json } from '../lib/http.js';
import { verifyCashfreeWorkerWebhook } from '../lib/cashfree-booking-webhook-verify.js';
const RATE={
 nanau:{name:'Nanau Resort & Spa · Sitabani Studio CP',net:5500,taxIncluded:true,from:'2026-11-07',until:'2027-03-31'},
 padma:{name:'Padma Villa · Royal Chamber EP',net:5000,taxIncluded:true,from:'2026-11-07',until:'2027-03-31'},
 aramness:{name:'Aramness Gir · Kothi AP',net:72216,taxIncluded:true,from:'2026-11-07',until:'2027-02-28'},
 tattwaa:{name:'Tattwaa Corbett · Forest Room CPAI + hi-tea (provisional)',net:5500,taxIncluded:true,from:'2026-11-07',until:'2027-03-31'}
};
const CF=env=>String(env.CASHFREE_ENV||'sandbox')==='live'?'https://api.cashfree.com':'https://sandbox.cashfree.com';
const headers=env=>({'content-type':'application/json','x-api-version':env.CASHFREE_API_VERSION||'2025-01-01','x-client-id':env.CASHFREE_APP_ID,'x-client-secret':env.CASHFREE_SECRET_KEY});
function price(body,env){
 const p=RATE[String(body.stay||'')];if(!p)throw Error('Unknown property');
 const start=String(body.checkin||''),end=String(body.checkout||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end))throw Error('Invalid dates');
 const a=Date.parse(start+'T00:00:00Z'),b=Date.parse(end+'T00:00:00Z'),n=(b-a)/86400000;
 if(!Number.isInteger(n)||n<1||n>14||a<Date.now()-86400000||start<p.from||end>p.until)throw Error('Stay dates unavailable');
 if(body.stay==='padma'&&start<='2027-01-10'&&end>'2026-12-18')throw Error('Peak dates need updated pricing');
 if(body.stay==='nanau'&&start<='2027-01-03'&&end>'2026-12-24')throw Error('Peak dates need updated pricing');
 const tax=0; // Amor confirmed on 7 Nov 2026 that all supplied rate-sheet rates are inclusive.

 const full=Math.ceil(p.net*n*1.25),percent=body.paymentType==='full'?100:body.paymentType==='advance'?25:0;
 if(!percent)throw Error('Choose advance or full payment');
 return {stay:body.stay,property:p.name,checkin:start,checkout:end,nights:n,guests:2,total:full,portion:percent,amount:Math.ceil(full*percent/100),currency:'INR'};
}
function kv(env){return env.RW_KV}
export async function createStayOrder(request,env){
 if(!env.CASHFREE_APP_ID||!env.CASHFREE_SECRET_KEY||!kv(env))return json({error:'stay_checkout_unavailable'},503);
 let b;try{b=await request.json()}catch(_){return json({error:'invalid_json'},400)}
 let quote;try{quote=price(b,env)}catch(e){return json({error:'invalid_quote',message:e.message},422)}
 const phone=String(b.phone||'').replace(/[\s()-]/g,''),email=String(b.email||'').trim();
 if(!/^\+?\d{10,15}$/.test(phone)||!/^\S+@\S+\.\S+$/.test(email))return json({error:'contact_required'},422);
 const id='rwstay_'+crypto.randomUUID().replace(/-/g,'');
 const record={...quote,id,email,phone,shareWithSupplier:b.shareWithSupplier===true,status:'payment_pending',confirmed:false,createdAt:new Date().toISOString()};
 await kv(env).put('stayorder:'+id,JSON.stringify(record),{expirationTtl:60*60*24*180});
 const body={order_id:id,order_amount:quote.amount,order_currency:'INR',customer_details:{customer_id:id,customer_phone:phone,customer_email:email},order_meta:{return_url:'https://roamwise.co.in/packages/amor-checkout.html?order_id='+id,notify_url:'https://roamwise-api.founder-f53.workers.dev/stays/cashfree/webhook'},order_note:(quote.property+' '+quote.checkin+' '+quote.checkout).slice(0,200)};
 let r,data;try{r=await fetch(CF(env)+'/pg/orders',{method:'POST',headers:{...headers(env),'x-idempotency-key':id},body:JSON.stringify(body)});data=await r.json()}catch(_){return json({error:'cashfree_unreachable'},502)}
 if(!r.ok||!data.payment_session_id||data.order_id!==id||Number(data.order_amount)!==quote.amount)return json({error:'cashfree_order_failed'},502);
 return json({paymentSessionId:data.payment_session_id,orderId:id,environment:CF(env).includes('sandbox')?'sandbox':'production',quote});
}
export async function stayOrderStatus(request,env,id){
 if(!/^rwstay_[a-f0-9]{32}$/.test(id)||!kv(env))return json({error:'invalid_order'},404);
 const record=await kv(env).get('stayorder:'+id,'json');if(!record)return json({error:'not_found'},404);
 let r,data;try{r=await fetch(CF(env)+'/pg/orders/'+id,{headers:headers(env)});data=await r.json()}catch(_){return json({error:'cashfree_unreachable'},502)}
 if(!r.ok||data.order_id!==id||data.order_currency!=='INR'||Number(data.order_amount)!==record.amount)return json({error:'payment_verification_failed'},409);
 const paid=data.order_status==='PAID';
 if(paid&&record.status!=='paid_pending_confirmation'){record.status='paid_pending_confirmation';record.paidAt=new Date().toISOString();await kv(env).put('stayorder:'+id,JSON.stringify(record),{expirationTtl:60*60*24*180})}
 return json({orderId:id,status:paid?'paid_pending_confirmation':data.order_status,confirmed:false});
}

const bookingRecipient='sales@amorhospitality.in';
async function alertSupplier(env,record){
 if(!env.AGENTMAIL_API_KEY||!env.AGENTMAIL_INBOX_BUSINESS)return {sent:false,reason:'notification_provider_unconfigured'};
 if(record.supplierNotifiedAt)return {sent:true,duplicate:true};
 const text=['NEW PAID ROAMWISE BOOKING REQUEST — PROPERTY CONFIRMATION PENDING',
 'Reference: '+record.id,'Property: '+record.property,'Check-in: '+record.checkin,
 'Check-out: '+record.checkout,'Nights: '+record.nights,'Guests: '+record.guests,
 'RoamWise payment status: verified PAID; this is a request, not a confirmed room.',
 record.shareWithSupplier?'Guest email: '+record.email+'; Guest phone: '+record.phone:'Guest contact held by RoamWise pending consent.',
 'Please confirm availability, booking ID, final inclusions, and cancellation policy to founder@roamwise.co.in.',
 'For urgent booking support: +91 9650432605 / +91 9997317170'].join('\\n');
 const resp=await fetch('https://api.agentmail.to/v0/inboxes/'+encodeURIComponent(env.AGENTMAIL_INBOX_BUSINESS)+'/messages/send',{
 method:'POST',headers:{authorization:'Bearer '+env.AGENTMAIL_API_KEY,'content-type':'application/json'},
 body:JSON.stringify({to:[bookingRecipient],subject:'ACTION: Paid RoamWise stay request '+record.id,text})});
 if(!resp.ok)return {sent:false,reason:'supplier_email_failed',httpStatus:resp.status};
 record.supplierNotifiedAt=new Date().toISOString();
 await env.RW_KV.put('stayorder:'+record.id,JSON.stringify(record),{expirationTtl:60*60*24*180});
 return {sent:true};
}
export async function handleStayCashfreeWebhook(request,env){
 if(request.method!=='POST')return json({error:'method_not_allowed'},405);
 if(!env.CASHFREE_SECRET_KEY||!env.RW_KV)return json({error:'not_configured'},503);
 const raw=new Uint8Array(await request.arrayBuffer());
 if(!raw.length||raw.length>65536)return json({error:'invalid_payload'},400);
 let valid=false;
 try{valid=await verifyCashfreeWorkerWebhook({rawBody:raw,headers:request.headers,secret:env.CASHFREE_SECRET_KEY,now:()=>Date.now()})}catch(_){return json({error:'signature_check_failed'},503)}
 if(!valid)return json({error:'invalid_signature'},401);
 let event;try{event=JSON.parse(new TextDecoder().decode(raw))}catch(_){return json({error:'invalid_json'},400)}
 const id=event?.data?.order?.order_id;
 if(event.type!=='PAYMENT_SUCCESS_WEBHOOK'||typeof id!=='string'||!/^rwstay_[a-f0-9]{32}$/.test(id))return json({ok:true,ignored:true});
 const record=await env.RW_KV.get('stayorder:'+id,'json');
 if(!record)return json({ok:true,ignored:'unknown_order'});
 const r=await fetch(CF(env)+'/pg/orders/'+id,{headers:headers(env)});
 if(!r.ok)return json({error:'cashfree_lookup_failed'},503);
 const order=await r.json();
 if(order.order_status!=='PAID'||order.order_id!==id||order.order_currency!=='INR'||Number(order.order_amount)!==record.amount)return json({error:'payment_integrity_failed'},409);
 if(record.supplierNotifiedAt)return json({ok:true,duplicate:true});
 record.status='paid_pending_confirmation';record.paidAt=record.paidAt||new Date().toISOString();
 await env.RW_KV.put('stayorder:'+id,JSON.stringify(record),{expirationTtl:60*60*24*180});
 const sent=await alertSupplier(env,record);
 if(!sent.sent)return json({ok:false,error:sent.reason},503);
 return json({ok:true,status:record.status,supplierNotified:true});
}
