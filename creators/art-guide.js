/* "Kala": an original illustrated RoamWise guide. NOT an avatar of any real artist; never speaks as one.
   Changes outfit to match the selected painting (palette read from the image in-browser, or a deity-themed preset).
   Optional voice uses the browser's speech synthesis; nothing is uploaded. Exposes window.RWKala for the assistant. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var stage = $('agStage'); if (!stage) return;
  var items = [], cur = null, speaking = false, listeners = [], fig = $('agFig');
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hsl2hex(h, s, l) { s /= 100; l /= 100; var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l), f = function (n) { var v = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return Math.round(255 * v).toString(16).padStart(2, '0'); }; return '#' + f(0) + f(8) + f(4); }
  function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0, s = 0; if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; } return [h, s * 100, l * 100]; }
  var PRESETS = [[/kali|durga|shakti|devi|maa/i, 4, 'saree'], [/saraswati/i, 48, 'saree'], [/shiv|nandi|mahadev|manimanash|kaal|moksha|cosmic/i, 228, 'anarkali'], [/ram|hanuman|maryada/i, 28, 'anarkali'], [/yantra/i, 215, 'anarkali']];
  function dress(h, sacred, seed) {
    var main = hsl2hex(h, 52, 30), acc = hsl2hex((h + 28) % 360, 55, 46), trim = '#e8ba6c';
    fig.style.setProperty('--o1', main); fig.style.setProperty('--o2', acc); fig.style.setProperty('--o3', trim);
    fig.setAttribute('data-style', sacred ? (seed % 2 ? '1' : '0') : '2');
    if (!still) { fig.classList.remove('ag-change'); void fig.getBoundingClientRect(); fig.classList.add('ag-change'); }
  }
  function outfitFor(it) {
    var seed = 0; for (var i = 0; i < it.title.length; i++) seed += it.title.charCodeAt(i);
    var preset = null; PRESETS.forEach(function (p) { if (!preset && p[0].test(it.title + ' ' + (it.detail || ''))) preset = p; });
    var sacred = it.sacred !== false;
    if (it.img) {
      var im = new Image(); im.onload = function () {
        try {
          var c = document.createElement('canvas'); c.width = c.height = 24; var x = c.getContext('2d'); x.drawImage(im, 0, 0, 24, 24); var d = x.getImageData(0, 0, 24, 24).data, bins = {};
          for (var j = 0; j < d.length; j += 4) { var hs = rgb2hsl(d[j], d[j + 1], d[j + 2]); if (hs[1] < 25 || hs[2] < 12 || hs[2] > 92) continue; var k = Math.round(hs[0] / 20); bins[k] = (bins[k] || 0) + hs[1] * (1 - Math.abs(hs[2] - 50) / 60); }
          var best = Object.keys(bins).sort(function (a, b) { return bins[b] - bins[a]; })[0];
          dress(best === undefined ? (preset ? preset[1] : 28) : (+best * 20) % 360, sacred, seed);
        } catch (e) { dress(preset ? preset[1] : 28, sacred, seed); }
      }; im.onerror = function () { dress(preset ? preset[1] : 28, sacred, seed); }; im.src = it.img;
    } else dress(preset ? preset[1] : 28, sacred, seed);
  }
  function pitch(it) {
    if (it.kind === 'work') {
      var how = it.type === 'Print' ? 'a print' : 'an original painting';
      return 'Namaste, I am Kala, the RoamWise art guide. This is ' + it.title + ', ' + how + ' by ' + it.artist + ', ' + it.studio + '. ' + (it.price === 'Price on request' ? 'Its price is on request from the studio. ' : 'The studio lists it at ' + it.price + '. ') + 'Prices and availability are confirmed by the artist, so please check before you pay. Tap Connect to message the artist directly.';
    }
    return 'Namaste, I am Kala, the RoamWise art guide. ' + it.artist + ' paints in this range: ' + it.title + '. ' + it.detail + ' It starts at ' + it.price + ', as an indicative range. The artist confirms the final price, size and timeline. Tap Connect to ask about it.';
  }
  function show() {
    var it = items[+$('agPick').value]; cur = it;
    var pic = $('agPic'); if (it.img) { pic.setAttribute('href', it.img); pic.style.display = ''; $('agOm').style.display = 'none'; } else { pic.style.display = 'none'; $('agOm').style.display = ''; }
    $('agText').textContent = pitch(it); var c = $('agConnect'); c.href = it.link; c.textContent = it.cta;
    outfitFor(it); stopVoice(); listeners.forEach(function (f) { f(it); });
  }
  function stopVoice() { if ('speechSynthesis' in window) speechSynthesis.cancel(); speaking = false; stage.classList.remove('ag-speaking'); var b = $('agSpeak'); if (b) b.textContent = 'Hear Kala explain'; }
  function say(text) {
    if (!('speechSynthesis' in window)) { $('agNote').textContent = 'Voice is not available in this browser. The text says the same thing.'; return; }
    stopVoice(); var u = new SpeechSynthesisUtterance(text); u.lang = 'en-IN'; u.rate = .95; u.onend = u.onerror = stopVoice; speaking = true; stage.classList.add('ag-speaking'); $('agSpeak').textContent = 'Stop'; speechSynthesis.speak(u);
  }
  $('agSpeak').addEventListener('click', function () { if (speaking) stopVoice(); else say($('agText').textContent); });
  stage.addEventListener('pointermove', function (e) { var r = stage.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width; fig.style.setProperty('--ry', (fx - .5) * 22 + 'deg'); fig.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 10 + 'deg'); stage.style.setProperty('--lx', fx * 100 + '%'); });
  stage.addEventListener('pointerleave', function () { fig.style.setProperty('--ry', '0deg'); fig.style.setProperty('--rx', '0deg'); });
  fetch('/creators/artists-data.json').then(function (r) { return r.json(); }).then(function (d) {
    var all = d.artists;
    all.forEach(function (a) {
      (a.artworks || []).filter(function (w) { return w.status === 'Available'; }).forEach(function (w) { items.push({ kind: 'work', a: a, title: w.title, type: w.type, price: /\d/.test(w.price) ? w.price : 'Price on request', artist: a.name, studio: a.studio, img: w.image, sacred: true, cta: 'Connect on WhatsApp', link: 'https://wa.me/' + a.whatsapp + '?text=' + encodeURIComponent('Namaste ' + a.studio + ', Kala (RoamWise art guide) showed me "' + w.title + '". I would like to know more and buy.') }); });
      (a.tiers || []).forEach(function (t) { items.push({ kind: 'tier', a: a, title: t.title, detail: t.detail, price: t.price, range: t.range, artist: a.name, studio: a.studio, img: null, sacred: !!t.sacred, cta: 'Connect on Instagram', link: a.instagram }); });
    });
    $('agPick').innerHTML = items.map(function (x, i) { return '<option value="' + i + '">' + esc(x.title) + ' · ' + esc(x.artist) + '</option>'; }).join('');
    $('agPick').addEventListener('change', show); show();
  }).catch(function () { $('agText').textContent = 'The guide could not load right now.'; });
  window.addEventListener('pagehide', stopVoice);
  window.RWKala = { items: function () { return items; }, current: function () { return cur; }, say: say, onChange: function (f) { listeners.push(f); }, select: function (i) { $('agPick').value = i; show(); } };
})();
