/* ============================================================================
   /booking-safety/ — offline scam checker, official booking sites and the
   RoamWise-verified stays in Uttarakhand. Nothing typed leaves the device.
   ========================================================================= */
(function () {
  'use strict';
  var D = window.RWTSDom;
  var S = window.RWScamCheck;
  var el = D.el;
  var $ = function (id) { return document.getElementById(id); };
  var TITLE = {
    official: 'Official site', roamwise: 'This is RoamWise', 'high-risk': 'High risk: do not pay',
    caution: 'Be careful: warning signs', unknown: 'We can\'t vouch for this'
  };

  function show(res) {
    var box = D.clear($('ts-verdict'));
    if (res.type === 'empty') return;
    var kids = [el('h3', { text: TITLE[res.verdict] || 'Result' })];
    if (res.host) kids.push(el('p', { class: 'ts-meta', text: 'Address: ' + res.host }));
    if (res.reasons.length) kids.push(el('ul', {}, res.reasons.map(function (r) { return el('li', { text: r }); })));
    if (res.advice.length) kids.push(el('p', { class: 'ts-meta', text: 'What to do' }), el('ul', {}, res.advice.map(function (r) { return el('li', { text: r }); })));
    box.appendChild(el('div', { class: 'ts-verdict v-' + res.verdict, role: 'status' }, kids));
  }

  function renderOfficial() {
    var box = $('ts-official');
    var why = {
      'heliyatra.irctc.co.in': 'Kedarnath helicopter tickets. The only genuine online seller.',
      'irctc.co.in': 'Trains to Haridwar, Dehradun, Kathgodam and Tanakpur.',
      'registrationandtouristcare.uk.gov.in': 'Free Char Dham and Hemkund Sahib registration.',
      'uttarakhandtourism.gov.in': 'Official state tourism information.',
      'badrinath-kedarnath.gov.in': 'Temple dates, puja bookings and notices.',
      'kmvn.gov.in': 'Kumaon state tourist rest houses and Adi Kailash yatra.',
      'gmvnonline.com': 'Garhwal state tourist rest houses.',
      'uttarastays.com': 'State-listed homestays.'
    };
    S.OFFICIAL.filter(function (o) { return !o.roamwise; }).forEach(function (o) {
      box.appendChild(el('article', { class: 'ts-card' }, [
        el('h3', { text: o.name }),
        el('p', { text: why[o.host] || '' }),
        el('p', { class: 'ts-links' }, [D.link(o.host, 'https://' + o.host + '/', true)])
      ]));
    });
  }

  var UK_ZONES = ['almora', 'nainital', 'lansdowne', 'kausani', 'ranikhet', 'mussoorie', 'rishikesh', 'dehradun', 'bhimtal', 'mukteshwar', 'munsiyari', 'pithoragarh', 'chopta', 'auli', 'corbett'];
  function renderPartners() {
    var box = $('ts-partners');
    var eligible = typeof window.rwStayPublicEligible === 'function' ? window.rwStayPublicEligible : function () { return false; };
    var list = (window.RW_PARTNERS || []).filter(function (p) {
      var z = String(p.zone || '').toLowerCase();
      return p.cat === 'stay' && p.verified === 'signed' && eligible(p) && UK_ZONES.some(function (w) { return z.indexOf(w) !== -1; });
    });
    if (!list.length) { box.appendChild(el('p', { class: 'ts-note', text: 'Our Uttarakhand partner list is being updated.' })); return; }
    list.forEach(function (p) {
      var slug = String(p.zone || '').toLowerCase().replace(/[^a-z]+/g, '-');
      box.appendChild(el('article', { class: 'ts-card' }, [
        el('div', { class: 'ts-tags' }, [el('span', { class: 'ts-badge is-official', text: 'RoamWise partner · agreement signed' })]),
        el('h3', { text: p.name }),
        el('p', { class: 'ts-meta', text: [p.area, p.zone].filter(Boolean).join(' · ') }),
        el('p', { class: 'ts-links' }, [D.link('See on RoamWise', ['almora', 'lansdowne', 'tirthan-valley'].indexOf(slug) !== -1 ? '/stays/' + slug + '/' : '/')])
      ]));
    });
  }

  function init() {
    $('ts-scam-form').addEventListener('submit', function (e) {
      e.preventDefault();
      show(S.classify($('ts-input').value, $('ts-ctx').value));
    });
    $('ts-ctx').addEventListener('change', function () { if ($('ts-input').value.trim()) show(S.classify($('ts-input').value, $('ts-ctx').value)); });
    renderOfficial();
    renderPartners();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
