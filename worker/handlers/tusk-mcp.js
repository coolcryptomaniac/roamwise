/* MCP JSON-RPC read-only tools. No credentials, payments, or personal data. */
import { readPublicDisplayCache,cacheKey } from '../lib/cloudflare-public-cache.js';
const toolDefs=[
 {name:'roamwise_public_listing',description:'Get one approved public RoamWise listing by collection and ID. Does not verify price or availability.',inputSchema:{type:'object',properties:{collection:{type:'string',enum:['destinations','publicProperties','publicCreators','publicExperiences']},id:{type:'string',pattern:'^[A-Za-z0-9_-]{1,100}$'}},required:['collection','id'],additionalProperties:false}},
 {name:'roamwise_checkout_handoff',description:'Provide a link to the official RoamWise category page. Does not create orders or confirm bookings.',inputSchema:{type:'object',properties:{category:{type:'string',enum:['shop','stays','packages','treks','pro','music']},itemId:{type:'string',description:'Optional live RoamWise shop catalogue item ID (shop only)',pattern:'^[a-z0-9-]{1,60}$'}},required:['category'],additionalProperties:false}}
];
const pages={shop:'/shop/',stays:'/',packages:'/packages/',treks:'/treks/',pro:'/',music:'/music/store/'};
function response(id,result){return Response.json({jsonrpc:'2.0',id,result},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
function error(id,code,message,status=200){return Response.json({jsonrpc:'2.0',id,error:{code,message}},{status,headers:{'Cache-Control':'no-store'}});}
export async function handleTuskMcp(request,env){
 if(request.method!=='POST')return new Response('Method not allowed',{status:405,headers:{Allow:'POST'}});
 if(Number(request.headers.get('content-length')||0)>4096)return error(null,-32600,'Request too large',413);
 let b;try{const raw=await request.text();if(raw.length>4096)return error(null,-32600,'Request too large',413);b=JSON.parse(raw);}catch{return error(null,-32700,'Parse error',400);}
 if(!b||b.jsonrpc!=='2.0'||typeof b.method!=='string'||Array.isArray(b))return error(b?.id??null,-32600,'Invalid Request',400);
 if(b.method==='notifications/initialized')return new Response(null,{status:202});
 if(b.id===undefined||b.id===null)return error(null,-32600,'Request ID required',400);
 if(b.method==='initialize')return response(b.id,{protocolVersion:'2025-03-26',capabilities:{tools:{listChanged:false}},serverInfo:{name:'roamwise-ailon-tusk',version:'0.1.0'}});
 if(b.method==='ping')return response(b.id,{});
 if(b.method==='tools/list')return response(b.id,{tools:toolDefs});
 if(b.method!=='tools/call')return error(b.id,-32601,'Method not found');
 const name=b.params?.name,args=b.params?.arguments||{};
 if(!args||typeof args!=='object'||Array.isArray(args))return error(b.id,-32602,'Invalid arguments');
 if(name==='roamwise_checkout_handoff'){
  const keys=Object.keys(args);
  if(!keys.every(k=>k==='category'||k==='itemId')||!Object.hasOwn(pages,args.category)||typeof args.category!=='string'||(args.itemId!==undefined&&(args.category!=='shop'||typeof args.itemId!=='string'||!/^[a-z0-9-]{1,60}$/.test(args.itemId))))return error(b.id,-32602,'Invalid category or item');
  return response(b.id,{content:[{type:'text',text:JSON.stringify({url:'https://www.roamwise.co.in'+pages[args.category]+(args.itemId?'?buy='+encodeURIComponent(args.itemId):''),category:args.category,checkoutStarted:false,bookingConfirmed:false,paymentConfirmed:false,requiresUserApproval:true})}]});
 }
 if(name==='roamwise_public_listing'){
  if(Object.keys(args).length!==2)return error(b.id,-32602,'Invalid listing arguments');
  try{cacheKey(args.collection,args.id);}catch{return error(b.id,-32602,'Invalid listing ID');}
  if(env.PUBLIC_DISPLAY_CACHE_ENABLED!=='true')return response(b.id,{content:[{type:'text',text:'Public listing lookup is not enabled.'}],isError:true});
  const doc=await readPublicDisplayCache(env.RW_KV,args.collection,args.id);
  return response(b.id,{content:[{type:'text',text:doc?JSON.stringify({listing:doc,liveAvailabilityVerified:false,livePriceVerified:false}):'No approved public listing found.'}]});
 }
 return error(b.id,-32602,'Unknown tool');
}
