import test from 'node:test';
import assert from 'node:assert/strict';
import { trustedDestination, marketingWindow, campaignValidation, proExpiryEvent } from '../worker/lib/notification-campaign-core.js';
import { runNotificationDispatch, notifyVerifiedProActivation } from '../worker/handlers/notification-dispatch.js';

const NOW = Date.parse('2026-11-24T06:30:00Z'); // 12:00 IST
const day=86400000;
const fresh = () => ({
  id:'campaign_1',title:'New Kumaon travel guide',
  body:'Explore destination notes curated by RoamWise.',url:'https://www.roamwise.co.in/guides/',
  category:'travel',target:{type:'all'},reviewedContent:true,
  status:'approved',approvedBy:'admin_1',approvedAt:new Date(NOW-3600000).toISOString()
});
function harness(campaigns, users) {
  const queue=new Map(campaigns.map(c=>[c.id,{...c}]));
  const sent=[],changes=[];
  const kvMap=new Map();
  const fake={
    context:async()=>({projectId:'roamwisepro',token:'fake-server-token'}),
    approved:async()=>[...queue.values()].filter(v=>v.status==='approved'),
    listUsers:async()=>users.map(x=>({...x})),
    getDoc:async(_auth,path)=>{
      if(path==='config/notificationOffers')return {list:[]};
      if(path.startsWith('notificationQueue/'))return queue.get(path.slice('notificationQueue/'.length))||null;
      if(path.startsWith('users/'))return users.find(x=>x.id===path.slice(6))||null;
      return null;
    },
    update:async(_auth,path,value)=>{
      changes.push({path,value});
      if(path.startsWith('notificationQueue/'))Object.assign(queue.get(path.slice(18)),value);
    },
    prune:async()=>{},
    send:async(_auth,token,msg,data)=>{sent.push({token,msg,data});return {ok:true,status:200,body:{}};},
    kv:{get:async k=>kvMap.get(k)||null,put:async(k,v)=>{kvMap.set(k,v);}}
  };
  return {queue,sent,changes,kvMap,fake};
}
const user=(id,prefs={},pro=false,until=0)=>({
  id,pro,proUntil:until,notificationPrefs:prefs,
  pushTokens:{d1:{token:'token-'+id,platform:'android'}}
});
function run(h,opts={}) {return runNotificationDispatch({
  FIREBASE_SERVICE_ACCOUNT_JSON:'test-only',RW_KV:h.fake.kv
}, {nowMs:NOW,dry:false,account:false,...opts},h.fake);}

test('campaign verification blocks unsafe links, bulk account messages and old drafts',()=>{
  const c=fresh();
  assert.equal(campaignValidation(c,NOW,[]),null);
  assert.equal(campaignValidation({...c,status:'queued'},NOW,[]),'awaiting_admin_approval');
  assert.equal(campaignValidation({...c,url:'https://roamwise.co.in.evil.example/'},NOW,[]),'unsafe_destination');
  assert.equal(campaignValidation({...c,category:'account'},NOW,[]),'broadcast_not_permitted');
  assert.equal(campaignValidation({...c,approvedAt:new Date(NOW-8*day).toISOString()},NOW,[]),'approval_expired');
  assert.equal(campaignValidation({...c,reviewedContent:false},NOW,[]),'review_required');
  assert.equal(trustedDestination('https://www.roamwise.co.in/admin/'),false);
});
test('verified offers need independent active, recently reviewed source',()=>{
  const c={...fresh(),category:'offers',verifiedOfferId:'o1',url:'https://roamwise.co.in/shop/'};
  assert.equal(campaignValidation(c,NOW,[]),'offer_not_verified');
  const o={id:'o1',status:'verified',active:true,url:c.url,reviewedAt:new Date(NOW-day).toISOString(),expiresAt:new Date(NOW+day).toISOString()};
  assert.equal(campaignValidation(c,NOW,[o]),null);
  assert.equal(campaignValidation(c,NOW,[{...o,active:false}]),'offer_not_verified');
  assert.equal(campaignValidation(c,NOW,[{...o,reviewedAt:new Date(NOW-9*day).toISOString()}]),'offer_review_stale');
});
test('marketing runs only in 09:00-19:59 IST',()=>{
  assert.equal(marketingWindow(NOW),true);
  assert.equal(marketingWindow(Date.parse('2026-11-24T17:00:00Z')),false);
});
test('opted-in users receive campaigns and KV markers prevent duplicate delivery',async()=>{
  const h=harness([fresh()],[user('yes',{travel:true}),user('no',{travel:false})]);
  const r=await run(h);
  assert.equal(r.sent,1);assert.equal(r.suppressed,1);
  assert.equal(h.sent[0].token,'token-yes');
  assert.equal(h.sent[0].data.rw_category,'travel');
  assert.equal(h.changes[0].value.status,'completed');
  const again=await run(h);
  assert.equal(again.sent,0);
});
test('dry run counts eligible but sends nothing or writes no markers',async()=>{
  const h=harness([fresh()],[user('yes',{travel:true})]);
  const r=await run(h,{dry:true});
  assert.equal(r.eligible,1);
  assert.equal(h.sent.length,0);
  assert.equal(h.kvMap.size,0);
  assert.equal(h.changes.length,0);
});
test('quiet hours defer campaigns without consuming approval',async()=>{
  const h=harness([fresh()],[user('yes',{travel:true})]);
  const r=await run(h,{nowMs:Date.parse('2026-11-24T17:00:00Z')});
  assert.equal(r.quietHours,true);
  assert.equal(r.sent,0);
  assert.equal(h.changes.length,0);
});
test('membership notifications use real future Pro expiry and are deduplicated',async()=>{
  const u=user('member',{account:true},true,NOW+day-1000);
  const h=harness([],[u]);
  const r=await run(h,{account:true});
  assert.equal(r.account,1);
  assert.match(h.sent[0].msg.title,/expires soon/);
  assert.equal(h.sent[0].data.rw_category,'account');
  assert.equal((await run(h,{account:true})).account,0);
  assert.equal(proExpiryEvent(user('lifetime',{},true,0),NOW),null);
  assert.equal(proExpiryEvent(user('expired',{},true,NOW-day),NOW),null);
  assert.equal(proExpiryEvent(user('notpro',{},false,NOW+day),NOW),null);
});

test('verified purchase alerts are sent only for a persisted matching Pro order',async()=>{
  const member={...user('paid',{account:true},true,NOW+30*day),proPayId:'ord_123'};
  const h=harness([],[member]);
  const env={FIREBASE_SERVICE_ACCOUNT_JSON:'test-only',RW_KV:h.fake.kv};
  const denied=await notifyVerifiedProActivation(env,'paid','unpaid_order',h.fake);
  assert.equal(denied.skipped,'not_verified');
  assert.equal(h.sent.length,0);
  const granted=await notifyVerifiedProActivation(env,'paid','ord_123',h.fake);
  assert.equal(granted.sent,1);
  assert.match(h.sent[0].msg.title,/Pro is active/);
  assert.equal((await notifyVerifiedProActivation(env,'paid','ord_123',h.fake)).skipped,'already_delivered');
  assert.equal(h.sent.length,1);
});
