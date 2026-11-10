import test from 'node:test';import assert from 'node:assert/strict';import {AUDIT_CRONS,auditKind,auditSnapshot,runScheduledAudit} from '../worker/lib/scheduled-site-audits.js';import {settlementReadiness} from '../worker/lib/settlement-readiness.js';
test('weekly and monthly schedules are distinct',()=>{assert.equal(auditKind(AUDIT_CRONS.weekly),'weekly');assert.equal(auditKind(AUDIT_CRONS.monthly),'monthly');});
test('audits never return secret values',()=>{const r=auditSnapshot({CASHFREE_APP_ID:'private',CASHFREE_SECRET_KEY:'private'},'weekly');assert.ok(!JSON.stringify(r).includes('private'));});
test('audits disabled by default',async()=>assert.equal((await runScheduledAudit({},AUDIT_CRONS.weekly)).status,'disabled'));
test('enabled audits persist read-only report',async()=>{let keys=[];const r=await runScheduledAudit({RW_AUDIT_ENABLED:'true',RW_KV:{put:async k=>keys.push(k)}},AUDIT_CRONS.monthly,new Date('2026-11-01T04:45:00Z'));assert.equal(r.status,'stored');assert.equal(keys.length,2);});
test('UPI handle alone cannot validate settlement',()=>assert.equal(settlementReadiness({upiOwnershipVerified:true}).ready,false));
