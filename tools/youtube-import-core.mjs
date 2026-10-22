// tools/youtube-import-core.mjs - turns YouTube answers into music/releases.json entries. Pure, so it can be tested.
// Two sources: the YouTube Data API (every upload, needs a key) and the channel RSS feed (the latest 15, no key).

const dec = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/* ISO 8601 duration like PT3M42S or PT1H2M3S to seconds. */
export function isoDurationToSec(iso) {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(String(iso || ''));
  if (!m) return 0;
  return (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0);
}

/* Latest uploads from the channel RSS feed. */
export function parseFeed(xml) {
  const out = [];
  for (const block of String(xml || '').split('<entry>').slice(1)) {
    const id = (/<yt:videoId>([^<]+)<\/yt:videoId>/.exec(block) || [])[1];
    const title = (/<title>([^<]*)<\/title>/.exec(block) || [])[1];
    const published = (/<published>([^<]+)<\/published>/.exec(block) || [])[1];
    if (id && title) out.push({ id, title: dec(title), published: (published || '').slice(0, 10), durationSec: 0 });
  }
  return out;
}

/* Rows from videos.list (part=snippet,contentDetails). Shorts and clips under minSec are skipped; so are videos not yet public. */
export function mapApiVideos(items, { minSec = 61 } = {}) {
  const out = [];
  for (const v of items || []) {
    const sn = v.snippet || {}, sec = isoDurationToSec(v.contentDetails && v.contentDetails.duration);
    if (!v.id || !sn.title || sec < minSec) continue;
    if (sn.liveBroadcastContent && sn.liveBroadcastContent !== 'none') continue;
    out.push({ id: v.id, title: sn.title, published: String(sn.publishedAt || '').slice(0, 10), durationSec: sec });
  }
  return out;
}

/* The uploads playlist of a channel id is the same id with UC changed to UU. */
export const uploadsPlaylistId = (channelId) => (/^UC[\w-]{22}$/.test(channelId || '') ? 'UU' + channelId.slice(2) : '');
