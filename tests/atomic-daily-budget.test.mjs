import test from 'node:test';import assert from 'node:assert/strict';import {budgetPaths,reserveDailyExpense} from '../worker/lib/atomic-daily-budget.js';
test('IST budget partitions are stable',()=>{const a=budgetPaths('project1','2026-11-10T18:29:00Z','expense1');const b=budgetPaths('project1','2026-11-10T18:31:00Z','expense1');assert.notEqual(a.day,b.day);});
test('invalid identifiers fail closed',()=>assert.throws(()=>budgetPaths('project1','2026-11-10T00:00:00Z','../bad')));
test('missing authorization fails before network',async()=>await assert.rejects(reserveDailyExpense({projectId:'project1',accessToken:'',expenseId:'a',type:'ai_inference',amountPaise:100,approved:true})));
