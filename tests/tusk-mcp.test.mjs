import test from 'node:test';import assert from 'node:assert/strict';import {handleTuskMcp} from '../worker/handlers/tusk-mcp.js';
const call=(method,params)=>handleTuskMcp(new Request('https://example.test/tusk/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}),{});
test('MCP tools are read-only',async()=>{const r=await (await call('tools/list')).json();assert.equal(r.result.tools.length,2);assert.equal(r.result.tools.some(x=>/pay|create_order/.test(x.name)),false);});
test('checkout is handoff, never a confirmed purchase',async()=>{const r=await (await call('tools/call',{name:'roamwise_checkout_handoff',arguments:{category:'shop'}})).json();const o=JSON.parse(r.result.content[0].text);assert.equal(o.paymentConfirmed,false);assert.equal(o.requiresUserApproval,true);});
test('invalid categories rejected',async()=>{const r=await (await call('tools/call',{name:'roamwise_checkout_handoff',arguments:{category:'evil'}})).json();assert.equal(r.error.code,-32602);});
test('no arbitrary methods',async()=>{const r=await (await call('payments/create')).json();assert.equal(r.error.code,-32601);});
