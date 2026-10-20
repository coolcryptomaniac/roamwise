const test=require('node:test'),assert=require('node:assert/strict'),{review}=require('../tools/ai-ops/tusk-learning-review.cjs');
const row={task:'stay_search',model:'candidate',samples:100,successful:95,grounded:98,p95ms:1200,costINR:20};
test('rejects raw data and malformed aggregates',()=>{assert.throws(()=>review([{...row,email:'private'}]));assert.throws(()=>review([{...row,successful:101}]));});
test('small cohorts are suppressed and grounding blocks promotion',()=>{assert.equal(review([{...row,samples:10,successful:9,grounded:9}])[0].samples,undefined);assert.match(review([row])[0].decision,/grounding/);});
