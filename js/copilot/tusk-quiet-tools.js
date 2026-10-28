// @ts-nocheck
/* ============================================================================
   AILON TUSK — direct booking, long stays, mountain conditions, Quiet Himalaya
   ============================================================================
   Extends the tool belt in agent.js (loaded right after it). Same rules as
   agent.js: tools only expose what the app can really do. Nothing here books
   or pays. A direct booking is a coded WhatsApp request to the host
   (direct-booking.js); long-stay prices come only from the property's own
   nomad record; advisories come only from conditions-data.js with sources.
   ========================================================================== */
(function(){
  if(typeof RW_AGENT_TOOLS === 'undefined' || typeof RW_AGENT_IMPL === 'undefined') return;
  function fn(name, description, properties, required){
    RW_AGENT_TOOLS.splice(RW_AGENT_TOOLS.length - 1, 0, { type:'function', function:{ name:name, description:description,
      parameters:{ type:'object', properties:properties || {}, required:required || [] } } });
  }
  function partner(id){
    return (typeof rwLivePartners === 'function' ? rwLivePartners() : []).filter(function(p){ return p.id === id; })[0] || null;
  }

  fn('mountain_conditions',
    'Road closures, snow and temple closing dates for a Himalayan place and trip date, from RoamWise’s sourced advisories. Call before suggesting or requesting any Uttarakhand or Himachal stay or route, and tell the traveller every item it returns with its source.',
    { place:{type:'string'}, date:{type:'string', description:'Trip date YYYY-MM-DD (optional)'} }, ['place']);
  RW_AGENT_IMPL.mountain_conditions = function(a){
    if(!a.place) return { ok:false, error:'place is required' };
    var c = typeof rwConditionsFor === 'function' ? rwConditionsFor(a.place, a.date) : [];
    if(!c.length) return { ok:true, found:0, note:'No advisory on file. Still suggest checking local police or IMD updates in winter.' };
    return { ok:true, found:c.length, advisories:c.map(function(x){ return { say:x.label, detail:x.detail, official:x.official, source:x.source, url:x.sourceUrl }; }) };
  };

  fn('quote_long_stay',
    'Long-stay (15 nights to 3 months) prices for a verified partner, taken only from the property’s own nomad record, with Wi-Fi speed, power backup and call-room facts and whether they are verified. Use for workations, monthly stays, writers and researchers.',
    { partnerId:{type:'string'} }, ['partnerId']);
  RW_AGENT_IMPL.quote_long_stay = function(a){
    var p = partner(a.partnerId);
    if(!p) return { ok:false, error:'Not a verified partner. Use find_partners or quiet_stays first.' };
    var n = p.nomad;
    if(!n || !n.enabled) return { ok:false, error:p.name + ' has not published long-stay rates. Offer a direct booking request asking for a monthly rate.' };
    var plans = window.RWNomadPlans ? RWNomadPlans.plans(n) : [];
    if(!plans.length) return { ok:false, error:'No long-stay rate on file for ' + p.name + '.' };
    return { ok:true, property:p.name, zone:p.zone, minNights:n.minNights || 1,
      plans:plans.map(function(x){ return { label:x.label, total:x.total, perNight:x.perNight, note:x.derived ? x.note : undefined }; }),
      wifiMbps:n.mbps || null, powerBackup:n.backup || null, callRoom:!!n.callRoom, meals:!!n.meals,
      verified:!!n.verified,
      note:(n.verified ? 'Facilities verified by RoamWise.' : 'Facilities are host-stated, not yet verified.') + ' Rates are the property’s own; RoamWise adds Rs 0. The host confirms the final total before payment.' };
  };

  fn('request_direct_booking',
    'One-to-one booking with the host: sends a coded WhatsApp request with dates and guests to a verified partner, after checking mountain advisories. Ask for check-in date, nights and guests first. The host confirms; the guest pays the property directly. Nothing is booked or paid by this tool.',
    { partnerId:{type:'string'}, checkIn:{type:'string', description:'YYYY-MM-DD'}, nights:{type:'number'}, guests:{type:'number'}, rooms:{type:'number'}, budget:{type:'number'}, note:{type:'string'} },
    ['partnerId','checkIn','guests']);
  RW_AGENT_IMPL.request_direct_booking = function(a){
    var p = partner(a.partnerId);
    if(!p) return { ok:false, error:'That is not a verified, bookable partner. Use find_partners or quiet_stays first.' };
    if(typeof rwDirectRequest !== 'function') return { ok:false, error:'direct booking unavailable' };
    var r = rwDirectRequest(p, a);
    if(!r.ok) return r;
    try{ window.open(r.url, '_blank', 'noopener'); }catch(e){ /* popup blocked: link is still returned */ }
    return { ok:true, code:r.code, opened:true, link:r.url,
      advisories:(r.conditions || []).map(function(x){ return x.label + ' (source: ' + x.source + ')'; }),
      note:'WhatsApp is open with the request. Status: requested. When the host replies, tell me "host confirmed" and I will update it. Pay the property directly; RoamWise adds Rs 0.' };
  };

  fn('my_direct_bookings', 'List the traveller’s one-to-one booking requests on this device with their status (requested, confirmed, declined, cancelled).', {}, []);
  RW_AGENT_IMPL.my_direct_bookings = function(){
    var l = typeof rwDirectList === 'function' ? rwDirectList() : [];
    return l.length ? { ok:true, count:l.length, bookings:l.slice(0, 10) } : { ok:true, count:0, note:'No direct booking requests on this device yet.' };
  };

  fn('update_direct_booking', 'Record what the host said about a direct booking: confirmed, declined or cancelled.',
    { code:{type:'string'}, status:{type:'string', enum:['confirmed','declined','cancelled']} }, ['code','status']);
  RW_AGENT_IMPL.update_direct_booking = function(a){
    return typeof rwDirectSetStatus === 'function' ? rwDirectSetStatus(String(a.code || '').toUpperCase(), a.status) : { ok:false, error:'unavailable' };
  };

  fn('quiet_stays',
    'RoamWise’s Quiet Himalaya collection: peaceful stays for readers, writers, researchers and yoga or meditation travellers, plus sourced places nearby to study or meditate. Optional tag: silence, focus, reading, mind, meals, nature.',
    { tag:{type:'string', enum:['silence','focus','reading','mind','meals','nature']} }, []);
  RW_AGENT_IMPL.quiet_stays = function(a){
    var Q = window.RW_QUIET;
    if(!Q) return { ok:false, error:'collection unavailable' };
    var all = window.RW_PARTNERS || [], live = {};
    (typeof rwLivePartners === 'function' ? rwLivePartners() : []).forEach(function(p){ live[p.id] = 1; });
    var picks = Q.picks.filter(function(x){ return !a.tag || x.tags.indexOf(a.tag) !== -1; }).map(function(x){
      var p = all.filter(function(y){ return y.id === x.partnerId; })[0];
      return p ? { partnerId:p.id, name:p.name, zone:p.zone, area:p.area, why:x.why, tags:x.tags,
        status:p.verified, canRequest:!!live[p.id], hasLongStay:!!(p.nomad && p.nomad.enabled) } : null;
    }).filter(Boolean);
    var nearby = Q.nearby.filter(function(x){ return !a.tag || x.tags.indexOf(a.tag) !== -1; });
    return { ok:true, page:'https://roamwise.co.in/quiet/', stays:picks, nearby:nearby,
      note:'Yoga and meditation are nearby places with sources, not on-site amenities, unless a host says otherwise.' };
  };
})();
