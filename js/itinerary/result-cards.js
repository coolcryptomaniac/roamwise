// @ts-nocheck
// SEARCH EXECUTION + RESULT CARD RENDERING — extracted verbatim from app.js
// (modularization round 4). runSearch() is the search button's click
// handler (free-search-limit gating, smartSearch()/buildGenericDestination()
// dispatch, optional AI enhancement via aiCall(), then renderCards()).
// renderCards() builds the entire results DOM via template literals (photo
// slots, overview/data/budget/itinerary/pro-tools/book tabs, action bar).
// swTab/swSub switch between those tabs; addSpend/togPack drive the
// in-card budget tracker and packing list; openLbox/closeLbox are the
// card-photo lightbox. Depends on runtime globals from app.js (el,
// showToast, isPro, freeLeval/freeLeft, activeProv, lsGet/lsSet, MONTHS,
// MO, AC, CURR, spends, itinBuilt) and js/itinerary/search-engine.js
// (smartSearch, flagEmoji, buildGenericDestination, loadPhotosForCard,
// picsumUrl) and js/copilot/ai-providers.js (aiCall) — all resolved at
// call time, so load order relative to those files doesn't matter.
/* MAIN SEARCH */
function runSearch(){
  try{ xpAdd(10, "Mission planned"); }catch(e){ /* best-effort, ignore */ }
  try{ track('searches'); maybeNudge(); }catch(e){ /* analytics best-effort, ignore */ }
  var month = el('month').value;
  if(!month){ showToast('Please select a travel month'); return; }
  if(!isPro){
    if(freeLeft<=0){ openPay(); showToast('Daily limit reached — Upgrade for unlimited!'); return; }
    freeLeft--; lsSet('rwFLeft', String(freeLeft));
    el('freeCount').textContent = freeLeft;
    if(freeLeft===0) showToast('Last free search! Upgrade for '+proPriceLabel(100)+' for unlimited.');
  }
  var origin = (el('origin').value||'India').trim();
  var days = parseInt(el('dur').value)||14;
  var dest = window.getDestVal ? window.getDestVal() : 'Anywhere';
  var style = el('style').value;
  var crowd = el('crowd').value;
  var budUSD = parseInt(el('budgetSlider').value)||1200;
  var interests = [];
  document.querySelectorAll('.tag.on').forEach(function(t){ interests.push(t.dataset.v); });

  var btn = el('searchBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="shim-line"></span>Finding destinations...';
  var out = el('results');
  out.innerHTML = `<div class="loader"><div class="spin-ring"></div><div class="load-txt"><strong id="loadMsg">Matching destinations...</strong><span>Smart Search + free data sources</span></div></div>`;
  var msgs = ['Matching destinations...','Checking crowd levels...','Finding hidden gems...','Building results...'];
  var mi2 = 0;
  var tick = setInterval(function(){ mi2=(mi2+1)%msgs.length; var e=el('loadMsg'); if(e) e.textContent=msgs[mi2]; }, 1400);

  var topR = smartSearch(month, budUSD, dest, crowd, interests);
  var isGenericResult = false;
  var destLower = (dest||'').toLowerCase().trim();
  var wantsSpecificPlace = destLower && destLower !== 'anywhere' && destLower.indexOf('anywhere') < 0;
  /* A "City, Country" style query (the autocomplete/typeahead flow) went through smartSearch's
     city-specific matching path, which legitimately narrows to just the matched city/cities.
     Padding that out with an unfiltered global search would reintroduce unrelated destinations
     (e.g. "Rishikesh, India" pulling in Munnar), defeating the point of that narrowing — so for
     a city-qualified query that found at least one real match, show fewer than 3 cards instead
     of topping up with unrelated places. */
  var isCityQualified = destLower.indexOf(',') >= 0;

  if(wantsSpecificPlace && topR.length < 3){
    if(topR.length === 0){
      /* No curated match at all — build a generic card for the typed place */
      var generic = buildGenericDestination(dest, budUSD);
      isGenericResult = true;
      var alts0 = smartSearch(month, budUSD, '', crowd, interests).filter(function(r){
        return r.d.name.toLowerCase() !== generic.name.toLowerCase();
      });
      topR = [{ d:generic, sc:999, cs:generic.crowd[MONTHS.indexOf(month)] }].concat(alts0).slice(0,3);
    } else if(!isCityQualified){
      /* Found some curated matches but fewer than 3 — top up with global best.
         Skipped for city-qualified queries (see isCityQualified note above) since a specific
         city legitimately matching just 1-2 destinations is expected, not a gap to fill. */
      var foundIds = topR.map(function(r){ return r.d.id; });
      var alts1 = smartSearch(month, budUSD, '', crowd, interests).filter(function(r){
        return foundIds.indexOf(r.d.id) < 0;
      });
      topR = topR.concat(alts1).slice(0,3);
    }
  }

  if(!topR.length){
    clearInterval(tick); btn.disabled=false; btn.innerHTML='<span class="shim-line"></span>🔍 Find My Destinations — Works Without Any API Key';
    out.innerHTML = `<div class="err-box"><strong style="display:block;margin-bottom:5px">No destinations found</strong>Try increasing your budget or removing some filters.</div>`;
    return;
  }

  var hasKey = lsGet('rwKey_'+activeProv);
  if(activeProv!=='smart' && hasKey){
    var destList = topR.map(function(r){ return r.d.name+'/'+r.d.country; }).join(' | ');
    var shapeItems = topR.map(function(r, i){
      var tipCopy = i===0 ? '1 practical tip for '+month : '1 tip';
      return '{"id":"'+r.d.id+'","desc":"2 vivid sentences","tip":"'+tipCopy+'"}';
    }).join(',');
    var aiPrompt = 'Briefly enhance these travel destinations for a traveler from '+origin+' in '+month+' ($'+budUSD+' budget, interests: '+interests.join(',')+'). Destinations: '+destList+'. Return ONLY valid JSON with this exact shape: {"e":['+shapeItems+']}';
    aiCall(aiPrompt, 600, function(err, txt){
      clearInterval(tick); btn.disabled=false; btn.innerHTML='<span class="shim-line"></span>🔍 Find My Destinations — Works Without Any API Key';
      var aiData = null;
      if(txt){ try{ aiData = JSON.parse(txt); }catch(x){ /* parse best-effort, ignore malformed/missing data */ } }
      renderCards(topR, month, budUSD, origin, days, aiData, style, isGenericResult);
    });
  } else {
    clearInterval(tick); btn.disabled=false; btn.innerHTML='<span class="shim-line"></span>🔍 Find My Destinations — Works Without Any API Key';
    renderCards(topR, month, budUSD, origin, days, null, style, isGenericResult);
  }
}

/* RENDER RESULTS — built entirely with template literals */
function renderCards(results, month, budUSD, origin, days, aiData, travelStyle, isGenericResult){
  itinBuilt = {};
  var mi = MONTHS.indexOf(month);
  var provLabel = activeProv==='smart' ? 'Smart Search' : (lsGet('rwKey_'+activeProv) ? activeProv.charAt(0).toUpperCase()+activeProv.slice(1)+' AI' : 'Smart Search');

  var H = `<div class="live-bar"><div class="live-dot"></div><span>Results for <strong style="color:#16BF96">${month}</strong> &bull; ${provLabel}${aiData ? ' &bull; <strong style="color:#BF8CFF">AI enhanced</strong>' : ''}${isPro ? ' &bull; <strong style="color:#E8BA6C">Pro Active</strong>' : ''}</span>${(activeProv==='smart' && !lsGet('rwKey_gemini') && !lsGet('rwKey_groq')) ? '<span style="font-size:10px;color:#4A4946;margin-left:auto;cursor:pointer" onclick="openSettings()">+ Add free AI key</span>' : ''}</div>`;

  H += `<div class="cmp-wrap"><table class="cmp-table"><thead><tr><th>Destination</th><th>Crowd in ${month}</th><th>Mid budget</th><th>Visa (India)</th><th>Best months</th></tr></thead><tbody>`;
  results.forEach(function(r){
    var d=r.d, cs=r.cs, bl = cs<35?'badge-low':cs<60?'badge-mid':'badge-hi', ct = cs<35?'Low':cs<60?'Moderate':'Busy';
    var bm = d.bestM.length ? d.bestM.slice(0,3).map(function(m){return MO[m-1]||m;}).join(', ') : 'Year-round';
    H += `<tr><td><strong>${flagEmoji(d.flag)} ${d.name}</strong>${d.country?`<br><span style="font-size:10px;color:#4A4946">${d.country}</span>`:''}</td><td><span class="badge ${bl}" style="font-size:11px">${cs}% ${ct}</span></td><td>${fmtMoney(d.cost.mid)}</td><td style="font-size:11px">${d.visa.type}<br><span style="color:#16BF96">${d.visa.cost}</span></td><td style="font-size:11px">${bm}</td></tr>`;
  });
  H += `</tbody></table></div>`;
  H += adCard(0);

  if(!isPro) H += `<div class="promo" style="margin-bottom:14px" onclick="openPay()"><div class="promo-left">👑</div><div class="promo-text"><strong>Unlock Pro — ${proPriceLabel(100)} lifetime</strong><span>Full itineraries &bull; Budget tracker &bull; WhatsApp share &amp; more</span></div><div class="promo-price"><span class="promo-amt">${proPriceLabel(100)}</span></div></div>`;

  H += `<div class="card-list">`;

  results.forEach(function(r, ci){
    var d=r.d, cs=r.cs, feat = ci===0;
    var bl = cs<35?'badge-low':cs<60?'badge-mid':'badge-hi';
    var ct = cs<35?'Low crowds':cs<60?'Moderate':'Busy';
    var barCls = cs<35?'crowd-bar-low':cs<60?'crowd-bar-mid':'crowd-bar-hi';
    var enh = (aiData && aiData.e) ? aiData.e.find(function(x){ return x.id===d.id; })||null : null;
    var idays = isPro ? Math.min(days,14) : 3;
    var others = results.filter(function(_,i){ return i!==ci; });
    var enc = encodeURIComponent(d.name+' '+(d.country||''));
    var waMsg = encodeURIComponent('RoamWise Trip: '+d.name+', '+(d.country||'')+' | '+month+' | Budget: '+fmtMoney(d.cost.mid)+' | Crowd: '+ct+' | Visa: '+d.visa.type+' | Food: '+d.food.slice(0,2).join(', ')+' | Gem: '+d.gems[0]+' | RoamWise Pro');
    var T = 'c'+ci;
    var P2 = 'p'+ci;
    var placeholder900 = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="900" height="500"%3E%3Crect width="900" height="500" fill="%23121828"/%3E%3C/svg%3E';
    var placeholder400 = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23121828"/%3E%3C/svg%3E';

    H += `<div class="card${feat?' featured':''}" style="animation-delay:${ci*0.1}s">`;

    /* Photos — placeholders now, filled in by loadPhotosForCard() right after render */
    H += `<div class="photos">
      <div class="photo-big" onclick="openLbox(document.getElementById('photo_main_${ci}').src)">
        <img id="photo_main_${ci}" src="${placeholder900}" alt="${d.name}" loading="lazy" onerror="this.src='${picsumUrl(d.id+'_m',900,500)}'">
        <div class="photo-overlay"></div><div class="photo-city">${d.name}</div><div class="photo-country">${d.country||''}</div>
      </div>
      <div class="photo-small-col">
        <div class="photo-sm" onclick="openLbox(document.getElementById('photo_sm_${ci}_0').src)"><img id="photo_sm_${ci}_0" src="${placeholder400}" alt="" loading="lazy" onerror="this.src='${picsumUrl(d.id+'_0',400,300)}'"></div>
        <div class="photo-sm" onclick="openLbox(document.getElementById('photo_sm_${ci}_1').src)"><img id="photo_sm_${ci}_1" src="${placeholder400}" alt="" loading="lazy" onerror="this.src='${picsumUrl(d.id+'_1',400,300)}'"></div>
      </div>
    </div>`;

    /* Card head */
    var flagIco = flagEmoji(d.flag);
    var bestMonthsLabel = d.bestM.length ? d.bestM.slice(0,3).map(function(m){return MO[m-1]||m;}).join(', ') : 'Year-round';
    H += `<div class="card-head">
      <div>
        <div class="card-rank${feat?' gold':''}">${feat ? (isGenericResult ? '📍 Your pick' : '⭐ Top pick for '+month) : (isGenericResult ? 'Alternative '+ci : 'Option '+(ci+1))}</div>
        <div class="card-name">${flagIco} ${d.name}</div>
        <div class="card-ctry">${d.country ? d.country+' &bull; ' : ''}${d.region}</div>
      </div>
      <div class="badges">
        <span class="badge ${bl}">${ct}</span>
        <span class="badge badge-cost">${fmtMoney(d.cost.mid)}</span>
        <span class="badge badge-sea">${bestMonthsLabel}</span>
      </div>
    </div>`;

    /* Tabs */
    H += `<div class="card-body"><div class="tabs">
      <button class="tab-btn on" data-t="${T}" data-tab="ov" onclick="swTab('${T}','ov')">Overview</button>
      <button class="tab-btn" data-t="${T}" data-tab="dt" onclick="swTab('${T}','dt')">Data</button>
      <button class="tab-btn" data-t="${T}" data-tab="bu" onclick="swTab('${T}','bu')">Budget</button>
      <button class="tab-btn" data-t="${T}" data-tab="it" onclick="swTab('${T}','it')">${isPro?'Itinerary':'Itin 🔒'}</button>
      <button class="tab-btn" data-t="${T}" data-tab="pt" onclick="swTab('${T}','pt')">${isPro?'Pro Tools':'Pro 🔒'}</button>
      <button class="tab-btn" data-t="${T}" data-tab="bk" onclick="swTab('${T}','bk')">Book</button>
    </div>`;

    /* OVERVIEW */
    H += `<div class="tab-pane on" id="${T}-ov">
      <div class="crowd-section">
        <div class="crowd-row"><span class="crowd-lbl">Crowd — ${month}</span><span class="crowd-pct" style="color:${cs<35?'#16BF96':cs<60?'#E09030':'#D84F4F'}">${cs}%</span></div>
        <div class="crowd-track"><div class="crowd-bar ${barCls}" style="width:0%" data-w="${cs}"></div></div>
        <div class="crowd-note">${cs<35 ? 'Great time to visit — well below average crowds' : cs<60 ? 'Moderate visitor numbers — manageable if you plan ahead' : 'Peak season — book early and visit popular spots at dawn'}</div>
      </div>
      <div class="desc" id="desc_${ci}">${enh && enh.desc ? enh.desc : (d.isGeneric ? 'Loading a quick overview from Wikipedia…' : d.interests.slice(0,3).join(', ')+' make '+d.name+' a rewarding destination for the '+travelStyle.split(' ')[0].toLowerCase()+' traveler in '+month+'.')}</div>
      ${enh && enh.tip ? `<div class="why-box"><strong>AI tip for ${month}</strong>${enh.tip}</div>` : ''}
      ${modeBox(d)}
      ${trackBar(d)}
      ${festLine(d, mi, month)}
      <div class="fest-line" id="pulse_${T}" style="display:none;color:var(--crim2)"></div>
      <div class="sec-label">🍽 Must-try food</div>
      <div class="food-list">${d.food.map(function(f){return `<span class="food-tag">${f}</span>`;}).join('')}</div>
      <div class="sec-label">💎 Hidden gems</div>
      <div class="gem-list">${d.gems.map(function(g){return `<span class="gem-tag"><span class="gem-dot"></span>${g}</span>`;}).join('')}</div>
      <div class="sec-label hx">🥷 Ninja hacks &amp; secret facts</div>
      <div class="hack-list">${buildHacks(d, mi, month).map(function(h){return `<div class="hack"><span class="hx-ic">${h.ic}</span><div><strong>${h.t}</strong>${h.x}</div></div>`;}).join('')}</div>
      <a class="yt-link" href="https://www.youtube.com/results?search_query=${encodeURIComponent(d.yt)}" target="_blank" rel="noopener">▶ Watch ${d.name} travel videos on YouTube</a>
    </div>`;

    /* DATA TAB */
    var maxC = Math.max.apply(null, d.crowd);
    H += `<div class="tab-pane" id="${T}-dt">
      <div class="info-card"><div class="info-flag">${flagIco}</div><div><div class="info-name">${d.country||d.region}</div><div class="info-detail">${(function(){var ci2=lookupCountryInfo(d.country);return (ci2?`Capital: <strong>${ci2.capital}</strong> &bull; `:'')+`Currency: <strong>${d.cur}</strong>`+(ci2?` &bull; Language: <strong>${ci2.language}</strong>`:'');})()}</div></div></div>
      <div class="visa-card"><div class="visa-ico">${d.visa.type.toLowerCase().indexOf('free')>=0?'🟢':d.visa.type.toLowerCase().indexOf('arrival')>=0?'🟡':'🔵'}</div><div><div class="visa-title">${d.visa.type}</div><div class="visa-cost">${d.visa.cost} &bull; ${d.visa.days} days</div><div class="visa-note">${d.visa.note}</div></div></div>
      ${metersBlock(d)}
      <div class="sec-label">📊 Monthly crowd chart</div>
      <div class="bar-chart">${d.crowd.map(function(cv,idx){
        var clr = cv<35?'#16BF96':cv<60?'#E09030':'#D84F4F';
        return `<div class="bc${idx===mi?' sel':''}"><div class="bc-bar" style="height:${(cv/maxC*100).toFixed(0)}%;background:${clr}"></div><div class="bc-lbl">${MO[idx]}</div></div>`;
      }).join('')}</div>
      <div class="sec-label">📅 Best months to visit</div>
      <div class="bm-grid">${MO.map(function(m,idx){
        var best = d.bestM.indexOf(idx+1)>=0; /* idx is 0-based (MO array), bestM is 1-based */
        return `<div class="bm${best?' best':''}${idx===mi?' sel':''}">${m}</div>`;
      }).join('')}</div>
    </div>`;

    /* BUDGET TAB */
    var brkItems = [['✈ Flights',d.brk.flights],['🏨 Stay',d.brk.stay],['🍜 Food',d.brk.food],['🎫 Activities',d.brk.act],['💬 Misc',d.brk.misc]];
    var brkTotal = brkItems.reduce(function(s,x){return s+x[1];},0);
    H += `<div class="tab-pane" id="${T}-bu">
      <div class="tier-row">
        <div class="tier"><div class="tier-lbl">Budget</div><div class="tier-val">${fmtMoney(d.cost.budget)}</div><div class="tier-note">Hostel &bull; street food</div></div>
        <div class="tier on"><div class="tier-lbl">Mid-range</div><div class="tier-val">${fmtMoney(d.cost.mid)}</div><div class="tier-note">3★ hotel &bull; restaurants</div></div>
        <div class="tier"><div class="tier-lbl">Luxury</div><div class="tier-val">${fmtMoney(d.cost.luxury)}</div><div class="tier-note">5★ &bull; private tours</div></div>
      </div>
      <div class="sec-label">Cost breakdown</div>
      <div class="brk-list">
        ${brkItems.map(function(item){
          var pct = Math.round(item[1]/brkTotal*100);
          return `<div class="brk-row"><div class="brk-lbl">${item[0]}</div><div class="brk-track"><div class="brk-fill" style="width:${pct}%"></div></div><div class="brk-val">${fmtMoney(item[1])}<span class="brk-pct">${pct}%</span></div></div>`;
        }).join('')}
        <div class="brk-row" style="border-top:1px solid rgba(255,255,255,.07);padding-top:6px;margin-top:2px"><div class="brk-lbl" style="font-weight:600;color:#EDE8DF">Total</div><div class="brk-track"><div class="brk-fill brk-fill-gold" style="width:100%"></div></div><div class="brk-val" style="color:#E8BA6C;font-weight:600">${fmtMoney(brkTotal)}</div></div>
      </div>
      <div class="sec-label">Local prices (${d.sym} ${d.cur})</div>
      <table class="price-table"><tbody>${Object.keys(d.local).map(function(k){return `<tr><td>${k.replace(/_/g,' ')}</td><td>${d.local[k]}</td></tr>`;}).join('')}</tbody></table>
    </div>`;

    /* ITINERARY TAB */
    H += `<div class="tab-pane" id="${T}-it">`;
    if(!isPro){
      H += `<div class="gate" onclick="openPay()"><span class="gate-ico">📅</span><div class="gate-title">Full ${Math.min(days,14)}-day itinerary — Pro only</div><div class="gate-sub">Detailed day-by-day plan with specific places, timings, local tips and restaurant picks. Built from our database, AI-enhanced if a key is added.</div><button class="gate-btn">Unlock for ${proPriceLabel(100)} →</button></div>`;
    } else {
      H += `<div id="${T}-iph" class="itin-ph"><div class="mini-spin"></div><span>Click below to build your ${idays}-day plan for ${d.name}</span></div><div id="${T}-ict" style="display:none"></div>`;
    }
    H += `</div>`;

    /* PRO TOOLS TAB */
    H += `<div class="tab-pane" id="${T}-pt">`;
    if(!isPro){
      H += `<div class="gate" onclick="openPay()"><span class="gate-ico">👑</span><div class="gate-title">Budget Tracker &bull; Packing List &bull; Compare Table &bull; WhatsApp Share</div><div class="gate-sub">${proPriceLabel(100)} one-time unlocks all Pro tools forever on this device.</div><button class="gate-btn">Unlock Pro → ${proPriceLabel(100)}</button></div>`;
    } else {
      H += `<div class="sub-tabs">
        <button class="stab on" data-p="${P2}" data-tab="bt" onclick="swSub('${P2}','bt')">💰 Budget</button>
        <button class="stab" data-p="${P2}" data-tab="pk" onclick="swSub('${P2}','pk')">🎒 Pack</button>
        <button class="stab" data-p="${P2}" data-tab="cm" onclick="swSub('${P2}','cm')">⚖ Compare</button>
        <button class="stab" data-p="${P2}" data-tab="ws" onclick="swSub('${P2}','ws')">💬 Share</button>
      </div>`;

      H += `<div class="stab-pane on" id="${P2}-bt">
        <div class="sec-label">Live budget tracker (${AC})</div>
        <div class="trk-cells">
          <div class="trk-cell"><div class="trk-lbl">Planned</div><div class="trk-val" id="${T}-tp">${fmtMoney(d.cost.mid)}</div></div>
          <div class="trk-cell"><div class="trk-lbl">Spent</div><div class="trk-val" style="color:#E09030" id="${T}-ts">0</div></div>
          <div class="trk-cell"><div class="trk-lbl">Remaining</div><div class="trk-val" style="color:#16BF96" id="${T}-tr">${fmtMoney(d.cost.mid)}</div></div>
          <div class="trk-cell"><div class="trk-lbl">Entries</div><div class="trk-val" id="${T}-te">0</div></div>
        </div>
        <div class="trk-bg"><div class="trk-fill" id="${T}-tb" style="width:0%"></div></div>
        <div style="font-size:10px;color:#4A4946;margin-bottom:8px">Used: <span id="${T}-tpct">0%</span></div>
        <div class="add-row">
          <select class="tfield" id="${T}-tc"><option>Food</option><option>Transport</option><option>Stay</option><option>Activities</option><option>Shopping</option><option>Other</option></select>
          <input class="tfield" type="number" id="${T}-ta" placeholder="Amount" min="0">
          <button class="add-btn" onclick="addSpend('${T}',${d.cost.mid})">+ Add</button>
        </div>
        <div class="log-list" id="${T}-tl"></div>
      </div>`;

      var packItems = ['Passport + visa docs','Travel insurance print','Sunscreen SPF 50','Insect repellent','Universal adapter','First aid kit','Reusable water bottle','Offline maps downloaded','Local currency small notes','Light breathable clothes','Rain jacket','Phone charger + powerbank'];
      H += `<div class="stab-pane" id="${P2}-pk">
        <div class="sec-label">Packing list for ${d.name}</div>
        <div class="pack-list">${packItems.map(function(item,i){return `<div class="pack-item" id="${T}-pi${i}" onclick="togPack('${T}-pi${i}')"><div class="pack-chk"></div><span class="pack-txt">${item}</span></div>`;}).join('')}</div>
        <p style="font-size:10px;color:#4A4946;margin-top:7px">Tap to mark as packed ✓</p>
      </div>`;

      var cmpRows = [
        ['Budget', fmtMoney(d.cost.budget), others[0]?fmtMoney(others[0].d.cost.budget):'—', others[1]?fmtMoney(others[1].d.cost.budget):'—'],
        ['Mid', fmtMoney(d.cost.mid), others[0]?fmtMoney(others[0].d.cost.mid):'—', others[1]?fmtMoney(others[1].d.cost.mid):'—'],
        ['Crowd '+month, cs+'%', others[0]?others[0].cs+'%':'—', others[1]?others[1].cs+'%':'—'],
        ['Visa', d.visa.type, others[0]?others[0].d.visa.type:'—', others[1]?others[1].d.visa.type:'—'],
        ['Currency', d.cur, others[0]?others[0].d.cur:'—', others[1]?others[1].d.cur:'—']
      ];
      H += `<div class="stab-pane" id="${P2}-cm">
        <div class="sec-label">Side-by-side comparison</div>
        <div style="overflow-x:auto"><table class="cmp-detail"><thead><tr><th>Feature</th><th>${d.name}</th>${others[0]?`<th>${others[0].d.name}</th>`:''}${others[1]?`<th>${others[1].d.name}</th>`:''}</tr></thead>
        <tbody>${cmpRows.map(function(row){return `<tr><td>${row[0]}</td><td>${row[1]}</td>${others[0]?`<td>${row[2]}</td>`:''}${others[1]?`<td>${row[3]}</td>`:''}</tr>`;}).join('')}</tbody></table></div>
      </div>`;

      H += `<div class="stab-pane" id="${P2}-ws">
        <div class="wa-card"><div class="wa-title">💬 Share on WhatsApp</div><div class="wa-sub">Send your ${d.name} trip details — budget, crowd, visa, food — to any contact.</div><a class="wa-btn" href="https://wa.me/?text=${waMsg}" target="_blank" rel="noopener">💬 Share Trip Plan</a></div>
      </div>`;
    }
    H += `</div>`;
    H += `</div>`; /* card-body end */

    /* BOOK TAB */
    H += `<div class="tab-pane" id="${T}-bk"><div class="card-body" style="padding-top:0">
      <div class="sec-label" style="margin-top:4px">Book this trip</div>
      ${rwBookGridHTML(origin, d.name, enc)}
    </div></div>`;

    /* ACTION BAR */
    H += `<div class="act-bar">`;
    if(isPro){
      H += `<button class="act-btn act-gold" onclick="buildItin('${T}','${d.name.replace(/'/g,"\\'")}', ${d.cost.mid}, ${idays})">📅 Load ${idays}-day Plan</button>`;
      H += `<button class="act-btn act-wa" onclick="swTab('${T}','pt');swSub('${P2}','ws')">💬 Share</button>`;
      H += `<button class="act-btn act-ghost" onclick="swTab('${T}','pt');swSub('${P2}','bt')">💰 Track</button>`;
    } else {
      H += `<button class="act-btn act-gold" onclick="openPay()">📅 Full Itinerary 🔒</button>`;
      H += `<button class="act-btn act-pm" onclick="openPay()">👑 Unlock Pro — ${proPriceLabel(100)}</button>`;
    }
    H += `<button class="act-btn act-ghost" onclick="swTab('${T}','bk')">✈️ Book</button>`;
    H += `</div></div>`; /* act-bar + card end */
  });

  H += `</div>`; /* card-list end */
  el('results').innerHTML = H;
  try{
    var top = results[0] && results[0].d;
    if(top){ pulseBump(top.name, month); results.forEach(function(r){ pulseShow(r.d.name, month, 'pulse_'+r.T); }); }
  }catch(e){ /* best-effort, ignore */ }

  setTimeout(function(){
    document.querySelectorAll('.crowd-bar[data-w]').forEach(function(bar){ bar.style.width = bar.dataset.w+'%'; });
  }, 100);

  /* Load real photos for every card — non-blocking, always resolves to something usable */
  results.forEach(function(r, ci){
    loadPhotosForCard(r.d, ci);
  });

  /* For generic (non-curated) results, pull a real description from Wikipedia */
  results.forEach(function(r, ci){
    var d = r.d;
    var enh = (aiData && aiData.e) ? aiData.e.find(function(x){ return x.id===d.id; })||null : null;
    if(enh && enh.desc) return; /* already have AI text, don't overwrite */
    if(!d.isGeneric) return;
    var wikiTitle = d.wiki || d.name.replace(/\s+/g,'_');
    fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(wikiTitle))
      .then(function(r2){ if(!r2.ok) throw new Error('404'); return r2.json(); })
      .then(function(s){
        var descEl = el('desc_'+ci);
        if(descEl && s.extract){
          var clean = s.extract.replace(/\([^)]*\)/g,'').split('. ').slice(0,3).join('. ');
          if(clean && !/\.$/.test(clean)) clean += '.';
          descEl.textContent = clean || descEl.textContent;
        }
      })
      .catch(function(){
        var descEl = el('desc_'+ci);
        if(descEl) descEl.textContent = 'Specific details for this destination are still being added to our database — the budget estimate above is a sensible starting point based on your inputs.';
      });
  });
}

/* TAB SWITCHING */
function swTab(T, tab){
  ['ov','dt','bu','it','pt','bk'].forEach(function(t){
    var pane = el(T+'-'+t);
    if(pane) pane.classList.toggle('on', t===tab);
  });
  document.querySelectorAll(`[data-t="${T}"]`).forEach(function(b){
    b.classList.toggle('on', b.dataset.tab===tab);
  });
}
function swSub(P2, tab){
  ['bt','pk','cm','ws'].forEach(function(t){
    var pane = el(P2+'-'+t);
    if(pane) pane.classList.toggle('on', t===tab);
  });
  document.querySelectorAll(`[data-p="${P2}"]`).forEach(function(b){
    b.classList.toggle('on', b.dataset.tab===tab);
  });
}

// DAY_TEMPLATES, buildItin, togDay moved to js/itinerary/build.js (Phase 5c)

/* BUDGET TRACKER */
function addSpend(T, costMid){
  var cat = el(T+'-tc').value;
  var amt = parseFloat(el(T+'-ta').value)||0;
  if(amt<=0){ showToast('Enter a valid amount'); return; }
  if(!spends[T]) spends[T]=[];
  spends[T].push({cat:cat, amt:amt});
  el(T+'-ta').value='';
  var total = spends[T].reduce(function(s,x){return s+x.amt;},0);
  var rate = (CURR.find(function(x){return x.c===AC;})||{r:1}).r;
  var budC = Math.round(costMid*rate);
  var sym = (CURR.find(function(x){return x.c===AC;})||{s:'₹'}).s;
  var rem = Math.max(0, budC-total);
  var pct = Math.min(100, Math.round(total/budC*100));
  function ge(sfx){ return el(T+'-'+sfx); }
  if(ge('ts')) ge('ts').innerHTML = sym+Math.round(total).toLocaleString();
  if(ge('tr')) ge('tr').innerHTML = sym+Math.round(rem).toLocaleString();
  if(ge('te')) ge('te').textContent = spends[T].length;
  if(ge('tb')) ge('tb').style.width = pct+'%';
  if(ge('tpct')) ge('tpct').textContent = pct+'%';
  var log = el(T+'-tl');
  if(log){
    var row = document.createElement('div');
    row.className = 'log-row';
    row.innerHTML = `<span>${cat}</span><span style="color:#E09030;font-weight:600">${sym}${Math.round(amt)}</span>`;
    log.appendChild(row); log.scrollTop = log.scrollHeight;
  }
}

function togPack(id){
  var item = el(id); if(!item) return;
  item.classList.toggle('done');
  var chk = item.querySelector('.pack-chk');
  if(chk) chk.innerHTML = item.classList.contains('done') ? '✓' : '';
}
/* LIGHTBOX */
function openLbox(src){ el('lboxImg').src=src; el('lightbox').classList.add('open'); document.body.style.overflow='hidden'; }
function closeLbox(){ el('lightbox').classList.remove('open'); document.body.style.overflow=''; }
