import test from 'node:test';
import assert from 'node:assert/strict';
import {TUSK_100_QUESTIONS} from '../evals/tusk-100-questions.mjs';
import {classifyKnowledgeQuestion,KNOWLEDGE_BUCKETS} from '../worker/lib/tusk-knowledge-policy.js';
import {isDynamicQuery,parsePublicQuery,curatedMatches} from '../worker/lib/tusk-hybrid-knowledge.js';

test('exactly 100 diverse, manually labelled query cases exist',()=>{
 assert.equal(TUSK_100_QUESTIONS.length,100);
 assert.equal(new Set(TUSK_100_QUESTIONS.map(x=>x.q)).size,100);
 assert.equal(new Set(TUSK_100_QUESTIONS.map(x=>x.topic)).size,10);
 assert.ok(new Set(TUSK_100_QUESTIONS.map(x=>x.locale)).size>=4);
});
test('knowledge lifecycle classification agrees with all 100 review labels',()=>{
 const misses=TUSK_100_QUESTIONS.flatMap((x,i)=>{
  const actual=classifyKnowledgeQuestion(x.q).bucket;
  return actual===x.bucket?[]:[{case:i+1,expected:x.bucket,actual,q:x.q}];
 });
 assert.deepEqual(misses,[]);
});
test('private, policy and dynamic questions never receive a durable cache answer',()=>{
 const notSafe=TUSK_100_QUESTIONS.filter(x=>['private','policy','dynamic'].includes(x.bucket));
 assert.ok(notSafe.length>=50);
 for(const x of notSafe){
  assert.equal(isDynamicQuery(x.q),true,x.q);
  if(x.bucket==='private')assert.equal(parsePublicQuery(x.q),null,x.q);
 }
});
test('versioned evergreen records answer known historical/geographical anchor without live prices',()=>{
 const known=curatedMatches('Where is Gir National Park located?',new Date('2026-11-16T00:00:00Z'));
 assert.equal(known.knowledgeClass,'evergreen_anchor');
 assert.match(known.summary,/Gujarat/);
 assert.ok(known.hits.every(x=>x.url.startsWith('https://')));
 const changing=curatedMatches('Is Gir safari open now?',new Date('2026-11-16T00:00:00Z'));
 assert.equal(changing.requiresLiveVerification,true);
 assert.notEqual(changing.knowledgeClass,'evergreen_anchor');
});
test('policy makes slow-changing references reviewable, not timeless',()=>{
 assert.equal(KNOWLEDGE_BUCKETS.reference.reviewDays,90);
 assert.equal(KNOWLEDGE_BUCKETS.policy.ttlSeconds,0);
 assert.equal(KNOWLEDGE_BUCKETS.dynamic.vectorEligible,false);
});
