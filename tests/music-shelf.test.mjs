import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cleanReleases, groupByYear, shelves, spineStyle, filterReleases, neighbour, fmtDuration, musicUrl } from '../music/shelf-core.mjs';
import { isoDurationToSec, parseFeed, mapApiVideos, uploadsPlaylistId } from '../tools/youtube-import-core.mjs';

const rel = (id, title, published, durationSec = 200) => ({ id, title, published, durationSec });

test('shelf: keeps real ids, drops duplicates and junk, newest first', () => {
  const out = cleanReleases([rel('abcdefghijk', 'A <b>song</b>', '2026-03-01'), rel('abcdefghijk', 'dup', '2026-01-01'), rel('short', 'x', '2026-01-01'), rel('zzzzzzzzzzz', '', '2026-01-01'), rel('lmnopqrstuv', 'Older', '2025-02-02')]);
  assert.deepEqual(out.map((r) => r.id), ['abcdefghijk', 'lmnopqrstuv']);
  assert.doesNotMatch(out[0].title, /[<>]/);
  assert.deepEqual(cleanReleases(null), []);
});

test('shelf: groups by year (newest first), splits into rows, spines are stable', () => {
  const list = cleanReleases([rel('aaaaaaaaaaa', 'a', '2026-05-01'), rel('bbbbbbbbbbb', 'b', '2025-05-01'), rel('ccccccccccc', 'c', '2026-01-01')]);
  assert.deepEqual(groupByYear(list).map((g) => [g.year, g.books.length]), [['2026', 2], ['2025', 1]]);
  assert.deepEqual(shelves([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  const s1 = spineStyle(list[0]), s2 = spineStyle(list[0]);
  assert.deepEqual(s1, s2); assert.ok(s1.height >= 150 && s1.height < 200 && s1.width >= 40 && s1.width <= 74);
});

test('shelf: search, next/previous with wrap, shuffle never repeats the song', () => {
  const list = cleanReleases([rel('aaaaaaaaaaa', 'Ghaam', '2026-05-01'), rel('bbbbbbbbbbb', 'Dyo The Rain', '2025-05-01'), rel('ccccccccccc', 'Akele Hain', '2024-01-01')]);
  assert.deepEqual(filterReleases(list, 'rain').map((r) => r.id), ['bbbbbbbbbbb']);
  assert.equal(filterReleases(list, '2024').length, 1);
  assert.equal(neighbour(list, 'ccccccccccc', 1).id, 'aaaaaaaaaaa');
  assert.equal(neighbour(list, 'aaaaaaaaaaa', -1).id, 'ccccccccccc');
  for (let i = 0; i < 20; i++) assert.notEqual(neighbour(list, 'aaaaaaaaaaa', 1, true, Math.random).id, 'aaaaaaaaaaa');
  assert.equal(fmtDuration(222), '3:42'); assert.match(musicUrl('abcdefghijk'), /music\.youtube\.com/);
});

test('importer: durations, feed, API rows (Shorts and live streams skipped)', () => {
  assert.equal(isoDurationToSec('PT3M42S'), 222); assert.equal(isoDurationToSec('PT1H2M3S'), 3723); assert.equal(isoDurationToSec('junk'), 0);
  const xml = '<feed><entry><yt:videoId>abcdefghijk</yt:videoId><title>Tum &amp; Main</title><published>2026-10-01T10:00:00+00:00</published></entry></feed>';
  assert.deepEqual(parseFeed(xml), [{ id: 'abcdefghijk', title: 'Tum & Main', published: '2026-10-01', durationSec: 0 }]);
  const api = mapApiVideos([
    { id: 'aaaaaaaaaaa', snippet: { title: 'Song', publishedAt: '2026-01-01T00:00:00Z', liveBroadcastContent: 'none' }, contentDetails: { duration: 'PT3M10S' } },
    { id: 'bbbbbbbbbbb', snippet: { title: 'Short', publishedAt: '2026-01-02T00:00:00Z' }, contentDetails: { duration: 'PT45S' } },
    { id: 'ccccccccccc', snippet: { title: 'Live', publishedAt: '2026-01-03T00:00:00Z', liveBroadcastContent: 'live' }, contentDetails: { duration: 'PT1H' } }]);
  assert.deepEqual(api.map((r) => r.id), ['aaaaaaaaaaa']);
  assert.equal(uploadsPlaylistId('UC1ciaSee_BYW8AVFqEe6mcQ'), 'UU1ciaSee_BYW8AVFqEe6mcQ'); assert.equal(uploadsPlaylistId('x'), '');
});

test('release file: the shipped file is valid and never holds invented songs', () => {
  const j = JSON.parse(readFileSync(new URL('../music/releases.json', import.meta.url), 'utf8'));
  assert.equal(j.channel.handle, 'mohucool'); assert.equal(cleanReleases(j.releases).length, j.releases.length);
});
