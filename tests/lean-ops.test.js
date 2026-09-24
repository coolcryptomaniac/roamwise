const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const vm=require('node:vm');
const ctx={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/admin/lean-ops.js'),'utf8'),ctx);
const Lean=ctx.RWLeanOps;
const admin=fs.readFileSync(path.join(__dirname,'../admin/index.html'),'utf8');

test('lean ops keeps financial and safety exceptions under human approval',()=>{
  const a=Lean.build({nowMs:Date.parse('2026-09-24T12:00:00Z'),cashfreeOrders:[{id:'pay-1'}],bookings:[{id:'stay-1',status:'refund_requested'}]});
  assert.equal(a.criticalCount,2);
  assert.ok(a.rows.every(x=>x.lane==='human'));
});

test('lean ops recommends automation or hiring only beyond configured capacity',()=>{
  const requests=Array.from({length:26},(_,i)=>({title:'Task '+i,status:'open',priority:'normal'}));
  const a=Lean.build({devRequests:requests,policy:{maxExceptionsPerPerson:25}});
  assert.equal(a.people,1);
  assert.equal(a.aiCount,26);
  assert.equal(a.hireNeeded,false);
  const manual=Lean.build({notifications:requests.map((x,i)=>({id:i,title:x.title,status:'queued'})),policy:{maxExceptionsPerPerson:25}});
  assert.equal(manual.hireNeeded,true);
});

test('lean ops marks stale work and exposes the non-autonomous guardrail',()=>{
  const a=Lean.build({nowMs:Date.parse('2026-09-24T12:00:00Z'),bookings:[{id:'b',status:'requested',createdAt:'2026-09-22T10:00:00Z'}]});
  assert.equal(a.staleCount,1);
  assert.equal(a.policy.preferredCoreTeam,3);
  assert.match(Lean.render(a,{}),/Never autonomous/);
  assert.match(Lean.brief(a),/past 24h SLA/);
});

test('admin wires the Autopilot page and persisted lean policy',()=>{
  assert.match(admin,/data-page="autopilot"/);
  assert.match(admin,/id="leanOpsDashboard"/);
  assert.match(admin,/config"\)\.doc\("leanOps"\)/);
  assert.match(admin,/js\/admin\/lean-ops\.js/);
});
