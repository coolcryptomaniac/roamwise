// music/music.js - the music library page: stage (carousel, visualiser, controls, moods) and the bookshelf.
// Data: releases.json (albums with a YouTube playlist). Playback: the YouTube iframe player, loaded only when you press play.
import { cleanReleases, groupByYear, shelves, spineStyle, fmtDuration, filterReleases, musicUrl, albumUrl, coverUrl, MOODS, byMood, smartMood, makeQueue, advance, lighten } from './shelf-core.mjs';
import { mountViz, mountDust } from './viz.js';
import { mountCarousel } from './carousel.js';

const $ = (id) => document.getElementById(id);
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const state = { all: [], shown: [], queue: { items: [], index: 0 }, current: null, shuffle: false, repeat: 'off', mood: '', query: '', playing: false, failed: false };
let swipeT = 0;
let yt = null, ytIsReady = false, ytPending = '', ytReady = null, ticker = 0, carousel, viz, dust;

async function load() {
  try { const r = await fetch('releases.json', { cache: 'no-cache' }); if (!r.ok) throw 0; state.all = cleanReleases((await r.json()).releases); }
  catch (e) { state.failed = true; }
}

/* ---------- the bookshelf ---------- */
const perShelf = () => Math.max(4, Math.floor(($('muShelves').clientWidth - 40) / 62));
function spine(r) {
  const s = spineStyle(r);
  return '<button type="button" class="mu-spine' + (state.current && state.current.id === r.id ? ' on' : '') + '" data-id="' + esc(r.id) + '" aria-label="' + esc(r.title) + '" style="--h:' + s.height + 'px;--w:' + s.width + 'px;--a:' + s.from + ';--b:' + s.to + '">'
    + '<span class="mu-band b' + s.band + (s.brass ? ' brass' : '') + '"></span><span class="mu-st">' + esc(r.title) + '</span></button>';
}
function renderShelf() {
  state.shown = filterReleases(state.all, state.query);
  const root = $('muShelves');
  if (!state.shown.length) { root.innerHTML = '<p class="mu-note">No album matches that search.</p>'; return; }
  const n = perShelf();
  root.innerHTML = groupByYear(state.shown).map((g) => '<section class="mu-year"><h2 class="mu-plaque">' + esc(g.year) + '<small>' + g.books.length + (g.books.length === 1 ? ' release' : ' releases') + '</small></h2>'
    + shelves(g.books, n).map((row) => '<div class="mu-shelf"><div class="mu-books">' + row.map(spine).join('') + '</div><div class="mu-plank"></div></div>').join('') + '</section>').join('');
}

/* ---------- the YouTube player ---------- */
function loadApi() {
  if (ytReady) return ytReady;
  ytReady = new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(window.YT); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true; s.onerror = reject; document.head.appendChild(s);
    setTimeout(() => reject(new Error('timeout')), 8000);
  });
  return ytReady;
}
function albumDone() { try { const l = yt.getPlaylist && yt.getPlaylist(); return !l || yt.getPlaylistIndex() >= l.length - 1; } catch (e) { return true; } }
function setPlaying(p) {
  state.playing = p; document.body.classList.toggle('mu-playing', p);
  for (const id of ['muPlay', 'muMiniPlay']) { const b = $(id); if (b) { b.innerHTML = p ? '&#10074;&#10074;' : '&#9654;'; b.setAttribute('aria-label', p ? 'Pause' : 'Play'); } }
  carousel.setPlaying(p); viz.setPlaying(p); dust.setPlaying(p);
  clearInterval(ticker); if (p) ticker = setInterval(tick, 500);
}
function tick() {
  try {
    const d = yt.getDuration(), c = yt.getCurrentTime();
    if (d > 0) { $('muSeek').value = Math.round(c / d * 1000); $('muCur').textContent = fmtDuration(Math.round(c)); $('muDurT').textContent = fmtDuration(Math.round(d)); }
    const vd = yt.getVideoData && yt.getVideoData(); const idx = yt.getPlaylistIndex ? yt.getPlaylistIndex() : -1; const n = yt.getPlaylist ? (yt.getPlaylist() || []).length : 0;
    if (vd && vd.title) $('muTrack').textContent = (n > 1 && idx >= 0 ? 'Track ' + (idx + 1) + ' of ' + n + ' \u00b7 ' : '') + vd.title;
  } catch (e) { /* the player is not ready yet */ }
}
/* 100/101/150: the video or album cannot be embedded here. Say so and offer the YouTube Music page instead of a black box. */
function onPlayerError(e) {
  console.warn('YouTube player error', e && e.data);
  const r = state.current; if (!r) return;
  $('muFallback').hidden = false; $('muFallbackLink').href = r.playlist ? albumUrl(r.playlist) : musicUrl(r.id);
  const sp = $('muFallbackSp'); sp.hidden = !r.spotify; if (r.spotify) sp.href = r.spotify;
  setPlaying(false);
}
function onPlayerState(e) {
  if (e.data === 1) { $('muFallback').hidden = true; setPlaying(true); }
  else if (e.data === 2) setPlaying(false);
  else if (e.data === 0 && albumDone()) { setPlaying(false); autoNext(); }
}
async function startPlayback(r) {
  try {
    const YT = await loadApi();
    if (yt && ytIsReady) { yt.loadPlaylist({ list: r.playlist, listType: 'playlist' }); return; }
    ytPending = r.playlist;
    if (yt) return; /* created but not ready: onReady plays the latest album asked for */
    yt = new YT.Player('muFrame', { width: '100%', height: '100%', host: 'https://www.youtube-nocookie.com',
      playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, listType: 'playlist', list: r.playlist },
      events: { onStateChange: onPlayerState, onError: onPlayerError, onReady: () => {
        ytIsReady = true;
        try { yt.setVolume(Number($('muVol').value)); } catch (e) { /* ignore */ }
        const want = ytPending; ytPending = '';
        if (want && state.current && want === state.current.playlist) { try { yt.loadPlaylist({ list: want, listType: 'playlist' }); } catch (e) { /* ignore */ } }
      } } });
  } catch (e) {
    $('muFrame').innerHTML = '<iframe title="' + esc(r.title) + '" src="https://www.youtube-nocookie.com/embed/videoseries?list=' + esc(r.playlist) + '&autoplay=1&rel=0&playsinline=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
    setPlaying(true);
  }
}

/* ---------- what is playing ---------- */
function show(r) {
  state.current = r;
  const s = spineStyle(r); viz.setPalette(lighten(s.from, 0.55), lighten(s.to, 0.85), s.height + s.width);
  $('muTitle').textContent = r.title; $('muTrack').textContent = '';
  $('muSub').textContent = state.mood ? (MOODS.find((m) => m.id === state.mood) || {}).label + ' mix · ' + (state.queue.index + 1) + ' of ' + state.queue.items.length : (r.published ? r.published.slice(0, 4) : 'Mohit Pandey') + ' · ' + (state.queue.index + 1) + ' of ' + state.queue.items.length;
  $('muYTM').href = r.playlist ? albumUrl(r.playlist) : musicUrl(r.id);
  $('muMiniCover').style.backgroundImage = 'url("' + coverUrl(r.id) + '")'; $('muMiniTitle').textContent = r.title;
  document.body.style.setProperty('--glow', lighten(s.from, 0.45));
  document.querySelectorAll('.mu-spine').forEach((b) => b.classList.toggle('on', b.dataset.id === r.id));
}
function play(r) {
  $('muFallback').hidden = true;
  const at = state.queue.items.findIndex((x) => x.id === r.id);
  if (at < 0) setQueue(state.shown.length ? state.shown : state.all, r.id, ''); else state.queue.index = at;
  carousel.select(state.queue.index, true); show(r);
  $('muSeek').value = 0; $('muCur').textContent = '0:00'; $('muDurT').textContent = '0:00';
  $('muStage').classList.add('has-track'); document.body.classList.add('mu-started');
  if (r.playlist) startPlayback(r);
}
function setQueue(list, startId, mood) {
  state.mood = mood; state.queue = makeQueue(list, startId, state.shuffle);
  carousel.setItems(state.queue.items, startId || (state.queue.items[0] && state.queue.items[0].id));
  document.querySelectorAll('.mu-mood').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mood === mood && !!mood)));
  show(state.queue.items[state.queue.index]);
}
function go(dir, ended) {
  const i = advance(state.queue, dir, ended ? state.repeat : 'all', ended);
  if (i < 0) return; if (ended && state.repeat === 'one') { state.queue.index = i; play(state.queue.items[i]); return; }
  state.queue.index = i; play(state.queue.items[i]);
}
function autoNext() { go(1, true); }
function toggle() {
  if (!state.current) return;
  if (!yt || !yt.getPlayerState) { play(state.current); return; }
  yt.getPlayerState() === 1 ? yt.pauseVideo() : yt.playVideo();
}

/* ---------- moods and the smart mix ---------- */
function startMood(mood, why) {
  const list = byMood(state.all, mood);
  if (!list.length) return;
  const first = state.shuffle ? list[Math.floor(Math.random() * list.length)] : list[0];
  setQueue(list, first.id, mood);
  play(first);
  if (why) $('muSub').textContent = why + ' · ' + (MOODS.find((m) => m.id === mood) || {}).label + ' mix · 1 of ' + list.length;
}
function renderMoods() {
  $('muMoods').innerHTML = '<button type="button" class="mu-chip smart" id="muSmart" title="Chooses a mood for this hour of the day, on your device">&#10024; Smart pick</button>'
    + MOODS.filter((m) => byMood(state.all, m.id).length).map((m) => '<button type="button" class="mu-chip mu-mood" data-mood="' + m.id + '" aria-pressed="false">' + m.emoji + ' ' + esc(m.label) + '</button>').join('')
    + '<button type="button" class="mu-chip" id="muSurprise">&#127922; Surprise me</button><button type="button" class="mu-chip" id="muAll">All albums</button>';
}

/* ---------- events ---------- */
document.addEventListener('click', (e) => {
  const sp = e.target.closest('.mu-spine'); if (sp) { const r = state.all.find((x) => x.id === sp.dataset.id); if (r) { play(r); $('muStage').scrollIntoView({ behavior: 'smooth', block: 'start' }); } return; }
  const m = e.target.closest('.mu-mood'); if (m) { startMood(m.dataset.mood); return; }
  const id = e.target.closest('button') && e.target.closest('button').id;
  if (id === 'muSmart') { const s = smartMood(new Date().getHours()); startMood(s.mood, 'Smart pick: ' + s.why); }
  else if (id === 'muSurprise') { const r = state.all[Math.floor(Math.random() * state.all.length)]; setQueue(state.all, r.id, ''); play(r); }
  else if (id === 'muAll') { setQueue(state.all, state.current && state.current.id, ''); }
  else if (id === 'muPlay' || id === 'muMiniPlay') toggle();
  else if (id === 'muNext' || id === 'muMiniNext') go(1);
  else if (id === 'muPrev' || id === 'muMiniPrev') go(-1);
  else if (id === 'muShuffle') {
    state.shuffle = !state.shuffle; e.target.setAttribute('aria-pressed', String(state.shuffle));
    setQueue(state.mood ? byMood(state.all, state.mood) : state.all, state.current && state.current.id, state.mood);
  }
  else if (id === 'muRepeat') { state.repeat = { off: 'all', all: 'one', one: 'off' }[state.repeat]; e.target.dataset.mode = state.repeat; e.target.setAttribute('aria-label', 'Repeat: ' + state.repeat); e.target.textContent = state.repeat === 'one' ? '\u{1F502}' : '\u{1F501}'; e.target.setAttribute('aria-pressed', String(state.repeat !== 'off')); }
  else if (e.target.dataset.viz) { viz.setMode(e.target.dataset.viz); document.querySelectorAll('[data-viz]').forEach((b) => b.setAttribute('aria-pressed', String(b === e.target))); }
});
$('muSeek').addEventListener('input', (e) => { try { const d = yt.getDuration(); yt.seekTo(d * e.target.value / 1000, true); } catch (x) { /* not ready */ } });
$('muVol').addEventListener('input', (e) => { try { yt.setVolume(Number(e.target.value)); } catch (x) { /* not ready */ } });
$('muSearch').addEventListener('input', (e) => { state.query = e.target.value; renderShelf(); });
document.addEventListener('keydown', (e) => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (e.key === 'MediaPlayPause' || (e.key === 'k' && !e.metaKey && !e.ctrlKey)) toggle();
  else if (e.key === 'MediaTrackNext' || e.key === 'n') go(1);
  else if (e.key === 'MediaTrackPrevious' || e.key === 'p') go(-1);
});
let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(renderShelf, 150); });
new IntersectionObserver((en) => { document.body.classList.toggle('mu-stage-away', !en[0].isIntersecting); }).observe(document.querySelector('.mu-ctl'));

/* ---------- start ---------- */
carousel = mountCarousel($('muCarousel'), {
  onChange: (r, i) => {
    state.queue.index = i; show(r);
    /* keep sound and cover together: if music is on, the swiped-to album starts (after a short pause so fast swiping does not thrash the player) */
    if (state.playing || document.body.classList.contains('mu-started')) { clearTimeout(swipeT); swipeT = setTimeout(() => { if (state.current && state.current.id === r.id) play(r); }, 450); }
  },
  onActivate: (r) => { if (state.current && state.current.id === r.id && yt && yt.getPlayerState) toggle(); else play(r); },
});
viz = mountViz($('muViz')); dust = mountDust($('muDust'));
await load();
if (!state.all.length) {
  $('muStage').hidden = true;
  $('muShelves').innerHTML = '<div class="mu-empty"><h2>The shelf is waiting for its first albums</h2><p>' + (state.failed ? 'The album list could not be loaded.' : 'No albums have been imported yet.') + '</p>'
    + '<p>Fill it with <code>YT_API_KEY=&hellip; node tools/import-youtube-releases.mjs --handle mohucool</code> and publish <code>music/releases.json</code>.</p><p><a class="mu-btn" href="https://www.youtube.com/@mohucool" target="_blank" rel="noopener noreferrer">Open the channel on YouTube</a></p></div>';
} else {
  renderMoods(); renderShelf(); const want = decodeURIComponent((location.hash || '').slice(1));
  if (want === 'shuffle') queueMicrotask(() => $('muSurprise') && $('muSurprise').click());
  setQueue(state.all, (state.all.find((r) => r.id === want) || state.all[0]).id, '');
}
