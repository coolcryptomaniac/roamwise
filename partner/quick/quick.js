/* Shared logic for the short links /ct/ (creator terms) and /ls/ (long-stay terms). No account and nothing
   stored: the property's answers are sent to RoamWise as a WhatsApp message or an email they press send on. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var mode = document.body.dataset.mode;
  var q = new URLSearchParams(location.search);
  var cfg = window.RW_PARTNER_CONFIG || {};
  var WA = String((cfg.chat && cfg.chat.supportWhatsapp) || '919987379730').replace(/\D/g, '');
  var MAIL = cfg.supportEmail || 'support@roamwise.co.in';
  var props = window.RW_QUICK_PROPS || {};
  var slug = String(q.get('p') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
  var known = Object.prototype.hasOwnProperty.call(props, slug) ? props[slug] : null;
  function clip(v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n || 120); }
  if (known) { $('prop').value = known.n; $('place').value = known.c; $('who').textContent = known.n; }
  else if (q.get('p')) $('prop').value = clip(q.get('p'), 100);
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var tierFn = null;

  function checked(sel) { return Array.prototype.map.call(document.querySelectorAll(sel + ' input:checked'), function (x) { return x.value; }); }
  function v(id) { return clip($(id).value, 300); }
  function rs(id) { var n = Math.round(Number($(id).value) || 0); return n > 0 ? 'Rs ' + n.toLocaleString('en-IN') : 'not given'; }

  if (mode === 'ct') {
    $('months').innerHTML = MON.map(function (m, i) { return '<label><input type="checkbox" value="' + m + '"' + ([1, 2, 3, 7, 8, 9, 11, 12].indexOf(i + 1) >= 0 ? ' checked' : '') + '>' + m + '</label>'; }).join('');
    $('travel').addEventListener('change', function () { $('upToBox').hidden = this.value !== 'We pay travel'; });
  } else {
    var INC = ['Electricity', 'Wi-Fi', 'Two meals a day', 'Weekly housekeeping', 'Laundry', 'Coworking desk', 'Community kitchen'];
    $('incl').innerHTML = INC.map(function (x, i) { return '<label><input type="checkbox" value="' + x + '"' + (i < 2 ? ' checked' : '') + '>' + x + '</label>'; }).join('');
    var profile = function () {
      var inc = checked('#incl');
      return { mbps: Number($('mbps').value) || 0, backup: $('backup').value, desk: $('desk').value, callRoom: $('callRoom').checked,
        kitchen: $('kitchen').checked || inc.indexOf('Community kitchen') >= 0, meals: inc.indexOf('Two meals a day') >= 0,
        laundry: inc.indexOf('Laundry') >= 0, coworking: $('cowork').checked || inc.indexOf('Coworking desk') >= 0,
        community: $('community').checked, rate30: Number($('r30').value) || 0 };
    };
    var paint = function () {
      if (!tierFn) return; var t = tierFn({ nomad: profile() });
      $('tier').innerHTML = '<b style="color:' + t.tier.color + '">' + t.tier.label + '</b> · ' + t.score + '/100 (self-check)' + (t.missing.length ? '<br><span class="help">Next: ' + t.missing.slice(0, 3).join('; ') + '</span>' : '');
    };
    import('/nomads/nomad-core.mjs').then(function (m) { tierFn = m.nomadTier; paint(); }).catch(function () {});
    document.querySelector('form').addEventListener('input', paint); document.querySelector('form').addEventListener('change', paint);
  }

  function message() {
    var head = [(mode === 'ct' ? 'CREATOR TERMS' : 'LONG-STAY TERMS') + ' for ' + (v('prop') || '(property)') + (v('place') ? ', ' + v('place') : ''),
      'Filled by: ' + (v('owner') || '(name)') + (v('phone') ? ', ' + v('phone') : '')];
    var body;
    if (mode === 'ct') {
      body = ['Free stay for: ' + v('guests'), 'Nights per creator stay: ' + v('nights'), 'Food: ' + v('food'),
        'Travel: ' + v('travel') + ($('travel').value === 'We pay travel' ? ' (up to ' + rs('upTo') + ')' : ''),
        'Content wanted: ' + v('pkg'), 'Bonus per guest booking the creator brings: ' + (Number($('perf').value) || 0) + '% (cap ' + rs('cap') + ', paid after the guest stays)',
        'Creator stays per month: ' + (Number($('perMonth').value) || 1), 'Offer to: ' + v('reach'),
        'Months: ' + (checked('#months').join(', ') || 'none'), 'Weekend nights kept for paying guests: ' + ($('weekdays').checked ? 'yes (Sun to Thu only)' : 'no'),
        v('notes') ? 'Notes: ' + v('notes') : ''];
    } else {
      var t = tierFn ? tierFn({ nomad: profile() }) : null;
      body = ['Rooms for long stays: ' + (v('rooms') || 'not given') + ' · minimum stay: ' + v('min') + ' · largest team: ' + (v('team') || 'not given'),
        'Rates per room, all-inclusive: 15 nights ' + rs('r15') + ' · 1 month ' + rs('r30') + ' · per month on 3 months ' + rs('r90'),
        'Included: ' + (checked('#incl').join(', ') || 'nothing ticked'), 'Other rates: ' + (v('card') || '-'),
        'Wi-Fi: ' + ((Number($('mbps').value) || 0) + ' Mbps') + (v('speed') ? ' · speed test: ' + v('speed') : ''),
        'Power backup: ' + $('backup').selectedOptions[0].text + ' · desk: ' + $('desk').selectedOptions[0].text,
        'Call spot: ' + ($('callRoom').checked ? 'yes' : 'no') + ' · kitchen: ' + ($('kitchen').checked ? 'yes' : 'no') + ' · shared work area: ' + ($('cowork').checked ? 'yes' : 'no') + ' · community: ' + ($('community').checked ? 'yes' : 'no'),
        'Early departure and notice: ' + (v('notice') || 'not given'), t ? 'Self-check: ' + t.tier.label + ' (' + t.score + '/100)' : ''];
    }
    return head.concat(body).filter(Boolean).concat(['I confirm these are the terms I will honour.']).join('\n').slice(0, 1800);
  }
  function ok() {
    if (!v('prop') || !v('owner') || String($('phone').value).replace(/\D/g, '').length < 10) { $('status').textContent = 'Please add the property, your name and a 10-digit phone number.'; return false; }
    if (!$('confirm').checked) { $('status').textContent = 'Please tick the confirmation.'; return false; }
    $('status').textContent = ''; return true;
  }
  $('sendWa').addEventListener('click', function (e) { if (!ok()) { e.preventDefault(); return; } this.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(message()); });
  $('sendMail').addEventListener('click', function (e) { if (!ok()) { e.preventDefault(); return; } this.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent((mode === 'ct' ? 'Creator terms: ' : 'Long-stay terms: ') + v('prop')) + '&body=' + encodeURIComponent(message()); });
})();
