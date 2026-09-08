const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/admin/kpi-dashboard.js'),'utf8'),context);
const KPI=context.RWKpiDashboard;
const adminHtml=fs.readFileSync(path.join(__dirname,'../admin/index.html'),'utf8');
const investorEnhancements=fs.readFileSync(path.join(__dirname,'../admin/investors-data.js'),'utf8');

test('KPI dashboard derives conversion and DAU/MAU stickiness from measured inputs',()=>{
  const k=KPI.buildKpis({totalUsers:40,proUsers:10,activityStats:{dau:6,wau:12,mau:20}});
  assert.equal(k.conversionPct,25);
  assert.equal(k.stickinessPct,30);
});

test('KPI dashboard does not fabricate ratios when denominator is empty',()=>{
  const k=KPI.buildKpis();
  assert.equal(k.conversionPct,null);
  assert.equal(k.stickinessPct,null);
  assert.equal(k.mrrINR,0);
});

test('KPI dashboard labels unavailable advanced metrics as a measurement boundary',()=>{
  assert.match(KPI.renderHtml(KPI.buildKpis(),{}),/churn, retention cohorts, CAC and LTV are not shown/);
});

test('admin implements real Firebase phone MFA enrollment and sign-in resolution',()=>{
  assert.match(adminHtml,/multiFactor\.getSession\(\)/);
  assert.match(adminHtml,/getMultiFactorResolver/);
  assert.match(adminHtml,/resolveSignIn\(assertion\)/);
});

test('every enhanced Smart Pitch includes recipient, Gmail and device email actions',()=>{
  assert.match(investorEnhancements,/id="draftRecipient"/);
  assert.match(investorEnhancements,/copyAndOpenGmail/);
  assert.match(investorEnhancements,/openGmailOnly/);
  assert.match(investorEnhancements,/openEmail/);
  assert.doesNotMatch(investorEnhancements,/v\.email\?`<button class="btn good"/);
});
