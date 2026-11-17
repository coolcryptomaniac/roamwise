/* Run against a Wrangler --dry-run bundle; never invokes a live AI binding.
   Requires miniflare in the development environment (see shared AI docs). */
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {Miniflare}=require(process.env.RW_MINIFLARE_MODULE||'miniflare');
async function main(){
  const mf=new Miniflare({modules:true,script:fs.readFileSync(path.resolve(process.argv[2]),'utf8'),
    compatibilityDate:'2026-01-01',durableObjects:{BASIC_AI_QUOTA:{className:'BasicAIQuota',useSQLite:true},AI_CREDIT_ACCOUNTS:{className:'AICreditAccount',useSQLite:true},AI_CREDIT_BUDGET:{className:'AICreditBudget',useSQLite:true}},
    bindings:{BASIC_AI_ENABLED:'true',BASIC_AI_DAILY_LIMIT:'2',BASIC_AI_DAILY_NEURONS:'100',BASIC_AI_DAILY_REQUEST_CAP:'1000',AI_CREDITS_DAILY_PROVIDER_PAISE:'100'}});
  try{
    const ns=await mf.getDurableObjectNamespace('BASIC_AI_QUOTA');
    const shared=ns.get(ns.idFromName('runtime-shared'));
    const call=async(stub,b)=>(await stub.fetch('https://quota/',{method:'POST',body:JSON.stringify(b)})).json();
    const users=Array.from({length:50},(_,i)=>({uid:i.toString(16).padStart(64,'0'),id:'r'+i,op:'reserve',estimate:30}));
    const answers=await Promise.all(users.map(b=>call(shared,b)));
    assert.equal(answers.filter(x=>x.ok).length,3,'real SQLite DO must serialize the global budget');
    const chosen=answers.findIndex(x=>x.ok),winner=users[chosen];
    assert.equal((await call(shared,{...winner,op:'settle',success:false})).remaining,2);
    assert.equal((await call(shared,{...winner,op:'settle',success:false})).ok,false,'refund is idempotent');
    const fresh=ns.get(ns.idFromName('runtime-fresh-day'));
    const uid='f'.repeat(64);
    const race=await Promise.all(Array.from({length:30},(_,i)=>call(fresh,{uid,id:'u'+i,op:'reserve',estimate:1})));
    assert.equal(race.filter(x=>x.ok).length,2,'daily user limit must hold under concurrency');
    assert.equal((await call(fresh,{uid,op:'status'})).remaining,0);
    const tomorrow=ns.get(ns.idFromName('runtime-tomorrow'));
    assert.equal((await call(tomorrow,{uid,op:'status'})).remaining,2);
    console.log('PASS: real SQLite Durable Object budget, account limit, idempotent refund and day isolation (80 concurrent reservations).');
    const ledgerNs=await mf.getDurableObjectNamespace('AI_CREDIT_ACCOUNTS'),credit=ledgerNs.get(ledgerNs.idFromName('test-customer'));
    const order='ai_'+'a'.repeat(32)+'_12345678';
    await call(credit,{op:'prepareOrder',id:order,packId:'inr10',environment:'sandbox'});
    await Promise.all(Array.from({length:30},()=>call(credit,{op:'reconcile',id:order,paid:true,paymentId:'123',refunded:0})));
    assert.equal((await call(credit,{op:'status'})).balancePaise,1000,'duplicate payment callbacks grant once');
    await call(credit,{op:'quote',quote:{id:'q',hash:'test-hash',modelId:'standard',price:{totalPaise:800}}});
    const paidRace=await Promise.all(Array.from({length:30},()=>call(credit,{op:'reserve',id:'q',hash:'test-hash'})));
    assert.equal(paidRace.filter(x=>x.ok).length,1,'one quote can debit at most once');
    await call(credit,{op:'complete',id:'q',charge:500,text:'A real-runtime fixture answer.'});
    assert.equal((await call(credit,{op:'reserve',id:'q',hash:'test-hash'})).result.chargedPaise,500);
    await call(credit,{op:'reconcile',id:order,paid:true,paymentId:'123',refunded:1000});
    assert.equal((await call(credit,{op:'status'})).balancePaise,-500,'refund reverses spent funding');
    const budgetNs=await mf.getDurableObjectNamespace('AI_CREDIT_BUDGET'),paidBudget=budgetNs.get(budgetNs.idFromName('today'));
    const paidLimits=await Promise.all(Array.from({length:40},(_,i)=>call(paidBudget,{op:'reserve',id:'p'+i,amount:30})));
    assert.equal(paidLimits.filter(x=>x.ok).length,3,'paid provider spending is atomic');
    console.log('PASS: paid credit grants, reservations, replay, reversals and provider budget (100 concurrent operations).');
  }finally{await mf.dispose();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
