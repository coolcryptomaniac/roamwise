/* RoamWise Premium Itinerary Engine
 * Safe integration: Classic remains the default and the existing #results DOM is never modified.
 * Cinematic mode mirrors the generated itinerary into #rwCinematicMount and can be toggled off instantly.
 */
(function () {
  'use strict';

  const VERSION = '1.1.0';
  const state = {
    mode: 'classic',
    mounted: false,
    map: null,
    marker: null,
    routeLine: null,
    miniMaps: new Map(),
    routePoints: [],
    audio: null,
    audioOn: false,
    renderToken: 0,
    geocodeCache: {},
    lastFingerprint: '',
    observer: null
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const text = (sel, fallback = '') => ($(sel)?.value || $(sel)?.textContent || fallback).trim();
  const selectedText = (sel, fallback = '') => { const el = $(sel); return el?.selectedOptions?.[0]?.textContent?.trim() || el?.value || fallback; };

  function loadCache() {
    try { state.geocodeCache = JSON.parse(localStorage.getItem('rw_cine_geo_v1') || '{}') || {}; } catch (_) { state.geocodeCache = {}; }
  }
  function saveCache() {
    try {
      const entries = Object.entries(state.geocodeCache).slice(-120);
      localStorage.setItem('rw_cine_geo_v1', JSON.stringify(Object.fromEntries(entries)));
    } catch (_) {}
  }

  function proSignalFromStorage() {
    try {
      const positive = /^(1|true|yes|pro|active|lifetime|paid|unlocked)$/i;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || '';
        if (!/(roam|rw|pro|license|plan|paid|member)/i.test(k)) continue;
        const v = String(localStorage.getItem(k) || '');
        if (/(pro|paid|member|license|plan|entitle|unlock)/i.test(k) && (positive.test(v.trim()) || /"?(active|pro|paid|lifetime)"?\s*:\s*(true|"true"|"active"|"pro"|"paid"|"lifetime")/i.test(v))) return true;
      }
    } catch (_) {}
    return false;
  }

  function isPro() {
    // Explicit integration seams win; the heuristics are only compatibility fallbacks.
    try {
      if (window.RW_CINEMATIC_PREVIEW === true || sessionStorage.getItem('rw_cinematic_preview') === '1') return true;
      if (typeof window.rwIsPro === 'function') return !!window.rwIsPro();
      if (typeof window.isPro === 'function') return !!window.isPro();
      if (window.RW_USER?.isPro === true || window.RW?.user?.isPro === true || window.RW_PRO === true || window.proUnlocked === true) return true;
      if (document.body.classList.contains('pro') || document.body.classList.contains('is-pro') || $('[data-pro="true"], .pro-active, .pro-unlocked')) return true;
    } catch (_) {}
    return proSignalFromStorage();
  }

  function openUpgrade() {
    toast('Cinematic itinerary is a RoamWise Pro feature.');
    try { if (typeof window.openPay === 'function') return window.openPay(); } catch (_) {}
    $('#heroProBtn')?.click();
  }

  function injectControl() {
    if ($('#rwCineControl')) return;
    const search = $('#searchBtn');
    if (!search) return;
    const wrap = document.createElement('div');
    wrap.id = 'rwCineControl';
    wrap.innerHTML = `
      <div class="rw-cine-label"><span>Itinerary experience</span><span class="rw-cine-propill">Optional Pro</span></div>
      <div class="rw-cine-switch" role="group" aria-label="Itinerary experience">
        <button type="button" class="on" data-rw-cine-mode="classic" aria-pressed="true">Classic</button>
        <button type="button" data-rw-cine-mode="cinematic" aria-pressed="false">Cinematic</button>
      </div>
      <div class="rw-cine-hint">Classic never changes. <strong>Cinematic</strong> adds high-resolution destination media, moving route maps, weather/elevation storytelling, daily hotel/food/budget tools, ambient audio and booking actions.</div>`;
    search.parentNode.insertBefore(wrap, search);
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-rw-cine-mode]');
      if (!btn) return;
      setMode(btn.dataset.rwCineMode);
    });
  }

  function setMode(mode) {
    if (mode === 'cinematic' && !isPro()) return openUpgrade();
    state.mode = mode === 'cinematic' ? 'cinematic' : 'classic';
    $$('#rwCineControl [data-rw-cine-mode]').forEach(btn => {
      const on = btn.dataset.rwCineMode === state.mode;
      btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', String(on));
    });
    const results = $('#results');
    if (state.mode === 'classic') {
      results?.classList.remove('rw-cine-classic-hidden');
      state.miniMaps.forEach(m=>{try{m.remove()}catch(_){}});
      state.miniMaps.clear();
      $('#rwCinematicMount')?.remove();
      stopAudio();
      state.mounted = false;
      return;
    }
    results?.classList.add('rw-cine-classic-hidden');
    renderCinematic();
  }

  function formContext() {
    const tags = $$('#tagsContainer .tag.on').map(x => x.dataset.v || x.textContent.trim()).filter(Boolean);
    const exact = $('#budgetExact')?.value?.trim();
    return {
      destination: text('#destInput', 'Your destination') || 'Your destination',
      origin: text('#origin', 'Your city'),
      month: selectedText('#month', 'Flexible dates'),
      duration: selectedText('#dur', 'Trip'),
      days: Math.max(1, parseInt($('#dur')?.value || '7', 10) || 7),
      style: selectedText('#style', 'Traveler'),
      crowd: selectedText('#crowd', 'Avoid crowds'),
      transport: selectedText('#tmode', 'Standard'),
      budget: exact ? `${text('#budgetExactSym','')} ${exact}`.trim() : text('#budgetDisplay', 'Flexible budget'),
      interests: tags
    };
  }

  function cleanDayText(s) {
    return String(s || '').replace(/\s+/g, ' ').replace(/^(Day\s*\d+\s*[:\-–—]?\s*)/i, '').trim();
  }

  function extractDays(root, ctx) {
    if (!root) return fallbackDays(ctx);
    const candidates = $$('[data-day], [class*="day"], article, .card, .result-card, .itin-card, .itinerary-card', root)
      .filter(el => /\bday\s*\d+\b/i.test(el.textContent || ''));
    const seen = new Set();
    const days = [];
    for (const el of candidates) {
      const raw = (el.innerText || el.textContent || '').trim();
      const m = raw.match(/\bDay\s*(\d+)\b/i); if (!m) continue;
      const n = parseInt(m[1], 10); if (seen.has(n)) continue;
      seen.add(n);
      const heading = $('h1,h2,h3,h4,strong,.title,[class*="title"]', el)?.textContent?.trim() || raw.split(/\n/)[0];
      const title = cleanDayText(heading).slice(0, 90) || `Explore ${ctx.destination}`;
      const body = raw.replace(heading, '').trim().slice(0, 1600) || raw.slice(0, 1600);
      days.push({n, title, body, source: raw});
    }
    if (!days.length) {
      const raw = (root.innerText || root.textContent || '').trim();
      const chunks = raw.split(/(?=\bDay\s*\d+\b)/i).filter(x => /\bDay\s*\d+\b/i.test(x));
      chunks.slice(0, Math.max(ctx.days, 14)).forEach((chunk, i) => {
        const m = chunk.match(/\bDay\s*(\d+)\b\s*[:\-–—]?\s*([^\n.|]{0,90})/i);
        days.push({n: m ? +m[1] : i + 1, title: cleanDayText(m?.[2] || `Explore ${ctx.destination}`), body: chunk.slice(0, 1600), source: chunk});
      });
    }
    return (days.length ? days : fallbackDays(ctx)).sort((a,b) => a.n-b.n).slice(0, 21);
  }

  function fallbackDays(ctx) {
    const n = Math.min(ctx.days, 14);
    return Array.from({length:n}, (_,i) => ({
      n:i+1,
      title: i===0 ? `Arrive & read ${ctx.destination}` : i===n-1 ? `Last light in ${ctx.destination}` : `${ctx.destination} — field day ${i+1}`,
      body: i===0 ? 'Use your existing RoamWise itinerary above to populate exact daily stops. Cinematic mode will mirror them automatically as soon as results are generated.' : 'Cinematic presentation is ready; exact activities, costs and route stops are inherited from the Classic itinerary when available.',
      source:''
    }));
  }

  function derivePlace(day, ctx) {
    const raw = `${day.title} ${day.body}`;
    const patterns = [
      /(?:arrive|drive|ride|train|flight|to|toward|towards|at|in|stay|overnight)\s+(?:at\s+|in\s+)?([A-Z][A-Za-zÀ-ÿ.'’\-]+(?:\s+[A-Z][A-Za-zÀ-ÿ.'’\-]+){0,3})/,
      /^([A-Z][A-Za-zÀ-ÿ.'’\-]+(?:\s+[A-Z][A-Za-zÀ-ÿ.'’\-]+){0,3})\b/
    ];
    for (const p of patterns) {
      const m = raw.match(p); if (m && m[1] && !/^Day$/i.test(m[1])) return m[1].replace(/\s+(and|with|via)$/i,'').trim();
    }
    return ctx.destination;
  }

  function buildRoute(days, ctx) {
    const route = days.map(d => ({day:d.n, place:derivePlace(d,ctx), title:d.title}));
    const compact = [];
    route.forEach(r => {
      if (!compact.length || compact[compact.length-1].place.toLowerCase() !== r.place.toLowerCase() || compact[compact.length-1].day !== r.day) compact.push(r);
    });
    return compact;
  }

  function mediaFor(destination) {
    const data = window.RW_CINEMATIC_MEDIA || {};
    const exact = data[destination] || data[Object.keys(data).find(k => destination.toLowerCase().includes(k.toLowerCase()))];
    if (exact?.image || exact?.video) return exact;
    const photos = window.RW_PHOTOS_DATA || {};
    const key = Object.keys(photos).find(k => k.toLowerCase() === destination.toLowerCase()) || Object.keys(photos).find(k => destination.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(destination.toLowerCase()));
    return {image: upgradePhoto(key ? photos[key] : '')};
  }

  function mediaTarget() {
    const saveData = !!navigator.connection?.saveData;
    const effective = String(navigator.connection?.effectiveType || '');
    if (saveData || /(^|-)2g$/.test(effective)) return {w:1600,h:900,q:78,label:'HD'};
    const pixels = Math.max(screen?.width || innerWidth || 1920, innerWidth || 1920) * Math.max(1, devicePixelRatio || 1);
    if (pixels >= 5000 && !/3g/.test(effective)) return {w:7680,h:4320,q:90,label:'8K'};
    if (pixels >= 2500) return {w:3840,h:2160,q:88,label:'4K'};
    return {w:2560,h:1440,q:84,label:'QHD'};
  }

  function upgradePhoto(url) {
    if (!url) return '';
    try {
      const u = new URL(url, location.href);
      if (u.hostname.includes('weserv.nl')) {
        const src = decodeURIComponent(u.searchParams.get('url') || '');
        let original = src;
        const m = src.match(/^(.*\/wikipedia\/commons)\/thumb\/([^/]+\/[^/]+\/[^/]+)\/\d+px-[^/]+$/i);
        if (m) original = `${m[1]}/${m[2]}`;
        const target = mediaTarget();
        u.searchParams.set('url', original);
        u.searchParams.set('w',String(target.w)); u.searchParams.set('h',String(target.h)); u.searchParams.set('fit','cover'); u.searchParams.set('q',String(target.q)); u.searchParams.set('output','webp');
        return u.toString();
      }
    } catch (_) {}
    return url;
  }

  function heroHTML(ctx, media) {
    const interests = ctx.interests.slice(0,3).join(' · ') || 'smart travel';
    const mediaStyle = media.image ? `background-image:url('${esc(media.image)}')` : '';
    const video = media.video ? `<video class="rw-cine-video" src="${esc(media.video)}" autoplay muted loop playsinline preload="metadata" poster="${esc(media.image||'')}"></video>` : '';
    return `<header class="rw-cine-hero">
      <div class="rw-cine-media" style="${mediaStyle}">${video}</div><div class="rw-cine-moon" aria-hidden="true"></div><div class="rw-cine-embers" aria-hidden="true">${embers()}</div>
      <div class="rw-cine-hero-copy">
        <div class="rw-cine-kicker">🥷 RoamWise cinematic dossier · Pro</div>
        <h1 class="rw-cine-title">${esc(ctx.destination)}</h1>
        <div class="rw-cine-subtitle">A moving field guide from ${esc(ctx.origin)} — route intelligence, elevation, weather context, stays, food, budget and booking actions wrapped around the itinerary RoamWise already generated.</div>
        <div class="rw-cine-meta"><span>${esc(ctx.month)}</span><span>${esc(ctx.duration)}</span><span>${esc(ctx.style)}</span><span>${esc(ctx.crowd)}</span><span>${esc(interests)}</span></div>
        <div class="rw-cine-actions"><button class="rw-cine-action primary" data-rw-action="route">▶ Play route</button><button class="rw-cine-action" data-rw-action="audio">◉ Ambient</button><button class="rw-cine-action" data-rw-action="classic">Classic view</button></div>
      </div></header>`;
  }

  function embers() {
    let out=''; for(let i=0;i<26;i++){const left=(i*37)%100;const d=6+(i%7)*.7;const delay=-(i%11)*.61;const dx=((i%2?1:-1)*(18+(i%5)*9));out+=`<i class="rw-ember" style="left:${left}%;--d:${d}s;--delay:${delay}s;--dx:${dx}px"></i>`;} return out;
  }

  function routeFallbackSVG(route) {
    const width=760,height=300,pad=52;
    const pts=route.map((r,i)=>({x:pad+(width-pad*2)*(route.length<=1?0.5:i/(route.length-1)),y:height/2 + Math.sin(i*1.7)*70 + (i%2?25:-18),...r}));
    const path=pts.length>1?`M ${pts[0].x} ${pts[0].y} `+pts.slice(1).map((p,i)=>`C ${(pts[i].x+p.x)/2} ${pts[i].y}, ${(pts[i].x+p.x)/2} ${p.y}, ${p.x} ${p.y}`).join(' '):'';
    return `<div class="rw-route-fallback"><svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet"><path class="rw-path" d="${path}"/>${pts.map((p,i)=>`<circle class="rw-route-node" cx="${p.x}" cy="${p.y}" r="6"/><text class="rw-route-label" x="${p.x}" y="${p.y+(i%2?24:-16)}" text-anchor="middle">${esc(shortPlace(p.place))}</text>`).join('')}</svg><div class="rw-shinobi-fallback">🥷</div></div>`;
  }

  function shortPlace(s){const a=String(s||'').trim().split(/\s+/);return a.slice(0,3).join(' ').slice(0,28)}

  function routeHTML(route) {
    return `<section class="rw-cine-section" id="rwCineRoute"><div class="rw-cine-section-head"><div><div class="rw-cine-eyebrow">Movement layer</div><h2>Route as a living map</h2></div><div class="rw-cine-small">OpenStreetMap when online · cinematic fallback offline</div></div>
      <div class="rw-route-shell"><div class="rw-route-map" id="rwCineMap">${routeFallbackSVG(route)}</div><div class="rw-route-strip">${route.map(r=>`<div class="rw-route-stop"><div class="rw-route-day">Day ${r.day}</div><div class="rw-route-place">${esc(r.place)}</div><div class="rw-route-elev" data-rw-elev-place="${esc(r.place)}">Locating elevation…</div></div>`).join('')}</div></div>
      <div class="rw-elev-wrap"><div class="rw-cine-small" style="margin-bottom:8px">Elevation transition</div><div class="rw-elev-bars" id="rwElevBars"><div class="rw-cine-small">Geocoding route…</div></div></div>
    </section>`;
  }

  function keywordSentences(source, rx, fallback) {
    const s = String(source||'').split(/(?<=[.!?])\s+|\n+/).map(x=>x.trim()).filter(Boolean).filter(x=>rx.test(x));
    return (s.slice(0,4).join(' ') || fallback).slice(0,700);
  }

  function transportIcon(ctx, source='') {
    const v=`${ctx.transport} ${source}`.toLowerCase();
    if (/flight|plane|airport/.test(v)) return '✈';
    if (/train|rail|metro/.test(v)) return '🚆';
    if (/ferry|boat/.test(v)) return '⛴';
    if (/cycle|bike/.test(v)) return '🚲';
    if (/walk|hike|trek/.test(v)) return '🥾';
    if (/ev|electric/.test(v)) return '⚡';
    if (/bus|coach/.test(v)) return '🚌';
    return '🚙';
  }

  function dayHTML(day, ctx, idx) {
    const stay=keywordSentences(day.source,/hotel|stay|hostel|resort|guesthouse|homestay|camp|overnight|room/i,'Open Stay & do to compare properties near this day’s route.');
    const food=keywordSentences(day.source,/food|eat|breakfast|lunch|dinner|cafe|restaurant|dish|market|tea|coffee/i,'Use local places near the route; keep one flexible meal window for discoveries.');
    const budget=keywordSentences(day.source,/₹|\$|€|£|¥|cost|budget|price|fare|fee|ticket|per person|night/i,`Trip budget target: ${ctx.budget}. The Classic itinerary remains the source of truth for exact estimates.`);
    const move=keywordSentences(day.source,/drive|train|bus|flight|walk|cycle|ride|transfer|taxi|metro|ferry|km|hour|min/i,ctx.transport);
    const vehicle=transportIcon(ctx,move);
    return `<article class="rw-day-card" data-rw-day="${day.n}" style="--i:${idx}"><div class="rw-day-top"><div class="rw-day-copy"><div class="rw-day-num">Day ${day.n}</div><div class="rw-day-title">${esc(day.title)}</div><div class="rw-day-summary">${esc(day.body.slice(0,900))}</div></div><div class="rw-day-weather" data-rw-weather-day="${day.n}"><div class="rw-weather-icon">◐</div><div><div class="rw-weather-temp">Context</div><div class="rw-weather-note">Weather and elevation load from the route point when online.</div></div></div></div>
      <div class="rw-day-tabs"><button class="rw-day-tab on" data-rw-panel="move">↝ Transport</button><button class="rw-day-tab" data-rw-panel="stay">⌂ Hotels</button><button class="rw-day-tab" data-rw-panel="food">◌ Food</button><button class="rw-day-tab" data-rw-panel="budget">₹ Budget</button><button class="rw-day-tab" data-rw-panel="map">⌖ Map</button></div>
      <div class="rw-day-panel on" data-rw-panel-body="move"><div class="rw-transport-seq" aria-hidden="true"><span class="rw-transport-origin">●</span><i></i><span class="rw-transport-vehicle">${vehicle}</span><span class="rw-transport-dest">◆</span></div><div class="rw-pills"><span class="rw-pill">${esc(move)}</span></div></div>
      <div class="rw-day-panel" data-rw-panel-body="stay"><div class="rw-pills"><span class="rw-pill">${esc(stay)}</span></div><button class="rw-tool-btn" data-rw-action="stay">Open Stay & do</button></div>
      <div class="rw-day-panel" data-rw-panel-body="food"><div class="rw-pills"><span class="rw-pill">${esc(food)}</span></div><button class="rw-tool-btn" data-rw-action="near">Find food near me</button></div>
      <div class="rw-day-panel" data-rw-panel-body="budget"><div class="rw-pills"><span class="rw-pill">${esc(budget)}</span></div><button class="rw-tool-btn" data-rw-action="money">Open money tools</button></div>
      <div class="rw-day-panel" data-rw-panel-body="map"><div class="rw-mini-map" data-rw-mini-map="${day.n}"><div class="rw-skeleton" style="min-height:230px"><div><strong>Day ${day.n} map</strong><span>Open this tab to load an expandable map for the day.</span></div></div></div></div></article>`;
  }

  function toolsHTML(ctx) {
    return `<section class="rw-cine-section"><div class="rw-cine-section-head"><div><div class="rw-cine-eyebrow">Field console</div><h2>Everything around the itinerary</h2></div></div><div class="rw-tool-grid">
      <div class="rw-tool-card"><div class="rw-tool-ic">🏨</div><div class="rw-tool-title">Stay intelligence</div><div class="rw-tool-copy">Open RoamWise lodging and experience layers without leaving this itinerary.</div><button class="rw-tool-btn" data-rw-action="stay">Stay & do</button></div>
      <div class="rw-tool-card"><div class="rw-tool-ic">💸</div><div class="rw-tool-title">Budget cockpit</div><div class="rw-tool-copy">Your per-person target is ${esc(ctx.budget)}. Split, track and keep a safety buffer.</div><button class="rw-tool-btn" data-rw-action="money">Money layer</button></div>
      <div class="rw-tool-card"><div class="rw-tool-ic">📍</div><div class="rw-tool-title">Arrival mode</div><div class="rw-tool-copy">Use near-me discovery when you are physically on the route for food, essentials and local context.</div><button class="rw-tool-btn" data-rw-action="near">Near me</button></div>
    </div><div class="rw-offline" style="margin-top:12px">Premium presentation degrades gracefully: if maps, geocoding or weather are unavailable, Classic remains intact and the cinematic dossier keeps a schematic route instead of breaking.</div></section>`;
  }

  function bookingHTML(ctx) {
    return `<div class="rw-booking-bar"><div class="rw-booking-copy"><strong>${esc(ctx.destination)} · ready to turn into a trip?</strong><span>Review route, stays and costs before booking.</span></div><button class="rw-booking-cta" data-rw-action="booking">Add to Your trip →</button></div>`;
  }

  async function renderCinematic() {
    if (state.mode !== 'cinematic') return;
    const token=++state.renderToken;
    const results=$('#results'); const ctx=formContext(); const fingerprint=`${ctx.destination}|${ctx.month}|${ctx.days}|${(results?.innerText||'').slice(0,1000)}`;
    let mount=$('#rwCinematicMount'); if(!mount){mount=document.createElement('div');mount.id='rwCinematicMount';(results?.parentNode||$('#app')||document.body).insertBefore(mount,results?results.nextSibling:null)}
    const days=extractDays(results,ctx); const route=buildRoute(days,ctx); const media=mediaFor(ctx.destination);
    state.miniMaps.forEach(m=>{try{m.remove()}catch(_){}}); state.miniMaps.clear();
    mount.innerHTML=`<div class="rw-cine" data-rw-cine-version="${VERSION}">${heroHTML(ctx,media)}${routeHTML(route)}<section class="rw-cine-section"><div class="rw-cine-section-head"><div><div class="rw-cine-eyebrow">Daily dossier</div><h2>${days.length} chapters, one continuous journey</h2></div><div class="rw-cine-small">Tap a chip to expand details</div></div><div class="rw-day-stack">${days.map((d,i)=>dayHTML(d,ctx,i)).join('')}</div></section>${toolsHTML(ctx)}${bookingHTML(ctx)}</div>`;
    bindCinematic(mount,ctx,route,days); state.mounted=true; state.lastFingerprint=fingerprint;
    requestAnimationFrame(()=>mount.scrollIntoView({behavior:'smooth',block:'start'}));
    await hydrateRoute(route,ctx,token);
  }

  function bindCinematic(mount,ctx,route,days) {
    mount.onclick=(e)=>{
      const tab=e.target.closest('.rw-day-tab'); if(tab){const card=tab.closest('.rw-day-card'); if(!card)return; $$('.rw-day-tab',card).forEach(x=>x.classList.toggle('on',x===tab)); $$('.rw-day-panel',card).forEach(x=>x.classList.toggle('on',x.dataset.rwPanelBody===tab.dataset.rwPanel)); if(tab.dataset.rwPanel==='map') initMiniMap(+card.dataset.rwDay,route,card.querySelector('[data-rw-mini-map]')); return;}
      const a=e.target.closest('[data-rw-action]'); if(!a)return; handleAction(a.dataset.rwAction,ctx,route,days,a);
    };
  }

  function handleAction(action,ctx,route,days,button){
    if(action==='classic') return setMode('classic');
    if(action==='route') return playRoute();
    if(action==='audio') return toggleAudio(button);
    if(action==='stay'){try{if(typeof window.openListing==='function')return window.openListing()}catch(_){} return toast('Stay & do is available from the RoamWise home tools.');}
    if(action==='money'){try{if(typeof window.openMoneyLayer==='function')return window.openMoneyLayer()}catch(_){} return toast(`Budget target: ${ctx.budget}`);}
    if(action==='near'){try{if(typeof window.openNearMe==='function')return window.openNearMe()}catch(_){} return toast('Near-me tools will use your location when available.');}
    if(action==='booking'){try{if(typeof window.openBooking==='function')return window.openBooking()}catch(_){} return toast('Your trip basket is available from the RoamWise home tools.');}
  }

  async function geocode(place,ctx) {
    const key=`${place}|${ctx.destination}`.toLowerCase(); if(state.geocodeCache[key]) return state.geocodeCache[key];
    const q=(place && place.toLowerCase()!==ctx.destination.toLowerCase())?`${place}, ${ctx.destination}`:ctx.destination;
    try{
      const url=`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`;
      const res=await fetch(url,{cache:'force-cache'}); if(!res.ok)throw new Error('geo'); const data=await res.json(); const g=data?.results?.[0]; if(!g)return null;
      const out={lat:g.latitude,lng:g.longitude,elevation:Number(g.elevation||0),name:g.name||place,country:g.country||''}; state.geocodeCache[key]=out; saveCache(); return out;
    }catch(_){return null}
  }

  async function weatherAt(g) {
    if(!g)return null; try{const u=`https://api.open-meteo.com/v1/forecast?latitude=${g.lat}&longitude=${g.lng}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;const r=await fetch(u,{cache:'no-store'});if(!r.ok)return null;const d=await r.json();return d.current||null}catch(_){return null}
  }

  function weatherIcon(code){if(code==null)return'◐'; if(code===0)return'☀';if([1,2].includes(code))return'◑';if(code===3)return'☁';if([45,48].includes(code))return'≋';if([51,53,55,61,63,65,80,81,82].includes(code))return'☂';if([71,73,75,77,85,86].includes(code))return'❄';if([95,96,99].includes(code))return'ϟ';return'◐'}

  async function hydrateRoute(route,ctx,token){
    const resolved=[]; for(const r of route){if(token!==state.renderToken)return;const g=await geocode(r.place,ctx);resolved.push({...r,geo:g}); await sleep(80)}
    state.routePoints=resolved.filter(x=>x.geo);
    updateElevations(resolved); updateWeather(resolved); if(state.routePoints.length>=1) await initLeaflet(state.routePoints);
  }

  function updateElevations(resolved){
    resolved.forEach(r=>{const els=$$(`[data-rw-elev-place="${cssEscape(r.place)}"]`);els.forEach(el=>el.textContent=r.geo?`${Math.round(r.geo.elevation).toLocaleString()} m · ${r.geo.country||'route point'}`:'Elevation unavailable')});
    const vals=resolved.filter(x=>x.geo).map(x=>x.geo.elevation||0); const max=Math.max(...vals,1),min=Math.min(...vals,0); const wrap=$('#rwElevBars'); if(!wrap)return; wrap.innerHTML=resolved.map((r,i)=>{const e=r.geo?.elevation||0;const h=25+75*((e-min)/Math.max(max-min,1));return `<div style="flex:1;min-width:28px"><div class="rw-elev-bar" style="--h:${h}%;--delay:${i*.06}s" data-label="${Math.round(e)}m"></div><div class="rw-elev-name">${esc(shortPlace(r.place))}</div></div>`}).join('');
  }
  function cssEscape(s){try{return CSS.escape(s)}catch(_){return String(s).replace(/["\\]/g,'\\$&')}}

  async function updateWeather(resolved){
    const seen={}; for(const r of resolved){if(seen[r.day])continue;seen[r.day]=1;const card=$(`[data-rw-weather-day="${r.day}"]`); if(!card||!r.geo)continue;const w=await weatherAt(r.geo);if(!w)continue;card.innerHTML=`<div class="rw-weather-icon">${weatherIcon(w.weather_code)}</div><div><div class="rw-weather-temp">${Math.round(w.temperature_2m)}°C</div><div class="rw-weather-note">Feels ${Math.round(w.apparent_temperature)}° · wind ${Math.round(w.wind_speed_10m)} km/h · live context at ${esc(r.geo.name)}. Travel-month conditions can differ.</div></div>`;}
  }

  async function loadLeaflet(){if(window.L)return true;try{if(!$('#rwLeafletCss')){const l=document.createElement('link');l.id='rwLeafletCss';l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(l)}await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});return !!window.L}catch(_){return false}}

  async function initLeaflet(points){const ok=await loadLeaflet();if(!ok||!$('#rwCineMap'))return false;const el=$('#rwCineMap');el.innerHTML='';try{state.map?.remove?.();state.map=L.map(el,{zoomControl:false,attributionControl:true,scrollWheelZoom:false});L.control.zoom({position:'bottomright'}).addTo(state.map);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(state.map);const latlngs=points.map(p=>[p.geo.lat,p.geo.lng]);state.routeLine=L.polyline(latlngs,{color:'#c4302b',weight:3,opacity:.9,dashArray:'8 9'}).addTo(state.map);points.forEach((p,i)=>L.circleMarker([p.geo.lat,p.geo.lng],{radius:5,color:'#e8ba6c',weight:2,fillColor:'#11131a',fillOpacity:1}).addTo(state.map).bindTooltip(`Day ${p.day} · ${p.place}`,{direction:'top'}));state.map.fitBounds(L.latLngBounds(latlngs).pad(.22));const icon=L.divIcon({html:'<div class="rw-shinobi-icon">🥷</div>',className:'',iconSize:[30,30],iconAnchor:[15,15]});state.marker=L.marker(latlngs[0],{icon,zIndexOffset:1000}).addTo(state.map);return true}catch(_){el.innerHTML=routeFallbackSVG(points);return false}}

  function playRoute(){if(!state.marker||!state.map||state.routePoints.length<2){toast('Route animation is using the cinematic fallback until map points are ready.');return}const pts=state.routePoints.map(p=>L.latLng(p.geo.lat,p.geo.lng));let seg=0,start=null;const per=Math.max(1200,6500/(pts.length-1));function step(ts){if(!start)start=ts;let t=clamp((ts-start)/per,0,1);const a=pts[seg],b=pts[seg+1];const eased=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;state.marker.setLatLng([a.lat+(b.lat-a.lat)*eased,a.lng+(b.lng-a.lng)*eased]);if(t>=1){seg++;start=ts;if(seg>=pts.length-1){state.marker.setLatLng(pts[pts.length-1]);return}}requestAnimationFrame(step)}requestAnimationFrame(step)}

  async function initMiniMap(day,route,el){
    if(!el)return;
    const p=state.routePoints.find(x=>x.day===day)||state.routePoints[Math.min(day-1,state.routePoints.length-1)];
    if(!p?.geo){el.innerHTML='<div class="rw-skeleton" style="min-height:230px"><div><strong>Route point is still resolving</strong><span>The cinematic map will appear automatically when location data is available.</span></div></div>';return}
    const ok=await loadLeaflet(); if(!ok)return;
    const old=state.miniMaps.get(day); if(old){setTimeout(()=>old.invalidateSize?.(),20);return}
    el.innerHTML='';
    try{
      const m=L.map(el,{zoomControl:true,attributionControl:true,scrollWheelZoom:false});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(m);
      const same=state.routePoints.filter(x=>Math.abs(x.day-day)<=1).map(x=>[x.geo.lat,x.geo.lng]);
      if(same.length>1)L.polyline(same,{color:'#c4302b',weight:3,opacity:.9,dashArray:'8 9'}).addTo(m);
      L.marker([p.geo.lat,p.geo.lng],{icon:L.divIcon({html:'<div class="rw-shinobi-icon">🥷</div>',className:'',iconSize:[30,30],iconAnchor:[15,15]})}).addTo(m).bindPopup(`Day ${day} · ${esc(p.place)}`);
      m.setView([p.geo.lat,p.geo.lng],11); state.miniMaps.set(day,m); setTimeout(()=>m.invalidateSize(),60);
    }catch(_){el.innerHTML=routeFallbackSVG([p])}
  }

  function focusDayMap(day,route){const p=state.routePoints.find(x=>x.day===day)||state.routePoints[Math.min(day-1,state.routePoints.length-1)];if(state.map&&p?.geo){state.map.flyTo([p.geo.lat,p.geo.lng],Math.max(state.map.getZoom(),9),{duration:1.1});toast(`Day ${day}: ${p.place}`)}else toast(`Day ${day} map will focus when the route point is resolved.`)}

  function toggleAudio(btn){if(state.audioOn)return stopAudio(btn);try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw 0;const ctx=new AC();const master=ctx.createGain();master.gain.value=.035;master.connect(ctx.destination);const tones=[110,164.81,220].map((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=i===1?'triangle':'sine';o.frequency.value=f;g.gain.value=i===0?.45:.18;o.connect(g);g.connect(master);o.start();return{o,g}});const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=.085;lg.gain.value=.016;lfo.connect(lg);lg.connect(master.gain);lfo.start();state.audio={ctx,master,tones,lfo};state.audioOn=true;btn?.classList.add('rw-audio-on');if(btn)btn.textContent='◉ Ambient on';toast('Ambient sound on · generated locally, no copyrighted track.')}catch(_){toast('Ambient audio is not supported in this browser.')}}
  function stopAudio(btn){if(state.audio){try{state.audio.ctx.close()}catch(_){}}state.audio=null;state.audioOn=false;$$('[data-rw-action="audio"]').forEach(x=>{x.classList.remove('rw-audio-on');x.textContent='◉ Ambient'});}

  function toast(msg){document.querySelector('.rw-cine-toast')?.remove();const d=document.createElement('div');d.className='rw-cine-toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),2500)}

  function watchResults(){const r=$('#results');if(!r||state.observer)return;let timer;state.observer=new MutationObserver(()=>{if(state.mode!=='cinematic')return;clearTimeout(timer);timer=setTimeout(()=>{const fp=(r.innerText||'').slice(0,1200);if(fp&&fp!==state.lastFingerprint)renderCinematic()},260)});state.observer.observe(r,{childList:true,subtree:true,characterData:true});}

  function ensureStyles(){if($('#rwCineStyles'))return;const l=document.createElement('link');l.id='rwCineStyles';l.rel='stylesheet';l.href='roamwise-premium-itinerary.css';document.head.appendChild(l)}
  function init(){ensureStyles();loadCache();injectControl();watchResults();document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.audioOn)stopAudio()});window.RoamWiseCinematic={version:VERSION,setMode,render:renderCinematic,isPro,preview(on=true){try{sessionStorage.setItem('rw_cinematic_preview',on?'1':'0')}catch(_){};return on}};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
