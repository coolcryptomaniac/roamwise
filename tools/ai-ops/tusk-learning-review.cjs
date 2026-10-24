/* Offline aggregate evaluation. Never retrains or changes production prompts. */
'use strict';
function review(input){
  if(!Array.isArray(input))throw Error('Expected aggregate rows');
  const allowed=['task','model','samples','successful','grounded','p95ms','costINR'];
  return input.map(r=>{
    if(Object.keys(r).some(k=>!allowed.includes(k)))throw Error('Only aggregate metrics are accepted; remove raw/user data');
    if(!/^[a-z0-9_-]{1,60}$/i.test(r.task)||!/^[a-z0-9_.:-]{1,80}$/i.test(r.model))throw Error('Invalid metric labels');
    for(const k of ['samples','successful','grounded','p95ms','costINR'])if(!Number.isFinite(r[k])||r[k]<0)throw Error('Invalid metric '+k);
    if(!Number.isInteger(r.samples)||!Number.isInteger(r.successful)||!Number.isInteger(r.grounded)||r.successful>r.samples||r.grounded>r.samples)throw Error('Invalid counts');
    if(r.samples<20)return {task:r.task,model:r.model,decision:'Insufficient evidence; suppress small cohort metrics'};
    return {...r,successRate:r.successful/r.samples,groundedRate:r.grounded/r.samples,decision:r.grounded/r.samples<0.99?'Review grounding failures before expanding use':r.successful/r.samples<0.9?'Review task failures':'Candidate for human-reviewed experiment; no automatic promotion'};
  });
}
module.exports={review};
if(require.main===module){const fs=require('node:fs');const path=process.argv[2];if(!path){console.log('No aggregate export supplied. No training, crawling or production changes performed.');}else console.log(JSON.stringify(review(JSON.parse(fs.readFileSync(path,'utf8'))),null,2));}
