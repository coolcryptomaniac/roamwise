// @ts-nocheck
/* ==================== TUSK DIRECT OFFERS: bookable answers, not guesses ====================
   When a traveller asks Ailon Tusk about honeymoons, family holidays, destination weddings, circuits, or
   the partner resorts in Corbett, Manali and Gir, Tusk answers in one short line plus a swipeable row of
   cards built ONLY from the live price API (/stays/rates): package name, nights, the property, the
   from-price and a button that opens that package's own checkout. Nothing is typed by an AI model, so
   prices, properties and advance rules cannot be invented.
   Dates in the message ("12 to 15 Dec", "20 Jan for 3 nights") are carried into the checkout link.
   Loaded before user-memory.js; rwTuskPreAnswer calls rwTuskOffersReply first. Classic script. */

var RW_OFFERS_API = 'https://roamwise-api.founder-f53.workers.dev/stays/rates';
var _rwOffersCache = null, _rwOffersAt = 0;

function rwOffersLoad(){
  if(_rwOffersCache && Date.now() - _rwOffersAt < 10 * 60 * 1000) return Promise.resolve(_rwOffersCache);
  return fetch(RW_OFFERS_API, { method: 'GET' }).then(function(r){ if(!r.ok) throw new Error('rates ' + r.status); return r.json(); })
    .then(function(d){ _rwOffersCache = d; _rwOffersAt = Date.now(); return d; });
}

/* Which offers the message asks for. Returns null when this is not an offers question. */
var RW_OFFER_STAYS = {
  tattwaa: /tattwa+|tatwa/i, nanau: /\bnanau\b/i, padma: /\bpadma\b/i, aramness: /arama?ness|\bkothi\b/i
};
function rwOffersIntent(raw){
  var t = String(raw || '').toLowerCase();
  if(!t || t.length > 400) return null;
  var want = { groups: [], places: [], stays: [] };
  if(/honey ?moon|couple|romantic|anniversary|babymoon/.test(t)) want.groups.push('honeymoon');
  if(/wedding|shaadi|shadi|pheras|elope|marriage|mehendi|sangeet/.test(t)) want.groups.push('wedding');
  if(/family|kids|children|parents|school holiday/.test(t)) want.groups.push('family');
  if(/circuit|combo|hop|both|corbett.{0,30}manali|manali.{0,30}corbett|jungle.{0,20}snow/.test(t)) want.groups.push('circuit');
  if(/christmas|new year|festive|nye\b/.test(t)) want.groups.push('festive');
  if(/corbett|jim corbett|ramnagar/.test(t)) want.places.push('Corbett');
  if(/manali|kullu|solang/.test(t)) want.places.push('Manali');
  if(/\bgir\b|sasan|lion safari|asiatic lion/.test(t)) want.places.push('Gir');
  Object.keys(RW_OFFER_STAYS).forEach(function(k){ if(RW_OFFER_STAYS[k].test(t)) want.stays.push(k); });
  var asksToBuy = /\b(book|package|packages|deal|deals|offer|offers|price|cost|how much|stay|resort|villa|plan|holiday|trip|getaway|budget)\b/.test(t);
  var strong = want.groups.indexOf('wedding') > -1 || want.stays.length > 0;
  if(!strong && !(asksToBuy && (want.groups.length || want.places.length))) return null;
  /* A pure "what is the history of Corbett" question stays with the guide. */
  if(!strong && /\b(history|who was|why is|weather|temperature|how far|distance|route|train|flight)\b/.test(t) && !/\b(book|package|price)\b/.test(t)) return null;
  return want;
}

function rwOffersEsc(s){
  return (typeof esc2 === 'function') ? esc2(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}
function rwOffersInr(n){ return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN'); }

var RW_OFFER_PLACE_STAYS = { Corbett: ['tattwaa', 'nanau'], Manali: ['padma'], Gir: ['aramness'] };
function rwOffersPick(data, want){
  var pk = (data && Array.isArray(data.packages) ? data.packages : []).filter(function(k){ return k.open !== false; });
  var stayIds = function(k){
    var ids = (k.properties || []).map(function(p){ return p.id; });
    if(!ids.length) Object.keys(RW_OFFER_PLACE_STAYS).forEach(function(pl){ if(k.id.indexOf(pl.toLowerCase()) === 0 || (k.id === 'jungle-to-snow' && pl !== 'Gir') || (k.id === 'family-forest-snow' && pl !== 'Gir')) ids = ids.concat(RW_OFFER_PLACE_STAYS[pl]); });
    return ids;
  };
  var wantStays = want.stays.slice();
  want.places.forEach(function(pl){ wantStays = wantStays.concat(RW_OFFER_PLACE_STAYS[pl] || []); });
  var isGroup = function(k, g){ return k.group === g || (g === 'circuit' && stayIds(k).length > 1) || (g === 'festive' && /christmas|new year/i.test(k.name)); };
  /* A named place or resort is a hard filter; the kind of trip then narrows it. */
  var list = wantStays.length ? pk.filter(function(k){ return stayIds(k).some(function(id){ return wantStays.indexOf(id) > -1; }); }) : pk;
  if(want.groups.length){
    var g = list.filter(function(k){ return want.groups.some(function(x){ return isGroup(k, x); }); });
    if(g.length || !wantStays.length) list = g;
  }
  return list.sort(function(a, b){ return (b.hot ? 1 : 0) - (a.hot ? 1 : 0) || ((a.from ? a.from.total : 9e9) - (b.from ? b.from.total : 9e9)); }).slice(0, 6);
}

function rwOffersStayCards(data, want, dates){
  var stays = (data && data.stays) || {}, out = [];
  var ids = want.stays.slice();
  if(!ids.length) want.places.forEach(function(p){
    Object.keys(stays).forEach(function(id){ var s = stays[id]; if(s && s.kind === 'amor' && String(s.name + ' ' + (s.place || '')).toLowerCase().indexOf(p.toLowerCase()) > -1 && ids.indexOf(id) < 0) ids.push(id); });
  });
  ids.forEach(function(id){
    var s = stays[id]; if(!s || s.kind !== 'amor') return;
    var min = Infinity;
    Object.keys(s.rooms || {}).forEach(function(r){ var v = s.rooms[r].perNight || {}; Object.keys(v).forEach(function(p){ if(v[p] < min) min = v[p]; }); });
    var href = '/packages/amor-checkout.html?stay=' + encodeURIComponent(id) + (dates ? '&checkin=' + dates.checkIn + '&checkout=' + dates.checkOut : '');
    out.push(rwOffersCard('🏨 ' + s.name, (s.place ? s.place + ' · ' : '') + 'pick your room and meals', isFinite(min) ? 'From ' + rwOffersInr(min) + '/night' : 'See today’s price', href, 'Book this stay →'));
  });
  return out;
}

function rwOffersCard(title, sub, price, href, cta){
  var e = rwOffersEsc;
  return '<a href="' + e(href) + '" onclick="try{track(\'tusk_direct_offer\')}catch(x){}" style="flex:0 0 min(74vw,230px);scroll-snap-align:start;display:flex;flex-direction:column;gap:5px;text-decoration:none;color:var(--t1,#fff);background:#221631;border:1px solid #816b84;border-radius:14px;padding:12px">'
    + '<b style="font-size:13.5px;line-height:1.3">' + e(title) + '</b>'
    + '<span style="font-size:11.5px;color:var(--t2,#dac9dc);line-height:1.4">' + e(sub) + '</span>'
    + '<span style="font-weight:800;color:#ffcb7e;font-size:13px">' + e(price) + '</span>'
    + '<span style="margin-top:auto;font-size:12px;font-weight:800;color:#201426;background:linear-gradient(100deg,#ffd08a,#e9a864);border-radius:9px;padding:7px 9px;text-align:center">' + e(cta) + '</span></a>';
}

function rwOffersHTML(data, want, raw){
  var dates = (typeof rwSdParseDates === 'function') ? rwSdParseDates(raw) : null;
  var picks = rwOffersPick(data, want);
  var cards = picks.map(function(k){
    var where = (k.properties || []).map(function(p){ return p.name; }).join(' → ');
    var href = '/packages/amor-checkout.html?package=' + encodeURIComponent(k.id) + (dates ? '&checkin=' + dates.checkIn : '');
    return rwOffersCard(k.name, k.nightsLabel + (where ? ' · ' + where : ''), k.from ? 'From ' + rwOffersInr(k.from.total) + ' · all taxes' : 'See today’s price', href, 'Pick dates & book →');
  }).concat(rwOffersStayCards(data, want, dates));
  if(!cards.length) return null;
  var lead = want.groups.indexOf('wedding') > -1 ? 'Destination weddings at Padma Villa, Manali: whole villa, meals and a wedding budget, approved by the property.'
    : want.groups.indexOf('honeymoon') > -1 ? 'Here are honeymoon stays you can book directly, prices for your dates at checkout.'
    : want.groups.indexOf('family') > -1 ? 'Family holidays you can book directly, all taxes included.'
    : 'Book these directly with RoamWise, all taxes included.';
  return '<div class="tk-card tk-mini"><div class="tk-sec"><div style="font-size:13px;line-height:1.5;margin-bottom:8px">' + rwOffersEsc(lead)
    + ' Pay a 25–50% advance or in full; if a stay cannot be confirmed you get a full refund.</div>'
    + '<div aria-label="Bookable packages" style="display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 0 8px">' + cards.join('') + '</div>'
    + '<div class="tk-chips" style="margin-top:4px"><button class="tk-chip" onclick="var i=document.getElementById(\'heroInput\')||document.getElementById(\'cpInput\');if(i){i.value=\'Compare these packages in more detail\';try{copilotSend(!!document.getElementById(\'heroInput\'))}catch(x){}}">More detail</button>'
    + '<a class="tk-chip" href="mailto:founder@roamwise.co.in?subject=' + encodeURIComponent('Package enquiry') + '">Ask a planner</a></div></div></div>';
}

/* copilotSend hook (via rwTuskPreAnswer). Returns true when it answers. */
function rwTuskOffersReply(bubble, intents, t){
  if(/more detail|compare these|itinerary|day by day|day-by-day/i.test(String(t || ''))) return false;   /* long answers only when asked */
  var want = rwOffersIntent(t);
  if(!want) return false;
  intents._offers = true;
  rwOffersLoad().then(function(data){
    var html = rwOffersHTML(data, want, t);
    if(!html) html = '<div class="tk-card tk-mini"><div class="tk-sec">No package matches that yet. <a href="/#rwSalesCarousels">See all bookable stays and packages</a>, or tell me the place, dates and budget.</div></div>';
    cpFinish(bubble, html, intents, t);
  }).catch(function(){
    cpFinish(bubble, '<div class="tk-card tk-mini"><div class="tk-sec">I could not load today’s prices. <a href="/#rwSalesCarousels">Open the packages on the homepage</a>; every card shows the live price.</div></div>', intents, t);
  });
  return true;
}
