#!/usr/bin/env node
// Import your songs from YouTube into music/releases.json (the music bookshelf reads that file).
//   Everything you uploaded:  YT_API_KEY=... node tools/import-youtube-releases.mjs --handle mohucool
//   Just the latest 15 (no key): node tools/import-youtube-releases.mjs --channel UC1ciaSee_BYW8AVFqEe6mcQ
// Options: --min-seconds 61 (skip Shorts), --out music/releases.json. Run it on your own computer; it only reads public data.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parseFeed, mapApiVideos, uploadsPlaylistId } from './youtube-import-core.mjs';

const arg = (name, dflt) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt; };
const out = arg('out', 'music/releases.json'), handle = arg('handle', ''), minSec = Number(arg('min-seconds', '61'));
let channelId = arg('channel', ''); const key = process.env.YT_API_KEY || '';
const API = 'https://www.googleapis.com/youtube/v3/';
const get = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(r.status + ' ' + (await r.text()).slice(0, 200)); return r; };

async function viaApi() {
  if (!channelId) {
    const c = await (await get(API + 'channels?part=id&forHandle=' + encodeURIComponent(handle) + '&key=' + key)).json();
    channelId = c.items && c.items[0] && c.items[0].id;
    if (!channelId) throw new Error('No channel found for handle ' + handle);
  }
  const playlist = uploadsPlaylistId(channelId), ids = [];
  let token = '';
  do {
    const p = await (await get(API + 'playlistItems?part=contentDetails&maxResults=50&playlistId=' + playlist + (token ? '&pageToken=' + token : '') + '&key=' + key)).json();
    for (const it of p.items || []) ids.push(it.contentDetails.videoId);
    token = p.nextPageToken || '';
  } while (token);
  const releases = [];
  for (let i = 0; i < ids.length; i += 50) {
    const v = await (await get(API + 'videos?part=snippet,contentDetails&id=' + ids.slice(i, i + 50).join(',') + '&key=' + key)).json();
    releases.push(...mapApiVideos(v.items, { minSec }));
  }
  return releases;
}
async function viaFeed() {
  if (!channelId) throw new Error('Without an API key, pass --channel UC... (your channel id).');
  return parseFeed(await (await get('https://www.youtube.com/feeds/videos.xml?channel_id=' + channelId)).text());
}

const fresh = key ? await viaApi() : await viaFeed();
const old = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : { releases: [] };
const byId = new Map((old.releases || []).map((r) => [r.id, r]));
for (const r of fresh) byId.set(r.id, { ...byId.get(r.id), ...r, durationSec: r.durationSec || (byId.get(r.id) || {}).durationSec || 0 });
const releases = [...byId.values()].sort((a, b) => (a.published < b.published ? 1 : -1));
writeFileSync(out, JSON.stringify({ channel: { handle: handle || old.channel?.handle || 'mohucool', id: channelId || old.channel?.id || '' }, importedAt: new Date().toISOString().slice(0, 10), releases }, null, 2) + '\n');
console.log('Wrote ' + releases.length + ' songs to ' + out + (key ? '' : ' (latest uploads only; add YT_API_KEY for the full catalogue)'));
