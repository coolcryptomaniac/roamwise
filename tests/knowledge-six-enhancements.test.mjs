import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {WORLD_ATLAS,searchWorldAtlas} from '../worker/data/tusk-world-atlas.js';
import {atlasAnswer} from '../worker/lib/tusk-atlas-answer.js';
import {handleTuskWebSearch} from '../worker/handlers/tusk-web-search.js';
import {approvedDestinationAnswer} from '../worker/lib/tusk-approved-reader.js';
import {prepareIntake} from '../knowledge/tools/prepare-atlas-intake.mjs';
import {auditLinks} from '../knowledge/tools/check-source-links.mjs';
import {validateIntake} from '../knowledge/tools/validate-media-intake.mjs';
import {previewConfig} from '../knowledge/tools/configure-preview.mjs';
import {choosePublicOrigin} from '../cloudflare/failover/public-browse-preview.mjs';
import hosting from '../tools/ai-ops/hosting-parity.cjs';

test('international discovery adds distinct editorial leads, not verified facts or inventory',()=>{
 assert.equal(WORLD_ATLAS.length,68);
 assert.equal(new Set(WORLD_ATLAS.map(x=>x.id)).size,68);
 for(const city of ['Tokyo','Nairobi','Funchal','Helsinki','Tallinn','Sydney']){
  const a=atlasAnswer('Plan a trip to '+city);
  assert.equal(a.atlas.name,city);
  assert.equal(a.knowledgeClass,'editorial-lead');
  assert.equal(a.checkedAt,null);
  assert.equal(a.atlas.photo.displayAllowed,false);
  assert.equal(a.atlas.itinerary.length,3);
  assert.equal(a.requiresLiveVerification,true);
 }
 assert.equal(searchWorldAtlas('Tokyo and Paris'),null);
 assert.equal(atlasAnswer('Almora and Tokyo'),null);
});
test('public Worker serves international atlas without paid API',async()=>{
 const r=await handleTuskWebSearch(new Request('https://example.test/tusk/search?q=Tokyo%20itinerary&localOnly=1'),{});
 assert.equal(r.status,200);assert.equal((await r.json()).atlas.name,'Tokyo');
});
test('reviewed D1 lookup is optional, destination-only and requires provenance',async()=>{
 const atlas=atlasAnswer('Tokyo itinerary'),calls=[];
 const env={PUBLIC_KNOWLEDGE_READER:{async fetch(url,opts){
  calls.push({url,opts});return Response.json({slug:'tokyo',humanReviewedAt:'2026-11-24',summary:'Reviewed overview',sources:[{url:'https://example.org/tokyo',checkedAt:'2026-11-24',supports:'Overview'}]});
 }}};
 const r=await approvedDestinationAnswer(env,atlas);
 assert.equal(r.route,'curated');assert.equal(r.requiresLiveVerification,true);
 assert.equal(calls[0].url,'https://knowledge.internal/v1/destinations/tokyo');
 assert.equal(calls[0].opts.method,'GET');
 assert.equal(await approvedDestinationAnswer({},atlas),null);
 assert.equal(await approvedDestinationAnswer({PUBLIC_KNOWLEDGE_READER:{fetch:async()=>Response.json({slug:'tokyo',summary:'unreviewed'})}},atlas),null);
});
test('all 192 records, Hindi scaffolds and native review queues remain unapproved',()=>{
 const r=prepareIntake('2026-11-24T00:00:00Z');
 assert.equal(r.stats.destinations,192);assert.equal(r.stats.international,68);
 assert.equal(r.stats.hindiDrafts,192);assert.equal(r.stats.translationReviewJobs,576);
 assert.equal(r.stats.autoPublished,0);assert.equal(new Set(r.rows.map(x=>x.id)).size,192);
 assert.match(r.sql,/ON CONFLICT\(id\) DO NOTHING/);
 assert.match(r.sql,/'needs_review'/);
 assert.doesNotMatch(r.sql,/'published'/);
 assert.ok(r.translations.every(x=>x.reviewed===false&&x.days.length===3));
});
test('link audit never follows redirects or approves facts',async()=>{
 const calls=[];
 const r=await auditLinks({limit:100,fetcher:async(url,opts)=>{calls.push({url,opts});return {status:200};}});
 assert.ok(calls.length<=12);assert.ok(calls.every(x=>x.opts.method==='HEAD'&&x.opts.redirect==='manual'));
 assert.equal(r.autoApproved,0);assert.ok(r.results.every(x=>x.factsVerified===false));
});
test('rights intake validates bytes, size and reviewed permission for image and video',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'rw-media-'));
 try{
  fs.mkdirSync(path.join(root,'assets'));
  const buffer=Buffer.from('fixture'),sha=crypto.createHash('sha256').update(buffer).digest('hex');
  fs.writeFileSync(path.join(root,'assets','a.webp'),buffer);fs.writeFileSync(path.join(root,'assets','a.mp4'),buffer);
  const a={id:'tokyo-v1',destinationId:'tokyo',file:'assets/a.webp',mime:'image/webp',sha256:sha,rightsStatus:'owned',licenseProof:'test fixture permission',reviewer:'test reviewer',reviewedAt:'2026-11-24',attribution:'test',alt:'fixture'};
  const v={...a,id:'tokyo-video',file:'assets/a.mp4',mime:'video/mp4'};
  const output=validateIntake({version:1,assets:[a,v]},root);
  assert.equal(output.length,2);assert.ok(output.every(x=>x.key.startsWith('intake/tokyo/')&&!x.published));
  assert.throws(()=>validateIntake({version:1,assets:[{...a,rightsStatus:'pending'}]},root));
  assert.throws(()=>validateIntake({version:1,assets:[{...a,sha256:'bad'}]},root));
  assert.throws(()=>validateIntake({version:1,assets:[{...a,file:'assets/../outside.webp'}]},root));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('preview config only names isolated resources and rejects unknown ID syntax',()=>{
 const c=previewConfig('00000000-0000-0000-0000-000000000001');
 assert.match(c,/roamwise-public-knowledge-preview/);
 assert.match(c,/roamwise-knowledge-dev/);assert.match(c,/roamwise-public-media-dev/);
 assert.doesNotMatch(c,/routes|roamwise-api|cashfree/i);
 assert.throws(()=>previewConfig('bad'));
});
const env={PRIMARY_ORIGIN:'https://roamwise.co.in',BACKUP_ORIGIN:'https://roamwise-web.pages.dev',PUBLIC_FAILOVER_ENABLED:'true'};
const request=(p,opts)=>new Request('https://preview.example'+p,opts);
test('preview automatically selects healthy alternate only for public browsing',async()=>{
 const calls=[];
 const f=async(url,opts)=>{calls.push({url:String(url),opts});return new Response('RoamWise guides',{status:String(url).includes('pages.dev')?200:503,headers:{'content-type':'text/html'}});};
 const r=await choosePublicOrigin(request('/guides/'),env,f);
 assert.equal(r.status,302);assert.equal(r.headers.get('location'),'https://roamwise-web.pages.dev/guides/');
 assert.equal(calls.length,2);assert.ok(calls.every(x=>x.opts.redirect==='manual'&&x.opts.method==='GET'));
});
test('no failover on private URLs, queries, cookies, POST, self-origin, or redirects',async()=>{
 const f=async()=>{throw Error('should never contact origin')};
 for(const req of [request('/wallet/'),request('/guides/?token=x'),request('/guides/',{headers:{cookie:'test=1'}}),request('/guides/',{method:'POST'})])
  assert.equal((await choosePublicOrigin(req,env,f)).status,403);
 assert.equal((await choosePublicOrigin(request('/guides/'),{...env,PUBLIC_FAILOVER_ENABLED:'false'},f)).status,503);
 assert.equal((await choosePublicOrigin(request('/guides/'),{...env,BACKUP_ORIGIN:env.PRIMARY_ORIGIN},f)).status,503);
 assert.equal((await choosePublicOrigin(request('/guides/'),env,async()=>new Response(null,{status:301,headers:{location:env.PRIMARY_ORIGIN}}))).status,503);
});
test('two hosts resolving to one final home origin fail parity',async()=>{
 const r=await hosting.checkHosting(async()=>({status:200,url:'https://same.example/',text:async()=> 'RoamWise'}),[{name:'a',url:'https://a.example'},{name:'b',url:'https://b.example'}],[{path:'/',marker:/RoamWise/}]);
 assert.equal(r.independentOrigins,false);assert.equal(r.ok,false);assert.equal(r.cashfreePaymentVerified,false);
});
