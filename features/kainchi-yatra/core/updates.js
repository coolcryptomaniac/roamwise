/* Untrusted feed records remain text; timestamps never imply that a road is open. */
(function (root) {
  'use strict';
  var api = root.RWKainchiCore;
  function safeURL(value) {
    try {
      var u = new URL(value);
      return u.protocol === 'https:' && !u.username && !u.password ? u.href : '';
    } catch (e) { return ''; }
  }
  function stamp(value, now) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return null;
    var t = Date.parse(value);
    return Number.isFinite(t) && t <= now ? t : null;
  }
  function normalize(data, now) {
    now = now || Date.now();
    if (!data || data.version !== 1 || !Array.isArray(data.items) || !Array.isArray(data.sources)) throw new Error('Invalid update snapshot');
    var seen = Object.create(null), items = [];
    data.items.slice(0, 100).forEach(function (item) {
      if (!item || typeof item.title !== 'string') return;
      var url = safeURL(item.url), published = stamp(item.publishedAt, now);
      if (!url || !published || seen[url]) return;
      seen[url] = true;
      var host = new URL(url).hostname;
      var official = item.kind === 'official' && ['nainital.nic.in', 'uttarakhandpolice.uk.gov.in'].indexOf(host) !== -1;
      items.push({ title: item.title.slice(0, 240), url: url, publishedAt: new Date(published).toISOString(),
        publisher: String(item.publisher || host).slice(0, 80), kind: official ? 'official' : 'news',
        recent: now - published <= 48 * 3600000 });
    });
    items.sort(function (a, b) { return b.publishedAt.localeCompare(a.publishedAt); });
    return { version: 1, checkedAt: stamp(data.checkedAt, now) ? data.checkedAt : null,
      items: items.slice(0, 30), sources: data.sources.slice(0, 12).filter(function (s) { return s && safeURL(s.url); }).map(function (s) {
        return { id: String(s.id || ''), name: String(s.name || '').slice(0, 100), url: safeURL(s.url),
          status: ['ok', 'error', 'manual'].indexOf(s.status) !== -1 ? s.status : 'pending',
          lastSuccessAt: stamp(s.lastSuccessAt, now) ? s.lastSuccessAt : null,
          checkedAt: stamp(s.checkedAt, now) ? s.checkedAt : null };
      }) };
  }
  api.updates = { normalize: normalize, safeURL: safeURL,
    stale: function (date, now) { var t = stamp(date, now || Date.now()); return !t || (now || Date.now()) - t > 30 * 3600000; } };
})(globalThis);
