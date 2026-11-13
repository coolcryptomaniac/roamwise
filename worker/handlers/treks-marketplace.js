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
import {calculateTrekQuote} from '../../treks/price-policy.mjs';
import {sendMail} from '../lib/mailer.js';

const FOUNDER_EMAIL='founder@roamwise.co.in';
const SITE='https://roamwise.co.in/treks/';
/* Plain-language notifications so nobody has to keep checking the page. Best effort: never blocks or fails a request. */
async function notify(env,to,subject,lines){
 if(!to)return;
 try{await sendMail(env,{to,subject,text:lines.filter(x=>x!==null&&x!==undefined).join('\n')+'\n\n— RoamWise Trails\nsupport@roamwise.co.in'})}catch(_){/* best effort */}
}
const ROLE_LABEL={company:'Trekking company',guide:'Independent guide',transport:'Transport provider',experience:'Outdoor experience'};

const safe=(v,n=160)=>String(v==null?'':v).trim().slice(0,n);
const allowedRoles=['company','guide','transport','experience'];
const enquiryPattern=/^te_[a-f0-9]{32}$/;
const ISO=/^\d{4}-\d{2}-\d{2}$/;
const orderPattern=/^rwtrek_[a-f0-9]{32}$/;
const packagePattern=/^tp_[a-f0-9]{32}$/;
const validEmail=(v)=>/^\S+@\S+\.\S+$/.test(v);
const validPhone=(v)=>/^\+?[0-9]{10,15}$/.test(v);
/* Accept what people actually type: spaces, dashes, brackets, a leading 0 or none of the +91. */
const cleanPhone=(v)=>{let d=String(v==null?'':v).replace(/[\s().-]/g,'');if(/^0[6-9]\d{9}$/.test(d))d=d.slice(1);if(/^[6-9]\d{9}$/.test(d))d='+91'+d;return d.slice(0,16)};
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
function publicProvider(provider){
 return {id:provider.id,name:provider.name,role:provider.role,region:provider.region,website:provider.website,description:provider.description,
  instagram:provider.instagram||'',cofounders:provider.showFounderNames===true?provider.cofounders||'':'',
   businessWhatsapp:provider.showBusinessWhatsapp===true?String(provider.phone||'').replace(/[^0-9]/g,''):''};
}
function publicPackage(pkg,provider){
 return {id:pkg.id,provider:publicProvider(provider),name:pkg.name,region:pkg.region,start:pkg.start,duration:pkg.duration,
  difficulty:pkg.difficulty,unitPrice:pkg.unitPrice,pricingUnit:pkg.pricingUnit,seats:pkg.seats,includes:pkg.includes,
  excludes:pkg.excludes,itinerary:pkg.itinerary,refundPolicy:pkg.refundPolicy,imageUrl:pkg.imageUrl,
  galleryUrls:Array.isArray(pkg.galleryUrls)?pkg.galleryUrls.slice(0,4):[],
  safetyNote:pkg.safetyNote,altitude:pkg.altitude||'',meetingPoint:pkg.meetingPoint||'',
     minGroupSize:pkg.minGroupSize||null,packingList:pkg.packingList||'',operatorConfirmationRequired:true};
}
async function approved(ctx,id){
 if(!packagePattern.test(id||''))return null;
 const pkg=await doc(ctx,'trekPackages/'+id);
 if(!pkg||pkg.status!=='published'||!pkg.ownerUid)return null;
 const owner=await doc(ctx,'trekProviders/'+pkg.ownerUid);
 if(!owner||owner.status!=='approved'||owner.verified!==true)return null;
 if(!ISO.test(pkg.start)||Date.parse(pkg.start+'T00:00:00Z')<=Date.now())return null;
 pkg.id=id; // getDoc returns fields only
 return {pkg,owner};
}
async function quote(ctx,id,seats){
 const entry=await approved(ctx,id);
 if(!entry)return {error:'not_available'};
 const p=entry.pkg;
 try {
  const calculated=calculateTrekQuote({unitPrice:p.unitPrice,pricingUnit:p.pricingUnit,travellers:seats,capacity:p.seats});
  return {pkg:p,owner:entry.owner,count:calculated.travellers,quote:{packageId:id,name:p.name,departure:p.start,...calculated,
    confirmation:'Pending operator confirmation after successful payment'}};
 }catch(e){return {error:e.message||'invalid_quote'}}
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
   const [packages,providers,gate]=await Promise.all([listing(ctx,'trekPackages',500),listing(ctx,'trekProviders',500),doc(ctx,'config/trekMarketplace')]);
   const map=new Map(providers.filter(p=>p.status==='approved'&&p.verified===true).map(p=>[p.id,p]));
   const items=packages.filter(p=>p.status==='published'&&map.has(p.ownerUid)&&ISO.test(p.start)&&Date.parse(p.start+'T00:00:00Z')>Date.now()).map(p=>publicPackage(p,map.get(p.ownerUid)));
   return json({items,checkoutEnabled:!!(gate?.checkoutEnabled===true&&gate.environment===(String(env.CASHFREE_ENV||'sandbox')==='live'?'live':'sandbox')&&env.CASHFREE_APP_ID&&env.CASHFREE_SECRET_KEY),feePolicy:'1% of operator subtotal, capped at INR 99; disclosed before payment'});
  }catch(_){return apiError('catalog_unavailable',503)}
 }
 if(path==='treks/enquiry'&&request.method==='POST'){
  try{
   const b=await readJSON(request);
   if(b.website||b.fax||b.companyHomepage)return apiError('invalid_enquiry',422); // hidden honeypot
   const name=safe(b.name,80),email=safe(b.email,160).toLowerCase(),phone=cleanPhone(b.phone),note=safe(b.message,500);
   if(b.consent!==true||name.length<2||!validEmail(email)||phone&&!validPhone(phone)||note.length<5)
     return apiError('complete_enquiry_and_consent',422);
   if(!packagePattern.test(b.packageId||''))return apiError('invalid_package',422);
   const entry=await approved(ctx,b.packageId);
   if(!entry)return apiError('departure_not_available',409);
   const id='te_'+crypto.randomUUID().replace(/-/g,'');
   const record={ownerUid:entry.pkg.ownerUid,packageId:entry.pkg.id,packageName:entry.pkg.name,
     name,email,phone,message:note,consent:true,status:'new',createdAt:utcNow(),source:'roamwise-treks'};
   await create(ctx,'trekEnquiries',id,record);
   await notify(env,entry.owner.email,'New enquiry: '+entry.pkg.name,['Hello '+entry.owner.name+',','',name+' asked about '+entry.pkg.name+' ('+entry.pkg.start+'):','"'+note+'"','',
     'Reply to them directly: '+email+(phone?' · '+phone:''),'They agreed to share these details with you for this trek only.','',
     'When you have replied, mark it "contacted" in your partner studio: '+SITE+'#studio']);
   return json({ok:true,reference:id,message:'Enquiry sent to the operator inbox. No booking or payment was made.'},201);
  }catch(_){return apiError('enquiry_unavailable',503)}
 }
 if(path==='treks/quote'&&request.method==='POST'){
  try{const b=await readJSON(request);const q=await quote(ctx,b.packageId,b.seats);return q.error?apiError(q.error,409):json({quote:q.quote});}
  catch(_){return apiError('invalid_quote',422)}
 }
 const claims=await identity(request,ctx);
 if(!claims)return apiError('verified_login_required',401);
 if(path==='treks/enquiries/status'&&request.method==='POST'){
  try{
   const provider=await doc(ctx,'trekProviders/'+claims.uid);
   if(!provider||provider.status!=='approved'||provider.verified!==true)return apiError('approved_operator_required',403);
   const input=await readJSON(request),id=safe(input.id,64),status=safe(input.status,16);
   if(!enquiryPattern.test(id)||!['new','contacted','closed'].includes(status))return apiError('invalid_enquiry_status',422);
   const previous=await doc(ctx,'trekEnquiries/'+id);
   if(!previous||previous.ownerUid!==claims.uid)return apiError('not_found',404);
   await patch(ctx,'trekEnquiries/'+id,{status,updatedAt:utcNow(),followupNote:safe(input.note,200)});
   return json({ok:true,status});
  }catch(_){return apiError('enquiry_update_unavailable',503)}
 }
 if(path==='treks/enquiries'&&request.method==='GET'){
  try{
   const partner=await doc(ctx,'trekProviders/'+claims.uid);
   if(!partner||partner.status!=='approved'||partner.verified!==true)return apiError('approved_operator_required',403);
   const requests=await queryEqualsString(env,ctx.token,ctx.project,'trekEnquiries','ownerUid',claims.uid,150);
   return json({items:requests.filter(e=>enquiryPattern.test(e.id||'')&&e.consent===true)
     .sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).map(e=>({
      id:e.id,packageId:e.packageId,packageName:e.packageName,name:e.name,email:e.email,phone:e.phone,
      message:e.message,status:e.status,createdAt:e.createdAt
     }))});
  }catch(_){return apiError('enquiries_unavailable',503)}
 }
 if(path==='treks/mine'&&request.method==='GET'){
  try{
   const [partner,packages,bookings]=await Promise.all([
    doc(ctx,'trekProviders/'+claims.uid),
    queryEqualsString(env,ctx.token,ctx.project,'trekPackages','ownerUid',claims.uid,200),
    queryEqualsString(env,ctx.token,ctx.project,'trekBookings','ownerUid',claims.uid,200)
   ]);
   const requests=bookings.filter(b=>['paid_pending_operator_confirmation','operator_confirmed','refund_review_required'].includes(b.state)).map(b=>({
     id:b.id,packageName:b.packageName,departure:b.departure,travellers:b.travellers,
     operatorTotal:b.operatorTotal,state:b.state,operatorDecisionNote:b.operatorDecisionNote||'',
     guestEmail:b.shareContactWithOperator?b.guestEmail:null,
     guestPhone:b.shareContactWithOperator?b.guestPhone:null
   }));
   return json({partner,packages,bookings:requests});
  }catch(_){return apiError('account_unavailable',503)}
 }
 if(path==='treks/apply'&&request.method==='POST'){
  try{
   const b=await readJSON(request),phone=cleanPhone(b.phone);
   const missing=[];
   if(!allowedRoles.includes(b.role))missing.push('role');
   if(safe(b.name,100).length<2)missing.push('name');
   if(safe(b.region,100).length<2)missing.push('region');
   if(!validPhone(phone))missing.push('phone');
   if(!validEmail(safe(b.email,180)))missing.push('email');
   if(b.consent!==true)missing.push('consent');
   if(missing.length)return json({error:'complete_required_fields',fields:missing},422);
   if(safe(b.email,180).toLowerCase()!==safe(claims.email,180).toLowerCase())return apiError('email_must_match_login',422);
   const existing=await doc(ctx,'trekProviders/'+claims.uid);
   /* An approved operator updating their profile stays approved, so live treks keep selling; the founder is told what changed. */
   const keepApproval=existing?.status==='approved'&&existing.verified===true;
   const next={ownerUid:claims.uid,name:safe(b.name,100),role:b.role,region:safe(b.region,100),
     website:safe(b.website,250),description:safe(b.description,800),
     instagram:/^https:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._]{1,35}\/?$/.test(safe(b.instagram,200))?safe(b.instagram,200):'',
     cofounders:safe(b.cofounders,250),showFounderNames:b.showFounderNames===true,
      showBusinessWhatsapp:b.showBusinessWhatsapp===true,
     phone,
     email:safe(b.email,180),registration:safe(b.registration,100),safetyCredentials:safe(b.safetyCredentials,500),
     vehiclePermit:safe(b.vehiclePermit,150),refundPolicy:safe(b.refundPolicy,800),
     status:keepApproval?'approved':'pending_review',verified:keepApproval,reviewNote:keepApproval?safe(existing.reviewNote,300):'',
     commissionPercent:0,feeWaiverYears:3,contributions:'voluntary_only_never_required',
     updatedAt:utcNow(),createdAt:existing?.createdAt||utcNow()};
   if(existing)await patch(ctx,'trekProviders/'+claims.uid,next);
   else await create(ctx,'trekProviders',claims.uid,next);
   await notify(env,FOUNDER_EMAIL,(keepApproval?'Trek partner updated profile: ':existing?'Trek partner resubmitted: ':'New trek partner application: ')+next.name,[
     next.name+' ('+(ROLE_LABEL[next.role]||next.role)+', '+next.region+')',
     'Contact: '+next.email+' · '+next.phone,next.website?'Website: '+next.website:null,
     'Safety / certifications: '+(next.safetyCredentials||'not given'),next.registration?'Registration: '+next.registration:null,'',
     keepApproval?'They stay approved. Check the change and pause them if needed:':'Review and approve or request changes:',SITE+'#review']);
   if(!existing)await notify(env,next.email,'We received your RoamWise Trails application',['Hello '+next.name+',','',
     'Thank you for applying to list with RoamWise Trails. Here is what happens next:',
     '1. Add your first departure in your partner studio (dates, price, day-by-day plan, inclusions, safety): '+SITE+'#studio',
     '2. RoamWise reviews your business and the departure, usually within 2 working days.',
     '3. We email you when you are approved and when each departure goes live.',
     '4. Travellers can then enquire or book; enquiries and paid bookings arrive in your studio and by email.',
     '','There is no joining fee and 0% commission on your price for your first three years.']);
   return json({ok:true,status:next.status,message:keepApproval?'Profile updated. You stay approved and your live treks keep selling.':'Application received. Next: add your first departure below. We review within 2 working days and email you.'});
  }catch(_){return apiError('application_unavailable',503)}
 }
 if(path==='treks/package/close'&&request.method==='POST'){
  try{
   const input=await readJSON(request),id=safe(input.packageId,64);
   if(!packagePattern.test(id))return apiError('invalid_package',422);
   const pkg=await doc(ctx,'trekPackages/'+id);
   if(!pkg||pkg.ownerUid!==claims.uid)return apiError('forbidden',403);
   if(pkg.status==='paused')return json({ok:true,status:'paused',alreadyClosed:true});
   if(!['published','pending_review'].includes(pkg.status))return apiError('departure_not_closable',409);
   await patch(ctx,'trekPackages/'+id,{status:'paused',closedByOperator:true,closedAt:utcNow(),updatedAt:utcNow()});
   return json({ok:true,status:'paused',note:'New booking and enquiry requests stopped. Existing paid requests still need individual handling.'});
  }catch(_){return apiError('close_departure_unavailable',503)}
 }
 if(path==='treks/package'&&request.method==='POST'){
  try{
   const b=await readJSON(request),owner=await doc(ctx,'trekProviders/'+claims.uid);
   if(!owner||!['pending_review','approved','changes_requested'].includes(owner.status))return apiError('partner_application_required',403);
   const name=safe(b.name,110),region=safe(b.region,100),start=safe(b.start,10),
    price=Number(b.unitPrice),seats=Number(b.seats),days=Number(b.duration);
   const problems=[];
   if(!name)problems.push('name');if(!region)problems.push('region');
   if(!ISO.test(start)||Date.parse(start+'T00:00:00Z')<=Date.now())problems.push('start');
   if(!Number.isSafeInteger(price)||price<100||price>200000)problems.push('unitPrice');
   if(!Number.isSafeInteger(seats)||seats<1||seats>100)problems.push('seats');
   if(!Number.isSafeInteger(days)||days<1||days>60)problems.push('duration');
   for(const k of ['itinerary','includes','refundPolicy','safetyNote'])if(!safe(b[k],10))problems.push(k);
   if(problems.length)return json({error:'missing_or_invalid_package_details',fields:problems},422);
   if(!name||!region||!ISO.test(start)||Date.parse(start+'T00:00:00Z')<=Date.now()||
      !Number.isSafeInteger(price)||price<100||price>200000||
      !Number.isSafeInteger(seats)||seats<1||seats>100||
      !Number.isSafeInteger(days)||days<1||days>60||
      !safe(b.includes,1800)||!safe(b.itinerary,3500)||!safe(b.refundPolicy,800)||!safe(b.safetyNote,800))
      return apiError('missing_or_invalid_package_details',422);
   const gallery=String(b.galleryUrls||'').split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
   if(gallery.length>4||gallery.some(u=>u.length>450||!/^https:\/\/[^\s<>"']+$/i.test(u)))return apiError('invalid_gallery_urls',422);
   const data={ownerUid:claims.uid,name,region,start,unitPrice:price,pricingUnit:['person','vehicle','group'].includes(b.pricingUnit)?b.pricingUnit:'person',seats,duration:days,
      difficulty:safe(b.difficulty,60),altitude:safe(b.altitude,90),meetingPoint:safe(b.meetingPoint,160),
       minGroupSize:Number.isSafeInteger(Number(b.minGroupSize))&&Number(b.minGroupSize)>=1&&Number(b.minGroupSize)<=100?Number(b.minGroupSize):null,
       packingList:safe(b.packingList,850),
       includes:safe(b.includes,1800),excludes:safe(b.excludes,1800),
      itinerary:safe(b.itinerary,3500),refundPolicy:safe(b.refundPolicy,800),
      safetyNote:safe(b.safetyNote,800),imageUrl:/^https:\/\//.test(b.imageUrl||'')?safe(b.imageUrl,450):'',
      galleryUrls:gallery,
      status:'pending_review',updatedAt:utcNow()};
   const id=packagePattern.test(b.id||'')?b.id:'tp_'+crypto.randomUUID().replace(/-/g,'');
   const prev=await doc(ctx,'trekPackages/'+id);
   if(prev&&prev.ownerUid!==claims.uid)return apiError('forbidden',403);
   if(prev)await patch(ctx,'trekPackages/'+id,{...data,reviewNote:''});
   else await create(ctx,'trekPackages',id,{...data,createdAt:utcNow()});
   await notify(env,FOUNDER_EMAIL,(prev?'Trek departure edited: ':'New trek departure: ')+name+' · '+owner.name,[
     name+' by '+owner.name+(owner.status==='approved'?' (approved operator)':' (operator not approved yet)'),
     start+' · '+days+' days · Rs '+price.toLocaleString('en-IN')+' per '+data.pricingUnit+' · '+seats+' seats',
     prev&&prev.status==='published'?'It was live; it is hidden until you publish it again.':null,'',
     'Review: '+SITE+'#review']);
   return json({ok:true,id,status:'pending_review',wasLive:prev?.status==='published'});
  }catch(_){return apiError('package_save_unavailable',503)}
 }
 if(path==='treks/operator/decision'&&request.method==='POST'){
  try{
   const input=await readJSON(request),id=safe(input.bookingId,64),action=safe(input.action,25);
   if(!orderPattern.test(id)||!['confirm','refund_review'].includes(action))return apiError('invalid_decision',422);
   const operator=await doc(ctx,'trekProviders/'+claims.uid);
   if(!operator||operator.verified!==true||operator.status!=='approved')return apiError('approved_operator_required',403);
   const record=await doc(ctx,'trekBookings/'+id);
   if(!record||record.ownerUid!==claims.uid)return apiError('forbidden',403);
   if(record.state!=='paid_pending_operator_confirmation')return apiError('booking_not_awaiting_decision',409);
   const note=safe(input.note,300);
   if(note.length<8)return apiError('operator_reference_required',422);
   const cf=await verifyProviderOrder(env,id,record.amount);
   if(cf.order_status!=='PAID')return apiError('payment_not_verified',409);
   await patch(ctx,'trekBookings/'+id,{state:action==='confirm'?'operator_confirmed':'refund_review_required',
     operatorDecisionAt:utcNow(),operatorDecisionNote:note,confirmedByUid:claims.uid});
   return json({ok:true,automaticRefund:false,automaticPayout:false});
  }catch(_){return apiError('decision_unavailable',503)}
 }
 if(path==='treks/admin'&&request.method==='GET'){
  if(!await isAdmin(ctx,claims))return apiError('forbidden',403);
  try{const [partners,packages,bookings]=await Promise.all([listing(ctx,'trekProviders',400),listing(ctx,'trekPackages',400),listing(ctx,'trekBookings',200)]);
   return json({partners,packages,bookings});}catch(_){return apiError('admin_unavailable',503)}
 }
 if(path==='treks/admin/action'&&request.method==='POST'){
  if(!await isAdmin(ctx,claims))return apiError('forbidden',403);
  try{const b=await readJSON(request);
   const reviewNote=safe(b.note,300);
   if(b.kind==='provider'&&/^[A-Za-z0-9_-]{1,128}$/.test(b.id||'')&&['approve','pause','changes'].includes(b.action)){
    const provider=await doc(ctx,'trekProviders/'+b.id);
    if(!provider)return apiError('not_found',404);
    if(b.action==='changes'&&reviewNote.length<5)return apiError('review_note_required',422);
    await patch(ctx,'trekProviders/'+b.id,{status:b.action==='approve'?'approved':b.action==='changes'?'changes_requested':'paused',verified:b.action==='approve',
      approvedAt:b.action==='approve'?(provider.approvedAt||utcNow()):safe(provider.approvedAt,40),reviewerUid:claims.uid,
      reviewNote:b.action==='approve'?'':reviewNote,reviewedAt:utcNow()});
    if(b.action==='approve')await notify(env,provider.email,'You are approved on RoamWise Trails',['Hello '+provider.name+',','',
      'Your business is approved on RoamWise Trails.','Each departure you add is checked once before it goes live; we email you when it does.',
      'Add or manage departures: '+SITE+'#studio']);
    else await notify(env,provider.email,b.action==='changes'?'Please update your RoamWise Trails application':'Your RoamWise Trails listing is paused',['Hello '+provider.name+',','',
      b.action==='changes'?'Thank you for applying. Before we can approve you, please update:':'Your listing is paused, so your treks are not shown to travellers for now.',
      reviewNote?'"'+reviewNote+'"':null,'',b.action==='changes'?'Update and resubmit here (Become a partner tab): '+SITE+'#join':'Questions? Reply to this email.']);
    return json({ok:true});
   }
   if(b.kind==='package'&&packagePattern.test(b.id||'')&&['publish','pause','changes'].includes(b.action)){
    const pkg=await doc(ctx,'trekPackages/'+b.id);
    if(!pkg)return apiError('not_found',404);
    const owner=await doc(ctx,'trekProviders/'+pkg.ownerUid);
    if(b.action==='publish'&&(!owner||owner.status!=='approved'||owner.verified!==true))return apiError('approve_provider_first',409);
    if(b.action==='changes'&&reviewNote.length<5)return apiError('review_note_required',422);
    await patch(ctx,'trekPackages/'+b.id,{status:b.action==='publish'?'published':b.action==='changes'?'changes_requested':'paused',
      reviewNote:b.action==='publish'?'':reviewNote,reviewedAt:utcNow(),reviewerUid:claims.uid});
    if(owner)await notify(env,owner.email,b.action==='publish'?'Live on RoamWise: '+pkg.name:b.action==='changes'?'Please update: '+pkg.name:'Paused: '+pkg.name,['Hello '+owner.name+',','',
      b.action==='publish'?pkg.name+' ('+pkg.start+') is now live. Share this link with travellers:':b.action==='changes'?pkg.name+' ('+pkg.start+') needs a few changes before it can go live:':pkg.name+' ('+pkg.start+') has been paused and is hidden from travellers.',
      b.action==='publish'?SITE+'?package='+encodeURIComponent(b.id)+'#discover':reviewNote?'"'+reviewNote+'"':null,'',
      'Manage your departures: '+SITE+'#studio']);
    return json({ok:true});
   }
   if(b.kind==='booking'&&orderPattern.test(b.id||'')&&['confirm','refund_review'].includes(b.action)){
    const record=await doc(ctx,'trekBookings/'+b.id);
    if(!record)return apiError('not_found',404);
    if(record.state!=='paid_pending_operator_confirmation')return apiError('not_pending_operator_confirmation',409);
    const note=safe(b.note,300);
    if(note.length<8)return apiError('operator_evidence_required',422);
    await patch(ctx,'trekBookings/'+b.id,{state:b.action==='confirm'?'operator_confirmed':'refund_review_required',
      operatorDecisionAt:utcNow(),operatorDecisionNote:note,reviewerUid:claims.uid});
    return json({ok:true,automaticRefund:false,automaticPayout:false});
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
 const phone=cleanPhone(b.phone),email=safe(b.email,180);
 if(!validPhone(phone)||!validEmail(email)||email.toLowerCase()!==String(claims.email||'').toLowerCase()||!b.acknowledgePending||!b.agreeTerms)return apiError('checkout_fields_required',422);
 if(!/^[a-f0-9-]{36}$/.test(b.nonce||''))return apiError('invalid_nonce',422);
 const quoted=await quote(ctx,b.packageId,b.seats);
 if(quoted.error)return apiError(quoted.error,409);
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(claims.uid+':'+b.nonce));
 const id='rwtrek_'+Array.from(new Uint8Array(hash)).slice(0,16).map(x=>x.toString(16).padStart(2,'0')).join('');
 const payload={id,guestUid:claims.uid,guestEmail:email,guestPhone:phone,packageId:quoted.quote.packageId,
  ownerUid:quoted.pkg.ownerUid,packageName:quoted.pkg.name,departure:quoted.pkg.start,
  travellers:quoted.count,amount:quoted.quote.total,operatorTotal:quoted.quote.operatorTotal,
  roamwiseServiceFee:quoted.quote.roamwiseServiceFee,partnerCommission:0,
  shareContactWithOperator:b.shareContactWithOperator===true,
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
   const hex=id.slice('rwtrek_'.length);
   // Cashfree expects UUID-shaped idempotency keys, not our order ID string.
   const idempotencyKey=[hex.slice(0,8),hex.slice(8,12),'5'+hex.slice(13,16),
     '8'+hex.slice(17,20),hex.slice(20)].join('-');
   const response=await fetch(cfBase(env)+'/pg/orders',{method:'POST',
     headers:{...cfHeaders(env),'x-idempotency-key':idempotencyKey},body:JSON.stringify(body)});
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
/* A verified payment: the operator is asked to confirm the seats; the founder gets a copy. Once per booking (state guard above). */
async function notifyPaid(env,ctx,record,id){
 const owner=record.ownerUid?await doc(ctx,'trekProviders/'+record.ownerUid).catch(()=>null):null;
 const lines=[record.packageName+' · departure '+record.departure+' · '+record.travellers+' traveller(s)',
  'Your price for this booking: Rs '+Number(record.operatorTotal||0).toLocaleString('en-IN'),'Reference: '+id,
  record.shareContactWithOperator?'Traveller: '+record.guestEmail+(record.guestPhone?' · '+record.guestPhone:''):'The traveller chose not to share contact details; RoamWise will coordinate.','',
  'Please confirm the seats (or say you cannot) in your partner studio: '+SITE+'#studio'];
 if(owner)await notify(env,owner.email,'Paid booking to confirm: '+record.packageName,['Hello '+owner.name+',','','A traveller has paid through RoamWise.',...lines]);
 await notify(env,FOUNDER_EMAIL,'Paid trek booking: '+record.packageName,[...lines,'Operator: '+(owner?owner.name+' · '+owner.email:'unknown')]);
}
async function orderStatus(env,ctx,claims,id){
 const record=await doc(ctx,'trekBookings/'+id);
 if(!record||record.guestUid!==claims.uid)return apiError('not_found',404);
 try{
  const order=await verifyProviderOrder(env,id,record.amount);
  if(order.order_status==='PAID'&&record.state==='payment_pending'){
   await patch(ctx,'trekBookings/'+id,{state:'paid_pending_operator_confirmation',paidAt:utcNow()});
   await notifyPaid(env,ctx,record,id);
  }
  return json({orderId:id,state:order.order_status==='PAID'?(record.state==='operator_confirmed'||record.state==='refund_review_required'?record.state:'paid_pending_operator_confirmation'):order.order_status,
    operatorConfirmationPending:record.state!=='operator_confirmed',operatorTotal:record.operatorTotal,serviceFee:record.roamwiseServiceFee});
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
  if(record.state==='payment_pending'){
   await patch(ctx,'trekBookings/'+id,{state:'paid_pending_operator_confirmation',paidAt:utcNow()});
   await notifyPaid(env,ctx,record,id);
  }
  return json({received:true,operatorConfirmationPending:true});
 }catch(_){return apiError('verification_unavailable',503)}
}
