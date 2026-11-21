/* Public corporate brief intake: verified-by-human quotation only.
   POST /corporate/lead creates a Firestore record and attempts a founder alert.
   No checkout, no wallet, no unconditional discounts, no company account. */
import {json} from '../lib/http.js';
import {overLimit,clientIp} from '../lib/rate-limit.js';
import {parseServiceAccount,getServiceAccountAccessToken} from '../lib/service-account.js';
import {createDocIfAbsent,listDocs,deleteDocument} from '../lib/firestore-rest.js';
import {sendMail} from '../lib/mailer.js';
import {parseCorporateLead,corporateLeadId,expiredCorporateLead} from '../lib/corporate-lead-core.js';
const COLLECTION='corporateLeads';
function depsFor(env){
  let sa,token;
  const project=()=>(sa=sa||parseServiceAccount(env)).project_id;
  const access=()=>token||(token=getServiceAccountAccessToken(env));
  return {
    configured:()=>!!env.FIREBASE_SERVICE_ACCOUNT_JSON,
    async create(id,values){return createDocIfAbsent(env,await access(),project(),COLLECTION,id,values);},
    async list(){return listDocs(env,await access(),project(),COLLECTION,2000);},
    async remove(id){return deleteDocument(env,await access(),project(),COLLECTION+'/'+id);}
  };
}
export async function handleCorporateLead(request,env,deps,cacheImpl){
  deps=deps||depsFor(env);
  if(request.method!=='POST')return json({error:'method_not_allowed'},405);
  if(!deps.configured())return json({error:'intake_not_configured',message:'Corporate intake is not enabled yet; please send the brief by email.'},503);
  if(await overLimit('corporate-lead-ip',clientIp(request),4,600,cacheImpl))return json({error:'rate_limited',message:'Please try later or use the email enquiry option.'},429);
  if(await overLimit('corporate-lead-global','all',150,86400,cacheImpl))return json({error:'rate_limited',message:'Intake is busy; please use email.'},429);
  const body=await request.text();
  if(body.length>5000)return json({error:'too_large'},413);
  let data;try{data=JSON.parse(body);}catch(_){return json({error:'invalid_json'},400);}
  const p=parseCorporateLead(data);
  if(p.error)return json({error:p.error,message:'Please check the company details, retreat size and dates.'},400);
  const id=corporateLeadId(),now=new Date().toISOString();
  let created;
  try{created=await deps.create(id,{id,...p.value,status:'new',createdAt:now});}
  catch(_){return json({error:'intake_unavailable',message:'We could not confirm storage; please use email.'},503);}
  if(!created)return json({error:'try_again'},409);
  const summary=[
    'Corporate retreat request '+id,
    'Company: '+p.value.company,
    'Contact: '+p.value.contact+' <'+p.value.email+'>',
    'Role: '+p.value.role+' | Phone: '+p.value.phone,
    'Employees: '+p.value.employees+' | Nights: '+p.value.nights+' | Sharing: '+p.value.sharing,
    'Destination: '+p.value.destination+' | '+(p.value.startDate||'Flexible dates')+' to '+(p.value.endDate||'TBD'),
    'Budget per person: INR '+p.value.perPerson+' | Indicative programme INR '+p.value.estimate,
    'Potential annual allocation: INR '+p.value.allocation+' | Central retreats: '+p.value.centralSharePct+'%',
    'Preferences: '+p.value.preferences.join(', '),
    'Notes: '+p.value.notes,
    'No payment, supplier hold, approved bonus or booking was created.'
  ].join('\n');
  // Notification is best-effort after durable intake; never fail the lead due to email limits.
  if(!deps.skipMail)await sendMail(env,{to:'founder@roamwise.co.in',subject:'Corporate retreat request '+id+' · '+p.value.company,
    text:summary,channel:'manual'});
  return json({ok:true,id,quoteStatus:'supplier_review_required'});
}
export async function purgeOldCorporateLeads(env,deps,now){
  deps=deps||depsFor(env);
  if(!deps.configured())return 0;
  const rows=await deps.list();let count=0;
  for(const r of rows){if(expiredCorporateLead(r.createdAt,now)&&/^[A-Za-z0-9_-]{1,45}$/.test(String(r.id||''))){await deps.remove(r.id);count++;}}
  return count;
}
