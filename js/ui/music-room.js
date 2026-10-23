// @ts-nocheck - classic script that talks to the YouTube IFrame API globals
/* Home "Music Room": a swipeable row of album covers from /music/releases.json. Tapping a cover plays the album in a bottom player on the home page (YouTube IFrame API, album playlist), with an Open in YouTube Music link. Text via textContent; no tracking. */
(function () {
  'use strict';
  var row = document.getElementById('rwmRow');
  if (!row) return;
  var engine = (function () { try { return localStorage.getItem('mu-engine') === 'youtube' ? 'youtube' : 'spotify'; } catch (e) { return 'spotify'; } })(), cur = null, spApi = null, spCtl = null, spMaking = false, spWant = '';
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
    bar = el('div', 'rwm-bar'); bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Music player'); bar.id = 'rwmNow';
    var vid = el('div', 'rwm-vid'); var host = el('div'); host.id = 'rwmFrame'; vid.appendChild(host); var sph = el('div', 'rwm-sph'); sph.id = 'rwmSp'; sph.hidden = true; vid.appendChild(sph);
    var info = el('div', 'rwm-info'); info.appendChild(el('b', 'rwm-bt')); info.appendChild(el('span', 'rwm-bs'));
    var ctl = el('div', 'rwm-ctl');
    [['rwm-prev', '\u23EE', 'Previous track'], ['rwm-pp', '\u23EF', 'Play or pause'], ['rwm-next', '\u23ED', 'Next track'], ['rwm-x', '\u2715', 'Close player']].forEach(function (b) {
      var x = el('button', 'rwm-cb ' + b[0], b[1]); x.type = 'button'; x.setAttribute('aria-label', b[2]); ctl.appendChild(x);
    });
    var eng = el('span', 'rwm-eng'); eng.setAttribute('role', 'group'); eng.setAttribute('aria-label', 'Player');
    ['spotify', 'youtube'].forEach(function (k) { var x = el('button', '', k === 'spotify' ? 'Spotify' : 'YouTube'); x.type = 'button'; x.dataset.eng = k; x.onclick = function () { engine = k; try { localStorage.setItem('mu-engine', k); } catch (e) {} if (cur) playAlbum(cur.pl, cur.title, cur.sp, cur.ytm, cur.id); }; eng.appendChild(x); });
    bar.appendChild(vid); bar.appendChild(info); bar.appendChild(eng);
    var ym = el('a', 'rwm-ytm2', 'Play in YouTube Music app'); ym.target = '_blank'; ym.rel = 'noopener noreferrer';
    var ytm = el('a', 'rwm-ytm', 'Open in YouTube Music'); ytm.target = '_blank'; ytm.rel = 'noopener noreferrer';
    bar.appendChild(ctl); bar.appendChild(ytm); bar.appendChild(ym); var host0 = document.getElementById('rwMusic'); var anchor = row.parentNode.classList.contains('rwm-rowwrap') ? row.parentNode : row; anchor.parentNode.insertBefore(bar, anchor);
    bar.querySelector('.rwm-prev').onclick = function () { try { yt.previousVideo(); } catch (e) {} };
    bar.querySelector('.rwm-next').onclick = function () { try { yt.nextVideo(); } catch (e) {} };
    bar.querySelector('.rwm-pp').onclick = function () { try { yt.getPlayerState() === 1 ? yt.pauseVideo() : yt.playVideo(); } catch (e) {} };
    bar.querySelector('.rwm-x').onclick = function () { try { yt.stopVideo(); } catch (e) {} try { spCtl.pause(); } catch (e) {} clearInterval(tmr); bar.classList.remove('on'); };
  }
  function status() {
    try {
      var vd = yt.getVideoData(), i = yt.getPlaylistIndex(), n = (yt.getPlaylist() || []).length;
      if (vd && vd.title) bar.querySelector('.rwm-bs').textContent = (n > 1 && i >= 0 ? 'Track ' + (i + 1) + ' of ' + n + ' \u00b7 ' : '') + String(vd.title).split(' | ')[0];
    } catch (e) {}
  }
  function loadSpApi() {
    if (spApi) return spApi;
    spApi = new Promise(function (ok, no) {
      window.onSpotifyIframeApiReady = function (A) { ok(A); };
      var sc = document.createElement('script'); sc.src = 'https://open.spotify.com/embed/iframe-api/v1'; sc.async = true; sc.onerror = no; document.head.appendChild(sc);
      setTimeout(no, 10000);
    });
    spApi.catch(function () { spApi = null; });
    return spApi;
  }
  function playSpotify(id) {
    spWant = 'spotify:album:' + id;
    loadSpApi().then(function (A) {
      if (spCtl) { spCtl.loadUri(spWant); setTimeout(function () { try { spCtl.play(); } catch (e) {} }, 500); return; }
      if (spMaking) return; spMaking = true;
      A.createController(document.getElementById('rwmSp').appendChild(el('div')), { uri: spWant, width: '100%', height: 352 }, function (c) {
        spCtl = c; spMaking = false;
        c.addListener('ready', function () { if (spWant) { try { c.loadUri(spWant); } catch (e) {} setTimeout(function () { try { c.play(); } catch (e) {} }, 500); } });
      });
    }).catch(function () { bar.querySelector('.rwm-bs').textContent = 'Spotify is blocked here \u2014 tap the link below.'; });
  }
  function playAlbum(pl, title, spId, ytm, id) {
    cur = { pl: pl, title: title, sp: spId, ytm: ytm || (cur && cur.ytm), id: id || (cur && cur.id) };
    try { if (cur.id) localStorage.setItem('mu-last', JSON.stringify({ id: cur.id, mood: '', shuffle: false, repeat: 'off', idx: 0, t: 0, at: Date.now() })); } catch (e) {}
    if (!bar) buildBar();
    var useSpot = engine === 'spotify' && !!spId || (!pl && !!spId);
    var first = !bar.classList.contains('on'); bar.classList.add('on');
    if (first) setTimeout(function () { try { bar.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }, 60);
    bar.classList.toggle('sp', useSpot);
    document.getElementById('rwmSp').hidden = !useSpot; document.getElementById('rwmFrame').hidden = useSpot;
    bar.querySelectorAll('.rwm-eng button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.eng === (useSpot ? 'spotify' : 'youtube'))); b.disabled = (b.dataset.eng === 'spotify' && !spId) || (b.dataset.eng === 'youtube' && !pl); });
    bar.querySelector('.rwm-bt').textContent = title; bar.querySelector('.rwm-bs').textContent = useSpot ? 'Playing from Spotify' : 'Loading\u2026';
    if (cur.ytm) bar.querySelector('.rwm-ytm2').href = cur.ytm;
    var link = bar.querySelector('.rwm-ytm');
    link.textContent = useSpot ? 'Open in Spotify' : 'Open in YouTube Music';
    link.href = useSpot ? 'https://open.spotify.com/album/' + encodeURIComponent(spId) : 'https://music.youtube.com/playlist?list=' + encodeURIComponent(pl);
    if (useSpot) { try { if (yt && ytOk) yt.pauseVideo(); } catch (e) {} clearInterval(tmr); playSpotify(spId); return; }
    try { if (spCtl) spCtl.pause(); } catch (e) {}
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
      .slice(0, 40).forEach(function (r) {
        var a = document.createElement('a'); a.className = 'rwm-it'; a.href = 'https://music.youtube.com/playlist?list=' + (r.playlist || ''); a.dataset.id = r.id; a.dataset.ytm = 'https://music.youtube.com/watch?v=' + r.id + (r.playlist ? '&list=' + r.playlist : ''); a.dataset.pl = r.playlist || ''; a.dataset.sp = /^https:\/\/open\.spotify\.com\/album\/[A-Za-z0-9]{10,40}$/.test(r.spotify || '') ? r.spotify.split('/').pop() : ''; a.setAttribute('role', 'listitem'); if (!r.playlist && !a.dataset.sp) a.href = '/music/#' + r.id; else if (a.dataset.sp) a.href = 'https://open.spotify.com/album/' + a.dataset.sp;
        var c = document.createElement('div'); c.className = 'rwm-cov';
        var i = document.createElement('img'); i.loading = 'lazy'; i.alt = ''; if (r.art && /^https:\/\/(image-cdn[a-z0-9-]*\.spotifycdn\.com|i\.scdn\.co)\//.test(r.art)) { i.src = r.art; c.classList.add('sq'); } else i.src = 'https://i.ytimg.com/vi/' + r.id + '/hqdefault.jpg'; c.appendChild(i);
        var p = document.createElement('span'); p.className = 'rwm-play'; p.setAttribute('aria-hidden', 'true'); p.textContent = '▶'; c.appendChild(p);
        var t = document.createElement('div'); t.className = 'rwm-t'; t.textContent = r.title;
        a.appendChild(c); a.appendChild(t); row.appendChild(a);
      });
    row.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('.rwm-it'); if (!a || (!a.dataset.pl && !a.dataset.sp)) return;
      e.preventDefault(); if (activeEl) activeEl.classList.remove('on'); activeEl = a; a.classList.add('on'); a.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); playAlbum(a.dataset.pl, a.querySelector('.rwm-t').textContent, a.dataset.sp, a.dataset.ytm, a.dataset.id);
    });
    try {
      var mem = JSON.parse(localStorage.getItem('mu-last') || 'null'), card = mem && row.querySelector('.rwm-it[data-id="' + String(mem.id).replace(/[^A-Za-z0-9_-]/g, '') + '"]');
      if (card) {
        var cb = el('button', 'rwm-cont'); cb.type = 'button'; cb.appendChild(el('span', '', '\u25B6 Continue')); cb.appendChild(el('b', '', card.querySelector('.rwm-t').textContent));
        cb.onclick = function () { card.click(); };
        row.parentNode.insertBefore(cb, row);
      }
    } catch (e) {}
    var wrap = el('div', 'rwm-rowwrap'); row.parentNode.insertBefore(wrap, row); wrap.appendChild(row);
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
