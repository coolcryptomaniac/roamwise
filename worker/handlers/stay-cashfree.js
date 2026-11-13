/* Accommodation-only, pay-first Cashfree checkout on the existing roamwise-api Worker.
   Orders are NOT Pro entitlements. Amounts are calculated here, never accepted from the client. */
import { json } from '../lib/http.js';
import { verifyCashfreeWorkerWebhook } from '../lib/cashfree-booking-webhook-verify.js';
import { cfBase as CF, cfHeaders as headers } from '../lib/cashfree-pg.js';
import { onStayPaid } from './stay-lifecycle.js';
import { sendMail } from '../lib/mailer.js';
import { walletKeyFromRequest, spendWallet } from './wallet.js';
import { priceStay, pricePackage, publicAmor } from '../lib/amor-pricing.js';
import { PACKAGES, publicPackages } from '../lib/amor-packages.js';
import { inSeason } from '../lib/amor-policy.js';
import { ensureAmorRates, publicKeyJwk } from '../lib/amor-rates-store.js';
import { amorRatesLoaded } from '../lib/amor-rates.js';
/* Every RoamWise stay is bookable and payable online (founder decision, 8 Nov 2026: take the money, refund
   if the stay cannot be confirmed). Kinds, all priced here, never by the browser:
   - amor:    Amor Hospitality net rate sheets, any room and meal plan, season and peak nights, plus
              7% RoamWise commission and 18% GST on it (worker/lib/amor-pricing.js; founder decision 13 Nov 2026)
   - package: curated Amor packages (worker/lib/amor-packages.js), priced the same way for the exact dates
   - plans:   fixed long-stay prices for exact lengths (Big Bro, owner-stated); other lengths fall back to advance
   - advance: a fixed refundable booking advance; RoamWise confirms the room and the balance is paid at the stay
   `supplier` decides who gets the paid-booking email: Amor's sales desk for Amor stays, otherwise RoamWise. */
export const STAY_ADVANCE = 1000;
export const RATE={
 nanau:{kind:'amor',name:'Nanau Resort & Spa, Corbett',supplier:'amor'},
 padma:{kind:'amor',name:'Padma Villa, Manali',supplier:'amor'},
 aramness:{kind:'amor',name:'Aramness Gir',supplier:'amor'},
 tattwaa:{kind:'amor',name:'The Tattwaa Corbett Spa & Resort',supplier:'amor'},
 bigbro:{kind:'plans',name:'Big Bro Hotel, Almora',plans:{15:30000,30:50000,90:150000},supplier:'roamwise'},
 milan:{kind:'advance',name:'Milan Heights, Almora',supplier:'roamwise'},
 soulmate:{kind:'advance',name:'Soulmate Homestay, Kotyura, Almora',supplier:'roamwise'},
 woodbook:{kind:'advance',name:'Woodbook The Devine Homestay, Tirthan Valley',supplier:'roamwise'},
 newhimank:{kind:'advance',name:'New Himank, Manali',supplier:'roamwise'},
 corbett:{kind:'advance',name:'Corbett Jungle View Homestay, Lansdowne',supplier:'roamwise'}
};
const isAmor=(r)=>r.supplier==='amor'||(RATE[r.stay]||{}).supplier==='amor';
/* Lowest total for each package, for the cards (a quiet February date, or the first day it is sold). */
const PRICE_REF=Date.parse('2026-11-13T00:00:00Z');
export function packageFrom(id){
 const k=PACKAGES[id];
 for(const d of [k.window?k.window.from:null,'2027-02-08','2027-03-08'].filter(Boolean)){try{return {checkin:d,total:pricePackage({package:id,checkin:d,paymentType:'full'},PRICE_REF,false).quote.total}}catch(_){}}
 return null;
}
/* Public price card for the booking page (no supplier nets). */
export function publicRates(){
 const amor=amorRatesLoaded()?publicAmor():{};
 return Object.fromEntries(Object.entries(RATE).map(([id,p])=>[id,{name:p.name,kind:p.kind,
  ...(p.kind==='amor'?(amor[id]||{unavailable:true}):{}),
  ...(p.kind==='plans'?{plans:p.plans}:{}),advance:STAY_ADVANCE}]));
}
/* Package cards, best for this moment first: in season today, then in season within a month, then cheaper first. */
export function publicPackageList(now=Date.now()){
 if(!amorRatesLoaded())return [];
 const day=(n)=>new Date(now+n*864e5).toISOString().slice(0,10),today=day(0),month=day(30);
 return publicPackages().map((k)=>{const from=packageFrom(k.id),open=!k.window||k.window.to>=today;
  const hot=open&&(inSeason(k.group,today)||!!(k.window&&k.window.from<=month));
  const soon=open&&!hot&&inSeason(k.group,month);
  return {...k,from,open,hot,soon};
 }).sort((a,b)=>(b.open-a.open)||(b.hot-a.hot)||(b.soon-a.soon)||((a.from?a.from.total:9e9)-(b.from?b.from.total:9e9)));
}
/* Full pricing, with the private supplier cost for Amor bookings (KV and Amor's email only). */
export function priceFull(body,now=Date.now()){
 if(body&&body.package){const r=pricePackage(body,now);return {quote:r.quote,supplierNet:r.supplierNet}}
 const p=RATE[String(body.stay||'')];if(!p)throw Error('Unknown property');
 if(p.kind==='amor'){const r=priceStay(body,now);return {quote:r.quote,supplierNet:r.supplierNet}}
 return {quote:priceOther(body,p,now)};
}
export function price(body,now=Date.now()){return priceFull(body,now).quote}
function priceOther(body,p,now){
 const start=String(body.checkin||''),end=String(body.checkout||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end))throw Error('Invalid dates');
 const a=Date.parse(start+'T00:00:00Z'),b=Date.parse(end+'T00:00:00Z'),n=(b-a)/86400000;
 if(!Number.isInteger(n)||n<1||n>90||a<now-86400000)throw Error('Choose check-in and check-out dates (up to 90 nights).');
 if(p.kind==='plans'&&p.plans[n]){
  const full=p.plans[n],percent=body.paymentType==='advance'?25:100;
  return {stay:body.stay,property:p.name,kind:'plan',checkin:start,checkout:end,nights:n,guests:2,total:full,portion:percent,amount:Math.ceil(full*percent/100),balance:full-Math.ceil(full*percent/100),currency:'INR',supplier:p.supplier};
 }
 /* Rate confirmed by RoamWise for the dates: take a refundable advance now, adjusted in the final bill. */
 return {stay:body.stay,property:p.name,kind:'advance',checkin:start,checkout:end,nights:n,guests:2,total:null,portion:null,amount:STAY_ADVANCE,currency:'INR',supplier:p.supplier};
}
export async function stayRates(request,env){ await ensureAmorRates(env); return json({advance:STAY_ADVANCE,stays:publicRates(),packages:publicPackageList()}); }
/* GET /stays/rates-key: the PUBLIC half of the rate-book key, for tools/amor-rates-seal.mjs. Never the rates. */
export async function stayRatesKey(request,env){ const k=await publicKeyJwk(env||{}); return k?json(k):json({error:'key_not_ready'},503); }
/* POST /stays/quote: the exact amount the checkout would charge, without creating an order. */
export async function stayQuote(request,env){
 await ensureAmorRates(env);
 let b;try{b=await request.json()}catch(_){return json({error:'invalid_json'},400)}
 try{return json({ok:true,quote:price(b)})}catch(e){return json({error:'invalid_quote',message:e.message},422)}
}
function kv(env){return env.RW_KV}
export async function createStayOrder(request,env){
 if(!env.CASHFREE_APP_ID||!env.CASHFREE_SECRET_KEY||!kv(env))return json({error:'stay_checkout_unavailable'},503);
 let b;try{b=await request.json()}catch(_){return json({error:'invalid_json'},400)}
 if(b.balanceOf)return createBalanceOrder(b,env);
 await ensureAmorRates(env);
 let quote,supplierNet;try{({quote,supplierNet}=priceFull(b))}catch(e){return json({error:'invalid_quote',message:e.message},422)}
 const phone=String(b.phone||'').replace(/[\s()-]/g,''),email=String(b.email||'').trim();
 if(!/^\+?\d{10,15}$/.test(phone)||!/^\S+@\S+\.\S+$/.test(email))return json({error:'contact_required'},422);
 const id='rwstay_'+crypto.randomUUID().replace(/-/g,'');
 const record={...quote,id,email,phone,shareWithSupplier:b.shareWithSupplier===true,status:'payment_pending',confirmed:false,createdAt:new Date().toISOString(),...(supplierNet?{supplierNet}:{})};
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
 if(paid&&record.status==='payment_pending'){if(record.kind==='balance')await onBalancePaid(env,record);else{await onStayPaid(env,record);if(isAmor(record))await alertSupplier(env,record)}}
 return json({orderId:id,status:paid?record.status:data.order_status,confirmed:record.status==='confirmed'});
}

/* What Amor needs to book: each stay, room, meal plan and dates, and the net RoamWise owes per their sheet. */
export function amorBookingLines(record){
 const net=record.supplierNet||[];if(!net.length)return ['Booking: '+record.property];
 const out=['Please book (B2B net rates per your Nov 2026 rate sheets):'];let owed=0;
 for(const l of net){owed+=l.cost;
  if(l.extra)out.push(' - '+l.extra+': Rs '+l.cost.toLocaleString('en-IN')+(l.prepay?' (full prepayment)':''));
  else out.push(' - '+l.property+': '+l.rooms+' x '+l.room+', '+l.plan+', '+l.checkin+' to '+l.checkout+' ('+l.nights+' night'+(l.nights>1?'s':'')+(l.extraBeds?', '+l.extraBeds+' extra bed(s)':'')+'), net Rs '+l.cost.toLocaleString('en-IN'));}
 out.push('Total net to Amor: Rs '+owed.toLocaleString('en-IN')+' (tax included). Please send your invoice to founder@roamwise.co.in; RoamWise pays the deposit per your policy.');
 return out;
}

/* Balance for an advance booking: same Cashfree flow, linked to the original order, no second host decision. */
async function createBalanceOrder(b,env){
 const pid=String(b.balanceOf||'');if(!/^rwstay_[a-f0-9]{32}$/.test(pid))return json({error:'invalid_order'},404);
 const parent=await kv(env).get('stayorder:'+pid,'json');
 if(!parent||String(b.email||'').trim().toLowerCase()!==String(parent.email||'').toLowerCase())return json({error:'not_found',message:'Use the email you booked with.'},404);
 if(parent.status!=='confirmed')return json({error:'not_payable',message:'The balance opens once your booking is confirmed.'},409);
 if(!(parent.balance>0)||parent.balancePaidAt)return json({error:'nothing_due',message:'Nothing is due on this booking.'},409);
 const id='rwstay_'+crypto.randomUUID().replace(/-/g,'');
 const record={id,kind:'balance',parentId:pid,stay:parent.stay,package:parent.package,property:parent.property,checkin:parent.checkin,checkout:parent.checkout,nights:parent.nights,
  amount:parent.balance,total:parent.total,currency:'INR',email:parent.email,phone:parent.phone,supplier:parent.supplier,status:'payment_pending',createdAt:new Date().toISOString()};
 await kv(env).put('stayorder:'+id,JSON.stringify(record),{expirationTtl:60*60*24*180});
 const body={order_id:id,order_amount:record.amount,order_currency:'INR',customer_details:{customer_id:id,customer_phone:parent.phone,customer_email:parent.email},order_meta:{return_url:'https://roamwise.co.in/packages/amor-checkout.html?order_id='+id,notify_url:'https://roamwise-api.founder-f53.workers.dev/stays/cashfree/webhook'},order_note:('Balance '+pid.slice(-6)+' '+record.property).slice(0,200)};
 let r,data;try{r=await fetch(CF(env)+'/pg/orders',{method:'POST',headers:{...headers(env),'x-idempotency-key':id},body:JSON.stringify(body)});data=await r.json()}catch(_){return json({error:'cashfree_unreachable'},502)}
 if(!r.ok||!data.payment_session_id||data.order_id!==id||Number(data.order_amount)!==record.amount)return json({error:'cashfree_order_failed'},502);
 return json({paymentSessionId:data.payment_session_id,orderId:id,environment:CF(env).includes('sandbox')?'sandbox':'production',quote:{kind:'balance',property:record.property,amount:record.amount,total:record.total}});
}
async function onBalancePaid(env,record){
 record.status='paid';record.paidAt=new Date().toISOString();
 await kv(env).put('stayorder:'+record.id,JSON.stringify(record),{expirationTtl:60*60*24*180});
 const parent=await kv(env).get('stayorder:'+record.parentId,'json');
 if(parent&&!parent.balancePaidAt){parent.balancePaidAt=record.paidAt;parent.balancePaidOrder=record.id;parent.balance=0;
  await kv(env).put('stayorder:'+parent.id,JSON.stringify(parent),{expirationTtl:60*60*24*180});}
 const rs='Rs '+Number(record.amount).toLocaleString('en-IN');
 try{await sendMail(env,{to:'founder@roamwise.co.in',subject:'Balance paid '+record.parentId.slice(-6)+': '+record.property,text:rs+' balance received for '+record.parentId+' ('+record.property+', '+record.checkin+'). Pay the supplier balance before their deadline.'});
  await sendMail(env,{to:record.email,subject:'Balance received: '+record.property,text:'Namaste! We have received the balance of '+rs+' for '+record.property+', '+record.checkin+' to '+record.checkout+'. Your booking ('+record.parentId+') is now fully paid.\n\n— RoamWise'});}catch(_){}
}

const SUPPLIER_INBOX={amor:'sales@amorhospitality.in',roamwise:'founder@roamwise.co.in'};
async function alertSupplier(env,record){
 if(!env.AGENTMAIL_API_KEY||!env.AGENTMAIL_INBOX_BUSINESS)return {sent:false,reason:'notification_provider_unconfigured'};
 if(record.supplierNotifiedAt)return {sent:true,duplicate:true};
 const amor=isAmor(record);
 const lines=['NEW PAID ROAMWISE BOOKING REQUEST — PROPERTY CONFIRMATION PENDING',
 'Reference: '+record.id,'Property: '+record.property,'Check-in: '+record.checkin,
 'Check-out: '+record.checkout,'Nights: '+record.nights,'Guests: '+record.guests,
 ...(amor?amorBookingLines(record):['Paid to RoamWise: Rs '+record.amount+(record.kind==='advance'?' (refundable booking advance; balance as confirmed)':record.portion&&record.portion<100?' ('+record.portion+'% advance of Rs '+record.total+')':'')]),
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
 body:JSON.stringify({to:[amor?SUPPLIER_INBOX.amor:SUPPLIER_INBOX.roamwise],subject:'ACTION: Paid RoamWise stay request '+record.id,text})});
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
 if(record.kind==='balance'){if(record.status==='payment_pending')await onBalancePaid(env,record);return json({ok:true,status:record.status})}
 if(record.status==='payment_pending')await onStayPaid(env,record);
 /* Amor's booking desk gets its own email with the guest details and the host links; RoamWise stays are handled from the founder email. */
 if(!isAmor(record))return json({ok:true,status:record.status});
 if(record.supplierNotifiedAt)return json({ok:true,duplicate:true});
 const sent=await alertSupplier(env,record);
 if(!sent.sent)return json({ok:false,error:sent.reason},503);
 return json({ok:true,status:record.status,supplierNotified:true});
}
