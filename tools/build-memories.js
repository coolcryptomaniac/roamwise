#!/usr/bin/env node
/* Builds memories/data.json (what the Memories page and the homepage carousel read).
   Sources, merged and sorted newest first:
     1. memories/seed.json                         hand-curated events
     2. assets/memories/YYYY-MM-DD-slug/           drop photos here; optional event.json {title,place,caption,emoji,theme,videos:[{title,youtube|src|url}]}
     3. --youtube                                  new @mohucool videos about events (needs network; used by the daily workflow)
   Usage: node tools/build-memories.js [--youtube] [--check]   (--check exits 1 if data.json is out of date) */
'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const IMG = /\.(jpe?g|png|webp|avif)$/i;
const CHANNEL_FEED = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1ciaSee_BYW8AVFqEe6mcQ';
const EVENT_WORDS = /dussehra|kasar|startup garage|e-cell|festival|\bfest\b|meetup|summit|launch/i;
const titleCase = s => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function folderEvents() {
  const base = path.join(root, 'assets/memories'); if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory() && /^\d{4}-\d{2}-\d{2}-/.test(d.name)).map(d => {
    const dir = path.join(base, d.name), meta = fs.existsSync(path.join(dir, 'event.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'event.json'), 'utf8')) : {};
    const photos = fs.readdirSync(dir).filter(f => IMG.test(f)).sort().map(f => ({ src: `/assets/memories/${d.name}/${f}`, cap: (meta.captions && meta.captions[f]) || '' }));
    return Object.assign({ id: d.name.slice(11), date: d.name.slice(0, 10), title: titleCase(d.name.slice(11)), place: '', caption: '', theme: 'stage', emoji: '✨', cover: photos[0] ? photos[0].src : '', photos, videos: [] }, meta, { photos: meta.photos || photos });
  });
}
async function youtubeEvents(known) {
  try {
    const r = await fetch(CHANNEL_FEED); if (!r.ok) return [];
    const xml = await r.text(), out = [];
    xml.split('<entry>').slice(1).forEach(e => {
      const id = (e.match(/<yt:videoId>([^<]+)/) || [])[1], title = (e.match(/<title>([^<]+)/) || [])[1], date = ((e.match(/<published>([^<]+)/) || [])[1] || '').slice(0, 10);
      if (!id || !title || !EVENT_WORDS.test(title) || known.has(id)) return;
      const t = title.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      out.push({ id: 'yt-' + id, date, title: t, place: '', caption: 'New on YouTube @mohucool.', theme: 'fire', emoji: '🎬', cover: '', photos: [], videos: [{ title: t, youtube: id }] });
    });
    return out;
  } catch (e) { return []; }
}
(async () => {
  const seed = read('memories/seed.json').events, ids = new Set(seed.map(e => e.id));
  const folders = folderEvents().filter(e => !ids.has(e.id));
  let events = seed.concat(folders);
  const knownVideos = new Set(); events.forEach(e => (e.videos || []).forEach(v => v.youtube && knownVideos.add(v.youtube)));
  if (process.argv.includes('--youtube')) events = events.concat(await youtubeEvents(knownVideos));
  events.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const out = JSON.stringify({ events }, null, 2) + '\n', file = path.join(root, 'memories/data.json');
  if (process.argv.includes('--check')) { if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== out) { console.error('memories/data.json is out of date: run node tools/build-memories.js'); process.exit(1); } console.log('memories data OK (' + events.length + ' events)'); return; }
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== out) fs.writeFileSync(file, out);
  console.log('memories/data.json: ' + events.length + ' events');
})();
