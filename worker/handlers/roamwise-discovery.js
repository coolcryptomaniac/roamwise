/* Read-only public discovery REST + remote MCP for ChatGPT/Claude.
 * Runs inside the EXISTING RoamWise Worker; no new paid service or API key.
 * Protocols: stateless 2026-07-28 and legacy 2025-11-25/2025-03-26.
 */
import {publicSearch,publicItem,toCard,CATALOG_VERSION} from '../lib/roamwise-discovery-catalog.js';
import {ROAMWISE_CARDS_URI,ROAMWISE_CARDS_HTML} from '../lib/roamwise-mcp-ui.js';
import {COMMERCE_TOOLS,runCommercePreview,validateCommerceArgs} from '../lib/roamwise-commerce-preview.js';
const BASE='https://www.roamwise.co.in';
const SERVER={name:'roamwise-discovery',version:'1.0.0',title:'RoamWise · Himalayan travel and art'};
const MODERN='2026-07-28';
const LEGACY=['2025-11-25','2025-03-26'];
const MIME={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const REST_HEADERS={...MIME,'Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=300'};
const TYPES=['artist','stay','package','assistant'];
const descriptions={
 search:'Search reviewed public RoamWise artist profiles, stays and Ailon Tusk. Return cards with canonical RoamWise links. No live availability, prices or reservation guarantees.',
 detail:'Get a single public RoamWise listing and its canonical link by ID; no private contacts, payment details or inventory.',
 handoff:'Get the official RoamWise link for a public listing. This does NOT open a payment page, create a lead or confirm a reservation.'
};
export const DISCOVERY_TOOLS=[
 {name:'search_roamwise',title:'Search RoamWise',description:descriptions.search,inputSchema:{type:'object',properties:{q:{type:'string',maxLength:120,description:'Search by artist, hotel, town, activity or service'},type:{type:'string',enum:TYPES},region:{type:'string',maxLength:100},limit:{type:'integer',minimum:1,maximum:12,default:6}},additionalProperties:false}},
 {name:'get_roamwise_listing',title:'Get RoamWise listing',description:descriptions.detail,inputSchema:{type:'object',properties:{id:{type:'string',pattern:'^[a-z0-9-]{1,80}$'}},required:['id'],additionalProperties:false}},
 {name:'roamwise_enquiry_link',title:'Continue on RoamWise',description:descriptions.handoff,inputSchema:{type:'object',properties:{id:{type:'string',pattern:'^[a-z0-9-]{1,80}$'}},required:['id'],additionalProperties:false}}
,...COMMERCE_TOOLS].map(t=>({...t,...(['search_roamwise','browse_roamwise_shop','quote_roamwise_stay','quote_roamwise_shop'].includes(t.name)?{_meta:{ui:{resourceUri:ROAMWISE_CARDS_URI},'openai/outputTemplate':ROAMWISE_CARDS_URI}}:{}),annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}}));
const allowedFields={
 search_roamwise:new Set(['q','type','region','limit']),
 get_roamwise_listing:new Set(['id']),
 roamwise_enquiry_link:new Set(['id'])
};
function rpc(id,result,modern=false){
 const stamped=modern?{...result,_meta:{'io.modelcontextprotocol/serverInfo':SERVER}}:result;
 return new Response(JSON.stringify({jsonrpc:'2.0',id,result:stamped}),{headers:MIME});
}
function rpcError(id,code,message,status=200){
 return new Response(JSON.stringify({jsonrpc:'2.0',id,error:{code,message}}),{status,headers:MIME});
}
function toolResult(data,isError=false){
 return {content:[{type:'text',text:JSON.stringify(data)}],structuredContent:data,isError};
}
function validateToolArgs(name,args){
 if(COMMERCE_TOOLS.some(t=>t.name===name))return validateCommerceArgs(name,args);
 if(!allowedFields[name]||!args||typeof args!=='object'||Array.isArray(args))return false;
 if(Object.keys(args).some(k=>!allowedFields[name].has(k)))return false;
 if(name==='search_roamwise'){
  if(args.q!==undefined&&(typeof args.q!=='string'||args.q.length>120))return false;
  if(args.region!==undefined&&(typeof args.region!=='string'||args.region.length>100))return false;
  if(args.type!==undefined&&!TYPES.includes(args.type))return false;
  if(args.limit!==undefined&&(!Number.isInteger(args.limit)||args.limit<1||args.limit>12))return false;
  return true;
 }
 return typeof args.id==='string'&&/^[a-z0-9-]{1,80}$/.test(args.id);
}
export async function handleRoamwiseMcp(request,env={},deps={}){
 if(request.method!=='POST')return new Response('Method not allowed',{status:405,headers:{Allow:'POST','Cache-Control':'no-store'}});
 if(Number(request.headers.get('content-length')||0)>8192)return rpcError(null,-32600,'Request too large',413);
 let body;try{const raw=await request.text();if(raw.length>8192)return rpcError(null,-32600,'Request too large',413);body=JSON.parse(raw);}catch{return rpcError(null,-32700,'Parse error',400);}
 if(!body||body.jsonrpc!=='2.0'||Array.isArray(body)||typeof body.method!=='string')return rpcError(body?.id??null,-32600,'Invalid Request',400);
 const modern=request.headers.get('MCP-Protocol-Version')===MODERN;
 if(modern){
  const meta=body.params?._meta;
  if(meta?.['io.modelcontextprotocol/protocolVersion']!==MODERN||request.headers.get('Mcp-Method')!==body.method|| (body.method==='tools/call'&&request.headers.get('Mcp-Name')!==body.params?.name))
   return rpcError(body.id??null,-32600,'HeaderMismatch',400);
 }
 if(body.method==='notifications/initialized')return new Response(null,{status:202});
 if(body.id===undefined||body.id===null)return rpcError(null,-32600,'Request ID required',400);
 if(body.method==='server/discover'){
  if(!modern)return rpcError(body.id,-32601,'Method not found');
  return rpc(body.id,{supportedVersions:[MODERN],capabilities:{tools:{listChanged:false},resources:{listChanged:false}},instructions:'Read-only listing discovery and server-calculated quote previews. Never initiate payment, reserve rooms, promise inventory or disclose private records.'},true);
 }
 if(body.method==='initialize'){
  const requested=body.params?.protocolVersion;
  return rpc(body.id,{protocolVersion:LEGACY.includes(requested)?requested:LEGACY[0],capabilities:{tools:{listChanged:false},resources:{listChanged:false}},serverInfo:SERVER});
 }
 if(body.method==='ping')return rpc(body.id,{},modern);
 if(body.method==='tools/list')return rpc(body.id,{tools:DISCOVERY_TOOLS},modern);
 if(body.method==='resources/list')return rpc(body.id,{resources:[{uri:ROAMWISE_CARDS_URI,name:'RoamWise listing carousel',description:'Image-first, swipeable public discovery cards',mimeType:'text/html;profile=mcp-app'}]},modern);
 if(body.method==='resources/read'){
  if(body.params?.uri!==ROAMWISE_CARDS_URI)return rpcError(body.id,-32602,'Unknown resource');
  return rpc(body.id,{contents:[{uri:ROAMWISE_CARDS_URI,mimeType:'text/html;profile=mcp-app',text:ROAMWISE_CARDS_HTML,_meta:{ui:{prefersBorder:true,csp:{resourceDomains:['https://www.roamwise.co.in']}}}}]},modern);
 }
 if(body.method!=='tools/call')return rpcError(body.id,-32601,'Method not found');
 const name=body.params?.name,args=body.params?.arguments??{};
 if(!validateToolArgs(name,args))return rpcError(body.id,-32602,'Invalid tool or arguments');
 try{
  if(COMMERCE_TOOLS.some(t=>t.name===name))return rpc(body.id,toolResult(await runCommercePreview(name,args,env,deps)),modern);
  if(name==='search_roamwise'){
   const data=publicSearch(args);
   return rpc(body.id,toolResult({...data,cards:data.items.map(toCard)}),modern);
  }
  const item=publicItem(args.id);
  if(!item)return rpc(body.id,toolResult({found:false,message:'No public RoamWise listing with this ID.'}),modern);
  if(name==='get_roamwise_listing')return rpc(body.id,toolResult({found:true,item,card:toCard(item)}),modern);
  return rpc(body.id,toolResult({found:true,id:item.id,url:item.url,title:item.title,action:'open_website',checkoutStarted:false,bookingConfirmed:false,paymentConfirmed:false,requiresUserApproval:true,note:'This is a navigation/enquiry handoff only. Confirm supplier availability and final costs on RoamWise.'}),modern);
 }catch{return rpcError(body.id,-32603,'Discovery temporarily unavailable');}
}
export function handleRoamwiseDiscovery(request,path){
 if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:{Allow:'GET'}});
 const url=new URL(request.url);
 let result,status=200;
 if(path==='v1/discovery/openapi.json'){
  result={openapi:'3.1.0',info:{title:'RoamWise Public Discovery API',version:'1.0.0',description:'Public read-only discovery. Listings are not verified availability or price quotes.'},servers:[{url:'https://api.roamwise.co.in'}],paths:{
   '/v1/discovery/search':{get:{operationId:'searchRoamwise',summary:'Search public RoamWise artist, stay, package and assistant listings',parameters:[{name:'q',in:'query',schema:{type:'string',maxLength:120}},{name:'type',in:'query',schema:{type:'string',enum:TYPES}},{name:'region',in:'query',schema:{type:'string'}},{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:12}}],responses:{'200':{description:'Curated public listing cards'},'400':{description:'Invalid search'}}}},
   '/v1/discovery/items/{id}':{get:{operationId:'getRoamwiseListing',summary:'Get a public RoamWise listing',parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],responses:{'200':{description:'Public listing details'},'404':{description:'Not found'}}}}
  }};
 }else if(path==='v1/discovery/search'){
  const params=Object.fromEntries(['q','type','region','limit'].filter(k=>url.searchParams.has(k)).map(k=>[k,k==='limit'?Number(url.searchParams.get(k)):url.searchParams.get(k)]));
  try{
   const data=publicSearch(params);
   result={...data,cards:data.items.map(toCard),links:{home:BASE,api_docs:BASE+'/'}};
  }catch{status=400;result={error:'invalid_search_parameters'};}
 }else{
  const match=/^v1\/discovery\/items\/([a-z0-9-]{1,80})$/.exec(path);
  if(!match)return new Response('Not found',{status:404});
  const item=publicItem(match[1]);
  if(item)result={found:true,item,card:toCard(item),catalog_version:CATALOG_VERSION};
  else{result={found:false,error:'not_found'};status=404;}
 }
 return new Response(JSON.stringify(result),{status,headers:REST_HEADERS});
}
