/* Refresh only the public same-origin snapshot. No visitor data is transmitted. */
(function (root) {
  'use strict';
  root.RWKainchiUI.updates = function (ctx) {
    var api = ctx.core.updates, snapshot = api.normalize(ctx.core.daily), filter = 'all', loading = false, failed = false;
    var button = ctx.$('updates-refresh');
    function date(value) {
      if (!value) return ctx.t('feed_unknown');
      return new Intl.DateTimeFormat(ctx.lang === 'hi' ? 'hi-IN' : 'en-IN', {
        timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      }).format(new Date(value)) + ' IST';
    }
    function link(text, url, className) {
      var a = ctx.el('a', text, className); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
    }
    function render() {
      var stale = api.stale(snapshot.checkedAt);
      ctx.$('feed-freshness').textContent = ctx.t(stale ? 'feed_stale' : 'feed_checked', { date: date(snapshot.checkedAt) });
      ctx.$('feed-freshness').className = 'feed-stamp' + (stale ? ' stale' : '');
      ctx.$('feed-network').textContent = failed ? ctx.t('feed_failed') : '';
      var box = ctx.$('updates-list'); ctx.clear(box);
      var items = snapshot.items.filter(function (i) { return filter === 'all' || i.kind === filter || (filter === 'history' && !i.recent); });
      items.slice(0, 12).forEach(function (item) {
        var card = ctx.el('li', null, 'update-card');
        card.appendChild(ctx.el('span', ctx.t(item.kind === 'official' ? 'feed_official' : 'feed_news'), 'source-kind'));
        var h = ctx.el('h3'); h.appendChild(link(item.title, item.url)); card.appendChild(h);
        card.appendChild(ctx.el('p', item.publisher + ' · ' + date(item.publishedAt), 'muted'));
        card.appendChild(ctx.el('small', ctx.t(item.recent ? 'feed_recheck' : 'feed_historical'), 'muted'));
        box.appendChild(card);
      });
      if (!items.length) box.appendChild(ctx.el('li', ctx.t('feed_empty'), 'empty'));
      var sources = ctx.$('source-health'); ctx.clear(sources);
      snapshot.sources.forEach(function (s) {
        var row = ctx.el('li', null, 'source-row'); row.appendChild(link(s.name, s.url));
        var old = s.status === 'ok' && api.stale(s.lastSuccessAt);
        row.appendChild(ctx.el('small', ctx.t(old ? 'source_stale' : 'source_' + s.status) + ' · ' + date(s.lastSuccessAt), 'muted'));
        sources.appendChild(row);
      });
      ctx.$('digest-text').textContent = ctx.t('digest_body', {
        recent: snapshot.items.filter(function (i) { return i.recent; }).length,
        ok: snapshot.sources.filter(function (s) { return s.status === 'ok' && !api.stale(s.lastSuccessAt); }).length
      });
      document.querySelectorAll('[data-feed-filter]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.feedFilter === filter));
      });
    }
    async function refresh() {
      if (loading || !root.fetch) return;
      loading = true; button.disabled = true;
      var controller = new AbortController(), timeout = root.setTimeout(function () { controller.abort(); }, 10000);
      try {
        var response = await root.fetch('../features/kainchi-yatra/data/daily.json', { cache: 'no-cache', credentials: 'omit', signal: controller.signal });
        if (!response.ok) throw new Error('Snapshot unavailable');
        var text = await response.text(); if (text.length > 200000) throw new Error('Oversized snapshot');
        var next = api.normalize(JSON.parse(text));
        if (next.checkedAt && (!snapshot.checkedAt || next.checkedAt >= snapshot.checkedAt)) snapshot = next;
        failed = false;
      } catch (e) { failed = true; }
      finally { root.clearTimeout(timeout); loading = false; button.disabled = false; render(); }
    }
    document.querySelectorAll('[data-feed-filter]').forEach(function (b) {
      b.addEventListener('click', function () { filter = b.dataset.feedFilter; render(); });
    });
    button.addEventListener('click', refresh);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
    root.setInterval(function () { if (!document.hidden) refresh(); }, 15 * 60000);
    ctx.onLang(render); render(); refresh();
  };
})(window);
