/* "Kala", an original RoamWise art-guide character who presents a painting. It is NOT an avatar of any real artist and never speaks as one.
   Optional voice uses the browser's own speech synthesis; nothing is uploaded. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var stage = $('agStage'); if (!stage) return;
  var items = [], cur = null, speaking = false;
  function pitch(it) {
    if (it.kind === 'work') {
      var how = it.type === 'Print' ? 'a print' : 'an original painting';
      return 'Namaste, I am Kala, the RoamWise art guide. This is ' + it.title + ', ' + how + ' by ' + it.artist + ', ' + it.studio + '. ' +
        (it.price === 'Price on request' ? 'Its price is on request from the studio. ' : 'The studio lists it at ' + it.price + '. ') +
        'Prices and availability are confirmed by the artist, so please check before you pay. Tap Connect to message the artist directly.';
    }
    return 'Namaste, I am Kala, the RoamWise art guide. ' + it.artist + ' paints in this range: ' + it.title + '. ' + it.detail + ' It starts at ' + it.price + ', as an indicative range. The artist confirms the final price, size and timeline. Tap Connect to ask her about it.';
  }
  function show() {
    var it = items[+$('agPick').value]; cur = it;
    var pic = $('agPic'); if (it.img) { pic.setAttribute('href', it.img); pic.style.display = ''; $('agOm').style.display = 'none'; } else { pic.style.display = 'none'; $('agOm').style.display = ''; }
    $('agText').textContent = pitch(it);
    var c = $('agConnect'); c.href = it.link; c.textContent = it.cta;
    stopVoice();
  }
  function stopVoice() { if ('speechSynthesis' in window) speechSynthesis.cancel(); speaking = false; stage.classList.remove('ag-speaking'); $('agSpeak').textContent = 'Hear Kala explain'; }
  function speak() {
    if (!('speechSynthesis' in window)) { $('agNote').textContent = 'Voice is not available in this browser. The text above says the same thing.'; return; }
    if (speaking) { stopVoice(); return; }
    var u = new SpeechSynthesisUtterance($('agText').textContent); u.lang = 'en-IN'; u.rate = .95;
    u.onend = u.onerror = stopVoice; speaking = true; stage.classList.add('ag-speaking'); $('agSpeak').textContent = 'Stop'; speechSynthesis.speak(u);
  }
  var svg = $('agFig');
  stage.addEventListener('pointermove', function (e) { var r = stage.getBoundingClientRect(); svg.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 24 + 'deg'); svg.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 14 + 'deg'); });
  stage.addEventListener('pointerleave', function () { svg.style.setProperty('--ry', '0deg'); svg.style.setProperty('--rx', '0deg'); });
  fetch('/creators/artists-data.json').then(function (r) { return r.json(); }).then(function (d) {
    d.artists.forEach(function (a) {
      (a.artworks || []).filter(function (w) { return w.status === 'Available'; }).forEach(function (w) {
        items.push({ kind: 'work', title: w.title, type: w.type, price: /\d/.test(w.price) ? w.price : 'Price on request', artist: a.name, studio: a.studio, img: w.image, cta: 'Connect on WhatsApp', link: 'https://wa.me/' + a.whatsapp + '?text=' + encodeURIComponent('Namaste ' + a.studio + ', Kala (RoamWise art guide) showed me "' + w.title + '". I would like to know more and buy.') });
      });
      (a.tiers || []).filter(function (t) { return t.sacred; }).forEach(function (t) { items.push({ kind: 'tier', title: t.title, detail: t.detail, price: t.price, artist: a.name, studio: a.studio, img: null, cta: 'Connect on Instagram', link: a.instagram }); });
    });
    $('agPick').innerHTML = items.map(function (x, i) { return '<option value="' + i + '">' + esc(x.title) + ' · ' + esc(x.artist) + '</option>'; }).join('');
    $('agPick').addEventListener('change', show); $('agSpeak').addEventListener('click', speak); show();
  }).catch(function () { $('agText').textContent = 'The guide could not load right now.'; });
  window.addEventListener('pagehide', stopVoice);
})();
