import { json } from '../lib/http.js';
import { verifyFirebaseIdToken } from '../lib/firebase-verify.js';
import { getServiceAccountAccessToken, parseServiceAccount } from '../lib/service-account.js';
import { updateDoc } from '../lib/firestore-rest.js';

const ALLOWED=new Set(['ui_open','ui_error','plan_selected','gateway_start','gateway_error','checkout_left','paid','closed']);
const safe=(v,n)=>String(v||'').replace(/[^A-Za-z0-9_.:/-]/g,'_').slice(0,n);
export async function handlePaymentEvent(request,env){
  try{
    const auth=request.headers.get('authorization')||'',m=/^Bearer\s+(.+)$/i.exec(auth);if(!m)return json({error:'unauthorized'},401);
    if(Number(request.headers.get('content-length')||0)>2048)return json({error:'request_too_large'},413);
    const sa=parseServiceAccount(env),claims=await verifyFirebaseIdToken(m[1],sa.project_id),token=await getServiceAccountAccessToken(env);
    const body=await request.json(),stage=safe(body.stage,40);if(!ALLOWED.has(stage))return json({error:'invalid_stage'},400);
    const session=safe(body.session,80);if(!/^pay_[A-Za-z0-9_:-]{6,80}$/.test(session))return json({error:'invalid_session'},400);
    const id=session+'_'+Date.now().toString(36)+'_'+crypto.randomUUID().slice(0,8);
    await updateDoc(env,token,sa.project_id,`paymentUiEvents/${id}`,{uid:claims.uid,stage,planId:safe(body.planId,50),code:safe(body.code,80),path:safe(body.path,120),createdAt:new Date().toISOString()});
    return json({ok:true},202);
  }catch(_){return json({error:'event_not_recorded'},503)}
}
