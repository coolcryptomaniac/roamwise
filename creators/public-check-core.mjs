/* creators/public-check-core.mjs - checks a creator against PUBLIC sources when Instagram's own API is not switched on.
   Allowed sources only: YouTube's official Data API (public channel numbers), a web-search "footprint" (links a person can
   open and judge), and plain search links the admin opens in a browser. Instagram pages are NOT scraped: Instagram's terms
   forbid it and it gets the RoamWise account blocked; Instagram numbers come from the official API (ig-rating-core.mjs) or
   from the creator's own Insights screenshot. Pure functions, no network. */
const num = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; };
const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const str = (v, n = 160) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);

/** A YouTube channel from a link or @handle: { by:'id'|'handle'|'user', value } or null. */
export function youtubeRef(input) {
  const s = String(input || '').trim();
  if (!s) return null;
  let m = /youtube\.com\/channel\/(UC[A-Za-z0-9_-]{20,})/i.exec(s); if (m) return { by: 'id', value: m[1] };
  m = /youtube\.com\/@([A-Za-z0-9._-]{2,60})/i.exec(s); if (m) return { by: 'handle', value: '@' + m[1] };
  m = /youtube\.com\/(?:user|c)\/([A-Za-z0-9._-]{2,60})/i.exec(s); if (m) return { by: 'user', value: m[1] };
  if (/^@[A-Za-z0-9._-]{2,60}$/.test(s)) return { by: 'handle', value: s };
  return null;
}

/** YouTube Data API answers -> the same metrics shape the tiers use. channel = channels.list item; videos = videos.list items. */
export function analyzeYoutube(channel = {}, videos = [], opts = {}) {
  const now = Date.parse(opts.now || new Date().toISOString());
  const st = channel.statistics || {}, hidden = st.hiddenSubscriberCount === true || st.hiddenSubscriberCount === 'true';
  const subs = hidden ? 0 : num(st.subscriberCount);
  const rows = (videos || []).map((v) => ({ views: num(v.statistics && v.statistics.viewCount), likes: num(v.statistics && v.statistics.likeCount), comments: num(v.statistics && v.statistics.commentCount), at: Date.parse((v.snippet && v.snippet.publishedAt) || '') }))
    .filter((v) => Number.isFinite(v.at) && now - v.at > 864e5 * 2);           // very new videos have not collected their numbers
  const er = rows.filter((v) => v.views > 0).map((v) => (v.likes + v.comments) / v.views * 100);
  const last = (videos || []).map((v) => Date.parse((v.snippet && v.snippet.publishedAt) || '')).filter(Number.isFinite);
  const posts30 = last.filter((t) => now - t <= 30 * 864e5).length;
  const avgViews = Math.round(median(rows.map((v) => v.views)));
  return {
    title: str(channel.snippet && channel.snippet.title, 80), channelId: str(channel.id, 40), videosSampled: rows.length,
    metrics: { followers: subs, engagementPct: Math.round(median(er) * 100) / 100, avgViews, postsLast30d: posts30, metricsVerified: true, source: 'youtube_data_api' },
    signals: { lastPostDays: last.length ? Math.floor((now - Math.max(...last)) / 864e5) : null, hiddenSubscribers: hidden, viewsToSubsPct: subs ? Math.round(avgViews / subs * 1000) / 10 : null, totalVideos: num(st.videoCount) },
  };
}

/** Web-search results -> a short list of independent links a person can read. Own profile pages are separated out. */
export function summarizeFootprint(results = [], who = {}) {
  const own = new RegExp('(instagram\\.com|youtube\\.com|youtu\\.be|facebook\\.com|linktr\\.ee)', 'i');
  const seen = new Set(), items = [];
  (results || []).forEach((r) => {
    const url = str(r && r.url, 300); if (!/^https:\/\//i.test(url)) return;
    let host = ''; try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (_) { return; }
    const key = host + (own.test(host) ? new URL(url).pathname : '');
    if (seen.has(key)) return; seen.add(key);
    items.push({ title: str(r.title, 120), url, domain: host, own: own.test(host) });
  });
  const independent = items.filter((i) => !i.own);
  const level = independent.length >= 4 ? 'strong' : independent.length >= 1 ? 'some' : items.length ? 'thin' : 'none';
  return { level, independent: independent.length, items: items.slice(0, 8),
    note: { strong: 'Several independent pages mention this creator.', some: 'A few independent pages mention this creator.', thin: 'Only their own social pages show up.', none: 'Nothing found for this name and handle.' }[level] };
}

/** Plain links the admin can open in a browser; nothing is fetched by RoamWise. */
export function quickLinks({ name = '', handle = '', youtube = '' } = {}) {
  const q = encodeURIComponent([str(name, 60), igUser(handle)].filter(Boolean).join(' '));
  const out = [];
  if (/^https:\/\//i.test(handle)) out.push({ label: 'Instagram profile', url: handle });
  if (/^https:\/\//i.test(youtube)) out.push({ label: 'YouTube channel', url: youtube });
  out.push({ label: 'Google', url: 'https://www.google.com/search?q=' + q });
  out.push({ label: 'YouTube search', url: 'https://www.youtube.com/results?search_query=' + q });
  return out;
}
function igUser(h) { const m = /instagram\.com\/([A-Za-z0-9._]{1,30})/i.exec(String(h || '')); return m ? m[1] : ''; }
export const searchQuery = (who = {}) => [str(who.name, 60), igUser(who.handle)].filter(Boolean).join(' ') + ' creator';
