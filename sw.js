/* RoamWise service worker
 * ---------------------------------------------------------------------------
 * Goal: repeat visits open in well under a second and still pick up every
 * deploy. Strategy (changed from network-first/no-store, which re-downloaded
 * ~180 files on EVERY visit):
 *
 * 1) HTML, JS, CSS, JSON -> STALE-WHILE-REVALIDATE. The cached copy is served
 *    immediately; a conditional request (ETag, usually a 304) refreshes the
 *    cache in the background, so the NEXT open runs the newest deploy. The
 *    page and its scripts come from the same cache generation, so a visit
 *    never mixes old HTML with new scripts unless an update was cut short
 *    (the boot watchdog in index.html repairs that).
 *    Requests that ask for fresh data (fetch(..., {cache:'no-store'}), e.g.
 *    news.json, live feeds) stay NETWORK-FIRST so live data is never stale.
 *
 * 2) Install precaches the shell AND every same-origin script/stylesheet that
 *    index.html references, so even the second visit is fully cached.
 *
 * 3) Immutable media/assets (images, audio) -> CACHE FIRST, refreshed in the
 *    background.
 *
 * 4) Never cached: Firebase/Firestore, ads, geocoding/weather APIs, YouTube,
 *    and promo.mp4. Live data must stay live, and the video is tens of MB.
 * ------------------------------------------------------------------------- */

var VERSION = 'rw-v131-fast-repeat';
var HTML_CACHE = VERSION + '-html';
var ASSET_CACHE = VERSION + '-assets';

/* Minimal precache: enough to boot offline. index.html + app.css + app.js are
   the three files the shell needs. index.html is fetched fresh when
   online, so we only seed it here as the offline fallback. */
var PRECACHE = [
  '/',
  '/index.html',
  '/app.css',
  '/mobile-stability.css',
  '/design/roamwise-akatsuki-theme.css',
  '/app.js',
  '/rw-config.js',
  '/js/runtime/freshness.js',
  '/js/boot/boot-ok.js',
  '/vendor/firebase/10.14.1/firebase-app-compat.js',
  '/vendor/firebase/10.14.1/firebase-auth-compat.js',
  '/vendor/firebase/10.14.1/firebase-firestore-compat.js',
  '/vendor/firebase/10.14.1/firebase-app-check-compat.js',
  '/vendor/qrcodejs/1.0.0/qrcode.min.js',
  '/js/audio/focus.js',
  '/js/audio/cues.js',
  '/js/core/user-preferences.js',
  '/js/itinerary/party-costs.js',
  '/platform-v5/audio-only.js',
  '/platform-v5/atlas-shinobi.js',
  '/assets/roamwise-opening-first.webp',
  '/destination-photos.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

/* Every same-origin script/stylesheet the home page references, read from the
   live index.html, so the whole shell is cached after the first visit. */
function shellUrls() {
  return fetch('/index.html', { cache: 'no-cache' }).then(function (r) { return r.text(); }).then(function (html) {
    var out = [], re = /(?:src|href)="([^"#]+\.(?:js|css)(?:\?[^"]*)?)"/g, m;
    while ((m = re.exec(html))) {
      if (/^(?:[a-z]+:)?\/\//i.test(m[1]) || /^(?:data|blob):/i.test(m[1])) continue;
      var u = new URL(m[1], self.location.origin + '/');
      if (u.origin === self.location.origin && u.pathname.indexOf('/vendor/webllm/') !== 0) out.push(u.pathname + u.search);
    }
    return out;
  }).catch(function () { return []; });
}

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(HTML_CACHE).then(function (h) {
      /* Seed the HTML cache so the SECOND visit is already instant. */
      return Promise.all(['/', '/index.html'].map(function (u) { return h.add(u).catch(function () {}); }));
    }).then(function () { return caches.open(ASSET_CACHE); }).then(function (c) {
      /* addAll() rejects the whole install if ANY entry 404s. Add individually
         so one missing file can never brick the install. */
      return shellUrls().then(function (extra) {
        var all = PRECACHE.concat(extra.filter(function (u) { return PRECACHE.indexOf(u) === -1; }));
        return Promise.all(all.map(function (u) {
          return c.add(u).catch(function () { /* ignore a single miss */ });
        }));
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k.indexOf(VERSION) !== 0) return caches.delete(k); /* drop old versions */
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Hosts whose responses must always come from the network. */
function isLive(url) {
  return /firestore|firebase|googleapis|googlesyndication|doubleclick|google-analytics|gstatic|open-meteo|frankfurter|youtube|ytimg|weserv|spotify|saavn/i.test(url);
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                 /* never cache POST/PUT */

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;  /* let cross-origin pass through */
  if (isLive(req.url)) return;
  if (/\.mp4$|\.webm$/i.test(url.pathname)) return; /* promo film: too big to cache */
  if (url.pathname.indexOf('/vendor/webllm/') === 0) return; /* 6 MB on-device AI engine: browser HTTP cache only */

  var isHTML = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').indexOf('text/html') > -1;
  var isCode = /\.(?:css|js|mjs|json|webmanifest)$/i.test(url.pathname);

  if (isHTML || isCode) {
    var cacheName = isHTML ? HTML_CACHE : ASSET_CACHE;
    /* A caller that explicitly wants fresh bytes (no-store/reload) gets the
       network first; the cached copy is only the offline fallback. */
    if (req.cache === 'no-store' || req.cache === 'reload') {
      e.respondWith(
        fetch(req).then(function (res) {
          if (res && res.ok && !res.redirected) { var copy = res.clone(); caches.open(cacheName).then(function (c) { c.put(req, copy); }); }
          return res;
        }).catch(function () {
          return caches.match(req).then(function (hit) { return hit || (isHTML ? caches.match('/index.html') : Response.error()); });
        })
      );
      return;
    }
    e.respondWith(
      caches.open(cacheName).then(function (c) {
        return c.match(req).then(function (hit) {
          /* Navigations carry query strings (?ref=..., utm). Fall back to the
             same page without them so a cached shell still answers. */
          return hit || (isHTML ? c.match(url.pathname, { ignoreSearch: true }) : null);
        }).then(function (hit) {
          /* Code is revalidated at most every 5 minutes (HTML on every visit, it is
             one small request). fetch(..., {cache:'no-cache'}) sends If-None-Match
             and returns the full body from the HTTP cache on a 304, so the stored
             copy's Date header is renewed and the next check waits again. */
          var fresh = hit && !isHTML && (Date.now() - (Date.parse(hit.headers.get('date') || '') || 0)) < 300000;
          if (fresh) return hit;
          var refresh = fetch(req, { cache: 'no-cache' }).then(function (res) {
            /* Never cache a redirected response: it cannot answer a navigation. */
            if (res && res.ok && !res.redirected) { c.put(req, res.clone()); }
            return res;
          }).catch(function () { return null; });
          if (hit) { e.waitUntil(refresh); return hit; }
          return refresh.then(function (res) {
            return res || caches.match('/index.html').then(function (shell) { return shell || Response.error(); });
          });
        });
      })
    );
    return;
  }

  /* Immutable media/assets: cache first, then refresh in the background. */
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(ASSET_CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
