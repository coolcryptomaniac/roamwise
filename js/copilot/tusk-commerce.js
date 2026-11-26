// @ts-nocheck
/* Ailon Tusk commerce bridge. Read-only recommendation cards until the traveller
   explicitly opens a form, reviews a SERVER quote and clicks "Pay".
   Uses existing official RoamWise shop/stays Workers; never LLM prices or card data.
   No public search receives the customer's contact, address or trip details. */
(function(root){
 'use strict';
 var API='https://roamwise-api.founder-f53.workers.dev';
 var TTL=60000, cache={}, modal=null, state=null, busy=false;
 var safeId=/^[a-z0-9-]{1,80}$/;
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function rupees(paise){return '₹'+(Number(paise||0)/100).toLocaleString('en-IN',{maximumFractionDigits:2});}
 function money(inr){return '₹'+(Number(inr)||0).toLocaleString('en-IN',{maximumFractionDigits:2});}
 function allowedQuery(q){
   if(typeof rwTuskIsPublicQuery!=='function'||!rwTuskIsPublicQuery(q))return false;
   return !/\b(?:emergency|ambulance|police|sos|assault|suicide|self harm|medical|injury|landslide|missing person|scam|fraud|otp|password)\b|आपातकाल|इमरजेंसी|मदद चाहिए/i.test(q||'');
 }
 function category(q){
   q=String(q||'').toLowerCase();
   if(!allowedQuery(q))return '';
   if(/\b(?:hoodie|tote|headband|shop|merch|merchandise|buy a|buy the|gift|souvenir|shopping|aipan shirt|t-shirt)\b|हुडी|खरीदना|शॉप|उपहार/i.test(q))return 'shop';
   if(/\b(?:trek|trekking|hiking|trek guide|hike)\b|ट्रेक|ट्रेकिंग/i.test(q))return 'treks';
   if(/\b(?:package|packages|honeymoon|wedding|holiday deal|family holiday|resort package|tour package)\b|पैकेज|हनीमून|शादी/i.test(q))return 'packages';
   if(/\b(?:hotel|homestay|room|resort|stay|book a villa|book a cottage|accommodation)\b|होटल|होमस्टे|कमरा|रुकना/i.test(q))return 'stays';
   return '';
 }
 function hidden(){try{return localStorage.getItem('rw_tusk_offers')==='hide';}catch(e){return false;}}
 function get(path){
   if(cache[path]&&Date.now()-cache[path].time<TTL)return Promise.resolve(cache[path].data);
   var controller=typeof AbortController==='function'?new AbortController():null;
   var timer=controller?setTimeout(function(){controller.abort();},4000):null;
   return fetch(API+path,{method:'GET',credentials:'omit',referrerPolicy:'no-referrer',mode:'cors',cache:'no-store',...(controller?{signal:controller.signal}:{})})
    .then(function(r){if(!r.ok)throw Error('Catalogue unavailable');return r.json();})
    .then(function(data){cache[path]={time:Date.now(),data:data};return data;})
    .finally(function(){if(timer)clearTimeout(timer);});
 }
 function scopeFor(q,intents){
   var d=typeof rwLocalAtlasRecord==='function'?rwLocalAtlasRecord(q,intents):null;
   if(d)return d.id==='coorg'?'Coorg':d.name;
   if(intents&&(intents.multi||intents._route||intents._weakDest||intents._needsPlaceVerification))return null;
   if(intents&&intents.dest)return String(intents.dest).slice(0,100);
   var m=String(q||'').match(/\b(?:manali|almora|corbett|gir|nainital|ranikhet|kasar devi|tirthan|lansdowne|delhi|mumbai|goa|coorg|bengaluru|jaipur|paris|london|zurich|kathmandu)\b/i);
   return m?m[0]:'';
 }
 function placeMatch(value,scope){
   var norm=function(x){return String(x||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();};
   return !!scope&&(' '+norm(value)+' ').includes(' '+norm(scope)+' ');
 }
 function items(kind,data,q,scope){
   var destination=scope;
   var lower=String(q||'').toLowerCase();
   if(kind==='shop'){
     var all=Array.isArray(data.products)?data.products:[];
     var matched=all.filter(function(p){return String(p.name+' '+p.type).toLowerCase().split(/\s+/).some(function(w){return w.length>3&&lower.indexOf(w)>-1;});});
     return (matched.length?matched:all).slice(0,2).map(function(p){return {id:p.id,type:'shop',title:p.name,subtitle:p.type,price:rupees(p.pricePaise)+' item price · delivery quoted later',picture:p.image,buy:!!data.checkoutOpen};});
   }
   if(kind==='packages'){
     var packages=(Array.isArray(data.packages)?data.packages:[]).filter(function(p){return p.open!==false;});
     if(destination)packages=packages.filter(function(p){
       return placeMatch(p.name+' '+(p.properties||[]).map(function(x){return x.name+' '+(x.place||'');}).join(' '),destination);
     });
     var group=/(?:honeymoon|romantic|couple|हनीमून)/i.test(q)?'honeymoon':/(?:wedding|marriage|shaadi|शादी)/i.test(q)?'wedding':'';
     if(group){var matching=packages.filter(function(p){return p.group===group||String(p.name).toLowerCase().indexOf(group)>-1;});if(matching.length)packages=matching;}
     return packages.slice(0,2).map(function(p){return {id:p.id,type:'package',title:p.name,subtitle:p.nightsLabel||'Dates and rooms at checkout',price:p.from&&Number.isFinite(Number(p.from.total))?'From '+money(p.from.total)+' · recheck for your dates':'Price after choosing dates',buy:true};});
   }
   if(kind==='stays'){
     var stays=data.stays||{}, keys=Object.keys(stays);
     var matched=keys.filter(function(id){var s=stays[id];return s&&(destination?placeMatch(s.name+' '+s.place,destination):String(s.name+' '+s.place).toLowerCase().split(/[ ,]+/).some(function(w){return w.length>3&&lower.indexOf(w)>-1;}));});
     if(destination&&!matched.length)return [];
     return (matched.length?matched:keys).slice(0,2).map(function(id){var s=stays[id];return {id:id,type:'stay',title:s.name,subtitle:s.place||'Check dates and availability',price:'Exact quote at checkout',buy:true};});
   }
   return [{id:'treks',type:'treks',title:'Verified treks and guides',subtitle:'Choose a departure and check operator approval, seats and price',price:'Price verified at operator checkout',buy:false}];
 }
 function relatedShop(data,scope){
   var name=String(scope||'').toLowerCase().trim();
   var kumaon=/^(almora|kasar devi|binsar|ranikhet|kausani|haldwani|nainital|bhimtal|mukteshwar|kumaon|dwarahat|sitalakhet)$/i.test(name);
   return (Array.isArray(data.products)?data.products:[]).filter(function(p){
     var words=String(p.name+' '+(p.description||'')).toLowerCase();
     return placeMatch(p.name,name)||(kumaon&&/\b(?:almora|kumaon|kumaoni|aipan)\b/i.test(words));
   }).slice(0,2).map(function(p){return {id:p.id,type:'shop',title:p.name,subtitle:'Destination-inspired merchandise · not necessarily locally made',price:rupees(p.pricePaise)+' item price · delivery quoted later',picture:p.image,buy:!!data.checkoutOpen};});
 }
 function dataFor(kind){return get(kind==='shop'?'/shop/catalogue':kind==='treks'?'/treks/catalog':'/stays/rates');}
 function cardMarkup(a){
   if(!safeId.test(String(a.id))||!['shop','package','stay','treks'].includes(a.type))return '';
   var href=a.type==='shop'?'/shop/?buy='+encodeURIComponent(a.id):a.type==='package'?'/packages/amor-checkout.html?package='+encodeURIComponent(a.id):a.type==='stay'?'/packages/amor-checkout.html?stay='+encodeURIComponent(a.id):'/treks/';
   return '<article class="rw-tusk-offer" style="flex:0 0 min(73vw,240px);scroll-snap-align:start;border:1px solid #806da6;border-radius:15px;padding:12px;background:#1b1732;color:#f9f4ff;display:flex;flex-direction:column;gap:7px">'
     +'<strong style="font-size:13px">'+esc(a.title)+'</strong><span style="font-size:11px;opacity:.85">'+esc(a.subtitle)+'</span>'
     +'<span style="font-size:12px;color:#f5cd86">'+esc(a.price)+'</span>'
     +(a.buy?'<button type="button" data-tusk-open="'+esc(a.type)+'" data-tusk-id="'+esc(a.id)+'" style="background:#e6b86f;border:0;border-radius:8px;padding:9px;color:#241128;font-weight:800;cursor:pointer">Review &amp; pay in Ailon</button>':'')
     +'<a href="'+esc(href)+'" style="color:#f5cd86;font-size:11px">View official listing</a></article>';
 }
 function railMarkup(kind,list){
   if(!list.length)return '';
   return '<section class="rw-tusk-commerce tk-card" aria-label="RoamWise promotional suggestions" style="margin-top:12px">'
    +'<div class="tk-sec"><div style="font-size:11px;font-weight:800;margin-bottom:7px">RoamWise offers · our own listings · promotional</div>'
    +'<div style="display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 1px 12px" role="list" aria-label="Swipe RoamWise offers">'
    +list.map(cardMarkup).join('')+'</div>'
    +'<button type="button" data-tusk-hide-offers style="border:0;background:none;color:#c9bcdc;font-size:11px;text-decoration:underline;cursor:pointer">Hide these offers</button>'
    +'<p style="font-size:10px;color:#c9bcdc;margin:5px 0 0">Listing prices are indicative; server quote, availability, booking terms and Cashfree confirmation control checkout. No booking is confirmed just by paying.</p></div></section>';
 }
 function enquiry(scope,offline){
   return '<section class="tk-card rw-tusk-commerce"><div class="tk-sec"><b>'+esc(scope)+' · stay and package enquiry</b><p style="font-size:12px">'+(offline?'Live catalogue could not be checked.':'No matching direct-checkout listing was returned.')+' No payment is requested until a real offer is available.</p><a class="tk-chip" href="/escapes/?zone='+encodeURIComponent(scope)+'#request-quote">Request a quote</a></div></section>';
 }
 function cardsHTML(raw,intents){
   var scope=scopeFor(raw,intents),destinationGuide=!!(intents&&intents._rwAllowDestinationCommerce);
   var kind=category(raw);
   if(hidden()||scope===null||(intents&&(intents.smalltalk||intents._offers||intents._stayDesk||intents._noGenericActions&&!destinationGuide)))return Promise.resolve('');
   if(destinationGuide&&scope&&(!kind||kind==='stays'||kind==='packages')){
     if(!allowedQuery(String(raw).length<5?'Guide to '+raw:raw))return Promise.resolve('');
     return Promise.all([get('/stays/rates').catch(()=>null),get('/shop/catalogue').catch(()=>null)]).then(function(results){
       var data=results[0],shop=results[1];
       if(!data)return enquiry(scope,true)+(shop?railMarkup('shop',relatedShop(shop,scope)):'');
       var list=items('packages',data,raw,scope).concat(items('stays',data,raw,scope));
       return (list.length?railMarkup('destination',list):enquiry(scope,false))+(shop?railMarkup('shop',relatedShop(shop,scope)):'');
     }).catch(function(){return enquiry(scope,true);});
   }
   if(!kind)return Promise.resolve('');
   return dataFor(kind).then(function(d){var list=items(kind,d,raw,scope);return list.length?railMarkup(kind,list):scope&&(kind==='stays'||kind==='packages')?enquiry(scope,false):'';}).catch(function(){return '';});
 }
 function speakCardsInto(container,raw,intents){
   if(!container)return Promise.resolve();
   return cardsHTML(raw,intents).then(function(markup){
     if(!markup)return;
     var host=document.createElement('div');host.innerHTML=markup;
     while(host.firstChild)container.appendChild(host.firstChild);
   }).catch(function(){});
 }
 function el(tag,label,cls){var a=document.createElement(tag);if(label!=null)a.textContent=label;if(cls)a.className=cls;return a;}
 function field(form,label,name,type,required){
   var wrap=el('label',label);wrap.style.cssText='display:block;font-size:12px;margin:8px 0;color:#eedbfb';
   var input=el('input');input.name=name;input.type=type||'text';input.required=!!required;input.style.cssText='display:block;width:100%;box-sizing:border-box;padding:10px;border-radius:8px;background:#0e1020;color:#fff;border:1px solid #8577a2;margin-top:5px;font-size:16px';wrap.appendChild(input);form.appendChild(wrap);return input;
 }
 function select(form,label,name,options){
   var wrap=el('label',label);wrap.style.cssText='display:block;font-size:12px;margin:8px 0;color:#eedbfb';
   var sel=el('select');sel.name=name;sel.style.cssText='display:block;width:100%;padding:10px;border-radius:8px;background:#0e1020;color:#fff;border:1px solid #8577a2;margin-top:5px;font-size:16px';
   options.forEach(function(v){var o=el('option',v.label);o.value=v.id;sel.appendChild(o);});wrap.appendChild(sel);form.appendChild(wrap);return sel;
 }
 function modalHost(){
   if(modal&&modal.isConnected)return modal;
   modal=el('section');modal.id='rwTuskCheckout';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Review RoamWise checkout');
   modal.style.cssText='position:fixed;inset:0;z-index:2147483400;background:#03030cd9;padding:12px;overflow-y:auto;display:flex;align-items:flex-start;justify-content:center';
   var content=el('div');content.className='rw-tusk-checkout-panel';content.style.cssText='width:min(100%,500px);max-height:96dvh;overflow-y:auto;margin:2vh auto;background:#17152c;border:1px solid #8e6bbb;border-radius:20px;padding:18px;color:#f6efff;box-sizing:border-box';
   var close=el('button','Close ✕');close.type='button';close.style.cssText='float:right;padding:7px;border:1px solid #aaa;background:transparent;color:#fff;border-radius:8px';close.onclick=function(){modal.remove();state=null;};content.appendChild(close);
   var head=el('h2','Review before payment');head.style.cssText='font-size:18px;margin:5px 0 12px';content.appendChild(head);
   var area=el('div');area.className='rw-tusk-pay-fields';content.appendChild(area);
   var notice=el('p','Nothing is ordered or charged until you approve the verified amount.');notice.style.cssText='font-size:12px;color:#f4cb89';content.appendChild(notice);
   modal._body=area;modal._notice=notice;modal._head=head;modal.appendChild(content);document.body.appendChild(modal);
   modal.addEventListener('keydown',function(e){if(e.key==='Escape'){modal.remove();state=null;}});
   close.focus();return modal;
 }
 function say(s){if(modal&&modal._notice)modal._notice.textContent=s;}
 function markDirty(){if(!state)return;state.quote=null;if(state.pay)state.pay.disabled=true;say('Review the details, then request a fresh price.');}
 function setOptions(sel,opts){sel.replaceChildren();opts.forEach(function(x){var o=el('option',x.label);o.value=x.id;sel.appendChild(o);});}
 function formValues(){
   var f=state.form,v=function(n){return f.elements[n]?String(f.elements[n].value||'').trim():'';};
   if(state.kind==='shop')return {items:[{id:state.item.id,variant:v('variant'),qty:Number(v('qty'))}],pin:v('pin')};
   var b={checkin:v('checkin'),paymentType:v('paymentType'),rooms:1};
   if(state.kind==='package'){b.package=state.item.id;b.extraGuests=0;}
   else {b.stay=state.item.id;b.checkout=v('checkout');if(f.elements.room)b.room=v('room');if(f.elements.plan)b.plan=v('plan');b.extraBeds=0;}
   return b;
 }
 function makeForm(kind,item){
   var host=modalHost();host._body.replaceChildren();host._head.textContent='Ailon checkout · '+item.name;host._notice.textContent='Review a server quote first. The payment provider handles all card and UPI credentials.';
   var form=el('form');form.noValidate=false;state={kind:kind,item:item,form:form,quote:null,pay:null};
   var common=function(){field(form,'Email for receipt','email','email',true);field(form,'Phone (10–15 digits)','phone','tel',true);};
   if(kind==='shop'){
     select(form,'Variant','variant',(item.variants||[]).map(function(x){return x;}));
     var qty=field(form,'Quantity','qty','number',true);qty.value='1';qty.min='1';qty.max=String(item.maxQty||1);
     common();field(form,'Shipping address line 1','line1','text',true);field(form,'Address line 2 (optional)','line2','text',false);
     field(form,'City','city','text',true);field(form,'State','state','text',true);field(form,'6-digit PIN','pin','text',true);
     field(form,'Name for delivery','name','text',true);
   }else{
     var dt=field(form,'Check-in / package start date','checkin','date',true);dt.min=new Date().toISOString().slice(0,10);
     if(kind==='stay'){
       var end=field(form,'Check-out date','checkout','date',true);end.min=dt.min;
       if(item.kind==='amor'){
         select(form,'Room','room',Object.keys(item.rooms||{}).map(function(k){return {id:k,label:item.rooms[k].label||k};}));
         select(form,'Meals','plan',(item.plans||[]).map(function(p){return {id:p.id,label:p.label};}));
       }
     }
     select(form,'Payment','paymentType',[{id:'advance',label:'Advance (if available)'},{id:'full',label:'Pay full amount'}]);
     common();
     var consent=el('label');consent.style.cssText='display:flex;gap:8px;margin:9px 0;font-size:12px';var check=el('input');check.type='checkbox';check.name='shareWithSupplier';consent.appendChild(check);consent.appendChild(document.createTextNode('I agree that my contact details may be shared with the property to arrange this booking.'));form.appendChild(consent);
   }
   var quote=el('button','Get verified price');quote.type='button';quote.style.cssText='width:100%;padding:12px;background:#e5b775;color:#17152c;border:0;border-radius:10px;font-weight:bold;margin:12px 0 5px';
   var pay=el('button','Review price first');pay.type='button';pay.disabled=true;pay.style.cssText='width:100%;padding:12px;background:#66d6bd;color:#111;border:0;border-radius:10px;font-weight:bold;margin:6px 0';
   var details=el('p','', 'rw-tusk-checkout-summary');details.setAttribute('aria-live','polite');details.style.cssText='font-size:14px;line-height:1.5;color:#fff2cf';
   var link=el('a','Open full RoamWise checkout');link.href=kind==='shop'?'/shop/?buy='+encodeURIComponent(item.id):kind==='package'?'/packages/amor-checkout.html?package='+encodeURIComponent(item.id):'/packages/amor-checkout.html?stay='+encodeURIComponent(item.id);
   link.style.cssText='display:block;font-size:12px;color:#f6d49e;margin:10px 0';form.appendChild(quote);form.appendChild(details);form.appendChild(pay);form.appendChild(link);host._body.appendChild(form);state.pay=pay;state.details=details;
   // Contact and delivery-address edits do not change the server quote.
   // Re-quote only when price inputs change, to avoid needless repeat API calls.
   var pricingFields=kind==='shop'?['variant','qty','pin']:
     kind==='stay'?['checkin','checkout','paymentType','room','plan']:['checkin','paymentType'];
   ['input','change'].forEach(function(type){
     form.addEventListener(type,function(e){
       var name=e&&e.target&&e.target.name;
       if(pricingFields.indexOf(name)>-1)markDirty();
     });
   });
   quote.addEventListener('click',function(){doQuote();});
   pay.addEventListener('click',function(){doPay();});
 }
 function request(path,body){return fetch(API+path,{method:'POST',headers:{'content-type':'application/json'},credentials:'omit',referrerPolicy:'no-referrer',body:JSON.stringify(body)}).then(async function(r){var d=await r.json().catch(function(){return {};});if(!r.ok)throw Error(d.message||d.error||'Checkout unavailable');return d;});}
 function validForm(){if(!state)return false;var f=state.form;if(typeof f.reportValidity==='function'&&!f.reportValidity())return false;return true;}
 function readyToQuote(){
   if(!state)return false;
   var f=state.form.elements;
   if(state.kind==='shop'){
     var pin=String(f.pin.value||'').trim(),qty=Number(f.qty.value);
     if(!/^[1-9][0-9]{5}$/.test(pin)||!Number.isInteger(qty)||qty<1||qty>state.item.maxQty){
       say('Choose quantity and a valid six-digit shipping PIN to see the final price.');return false;
     }
     return true;
   }
   var dates=formValues();
   if(!/^\d{4}-\d{2}-\d{2}$/.test(dates.checkin)||dates.checkin<new Date().toISOString().slice(0,10)){
     say('Choose a valid future date for your quote.');return false;
   }
   if(state.kind==='stay'&&(!/^\d{4}-\d{2}-\d{2}$/.test(dates.checkout)||dates.checkout<=dates.checkin)){
     say('Check-out must be after check-in.');return false;
   }
   return true;
 }
 function doQuote(){
   if(!state||busy||state.paymentAttempted||!readyToQuote())return Promise.resolve();
   var cur=state;busy=true;cur.pay.disabled=true;say('Checking the final amount with RoamWise…');
   var b=formValues(),endpoint=cur.kind==='shop'?'/shop/quote':'/stays/quote';
   return request(endpoint,cur.kind==='shop'?b:b).then(function(d){
     if(state!==cur)return;
     var q=cur.kind==='shop'?d:d.quote;
     if(!q||!Number.isFinite(Number(cur.kind==='shop'?q.totalPaise:q.amount))||Number(cur.kind==='shop'?q.totalPaise:q.amount)<=0)throw Error('Invalid quote returned');
     if(cur.kind==='shop'&&(!q.methods||!q.methods.cashfree)){cur.quote=null;say('Cashfree is not enabled for this item. Use full shop checkout or enquiry.');return;}
     if(JSON.stringify(formValues())!==JSON.stringify(b)){markDirty();return;}
     cur.quote={expiresAt:Date.now()+5*60*1000,body:b,amount:cur.kind==='shop'?Number(q.totalPaise):Number(q.amount),data:q,signature:JSON.stringify(b)};
     var full=cur.kind==='shop'?rupees(q.totalPaise):money(q.amount);
     var total=cur.kind==='shop'?' (including '+rupees(q.shippingPaise)+' delivery)':' · total '+(q.total!=null?money(q.total):'to be confirmed');
     cur.details.textContent='Pay now '+full+total+'. Availability / supplier acceptance is not guaranteed by payment.';
     if(cur.kind!=='shop'&&q.fullOnly&&b.paymentType!=='full'){cur.quote=null;say('The property requires full payment for these dates. Choose full payment and request a new quote.');return;}
     cur.pay.textContent='Approve and pay '+full+' with Cashfree';cur.pay.disabled=false;say('Review the amount and terms. Nothing has been charged.');
   }).catch(function(e){if(state===cur){cur.quote=null;cur.details.textContent='';say(e.message||'Quote unavailable. No payment taken.');}})
    .finally(function(){busy=false;});
 }
 function loadSDK(){
   if(typeof root.Cashfree==='function')return Promise.resolve();
   return new Promise(function(resolve,reject){
     var s=document.createElement('script');s.src='https://sdk.cashfree.com/js/v3/cashfree.js';s.onload=resolve;s.onerror=function(){reject(Error('Payment window unavailable'));};document.head.appendChild(s);
   });
 }
 function checkStatus(cur,id,token){
   var url=cur.kind==='shop'?'/shop/order/'+encodeURIComponent(id)+'/status':'/stays/status/'+encodeURIComponent(id);
   return fetch(API+url,cur.kind==='shop'?{headers:{Authorization:'Bearer '+token},credentials:'omit'}:{credentials:'omit'})
     .then(function(r){if(!r.ok)throw Error('Status unavailable');return r.json();}).then(function(d){
       if(state!==cur)return;
       var paid=cur.kind==='shop'?d.status==='paid':(['paid_pending_confirmation','confirmed','paid'].includes(d.status));
       var confirmed=cur.kind==='shop'?paid:d.status==='confirmed';
       say((confirmed?'Payment verified and order confirmed. ':paid?'Payment verified; property confirmation pending. ':'Payment is not yet verified. Do not pay again. ')+'Reference: '+id);
     }).catch(function(){if(state===cur)say('Payment status unavailable. Do not pay again; contact RoamWise with reference '+id);});
 }
 function doPay(){
   if(!state||busy||state.paymentAttempted||!state.quote||!validForm())return Promise.resolve();
   var cur=state,b=formValues();
   if(Date.now()>=cur.quote.expiresAt||JSON.stringify(b)!==cur.quote.signature){markDirty();return Promise.resolve();}
   busy=true;cur.pay.disabled=true;say('Creating a secure Cashfree session…');
   var amount=cur.quote.amount, payload;
   if(cur.kind==='shop'){
     var f=cur.form.elements;
     payload={items:b.items,customer:{name:f.name.value.trim(),phone:f.phone.value.trim(),email:f.email.value.trim()},ship:{line1:f.line1.value.trim(),line2:f.line2.value.trim(),city:f.city.value.trim(),state:f.state.value.trim(),pin:b.pin},method:'cashfree'};
   }else{
     payload=Object.assign({},b,{email:cur.form.elements.email.value.trim(),phone:cur.form.elements.phone.value.trim(),shareWithSupplier:cur.form.elements.shareWithSupplier.checked});
   }
   payload.expectedAmountPaise=cur.kind==='shop'?amount:Math.round(amount*100);
   cur.paymentAttempted=true;
   return request(cur.kind==='shop'?'/shop/order':'/stays/checkout',payload).then(function(d){
     if(state!==cur)return;
     var sent=cur.kind==='shop'?Number(d.totalPaise):Number(d.quote&&d.quote.amount);
     if(sent!==amount){cur.quote=null;throw Error('The price changed. No checkout was opened. Request a fresh quote.');}
     var session=cur.kind==='shop'?d.payment_session_id:d.paymentSessionId;
     if(!session||!d.orderId)throw Error('Payment session missing. Check your order before retrying.');
     var id=String(d.orderId),token=String(d.token||'');
     cur.orderRef=id;
     var statusButton=el('button','Check payment status');statusButton.type='button';statusButton.onclick=function(){checkStatus(cur,id,token);};cur.form.appendChild(statusButton);
     if(cur.kind==='shop'&&token){try{localStorage.setItem('rwShopOrder.'+id,token);}catch(e){}}
     cur.details.textContent='Reference '+id+'. Cashfree securely handles the payment. Do not initiate a second charge until this order is checked.';
     say('Opening Cashfree secure payment window…');
     return loadSDK().then(function(){
       // Ailon's overlay normally has high z-index. Hide it so the official
       // Cashfree modal is never obscured by the review sheet.
       if(modal)modal.style.display='none';
       var gateway=root.Cashfree({mode:d.environment==='production'?'production':'sandbox'});
       return Promise.resolve(gateway.checkout({paymentSessionId:session,redirectTarget:'_modal'}))
         .then(function(){return checkStatus(cur,id,token);})
         .finally(function(){if(modal&&state===cur)modal.style.display='flex';});
     });
   }).catch(function(e){if(state===cur){say((e.message||'Checkout did not complete')+' Check the payment status before trying again.');}})
    .finally(function(){busy=false;});
 }
 function open(kind,id,prefill){
   if(!safeId.test(String(id||''))||!['shop','package','stay'].includes(kind))return Promise.resolve(false);
   var path=kind==='shop'?'/shop/catalogue':'/stays/rates';
   return get(path).then(function(data){
     var item;
     if(kind==='shop'){item=(data.products||[]).find(function(p){return p.id===id;});if(!data.checkoutOpen)return false;}
     else if(kind==='package')item=(data.packages||[]).find(function(p){return p.id===id&&p.open!==false;});
     else item=(data.stays||{})[id];
     if(!item)return false;
     makeForm(kind,item);
     if(prefill&&state&&state.form){
       var f=state.form.elements,now=new Date().toISOString().slice(0,10);
       if(f.checkin&&/^\d{4}-\d{2}-\d{2}$/.test(String(prefill.checkin||''))&&prefill.checkin>=now)f.checkin.value=prefill.checkin;
       if(f.checkout&&/^\d{4}-\d{2}-\d{2}$/.test(String(prefill.checkout||''))&&prefill.checkout>String(f.checkin&&f.checkin.value||''))f.checkout.value=prefill.checkout;
     }
     return true;
   }).catch(function(){return false;});
 }
 document.addEventListener('click',function(event){
   var buy=event.target.closest&&event.target.closest('[data-tusk-open]');
   if(buy){event.preventDefault();open(buy.getAttribute('data-tusk-open'),buy.getAttribute('data-tusk-id'),{
      checkin:buy.getAttribute('data-tusk-checkin'),checkout:buy.getAttribute('data-tusk-checkout')
     }).then(function(ok){if(!ok&&root.showToast)root.showToast('Checkout not available; use the official listing link.');});return;}
   var hide=event.target.closest&&event.target.closest('[data-tusk-hide-offers]');
   if(hide){try{localStorage.setItem('rw_tusk_offers','hide');}catch(e){};document.querySelectorAll('.rw-tusk-commerce').forEach(function(e){e.remove();});}
 });
 root.RWTuskCommerce={category:category,cardsHTML:cardsHTML,renderInto:speakCardsInto,open:open,resolveScope:function(raw){return scopeFor(raw,{});}};
})(window);
