'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {bounded,isOfficialRelease,scan,report}=require('../tools/outreach-radar/weekly.cjs');
const now=new Date('2026-09-23T01:00:00Z');
const valid=(repo,name,date='2026-09-22T12:00:00Z')=>({
  name,tag_name:'v1.0.0',html_url:`https://github.com/${repo}/releases/tag/v1.0.0`,
  published_at:date,draft:false,prerelease:false
});
test('only timely official GitHub release URLs pass, never fake profiles',()=>{
  const repo='openai/openai-node';
  assert.equal(isOfficialRelease(valid(repo,'Release'),repo,now),true);
  assert.equal(isOfficialRelease({...valid(repo,'Release'),html_url:'https://evil.example/people/private@example.org'},repo,now),false);
  assert.equal(isOfficialRelease(valid(repo,'Old','2026-08-01T00:00:00Z'),repo,now),false);
  assert.equal(isOfficialRelease({...valid(repo,'Draft'),draft:true},repo,now),false);
  assert.equal(isOfficialRelease({...valid(repo,'Future'),published_at:'2026-10-01T00:00:00Z'},repo,now),false);
});
test('one source failure preserves independently confirmed releases',async()=>{
  const request=async url=>{
    if(url.includes('anthropics/'))return {ok:false,status:503};
    return {ok:true,json:async()=>[valid('openai/openai-node','SDK release'),valid('openai/openai-node','Stale','2026-07-01T00:00:00Z')]};
  };
  const data=await scan({request,now});
  assert.equal(data.signals.length,1);
  assert.equal(data.signals[0].company,'OpenAI');
  assert.equal(data.sourceErrors.length,1);
  assert.match(report(data),/No unsolicited bulk email/);
  assert.doesNotMatch(JSON.stringify(data),/personalEmail|secretKey/);
});
test('no valid releases produces zero signals without guessed contacts',async()=>{
  const data=await scan({request:async()=>({ok:true,json:async()=>[]}),now});
  assert.equal(data.signals.length,0);
  assert.equal(data.sourceErrors.length,0);
  assert.match(report(data),/No new official SDK release/);
  assert.equal(bounded('hello\nworld'), 'hello world');
});
