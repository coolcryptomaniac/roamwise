import test from 'node:test';
import assert from 'node:assert/strict';
import {handleRoamwiseMcp,handleRoamwiseDiscovery} from '../worker/handlers/roamwise-discovery.js';
import {publicSearch,publicItem} from '../worker/lib/roamwise-discovery-catalog.js';

const endpoint='https://api.roamwise.co.in/mcp';
const call=async (method,params={},modern=false)=>{
 const headers={'Content-Type':'application/json','Accept':'application/json, text/event-stream'};
 if(modern){headers['MCP-Protocol-Version']='2026-07-28';headers['Mcp-Method']=method;if(method==='tools/call')headers['Mcp-Name']=params.name;
 params={...params,_meta:{'io.modelcontextprotocol/protocolVersion':'2026-07-28','io.modelcontextprotocol/clientCapabilities':{}}};}
 return handleRoamwiseMcp(new Request(endpoint,{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}));
};

test('catalog: Natasha is linked to the published RoamWise page, not alleged live stock',()=>{
 const item=publicItem('natasha-guleria');
 assert.equal(item.type,'artist');assert.match(item.url,/creators\/natasha\.html$/);
 assert.equal(item.image_url,null);assert.equal(item.availability_verified,false);assert.equal(item.price_verified,false);
 assert.equal(item.booking_confirmed,false);
});
test('catalog: Almora returns approved stays with no live prices',()=>{
 const result=publicSearch({q:'Almora',type:'stay'});
 assert.ok(result.items.length>=2);
 assert.ok(result.items.every(x=>x.type==='stay'&&!x.availability_verified&&!x.price_verified));
 assert.ok(result.items.every(x=>!('ownerPhone' in x)&&!('ownerRate' in x)));
});
test('catalog: invalid types fail closed and limits are bounded',()=>{
 assert.throws(()=>publicSearch({type:'admin'}));
 assert.equal(publicSearch({limit:999}).items.length<=12,true);
});
test('MCP legacy handshake and public tool list work',async()=>{
 const init=await (await call('initialize',{protocolVersion:'2025-11-25'})).json();
 assert.equal(init.result.protocolVersion,'2025-11-25');
 const list=await (await call('tools/list')).json();
 assert.deepEqual(list.result.tools.map(t=>t.name),['search_roamwise','get_roamwise_listing','roamwise_enquiry_link','roamwise_capabilities','browse_roamwise_shop','quote_roamwise_stay','quote_roamwise_shop']);
 assert.ok(list.result.tools.every(t=>t.annotations.readOnlyHint));
});
test('MCP modern discover and tool-call metadata work',async()=>{
 const disc=await (await call('server/discover',{},true)).json();
 assert.ok(disc.result.supportedVersions.includes('2026-07-28'));
 const body=await (await call('tools/call',{name:'search_roamwise',arguments:{q:'Natasha'}},true)).json();
 assert.equal(body.result.structuredContent.items[0].id,'natasha-guleria');
 assert.equal(body.result.structuredContent.cards[0].image_url,null);
 assert.ok(body.result._meta['io.modelcontextprotocol/serverInfo']);
});
test('MCP rejects missing metadata and malicious parameter injection',async()=>{
 const bad=await handleRoamwiseMcp(new Request(endpoint,{method:'POST',headers:{'Content-Type':'application/json','MCP-Protocol-Version':'2026-07-28','Mcp-Method':'tools/list'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list'})}));
 assert.equal(bad.status,400);
 const evil=await (await call('tools/call',{name:'search_roamwise',arguments:{q:'stay',admin:true}})).json();
 assert.equal(evil.error.code,-32602);
});
test('MCP enquiry is link-only without initiating payment',async()=>{
 const response=await (await call('tools/call',{name:'roamwise_enquiry_link',arguments:{id:'milan-heights'}})).json();
 const data=response.result.structuredContent;
 assert.equal(data.requiresUserApproval,true);assert.equal(data.paymentConfirmed,false);
 assert.equal(data.bookingConfirmed,false);assert.match(data.url,/roamwise\.co\.in/);
});
test('REST endpoint returns filtered listings and 404 for unknown item',async()=>{
 const request=new Request('https://api.roamwise.co.in/v1/discovery/search?q=Almora&type=stay');
 const a=await handleRoamwiseDiscovery(request,'v1/discovery/search');
 const body=await a.json();assert.equal(a.status,200);assert.ok(body.count>=2);assert.ok(body.cards[0].url);
 const b=await handleRoamwiseDiscovery(new Request('https://api.roamwise.co.in/v1/discovery/items/unknown'),'v1/discovery/items/unknown');
 assert.equal(b.status,404);
});
test('MCP fails closed for unknown tool or unapproved listing',async()=>{
 const unknown=await (await call('tools/call',{name:'delete_booking',arguments:{id:'one'}})).json();
 assert.equal(unknown.error.code,-32602);
 const absent=await (await call('tools/call',{name:'get_roamwise_listing',arguments:{id:'private-owner'}})).json();
 assert.equal(absent.result.structuredContent.found,false);
});

test('MCP Apps resource exposes a licensed-image safe swipeable view',async()=>{
 const list=await (await call('tools/list')).json();
 const search=list.result.tools.find(t=>t.name==='search_roamwise');
 assert.match(search._meta.ui.resourceUri,/^ui:\/\/roamwise-discovery\//);
 const resources=await (await call('resources/list')).json();
 assert.equal(resources.result.resources.length,1);
 const read=await (await call('resources/read',{uri:resources.result.resources[0].uri})).json();
 const file=read.result.contents[0];
 assert.equal(file.mimeType,'text/html;profile=mcp-app');
 assert.ok(file.text.includes('ui/notifications/tool-result'));
 assert.ok(file.text.includes('ui/open-link'));
 assert.deepEqual(file._meta.ui.csp.resourceDomains,['https://www.roamwise.co.in','https://roamwise.co.in']);
});
test('package categories are enquiry only and REST OpenAPI is described',async()=>{
 const packages=publicSearch({type:'package'});
 assert.equal(packages.items.length,2);
 assert.ok(packages.items.every(x=>x.booking_mode==='assisted_enquiry'));
 const r=await handleRoamwiseDiscovery(new Request('https://api.roamwise.co.in/v1/discovery/openapi.json'),'v1/discovery/openapi.json');
 const body=await r.json();
 assert.equal(body.openapi,'3.1.0');
 assert.ok(body.paths['/v1/discovery/search']);
});

test('Public itinerary cards use existing editorial HTML and PDF, never private trip vault records',()=>{
 const found=publicSearch({type:'itinerary',q:'Kumaon'});
 assert.equal(found.count,1);
 const card=found.items[0];
 assert.equal(card.id,'kumaon-signature-itinerary');assert.equal(card.days,6);
 assert.match(card.share_url,/itinerary-library\/presets\/kumaon\/signature\.html$/);
 assert.match(card.pdf_url,/itinerary-library\/presets\/kumaon\/signature\.pdf$/);
 assert.equal(card.availability_verified,false);
 assert.equal(JSON.stringify(found).includes('customer_email'),false);
 assert.equal(JSON.stringify(found).includes('wallet:'),false);
});
test('MCP capabilities are versioned and keep account/wallet data behind authentication',async()=>{
 const response=await (await call('tools/call',{name:'roamwise_capabilities',arguments:{}})).json();
 const d=response.result.structuredContent;
 assert.equal(d.modules.wallet.publicMcpAccess,false);
 assert.equal(d.modules.itineraries.personalTripsExposed,false);
 assert.equal(d.modules.payments.userApprovalRequired,true);
 const api=await handleRoamwiseDiscovery(new Request(endpoint.replace('/mcp','/v1/discovery/capabilities')),'v1/discovery/capabilities');
 assert.equal(api.status,200);assert.equal((await api.json()).version,d.version);
});
test('Capabilities tool refuses extraneous and private account arguments',async()=>{
 const wrong=await (await call('tools/call',{name:'roamwise_capabilities',arguments:{token:'private'}})).json();
 assert.equal(wrong.error.code,-32602);
});
