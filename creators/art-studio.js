/* Art studio tools for the Sacred art page: wall preview, artist comparison, scroll reveal. Client-side only. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var num = function (s) { var n = parseInt(String(s).replace(/[^\d]/g, ''), 10); return isNaN(n) ? 0 : n; };
  var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };
  function reveal() {
    var els = document.querySelectorAll('.as-rv'); if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12 });
    els.forEach(function (e) { io.observe(e); });
  }
  function preview(d) {
    var sel = $('asPick'); if (!sel) return;
    var items = [];
    d.artists.filter(function (a) { return a.plan !== 'free'; }).forEach(function (a) {
      (a.artworks || []).filter(function (w) { return w.image; }).forEach(function (w) { items.push({ t: w.title + ' · ' + a.name, img: w.image }); });
      if (a.tiers && a.tiers.length) items.push({ t: 'Sample size guide · ' + a.name + ' (no image yet)', img: null });
    });
    sel.innerHTML = items.map(function (x, i) { return '<option value="' + i + '">' + esc(x.t) + '</option>'; }).join('');
    var room = $('asRoom'), art = $('asArt'), size = $('asSize'), out = $('asSizeOut');
    function draw() {
      var it = items[+sel.value] || {}, cm = +size.value, sofaCm = 200; // a typical 3-seat sofa is about 200 cm wide
      art.style.setProperty('--w', (cm / sofaCm * 58) + '%');
      if (it.img) { art.innerHTML = ''; art.style.background = 'url("' + it.img + '") center/cover'; } else { art.style.background = ''; art.textContent = 'ॐ'; }
      out.textContent = cm + ' cm wide (a sofa here is about 200 cm)';
      // Keep proportions honest: paintings are shown square unless the image is loaded with its own ratio.
      if (it.img) { var im = new Image(); im.onload = function () { art.style.setProperty('--r', im.naturalWidth / im.naturalHeight); }; im.src = it.img; } else { art.style.setProperty('--r', 1); }
    }
    sel.addEventListener('change', draw); size.addEventListener('input', draw);
    document.querySelectorAll('.as-sw button').forEach(function (b) { b.addEventListener('click', function () { room.style.setProperty('--wall', b.dataset.c); document.querySelectorAll('.as-sw button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }); });
    draw();
  }
  function compare(d) {
    var box = $('asCompare'); if (!box) return;
    var rows = d.artists.filter(function (a) { return a.plan !== 'free'; }).map(function (a) {
      var prices = (a.artworks || []).map(function (w) { return num(w.price); }).filter(Boolean);
      (a.tiers || []).forEach(function (t) { if (t.range) { prices.push(t.range[0], t.range[1]); } });
      var lo = prices.length ? Math.min.apply(null, prices) : 0, hi = prices.length ? Math.max.apply(null, prices) : 0;
      var listed = (a.artworks || []).length;
      return { n: a.name + ' (' + a.studio + ')', range: lo ? inr(lo) + ' – ' + inr(hi) + (a.tiers && a.tiers.length ? '+' : '') : '—', basis: listed ? listed + ' dated studio listings with images' : 'Indicative tiers, artist confirms', sacred: (a.themes || []).indexOf('spiritual') > -1 ? 'Yes' : 'No', route: a.whatsapp ? 'WhatsApp (studio line)' : 'Instagram DM or RoamWise', where: a.state };
    });
    var f = [['Artist', 'n'], ['Where', 'where'], ['Price range', 'range'], ['Price basis', 'basis'], ['Spiritual work', 'sacred'], ['How to order', 'route']];
    box.innerHTML = '<table class="as-tbl"><tbody>' + f.map(function (r, i) { return '<tr>' + (i ? '<th scope="row">' : '<th scope="row">') + r[0] + '</th>' + rows.map(function (x) { return '<td>' + esc(x[r[1]]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  document.addEventListener('DOMContentLoaded', reveal);
  fetch('/creators/artists-data.json').then(function (r) { return r.json(); }).then(function (d) { preview(d); compare(d); }).catch(function () {});
})();
