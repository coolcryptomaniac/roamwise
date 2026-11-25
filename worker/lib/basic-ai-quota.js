import { basicAIConfig, basicAIReset } from './basic-ai-policy.js';

/* One SQLite-backed Durable Object per UTC day. Atomic reservations serialize
   the shared budget and user counters before inference starts. This is for
   the small launch pool; large-scale paid traffic needs partitioned budgets. */
export class BasicAIQuota {
  constructor(ctx,env){ this.storage=ctx.storage; this.env=env; }
  async fetch(request){
    if(request.method!=='POST') return Response.json({error:'method_not_allowed'},{status:405});
    const b=await request.json(), cfg=basicAIConfig(this.env), now=Date.now();
    const resetsAt=basicAIReset(now), minute=Math.floor(now/60000);
    if(typeof b.uid!=='string'||!/^[a-f0-9]{64}$/.test(b.uid)) return Response.json({error:'invalid_subject'},{status:400});
    const result=await this.storage.transaction(async tx=>{
      const key='u:'+b.uid, user=await tx.get(key)||{used:0,attempts:0,minute:0,burst:0};
      const view=()=>({used:user.used,limit:cfg.dailyLimit,remaining:Math.max(0,cfg.dailyLimit-user.used),period:'day',resetsAt});
      if(b.op==='status') return {ok:true,...view()};
      if(b.op==='settle'){
        const rk='r:'+String(b.id||''), record=await tx.get(rk);
        if(!record || record.uid!==b.uid || record.settled) return {ok:false,reason:'unknown_or_settled'};
        const global=await tx.get('global');
        // Failed/time-out calls may still be billed: retain their reservation.
        const actual=b.success && Number.isSafeInteger(b.actual) && b.actual>0 ? b.actual : record.estimate;
        global.neurons=Math.max(0,global.neurons+actual-record.estimate);
        if(!b.success) user.used=Math.max(0,user.used-1);
        await tx.put({global,[key]:user,[rk]:{...record,settled:true}});
        return {ok:true,...view()};
      }
      if(b.op!=='reserve'||typeof b.id!=='string'||!/^[-a-zA-Z0-9]{1,64}$/.test(b.id)
        ||!Number.isSafeInteger(b.estimate)||b.estimate<=0) return {ok:false,reason:'invalid_reservation'};
      if(!cfg.enabled) return {ok:false,reason:'basic_ai_disabled',...view()};
      if(user.used>=cfg.dailyLimit) return {ok:false,reason:'daily_limit',...view()};
      if(user.attempts>=cfg.dailyLimit*2) return {ok:false,reason:'retry_limit',...view()};
      if(user.minute===minute&&user.burst>=3) return {ok:false,reason:'slow_down',retryAfter:60,...view()};
      const global=await tx.get('global')||{neurons:0,requests:0,minute:0,burst:0};
      if(global.neurons+b.estimate>cfg.neuronBudget || global.requests>=cfg.requestCap)
        return {ok:false,reason:'shared_budget',...view()};
      if(global.minute===minute&&global.burst>=180) return {ok:false,reason:'busy',retryAfter:60,...view()};
      if(await tx.get('r:'+b.id)) return {ok:false,reason:'duplicate_reservation',...view()};
      user.burst=user.minute===minute?user.burst+1:1;user.minute=minute;
      user.used++;user.attempts++;
      global.burst=global.minute===minute?global.burst+1:1;global.minute=minute;
      global.neurons+=b.estimate;global.requests++;
      await tx.put({global,[key]:user,['r:'+b.id]:{uid:b.uid,estimate:b.estimate,settled:false}});
      if(!await tx.getAlarm()) await tx.setAlarm(Date.parse(resetsAt)+24*3600000);
      return {ok:true,id:b.id,...view()};
    });
    return Response.json(result);
  }
  async alarm(){ await this.storage.deleteAll(); }
}
