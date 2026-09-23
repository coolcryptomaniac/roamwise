'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateRange, parseRanges, secretHeader, redactScalar, rowsToObjects,
  normalizeAction, consensus, founderReview
} = require('../ops/ai-tracker/run.js');

test('Sheet ranges must be bounded and row-capped', () => {
  assert.equal(validateRange('Deepanshi!A1:Z200'), true);
  assert.equal(validateRange("'BD Team'!A1:M500"), true);
  assert.equal(validateRange('A:Z'), false);
  assert.equal(validateRange('A1:Z9999'), false);
  assert.throws(() => parseRanges('A:Z'), /Unsafe\/unbounded/);
});

test('secret-like columns are dropped and direct identifiers are redacted', () => {
  assert.equal(secretHeader('Bank Account Number'), true);
  assert.equal(secretHeader('API Key'), true);
  assert.equal(secretHeader('Task'), false);
  const rows = rowsToObjects([
    ['Task','Owner Email','Phone','Bank Account Number','Status'],
    ['Call property','person@example.com','+91 98765 43210','123456789','Pending']
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]['Owner Email'], '<email>');
  assert.equal(rows[0].Phone, '<phone>');
  assert.equal(Object.hasOwn(rows[0], 'Bank Account Number'), false);
  assert.equal(rows[0].Status, 'Pending');
});

test('normalization uses the explicit action vocabulary shape', () => {
  assert.equal(normalizeAction('Follow Up'), 'follow_up');
  assert.equal(normalizeAction('Flag price discrepancy'), 'flag_price_discrepancy');
});

function model(items) {
  return { configured:true, result:{ summary:'x', priorities:items, followups:[] } };
}
test('consensus only marks two-model high-confidence low-risk allowed actions eligible', () => {
  const a=model([{record_id:'Deepanshi!12',action:'follow_up',reason:'reply due',risk:'low',confidence:.93,evidence:['last contact 4 days']}]);
  const b=model([{record_id:'Deepanshi!12',action:'follow_up',reason:'reply due',risk:'low',confidence:.91,evidence:['status pending']}]);
  assert.equal(consensus(a,b).length,1);
  b.result.priorities[0].risk='high';
  assert.equal(consensus(a,b).length,0);
});

test('consequential or uncertain actions go to founder review', () => {
  const a=model([
    {record_id:'X!2',action:'commission_change',reason:'asked for 4%',risk:'high',confidence:.95,evidence:['note']},
    {record_id:'X!3',action:'follow_up',reason:'unclear',risk:'low',confidence:.4,evidence:['note']}
  ]);
  assert.equal(founderReview(a,{configured:false}).length,2);
});
