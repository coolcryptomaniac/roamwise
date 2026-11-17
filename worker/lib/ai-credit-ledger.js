import {AI_CREDIT_PACKS,AI_ORDER_RE} from './ai-credit-policy.js';
const DAY=86400000;
const view=s=>({balancePaise:s.balance,heldPaise:s.held,accountHold:s.hold||s.refundHolds.length>0,history:s.history.slice(-20).reverse()});
const initial=()=>({balance:0,held:0,hold:false,refundHolds:[],history:[]});
function log(s,event){s.history.push({at:new Date().toISOString(),...event});s.history=s.history.slice(-40);}

// Private namespace only. HTTP handlers authenticate, verify providers and
// construct every ledger operation; no browser can call this object directly.
export class AICreditAccount {
  constructor(ctx,env){this.storage=ctx.storage;this.env=env;}
  async fetch(request){
    if(request.method!=='POST')return Response.json({error:'method_not_allowed'},{status:405});
    const b=await request.json(),now=Date.now();
    const result=await this.storage.transaction(async tx=>{
      const s=await tx.get('state')||initial();
      if(b.op==='status'){
        const ids=await tx.get('recentOrders')||[],orders=[];
        for(const id of ids.slice(-20).reverse()){const o=await tx.get('o:'+id);if(o)orders.push({id:o.id,amountPaise:o.amountPaise,status:o.status,refundedPaise:o.refunded||0,createdAt:o.createdAt});}
        return {ok:true,...view(s),orders};
      }
      if(b.op==='order')return {ok:true,order:await tx.get('o:'+b.id)||null};
      if(b.op==='prepareOrder'){
        const pack=AI_CREDIT_PACKS.find(p=>p.id===b.packId);
        if(!pack||!AI_ORDER_RE.test(b.id))return {ok:false,error:'invalid_pack'};
        const pending=await tx.get('pendingOrder');
        if(pending){const old=await tx.get('o:'+pending);if(old&&old.status==='pending'&&now<old.expiresAt)return {ok:true,order:old,reused:true};}
        const day=Math.floor(now/DAY),count=await tx.get('ordersDay')||{day,n:0};
        if(count.day===day&&count.n>=20)return {ok:false,error:'too_many_orders'};
        const old=await tx.get('o:'+b.id);if(old)return {ok:true,order:old,reused:true};
        const order={id:b.id,packId:pack.id,amountPaise:pack.amountPaise,environment:b.environment,status:'pending',createdAt:now,expiresAt:now+30*60000,idempotencyKey:b.idempotencyKey};
        const ids=await tx.get('recentOrders')||[];
        await tx.put({['o:'+b.id]:order,pendingOrder:b.id,recentOrders:[...ids,b.id].slice(-20),ordersDay:{day,n:count.day===day?count.n+1:1}});
        return {ok:true,order};
      }
      if(b.op==='reconcile'){
        const o=await tx.get('o:'+b.id);if(!o)return {ok:false,error:'order_not_found'};
        if(b.paid){
          if(!Number.isSafeInteger(b.refunded)||b.refunded<0||b.refunded>o.amountPaise)return {ok:false,error:'invalid_refund'};
          const paymentKey='payment:'+b.paymentId,seen=await tx.get(paymentKey);
          if(seen&&seen!==o.id)return {ok:false,error:'duplicate_payment'};
          if(!o.granted){s.balance+=o.amountPaise;o.granted=true;o.paymentId=b.paymentId;log(s,{kind:'topup',amountPaise:o.amountPaise,orderId:o.id});}
          if(o.paymentId!==b.paymentId)return {ok:false,error:'payment_changed'};
          const refunded=Math.max(o.refunded||0,b.refunded),delta=refunded-(o.refunded||0);
          if(delta){s.balance-=delta;log(s,{kind:'refund',amountPaise:-delta,orderId:o.id});}
          s.refundHolds=s.refundHolds.filter(id=>id!==o.id);if(b.pending)s.refundHolds.push(o.id);
          o.refunded=refunded;o.status=refunded===o.amountPaise?'refunded':refunded?'partially_refunded':'paid';
          await tx.put({[paymentKey]:o.id,['o:'+o.id]:o,state:s});
        }else if(['EXPIRED','TERMINATED'].includes(b.status)&&!o.granted){o.status=b.status.toLowerCase();await tx.put('o:'+o.id,o);}
        return {ok:true,status:o.status,...view(s)};
      }
      if(b.op==='hold'){s.hold=true;await tx.put('state',s);return {ok:true};}
      if(b.op==='quote'){
        const minute=Math.floor(now/60000),rate=await tx.get('quoteRate')||{minute,n:0};
        if(rate.minute===minute&&rate.n>=6)return {ok:false,error:'slow_down'};
        if(s.hold||s.refundHolds.length)return {ok:false,error:'account_on_hold'};
        const q={...b.quote,status:'quoted',createdAt:now,expiresAt:now+5*60000};
        await tx.put({['q:'+q.id]:q,quoteRate:{minute,n:rate.minute===minute?rate.n+1:1}});
        if(!await tx.getAlarm())await tx.setAlarm(now+10*60000);
        return {ok:true,quote:q,...view(s)};
      }
      const q=await tx.get('q:'+b.id);
      if(!q)return {ok:false,error:'quote_not_found'};
      if(b.op==='reserve'){
        if(q.hash!==b.hash)return {ok:false,error:'quote_changed'};
        if(q.status==='done')return {ok:true,replay:true,result:q.result};
        if(q.status!=='quoted')return {ok:false,error:'request_in_progress'};
        if(now>q.expiresAt)return {ok:false,error:'quote_expired'};
        if(s.hold||s.refundHolds.length)return {ok:false,error:'account_on_hold'};
        if(s.balance<q.price.totalPaise)return {ok:false,error:'insufficient_credits'};
        const day=Math.floor(now/DAY),minute=Math.floor(now/60000),rate=await tx.get('rate')||{};
        if(rate.day===day&&rate.daily>=100||rate.minute===minute&&rate.burst>=3)return {ok:false,error:'slow_down'};
        s.balance-=q.price.totalPaise;s.held+=q.price.totalPaise;q.status='running';q.startedAt=now;
        await tx.put({state:s,['q:'+b.id]:q,rate:{day,daily:rate.day===day?rate.daily+1:1,minute,burst:rate.minute===minute?rate.burst+1:1}});
        return {ok:true,quote:q};
      }
      if(b.op==='complete'){
        if(q.status==='done')return {ok:true,replay:true,result:q.result};
        if(q.status!=='running')return {ok:false,error:'request_not_reserved'};
        const charge=Number.isSafeInteger(b.charge)&&b.charge>=0?Math.min(b.charge,q.price.totalPaise):0;
        s.balance+=q.price.totalPaise-charge;s.held-=q.price.totalPaise;
        q.status='done';q.result={text:String(b.text||'').slice(0,16000),chargedPaise:charge,balancePaise:s.balance,model:q.modelId,receipt:b.receipt||null,error:b.error||null};
        const receipt={at:new Date(now).toISOString(),kind:'usage',requestId:q.id,model:q.modelId,amountPaise:-charge,details:b.receipt||null};
        log(s,receipt);await tx.put({state:s,['q:'+b.id]:q,['receipt:'+b.id]:receipt});
        return {ok:true,result:q.result};
      }
      return {ok:false,error:'invalid_operation'};
    });
    return Response.json(result);
  }
  async alarm(){
    const now=Date.now();
    await this.storage.transaction(async tx=>{
      const s=await tx.get('state')||initial(),quotes=await tx.list({prefix:'q:',limit:1000});
      for(const [key,q] of quotes){
        if(q.status==='running'&&now-q.startedAt>120000){s.balance+=q.price.totalPaise;s.held-=q.price.totalPaise;q.status='done';q.result={error:'interrupted',chargedPaise:0,balancePaise:s.balance};await tx.put(key,q);await tx.put('receipt:'+q.id,{kind:'interrupted',at:new Date(now).toISOString(),amountPaise:0});}
        if(q.status==='quoted'&&now>q.expiresAt||now-q.createdAt>DAY)await tx.delete(key);
      }
      await tx.put('state',s);
      if(quotes.size)await tx.setAlarm(now+10*60000);
    });
  }
}

export class AICreditBudget {
  constructor(ctx,env){this.storage=ctx.storage;this.env=env;}
  async fetch(request){
    const b=await request.json(),limit=Number(this.env.AI_CREDITS_DAILY_PROVIDER_PAISE||0);
    const result=await this.storage.transaction(async tx=>{
      const used=await tx.get('used')||0,r=await tx.get(b.id);
      if(b.op==='settle'){
        if(!r||r.done)return {ok:false};
        const actual=Number.isSafeInteger(b.actual)&&b.actual>=0?b.actual:r.amount;
        await tx.put({used:used+actual-r.amount,[b.id]:{...r,done:true}});return {ok:true};
      }
      if(b.op!=='reserve'||!Number.isSafeInteger(b.amount)||b.amount<=0||r||!Number.isSafeInteger(limit)||used+b.amount>limit)return {ok:false,error:'paid_pool_busy'};
      await tx.put({used:used+b.amount,[b.id]:{amount:b.amount,done:false}});
      if(!await tx.getAlarm())await tx.setAlarm(Date.now()+3*DAY);
      return {ok:true};
    });return Response.json(result);
  }
  async alarm(){await this.storage.deleteAll();}
}
