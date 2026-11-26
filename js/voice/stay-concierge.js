// @ts-nocheck
/* Deterministic voice stay concierge. Only reads the public rate book and quote
   endpoint. Explicit selection hands off to checkout; no order or debit API here. */
(function(root){
 'use strict';
 var API='https://roamwise-api.founder-f53.workers.dev',session=null,turn=0;
 var esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 var money=n=>'₹'+Number(n).toLocaleString('en-IN',{maximumFractionDigits:2});
 function reset(){session=null;turn++;}
 function normal(raw){var numbers={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};return String(raw||'').toLowerCase().replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/g,w=>numbers[w]);}
 function budget(raw){var m=normal(raw).match(/(?:under|within|budget(?:\s+of)?|below|less than|अंदर|बजट)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)\s*(k|thousand|हजार)?/i);return m?Number(m[1].replace(/,/g,''))*(m[2]?1000:1):null;}
 function dates(raw){
   var iso=String(raw).match(/\b20\d{2}-\d{2}-\d{2}\b/g);
   if(iso&&iso.length===2&&iso.every(d=>!Number.isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d)&&iso[1]>iso[0])return {checkIn:iso[0],checkOut:iso[1]};
   return typeof root.rwSdParseDates==='function'?root.rwSdParseDates(normal(raw)):null;
 }
 function scope(raw){return root.RWTuskCommerce&&root.RWTuskCommerce.resolveScope?root.RWTuskCommerce.resolveScope(raw):'';}
 function href(item,s){return '/packages/amor-checkout.html?'+new URLSearchParams({stay:item.id,checkin:s.dates.checkIn,checkout:s.dates.checkOut,paymentType:'full',...(item.room?{room:item.room,plan:item.plan}:{})}).toString();}
 function msg(text,extra){return '<section class="rw-voice-stay tk-card"><div class="tk-sec"><b>Stay booking with Ailon</b><p>'+esc(text)+'</p>'+(extra||'')+'</div></section>';}
 function command(text,label){return '<button type="button" class="tk-chip" data-rw-voice-stay="'+esc(text)+'">'+esc(label||text)+'</button>';}
 function answer(reply,raw,text,extra){reply(msg(text,extra),{_voiceStay:true,_voiceStaySpeech:text,_noGenericActions:true,_stayDesk:true,dest:session&&session.destination||''},raw);}
 async function fetchJSON(path,body){
   var controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
   try{var r=await fetch(API+path,{method:body?'POST':'GET',headers:body?{'content-type':'application/json'}:{},credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal,...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error('unavailable');return await r.json();}finally{clearTimeout(timer);}
 }
 function matchPlace(s,destination){var norm=x=>' '+String(x||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()+' ';return norm(s.name+' '+s.place).includes(norm(destination));}
 async function options(s){
   var data=await fetchJSON('/stays/rates'),stays=data.stays||{},jobs=[];
   Object.keys(stays).filter(id=>/^[a-z0-9-]{1,80}$/.test(id)&&matchPlace(stays[id],s.destination)).slice(0,10).forEach(function(id){
     var p=stays[id];
     if(p.kind==='amor'){
       // One standard room, up to two guests. Larger groups need room selection at checkout.
       Object.keys(p.rooms||{}).slice(0,3).forEach(function(room){
         var plans=Object.keys(p.rooms[room].perNight||{}),plan=plans.sort((a,b)=>p.rooms[room].perNight[a]-p.rooms[room].perNight[b])[0];
         if(plan&&Number(p.rooms[room].guests)>=s.guests)jobs.push({id,name:p.name,room,plan,roomName:p.rooms[room].label||room});
       });
     }else jobs.push({id,name:p.name});
   });
   var settled=await Promise.allSettled(jobs.slice(0,12).map(async item=>{
     var body={stay:item.id,checkin:s.dates.checkIn,checkout:s.dates.checkOut,paymentType:'full',rooms:1,extraBeds:0,...(item.room?{room:item.room,plan:item.plan}:{})};
     var result=await fetchJSON('/stays/quote',body),q=result.quote;
     if(!q||q.stay!==item.id||q.checkin!==s.dates.checkIn||q.checkout!==s.dates.checkOut||!Number.isFinite(q.total)||q.total<=0||q.kind==='advance')return null;
     if(s.budget&&q.total>s.budget)return null;
     return {...item,quote:q};
   }));
   return {items:settled.filter(x=>x.status==='fulfilled'&&x.value).map(x=>x.value).sort((a,b)=>a.quote.total-b.quote.total).slice(0,3),found:jobs.length,failed:settled.some(x=>x.status==='rejected')};
 }
 function accept(raw,reply,voice){
   var text=normal(raw),initial=/\b(book|reserve|find|need|looking for)\b/.test(text)&&/\b(stay|hotel|room|homestay|resort|cottage|villa)\b/.test(text);
   if(!session&&!(voice&&initial))return false;
   if(session&&Date.now()-session.at>5*60*1000){reset();answer(reply,raw,'This booking conversation expired. Please start again with your destination and dates.');return true;}
   if(/^(?:cancel|stop|never mind|cancel booking|रद्द|रहने दो)[.! ]*$/.test(text)){reset();answer(reply,raw,'Stopped this booking search. No payment was made.');return true;}
   // Never consume a new unrelated request as booking consent.
   if(!initial&&!session)return false;
   if(initial){reset();session={destination:scope(raw)||'',dates:dates(raw),budget:budget(raw),guests:null,items:[],selected:null,at:Date.now(),phase:'details'};}
   var s=session;
   if(!s)return false;
   if(s.phase==='select'){
     var selection=text.match(/^(?:choose |select |option |choose option |select option )?([1-3])[.! ]*$/);
     if(selection&&s.items[+selection[1]-1]){
       s.selected=s.items[+selection[1]-1];s.phase='confirm';
       answer(reply,raw,s.selected.name+(s.selected.roomName?', '+s.selected.roomName:'')+', '+s.dates.checkIn+' to '+s.dates.checkOut+', '+s.guests+' guests. Quoted total '+money(s.selected.quote.total)+'. Say “confirm selection” to continue to secure checkout. No money has been deducted.',command('confirm selection','Confirm selection')+command('cancel','Cancel'));return true;
     }
   }
   if(s.phase==='confirm'&&/^(?:confirm selection|confirm this option|continue to checkout|चयन की पुष्टि)[.! ]*$/.test(text)){
     var item=s.selected; s.phase='handoff';
     answer(reply,raw,'Your selection is ready. Continue using the Cashfree checkout link below. Wallet credit can be reviewed in your wallet. Voice will not deduct money. The property must confirm the stay after payment.',
       '<a class="tk-chip gold" href="'+esc(href(item,s))+'">Continue with Cashfree →</a> <a class="tk-chip" href="/wallet/">Open wallet</a>');return true;
   }
   if(s.phase==='confirm'||s.phase==='handoff'||s.phase==='select'){
     answer(reply,raw,s.phase==='select'?'Say “option 1”, “option 2” or “option 3” to choose one of the displayed stays.':s.phase==='confirm'?'Say “confirm selection” to continue, or “cancel” to stop. No money has been deducted.':'Use the checkout link to review and pay. No payment was made by voice.',s.phase==='handoff'?'<a class="tk-chip gold" href="'+esc(href(s.selected,s))+'">Continue with Cashfree →</a>':command('cancel','Cancel'));return true;
   }
   if(s.phase==='loading'){answer(reply,raw,'I am still checking the property quotes. No payment has been made.');return true;}
   if(!s.destination)s.destination=scope(raw)||'';
   var d=dates(raw);if(d)s.dates=d;
   var g=text.match(/\b([1-9]\d?)\s*(?:guests?|people|adults?|travellers?|travelers?)\b/);if(g)s.guests=Number(g[1]);
   var b=budget(raw);if(b)s.budget=b;
   if(!s.destination){answer(reply,raw,'Which destination would you like to stay in?');return true;}
   if(!s.dates||s.dates.checkIn<new Date().toISOString().slice(0,10)){answer(reply,raw,'What are your check-in and check-out dates for '+s.destination+'? For example, 12 to 14 December. Please give the dates even if you mentioned a number of days.');return true;}
   if(!s.guests){answer(reply,raw,'How many guests are travelling? For example, “2 guests”.');return true;}
   if(s.guests>2){answer(reply,raw,'For '+s.guests+' guests, please choose the number of rooms and occupancy in the stays directory so the price fits your group.', '<a class="tk-chip" href="/partner/index.html?role=customer&amp;destination='+encodeURIComponent(s.destination)+'">Choose rooms for your group →</a>');reset();return true;}
   if(!s.budget){answer(reply,raw,'What is your total stay budget? For example, “under 5k”.');return true;}
   s.phase='loading';var expected=++turn;
   options(s).then(function(result){
     if(session!==s||turn!==expected)return;
     s.items=result.items;s.at=Date.now();
     if(!s.items.length){
       var message=result.failed?'I could not verify a complete quote.':result.found?'I found properties, but no confirmed full-price quote within '+money(s.budget)+'. A refundable advance is not the full stay price.':'There is no direct-checkout property in '+s.destination+' in the current catalogue.';
       answer(reply,raw,message+' You can request a quote. No payment has been taken.','<a class="tk-chip" href="/escapes/?zone='+encodeURIComponent(s.destination)+'&amp;start='+s.dates.checkIn+'&amp;end='+s.dates.checkOut+'&amp;guests='+s.guests+'#request-quote">Request dates & quote →</a>');reset();return;
     }
     s.phase='select';var descriptions=s.items.map((x,i)=>'Option '+(i+1)+': '+x.name+(x.roomName?', '+x.roomName:'')+', '+money(x.quote.total)+' total.').join(' ');
     answer(reply,raw,descriptions+' These are server price quotes, subject to property confirmation. Which option would you like?',s.items.map((x,i)=>command('option '+(i+1),'Choose option '+(i+1))).join(''));
   }).catch(function(){if(session===s&&turn===expected){answer(reply,raw,'The live rate book could not be checked. Open the stays collection to continue. No payment has been taken.','<a class="tk-chip" href="/?rw_open=stays">Browse stays →</a>');reset();}});
   return true;
 }
 document.addEventListener('click',function(event){var b=event.target.closest&&event.target.closest('[data-rw-voice-stay]');if(!b)return;event.preventDefault();var text=b.getAttribute('data-rw-voice-stay');if(root.RWTuskVoiceStudio&&root.RWTuskVoiceStudio.state.active)root.RWTuskVoiceStudio.transcript(text);if(typeof root.copilotSend==='function')root.copilotSend(true,text);});
 root.RWVoiceStayBooking={accept:accept,reset:reset,budget:budget,dates:dates};
})(window);
