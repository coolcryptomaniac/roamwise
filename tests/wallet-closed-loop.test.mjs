import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('wallet page and terms describe a closed wallet: no cash-out, no transfer, refunds to source',()=>{
  const w=read('wallet/index.html'),t=read('terms.html');
  assert.ok(!/Can go back to your bank/.test(w));
  assert.match(w,/never transferable to another person, never withdrawable/);
  assert.match(t,/id="credits"/);assert.match(t,/cannot be transferred to another user/);assert.match(t,/refunded to the original payment method/);
});
test('wallet core keeps money moving only back to the original payment',()=>{
  const core=read('worker/lib/wallet-core.js');
  assert.match(core,/closed-loop \(spend only on RoamWise\)/);
  assert.match(core,/Bonus credit is RoamWise's own gift: spent last, never cashed/);
  const routes=read('worker/handlers/wallet.js');
  assert.ok(!/wallet\/(transfer|send|withdraw|payout)/.test(routes),'no P2P or withdrawal route');
});
