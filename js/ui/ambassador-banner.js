/* Home: Natasha Guleria brand-ambassador banner (Nov 2026).
 * The older ambassador section lives in the Explore view, which the redesigned
 * bottom bar no longer opens, and the artists rail sits behind a category filter,
 * so Natasha had dropped off Home. This banner restores her there.
 * Reads creators/artists-data.json; falls back to the same facts if the fetch fails.
 * No prices, enquiries or payments here: links go to her profile, Instagram and
 * the Discover swipe deck. */
(function () {
  'use strict';
  var W = /** @type {any} */ (window);
  var FALLBACK = {
    id: 'natasha-guleria', name: 'Natasha Guleria', studio: 'Bhavitavya Kala', state: 'Himachal Pradesh',
    instagram: 'https://www.instagram.com/bhavitavya_kala/', page: '/creators/natasha.html',
    photo: { src: '/assets/img/natasha/natasha-with-painting.jpg', alt: 'Natasha Guleria beside one of her original paintings' },
    artworks: [
      { title: 'Manimanash', image: '/assets/img/natasha/manimanash.jpg' },
      { title: 'Shiva dhyan', image: '/assets/img/natasha/shiva-dhyan.jpg' },
      { title: 'Shree yantra', image: '/assets/img/natasha/shree-yantra.jpg' },
      { title: 'Kaal Chakra', image: '/assets/img/natasha/kaal-chakra.jpg' },
      { title: 'Moksha', image: '/assets/img/natasha/moksha.jpg' }
    ]
  };
  function rel(u) { return String(u || '').replace(/^\//, ''); } /* works on the web and inside the APK */
  function node(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
  function link(href, cls, text, external) {
    var a = node('a', cls, text); a.href = href;
    if (external) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }

  function build(n) {
    var sec = node('section', 'v v-home rw-amb'); sec.id = 'rwAmbassadorBanner';
    sec.setAttribute('aria-label', 'RoamWise brand ambassador ' + n.name);
    var grid = node('div', 'rw-amb-grid');
    var photo = node('div', 'rw-amb-photo');
    photo.append(node('span', 'rw-amb-badge', 'BRAND AMBASSADOR'));
    var img = node('img'); img.src = rel(n.photo && n.photo.src); img.alt = (n.photo && n.photo.alt) || n.name;
    img.loading = 'lazy'; img.decoding = 'async'; img.onerror = function () { img.remove(); };
    photo.append(img);

    var body = node('div', 'rw-amb-body');
    body.append(node('span', 'rw-amb-k', 'ROAMWISE BRAND AMBASSADOR'));
    body.append(node('h2', '', n.name));
    body.append(node('p', '', 'Artist behind ' + (n.studio || 'her studio') + ', ' + (n.state || 'India') +
      '. Original Himalayan and spiritual paintings, prints and commissions.'));
    var works = node('div', 'rw-amb-works'); works.setAttribute('aria-label', 'Paintings by ' + n.name);
    (n.artworks || []).filter(function (w) { return w.image; }).slice(0, 5).forEach(function (w) {
      var a = link(rel(n.page || '/creators/natasha.html'), '', ''); a.setAttribute('aria-label', w.title + ' by ' + n.name);
      var t = node('img'); t.src = rel(w.image); t.alt = w.title; t.decoding = 'async'; /* small thumbs: load now */
      t.onerror = function () { a.remove(); };
      a.append(t); works.append(a);
    });
    body.append(works);
    var cta = node('div', 'rw-amb-cta');
    if (n.instagram) cta.append(link(n.instagram, 'rw-amb-ig', '📸 Follow on Instagram', true));
    var swipe = node('button', 'rw-amb-swipe', '🎨 Swipe artists'); swipe.type = 'button';
    swipe.addEventListener('click', function () { if (typeof W.rwOpenDiscover === 'function') W.rwOpenDiscover('artists'); });
    cta.append(swipe);
    cta.append(link(rel(n.page || '/creators/natasha.html'), 'rw-amb-more', 'View profile →'));
    body.append(cta);
    grid.append(photo, body); sec.append(grid);
    return sec;
  }

  function mount(n) {
    if (document.getElementById('rwAmbassadorBanner')) return;
    var anchor = document.getElementById('rwStayBrowser') || document.getElementById('rwSalesCarousels');
    if (!anchor || !anchor.parentNode) return;
    anchor.parentNode.insertBefore(build(n), anchor);
  }

  function start() {
    var done = false;
    function go(n) { if (done) return; done = true; mount(n); }
    try {
      fetch('creators/artists-data.json', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then(function (d) {
          var n = (d.artists || []).filter(function (a) { return a.id === 'natasha-guleria'; })[0];
          go(n ? Object.assign({}, FALLBACK, n, { page: n.page === '/creators/artists.html' ? FALLBACK.page : (n.page || FALLBACK.page) }) : FALLBACK);
        })
        .catch(function () { go(FALLBACK); });
    } catch (e) { go(FALLBACK); }
    /* The stay browser mounts on load too; wait briefly so the banner sits above it. */
    setTimeout(function () { go(FALLBACK); }, 2500);
  }
  W.rwAmbassadorFallback = FALLBACK;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 50); }, { once: true });
  else setTimeout(start, 50);
})();
