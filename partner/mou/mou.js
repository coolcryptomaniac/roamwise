/* RoamWise property MOU page: fills the property schedule, shows RoamWise's pre-signed block for a
   personal offer (?offer=ID from offers.js), and lets the property sign. The signing date is set
   automatically at the moment of signing and the MOU takes effect that day.
   Legacy query parameters (property, owner, city, plan, booking_model, listing_fee) still work. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var q = new URLSearchParams(location.search);
  var cfg = window.RW_PARTNER_CONFIG || {};
  var WA = String((cfg.chat && cfg.chat.supportWhatsapp) || '').replace(/\D/g, '');
  var MAIL = cfg.supportEmail || 'support@roamwise.co.in';
  var offers = window.RW_MOU_OFFERS || {};
  var offerId = (q.get('offer') || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);
  var offer = Object.prototype.hasOwnProperty.call(offers, offerId) ? offers[offerId] : null;
  function clip(v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n || 120); }
  function set(id, t) { var el = $(id); if (el) el.textContent = t; }
  function money(v) { var n = Math.round(Number(v) || 0); return n > 0 ? '₹' + n.toLocaleString('en-IN') : 'To be completed'; }
  function ist(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' IST'; }

  /* ---- who and what ---- */
  var property = clip(offer ? offer.n : q.get('property'), 110);
  var city = clip(offer && offer.city ? offer.city : offer ? (offer.hub && offer.c.indexOf(offer.hub) < 0 ? offer.c + ', ' + offer.hub : offer.c) : q.get('city'), 90);
  var owner = clip(q.get('owner') || q.get('s') || (offer && offer.o ? offer.o + (offer.od ? ', ' + offer.od : '') : ''), 80);
  if (property) { set('propertyName', property); set('scheduleProperty', property); document.title = 'RoamWise MOU · ' + property; }
  if (owner) { set('ownerName', owner); set('scheduleOwner', owner); }
  if (city) { set('cityName', city); set('scheduleCity', city); } else if ($('cityWrap')) $('cityWrap').hidden = true;
  var plans = { free: ['Partner Free', 7], desk: ['Partner Desk', 5], annual: ['Partner Annual', 5], three_year: ['Partner 3 Year', 5] };
  var plan = plans[(q.get('plan') || 'free').toLowerCase()] || plans.free, net = q.get('booking_model') === 'net', fee = Number(q.get('listing_fee') || 0);
  set('schedulePlan', net ? 'Not applicable while protected net-rate method is selected' : plan[0] + ' · ' + plan[1] + '% on completed stays');
  set('scheduleNet', net ? 'Selected · confidential net amount must be attached' : 'Not selected');
  set('scheduleFee', fee > 0 ? '₹' + fee.toLocaleString('en-IN') : 'Not selected');

  /* ---- long stays (Annexure A1) ---- */
  var ls = q.get('ls') === '1' || !!offer;
  var rate = function (k) { return Number(q.get(k) || (offer && offer[k]) || 0); };
  set('lsEnabled', ls ? 'Enabled: stays of 15 nights or more, Annexure A1 applies' : 'Not enabled');
  document.querySelectorAll('tr.ls').forEach(function (tr) { tr.hidden = !ls; });
  if (ls) {
    set('lsRates', '15 nights: ' + money(rate('r15')) + ' · 1 month: ' + money(rate('r30')) + ' · 3 months (per month): ' + money(rate('r90')) + (offer && offer.rates ? '. Full rate card: ' + clip(offer.rates, 600) : q.get('card') ? '. Other rates: ' + clip(q.get('card'), 400) : ''));
    var incl = clip(q.get('incl') || (offer && Array.isArray(offer.incl) ? offer.incl.join(', ') : ''), 200);
    if (incl) set('lsIncl', incl);
    var rooms = clip(q.get('rooms'), 6), min = clip(q.get('min'), 6);
    if (rooms || min) set('lsRooms', (rooms ? rooms + ' room(s)' : 'Rooms to be completed') + ' · minimum ' + (min ? min + ' nights' : '15 nights'));
    var mb = Number(q.get('mb') || (offer && offer.mb) || 0), bk = clip(q.get('bk') || (offer && offer.bk), 10);
    if (mb || bk) set('lsWork', (mb ? mb + ' Mbps listed' : 'Speed to be confirmed') + ' · power backup: ' + (bk === 'full' ? 'whole work area' : bk === 'router' ? 'router only' : 'to be confirmed') + ' · verified after a speed-test screenshot');
    var notice = clip(q.get('notice') || (offer && offer.notice), 300); if (notice) set('lsNotice', notice);
  }

  /* ---- RoamWise side: pre-signed only for a genuine personal offer ---- */
  if (offer) {
    $('rwPresigned').hidden = false; $('rwPending').hidden = true;
    set('offerId', 'RW-OFFER-' + offerId.toUpperCase()); set('offerFor', property);
  }

  /* ---- property side ---- */
  function signedState() {
    var at = q.get('at'), s = clip(q.get('s'), 80);
    return at && s && !isNaN(new Date(at)) ? { at: at, name: s, desig: clip(q.get('d'), 40) || 'Owner' } : null;
  }
  function ref(at) { return (offer ? 'RW-OFFER-' + offerId.toUpperCase() : 'RW-MOU') + '-' + at.replace(/\D/g, '').slice(0, 12); }
  function link() { return location.origin + location.pathname + '?' + q.toString(); }
  function renderSigned(st, phone) {
    $('acceptForm').hidden = true; $('propSigned').hidden = false;
    set('propSignName', st.name); set('propName2', st.name); set('propDesig', st.desig); set('propDate', ist(st.at)); set('propRef', ref(st.at));
    set('scheduleOwner', st.name + ' (' + st.desig + ')'); set('ownerName', st.name);
    var day = new Date(st.at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' });
    set('effDate', day);
    var b = $('execBanner'); b.hidden = false;
    b.textContent = 'Signed by ' + st.name + ' (' + st.desig + ') on ' + ist(st.at) + (offer ? ', together with RoamWise\'s pre-signed offer' : '') + '. This MOU is in effect from ' + day + '.';
    var msg = 'MOU signed for ' + (property || 'our property') + (city ? ', ' + city : '') + '.\nSigned by: ' + st.name + ' (' + st.desig + ')' + (phone ? '\nPhone: ' + phone : '') + '\nSigned on: ' + ist(st.at) + '\nReference: ' + ref(st.at) + '\nSigned copy: ' + link();
    var wa = $('sendWa');
    if (WA.length >= 11) wa.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg); else wa.hidden = true;
    $('sendMail').href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Signed MOU: ' + (property || 'property') + ' · ' + ref(st.at)) + '&body=' + encodeURIComponent(msg);
    var jq = new URLSearchParams(); if (offer) jq.set('offer', offerId); else { if (property) jq.set('n', property); if (city) jq.set('city', city); }
    jq.set('signer', st.name); if (phone) jq.set('tel', phone);
    $('toJoin').href = '../join/?' + jq.toString();
    $('afterSign').hidden = false;
  }
  var st = signedState();
  if (st) renderSigned(st, '');
  $('acceptForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = clip($('aName').value, 80), phone = $('aPhone').value.replace(/[^\d+]/g, '').slice(0, 16);
    if (name.length < 3) { $('aName').focus(); return; }
    if (phone.replace(/\D/g, '').length < 10) { $('aPhone').focus(); $('aPhone').setCustomValidity('Enter a 10-digit number'); $('aPhone').reportValidity(); return; }
    if (!$('aOk').checked) { $('aOk').reportValidity(); return; }
    var now = { at: new Date().toISOString(), name: name, desig: $('aDesig').value };
    q.set('s', now.name); q.set('d', now.desig); q.set('at', now.at);
    if (property && !offer) q.set('property', property);
    history.replaceState(null, '', '?' + q.toString());
    renderSigned(now, phone);
    $('afterSign').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('aPhone').addEventListener('input', function () { this.setCustomValidity(''); });
})();
