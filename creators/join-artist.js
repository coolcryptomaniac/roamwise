/* Join page: renders plans from artists-data.json and prepares an application message (WhatsApp / email / copy). No data leaves the browser until the artist sends it. */
(function () {
  'use strict';
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var WA = '919987379730', MAIL = 'founder@roamwise.co.in', planBox = document.getElementById('planBox'), planNote = document.getElementById('planNote');
  function card(p, k, hot) {
    return '<article class="plan' + (hot ? ' hot' : '') + '"><h3>' + esc(p.name) + '</h3><div class="pr">' + (p.price ? '&#8377;' + esc(p.price) + ' <small>one-time' + (p.days ? ' · ' + esc(p.days) + ' days' : '') + '</small>' : (k === 'thankyou' ? 'Optional <small>any amount, any time</small>' : 'Free')) + '</div><ul>' + (p.features || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></article>';
  }
  function plans(d) {
    var P = d.plans || {}, o = d.launchOffer || {}, ob = document.getElementById('offerBox'), sl = document.getElementById('spotsLeft');
    if (ob && o.active) ob.textContent = o.text;
    var used = d.artists.filter(function (a) { return a.plan === 'founding'; }).length;
    if (sl && o.limit) sl.textContent = used + ' of ' + o.limit + ' founding spots taken. Natasha and Jagriti are invited artists with the same features.';
    planBox.innerHTML = ['founding', 'thankyou'].filter(function (k) { return P[k]; }).map(function (k) { return card(P[k], k, k === 'founding'); }).join('');
    var later = document.getElementById('planLater'); if (later) later.innerHTML = ['free', 'autopilot', 'spotlight', 'premium'].filter(function (k) { return P[k]; }).map(function (k) { return card(P[k], k, k === 'premium'); }).join('');
    planNote.textContent = 'Later prices are planned and may change. They are one-time, never auto-renewed, and we confirm the amount and any tax on WhatsApp before you pay.';
  }
  fetch('/creators/artists-data.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(plans).catch(function () { planBox.innerHTML = '<p class="sa-note">Plans could not load. Free listing is always available: apply below.</p>'; });

  var form = document.getElementById('joinForm'), msg = document.getElementById('formMsg'), out = document.getElementById('outBox'), txt = document.getElementById('outText');
  function build(f) {
    var themes = f.themes.split(',').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 6);
    var app = { name: f.name.trim(), studio: f.studio.trim(), state: f.state.trim(), themes: themes, instagram: f.instagram.trim() || undefined, whatsapp: f.whatsapp.replace(/\D/g, '') || undefined, bio: f.bio.trim() || undefined, consent: true };
    var lines = ['Hello RoamWise, I would like to join the artists gallery.', '', 'Name: ' + app.name, 'Studio: ' + app.studio, 'Location: ' + app.state, 'Themes: ' + themes.join(', '), 'Plan: Founding artist (free)'];
    if (app.instagram) lines.push('Instagram: ' + app.instagram); if (app.whatsapp) lines.push('WhatsApp for buyers: ' + app.whatsapp); if (app.bio) lines.push('Bio: ' + app.bio);
    lines.push('', 'I confirm I made these paintings (or have the right to show them) and agree to display.', '', 'DATA: ' + JSON.stringify(app));
    return { text: lines.join('\n'), app: app };
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault(); var fd = new FormData(form), f = {}; fd.forEach(function (v, k) { f[k] = v; }); f.spot = fd.get('spot') === 'on'; f.consent = fd.get('consent') === 'on';
    f.name = f.name || ''; f.studio = f.studio || ''; f.state = f.state || ''; f.themes = f.themes || ''; f.instagram = f.instagram || ''; f.whatsapp = f.whatsapp || ''; f.bio = f.bio || '';
    var err = '';
    if (!f.name.trim() || !f.studio.trim() || !f.state.trim()) err = 'Please fill your name, studio and location.';
    else if (!f.themes.split(',').some(function (s) { return s.trim(); })) err = 'Add at least one theme.';
    else if (f.instagram && f.instagram.indexOf('https://') !== 0) err = 'Instagram link must start with https://';
    else if (f.whatsapp && !/^\d{10,15}$/.test(f.whatsapp.replace(/\D/g, ''))) err = 'WhatsApp must be 10 to 15 digits with country code, e.g. 919876543210.';
    else if (!f.consent) err = 'Please tick the confirmation so we can display your work.';
    if (err) { msg.textContent = err; out.hidden = true; return; }
    msg.textContent = ''; var b = build(f); txt.textContent = b.text; out.hidden = false;
    document.getElementById('sendWa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(b.text);
    document.getElementById('sendMail').href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Artist application: ' + b.app.name) + '&body=' + encodeURIComponent(b.text);
    out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  document.getElementById('copyBtn').addEventListener('click', function () {
    var t = txt.textContent, done = function () { msg.textContent = 'Copied. Paste it into WhatsApp or email.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { msg.textContent = 'Select the text above and copy it.'; }); else msg.textContent = 'Select the text above and copy it.';
  });
})();
