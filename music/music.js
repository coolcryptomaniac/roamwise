// music/music.js - the music bookshelf page. Data: releases.json (written by tools/import-youtube-releases.mjs).
import { cleanReleases, groupByYear, shelves, spineStyle, fmtDuration, filterReleases, neighbour, musicUrl, albumUrl, coverUrl } from './shelf-core.mjs';

const $ = (id) => document.getElementById(id);
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const demo = /[?&]demo=1\b/.test(location.search);
const state = { all: [], shown: [], current: null, shuffle: false, query: '', demo, playing: false };
let yt = null, ytReady = null;

async function load() {
  const url = demo ? 'releases.sample.json' : 'releases.json';
  try { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw 0; const j = await r.json(); state.all = demo ? sampleOk(j) : cleanReleases(j.releases); state.channel = j.channel || {}; }
  catch (e) { state.all = []; state.failed = true; }
}
// The demo file has made-up ids that are not real videos: keep them for the picture only.
const sampleOk = (j) => (j.releases || []).map((r) => ({ id: r.id, title: r.title, published: r.published, durationSec: r.durationSec, playlist: '', seq: 0 }));

const perShelf = () => Math.max(4, Math.floor(($('muShelves').clientWidth - 40) / 62));

function spine(r) {
  const s = spineStyle(r);
  return '<button type="button" class="mu-spine' + (state.current && state.current.id === r.id ? ' on' : '') + '" data-id="' + esc(r.id) + '" aria-label="' + esc(r.title) + (r.published ? ', ' + esc(r.published.slice(0, 4)) : '') + '" style="--h:' + s.height + 'px;--w:' + s.width + 'px;--a:' + s.from + ';--b:' + s.to + '">'
    + '<span class="mu-band b' + s.band + (s.brass ? ' brass' : '') + '"></span><span class="mu-st">' + esc(r.title) + '</span><span class="mu-dur">' + esc(fmtDuration(r.durationSec)) + '</span></button>';
}

function render() {
  state.shown = filterReleases(state.all, state.query);
  const root = $('muShelves');
  if (!state.all.length) {
    root.innerHTML = '<div class="mu-empty"><h2>The shelf is waiting for its first songs</h2><p>' + (state.failed ? 'The song list could not be loaded.' : 'No songs have been imported yet.') + '</p>'
      + '<p>To fill it, run <code>YT_API_KEY=&hellip; node tools/import-youtube-releases.mjs --handle mohucool</code> on your computer, then publish <code>music/releases.json</code>. Or <a href="?demo=1">see a demo shelf</a>.</p>'
      + '<p><a class="mu-btn" href="https://www.youtube.com/@mohucool" target="_blank" rel="noopener noreferrer">Open the channel on YouTube</a></p></div>';
    return;
  }
  if (!state.shown.length) { root.innerHTML = '<p class="mu-note">No song matches that search.</p>'; return; }
  const n = perShelf();
  root.innerHTML = (demo ? '<p class="mu-demo">Demo shelf: sample titles only, nothing here can play.</p>' : '')
    + groupByYear(state.shown).map((g) => '<section class="mu-year"><h2 class="mu-plaque">' + esc(g.year) + '<small>' + g.books.length + (g.books.length === 1 ? ' release' : ' releases') + '</small></h2>'
      + shelves(g.books, n).map((row) => '<div class="mu-shelf"><div class="mu-books">' + row.map(spine).join('') + '</div><div class="mu-plank"></div></div>').join('') + '</section>').join('');
}

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

async function play(r) {
  state.current = r;
  const p = $('muPlayer'); p.hidden = false;
  $('muTitle').textContent = r.title; $('muSub').textContent = [r.published ? r.published.slice(0, 4) : '', fmtDuration(r.durationSec)].filter(Boolean).join(' · ');
  $('muYTM').href = r.playlist ? albumUrl(r.playlist) : musicUrl(r.id);
  $('muCover').style.backgroundImage = demo ? '' : 'url("' + coverUrl(r.id) + '")';
  document.querySelectorAll('.mu-spine').forEach((b) => b.classList.toggle('on', b.dataset.id === r.id));
  if (demo) return;
  try {
    const YT = await loadApi();
    if (yt && yt.loadVideoById) { r.playlist ? yt.loadPlaylist({ list: r.playlist, listType: 'playlist' }) : yt.loadVideoById(r.id); return; }
    yt = new YT.Player('muFrame', { ...(r.playlist ? {} : { videoId: r.id }), width: '100%', height: '100%', host: 'https://www.youtube-nocookie.com',
      playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, ...(r.playlist ? { listType: 'playlist', list: r.playlist } : {}) },
      events: { onStateChange: (e) => { state.playing = e.data === 1; $('muPlay').innerHTML = state.playing ? '&#9208;' : '&#9654;'; if (e.data === 0 && albumDone()) step(1); } } });
  } catch (e) {
    $('muFrame').innerHTML = '<iframe title="' + esc(r.title) + '" src="https://www.youtube-nocookie.com/embed/' + (r.playlist ? 'videoseries?list=' + esc(r.playlist) + '&' : esc(r.id) + '?') + 'autoplay=1&rel=0&playsinline=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  }
}
function albumDone() { try { const l = yt.getPlaylist && yt.getPlaylist(); return !l || yt.getPlaylistIndex() >= l.length - 1; } catch (e) { return true; } }
function step(dir) { const n = neighbour(state.shown.length ? state.shown : state.all, state.current && state.current.id, dir, state.shuffle); if (n) play(n); }

document.addEventListener('click', (e) => {
  const b = e.target.closest('.mu-spine'); if (b) { const r = state.all.find((x) => x.id === b.dataset.id); if (r) play(r); return; }
  if (e.target.id === 'muNext') step(1);
  if (e.target.id === 'muPrev') step(-1);
  if (e.target.id === 'muPlay' && yt && yt.getPlayerState) { yt.getPlayerState() === 1 ? yt.pauseVideo() : yt.playVideo(); }
  if (e.target.id === 'muShuffle') { state.shuffle = !state.shuffle; e.target.setAttribute('aria-pressed', state.shuffle); e.target.classList.toggle('on', state.shuffle); }
  if (e.target.id === 'muClose') { if (yt && yt.stopVideo) yt.stopVideo(); $('muPlayer').hidden = true; }
});
$('muSearch').addEventListener('input', (e) => { state.query = e.target.value; render(); });
let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(render, 150); });
await load(); render();
