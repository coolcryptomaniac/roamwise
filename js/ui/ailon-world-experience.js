/* RoamWise integrated worldwide atlas search and category/itinerary visuals.
   Canonical destination rail and AI settings owned by PR #856.
   No duplicate rail; never mutates bookings, prices, payments or keys. */
(function () {
  'use strict';
  const W = /** @type {any} */ (window);
  const bodyReady = fn => document.readyState === 'complete'
    ? fn() : document.addEventListener('DOMContentLoaded', fn, { once: true });
  const clean = value => String(value || '').trim().slice(0, 140);
  const KEY = 'rw_ailon_itinerary_view';
  const modes = [
    ['editorial', 'Black & white'], ['cinematic', 'Cinematic'],
    ['cards', 'Cards'], ['map', 'Map']
  ];
  const gradient = ['#23374a', '#352c58', '#423245', '#245151', '#55412f'];
  function destinationPool() {
    const source = Array.isArray(W.DB) ? W.DB : (typeof DB !== 'undefined' && Array.isArray(DB) ? DB : []);
    const seen = new Set(), india = [], world = [];
    for (const d of source) {
      const name = clean(d.name), country = clean(d.country);
      if (!name || !country) continue;
      const id = (name + '|' + country).toLocaleLowerCase('en');
      if (seen.has(id)) continue;
      seen.add(id);
      const item = { name, country, id: clean(d.id) || id, tag: clean((d.tags || [])[0] || 'Explore') };
      (country === 'India' ? india : world).push(item);
    }
    // Preserve broad geographic variety rather than repeating the last searched place.
    const output = [];
    while ((india.length || world.length) && output.length < 96) {
      if (india.length) output.push(india.shift());
      if (world.length) output.push(world.shift());
      if (world.length) output.push(world.shift());
    }
    return output;
  }
  function make(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  let destinations = [];
  function plan(d) {
    const existing = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('heroInput'));
    if (!existing) { location.href = '/?rw_open=itineraries'; return; }
    if (existing.value.trim()) {
      existing.focus();
      if (typeof W.showToast === 'function') W.showToast('Finish or clear your existing Ailon draft before planning a new place.');
      return;
    }
    if (typeof W.tabGo === 'function') { try { W.tabGo('home'); } catch (_) {} }
    existing.value = 'Plan a trip to ' + d.name + ', ' + (d.region || d.country) + '. Ask for my dates, guests and budget, then show a day-by-day itinerary and available RoamWise stays without assuming prices or availability.';
    existing.dispatchEvent(new Event('input', { bubbles: true }));
    existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
    existing.focus();
    // User taps Send; opening a destination never silently submits a query or books.
  }
  function visibleStayCount(d) {
    // The worldwide atlas contains place identities, not approved supplier links.
    if(d.fromAtlas)return 0;
    const records = Array.isArray(W.RW_PARTNER_SEED) ? W.RW_PARTNER_SEED : [];
    const norm = v => clean(v).toLocaleLowerCase('en').replace(/[^a-z0-9]/g, '');
    return records.filter(p => p && p.cat === 'stay' &&
      norm(p.zone) === norm(d.name) &&
      typeof W.rwStayPublicEligible === 'function' && W.rwStayPublicEligible(p)).length;
  }
  function staysURL(d) {
    return '/escapes/?' + new URLSearchParams({ zone: d.name }).toString() + '#request-quote';
  }
  function chooser(d) {
    let ov = document.getElementById('rwWorldChoice');
    if (!ov) {
      ov = make('div', 'rw-world-choice');
      ov.id = 'rwWorldChoice';
      ov.setAttribute('role', 'dialog');
      ov.setAttribute('aria-modal', 'true');
      ov.setAttribute('aria-label', 'Choose how to explore a destination');
      ov.hidden = true;
      document.body.appendChild(ov);
      ov.addEventListener('click', e => { if (e.target === ov) close(); });
      ov.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }
    function close() { ov.hidden = true; ov.replaceChildren(); }
    const pane = make('div', 'rw-world-choice-panel');
    const closeButton = make('button', 'rw-world-close', '✕');
    closeButton.type = 'button'; closeButton.setAttribute('aria-label', 'Close destination choices');
    closeButton.addEventListener('click', close);
    const head = make('h3', '', d.name + ', ' + (d.region || d.country));
    const count = visibleStayCount(d);
    const sub = make('p', '', count
      ? count + ' RoamWise partner listing' + (count===1?'':'s') + ' found for this place. Prices and availability require confirmation.'
      : 'No verified RoamWise stay is listed for this place in the public seed yet. You can still request help finding accommodation.');
    const actions = make('div', 'rw-world-choice-actions');
    const planButton = make('button', '', '✦ Plan with Ailon');
    planButton.type = 'button'; planButton.addEventListener('click', () => {close();plan(d);});
    const browse = make('a', '', count ? '⌂ Request stay quote' : '⌂ Ask about stays'); browse.href = staysURL(d);
    actions.append(planButton, browse); pane.append(closeButton, head, sub, actions);
    ov.replaceChildren(pane); ov.hidden = false; closeButton.focus();
  }
  /* Full atlas search is deliberate and on-demand. The 34k-city source is
     geography, not verified hotel inventory or permanently current advice. */
  async function searchAtlas(query, suppliedAtlas) {
    const raw=clean(query);
    if(raw.length<2)return {status:'short',matches:[]};
    const a=suppliedAtlas||W.RW_ATLAS;
    if(!a||typeof a.find!=='function')return {status:'unavailable',matches:[]};
    try{
      if(a._state && !a._state.ready && typeof a.loadAll==='function')
        await a.loadAll();
      const result=a.find(raw);
      if(!result || !result.ready)return {status:'unavailable',matches:[]};
      if(!result.best)return {status:'not-found',matches:[]};
      const items=(result.ambiguous ? result.matches : [result.best]).slice(0,6);
      const seen=new Set();
      const matches=[];
      for(const r of items){
        const name=clean(r.name),country=clean(r.country),region=clean(r.where||r.state||'');
        if(!name || !country)continue;
        const id=(name+'|'+region+'|'+country).toLocaleLowerCase('en');
        if(seen.has(id))continue;
        seen.add(id);
        matches.push({id,name,country,region,tag:clean(r.label||'Place'),fromAtlas:true});
      }
      return {status:result.ambiguous?'ambiguous':'matched',matches};
    }catch(_){return {status:'unavailable',matches:[]};}
  }
  function worldSearchControl(){
    const form=make('form','rw-world-search');
    form.setAttribute('role','search');
    const searchInput=/** @type {HTMLInputElement} */ (make('input',''));
    searchInput.type='search';searchInput.name='place';searchInput.maxLength=90;
    searchInput.placeholder='Find any city, region or country…';
    searchInput.setAttribute('aria-label','Find a destination in the world atlas');
    const submit=/** @type {HTMLButtonElement} */ (make('button','','Find place'));
    submit.type='submit';
    const status=make('p','rw-world-search-status','Browse featured places below, or search the worldwide atlas.');
    status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    const results=make('div','rw-world-search-results');
    form.append(searchInput,submit,status,results);
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const name=clean(searchInput.value);
      if(name.length<2){status.textContent='Enter at least two characters.';return;}
      const original=destinations.find(d=>d.name.toLocaleLowerCase('en')===name.toLocaleLowerCase('en'));
      if(original){results.replaceChildren();status.textContent='Found in RoamWise curated destinations.';chooser(original);return;}
      status.textContent='Looking up '+name+' in the destination atlas…';
      submit.disabled=true;results.replaceChildren();
      const response=await searchAtlas(name);
      submit.disabled=false;
      if(searchInput.value.trim()!==name)return; // stale asynchronous request
      if(!response.matches.length){
        status.textContent=response.status==='not-found'
          ? 'No exact atlas match. Try adding the state or country, or ask Ailon to help.'
          : 'The atlas is not available offline right now. The featured destinations still work.';
        return;
      }
      status.textContent=response.status==='ambiguous'
        ? 'Several places share that name. Select the right one.'
        : 'Place found in the atlas. This does not imply a bookable stay.';
      for(const d of response.matches){
        const b=make('button','rw-world-search-result',d.name+' · '+(d.region||d.country));
        b.type='button';b.addEventListener('click',()=>chooser(d));results.append(b);
      }
    });
    return form;
  }
  function mountCategoryDeck() {
    const sales=document.getElementById('rwSalesCarousels');
    if(!sales || document.getElementById('rwCategoryDeck'))return;
    const section=make('section','rw-category-deck v v-home');
    section.id='rwCategoryDeck';section.setAttribute('aria-label','Explore and book categories');
    section.append(make('h2','','Explore & Book'));
    const grid=make('div','rw-category-grid');
    const items=[
      {id:'rwSalesStays',cat:'stays',label:'Stays & hotels',fallback:'🏡'},
      {id:'rwSalesWeddings',cat:'weddings',label:'Destination weddings',fallback:'💍'},
      {id:'rwSalesPackages',cat:'stays',label:'Travel packages',fallback:'🧭'},
      {id:'rwSalesShop',cat:'shop',label:'RoamWise shop',fallback:'🛍️'}
    ];
    items.forEach((item,i)=>{
      const button=make('button','rw-category-item');
      button.type='button';button.setAttribute('aria-label','Explore '+item.label);
      const art=make('span','rw-category-art',item.fallback);
      art.style.background='linear-gradient(130deg,'+gradient[i%gradient.length]+',#131323)';
      const imgSource=sales.querySelector('#'+item.id+' .rw-sales-card img');
      if(imgSource && imgSource.getAttribute('src')){
        const img=document.createElement('img');
        img.src=imgSource.getAttribute('src');img.alt='';
        img.loading='lazy';img.decoding='async';
        img.onerror=()=>img.remove();art.append(img);
      }
      button.append(art,make('strong','',item.label));
      button.addEventListener('click',()=>{
        const filter=/** @type {HTMLButtonElement|null} */ (document.querySelector('#rwDiscoverFilters button[data-category="'+item.cat+'"]'));
        if(filter)filter.click();
        sales.scrollIntoView({behavior:'smooth',block:'start'});
      });
      grid.append(button);
    });
    section.append(grid);
    sales.insertAdjacentElement('beforebegin',section);
  }
  function itinerarySkin() {
    const containers=[document.getElementById('heroLog'),document.getElementById('results')].filter(Boolean);
    const selected=()=>{try{return modes.some(x=>x[0]===localStorage.getItem(KEY))?localStorage.getItem(KEY):'editorial';}catch(_){return 'editorial';}};
    function apply(card,mode){
      card.dataset.rwItineraryStyle=mode;
      card.querySelectorAll('.rw-itinerary-day').forEach((day,i)=>{day.open=mode!=='cinematic'||i===0;});
      const id=card.getAttribute('data-rw-map-name');
      const atlas=Array.isArray(W.RW_LOCAL_ATLAS)?W.RW_LOCAL_ATLAS:[];
      const d=atlas.find(r=>r.name===id);
      const media=d&&W.RW_DEST_MEDIA&&W.RW_DEST_MEDIA[d.id];
      if(!card.querySelector('.rw-itinerary-cover')&&media&&media.status==='published'&&['owned','licensed','public-domain'].includes(media.rightsStatus)&&String(media.licenseProof||'').length>=12&&/^(?:\/(?:assets|media)\/|https:\/\/assets\.roamwise\.co\.in\/media\/)/.test(media.src||'')&&!String(media.src).includes('..')){
        const im=make('img','rw-itinerary-cover');im.src=media.src;im.alt=media.alt||id;im.loading='lazy';im.decoding='async';im.onerror=()=>im.remove();card.querySelector('.tk-head')?.prepend(im);
      }
    }
    function mount(){
      containers.forEach(root=>root.querySelectorAll('.rw-tusk-itinerary').forEach(card=>{
        if (card.querySelector('.rw-itinerary-view-switch'))return;
        const bar=make('div','rw-itinerary-view-switch');
        bar.setAttribute('role','group');bar.setAttribute('aria-label','Itinerary display');
        for(const [key,label] of modes){
          const btn=make('button','',label);btn.type='button';
          btn.addEventListener('click',()=>{
            if(key==='map'){
              const title=card.getAttribute('aria-label')||'';
              const labelled=title.match(/^\d+\s+day itinerary for\s+(.+)$/i);
              const name=card.getAttribute('data-rw-map-name')||(labelled&&labelled[1])||'';
              let stops=[];try{stops=JSON.parse(card.getAttribute('data-rw-map-stops')||'[]');}catch(_){}
              if(typeof W.openTripMap==='function'&&name){try{W.openTripMap(name,stops);}catch(_){if(typeof W.openMapExplorer==='function')W.openMapExplorer();}}
              else if(typeof W.openMapExplorer==='function')W.openMapExplorer();
            }else{
              apply(card,key);
              try{localStorage.setItem(KEY,key);}catch(_){}
              bar.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
            }
          });
          btn.setAttribute('aria-pressed',String(selected()===key));bar.appendChild(btn);
        }
        const mood=make('select','rw-itinerary-mood');
        mood.setAttribute('aria-label','Itinerary visual theme');
        for(const [v,label] of [['default','Original'],['rave','Raveverse'],['odyssey','Odyssey'],['aipan','Aipan']]){const option=make('option','',label);option.value=v;mood.appendChild(option);}
        mood.value=document.documentElement.getAttribute('data-rw-mood')||'default';
        card.setAttribute('data-rw-mood',mood.value);
        mood.addEventListener('change',()=>{card.setAttribute('data-rw-mood',mood.value);});
        bar.appendChild(mood);
        card.prepend(bar);apply(card,selected());
      }));
    }
    mount();
    containers.forEach(el=>{ if(typeof MutationObserver==='function')new MutationObserver(mount).observe(el,{childList:true,subtree:true});});
  }
  bodyReady(()=>{
    /* Exactly one homepage destination rail is owned by destination-filmstrip.js.
       This module only ADDS on-demand atlas search to that existing rail,
       plus category tiles and in-chat itinerary styles — no second rail,
       no duplicate AI Settings button, and no remote artwork on page load. */
    destinations=destinationPool();
    const rail=document.getElementById('rwDestinationsRail');
    if(rail && !rail.querySelector('.rw-world-search')){
      const form=worldSearchControl();
      const track=document.getElementById('rwDestinationTrack');
      if(track)rail.insertBefore(form,track);
      else rail.appendChild(form);
    }
    itinerarySkin();
    mountCategoryDeck();
  });
  W.RWAilonWorld = { destinationPool, staysURL, searchAtlas, modeChoices: modes.map(x=>x[0]) };
})();
