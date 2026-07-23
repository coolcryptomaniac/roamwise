/* RoamWise service worker
 * ---------------------------------------------------------------------------
 * Strategy is deliberate, not default:
 *
 * 1) HTML / navigations -> NETWORK FIRST, cache as fallback.
 *    The whole app is ONE index.html that changes on every deploy. Cache-first
 *    HTML is the classic PWA trap: installed users get frozen on an old build
 *    forever and you can't push a fix. Network-first means users always get the
 *    latest app when online, and still get a working app offline.
 *
 * 2) Static assets (icons, guides, blog pages) -> CACHE FIRST, refreshed in the
 *    background. These are small and rarely change, so speed wins.
 *
 * 3) Never cached: Firebase/Firestore, ads, geocoding/weather APIs, YouTube,
 *    and promo.mp4. Live data must stay live, and the video is tens of MB —
 *    caching it would blow the origin's storage quota for no benefit.
 * ------------------------------------------------------------------------- */

var VERSION = 'rw-v1';
var HTML_CACHE = VERSION + '-html';
var ASSET_CACHE = VERSION + '-assets';

/* Minimal precache: enough to boot offline. index.html + app.css + app.js are
   the three files the shell needs. index.html is fetched fresh when
   online, so we only seed it here as the offline fallback. */
var PRECACHE = [
  '/',
  '/index.html',
  '/app.css',
  '/app.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(ASSET_CACHE).then(function (c) {
      /* addAll() rejects the whole install if ANY entry 404s. Add individually
         so one missing file can never brick the install. */
      return Promise.all(PRECACHE.map(function (u) {
        return c.add(u).catch(function () { /* ignore a single miss */ });
      }));
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

  var isHTML = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').indexOf('text/html') > -1;

  if (isHTML) {
    /* Network first: always the freshest app when online. */
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(HTML_CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('/index.html');
        });
      })
    );
    return;
  }

  /* Static: cache first, then refresh in the background for next time. */
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
