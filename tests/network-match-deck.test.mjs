import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {
 ROLE_INFO,normalizePublicDirectory,scoreFit,rankCandidates,
 buildMatchReport,conceptIdeasFor
} from '../network/match/core.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const profile=(role,id,name='Example Business')=>({
 id,name,town:'Almora',region:'Uttarakhand',niche:'yoga',
 topics:['yoga','wellness'],destinations:['almora'],
 modes:['barter'],publicConsent:true,publicApproved:true,
 matchConsent:true,matchApproved:true,active:true,
 email:'private@example.org',phone:'+919876543210',uid:'secret-uid',
 bank:'0000000',privateRate:1250,
 note:'proprietary margin',address:'exact private address',
 portfolioUrl:'https://example.com/portfolio',role
});
const source=p=>({updatedAt:'2026-11-16',creators:[p]});
test('never export a public professional without separate match and publication consent',()=>{
 const p=profile('creator','public-001');
 for(const key of ['publicConsent','publicApproved','matchConsent','matchApproved']){
  const x={...p,[key]:false};
  assert.equal(normalizePublicDirectory(source(x)).profiles.length,0,key);
 }
 assert.equal(normalizePublicDirectory(source({...p,active:false})).profiles.length,0);
 const safe=normalizePublicDirectory(source(p)).profiles[0];
 assert.ok(safe);
 assert.equal(safe.role,'creator');
 for(const secret of ['email','phone','uid','bank','privateRate','address','note','instagram','whatsapp'])
  assert.equal(Object.hasOwn(safe,secret),false,secret);
 assert.equal(JSON.stringify(safe).includes('private@example.org'),false);
 assert.equal(JSON.stringify(safe).includes('9876543210'),false);
 assert.equal(safe.publicStatus,'approved_for_public_matching');
});
test('only professional public directory categories enter static data; private traveller identities never do',()=>{
 const a=normalizePublicDirectory({
  travellers:[profile('traveller','private-person')],
  users:[profile('traveller','user-id')],
  weddingVenues:[profile('wedding_venue','venue-001')],
  trekkingCompanies:[profile('trekking_company','trek-001')],
  influencers:[profile('influencer','influencer-001')],
  weddingProviders:[profile('wedding_provider','service-001')],
  weddingPlanners:[profile('wedding_planner','planner-001')]
 });
 assert.equal(a.profiles.length,5);
 assert.ok(a.profiles.every(x=>x.role!=='traveller'));
 assert.equal(ROLE_INFO.traveller.join,'/');
});
test('show relevant complementary matches with explicit real reasons, not invented endorsements',()=>{
 const a={role:'yoga_teacher',town:'Almora',region:'Uttarakhand',topics:['wellness','yoga'],modes:['barter'],goals:['retreats']};
 const b={role:'property',id:'host-001',name:'Approved Host',town:'Almora',region:'Uttarakhand',topics:['yoga','wellness'],modes:['barter'],offers:['retreats']};
 const fit=scoreFit(a,b);
 assert.ok(fit.score>=80&&fit.score<=100);
 assert.ok(fit.reasons.some(x=>x.includes('Shared destination')));
 assert.ok(fit.reasons.some(x=>x.includes('Common focus')));
 assert.ok(fit.reasons.some(x=>x.includes('Shared collaboration')));
 assert.equal(scoreFit({...a,role:'traveller'},{...b,role:'artist'}),null);
 assert.equal(scoreFit({...a,role:'artist'},{...b,role:'trekking_guide'}),null);
 const ranked=rankCandidates(a,[b,{...b,id:'host-002',town:'Delhi',region:'Delhi',topics:['food'],modes:['paid']}],{limit:10});
 assert.equal(ranked[0].profile.id,'host-001');
 assert.equal(ranked.length,2);
});
test('report uses opt-in public records and has no automatic offers or messages',()=>{
 const d={
  creators:[profile('creator','creator-001','Example Creator')],
  properties:[profile('property','property-001','Example Stay')],
  travellers:[profile('traveller','user-001','Private Traveller')]
 };
 const report=buildMatchReport(d,{date:'2026-11-16'});
 assert.equal(report.profileCount,2);
 assert.equal(report.privateDataIncluded,false);
 assert.equal(report.automatedOutreach,false);
 assert.equal(report.agreementsCreated,false);
 assert.ok(report.matches.length>=1);
 assert.doesNotMatch(JSON.stringify(report),/private@example.org|9876543210|secret-uid|Private Traveller/);
});
test('the real published directory is empty until the source directory has approved matching consent',()=>{
 const d=JSON.parse(read('network/directory.json'));
 const safe=normalizePublicDirectory(d);
 assert.equal(safe.profiles.length,0,'do not invent opt-in partners from applications');
 assert.equal(conceptIdeasFor('wedding_planner').some(x=>x.withRole==='wedding_venue'),true);
 assert.equal(conceptIdeasFor('creator').some(x=>x.withRole==='property'),true);
 assert.equal(conceptIdeasFor('traveller').length>0,true);
});
test('generated public match index contains no private records and is stable',()=>{
 execFileSync(process.execPath,['tools/build-network-matches.mjs','--check'],{cwd:ROOT,timeout:20000});
 const d=JSON.parse(read('network/match/data.json'));
 assert.equal(d.version,1);
 assert.equal(d.source,'public-network-directory-only');
 assert.equal(d.profiles.length,0);
 assert.doesNotMatch(JSON.stringify(d),/email|phone|bank|privateRate|uid/);
});
test('match deck supports swipes, keyboard access and refuses automatic outreach',()=>{
 const html=read('network/match/index.html');
 const client=read('network/match/match.js');
 const worker=read('.github/workflows/network-matchmaker.yml');
 const deploy=read('.github/workflows/static.yml');
 assert.match(html,/noindex,follow/);
 assert.match(html,/id="matchRole"/);
 assert.match(html,/id="deckCard"/);
 assert.match(html,/id="matchView"/);
 assert.match(html,/id="clearSaved"/);
 assert.match(client,/pointerup/);
 assert.match(client,/ArrowRight/);
 assert.match(client,/localStorage/);
 assert.match(client,/publicStatus==='approved_for_public_matching'/);
 assert.doesNotMatch(client,/fetch\([^)]*\{[^}]*method:\s*['"]POST|sendEmail|sendMessage|cashfree/i);
 assert.match(worker,/permissions:\s*\n\s*contents: read/);
 assert.match(worker,/upload-artifact/);
 assert.doesNotMatch(worker,/git push|contents: write|create-pull-request|firebase-admin|CASHFREE|wrangler/i);
 assert.match(deploy,/node tools\/build-network-matches\.mjs/);
 assert.match(read('network/index.html'),/href="\.\/match\//);
 assert.match(read('creators/match.html'),/href="\.\.\/network\/match\//);
});
