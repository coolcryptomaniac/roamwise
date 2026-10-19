/* Sacred art page extras: rule-based painting finder and live-camera wall overlay. Client-side only; nothing is uploaded. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var num = function (s) { var n = parseInt(String(s).replace(/[^\d]/g, ''), 10); return isNaN(n) ? 0 : n; };
  var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };

  function finder(d) {
    var f = $('fdForm'); if (!f) return;
    var pool = [];
    d.artists.filter(function (a) { return a.plan !== 'free'; }).forEach(function (a) {
      var page = a.id === 'natasha-guleria' ? '/creators/artists.html' : '/creators/jagriti.html';
      (a.artworks || []).filter(function (w) { return w.status === 'Available' && num(w.price) > 0; }).forEach(function (w) {
        pool.push({ a: a, t: w.title, lo: num(w.price), hi: num(w.price), sacred: true, img: w.image, page: page, price: w.price, link: 'https://wa.me/' + a.whatsapp + '?text=' + encodeURIComponent('Namaste ' + a.studio + ', I found "' + w.title + '" through the RoamWise painting finder. Please share availability and delivery details.'), cta: 'Enquire on WhatsApp' });
      });
      (a.tiers || []).forEach(function (t) { pool.push({ a: a, t: t.title, lo: t.range[0], hi: t.range[1], sacred: !!t.sacred, page: page, price: t.price, detail: t.detail, link: a.instagram, cta: 'Ask via Instagram' }); });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var want = f.elements.mood.value, band = f.elements.budget.value.split('-').map(Number);
      var scored = pool.map(function (p) {
        var fits = p.lo <= band[1] && p.hi >= band[0], s = 0;
        if (fits) s += 3; else s -= 3;
        if (want === 'sacred' && p.sacred) s += 2; if (want === 'modern' && !p.sacred) s += 2;
        if (p.img) s += 1; // dated, imaged listings are more concrete than indicative tiers
        return { p: p, s: s };
      }).filter(function (x) { return x.s > 0; }).sort(function (x, y) { return y.s - x.s; }).slice(0, 3);
      $('fdOut').innerHTML = scored.length ? scored.map(function (x) { var p = x.p; return '<article class="sa-card">' + (p.img ? '<img src="' + esc(p.img) + '" alt="' + esc(p.t) + '" loading="lazy" width="400" height="400">' : '<div class="sa-ph" aria-hidden="true">ॐ</div>') + '<div><span class="sa-by">' + esc(p.a.name) + '</span><h3>' + esc(p.t) + '</h3>' + (p.detail ? '<p>' + esc(p.detail) + '</p>' : '') + '<p class="sa-price">' + esc(p.price) + '</p><a class="sa-btn" href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(p.cta) + '</a> <a class="sa-link" href="' + p.page + '">About the artist</a></div></article>'; }).join('') : '<p class="art-small">Nothing matches that budget yet. Try a wider band, or write to RoamWise for a custom commission.</p>';
    });
  }

  function camera() {
    var btn = $('camBtn'); if (!btn) return;
    var room = $('asRoom'), art = $('asArt'), video = null, stream = null;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { btn.hidden = true; return; }
    function stop() { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; if (video) { video.remove(); video = null; } room.classList.remove('as-live'); btn.textContent = 'Use my camera'; }
    btn.addEventListener('click', function () {
      if (stream) { stop(); return; }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }).then(function (s) {
        stream = s; video = document.createElement('video'); video.className = 'as-video'; video.playsInline = true; video.muted = true; video.srcObject = s; room.insertBefore(video, room.firstChild); video.play();
        room.classList.add('as-live'); btn.textContent = 'Stop camera'; $('camNote').textContent = 'Point at your wall, then drag the painting where you want it. The camera stays on your device and nothing is recorded.';
      }).catch(function () { $('camNote').textContent = 'Camera permission was not given, so the sofa preview stays. You can allow the camera in your browser settings and try again.'; });
    });
    var drag = null;
    art.addEventListener('pointerdown', function (e) { var r = room.getBoundingClientRect(); drag = { dx: e.clientX - (art.offsetLeft + art.offsetWidth / 2 + r.left), dy: e.clientY - (art.offsetTop + r.top) }; art.setPointerCapture(e.pointerId); });
    art.addEventListener('pointermove', function (e) { if (!drag) return; var r = room.getBoundingClientRect(); art.style.left = (e.clientX - r.left - drag.dx) + 'px'; art.style.top = (e.clientY - r.top - drag.dy) + 'px'; });
    art.addEventListener('pointerup', function () { drag = null; });
    window.addEventListener('pagehide', stop);
  }

  camera();
  fetch('/creators/artists-data.json').then(function (r) { return r.json(); }).then(finder).catch(function () {});
})();
