// music/shelf-core.mjs - pure helpers for the music bookshelf: clean data, group by year, give every song a stable "book spine".
// No network, no DOM. The page (music.js) draws what these return.

const ID = /^[A-Za-z0-9_-]{11}$/;
export const MOODS = Object.freeze([
  { id: 'pahadi', label: 'Pahadi', emoji: '\u26f0\ufe0f' }, { id: 'love', label: 'Love', emoji: '\ud83d\udc9e' },
  { id: 'party', label: 'Party', emoji: '\ud83e\udea9' }, { id: 'devotion', label: 'Devotion', emoji: '\ud83d\udd49\ufe0f' },
  { id: 'cosmic', label: 'Cosmic', emoji: '\ud83e\ude90' }, { id: 'uplift', label: 'Uplift', emoji: '\u2600\ufe0f' },
]);
const MOOD_IDS = new Set(MOODS.map((m) => m.id));
const clean = (s, max) => String(s == null ? '' : s).replace(/[<>\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

/* Keep only well-formed releases. A release needs a real 11-character YouTube id and a title. */
export function cleanReleases(list) {
  const seen = new Set(), out = [];
  for (const r of Array.isArray(list) ? list : []) {
    const id = String((r && r.id) || '');
    if (!ID.test(id) || seen.has(id)) continue;
    const title = clean(r.title, 120);
    if (!title) continue;
    seen.add(id);
    const published = /^\d{4}-\d{2}-\d{2}/.test(r.published || '') ? String(r.published).slice(0, 10) : '';
    const sec = Number.isFinite(Number(r.durationSec)) && Number(r.durationSec) > 0 ? Math.round(Number(r.durationSec)) : 0;
    const pl = /^[A-Za-z0-9_-]{10,64}$/.test(String(r.playlist || '')) ? String(r.playlist) : '';
    const seq = Number.isFinite(Number(r.seq)) ? Number(r.seq) : 0;
    const moods = (Array.isArray(r.moods) ? r.moods : []).filter((m) => MOOD_IDS.has(m));
    const spotify = /^https:\/\/open\.spotify\.com\/album\/[A-Za-z0-9]{10,40}$/.test(String(r.spotify || '')) ? String(r.spotify) : '';
    const art = /^https:\/\/(image-cdn[a-z0-9-]*\.spotifycdn\.com|i\.scdn\.co)\/image\/[A-Za-z0-9]+$/.test(String(r.art || '')) ? String(r.art) : '';
    out.push({ id, title, published, durationSec: sec, playlist: pl, seq, moods, spotify, art });
  }
  return out.sort((a, b) => (a.published < b.published ? 1 : a.published > b.published ? -1 : b.seq - a.seq || a.title.localeCompare(b.title)));
}

export const yearOf = (r) => (r.published ? r.published.slice(0, 4) : 'The collection');

/* [{year, books:[...]}], newest year first. */
export function groupByYear(releases) {
  const map = new Map();
  for (const r of releases) { const y = yearOf(r); if (!map.has(y)) map.set(y, []); map.get(y).push(r); }
  return [...map.entries()].sort((a, b) => (a[0] === 'The collection' ? 1 : b[0] === 'The collection' ? -1 : b[0].localeCompare(a[0]))).map(([year, books]) => ({ year, books }));
}

/* Split a year's books into shelf rows of `perShelf`. */
export function shelves(books, perShelf) {
  const n = Math.max(1, Math.floor(perShelf) || 1), rows = [];
  for (let i = 0; i < books.length; i += n) rows.push(books.slice(i, i + n));
  return rows;
}

function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }

const LEATHER = Object.freeze([
  ['#5b1d1d', '#3a1010'], ['#1f3b2c', '#112619'], ['#1c2f4f', '#0f1b33'], ['#6a4416', '#40280b'],
  ['#3d1f4a', '#26112f'], ['#17484a', '#0c2c2e'], ['#4a3a1d', '#2c2210'], ['#5a2a38', '#381620'],
]);

/* A stable look for each song: height, width, colours and a brass band, from its id. Same song, same spine, every visit. */
export function spineStyle(release) {
  const h = hash(release.id), pair = LEATHER[h % LEATHER.length];
  const min = release.durationSec || 200;
  const width = 40 + Math.min(26, Math.round(min / 12)) + (h >>> 3) % 8; // longer songs, thicker books (40-74 px)
  return { height: 150 + (h >>> 5) % 46, width, from: pair[0], to: pair[1], band: (h >>> 9) % 3, brass: ((h >>> 12) % 2) === 0 };
}

export function fmtDuration(sec) {
  if (!sec) return '';
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}

export function filterReleases(releases, q) {
  const needle = String(q || '').trim().toLowerCase();
  return needle ? releases.filter((r) => r.title.toLowerCase().includes(needle) || (r.published || '').startsWith(needle)) : releases;
}

/* Next and previous in the shelf order (newest first), wrapping round; shuffle picks any other song. */
export function neighbour(list, id, dir, shuffle = false, rand = Math.random) {
  if (!list.length) return null;
  const i = list.findIndex((r) => r.id === id);
  if (shuffle && list.length > 1) { let j; do { j = Math.floor(rand() * list.length); } while (j === i); return list[j]; }
  return list[(i + dir + list.length) % list.length];
}

export const albumUrl = (playlist) => 'https://music.youtube.com/playlist?list=' + playlist;
/* The song inside its album, as YouTube Music opens it (app or web). */
export const ytmUrl = (id, playlist) => 'https://music.youtube.com/watch?v=' + id + (playlist ? '&list=' + playlist : '');
export const watchUrl = (id) => 'https://www.youtube.com/watch?v=' + id;
export const musicUrl = (id) => 'https://music.youtube.com/watch?v=' + id;
export const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const coverUrl = (id) => 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
/* Real square album art from Spotify when we have it, else the YouTube thumbnail. */
export const coverOf = (r) => (r && r.art) || coverUrl(r && r.id);

/* Albums tagged with a mood. */
export const byMood = (list, mood) => list.filter((r) => (r.moods || []).includes(mood));

/* A mood to suggest for the hour of the day (0-23). Plain rules, no network. */
export function smartMood(hour) {
  const h = ((Number(hour) % 24) + 24) % 24;
  if (h >= 5 && h < 11) return { mood: 'uplift', why: 'a bright start to the morning' };
  if (h >= 11 && h < 17) return { mood: 'pahadi', why: 'hills for the afternoon' };
  if (h >= 17 && h < 22) return { mood: 'love', why: 'an easy evening' };
  return { mood: 'cosmic', why: 'a late-night drift' };
}

export function shuffled(list, rand = Math.random) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* A play queue. start = id to begin on; shuffle puts a random order after it. Returns {items, index}. */
export function makeQueue(list, startId, shuffle = false, rand = Math.random) {
  const start = list.find((r) => r.id === startId) || list[0];
  if (!start) return { items: [], index: 0 };
  if (!shuffle) return { items: list.slice(), index: list.indexOf(start) };
  return { items: [start, ...shuffled(list.filter((r) => r !== start), rand)], index: 0 };
}

/* Move through a queue. repeat: 'off' | 'all' | 'one'. Returns the new index, or -1 when the queue is finished. */
export function advance(queue, dir, repeat = 'off', ended = false) {
  const n = queue.items.length;
  if (!n) return -1;
  if (ended && repeat === 'one') return queue.index;
  const next = queue.index + dir;
  if (next >= 0 && next < n) return next;
  return repeat === 'all' || !ended ? (next + n) % n : -1;
}

/* A lighter version of a hex colour, for glows. */
export function lighten(hex, amount = 0.5) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#fff0c2';
  const n = parseInt(m[1], 16), mix = (c) => Math.round(c + (255 - c) * amount);
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => mix(c).toString(16).padStart(2, '0')).join('');
}
