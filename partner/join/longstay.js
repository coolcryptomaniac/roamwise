/* Property join form add-on: optional long-stay / Nomad Match details, personal pre-signed MOU offers
   (?offer=ID from /partner/mou/offers.js), typed MOU signature, and prefill from the Nomad Match quick form
   or a signed MOU. Hooks into the main form script through window.rwJoin* functions. Nothing here sets
   admin-controlled fields: the speed test is stored as a link and stays unverified until RoamWise checks it. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var q = new URLSearchParams(location.search);
  var ANNEX = 'RW-PMOU-LS-2026-10-15-A1';
  var offers = window.RW_MOU_OFFERS || {};
  var offerId = (q.get('offer') || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);
  var offer = Object.prototype.hasOwnProperty.call(offers, offerId) ? offers[offerId] : null;
  var tierFn = null;
  var FIELDS = ['nmRooms', 'nmMin', 'nmR15', 'nmR30', 'nmR90', 'nmMbps', 'nmSpeedUrl', 'nmBackup', 'nmDesk', 'nmTeam', 'nmNotice', 'nmRateCard', 'mouSign'];
  var TICKS = ['nmOn', 'nmCallRoom', 'nmKitchen', 'nmCoworking', 'nmCommunity'];
  var INCL = ['Electricity', 'Wi-Fi', 'Two meals a day', 'Weekly housekeeping', 'Laundry', 'Coworking desk', 'Community kitchen'];

  function clip(v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n || 120); }
  function num(id) { var n = Number($(id).value); return Number.isFinite(n) && n > 0 ? Math.round(n) : 0; }
  function setIfEmpty(id, v) { var el = $(id); v = clip(v, 120); if (el && v && !el.value) el.value = v; }
  function mapType(t) {
    t = String(t || '');
    if (/hostel/i.test(t)) return 'Hostel';
    if (/homestay|guest|b&b|bed and/i.test(t)) return 'Family homestay';
    if (/hotel|resort/i.test(t)) return 'Hotel / resort';
    if (/coliving|cowork/i.test(t)) return 'Boutique stay';
    if (/villa|cottage|apartment|farm/i.test(t)) return 'Villa';
    return 'Other stay';
  }
  $('nmIncl').innerHTML = INCL.map(function (x, i) { return '<label><input type="checkbox" value="' + x + '"' + (i < 2 ? ' checked' : '') + '>' + x + '</label>'; }).join('');
  function includes() { return Array.prototype.map.call(document.querySelectorAll('#nmIncl input:checked'), function (x) { return x.value; }); }

  function profile() {
    var inc = includes();
    return {
      enabled: $('nmOn').checked, rooms: num('nmRooms'), minNights: Number($('nmMin').value) || 15,
      rate15: num('nmR15'), rate30: num('nmR30'), rate90: num('nmR90'), includes: inc,
      mbps: num('nmMbps'), speedTestUrl: '', backup: $('nmBackup').value, desk: $('nmDesk').value,
      callRoom: $('nmCallRoom').checked, kitchen: $('nmKitchen').checked || inc.indexOf('Community kitchen') >= 0, meals: inc.indexOf('Two meals a day') >= 0,
      laundry: inc.indexOf('Laundry') >= 0, coworking: $('nmCoworking').checked || inc.indexOf('Coworking desk') >= 0, community: $('nmCommunity').checked,
      teamMax: num('nmTeam'), earlyDeparturePolicy: clip($('nmNotice').value, 300), rateCard: clip($('nmRateCard').value, 800), verified: false
    };
  }
  function paintTier() {
    var box = $('nmFields'); box.hidden = !$('nmOn').checked;
    if (!tierFn || !$('nmOn').checked) { $('nmTier').textContent = ''; return; }
    var t = tierFn({ nomad: profile() });
    $('nmTier').innerHTML = '<b style="color:' + t.tier.color + '">' + t.tier.label + '</b> · ' + t.score + '/100 (self-check)' +
      (t.missing.length ? '<br><span class="helper">To reach the next tier: ' + t.missing.slice(0, 3).join('; ') + '.</span>' : '');
  }
  import('/nomads/nomad-core.mjs').then(function (m) { tierFn = m.nomadTier; paintTier(); }).catch(function () { /* tier preview is optional */ });
  document.getElementById('nomadBox').addEventListener('input', paintTier);
  document.getElementById('nomadBox').addEventListener('change', paintTier);

  /* ---- prefill: personal offer, Nomad Match quick form, or a signed MOU ---- */
  if (offer) {
    setIfEmpty('propertyName', offer.n);
    var hub = offer.hub || '';
    if (offer.city) { setIfEmpty('city', offer.city); setIfEmpty('area', offer.area || offer.c); }
    if (offer.o) setIfEmpty('ownerName', offer.o);
    if (offer.w) setIfEmpty('website', offer.w);
    setIfEmpty('city', hub && offer.c.indexOf(hub) >= 0 ? hub : (hub || offer.c));
    if (hub && offer.c !== hub) setIfEmpty('area', offer.c.replace(new RegExp(',?\\s*' + hub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), ''));
    $('propertyType').value = mapType(offer.reg || offer.t);
    if (offer.mb) $('nmMbps').value = offer.mb;
    if (offer.r30) $('nmR30').value = offer.r30;
    if (offer.r15) $('nmR15').value = offer.r15;
    if (offer.r90) $('nmR90').value = offer.r90;
    if (offer.rates) $('nmRateCard').value = String(offer.rates).slice(0, 800);
    if (offer.notice) $('nmNotice').value = String(offer.notice).slice(0, 300);
    if (Array.isArray(offer.incl)) document.querySelectorAll('#nmIncl input').forEach(function (x) { x.checked = offer.incl.indexOf(x.value) >= 0; });
    if (offer.bk) $('nmBackup').value = offer.bk;
    if (offer.dk) $('nmDesk').value = offer.dk;
    ['cr:nmCallRoom', 'kt:nmKitchen', 'cw:nmCoworking', 'cm:nmCommunity'].forEach(function (p) { var k = p.split(':'); if (offer[k[0]]) $(k[1]).checked = true; });
    if (offer.src === 'nomad-match' || offer.mb || offer.cw) { $('nmOn').checked = true; $('nomadBox').open = true; }
    $('inviteBadge').textContent = '✦ Personal invitation for ' + clip(offer.n, 60) + ' · RoamWise has already signed your MOU';
    $('publicNote').textContent = 'We filled in what we know from public sources. Please correct anything that is wrong.';
  }
  if (q.get('source') === 'nomad') {
    setIfEmpty('propertyName', q.get('n')); setIfEmpty('city', q.get('place')); setIfEmpty('ownerName', q.get('owner')); setIfEmpty('phone', q.get('tel'));
    ['rooms:nmRooms', 'mbps:nmMbps', 'rate30:nmR30'].forEach(function (p) { var k = p.split(':'), v = Number(q.get(k[0])); if (v > 0) $(k[1]).value = Math.round(v); });
    if (q.get('backup') === 'full') $('nmBackup').value = 'full';
    if (q.get('desk') === 'ergonomic') $('nmDesk').value = 'ergonomic';
    if (q.get('kitchen') === '1') $('nmKitchen').checked = true;
    $('nmOn').checked = true; $('nomadBox').open = true;
    $('inviteBadge').textContent = '✦ Nomad Match details carried over · add the rest below';
  }
  if (q.get('signer')) { setIfEmpty('ownerName', q.get('signer')); setIfEmpty('mouSign', q.get('signer')); }
  if (q.get('tel')) setIfEmpty('phone', q.get('tel'));
  try {
    var saved = JSON.parse(sessionStorage.getItem('rwJoinDraft') || 'null');
    if (saved && saved.longstay) {
      FIELDS.forEach(function (k) { if (typeof saved.longstay[k] === 'string' && $(k)) $(k).value = saved.longstay[k]; });
      TICKS.forEach(function (k) { if ($(k)) $(k).checked = !!saved.longstay[k]; });
      if (Array.isArray(saved.longstay.incl)) document.querySelectorAll('#nmIncl input').forEach(function (x) { x.checked = saved.longstay.incl.indexOf(x.value) >= 0; });
      if ($('nmOn').checked) $('nomadBox').open = true;
    }
  } catch (e) { /* drafts are best effort */ }
  paintTier();

  /* ---- MOU link shows the property its own filled-in MOU ---- */
  function mouParams() {
    var m = new URLSearchParams();
    if (offer) m.set('offer', offerId);
    else { if ($('propertyName').value.trim()) m.set('property', $('propertyName').value.trim()); if ($('city').value.trim()) m.set('city', $('city').value.trim()); }
    if ($('ownerName').value.trim()) m.set('owner', $('ownerName').value.trim());
    var p = profile();
    if (p.enabled) {
      m.set('ls', '1');
      if (p.rate15) m.set('r15', p.rate15); if (p.rate30) m.set('r30', p.rate30); if (p.rate90) m.set('r90', p.rate90);
      if (p.includes.length) m.set('incl', p.includes.join(', '));
      if (p.rooms) m.set('rooms', p.rooms); m.set('min', p.minNights);
      if (p.mbps) m.set('mb', p.mbps); if (p.backup !== 'none') m.set('bk', p.backup);
      if (p.earlyDeparturePolicy) m.set('notice', p.earlyDeparturePolicy);
      if (p.rateCard && !offer) m.set('card', p.rateCard.slice(0, 400));
    }
    return m;
  }
  var mouLink = document.querySelector('label[for="mou"] a, #mou + span a') || document.querySelector('a[href="../mou/"]');
  if (mouLink) mouLink.addEventListener('click', function () { this.href = '../mou/?' + mouParams().toString(); });

  /* ---- hooks used by the main form script ---- */
  window.rwJoinValidate = function (step) {
    if (step === 1 && $('nmOn').checked) {
      if (!num('nmR30') && !num('nmR15') && !num('nmR90')) { $('nmR30').focus(); return 'Long stays: add at least one long-stay rate (1 month is the most useful), or untick long stays for now.'; }
      var su = $('nmSpeedUrl').value.trim();
      if (su) { try { if (new URL(su).protocol !== 'https:') throw Error(); } catch (e) { $('nmSpeedUrl').focus(); return 'Long stays: the speed-test link must start with https://, or leave it blank.'; } }
    }
    if (step === 2 && clip($('mouSign').value, 80).length < 3) { $('mouSign').focus(); return 'Please type your full name to sign the MOU.'; }
    return '';
  };
  window.rwJoinDraftExtra = function (d) {
    var ls = {}; FIELDS.forEach(function (k) { ls[k] = $(k).value; }); TICKS.forEach(function (k) { ls[k] = $(k).checked; }); ls.incl = includes(); d.longstay = ls;
  };
  window.rwJoinExtra = function (doc) {
    var now = new Date().toISOString(), p = profile();
    doc.onboarding = doc.onboarding || {};
    doc.onboarding.mouSignedName = clip($('mouSign').value, 80);
    doc.onboarding.mouSignedAt = now;
    try { doc.onboarding.mouSignedServerAt = firebase.firestore.FieldValue.serverTimestamp(); } catch (e) { /* client time still recorded */ }
    if (offer) { doc.onboarding.mouOfferId = offerId; doc.onboarding.mouPreSignedByRoamWise = true; doc.onboarding.source = 'mou-offer'; }
    if (p.enabled) {
      var su = $('nmSpeedUrl').value.trim();
      p.speedTestUrl = /^https:\/\//.test(su) ? su.slice(0, 500) : '';
      if (tierFn) { var t = tierFn({ nomad: p }); p.selfCheck = { score: t.score, tier: t.tier.id }; }
      p.annexVersion = ANNEX; p.updatedAt = now;
      doc.nomad = p;
      doc.onboarding.longStayAnnexVersion = ANNEX;
      doc.onboarding.longStayAnnexAcceptedAt = now;
    }
    window.rwJoinSigned = { at: now, name: doc.onboarding.mouSignedName, desig: { owner: 'Owner', manager: 'Manager', authorized: 'Authorised by the owner' }[$('ownerRole').value] || 'Owner' };
  };
  window.rwJoinDone = function () {
    var s = window.rwJoinSigned; if (!s) return;
    var m = mouParams(); m.set('s', s.name); m.set('d', s.desig); m.set('at', s.at);
    var a = $('doneMou'); a.href = '../mou/?' + m.toString(); a.hidden = false;
  };
})();
