// @ts-nocheck
/* ==================== COPILOT: EVENT TRIP ANSWERS ====================
   "Plan a trip around DGTL India (...)" requests come from the music-events
   section in index.html, which exposes its verified list as
   window.RW_MUSIC_EVENTS. The facts (name, dates, venue, source link) are
   already curated there, so the answer is built from them directly: it is
   correct with no AI call, costs nothing, and still works when the managed-AI
   allowance is used up. It never states a price, a timing or a travel time
   that is not in the event data, and it points to the organiser page for
   anything that can change.
   Pure functions + one HTML builder; classic-script globals, no modules. */

var RW_MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];

/* "13–14 November 2026" -> {d1,d2,m,y}; "22–26 October 2026"; null if unparseable. */
function rwEventDates(when){
  var m = String(when||'').match(/(\d{1,2})\s*(?:[\u2013\-]\s*(\d{1,2}))?\s*([A-Za-z]+)\s+(\d{4})/);
  if(!m) return null;
  var mi = RW_MONTHS.indexOf(m[3].toLowerCase());
  if(mi < 0) return null;
  var d1 = parseInt(m[1],10), d2 = m[2] ? parseInt(m[2],10) : d1;
  return { d1:d1, d2:d2, m:mi, y:parseInt(m[4],10), days:Math.max(1, d2-d1+1) };
}

/* Venue string -> list of {venue, city}. "A, X and B, Y" is two venues. */
function rwEventVenues(place){
  return String(place||'').split(/\s+and\s+/i).map(function(seg){
    var p = seg.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    var city = p.length >= 3 ? p[1] : (p.length === 2 ? p[1] : p[0]);
    return { venue: seg.trim(), city: city || '' };
  }).filter(function(v){ return v.city; });
}

function rwEventOrigin(t){
  var m = String(t||'').match(/starting city is\s+([^.\n]{2,60}?)(?:\.|\n|$)/i);
  return m ? m[1].trim() : '';
}

/* Find the event a message is about. Matches the exact prompt the events
   section writes, or any message that names an event with trip words. */
function rwFindEvent(t){
  var list = (typeof window!=='undefined' && window.RW_MUSIC_EVENTS) || [];
  var low = String(t||'').toLowerCase();
  if(!list.length || !/\b(plan|trip|around|get there|reach|stay|going to|attend|tickets?)\b/.test(low)) return null;
  for(var i=0;i<list.length;i++){
    if(low.indexOf(String(list[i].name).toLowerCase()) >= 0) return list[i];
  }
  return null;
}

function rwEventTripAnswer(t, now){
  var ev = rwFindEvent(t);
  if(!ev) return null;
  var origin = rwEventOrigin(t);
  var dt = rwEventDates(ev.when);
  var venues = rwEventVenues(ev.place);
  var oLow = origin.toLowerCase();
  var home = origin ? venues.filter(function(v){ return v.city.toLowerCase().indexOf(oLow) >= 0 || oLow.indexOf(v.city.toLowerCase()) >= 0; })[0] : null;
  var target = home || venues[0] || { venue: ev.place, city: ev.place };
  var today = now || new Date();
  var ended = ev.end && new Date(ev.end + 'T23:59:59+05:30') < today;
  var e = (typeof escHtml==='function') ? escHtml : function(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
  var ea = (typeof escHtmlAttr==='function') ? escHtmlAttr : function(s){ return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;'); };

  var rows = [];
  if(ended){
    rows.push('This event has already finished (' + e(ev.when) + '). Check the organiser page for the next edition.');
  }else{
    /* How to get there */
    if(home && venues.length === 1){
      rows.push('<b>Getting there:</b> you are already in ' + e(home.city) + '. Use the local metro or a cab, and leave extra time on event nights.');
    }else if(home){
      rows.push('<b>Getting there:</b> you start in ' + e(home.city) + ', which hosts one of the venues. For the other city compare flights, trains and buses on the booking sites, since this event weekend will fill up.');
    }else if(origin){
      rows.push('<b>Getting there:</b> compare flights, trains and buses from ' + e(origin) + ' to ' + e(venues.map(function(v){return v.city;}).join(' or ')) + ' on the booking sites. I do not quote live fares or schedules here; book early because event weekends fill up.');
    }else{
      rows.push('<b>Getting there:</b> tell me your starting city and I will tailor the route. Compare flights, trains and buses on the booking sites and book early.');
    }
    /* Where to stay */
    rows.push('<b>Where to stay:</b> choose a place within a short ride of ' + e(target.venue) + ', ideally near a metro or rail stop, so late-night exits are easy. Check the cancellation terms because dates can move.');
    /* How many days */
    if(dt){
      var festival = dt.days;
      var plan = festival <= 3 ? (festival + 1) + ' days / ' + festival + ' nights (arrive the day before, leave the morning after)' : '3 to 4 days within the ' + festival + '-day run';
      rows.push('<b>How many days:</b> ' + e(plan) + '.');
    }
    if(venues.length > 1){
      rows.push('<b>Two cities:</b> ' + e(ev.blurb.split('. ').filter(function(s){ return /source does not say|check the organiser/i.test(s); })[0] || 'Confirm which day is in which city before you book.'));
    }
    /* Budget */
    rows.push('<b>Budget:</b> I cannot quote live prices. Add up the ticket (see the official page), travel both ways, ' + (dt ? dt.days : 'a few') + ' nights of stay, food, local transport and a 10% buffer, then compare it in the Budget tool below.');
    rows.push('<b>Before you pay:</b> confirm ticket, entry and set timings on the official page. The dates and venues above come from the source linked below.');
  }

  var links = '<a class="tact" href="' + e(ev.link) + '" target="_blank" rel="noopener" style="text-decoration:none">' + e(ev.linkLabel) + ' \u2197</a>'
    + (ev.tickets ? ' <a class="tact" href="' + e(ev.tickets) + '" target="_blank" rel="noopener" style="text-decoration:none">Tickets \u2197</a>' : '');
  var html = '<div class="tk-card"><div class="tk-head" style="background:linear-gradient(145deg,#2a1f5c,#182746)"><div class="tk-place">' + e(ev.name) + '</div>'
    + '<div class="tk-meta">' + e(ev.when) + ' \u00b7 ' + e(ev.place) + '</div></div>'
    + '<div class="tk-sec">' + rows.map(function(r){ return '<div class="tk-bul"><span>' + r + '</span></div>'; }).join('')
    + '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">' + links + '</div></div></div>';
  return { html: html, event: ev, city: target.city, origin: origin, venues: venues };
}

/* copilotSend hook: answer a festival/concert trip request from the verified
   event list. Returns true when it answered. */
function rwEventTripReply(bubble, intents, t){
  try{
    var ev = rwEventTripAnswer(t);
    if(!ev) return false;
    intents.dest = ev.city || intents.dest; intents._eventTrip = true;
    intents._recommendCount = undefined; intents._recommendMonth = undefined;
    try{ track('event_plans'); }catch(e){ /* anonymous counter */ }
    cpFinish(bubble, ev.html, intents, t);
    return true;
  }catch(e){ return false; }
}
