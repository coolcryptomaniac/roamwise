/* Home "Music Room": a swipeable row of album covers from /music/releases.json. Tapping a cover plays the album in a bottom player on the home page (YouTube IFrame API, album playlist), with an Open in YouTube Music link. Text via textContent; no tracking. */
(function () {
  'use strict';
  var row = document.getElementById('rwmRow');
  if (!row) return;
  var api = null, yt = null, ytOk = false, pend = '', bar = null, tmr = 0, activeEl = null;
  function loadApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (api) return api;
    api = new Promise(function (ok, no) {
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (prev) prev(); ok(window.YT); };
      var sc = document.createElement('script'); sc.src = 'https://www.youtube.com/iframe_api'; sc.onerror = no; document.head.appendChild(sc);
      setTimeout(function () { if (!(window.YT && window.YT.Player)) no(); }, 9000);
    });
    return api;
  }
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x) n.textContent = x; return n; }
  function buildBar() {
    bar = el('div', 'rwm-bar'); bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Music player');
    var vid = el('div', 'rwm-vid'); var host = el('div'); host.id = 'rwmFrame'; vid.appendChild(host);
    var info = el('div', 'rwm-info'); info.appendChild(el('b', 'rwm-bt')); info.appendChild(el('span', 'rwm-bs'));
    var ctl = el('div', 'rwm-ctl');
    [['rwm-prev', '\u23EE', 'Previous track'], ['rwm-pp', '\u23EF', 'Play or pause'], ['rwm-next', '\u23ED', 'Next track'], ['rwm-x', '\u2715', 'Close player']].forEach(function (b) {
      var x = el('button', 'rwm-cb ' + b[0], b[1]); x.type = 'button'; x.setAttribute('aria-label', b[2]); ctl.appendChild(x);
    });
    var ytm = el('a', 'rwm-ytm', 'Open in YouTube Music'); ytm.target = '_blank'; ytm.rel = 'noopener noreferrer';
    bar.appendChild(vid); bar.appendChild(info); bar.appendChild(ctl); bar.appendChild(ytm); document.body.appendChild(bar);
    bar.querySelector('.rwm-prev').onclick = function () { try { yt.previousVideo(); } catch (e) {} };
    bar.querySelector('.rwm-next').onclick = function () { try { yt.nextVideo(); } catch (e) {} };
    bar.querySelector('.rwm-pp').onclick = function () { try { yt.getPlayerState() === 1 ? yt.pauseVideo() : yt.playVideo(); } catch (e) {} };
    bar.querySelector('.rwm-x').onclick = function () { try { yt.stopVideo(); } catch (e) {} clearInterval(tmr); bar.classList.remove('on'); document.body.classList.remove('rwm-playing'); };
  }
  function status() {
    try {
      var vd = yt.getVideoData(), i = yt.getPlaylistIndex(), n = (yt.getPlaylist() || []).length;
      if (vd && vd.title) bar.querySelector('.rwm-bs').textContent = (n > 1 && i >= 0 ? 'Track ' + (i + 1) + ' of ' + n + ' \u00b7 ' : '') + vd.title;
    } catch (e) {}
  }
  function playAlbum(pl, title) {
    if (!bar) buildBar();
    bar.classList.add('on'); document.body.classList.add('rwm-playing');
    bar.querySelector('.rwm-bt').textContent = title; bar.querySelector('.rwm-bs').textContent = 'Loading\u2026';
    bar.querySelector('.rwm-ytm').href = 'https://music.youtube.com/playlist?list=' + encodeURIComponent(pl);
    loadApi().then(function (YT) {
      if (yt && ytOk) { yt.loadPlaylist({ list: pl, listType: 'playlist' }); }
      else if (yt) { pend = pl; }
      else {
        pend = '';
        yt = new YT.Player('rwmFrame', { width: '100%', height: '100%', host: 'https://www.youtube-nocookie.com',
          playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, listType: 'playlist', list: pl },
          events: {
            onReady: function () { ytOk = true; if (pend) { var w = pend; pend = ''; try { yt.loadPlaylist({ list: w, listType: 'playlist' }); } catch (e) {} } },
            onError: function () { bar.querySelector('.rwm-bs').textContent = 'This album cannot play here \u2014 tap Open in YouTube Music.'; }
          } });
      }
      clearInterval(tmr); tmr = setInterval(status, 1000);
    }).catch(function () { bar.querySelector('.rwm-bs').textContent = 'Player blocked \u2014 tap Open in YouTube Music.'; });
  }
  fetch('/music/releases.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    var list = Array.isArray(d) ? d : (d && d.releases) || [];
    var seen = {};
    list.filter(function (r) { return r && /^[A-Za-z0-9_-]{11}$/.test(r.id || '') && r.title && !seen[r.id] && (seen[r.id] = 1); })
      .sort(function (a, b) { return String(b.published || '').localeCompare(String(a.published || '')); })
      .slice(0, 14).forEach(function (r) {
        var a = document.createElement('a'); a.className = 'rwm-it'; a.href = 'https://music.youtube.com/playlist?list=' + (r.playlist || ''); a.dataset.id = r.id; a.dataset.pl = r.playlist || ''; a.setAttribute('role', 'listitem'); if (!r.playlist) a.href = '/music/#' + r.id;
        var c = document.createElement('div'); c.className = 'rwm-cov';
        var i = document.createElement('img'); i.loading = 'lazy'; i.alt = ''; i.src = 'https://i.ytimg.com/vi/' + r.id + '/hqdefault.jpg'; c.appendChild(i);
        var p = document.createElement('span'); p.className = 'rwm-play'; p.setAttribute('aria-hidden', 'true'); p.textContent = '▶'; c.appendChild(p);
        var t = document.createElement('div'); t.className = 'rwm-t'; t.textContent = r.title;
        a.appendChild(c); a.appendChild(t); row.appendChild(a);
      });
    row.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('.rwm-it'); if (!a || !a.dataset.pl) return;
      e.preventDefault(); if (activeEl) activeEl.classList.remove('on'); activeEl = a; a.classList.add('on'); a.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); playAlbum(a.dataset.pl, a.querySelector('.rwm-t').textContent, a.dataset.id);
    });
    var wrap = row.parentNode;
    ['prev', 'next'].forEach(function (d) {
      var b = el('button', 'rwm-arr rwm-' + d, d === 'prev' ? '\u2039' : '\u203A'); b.type = 'button'; b.setAttribute('aria-label', d === 'prev' ? 'Scroll albums left' : 'Scroll albums right');
      b.onclick = function () { row.scrollBy({ left: (d === 'prev' ? -1 : 1) * Math.max(240, row.clientWidth * 0.8), behavior: 'smooth' }); };
      wrap.insertBefore(b, row);
    });
    var down = false, sx = 0, sl = 0, dragged = false;
    row.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; dragged = false; sx = e.clientX; sl = row.scrollLeft; });
    window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 5) { dragged = true; row.classList.add('drag'); } row.scrollLeft = sl - dx; });
    window.addEventListener('pointerup', function () { down = false; row.classList.remove('drag'); });
    row.addEventListener('click', function (e) { if (dragged) { e.stopImmediatePropagation(); e.preventDefault(); dragged = false; } }, true);
    if (!row.children.length) document.getElementById('rwMusic').hidden = true;
  }).catch(function () { var s = document.getElementById('rwMusic'); if (s) s.hidden = true; });
})();
