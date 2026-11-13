/* Accommodation-only, pay-first Cashfree checkout on the existing roamwise-api Worker.
   Orders are NOT Pro entitlements. Amounts are calculated here, never accepted from the client. */
import { json } from '../lib/http.js';
import { verifyCashfreeWorkerWebhook } from '../lib/cashfree-booking-webhook-verify.js';
import { cfBase as CF, cfHeaders as headers } from '../lib/cashfree-pg.js';
import { onStayPaid } from './stay-lifecycle.js';
import { walletKeyFromRequest, spendWallet } from './wallet.js';
/* Every RoamWise stay is bookable and payable online (founder decision, 8 Nov 2026: take the money, refund
   if the stay cannot be confirmed). Three kinds, all priced here, never by the browser:
   - nightly: supplier rate x 1.25 per room night (Amor rate sheets, taxes included)
   - plans:   fixed long-stay prices for exact lengths (Big Bro, owner-stated); other lengths fall back to advance
   - advance: a fixed refundable booking advance; RoamWise confirms the room and the balance is paid at the stay
   `supplier` decides who gets the paid-booking email: Amor's sales desk for Amor stays, otherwise RoamWise. */
export const STAY_ADVANCE = 1000;
export const RATE={
 // Amor wholesale rate cards are confidential, date-sensitive and NOT sellable without
 // an approved supplier hold, tax/invoicing model and immutable server-side quote.
 // These IDs remain listed so existing links and leads resolve, but payment fails closed.
 nanau:{kind:'quote_only',name:'Nanau Resort & Spa, Corbett',supplier:'amor'},
 padma:{kind:'quote_only',name:'Padma Villa, Manali',supplier:'amor'},
 aramness:{kind:'quote_only',name:'Aramness Gir',supplier:'amor'},
 tattwaa:{kind:'quote_only',name:'Tattwaa Corbett Spa & Resort',supplier:'amor'},
 bigbro:{kind:'plans',name:'Big Bro Hotel, Almora',plans:{15:30000,30:50000,90:150000},supplier:'roamwise'},
 milan:{kind:'advance',name:'Milan Heights, Almora',supplier:'roamwise'},
 soulmate:{kind:'advance',name:'Soulmate Homestay, Kotyura, Almora',supplier:'roamwise'},
 woodbook:{kind:'advance',name:'Woodbook The Devine Homestay, Tirthan Valley',supplier:'roamwise'},
 newhimank:{kind:'advance',name:'New Himank, Manali',supplier:'roamwise'},
 corbett:{kind:'advance',name:'Corbett Jungle View Homestay, Lansdowne',supplier:'roamwise'}
};
const NIGHTLY_MARKUP=1.07; // Future Amor room markup, only after verified commercial/tax and quote approval.
/* Public price card for the booking page (no supplier nets). */
export function publicRates(){
 return Object.fromEntries(Object.entries(RATE).map(([id,p])=>[id,{name:p.name,kind:p.kind,
  ...(p.kind==='nightly'?{perNight:Math.ceil(p.net*NIGHTLY_MARKUP),from:p.from,until:p.until,peak:p.peak||null}:{}),
  ...(p.kind==='plans'?{plans:p.plans}:{}),advance:p.kind==='quote_only'?null:STAY_ADVANCE,status:p.kind==='quote_only'?'quote_required':'available'}]));
}
export function price(body,now=Date.now()){
 const p=RATE[String(body.stay||'')];if(!p)throw Error('Unknown property');
 if(p.kind==='quote_only')throw Error('A dated supplier-confirmed quote is required before any Amor Hospitality advance or full payment. Request a quote on /packages/amor-luxury.html.');
 const start=String(body.checkin||''),end=String(body.checkout||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end))throw Error('Invalid dates');
 const a=Date.parse(start+'T00:00:00Z'),b=Date.parse(end+'T00:00:00Z'),n=(b-a)/86400000;
 const maxNights=p.kind==='nightly'?14:90;
 if(!Number.isInteger(n)||n<1||n>maxNights||a<now-86400000)throw Error('Choose check-in and check-out dates (up to '+maxNights+' nights).');
 if(p.kind==='nightly'){
  if(start<p.from||end>p.until)throw Error('Stay dates unavailable');
  if(p.peak&&start<=p.peak[1]&&end>p.peak[0])throw Error('Peak dates need updated pricing');
  const full=Math.ceil(p.net*n*NIGHTLY_MARKUP),percent=body.paymentType==='full'?100:body.paymentType==='advance'?25:0;
  if(!percent)throw Error('Choose advance or full payment');
  return {stay:body.stay,property:p.name,kind:'nightly',checkin:start,checkout:end,nights:n,guests:2,total:full,portion:percent,amount:Math.ceil(full*percent/100),currency:'INR'};
 }
 if(p.kind==='plans'&&p.plans[n]){
  const full=p.plans[n],percent=body.paymentType==='advance'?25:100;
  return {stay:body.stay,property:p.name,kind:'plan',checkin:start,checkout:end,nights:n,guests:2,total:full,portion:percent,amount:Math.ceil(full*percent/100),currency:'INR'};
 }
 /* Rate confirmed by RoamWise for the dates: take a refundable advance now, adjusted in the final bill. */
 return {stay:body.stay,property:p.name,kind:'advance',checkin:start,checkout:end,nights:n,guests:2,total:null,portion:null,amount:STAY_ADVANCE,currency:'INR'};
}
export async function stayRates(){ return json({advance:STAY_ADVANCE,stays:publicRates()}); }
/* POST /stays/quote: the exact amount the checkout would charge, without creating an order. */
export async function stayQuote(request){
 let b;try{b=await request.json()}catch(_){return json({error:'invalid_json'},400)}
 try{return json({ok:true,quote:price(b)})}catch(e){return json({error:'invalid_quote',message:e.message},422)}
}
function kv(env){return env.RW_KV}
export async function createStayOrder(request,env){
 if(!env.CASHFREE_APP_ID||!env.CASHFREE_SECRET_KEY||!kv(env))return json({error:'stay_checkout_unavailable'},503);
 let b;try{b=await request.json()}catch(_){return json({error:'invalid_json'},400)}
 let quote;try{quote=price(b)}catch(e){return json({error:'invalid_quote',message:e.message},422)}
 const phone=String(b.phone||'').replace(/[\s()-]/g,''),email=String(b.email||'').trim();
 if(!/^\+?\d{10,15}$/.test(phone)||!/^\S+@\S+\.\S+$/.test(email))return json({error:'contact_required'},422);
 const id='rwstay_'+crypto.randomUUID().replace(/-/g,'');
 const record={...quote,id,email,phone,shareWithSupplier:b.shareWithSupplier===true,status:'payment_pending',confirmed:false,createdAt:new Date().toISOString()};
 /* Pay with RoamWise wallet credit when the guest is signed in (wallet link or Google/phone sign-in) and has enough. */
 if(b.payWith==='wallet'){
  const key=await walletKeyFromRequest(request,env,String(b.wallet||''));
  if(!key)return json({error:'wallet_sign_in',message:'Open your wallet link again to pay with credit.'},401);
  try{record.paidFromLots=await spendWallet(env,key,quote.amount,id)}catch(e){return json({error:'wallet_low',message:'Your wallet credit is not enough for this booking.'},409)}
  record.paidWith='wallet';
  await onStayPaid(env,record);
  return json({paid:true,orderId:id,quote});
 }
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
 if(paid&&record.status==='payment_pending'){await onStayPaid(env,record);if(RATE[record.stay]&&RATE[record.stay].supplier==='amor')await alertSupplier(env,record)}
 return json({orderId:id,status:paid?record.status:data.order_status,confirmed:record.status==='confirmed'});
}

const SUPPLIER_INBOX={amor:'sales@amorhospitality.in',roamwise:'founder@roamwise.co.in'};
async function alertSupplier(env,record){
 if(!env.AGENTMAIL_API_KEY||!env.AGENTMAIL_INBOX_BUSINESS)return {sent:false,reason:'notification_provider_unconfigured'};
 if(record.supplierNotifiedAt)return {sent:true,duplicate:true};
 const amor=(RATE[record.stay]||{}).supplier==='amor';
 const lines=['NEW PAID ROAMWISE BOOKING REQUEST — PROPERTY CONFIRMATION PENDING',
 'Reference: '+record.id,'Property: '+record.property,'Check-in: '+record.checkin,
 'Check-out: '+record.checkout,'Nights: '+record.nights,'Guests: '+record.guests,
 'Paid to RoamWise: Rs '+record.amount+(record.kind==='advance'?' (refundable booking advance; balance as confirmed)':record.portion&&record.portion<100?' ('+record.portion+'% advance of Rs '+record.total+')':''),
 'RoamWise payment status: verified PAID; this is a request, not a confirmed room.'];
 if(amor)lines.push(record.shareWithSupplier?'Guest email: '+record.email+'; Guest phone: '+record.phone:'Guest contact held by RoamWise pending consent.',
  'Please confirm availability, booking ID, final inclusions, and cancellation policy to founder@roamwise.co.in.',
  ...(record.hostLinks?['','One tap is enough:','Confirm this booking: '+record.hostLinks.confirm,"Can't host these dates: "+record.hostLinks.decline,'Need more time (once): '+record.hostLinks.extend,'No answer within 24 hours refunds the guest automatically.','']:[]),
  'For urgent booking support: +91 9650432605 / +91 9997317170');
 else lines.push('Guest email: '+record.email+'; Guest phone: '+record.phone,
  'Next: confirm the room with the host, tell the guest the balance (if any), or refund in full if it cannot be confirmed.');
 const text=lines.join('\n');
 const resp=await fetch('https://api.agentmail.to/v0/inboxes/'+encodeURIComponent(env.AGENTMAIL_INBOX_BUSINESS)+'/messages/send',{
 method:'POST',headers:{authorization:'Bearer '+env.AGENTMAIL_API_KEY,'content-type':'application/json'},
 body:JSON.stringify({to:[SUPPLIER_INBOX[(RATE[record.stay]||{}).supplier]||SUPPLIER_INBOX.roamwise],subject:'ACTION: Paid RoamWise stay request '+record.id,text})});
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
 if(record.status==='payment_pending')await onStayPaid(env,record);
 /* Amor's booking desk gets its own email with the guest details and the host links; RoamWise stays are handled from the founder email. */
 if(!(RATE[record.stay]&&RATE[record.stay].supplier==='amor'))return json({ok:true,status:record.status});
 if(record.supplierNotifiedAt)return json({ok:true,duplicate:true});
 const sent=await alertSupplier(env,record);
 if(!sent.sent)return json({ok:false,error:sent.reason},503);
 return json({ok:true,status:record.status,supplierNotified:true});
}
