/* Ailon-inspired product discovery; never authorizes orders or promises inventory. */
(function(){
 'use strict';
 const root=document.getElementById('merch-studio');
 if(!root || !Array.isArray(window.RWShopCatalog)) return;
 const $=id=>document.getElementById(id);
 const products=window.RWShopCatalog;
 const cards=$('merch-cards');
 const field=$('merch-query');
 let selected=null;
 let visible=[];
 const clean=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g,' ').trim();
 function score(p,q){
   if(!q) return p.id.indexOf('rave-rise-buransh')===0?100:(p.live?50:10);
   const tokens=clean(q).split(/\s+/).filter(Boolean);
   const hay=clean([p.id,p.name,p.type,p.description,p.category,p.motif].join(' '));
   let rank=0; for(const word of tokens) {
     if(word.length<2)continue;
     const aliases={tshirt:'tee',tshirts:'tee',shirts:'tee',kumaoni:'kumaon',tshirtoversized:'tee',buransh:'buransh'};
     const term=aliases[word]||word;
     if(hay.includes(term))rank+=15;
   }
   if(p.id.indexOf('rave-rise-buransh')===0)rank+=2;
   return rank;
 }
 function render(q){
   let ranked=products.map((p,i)=>({p,i,s:score(p,q)}));
   if(clean(q)) ranked=ranked.filter(x=>x.s>0);
   ranked.sort((a,b)=>b.s-a.s||a.i-b.i);
   visible=ranked.slice(0,12).map(x=>x.p);
   cards.replaceChildren();
   if(!visible.length){
     const empty=document.createElement('p'); empty.textContent='No matching original designs yet. Try “Rave”, “Kumaon”, “hoodie” or “tee”.';
     empty.className='merch-description';cards.append(empty);
   }
   visible.forEach(p=>{
     const card=document.createElement('article'); card.className='merch-card';card.dataset.live=String(!!p.live);card.dataset.id=p.id;
     const media=document.createElement('div');media.className='merch-media';
     if(p.image && (/^\/shop\/img\/[a-z0-9-]+\.(?:svg|webp|png|jpg)$/.test(p.image))){
       const img=document.createElement('img');img.src=p.image;img.alt=p.alt||p.name+' artwork';img.loading='lazy';media.append(img);
     }else{const alt=document.createElement('span');alt.textContent=p.motif||'ROAMWISE';alt.style.cssText='color:#f2dec0;font-weight:850;letter-spacing:2px;text-align:center;padding:30px';media.append(alt);}
     const chip=document.createElement('span');chip.className='merch-chip';chip.textContent=p.live?'Listed product':'Original design preview';media.append(chip);
     const copy=document.createElement('div');copy.className='merch-copy';
     const kind=document.createElement('p');kind.className='merch-kind';kind.textContent=p.type||'RoamWise original';
     const title=document.createElement('h4');title.textContent=p.name;
     const desc=document.createElement('p');desc.className='merch-description';desc.textContent=p.description||'Original RoamWise apparel concept';
     const price=document.createElement('div');price.className='merch-price';price.textContent=p.live&&p.price?p.price:'Price pending';
     const detail=document.createElement('small');detail.textContent=p.live?'Listed rate · final total at checkout':'No confirmed supplier price or stock';price.append(detail);
     copy.append(kind,title,desc,price);
     const pick=document.createElement('button');pick.type='button';pick.className='merch-pick';pick.textContent=selected&&p.id===selected.id?'✓ Selected':'Select design';pick.setAttribute('aria-pressed',String(!!selected&&p.id===selected.id));
     pick.addEventListener('click',()=>select(p));
     card.append(media,copy,pick);cards.append(card);
   });
   $('merch-count').textContent=visible.length?visible.length+' original designs to explore · swipe for more':'No matches';
   if(!selected||!visible.some(p=>p.id===selected.id)) select(visible[0]||null);
   else updateSelection();
 }
 function select(p){selected=p;updateSelection();}
 function updateSelection(){
   cards.querySelectorAll('.merch-card').forEach(el=>{
     const active=!!selected&&el.dataset.id===selected.id;
     el.classList.toggle('is-selected',active);
     const btn=el.querySelector('.merch-pick');btn.setAttribute('aria-pressed',String(active));btn.textContent=active?'✓ Selected':'Select design';
   });
   $('merch-selected-name').textContent=selected?selected.name:'Choose a product';
   $('merch-selected-note').textContent=!selected?'No selection':
     selected.live?'Payment terms and final amount are shown at checkout.':'Unapproved design · enquiry only · no payment';
   const action=$('merch-action');action.disabled=!selected;action.textContent=!selected?'Select a design':selected.live?'View buying options':'Enquire about design';
 }
 function go(){
   if(!selected)return;
   if(!/^[a-z0-9-]+$/.test(selected.id))return;
   if(selected.live){
     const buy=document.querySelector('[data-buy="'+selected.id+'"]');
     if(buy){buy.scrollIntoView({behavior:'smooth',block:'center'});buy.click();return;}
     if(selected.href&&selected.href.startsWith('#')){document.getElementById(selected.href.slice(1))?.scrollIntoView({behavior:'smooth'});return;}
   }
   const article=Array.from(document.querySelectorAll('#products [data-product-id]')).find(x=>x.dataset.productId===selected.id);
   const button=article&&article.querySelector('button');
   if(button){button.click();return;}
   document.getElementById('collection')?.scrollIntoView({behavior:'smooth'});
 }
 $('merch-search').addEventListener('submit',event=>{event.preventDefault();render(field.value);cards.scrollTo({left:0,behavior:'smooth'});});
 root.querySelectorAll('[data-merch-suggest]').forEach(button=>button.addEventListener('click',()=>{
   field.value=button.dataset.merchSuggest;
   render(field.value);cards.scrollTo({left:0,behavior:'smooth'});
 }));
 $('merch-prev').addEventListener('click',()=>cards.scrollBy({left:-Math.max(260,cards.clientWidth*.7),behavior:'smooth'}));
 $('merch-next').addEventListener('click',()=>cards.scrollBy({left:Math.max(260,cards.clientWidth*.7),behavior:'smooth'}));
 $('merch-action').addEventListener('click',go);
 const mic=$('merch-mic'),Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Recognition){mic.disabled=true;mic.title='Voice product search is not supported by this browser';}
 else mic.addEventListener('click',()=>{
   try{
     const recognition=new Recognition();recognition.lang=(navigator.language||'en-IN').startsWith('hi')?'hi-IN':'en-IN';
     recognition.interimResults=false;recognition.maxAlternatives=1;
     recognition.onresult=event=>{field.value=String(event.results?.[0]?.[0]?.transcript||'');render(field.value);};
     recognition.onerror=()=>{$('merch-count').textContent='Could not hear clearly. Please type your request.';};
     recognition.start();
   }catch(_){$('merch-count').textContent='Voice search unavailable. You can type your request.';}
 });
 window.addEventListener('rw-shop-catalogue-updated',()=>render(field.value));
 render('');
})();
