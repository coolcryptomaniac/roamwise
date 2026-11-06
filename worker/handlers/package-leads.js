import {parseServiceAccount,getServiceAccountAccessToken} from '../lib/service-account.js';
import {verifyFirebaseIdToken} from '../lib/firebase-verify.js';
// Authenticated, opt-in CRM intake for Firestore. Must be wired into Worker
// router explicitly. No payment/booking entitlement is created by a lead.
const ALLOWED_DESTINATIONS=new Set(['Almora and Kumaon','Manali and Tirthan','Lansdowne','Jim Corbett','Gir Gujarat','Multi-destination circuit']);
const ALLOWED_TYPES=new Set(['Solo escape','Duo escape','Friends and family','NMIMS / college group','Join a group (interest only)','Destination wedding enquiry','Corporate retreat']);
const fsText=v=>({stringValue:String(v)});
export async function handlePackageLead(request,env,{verifyToken=verifyFirebaseIdToken,tokenProvider=getServiceAccountAccessToken,fetchImpl=fetch}={}){
 if(request.method!=='POST')return Response.json({error:'method_not_allowed'},{status:405});
 if(env.PACKAGE_LEADS_ENABLED!=='true')return Response.json({error:'feature_disabled'},{status:503});
 if(Number(request.headers.get('content-length')||0)>4096)return Response.json({error:'oversize'},{status:413});
 const match=/^Bearer (.+)$/.exec(request.headers.get('authorization')||'');
 if(!match)return Response.json({error:'authentication_required'},{status:401});
 let sa,claims,record;
 try{
  sa=parseServiceAccount(env);
  if(env.FIREBASE_PROJECT_ID!==sa.project_id)throw Error('project mismatch');
  claims=await verifyToken(match[1],sa.project_id);
  if(!claims.uid&&!claims.sub)throw Error('no uid');
  const raw=await request.text();if(raw.length>4096)throw Error('oversize');
  record=JSON.parse(raw);
 }catch{return Response.json({error:'invalid_request_or_auth'},{status:400});}
 const {type,destination,start,guests,budget,origin,consent}=record||{};
 const travellerCount=Number(guests);
 if(consent!==true||!ALLOWED_TYPES.has(type)||!ALLOWED_DESTINATIONS.has(destination)||
 !/^\d{4}-\d{2}-\d{2}$/.test(start||'')||Date.parse(start+'T00:00:00Z')<Date.now()-86400000||
 !Number.isSafeInteger(travellerCount)||travellerCount<1||travellerCount>200||
 (budget!==undefined&&budget!==''&&(!Number.isSafeInteger(Number(budget))||Number(budget)<1000||Number(budget)>100000000))||
 String(origin||'').length>80)return Response.json({error:'invalid_lead'},{status:400});
 const uid=claims.uid||claims.sub;
 const fields={uid:fsText(uid),type:fsText(type),destination:fsText(destination),start:fsText(start),
 guests:{integerValue:String(travellerCount)},budgetMinor:{integerValue:String(budget?Number(budget)*100:0)},
 origin:fsText(origin||''),status:fsText('new'),source:fsText('escapes_form'),
 consentAt:{timestampValue:new Date().toISOString()},createdAt:{timestampValue:new Date().toISOString()}};
 try{
  const accessToken=await tokenProvider(env);
  const url='https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(sa.project_id)+'/databases/(default)/documents/packageLeads?documentId='+crypto.randomUUID();
  const r=await fetchImpl(url,{method:'POST',headers:{authorization:'Bearer '+accessToken,'content-type':'application/json'},body:JSON.stringify({fields})});
  if(!r.ok)return Response.json({error:'lead_unavailable'},{status:503});
  return Response.json({received:true,status:'new'},{status:201});
 }catch{return Response.json({error:'lead_unavailable'},{status:503});}
}
