// music/shelf-core.mjs - pure helpers for the music bookshelf: clean data, group by year, give every song a stable "book spine".
// No network, no DOM. The page (music.js) draws what these return.

const ID = /^[A-Za-z0-9_-]{11}$/;
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
    out.push({ id, title, published, durationSec: sec });
  }
  return out.sort((a, b) => (a.published < b.published ? 1 : a.published > b.published ? -1 : a.title.localeCompare(b.title)));
}

export const yearOf = (r) => (r.published ? r.published.slice(0, 4) : 'Undated');

/* [{year, books:[...]}], newest year first. */
export function groupByYear(releases) {
  const map = new Map();
  for (const r of releases) { const y = yearOf(r); if (!map.has(y)) map.set(y, []); map.get(y).push(r); }
  return [...map.entries()].sort((a, b) => (a[0] === 'Undated' ? 1 : b[0] === 'Undated' ? -1 : b[0].localeCompare(a[0]))).map(([year, books]) => ({ year, books }));
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

export const watchUrl = (id) => 'https://www.youtube.com/watch?v=' + id;
export const musicUrl = (id) => 'https://music.youtube.com/watch?v=' + id;
export const coverUrl = (id) => 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
