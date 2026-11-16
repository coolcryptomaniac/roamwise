#!/usr/bin/env node
/* Lightweight reproducible offline evaluation: no API keys, purchases or web
   calls. Counts labels + source coverage; does NOT certify answer accuracy. */
import {TUSK_100_QUESTIONS} from '../../evals/tusk-100-questions.mjs';
import {classifyKnowledgeQuestion} from '../../worker/lib/tusk-knowledge-policy.js';
import {parsePublicQuery,isDynamicQuery,curatedMatches} from '../../worker/lib/tusk-hybrid-knowledge.js';
const date=new Date('2026-11-16T00:00:00Z');
const stats={dataset:TUSK_100_QUESTIONS.length,classificationsCorrect:0,privateBlocked:0,dynamicNotCacheable:0,sourceLinked:0,sourceLinkedByTopic:{},incorrectClassifications:[],unsafeCacheCandidates:[]};
for(const [i,t] of TUSK_100_QUESTIONS.entries()){
 const got=classifyKnowledgeQuestion(t.q).bucket;
 if(got===t.bucket)stats.classificationsCorrect++;
 else stats.incorrectClassifications.push({number:i+1,expected:t.bucket,got,query:t.q});
 const publicQ=parsePublicQuery(t.q);
 if(t.bucket==='private'&&!publicQ)stats.privateBlocked++;
 if(['private','policy','dynamic'].includes(t.bucket)&&isDynamicQuery(t.q))stats.dynamicNotCacheable++;
 if(!publicQ)continue;
 const result=curatedMatches(t.q,date);
 if(result&&Array.isArray(result.hits)&&result.hits.length&&result.hits.every(x=>x.url.startsWith('https://'))){
  stats.sourceLinked++;
  stats.sourceLinkedByTopic[t.topic]=(stats.sourceLinkedByTopic[t.topic]||0)+1;
 }
 if(['policy','dynamic'].includes(t.bucket)&&result&&!result.requiresLiveVerification)stats.unsafeCacheCandidates.push(t.q);
}
stats.comment='This measures deterministic routing and source links, not correctness of each answer or model performance. No paid provider was called.';
console.log(JSON.stringify(stats,null,2));
if(stats.classificationsCorrect!==100||stats.privateBlocked!==10||stats.dynamicNotCacheable!==60||stats.unsafeCacheCandidates.length)process.exitCode=1;
