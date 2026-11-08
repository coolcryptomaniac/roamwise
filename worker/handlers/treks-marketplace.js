/* Trek / guide / transport self-onboarding, review-gated catalog and Cashfree checkout.
   No affiliation is claimed until an authenticated partner applies and an admin approves.
   Payment is a request pending operator confirmation, never an automatic seat guarantee.
   Secrets and prices stay server-side. Firestore collections are Worker-owned. */
import {json} from '../lib/http.js';
import {verifyFirebaseIdToken} from '../lib/firebase-verify.js';
import {parseServiceAccount,getServiceAccountAccessToken} from '../lib/service-account.js';
import {getDoc,updateDoc,createDocIfAbsent,listDocs,queryEqualsString} from '../lib/firestore-rest.js';
import {cfBase,cfHeaders} from '../lib/cashfree-pg.js';
import {verifyCashfreeWorkerWebhook} from '../lib/cashfree-booking-webhook-verify.js';

const safe=(v,n=160)=>String(v==null?'':v).trim().slice(0,n);
const allowedRoles=['company','guide','transport','experience'];
const ISO=/^\d{4}-\d{2}-\d{2}$/;
const orderPattern=/^rwtrek_[a-f0-9]{32}$/;
const packagePattern=/^tp_[a-f0-9]{32}$/;
const validEmail=(v)=>/^\S+@\S+\.\S+$/.test(v);
const validPhone=(v)=>/^\+?[0-9]{10,15}$/.test(v);
const utcNow=()=>new Date().toISOString();
const apiError=(reason,status=400)=>json({error:reason},status);
async function firestoreContext(env){
 if(!env.FIREBASE_SERVICE_ACCOUNT_JSON)throw Error('service_unconfigured');
 const sa=parseServiceAccount(env);
 if(sa.project_id!=='roamwisepro')throw Error('project_mismatch');
 return {env,project:sa.project_id,token:await getServiceAccountAccessToken(env)};
}
async function identity(request,ctx){
 const match=/^Bearer\s+(.+)$/i.exec(request.headers.get('authorization')||'');
 if(!match) return null;
 try{
  const claims=await verifyFirebaseIdToken(match[1],ctx.project);
  if(!claims.email_verified)return null;
  return claims;
 }catch(_){return null}
}
const doc=(ctx,path)=>getDoc(ctx.env,ctx.token,ctx.project,path);
const patch=(ctx,path,values)=>updateDoc(ctx.env,ctx.token,ctx.project,path,values);
const create=(ctx,col,id,values)=>createDocIfAbsent(ctx.env,ctx.token,ctx.project,col,id,values);
const listing=(ctx,col,max=300)=>listDocs(ctx.env,ctx.token,ctx.project,col,max);
async function readJSON(request){
 const text=await request.text();
 if(text.length>12000)throw Error('body_too_large');
 return JSON.parse(text);
}
function feeFor(subtotal){return Math.min(99,Math.ceil(subtotal*0.01))}
function publicProvider(provider){
 return {id:provider.id,name:provider.name,role:provider.role,region:provider.region,website:provider.website,description:provider.description};
}
function publicPackage(pkg,provider){
 return {id:pkg.id,provider:publicProvider(provider),name:pkg.name,region:pkg.region,start:pkg.start,duration:pkg.duration,
  difficulty:pkg.difficulty,unitPrice:pkg.unitPrice,pricingUnit:pkg.pricingUnit,seats:pkg.seats,includes:pkg.includes,
  excludes:pkg.excludes,itinerary:pkg.itinerary,refundPolicy:pkg.refundPolicy,imageUrl:pkg.imageUrl,
  safetyNote:pkg.safetyNote,operatorConfirmationRequired:true};
}
async function approved(ctx,id){
 if(!packagePattern.test(id||''))return null;
 const pkg=await doc(ctx,'trekPackages/'+id);
 if(!pkg||pkg.status!=='published'||!pkg.ownerUid)return null;
 const owner=await doc(ctx,'trekProviders/'+pkg.ownerUid);
 if(!owner||owner.status!=='approved'||owner.verified!==true)return null;
 if(!ISO.test(pkg.start)||Date.parse(pkg.start+'T00:00:00Z')<=Date.now())return null;
 return {pkg,owner};
}
async function quote(ctx,id,seats){
 const entry=await approved(ctx,id);
 if(!entry)return {error:'not_available'};
 const p=entry.pkg;const count=Number(seats);
 if(!Number.isSafeInteger(count)||count<1||count>12||count>Number(p.seats))return {error:'invalid_seats'};
 const base=Number(p.unitPrice);
 if(!Number.isSafeInteger(base)||base<100||base>200000)return {error:'invalid_rate'};
 const subtotal=base*(p.pricingUnit==='person'?count:1);if(subtotal>500000)return {error:'amount_too_large'};const fee=feeFor(subtotal);
 return {pkg:p,owner:entry.owner,count,quote:{packageId:id,name:p.name,departure:p.start,travellers:count,
   unitPrice:base,pricingUnit:p.pricingUnit,operatorTotal:subtotal,roamwiseServiceFee:fee,total:subtotal+fee,currency:'INR',
   partnerCommission:0,confirmation:'Pending operator confirmation after successful payment'}};
}
async function isAdmin(ctx,claims){
 return !!(claims&&await doc(ctx,'admins/'+claims.uid));
}
export async function handleTrekMarketplace(request,env,path){
 if(path==='treks/cashfree/webhook')return handleWebhook(request,env);
 let ctx;
 try{ctx=await firestoreContext(env)}catch(_){return apiError('trek_service_unavailable',503)}
 if(path==='treks/catalog'&&request.method==='GET'){
  try{
   const [packages,providers]=await Promise.all([listing(ctx,'trekPackages',500),listing(ctx,'trekProviders',500)]);
   const map=new Map(providers.filter(p=>p.status==='approved'&&p.verified===true).map(p=>[p.id,p]));
   const items=packages.filter(p=>p.status==='published'&&map.has(p.ownerUid)&&ISO.test(p.start)&&Date.parse(p.start+'T00:00:00Z')>Date.now()).map(p=>publicPackage(p,map.get(p.ownerUid)));
   return json({items,feePolicy:'1% of operator subtotal, capped at INR 99; disclosed before payment'});
  }catch(_){return apiError('catalog_unavailable',503)}
 }
 if(path==='treks/quote'&&request.method==='POST'){
  try{const b=await readJSON(request);const q=await quote(ctx,b.packageId,b.seats);return q.error?apiError(q.error,409):json({quote:q.quote});}
  catch(_){return apiError('invalid_quote',422)}
 }
 const claims=await identity(request,ctx);
 if(!claims)return apiError('verified_login_required',401);
 if(path==='treks/mine'&&request.method==='GET'){
  try{
   const [partner,packages]=await Promise.all([doc(ctx,'trekProviders/'+claims.uid),queryEqualsString(env,ctx.token,ctx.project,'trekPackages','ownerUid',claims.uid,200)]);
   return json({partner,packages});
  }catch(_){return apiError('account_unavailable',503)}
 }
 if(path==='treks/apply'&&request.method==='POST'){
  try{
   const b=await readJSON(request);
   if(!allowedRoles.includes(b.role)||!b.consent||!b.name||!validPhone(safe(b.phone,20))||!validEmail(safe(b.email,180)))return apiError('complete_required_fields',422);
   if(safe(b.email,180).toLowerCase()!==safe(claims.email,180).toLowerCase())return apiError('email_must_match_login',422);
   const existing=await doc(ctx,'trekProviders/'+claims.uid);
   const next={ownerUid:claims.uid,name:safe(b.name,100),role:b.role,region:safe(b.region,100),
     website:safe(b.website,250),description:safe(b.description,800),phone:safe(b.phone,20),
     email:safe(b.email,180),registration:safe(b.registration,100),safetyCredentials:safe(b.safetyCredentials,500),
     vehiclePermit:safe(b.vehiclePermit,150),refundPolicy:safe(b.refundPolicy,800),status:'pending_review',
     verified:false,commissionPercent:0,feeWaiverYears:3,contributions:'voluntary_only_never_required',
     updatedAt:utcNow(),createdAt:existing?.createdAt||utcNow()};
   if(existing)await patch(ctx,'trekProviders/'+claims.uid,next);
   else await create(ctx,'trekProviders',claims.uid,next);
   return json({ok:true,status:'pending_review',message:'Application received. No public affiliation or sales until approval.'});
  }catch(_){return apiError('application_unavailable',503)}
 }
 if(path==='treks/package'&&request.method==='POST'){
  try{
   const b=await readJSON(request),owner=await doc(ctx,'trekProviders/'+claims.uid);
   if(!owner||!['pending_review','approved'].includes(owner.status))return apiError('partner_application_required',403);
   const name=safe(b.name,110),region=safe(b.region,100),start=safe(b.start,10),
    price=Number(b.unitPrice),seats=Number(b.seats),days=Number(b.duration);
   if(!name||!region||!ISO.test(start)||Date.parse(start+'T00:00:00Z')<=Date.now()||
      !Number.isSafeInteger(price)||price<100||price>200000||
      !Number.isSafeInteger(seats)||seats<1||seats>100||
      !Number.isSafeInteger(days)||days<1||days>60||
      !safe(b.includes,1800)||!safe(b.itinerary,3500)||!safe(b.refundPolicy,800)||!safe(b.safetyNote,800))
      return apiError('missing_or_invalid_package_details',422);
   const data={ownerUid:claims.uid,name,region,start,unitPrice:price,pricingUnit:['person','vehicle','group'].includes(b.pricingUnit)?b.pricingUnit:'person',seats,duration:days,
      difficulty:safe(b.difficulty,60),includes:safe(b.includes,1800),excludes:safe(b.excludes,1800),
      itinerary:safe(b.itinerary,3500),refundPolicy:safe(b.refundPolicy,800),
      safetyNote:safe(b.safetyNote,800),imageUrl:/^https:\/\//.test(b.imageUrl||'')?safe(b.imageUrl,450):'',
      status:'pending_review',updatedAt:utcNow()};
   const id=packagePattern.test(b.id||'')?b.id:'tp_'+crypto.randomUUID().replace(/-/g,'');
   const prev=await doc(ctx,'trekPackages/'+id);
   if(prev&&prev.ownerUid!==claims.uid)return apiError('forbidden',403);
   if(prev)await patch(ctx,'trekPackages/'+id,data);
   else await create(ctx,'trekPackages',id,{...data,createdAt:utcNow()});
   return json({ok:true,id,status:'pending_review'});
  }catch(_){return apiError('package_save_unavailable',503)}
 }
 if(path==='treks/admin'&&request.method==='GET'){
  if(!await isAdmin(ctx,claims))return apiError('forbidden',403);
  try{const [partners,packages]=await Promise.all([listing(ctx,'trekProviders',400),listing(ctx,'trekPackages',400)]);
   return json({partners,packages});}catch(_){return apiError('admin_unavailable',503)}
 }
 if(path==='treks/admin/action'&&request.method==='POST'){
  if(!await isAdmin(ctx,claims))return apiError('forbidden',403);
  try{const b=await readJSON(request);
   if(b.kind==='provider'&&/^[A-Za-z0-9_-]{1,128}$/.test(b.id||'')&&['approve','pause'].includes(b.action)){
    const provider=await doc(ctx,'trekProviders/'+b.id);
    if(!provider)return apiError('not_found',404);
    await patch(ctx,'trekProviders/'+b.id,{status:b.action==='approve'?'approved':'paused',verified:b.action==='approve',
      approvedAt:b.action==='approve'?(provider.approvedAt||utcNow()):safe(provider.approvedAt,40),reviewerUid:claims.uid});
    return json({ok:true});
   }
   if(b.kind==='package'&&packagePattern.test(b.id||'')&&['publish','pause'].includes(b.action)){
    const pkg=await doc(ctx,'trekPackages/'+b.id);
    if(!pkg)return apiError('not_found',404);
    const owner=await doc(ctx,'trekProviders/'+pkg.ownerUid);
    if(b.action==='publish'&&(!owner||owner.status!=='approved'||owner.verified!==true))return apiError('approve_provider_first',409);
    await patch(ctx,'trekPackages/'+b.id,{status:b.action==='publish'?'published':'paused',
      reviewedAt:utcNow(),reviewerUid:claims.uid});
    return json({ok:true});
   }
   return apiError('invalid_action',422);
  }catch(_){return apiError('review_unavailable',503)}
 }
 if(path==='treks/order'&&request.method==='POST')return createOrder(request,env,ctx,claims);
 const status=path.match(/^treks\/order\/(rwtrek_[a-f0-9]{32})\/status$/);
 if(status&&request.method==='GET')return orderStatus(env,ctx,claims,status[1]);
 return apiError('not_found',404);
}
async function verifyProviderOrder(env,id,amount){
 const resp=await fetch(cfBase(env)+'/pg/orders/'+id,{headers:cfHeaders(env)});
 if(!resp.ok)throw Error('cashfree_lookup_failed');
 const data=await resp.json();
 if(data.order_id!==id||data.order_currency!=='INR'||Math.round(Number(data.order_amount)*100)!==Math.round(amount*100))
  throw Error('cashfree_order_mismatch');
 return data;
}
async function createOrder(request,env,ctx,claims){
 if(!env.CASHFREE_APP_ID||!env.CASHFREE_SECRET_KEY)return apiError('payment_unavailable',503);
 const gate=await doc(ctx,'config/trekMarketplace');
 const environment=String(env.CASHFREE_ENV||'sandbox')==='live'?'live':'sandbox';
 if(!gate||gate.checkoutEnabled!==true||gate.environment!==environment)return apiError('checkout_not_enabled',503);
 if(environment==='sandbox'&&!await isAdmin(ctx,claims))return apiError('sandbox_admin_only',403);
 let b;try{b=await readJSON(request)}catch(_){return apiError('invalid_json',400)}
 const phone=safe(b.phone,20).replace(/[\s()-]/g,''),email=safe(b.email,180);
 if(!validPhone(phone)||!validEmail(email)||email.toLowerCase()!==String(claims.email||'').toLowerCase()||!b.acknowledgePending||!b.agreeTerms)return apiError('checkout_fields_required',422);
 if(!/^[a-f0-9-]{36}$/.test(b.nonce||''))return apiError('invalid_nonce',422);
 const quoted=await quote(ctx,b.packageId,b.seats);
 if(quoted.error)return apiError(quoted.error,409);
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(claims.uid+':'+b.nonce));
 const id='rwtrek_'+Array.from(new Uint8Array(hash)).slice(0,16).map(x=>x.toString(16).padStart(2,'0')).join('');
 const payload={id,guestUid:claims.uid,guestEmail:email,guestPhone:phone,packageId:quoted.pkg.id,
  ownerUid:quoted.pkg.ownerUid,packageName:quoted.pkg.name,departure:quoted.pkg.start,
  travellers:quoted.count,amount:quoted.quote.total,operatorTotal:quoted.quote.operatorTotal,
  roamwiseServiceFee:quoted.quote.roamwiseServiceFee,partnerCommission:0,
  state:'payment_pending',seatStatus:'operator_confirmation_pending',createdAt:utcNow(),
  refundPolicy:quoted.pkg.refundPolicy,amountCurrency:'INR'};
 try{
  const wasCreated=await create(ctx,'trekBookings',id,payload);
  const record=wasCreated?payload:await doc(ctx,'trekBookings/'+id);
  if(!record||record.guestUid!==claims.uid||record.packageId!==payload.packageId||
     record.travellers!==payload.travellers||record.amount!==payload.amount||
     record.guestPhone!==phone)return apiError('checkout_conflict',409);
  let order;
  try{order=await verifyProviderOrder(env,id,record.amount)}
  catch(_){
   const body={order_id:id,order_amount:record.amount,order_currency:'INR',
    customer_details:{customer_id:claims.uid.slice(0,45),customer_phone:phone,customer_email:email},
    order_meta:{return_url:'https://roamwise.co.in/treks/?order_id='+id,
      notify_url:'https://roamwise-api.founder-f53.workers.dev/treks/cashfree/webhook'},
    order_note:record.packageName.slice(0,160)};
   const response=await fetch(cfBase(env)+'/pg/orders',{method:'POST',
     headers:{...cfHeaders(env),'x-idempotency-key':id},body:JSON.stringify(body)});
   if(!response.ok)return apiError('cashfree_order_unavailable',502);
   order=await response.json();
  }
  if(order.order_id!==id||order.order_currency!=='INR'||Math.round(Number(order.order_amount)*100)!==record.amount*100||
     order.order_status==='PAID')return apiError('order_already_paid_check_status',409);
  if(!order.payment_session_id)return apiError('payment_session_unavailable',503);
  return json({orderId:id,paymentSessionId:order.payment_session_id,environment:environment==='live'?'production':'sandbox',
    quote:quoted.quote,seatStatus:'operator_confirmation_pending'});
 }catch(_){return apiError('order_unavailable',503)}
}
async function orderStatus(env,ctx,claims,id){
 const record=await doc(ctx,'trekBookings/'+id);
 if(!record||record.guestUid!==claims.uid)return apiError('not_found',404);
 try{
  const order=await verifyProviderOrder(env,id,record.amount);
  if(order.order_status==='PAID'&&record.state!=='paid_pending_operator_confirmation'){
   await patch(ctx,'trekBookings/'+id,{state:'paid_pending_operator_confirmation',paidAt:utcNow()});
  }
  return json({orderId:id,state:order.order_status==='PAID'?'paid_pending_operator_confirmation':order.order_status,
    operatorConfirmationPending:true,operatorTotal:record.operatorTotal,serviceFee:record.roamwiseServiceFee});
 }catch(_){return apiError('payment_verification_unavailable',503)}
}
async function handleWebhook(request,env){
 if(request.method!=='POST')return apiError('method_not_allowed',405);
 if(!env.CASHFREE_SECRET_KEY||!env.FIREBASE_SERVICE_ACCOUNT_JSON)return apiError('webhook_unavailable',503);
 const raw=new Uint8Array(await request.arrayBuffer());
 if(!raw.length||raw.length>65536)return apiError('invalid_body',413);
 if(!await verifyCashfreeWorkerWebhook({rawBody:raw,headers:request.headers,secret:env.CASHFREE_SECRET_KEY}))
  return apiError('invalid_signature',401);
 let event;try{event=JSON.parse(new TextDecoder().decode(raw))}catch(_){return apiError('invalid_json',400)}
 const id=event?.data?.order?.order_id;
 if(event.type!=='PAYMENT_SUCCESS_WEBHOOK'||!orderPattern.test(id))return json({ignored:true});
 let ctx;try{ctx=await firestoreContext(env)}catch(_){return apiError('storage_unavailable',503)}
 const record=await doc(ctx,'trekBookings/'+id);
 if(!record)return apiError('unknown_order',404);
 try{
  const order=await verifyProviderOrder(env,id,record.amount);
  if(order.order_status!=='PAID')return apiError('not_paid',409);
  if(record.state!=='paid_pending_operator_confirmation')
   await patch(ctx,'trekBookings/'+id,{state:'paid_pending_operator_confirmation',paidAt:utcNow()});
  return json({received:true,operatorConfirmationPending:true});
 }catch(_){return apiError('verification_unavailable',503)}
}
