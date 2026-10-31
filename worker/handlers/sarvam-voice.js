/* Sarvam BYOK speech proxy. No RoamWise-owned Sarvam billing or key storage.
   Cloudflare forwards user key only to the fixed Sarvam origin, never logs it. */
export async function handleSarvamVoice(request) {
  const allowed = new Set(['https://roamwise.co.in','https://www.roamwise.co.in']);
  const origin = request.headers.get('Origin') || '';
  // Reject browsers at an unexpected origin; non-browser requests require explicit key.
  if (origin && !allowed.has(origin)) return new Response('Forbidden origin',{status:403});
  if(request.method!=='POST')return new Response('Method not allowed',{status:405});
  const length=Number(request.headers.get('content-length')||0);
  if(length>6000)return new Response('Request too large',{status:413});
  let data;
  try{data=await request.json();}catch(e){return new Response('Invalid request',{status:400});}
  const key=String(data&&data.key||'').trim();
  const content=String(data&&data.text||'').trim();
  const lang=String(data&&data.language_code||'hi-IN');
  const model=String(data&&data.model||'bulbul:v4-flash');
  if(key.length<10||key.length>512||/\s/.test(key))return new Response('Invalid API key',{status:400});
  if(!content||content.length>650)return new Response('Speech excerpt is limited to 650 characters',{status:400});
  if(!['hi-IN','en-IN'].includes(lang))return new Response('Unsupported voice locale',{status:400});
  if(!['bulbul:v4-flash','bulbul:v3'].includes(model))return new Response('Unsupported model',{status:400});
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),13000);
  try{
    const upstream=await fetch('https://api.sarvam.ai/text-to-speech',{
      method:'POST',headers:{'Content-Type':'application/json','api-subscription-key':key},
      body:JSON.stringify({text:content,language_code:lang,model: model,output_audio_codec:'mp3',pace:1}),
      signal:controller.signal
    });
    if(!upstream.ok){
      // Never return upstream response: it could contain request secrets.
      return new Response(JSON.stringify({error:upstream.status===402?'BYOK credits exhausted':
        upstream.status===429?'BYOK provider rate limited':'Sarvam voice unavailable',status:upstream.status}),{
        status:upstream.status===402?402:upstream.status===429?429:502,
        headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
      });
    }
    const result=await upstream.json();
    const base64=result&&result.audios&&result.audios[0];
    if(typeof base64!=='string'||base64.length>3500000||!/^[A-Za-z0-9+/=]+$/.test(base64))
      return new Response('Invalid speech output',{status:502});
    return new Response(JSON.stringify({audio:base64,codec:'mp3'}),{
      headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
    });
  }catch(e){return new Response('Speech provider timed out or unavailable',{status:503});}
  finally{clearTimeout(timer);}
}
