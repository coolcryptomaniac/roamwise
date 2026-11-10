/* Ailon Tusk drop-in web widget: no keys, no customer data and no automatic charges.
   Usage: <script defer src="https://www.roamwise.co.in/embed/ailon-tusk.js"></script>
   Optional: <div data-ailon-tusk data-category="shop"></div>
*/
(function(){
 'use strict';
 var ROOT='https://www.roamwise.co.in';
 var PAGES={shop:'/shop/',stays:'/',packages:'/packages/',treks:'/treks/',pro:'/',music:'/music/store/'};
 function mount(el){
  if(el.dataset.ailonMounted)return;el.dataset.ailonMounted='1';
  var shadow=el.attachShadow({mode:'open'});
  var style=document.createElement('style');
  style.textContent=':host{display:block;font-family:system-ui,sans-serif;color:#F8F7FF}*{box-sizing:border-box}.panel{background:#111226;border:1px solid #7357F6;border-radius:18px;padding:16px;max-width:410px;box-shadow:0 12px 36px #0003}.head{display:flex;gap:10px;align-items:center;margin-bottom:12px}.orb{background:linear-gradient(135deg,#7357F6,#3478F6);border-radius:13px;padding:10px;font-size:20px}.name{font-weight:750}.sub{color:#C8C4DF;font-size:12px}.tabs{display:flex;gap:7px;overflow-x:auto;padding:4px 0 12px}.tab{background:#1C1C38;color:#F8F7FF;border:1px solid #3E3A67;border-radius:99px;padding:8px 11px;white-space:nowrap;cursor:pointer}.tab[aria-pressed=true]{border-color:#D9AA55;color:#F4D99C}.body{font-size:14px;line-height:1.5;margin-bottom:12px}.cta{display:block;text-align:center;text-decoration:none;background:#7357F6;color:white;border-radius:12px;padding:13px;font-weight:700;min-height:44px}.note{font-size:11px;color:#C8C4DF;margin-top:10px}button:focus-visible,a:focus-visible{outline:3px solid #D9AA55;outline-offset:2px}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}';
  shadow.appendChild(style);
  var panel=document.createElement('section');panel.className='panel';panel.setAttribute('aria-label','Ailon Tusk by RoamWise');
  var head=document.createElement('div');head.className='head';head.innerHTML='<span class="orb" aria-hidden="true">✦</span><span><span class="name">Ailon Tusk</span><span class="sub" style="display:block">RoamWise · Explore and book</span></span>';panel.appendChild(head);
  var tabs=document.createElement('div');tabs.className='tabs';tabs.setAttribute('aria-label','RoamWise categories');
  var body=document.createElement('p');body.className='body';
  var cta=document.createElement('a');cta.className='cta';cta.rel='noopener noreferrer';cta.target='_blank';
  var note=document.createElement('p');note.className='note';note.textContent='Price, availability and payment are verified on RoamWise checkout. No purchase occurs inside this widget.';
  panel.append(tabs,body,cta,note);shadow.appendChild(panel);
  var names={shop:'Shop',stays:'Stays',packages:'Packages',treks:'Treks',pro:'Pro',music:'Music'};
  var selected=Object.hasOwn(PAGES,el.dataset.category)?el.dataset.category:'shop';
  function render(){
   tabs.replaceChildren();
   Object.keys(PAGES).forEach(function(k){var b=document.createElement('button');b.type='button';b.className='tab';b.textContent=names[k];b.setAttribute('aria-pressed',String(k===selected));b.onclick=function(){selected=k;render();};tabs.appendChild(b);});
   body.textContent='Explore '+names[selected].toLowerCase()+' on RoamWise. Select an offer and review its final price before paying.';
   cta.textContent='Explore '+names[selected]+' on RoamWise';
   var itemId=(el.dataset.itemId||'').trim();
   var direct=selected==='shop'&&/^[a-z0-9-]{1,60}$/.test(itemId);
   cta.href=ROOT+PAGES[selected]+(direct?'?buy='+encodeURIComponent(itemId):'');
   if(direct){cta.textContent='Buy now · review and pay';body.textContent='Open the selected RoamWise item checkout in one tap. Confirm your delivery details and server-verified total before authorizing payment.';}
  }
  render();
 }
 function init(){document.querySelectorAll('[data-ailon-tusk]').forEach(mount);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.AilonTuskEmbed={mount:mount};
})();
