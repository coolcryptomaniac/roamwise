export const DEFAULT_PROVIDERS = {
  razorpay: {countries:['IN'],currencies:['INR'],methods:['upi','card','netbanking','wallet'],feeBps:200,fixedMinor:0,reliability:0.995,priority:20},
  cashfree: {countries:['IN'],currencies:['INR'],methods:['upi','card','netbanking','wallet'],feeBps:195,fixedMinor:0,reliability:0.995,priority:18},
  stripe: {countries:['*'],currencies:['*'],methods:['card','wallet','bank'],feeBps:300,fixedMinor:0,reliability:0.997,priority:15},
  paypal: {countries:['*'],currencies:['*'],methods:['paypal'],feeBps:440,fixedMinor:30,reliability:0.994,priority:12},
  direct_upi: {countries:['IN'],currencies:['INR'],methods:['upi'],feeBps:0,fixedMinor:0,reliability:0.92,priority:-20,manual:true}
};

function csv(v){return String(v||'').split(',').map(x=>x.trim()).filter(Boolean)}
function num(v,d){var n=Number(v);return Number.isFinite(n)?n:d}
function enabled(env,key){var v=env['PAY_'+key.toUpperCase()+'_ENABLED'];return v==null?true:String(v).toLowerCase()!=='false'}
function listOk(list,value){return list.includes('*')||list.includes(value)}

export function providerConfig(env={}){
  var out={};
  for(var [key,base] of Object.entries(DEFAULT_PROVIDERS)){
    var p={...base};
    p.enabled=enabled(env,key);
    p.feeBps=num(env['PAY_'+key.toUpperCase()+'_FEE_BPS'],p.feeBps);
    p.fixedMinor=num(env['PAY_'+key.toUpperCase()+'_FIXED_MINOR'],p.fixedMinor);
    p.reliability=Math.max(.5,Math.min(.9999,num(env['PAY_'+key.toUpperCase()+'_RELIABILITY'],p.reliability)));
    p.priority=num(env['PAY_'+key.toUpperCase()+'_PRIORITY'],p.priority);
    var c=csv(env['PAY_'+key.toUpperCase()+'_COUNTRIES']);if(c.length)p.countries=c;
    var cur=csv(env['PAY_'+key.toUpperCase()+'_CURRENCIES']);if(cur.length)p.currencies=cur;
    var m=csv(env['PAY_'+key.toUpperCase()+'_METHODS']);if(m.length)p.methods=m;
    if(key==='direct_upi')p.enabled=p.enabled&&String(env.ALLOW_MANUAL_UPI||'false')==='true';
    out[key]=p;
  }
  return out;
}

export function providerReady(key,env={}){
  if(key==='razorpay')return !!(env.RAZORPAY_KEY_ID&&env.RAZORPAY_KEY_SECRET);
  if(key==='cashfree')return !!(env.CASHFREE_APP_ID&&env.CASHFREE_SECRET_KEY);
  if(key==='stripe')return !!env.STRIPE_SECRET_KEY;
  if(key==='paypal')return !!(env.PAYPAL_CLIENT_ID&&env.PAYPAL_CLIENT_SECRET);
  if(key==='direct_upi')return !!env.DIRECT_UPI_VPA;
  return false;
}

export function estimateCostMinor(p,amountMinor,{country,currency,method,cardOrigin}={}){
  var bps=p.feeBps;
  // Stripe India published pricing differs for domestic vs foreign/international cards.
  if(p.key==='stripe'&&country==='IN'&&method==='card'){
    if(cardOrigin==='IN')bps=200;
    else if(currency==='INR')bps=300;
    else bps=430;
  }
  return Math.max(0,Math.round(amountMinor*bps/10000)+Math.round(p.fixedMinor||0));
}

export function routePayment(input,env={}){
  var amountMinor=Math.round(num(input.amountMinor,0)),country=String(input.country||'IN').toUpperCase(),currency=String(input.currency||'INR').toUpperCase(),method=String(input.method||'card').toLowerCase();
  if(amountMinor<=0)throw new Error('amountMinor must be a positive integer');
  var config=providerConfig(env),rows=[];
  for(var [key,raw] of Object.entries(config)){
    var p={...raw,key};
    if(!p.enabled||!providerReady(key,env))continue;
    if(!listOk(p.countries,country)||!listOk(p.currencies,currency)||!listOk(p.methods,method))continue;
    if(input.recurring&&['razorpay','cashfree','stripe'].indexOf(key)<0)continue;
    if(key==='paypal'&&country==='IN'&&input.domestic===true)continue; // PayPal India supports international receipts, not domestic merchant collection.
    var cost=estimateCostMinor(p,amountMinor,{country,currency,method,cardOrigin:input.cardOrigin});
    var reliabilityPenalty=Math.round(amountMinor*(1-p.reliability)*0.08);
    var manualPenalty=p.manual?Math.max(100,Math.round(amountMinor*.01)):0;
    rows.push({provider:key,estimatedFeeMinor:cost,estimatedNetMinor:amountMinor-cost,reliability:p.reliability,manual:!!p.manual,score:cost+reliabilityPenalty+manualPenalty-p.priority,reason:'eligible'});
  }
  rows.sort((a,b)=>a.score-b.score||b.reliability-a.reliability);
  return {amountMinor,country,currency,method,candidates:rows,recommended:rows[0]||null};
}

export function shouldFallback(status){return status===408||status===409||status===425||status===429||status>=500}
export function safeId(v){return String(v||'').replace(/[^A-Za-z0-9_-]/g,'').slice(0,45)}
