import test from 'node:test';
import assert from 'node:assert/strict';
import {assessCreator,planOutreach,decideAction} from '../worker/lib/creator-autopilot-core.mjs';
const creator={id:'c1',name:'Creator',email:'creator@example.com',town:'Almora',outreachConsent:true,stage:'new'};
const property={id:'p1',town:'Almora',creatorMatching:{enabled:true},status:'open'};
test('same town opted-in creator creates draft, not message',()=>{
 const p=planOutreach([creator],[property]);
 assert.equal(p.queue.length,1);assert.equal(p.counters.sent,0);assert.equal(p.approvalRequired,true);
});
test('unconsented creator is blocked',()=>assert.ok(assessCreator({...creator,outreachConsent:false},property).reasons.includes('consent_unverified')));
test('different town is blocked',()=>assert.ok(assessCreator({...creator,town:'Delhi'},property).reasons.includes('no_verified_locality_match')));
test('suppressed creators never enter queue',()=>assert.equal(planOutreach([{...creator,unsubscribed:true}],[property]).queue.length,0));
test('cooldown suppresses duplicate outreach',()=>{
 const h=[{creatorId:'c1',propertyId:'p1',status:'sent',at:new Date().toISOString()}];
 assert.ok(assessCreator(creator,property,h).reasons.includes('cooldown_active'));
});
test('sensitive actions require separate audited approval',()=>{
 for(const type of ['send_email','pay_creator','book_property','verify_creator','delete_record'])
  assert.equal(decideAction({type}).allowed,false);
});
