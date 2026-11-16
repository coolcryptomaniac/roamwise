import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { classifyKnowledgeQuestion, KNOWLEDGE_BUCKETS } from '../worker/lib/tusk-knowledge-policy.js';
import { parsePublicQuery, curatedMatches, isDynamicQuery } from '../worker/lib/tusk-hybrid-knowledge.js';
import { TUSK_EVERGREEN_FACTS } from '../worker/data/tusk-evergreen-facts.js';

const suite=JSON.parse(fs.readFileSync(new URL('./fixtures/tusk-knowledge-eval-100.json', import.meta.url),'utf8'));
test('100-query multilingual evaluation set has deterministic labels and unique IDs',()=>{
 assert.equal(suite.samples.length,100);
 const counts={anchor:0,reference:0,dynamic:0,policy:0,private:0};
 const ids=new Set();
 for(const row of suite.samples){
  assert.ok(!ids.has(row.id),row.id);ids.add(row.id);
  assert.ok(row.query.length>=5 && row.query.length<=180,row.id);
  assert.ok(['en','hi','kn'].includes(row.language),row.id);
  assert.ok(Object.hasOwn(counts,row.expected),row.id);
  counts[row.expected]++;
 }
 assert.deepEqual(counts,{anchor:20,reference:20,dynamic:20,policy:20,private:20});
});
test('classify all 100 labeled knowledge queries correctly before enabling semantic search',()=>{
 const errors=[];
 for(const row of suite.samples){
   const got=classifyKnowledgeQuestion(row.query);
   if(got.bucket!==row.expected)errors.push({id:row.id,expected:row.expected,received:got.bucket,question:row.query});
 }
 assert.deepEqual(errors,[]);
});
test('live or policy-related information never enters an exact or semantic answer cache',()=>{
 for(const row of suite.samples){
  if(['private','policy','dynamic'].includes(row.expected))
   assert.equal(isDynamicQuery(row.query),true,row.id+' should require fresh/private path');
  if(row.expected==='private') assert.equal(parsePublicQuery(row.query),null,row.id+' should not be sent to public search');
 }
 for(const row of suite.samples.filter(x=>['anchor','reference'].includes(x.expected)))
  assert.equal(isDynamicQuery(row.query),false,row.id+' should allow reviewed reference lookup');
});
test('evergreen facts are versioned, source-backed and exclude promises about operations or charges',()=>{
 assert.equal(TUSK_EVERGREEN_FACTS.scope,'public_foundational_anchors');
 const ids=new Set();
 for(const fact of TUSK_EVERGREEN_FACTS.items){
  assert.equal(fact.version,1);
  assert.equal(fact.id.endsWith('-v1'),true);
  assert.ok(!ids.has(fact.id),fact.id);ids.add(fact.id);
  assert.ok(fact.facts.length>0);
  assert.ok(fact.sources.length>0&&fact.sources.every(x=>new URL(x).protocol==='https:'));
  assert.match(fact.checkedAt,/^20\d\d-\d\d-\d\d$/);
  assert.match(fact.reviewAgainAfter,/^20\d\d-\d\d-\d\d$/);
  assert.equal(Object.hasOwn(fact,'validUntil'),false,'anchors do not expire as if they were live opening hours');
  assert.doesNotMatch(fact.facts.join(' '),/₹|\b(?:fare|price|ticket|open now|booking|permit fee|current rate)\b/i);
 }
 const result=curatedMatches('Where is Gir National Park located?',new Date('2026-11-16T00:00:00Z'));
 assert.equal(result.knowledgeClass,'evergreen_anchor');
 assert.match(result.hits[0].url,/^https:/);
 assert.match(result.summary,/Gujarat/);
});
test('policy questions receive no static answer cache even when they refer to old facts',()=>{
 for(const q of ['What visa rules apply to India?','What are the permit requirements for Gir?','What are the GST rules for travel packages?']){
  assert.equal(classifyKnowledgeQuestion(q).bucket,'policy');
  assert.equal(isDynamicQuery(q),true);
 }
 assert.equal(KNOWLEDGE_BUCKETS.anchor.ttlSeconds>0,true);
 assert.equal(KNOWLEDGE_BUCKETS.dynamic.ttlSeconds,0);
 assert.equal(KNOWLEDGE_BUCKETS.policy.vectorEligible,false);
});
