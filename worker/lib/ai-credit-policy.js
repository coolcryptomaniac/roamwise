// Integer paise are the only ledger unit. One credit = one paise of AI service.
export const AI_CREDIT_PACKS = Object.freeze([10,20,50,100,250,500,1000].map(rupees=>({id:'inr'+rupees,amountPaise:rupees*100,credits:rupees*100})));
export const AI_CREDIT_RATE_VERSION='2026-11-18-v1';
export const AI_CREDIT_RATES_UNTIL=Date.parse('2026-12-18T00:00:00Z');
export const AI_CREDIT_FX=90; // Published billing conversion, not a live FX quote.
export const AI_CREDIT_SERVICE_PERCENT=25;
export const AI_CREDIT_MODELS=Object.freeze({
  standard:{id:'standard',label:'Gemma 4 · Standard',model:'@cf/google/gemma-4-26b-a4b-it',input:0.10,output:0.30,maxOutput:768,gateway:false},
  gptmini:{id:'gptmini',label:'GPT-4.1 mini',model:'openai/gpt-4.1-mini',input:0.40,output:1.60,maxOutput:768,gateway:true},
});
export const AI_ORDER_RE=/^ai_[a-f0-9]{32}_[a-f0-9]{8}$/;
export function creditModel(id,env,now=Date.now()){
  const m=Object.hasOwn(AI_CREDIT_MODELS,id||'')?AI_CREDIT_MODELS[id]:null;
  if(!m||now>=AI_CREDIT_RATES_UNTIL||!env.AI?.run)return null;
  if(m.gateway&&!(env.AI_CREDITS_GATEWAY_ENABLED==='true'&&/^[a-zA-Z0-9_-]{1,64}$/.test(env.AI_CREDITS_GATEWAY_ID||'')))return null;
  return m;
}
export function creditPrice(m,input,output){
  if(!Number.isSafeInteger(input)||input<0||!Number.isSafeInteger(output)||output<0)throw Error('invalid_usage');
  const modelPaise=Math.ceil((input*m.input+output*m.output)*AI_CREDIT_FX*100/1e6);
  const gatewayPaise=m.gateway?Math.ceil(modelPaise*0.05):0;
  const servicePaise=Math.max(1,Math.ceil((modelPaise+gatewayPaise)*AI_CREDIT_SERVICE_PERCENT/100));
  return {modelPaise,gatewayPaise,servicePaise,totalPaise:modelPaise+gatewayPaise+servicePaise};
}
export function creditEstimate(m,messages){
  const bytes=new TextEncoder().encode(messages.map(x=>x.content).join('\n')).byteLength;
  return creditPrice(m,bytes+256,m.maxOutput);
}
export function creditUsage(m,out){
  const u=out?.usage;
  if(!u||!Number.isSafeInteger(u.prompt_tokens)||!Number.isSafeInteger(u.completion_tokens)||u.prompt_tokens<0||u.completion_tokens<0)return null;
  return {...creditPrice(m,u.prompt_tokens,u.completion_tokens),inputTokens:u.prompt_tokens,outputTokens:u.completion_tokens};
}
export async function creditHash(s){
  const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
}
export async function creditBody(request,max=16000){
  const reader=request.body?.getReader();if(!reader)return '';
  const chunks=[];let size=0;
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw Error('payload_too_large');}chunks.push(value);}
  const data=new Uint8Array(size);let pos=0;for(const c of chunks){data.set(c,pos);pos+=c.length;}return data;
}
