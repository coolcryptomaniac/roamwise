/* Quiet Himalaya page. Reads RW_QUIET picks (quiet-data.js) and the partner records they point at
   (partners-data.js). Booking is one-to-one: a coded WhatsApp request through rwDirectRequest
   (js/booking/direct-booking.js), with road and temple advisories shown first. No payment here. */
(function () {
  'use strict';
  var Q = window.RW_QUIET || { tags: [], picks: [], nearby: [], pledge: [] };
  var byId = {};
  (window.RW_PARTNERS || []).forEach(function (p) { byId[p.id] = p; });
  var tagLabel = {};
  Q.tags.forEach(function (t) { tagLabel[t.id] = t.icon + ' ' + t.label; });
  var active = '';

  function $(id) { return document.getElementById(id); }
  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function inDays(n) {
    var d = new Date(); d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function statusOf(p) {
    if (p.verified === 'signed') return { cls: 'signed', text: 'Signed with RoamWise' };
    if (p.verified === 'founder-approved') return { cls: 'founder', text: 'Founder-introduced · enquiries only' };
    return { cls: 'listed', text: 'Listed · not yet signed' };
  }
  function waRoute(p) {
    if (typeof rwBookingRoutes !== 'function') return null;
    if (p.verified !== 'signed' && p.verified !== 'founder-approved') return null;
    if (p.listingReady !== true) return null;
    return rwBookingRoutes(p).filter(function (r) { return r.type === 'whatsapp'; })[0] || null;
  }

  function bookForm(p) {
    var f = make('form', 'qh-book');
    f.setAttribute('autocomplete', 'off');
    var lab = function (text, input) { var l = make('label', '', text); l.appendChild(input); return l; };
    var date = make('input'); date.type = 'date'; date.required = true; date.min = inDays(0); date.value = inDays(14);
    var nights = make('input'); nights.type = 'number'; nights.min = '1'; nights.max = '90'; nights.value = '3';
    var guests = make('input'); guests.type = 'number'; guests.min = '1'; guests.max = '20'; guests.value = '2';
    f.appendChild(lab('Check-in', date)); f.appendChild(lab('Nights', nights)); f.appendChild(lab('Guests', guests));
    var cond = make('div');
    var go = make('button', 'qh-btn', 'Request on WhatsApp'); go.type = 'submit';
    var msg = make('div', 'qh-msg'); msg.setAttribute('role', 'status');
    f.appendChild(cond); f.appendChild(go); f.appendChild(msg);
    var showCond = function () {
      var c = typeof rwConditionsFor === 'function' ? rwConditionsFor([p.zone, p.area].join(' '), date.value) : [];
      cond.innerHTML = c.length && window.RWConditions ? RWConditions.html(c) : '';
      cond.style.gridColumn = '1/-1';
    };
    date.addEventListener('change', showCond); showCond();
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var r = typeof rwDirectRequest === 'function'
        ? rwDirectRequest(p, { checkIn: date.value, nights: +nights.value, guests: +guests.value, note: 'Found you in RoamWise Quiet Himalaya. A quiet room would be ideal.' })
        : { ok: false, error: 'Booking desk did not load. Please refresh.' };
      if (!r.ok) { msg.className = 'qh-msg err'; msg.textContent = r.error; return; }
      msg.className = 'qh-msg';
      msg.textContent = 'Opening WhatsApp. Your booking code is ' + r.code + '. Nothing is booked or paid until the host confirms.';
      try { window.open(r.url, '_blank', 'noopener'); } catch (err) { location.href = r.url; }
    });
    return f;
  }

  function card(pick) {
    var p = byId[pick.partnerId];
    if (!p) return null;
    var c = make('article', 'qh-card');
    c.setAttribute('data-tags', pick.tags.join(' '));
    var st = statusOf(p);
    c.appendChild(make('span', 'qh-badge ' + st.cls, st.text));
    c.appendChild(make('h3', '', p.name));
    c.appendChild(make('div', 'qh-area', [p.area, p.zone].filter(Boolean).join(', ')));
    var tags = make('div', 'qh-tags');
    pick.tags.forEach(function (t) { if (tagLabel[t]) tags.appendChild(make('span', '', tagLabel[t])); });
    c.appendChild(tags);
    c.appendChild(make('p', '', pick.why));
    var n = p.nomad;
    if (n && n.enabled) {
      var nums = make('div', 'qh-nums');
      if (n.mbps) nums.appendChild(make('span', '', 'Wi-Fi ' + n.mbps + ' Mbps' + (n.verified ? ' (verified)' : ' (host-stated)')));
      var plans = window.RWNomadPlans ? RWNomadPlans.plans(n) : [];
      plans.filter(function (x) { return x.id === '1m' || x.id === '15n'; }).forEach(function (x) {
        var s = make('span'); s.appendChild(document.createTextNode(x.label + ' ')); s.appendChild(make('b', '', 'Rs ' + x.total.toLocaleString('en-IN')));
        nums.appendChild(s);
      });
      if (nums.childNodes.length) c.appendChild(nums);
    }
    var wa = waRoute(p);
    if (wa) c.appendChild(bookForm(p));
    else {
      var ask = make('a', 'qh-btn ghost small', 'Ask RoamWise to check rates');
      ask.href = 'mailto:support@roamwise.co.in?subject=' + encodeURIComponent('Quiet Himalaya: ' + p.name);
      c.appendChild(ask);
    }
    return c;
  }

  function renderFilters() {
    var box = $('filters');
    var all = [{ id: '', icon: '', label: 'All' }].concat(Q.tags);
    all.forEach(function (t) {
      var b = make('button', '', (t.icon ? t.icon + ' ' : '') + t.label);
      b.type = 'button'; b.setAttribute('aria-pressed', String(t.id === active));
      b.addEventListener('click', function () {
        active = t.id;
        Array.prototype.forEach.call(box.children, function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        applyFilter();
      });
      box.appendChild(b);
    });
  }
  function applyFilter() {
    Array.prototype.forEach.call($('grid').children, function (c) {
      var tags = (c.getAttribute('data-tags') || '').split(' ');
      c.hidden = !!active && tags.indexOf(active) === -1;
    });
  }
  function renderNearby() {
    var g = $('nearbyGrid');
    Q.nearby.forEach(function (x) {
      var c = make('article', 'qh-card');
      c.appendChild(make('h3', '', x.name));
      c.appendChild(make('div', 'qh-area', x.place));
      c.appendChild(make('p', '', x.what));
      var a = make('a', 'qh-src', 'Source'); a.href = x.sourceUrl; a.target = '_blank'; a.rel = 'noopener';
      c.appendChild(a);
      g.appendChild(c);
    });
  }
  function renderPledge() {
    var ul = $('pledge');
    Q.pledge.forEach(function (t) { ul.appendChild(make('li', '', t)); });
  }

  var grid = $('grid');
  Q.picks.forEach(function (pick) { var c = card(pick); if (c) grid.appendChild(c); });
  if (!grid.children.length) grid.appendChild(make('p', '', 'The collection is being refreshed. Email support@roamwise.co.in and we will suggest a stay.'));
  renderFilters(); renderNearby(); renderPledge();
})();
