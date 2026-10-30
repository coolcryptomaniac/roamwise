import {parseServiceAccount, getServiceAccountAccessToken} from './service-account.js';
export async function bookingSandboxContext(env, tokenProvider=getServiceAccountAccessToken) {
  const project=env.BOOKING_FIRESTORE_PROJECT;
  if(env.CASHFREE_ENV!=='sandbox'||env.BOOKING_WEBHOOK_ENABLED!=='true'||
    !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project||'')||
    !project.includes('sandbox')||project==='roamwisepro') throw new Error('isolated_sandbox_required');
  const sa=parseServiceAccount(env);
  if(sa.project_id!==project)throw new Error('sandbox_project_mismatch');
  const token=await tokenProvider(env);
  const name='projects/'+project+'/databases/(default)/documents';
  return {project,name,base:'https://firestore.googleapis.com/v1/'+name,
    headers:{authorization:'Bearer '+token,'content-type':'application/json'}};
}
export const bookingFields=obj=>Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,
  typeof v==='number'?{integerValue:String(v)}:{stringValue:v}]));
export const bookingUnpack=d=>Object.fromEntries(Object.entries(d?.fields||{}).map(([k,v])=>[k,
  v.stringValue??v.timestampValue??v.booleanValue??(v.integerValue!==undefined?Number(v.integerValue):v.doubleValue??null)]));
