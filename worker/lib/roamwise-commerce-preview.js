/* Read-only bridge from MCP to the already deployed RoamWise merchant pricing engines.
 * NEVER create order, start a payment, spend wallet balance, disclose contact,
 * or equate a server price with supplier availability.
 */
const SITE='https://www.roamwise.co.in';
const STAYS=Object.freeze({
 'milan-heights':'milan',
 'soulmate-homestay':'soulmate',
 'woodbook-the-devine':'woodbook',
 'big-bro-hotel':'bigbro'
});
const YYYYMMDD=/^\d{4}-\d{2}-\d{2}$/;
const ID=/^[a-z0-9][a-z0-9-]{1,79}$/;
const safeAmount=(n)=>Number.isFinite(Number(n))&&Number(n)>=0?Number(n):null;
function dateOk(v){if(typeof v!=='string'||!YYYYMMDD.test(v))return false;const d=new Date(v+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;}
function allowedExact(args,keys){return !!args&&typeof args==='object'&&!Array.isArray(args)&&Object.keys(args).every(k=>keys.includes(k));}
export function validateCommerceArgs(name,args){
 if(name==='browse_roamwise_shop')return allowedExact(args,[]);
 if(name==='quote_roamwise_stay'){
  if(!allowedExact(args,['listingId','checkin','checkout','paymentType']))return false;
  if(!Object.hasOwn(STAYS,args.listingId)||!dateOk(args.checkin)||!dateOk(args.checkout)||args.checkout<=args.checkin)return false;
  return args.paymentType===undefined||['advance','full'].includes(args.paymentType);
 }
 if(name==='quote_roamwise_shop'){
  if(!allowedExact(args,['items','pin'])||!Array.isArray(args.items)||args.items.length<1||args.items.length>4||typeof args.pin!=='string'||!/^[1-9]\d{5}$/.test(args.pin))return false;
  return args.items.every(i=>allowedExact(i,['id','variant','qty'])&&typeof i.id==='string'&&ID.test(i.id)&&typeof i.variant==='string'&&ID.test(i.variant)&&Number.isInteger(i.qty)&&i.qty>=1&&i.qty<=10);
 }
 return false;
}
async function invoke(handler,env,path,body){
 if(typeof handler!=='function')return {ok:false,error:'pricing_not_connected'};
 try{
  const req=new Request('https://api.roamwise.co.in/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const resp=await handler(req,env);
  const data=await resp.json().catch(()=>({}));
  if(!resp.ok||data.ok===false||data.error)return {ok:false,error:String(data.error||'quote_unavailable').slice(0,80),message:String(data.message||'The quote is unavailable. No payment has been made.').slice(0,240)};
  return {ok:true,data};
 }catch{return {ok:false,error:'quote_temporarily_unavailable'};}
}
export async function runCommercePreview(name,args,env,deps={}){
 if(!validateCommerceArgs(name,args))return {ok:false,error:'invalid_arguments'};
 if(name==='browse_roamwise_shop'){
  try{
   if(typeof deps.shopCatalogue!=='function')return {ok:false,error:'shop_catalogue_not_connected'};
   const res=await deps.shopCatalogue(new Request('https://api.roamwise.co.in/shop/catalogue'),env);
   if(!res.ok)return {ok:false,error:'shop_unavailable'};
   const data=await res.json();
   const products=Array.isArray(data.products)?data.products.slice(0,24).filter(p=>typeof p.id==='string'&&ID.test(p.id)).map(p=>({
    id:p.id,name:p.name,description:p.description,type:p.type,image_url:p.image,pricePaise:safeAmount(p.pricePaise),currency:'INR',
    variants:(Array.isArray(p.variants)?p.variants:[]).slice(0,16).map(v=>({id:v.id,label:v.label})),
    maxQty:p.maxQty||1,url:SITE+'/shop/?buy='+encodeURIComponent(p.id),
    price_verified:false,stock_verified:false,requiresFreshQuote:true
   })):[];
   return {ok:true,products,checkoutOpen:data.checkoutOpen===true,cards:products.map(p=>({
    id:p.id,title:p.name,subtitle:p.type,description:p.description,category:'product',image_url:p.image_url,
    url:p.url,price_text:p.pricePaise===null?'Check price':'₹'+(p.pricePaise/100).toLocaleString('en-IN'),
    variants:p.variants,maxQty:p.maxQty,stock_verified:false
   })),disclaimer:'Catalogue prices are indicative until a fresh server shipping/PIN quote; no order or payment is created.'};
  }catch{return {ok:false,error:'shop_catalogue_temporarily_unavailable'};}
 }
 if(name==='quote_roamwise_stay'){
  const {listingId,checkin,checkout,paymentType}=args;
  const r=await invoke(deps.stayQuote,env,'stays/quote',{stay:STAYS[listingId],checkin,checkout,paymentType:paymentType||'advance',rooms:1});
  if(!r.ok)return r;
  const q=r.data.quote||{};
  if(q.stay!==STAYS[listingId]||!Number.isFinite(Number(q.amount))||Number(q.amount)<=0||q.currency!=='INR')return {ok:false,error:'invalid_server_quote'};
  const total=safeAmount(q.total);
  return {
    ok:true,listingId,property:q.property,checkin,checkout,kind:q.kind,
    quote:{currency:'INR',payNowPaise:Math.round(Number(q.amount)*100),totalPaise:total===null?null:Math.round(total*100),balancePaise:safeAmount(q.balance)===null?null:Math.round(Number(q.balance)*100),paymentType:paymentType||'advance'},
    checkoutUrl:SITE+'/packages/amor-checkout.html?stay='+encodeURIComponent(STAYS[listingId])+'&checkin='+checkin+'&checkout='+checkout,
    availabilityVerified:false,supplierConfirmed:false,bookingConfirmed:false,paymentStarted:false,
    userApprovalRequired:true,quoteScope:total===null?'Refundable booking advance only; final total is NOT confirmed':'Server-computed payment quote; room availability remains unconfirmed',
    disclaimer:'A quote does not hold a room. Final booking confirmation requires supplier acceptance and payment reconciliation on RoamWise.'
  };
 }
 const r=await invoke(deps.shopQuote,env,'shop/quote',{items:args.items,pin:args.pin});
 if(!r.ok)return r;
 const q=r.data||{},total=safeAmount(q.totalPaise),shipping=safeAmount(q.shippingPaise);
 if(q.currency!=='INR'||total===null||total<=0||shipping===null)return {ok:false,error:'invalid_server_quote'};
 return {
   ok:true,quote:{currency:'INR',totalPaise:total,shippingPaise:shipping,subtotalPaise:safeAmount(q.subtotalPaise),
    lines:Array.isArray(q.lines)?q.lines.slice(0,8).map(x=>({id:x.id,name:x.name,variant:x.variant,qty:x.qty})):[]},
   checkoutUrl:SITE+'/shop/?buy='+encodeURIComponent(args.items[0].id),
   paymentMethods:{cashfree:q.methods?.cashfree===true,upi:q.methods?.upi===true},
   stockVerified:false,orderCreated:false,paymentStarted:false,paymentConfirmed:false,userApprovalRequired:true,
   disclaimer:'Shipping and retail amounts were computed by RoamWise. Production/stock and delivery require checkout validation; no payment has been made.'
 };
}
export const COMMERCE_TOOLS=[
 {name:'browse_roamwise_shop',title:'Browse RoamWise products',description:'Get public RoamWise merchandise and variant information from the existing server catalog; no stock or purchase is guaranteed.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'quote_roamwise_stay',title:'Price a RoamWise stay request',description:'Compute the charge amount for a listed RoamWise stay on chosen dates using the existing Worker pricing. This is not availability, room hold or booking confirmation.',inputSchema:{type:'object',properties:{
  listingId:{type:'string',enum:Object.keys(STAYS)},checkin:{type:'string',format:'date'},checkout:{type:'string',format:'date'},paymentType:{type:'string',enum:['advance','full']}
 },required:['listingId','checkin','checkout'],additionalProperties:false}},
 {name:'quote_roamwise_shop',title:'Get a RoamWise merchandise delivery quote',description:'Compute shop item and delivery costs for a six-digit Indian shipping PIN through the existing RoamWise server. No order or payment is created.',inputSchema:{type:'object',properties:{
  items:{type:'array',minItems:1,maxItems:4,items:{type:'object',properties:{id:{type:'string'},variant:{type:'string'},qty:{type:'integer',minimum:1,maximum:10}},required:['id','variant','qty'],additionalProperties:false}},
  pin:{type:'string',pattern:'^[1-9][0-9]{5}$'}
 },required:['items','pin'],additionalProperties:false}}
].map(x=>({...x,annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}}));
