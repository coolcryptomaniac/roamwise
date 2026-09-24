'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {bounded,isOfficialRelease,officialAndroidEntries,scan,report}=require('../tools/outreach-radar/weekly.cjs');
const now=new Date('2026-09-23T01:00:00Z');
const valid=(repo,name,date='2026-09-22T12:00:00Z')=>({
  name,tag_name:'v1.0.0',html_url:`https://github.com/${repo}/releases/tag/v1.0.0`,
  published_at:date,draft:false,prerelease:false
});
const androidFeed=(title='Google Play distribution update',date='2026-09-22T12:00:00Z')=>({
  feed:{entry:[{title:{$t:title},summary:{$t:'Google Play growth and distribution guidance'},published:{$t:date},
    link:[{rel:'alternate',href:'https://android-developers.googleblog.com/2026/09/example.html'}]}]}
});
test('only timely official GitHub release URLs pass, never fake profiles',()=>{
  const repo='openai/openai-agents-python';
  assert.equal(isOfficialRelease(valid(repo,'Release'),repo,now),true);
  assert.equal(isOfficialRelease({...valid(repo,'Release'),html_url:'https://evil.example/people/private@example.org'},repo,now),false);
  assert.equal(isOfficialRelease(valid(repo,'Old','2026-08-01T00:00:00Z'),repo,now),false);
  assert.equal(isOfficialRelease({...valid(repo,'Draft'),draft:true},repo,now),false);
  assert.equal(isOfficialRelease({...valid(repo,'Future'),published_at:'2026-10-01T00:00:00Z'},repo,now),false);
});
test('official Android feed only keeps recent distribution-relevant posts',()=>{
  assert.equal(officialAndroidEntries(androidFeed(),now).length,1);
  assert.equal(officialAndroidEntries(androidFeed('Generic Kotlin tutorial'),now).length,0);
  assert.equal(officialAndroidEntries(androidFeed('Google Play update','2026-08-01T00:00:00Z'),now).length,0);
});
test('source failures preserve independently confirmed signals',async()=>{
  const request=async url=>{
    if(url.includes('anthropics/'))return {ok:false,status:503,json:async()=>({})};
    if(url.includes('android-developers'))return {ok:true,json:async()=>androidFeed()};
    return {ok:true,json:async()=>[valid('openai/openai-agents-python','Agent release'),valid('openai/openai-agents-python','Stale','2026-07-01T00:00:00Z')]};
  };
  const data=await scan({request,now});
  assert.ok(data.signals.some(x=>x.category==='ai-agent'));
  assert.ok(data.signals.some(x=>x.category==='distribution'));
  assert.ok(data.sourceErrors.length>=1);
  assert.ok(data.collaborationRoutes.length>=3);
  assert.match(report(data),/No unsolicited bulk email/);
  assert.doesNotMatch(JSON.stringify(data),/personalEmail|secretKey/);
});
test('no valid releases or distribution posts produces zero signals without guessed contacts',async()=>{
  const request=async url=>({ok:true,json:async()=>url.includes('android-developers')?{feed:{entry:[]}}:[]});
  const data=await scan({request,now});
  assert.equal(data.signals.length,0);
  assert.equal(data.sourceErrors.length,0);
  assert.match(report(data),/No new official AI-agent, SDK or distribution signal/);
  assert.equal(bounded('hello\nworld'),'hello world');
});
