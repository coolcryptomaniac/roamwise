/* RoamWise destination discovery — progressive swipe rail, no external image-generation calls.
 * Every destination comes from the local reviewed/curated DB; media is opt-in
 * by exact destination slug, never inferred from a neighbouring destination.
 * No fake inventory: Find stays opens an enquiry/search, not a checkout.
 */
(function(root){
 'use strict';
 var PER_PAGE=12, queued=false, index=0, places=[];
 var LOCAL=[
   {id:'almora',name:'Almora',country:'India'},
   {id:'kasar-devi',name:'Kasar Devi',country:'India'},
   {id:'nainital',name:'Nainital',country:'India'},
   {id:'ranikhet',name:'Ranikhet',country:'India'},
   {id:'kausani',name:'Kausani',country:'India'},
   {id:'bhimtal',name:'Bhimtal',country:'India'}
 ];
 var PHOTO={
   almora:{src:'/assets/property-photos/milan-heights-front.jpg',note:'RoamWise partner-stay photo'},
   manali:{src:'/assets/property-photos/new-himank-room.webp',note:'RoamWise partner-stay photo'}
 };
 function el(tag,klass,txt){var n=document.createElement(tag);if(klass)n.className=klass;if(txt!=null)n.textContent=txt;return n;}
 function clean(s){return String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
 function safeMedia(entry){
   var mediaIndex=/** @type {any} */ (root).RW_DEST_MEDIA;
   var candidate=mediaIndex && mediaIndex[entry.id];
   var trusted=candidate && candidate.status==='published'
     && ['owned','licensed','public-domain'].indexOf(candidate.rightsStatus)!==-1
     && typeof candidate.licenseProof==='string' && candidate.licenseProof.length>=12;
   var m=trusted?candidate:PHOTO[entry.id];
   if(!m||!m.src)return null;
   var src=String(m.src||'');
   if((src.startsWith('/assets/')||src.startsWith('/media/'))
     && !src.includes('..') && !src.includes('//') && !/[?#\\]/.test(src))
     return {src:src,note:String(m.note||'Curated travel image'),alt:String(m.alt||entry.name)};
   if(/^https:\/\/assets\.roamwise\.co\.in\/media\/[a-zA-Z0-9_./%-]+$/.test(src)
     && !src.includes('..'))
     return {src:src,note:String(m.note||'Curated travel image'),alt:String(m.alt||entry.name)};
   return null;
 }
 function uniqueDestinations(data){
   var seen={},out=[];
   (Array.isArray(data)?data:[]).forEach(function(d){
     var name=String(d&&d.name||'').trim(),country=String(d&&d.country||'').trim();
     var id=clean(d&&d.id||name);
     if(!name||!id||seen[id])return;
     seen[id]=1;out.push({id:id,name:name,country:country});
   });
   return out;
 }
 function drawFallback(media,place,label){
   media.className='rw-destination-photo rw-photo-fallback';
   while(media.firstChild)media.removeChild(media.firstChild);
   media.appendChild(el('span','rw-destination-mark',place.name.slice(0,1).toUpperCase()));
   media.appendChild(el('span','rw-destination-credit',label));
 }
 function renderPhoto(media,place){
   var found=safeMedia(place);
   if(!found)return drawFallback(media,place,'Photo pending · destination guide available');
   media.className='rw-destination-photo';
   while(media.firstChild)media.removeChild(media.firstChild);
   var img=el('img');img.src=found.src;img.loading='lazy';img.decoding='async';
   img.alt=place.name+' — '+found.alt;
   img.addEventListener('error',function(){drawFallback(media,place,'Photo unavailable · explore the destination');});
   media.appendChild(img);
   media.appendChild(el('span','rw-destination-credit',found.note));
 }
 function card(place){
   var article=el('article','rw-destination-card');
   article.setAttribute('aria-label','Explore '+place.name);
   article.setAttribute('data-rw-destination-id',place.id);
   var media=el('div','rw-destination-photo');article.appendChild(media);
   renderPhoto(media,place);
   var body=el('div','rw-destination-content');article.appendChild(body);
   body.appendChild(el('strong','',place.name));
   body.appendChild(el('small','',place.country||'Explore the destination'));
   var actions=el('div','rw-destination-actions');body.appendChild(actions);
   var plan=el('button','rw-dest-plan','Plan trip');
   plan.type='button';plan.setAttribute('aria-label','Ask Ailon Tusk to plan '+place.name);
   plan.addEventListener('click',function(){
     var field=/** @type {HTMLTextAreaElement|null} */ (document.getElementById('heroInput'));
     var hero=document.getElementById('copilotHero');
     if(field && typeof root.copilotSend==='function'){
       field.value='Plan a trip to '+place.name+(place.country?', '+place.country:'');
       if(hero)hero.scrollIntoView({behavior:root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
       root.copilotSend(true);
     }else root.location.href='/?tusk='+encodeURIComponent('Plan a trip to '+place.name);
   });
   actions.appendChild(plan);
   var stays=el('a','rw-dest-stays','Find stays');
   stays.href='/partner/?role=customer&destination='+encodeURIComponent(place.name);
   stays.setAttribute('aria-label','Search stays or enquire in '+place.name);
   actions.appendChild(stays);
   return article;
 }
 function init(){
   var rootNode=document.getElementById('rwDestinationsRail'),track=document.getElementById('rwDestinationTrack');
   if(!rootNode||!track||rootNode.dataset.ready==='1')return;
   rootNode.dataset.ready='1';
   places=uniqueDestinations(LOCAL.concat(typeof DB!=='undefined'?DB:[]));
   var status=document.getElementById('rwDestinationCount');
   if(!places.length){rootNode.hidden=true;return;}
   function append(){
     var frag=document.createDocumentFragment();
     places.slice(index,index+PER_PAGE).forEach(function(d){frag.appendChild(card(d));});
     index=Math.min(places.length,index+PER_PAGE);track.appendChild(frag);
     if(status)status.textContent=index+' of '+places.length+' destinations';
   }
   append();
   function maybeLoad(){
     queued=false;
     if(index<places.length && track.scrollLeft+track.clientWidth >= track.scrollWidth-750)append();
   }
   track.addEventListener('scroll',function(){
     if(queued)return;queued=true;
     if(typeof root.requestAnimationFrame==='function')root.requestAnimationFrame(maybeLoad);
     else maybeLoad();
   },{passive:true});
   var prev=document.getElementById('rwDestinationPrev'),next=document.getElementById('rwDestinationNext');
   function move(direction){
     if(direction>0 && index<places.length && track.scrollLeft+2*track.clientWidth>=track.scrollWidth)append();
     track.scrollBy({left:direction*Math.max(200,track.clientWidth*.8),behavior:root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
   }
   if(prev)prev.addEventListener('click',function(){move(-1)});
   if(next)next.addEventListener('click',function(){move(1)});
   if(typeof root.addEventListener==='function')root.addEventListener('rw:destination-media-ready',function(){
     /* Review-approved R2 media may arrive after first paint; preserve scroll. */
     places.forEach(function(place){
       var item=track.querySelector('[data-rw-destination-id="'+place.id+'"]');
       if(item){var media=item.querySelector('.rw-destination-photo');if(media)renderPhoto(media,place);}
     });
   });
 }
 /* defer scripts can execute with document.readyState === 'interactive' while
    later deferred destination data scripts have NOT executed yet. DOMContentLoaded
    fires after all deferred scripts, so wait unless loading is fully complete. */
 if(document.readyState==='complete')init();
 else document.addEventListener('DOMContentLoaded',init,{once:true});
})(window);
