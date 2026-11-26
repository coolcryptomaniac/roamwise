import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('wallet page, credit page and terms: coins are discounts, money is never held, packs paused',()=>{
  const w=read('wallet/index.html'),t=read('terms.html'),c=read('credit/index.html');
  assert.ok(!/Can go back to your bank/.test(w));assert.ok(!/Keep as credit';k\.onclick[^}]*\}\s*$/.test(w));
  assert.match(w,/We never hold your money: refunds go straight back to the way you paid/);
  assert.match(w,/RoamWise Coins/);assert.match(w,/refundsOnTheWay/);assert.ok(!/href="\/credit\/"><div><b>Founding Traveller Credit/.test(w));
  assert.match(t,/id="credits"/);assert.match(t,/We do not hold your money/);assert.match(t,/cannot be transferred to another person/);assert.match(t,/never forfeited/);
  assert.match(c,/I bought a credit pack before/);
});
test('wallet core keeps money moving only back to the original payment',()=>{
  const core=read('worker/lib/wallet-core.js');
  assert.match(core,/closed-loop \(spend only on RoamWise\)/);
  assert.match(core,/Bonus credit is RoamWise's own gift: spent last, never cashed/);
  const routes=read('worker/handlers/wallet.js');
  assert.ok(!/wallet\/(transfer|send|withdraw|payout)/.test(routes),'no P2P or withdrawal route');
});
