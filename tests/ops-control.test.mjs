import test from 'node:test';
import assert from 'node:assert/strict';
import { validateJob, decideRun, needsApproval, readOpsState, writeOpsState, sanitizedAudit } from '../worker/lib/ops-control.js';
const now=Date.parse('2026-11-04T00:00:00Z');
const job={id:'blog-review',domain:'editorial',intervalSeconds:3600,enabled:true,actions:['draft'],estimatedAiNeurons:100,estimatedPaidCostPaise:0};
test('valid low-cost editorial task is eligible',()=>assert.equal(decideRun({job,now,budget:{}}).allow,true));
test('invalid identifiers and overly frequent jobs rejected',()=>{
 assert.equal(validateJob({...job,id:'../bad'}).ok,false);
 assert.equal(validateJob({...job,intervalSeconds:59}).ok,false);
});
test('off switch and daily cap enforced',()=>{
 assert.equal(decideRun({job:{...job,enabled:false},now}).reason,'disabled');
 assert.equal(decideRun({job,now,state:{day:'2026-11-04',dailyRuns:24}}).reason,'daily_run_cap');
});
test('cadence, neuron ceiling and zero-paid-cost rule enforced',()=>{
 assert.equal(decideRun({job,now,state:{day:'2026-11-04',dailyRuns:1,lastRunAt:now-1000}}).reason,'interval');
 assert.equal(decideRun({job,now,budget:{aiNeuronsUsedToday:7950}}).reason,'ai_budget');
 assert.equal(decideRun({job:{...job,estimatedPaidCostPaise:1},now}).reason,'paid_budget');
});
test('money, publications, email and credentials require dated approval',()=>{
 for (const action of ['payment','payout','supplier-order','publish','email-send','credential-change','deployment']) {
   const dangerous={...job,actions:[action]};
   assert.equal(needsApproval(dangerous),true);
   assert.equal(decideRun({job:dangerous,now}).reason,'approval_required');
   assert.equal(decideRun({job:dangerous,now,approval:{jobId:job.id,day:'2026-11-04',authorized:true}}).allow,true);
 }
});
test('KV persistence only contains non-secret status',async()=>{
 const data=new Map(), kv={get:async k=>data.get(k),put:async(k,v)=>data.set(k,v)};
 await writeOpsState(kv,'blog-review',{day:'2026-11-04',dailyRuns:1,lastRunAt:now,secret:'never-save'});
 assert.deepEqual(await readOpsState(kv,'blog-review'),{day:'2026-11-04',dailyRuns:1,lastRunAt:now});
 assert.equal(JSON.stringify([...data]).includes('never-save'),false);
 assert.equal(sanitizedAudit(job,'dry-run',now).outcome,'dry-run');
});

test('unknown automation actions fail closed; read-only actions remain eligible',()=>{
 const unknown={...job,actions:['delete-records']};
 assert.equal(validateJob(unknown).reason,'action_not_allowlisted');
 assert.equal(decideRun({job:unknown,now}).allow,false);
 assert.equal(needsApproval(unknown),true);
 assert.equal(decideRun({job:{...job,actions:['triage','summarize']},now}).allow,true);
});
test('invalid or missing cost estimates are not assumed free',()=>{
 for(const bad of [{...job,estimatedPaidCostPaise:undefined},{...job,estimatedAiNeurons:NaN},{...job,estimatedPaidCostPaise:-1}]){
   assert.equal(validateJob(bad).reason,'invalid_cost_estimate');
 }
});
