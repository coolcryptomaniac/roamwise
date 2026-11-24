// @ts-nocheck
/* Stored group messages are untrusted. Shared cards are read-only formatting:
   no copied attributes, URLs, CSS, IDs, images or arbitrary app actions. */
function rwChatSafeId(id){return typeof id==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(id);}
function rwChatAttr(s){return String(s==null?'':s).replace(/[&<>"'\x60]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','\x60':'&#96;'}[c]));}
function rwChatSafeUrl(value){
 var s=String(value||'').trim();
 if(s.length>600||/["'<>\\\s\x60]/.test(s))return '';
 try{var u=new URL(s);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?s:'';}catch(e){return '';}
}
var RW_CHAT_FORMAT_TAGS=new Set(['p','div','span','strong','b','em','i','u','h2','h3','h4','ul','ol','li','br','hr','table','thead','tbody','tr','td','th','blockquote','pre','code','small']);
var RW_CHAT_DROP_TAGS=new Set(['script','style','iframe','object','embed','svg','math','template','noscript','form','input','select','textarea','button','audio','video','img','source','link','meta','base']);
function rwChatSafeHtml(html){
 var raw=String(html==null?'':html).slice(0,60000);
 try{
  var t=document.createElement('template');t.innerHTML=raw;
  var holder=document.createElement('div'),count=0;
  function append(node,target,depth){
   if(depth>30||++count>3000)return;
   if(node.nodeType===3){target.appendChild(document.createTextNode(node.textContent||''));return;}
   if(node.nodeType!==1)return;
   var tag=node.localName.toLowerCase();
   if(node.namespaceURI!=='http://www.w3.org/1999/xhtml'||RW_CHAT_DROP_TAGS.has(tag))return;
   var dest=RW_CHAT_FORMAT_TAGS.has(tag)?document.createElement(tag):target;
   if(dest!==target)target.appendChild(dest);
   Array.from(node.childNodes).forEach(n=>append(n,dest,depth+1));
  }
  Array.from(t.content.childNodes).forEach(n=>append(n,holder,0));
  return holder.innerHTML;
 }catch(e){return rwChatAttr(raw.replace(/<[^>]*>/g,' '));}
}
function rwChatCleanMessage(m){
 var out={...m};['text','name','kind','uid'].forEach(k=>{if(out[k]!=null)out[k]=String(out[k]).slice(0,16000);});
 var rx=Object.create(null),src=m.reactions&&typeof m.reactions==='object'?m.reactions:{};
 Object.keys(src).slice(0,24).forEach(k=>{
  if(k.length<=16&&/^\p{Extended_Pictographic}[\p{Extended_Pictographic}\p{Emoji_Modifier}\u200d\ufe0f]*$/u.test(k)&&Array.isArray(src[k]))rx[k]=src[k].filter(x=>typeof x==='string').slice(0,500);
 });
 out.reactions=rx;
 var q=m.payload&&typeof m.payload==='object'&&!Array.isArray(m.payload)?{...m.payload}:{};
 if(q.html!=null)q.html=String(q.html).slice(0,60000);
 if(q.amount!=null){var n=Number(q.amount);q.amount=Number.isFinite(n)?n:0;}
 if(q.map!=null)q.map=rwChatSafeUrl(q.map);
 ['options','opts'].forEach(k=>{if(q[k]!=null)q[k]=Array.isArray(q[k])?q[k].slice(0,24).map(x=>String(x==null?'':x).slice(0,500)):[];});
 ['q','what','payerName','place','when','city','route','type','text'].forEach(k=>{if(q[k]!=null)q[k]=String(q[k]).slice(0,16000);});
 if(q.choice!=null&&m.kind!=='vote')q.choice=String(q.choice).slice(0,500);
 if(q.votes!=null){var votes=Object.create(null);if(typeof q.votes==='object'&&!Array.isArray(q.votes))Object.keys(q.votes).slice(0,500).forEach(k=>{if(rwChatSafeId(k)&&Number.isInteger(q.votes[k])&&q.votes[k]>=0&&q.votes[k]<24)votes[k]=q.votes[k];});q.votes=votes;}
 if(q.free!=null)q.free=Array.isArray(q.free)?q.free.filter(x=>Number.isInteger(x)&&x>=0&&x<24).slice(0,24):[];
 out.payload=q;return out;
}
var RW_CHAT_RISKS=[
 ['asks for an OTP or PIN',/\b(otp|one[\s-]?time password|upi pin|atm pin|cvv)\b/i],
 ['shares a UPI ID',/\b[a-z0-9._-]{2,}@(ok[a-z]+|ybl|ibl|axl|upi|paytm|apl|yapl|ptyes|ptsbi|pthdfc|ptaxis|jupiteraxis|fbl|kotak|icici|sbi|hdfcbank|axisbank|airtel|freecharge)\b/i],
 ['shares bank details',/\b(ifsc|account\s*(no|number)|a\/c\s*no)\b|\b[A-Z]{4}0[A-Z0-9]{6}\b/i],
 ['asks you to send money',/\b(send|transfer|pay)\b[^.?!]{0,30}(?:\b(money|amount|advance|deposit|token amount|rs\.?|inr)\b|₹)|\b(gift ?card|crypto|usdt|bitcoin)\b/i],
 ['has an outside payment link',/\b(rzp\.io|razorpay\.me|paytm\.me|upi:\/\/pay|pay\.google\.com|phon\.pe|paypal\.me|bit\.ly|tinyurl\.com)\b/i]
];
function rwChatRisk(text){var t=String(text||'').slice(0,16000);for(var row of RW_CHAT_RISKS)if(row[1].test(t))return row[0];return '';}
function rwChatRiskHTML(text,id){
 var why=rwChatRisk(text);if(!why||!rwChatSafeId(id))return '';
 return '<div class="tc-risk" role="note" style="margin-top:6px;font-size:11px;line-height:1.5">⚠ This message '+why+'. Never share OTPs or PINs. Verify payment requests in RoamWise. <button type="button" onclick="rwReportOpen({room:window._chatRoom,messageId:\''+id+'\'})">Report</button></div>';
}
if(typeof module!=='undefined'&&module.exports)module.exports={rwChatSafeId,rwChatAttr,rwChatSafeUrl,rwChatSafeHtml,rwChatCleanMessage,rwChatRisk,rwChatRiskHTML};
