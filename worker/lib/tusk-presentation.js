export function tuskPresentation(text,{expanded=false}={}){
 const raw=String(text||'').trim().slice(0,16000);
 const lines=raw.split(/\n+/).map(x=>x.trim()).filter(Boolean);
 const summary=(lines[0]||'No result available yet.').slice(0,expanded?900:220);
 const cards=lines.slice(1,5).map((line,i)=>({id:'result-'+(i+1),title:line.slice(0,90),description:line.slice(90,240)||null,imageUrl:null,price:null,availability:'unverified',bookingAction:null}));
 return {summary,cards,hasMore:lines.length>5||raw.length>summary.length,fullText:expanded?raw:undefined};
}
export function bookingIntentResponse({packageId,authenticated=false,verifiedPrice=false,verifiedAvailability=false,checkoutSessionUrl=null}={}){
 if(!packageId||!authenticated)return {status:'sign_in_required',checkoutUrl:null};
 if(!verifiedPrice||!verifiedAvailability)return {status:'verification_required',checkoutUrl:null};
 if(!checkoutSessionUrl||!String(checkoutSessionUrl).startsWith('https://'))return {status:'checkout_not_created',checkoutUrl:null};
 return {status:'checkout_ready',checkoutUrl:checkoutSessionUrl,bookingConfirmed:false};
}