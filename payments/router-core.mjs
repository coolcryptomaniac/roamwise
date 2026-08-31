import {PROVIDERS,NEVER_ROUTE_PRODUCT_TYPES,MOR_KINDS} from './provider-registry.mjs';

export const DEFAULT_PROVIDERS = PROVIDERS;
function csv(v){return String(v||'').split(',').map(x=>x.trim()).filter(Boolean)}
function num(v,d){var n=Number(v);return Number.isFinite(n)?n:d}
function bool(v,d=false){if(v==null||v==='')return d;return String(v).toLowerCase()==='true'}
function enabled(env,key,base){var v=env['PAY_'+key.toUpperCase()+'_ENABLED'];if(v!=null)return bool(v);return base.status==='supported'&&!base.experimental}
function listOk(list,value){return list.includes('*')||list.includes(value)}
function productOk(p,type){return !p.productTypes?.length||p.productTypes.includes(type)}

export function providerConfig(env={}){
  var out={};
  for(var [key,base] of Object.entries(PROVIDERS)){
    var p={...base};
    p.enabled=enabled(env,key,base);
    p.feeBps=num(env['PAY_'+key.toUpperCase()+'_FEE_BPS'],p.feeBps);
    p.fixedMinor=num(env['PAY_'+key.toUpperCase()+'_FIXED_MINOR'],p.fixedMinor);
    p.reliability=Math.max(.5,Math.min(.9999,num(env['PAY_'+key.toUpperCase()+'_RELIABILITY'],p.reliability)));
    p.priority=num(env['PAY_'+key.toUpperCase()+'_PRIORITY'],p.priority);
    var c=csv(env['PAY_'+key.toUpperCase()+'_COUNTRIES']);if(c.length)p.countries=c;
    var cur=csv(env['PAY_'+key.toUpperCase()+'_CURRENCIES']);if(cur.length)p.currencies=cur;
    var m=csv(env['PAY_'+key.toUpperCase()+'_METHODS']);if(m.length)p.methods=m;
    if(p.experimental)p.enabled=p.enabled&&bool(env.ALLOW_EXPERIMENTAL_CRYPTO_UPI,false);
    if(key==='direct_upi')p.enabled=p.enabled&&bool(env.ALLOW_MANUAL_UPI,false);
    out[key]=p;
  }
  return out;
}

export function providerReady(key,env={}){
  if(key==='razorpay')return !!(env.RAZORPAY_KEY_ID&&env.RAZORPAY_KEY_SECRET);
  if(key==='cashfree')return !!(env.CASHFREE_APP_ID&&env.CASHFREE_SECRET_KEY);
  if(key==='instamojo')return !!(env.INSTAMOJO_CLIENT_ID&&env.INSTAMOJO_CLIENT_SECRET);
  if(key==='stripe')return !!env.STRIPE_SECRET_KEY;
  if(key==='paypal')return !!(env.PAYPAL_CLIENT_ID&&env.PAYPAL_CLIENT_SECRET);
  if(key==='direct_upi')return !!env.DIRECT_UPI_VPA;
  var p=PROVIDERS[key];
  if(p?.checkoutEnv)return !!String(env[p.checkoutEnv]||'').trim();
  return false;
}

export function estimateCostMinor(p,amountMinor,{country,currency,method,cardOrigin}={}){
  var bps=p.feeBps;
  if(p.key==='stripe'&&country==='IN'&&method==='card'){
    if(cardOrigin==='IN')bps=200;else if(currency==='INR')bps=300;else bps=430;
  }
  return Math.max(0,Math.round(amountMinor*bps/10000)+Math.round(p.fixedMinor||0));
}

export function routePayment(input,env={}){
  var amountMinor=Math.round(num(input.amountMinor,0)),country=String(input.country||'IN').toUpperCase(),currency=String(input.currency||'INR').toUpperCase(),method=String(input.method||'card').toLowerCase(),productType=String(input.productType||'digital').toLowerCase();
  if(amountMinor<=0)throw new Error('amountMinor must be a positive integer');
  if(NEVER_ROUTE_PRODUCT_TYPES.has(productType))throw new Error('Investment/securities flows must use the investor compliance workflow, not consumer checkout routing.');
  var config=providerConfig(env),rows=[];
  for(var [key,raw] of Object.entries(config)){
    var p={...raw,key};
    if(!p.enabled||!providerReady(key,env))continue;
    if(!productOk(p,productType))continue;
    if(!listOk(p.countries,country)||!listOk(p.currencies,currency)||!listOk(p.methods,method))continue;
    if(input.recurring&&!['razorpay','cashfree','stripe','dodo','creem','paddle','lemonsqueezy'].includes(key))continue;
    if(MOR_KINDS.has(p.kind)&&productType!=='digital')continue;
    if(key==='paypal'&&country==='IN'&&input.domestic===true)continue;
    var cost=estimateCostMinor(p,amountMinor,{country,currency,method,cardOrigin:input.cardOrigin});
    var reliabilityPenalty=Math.round(amountMinor*(1-p.reliability)*.08);
    var manualPenalty=p.manual?Math.max(100,Math.round(amountMinor*.01)):0;
    var experimentPenalty=p.experimental?Math.max(500,Math.round(amountMinor*.04)):0;
    rows.push({provider:key,kind:p.kind,status:p.status,estimatedFeeMinor:cost,estimatedNetMinor:amountMinor-cost,reliability:p.reliability,manual:!!p.manual,experimental:!!p.experimental,score:cost+reliabilityPenalty+manualPenalty+experimentPenalty-p.priority,reason:'eligible'});
  }
  rows.sort((a,b)=>a.score-b.score||b.reliability-a.reliability);
  return {amountMinor,country,currency,method,productType,candidates:rows,recommended:rows[0]||null};
}

export function checkoutUrlFor(provider,input,env={}){
  var p=PROVIDERS[provider],raw=p?.checkoutEnv?String(env[p.checkoutEnv]||''):'';
  if(!raw)return '';
  var vars={product:input.productId||'',amount:String(input.amountMinor||''),currency:input.currency||'',country:input.country||'',email:input.customer?.email||'',return_url:env.PAYMENT_RETURN_URL||''};
  return raw.replace(/\{(product|amount|currency|country|email|return_url)\}/g,(_,k)=>encodeURIComponent(vars[k]||''));
}
export function shouldFallback(status){return status===408||status===409||status===425||status===429||status>=500}
export function safeId(v){return String(v||'').replace(/[^A-Za-z0-9_-]/g,'').slice(0,45)}
