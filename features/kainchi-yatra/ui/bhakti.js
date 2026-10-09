(function (root) {
  'use strict';
  root.RWKainchiUI.bhakti = function (ctx) {
    var lit = false, incense = false, aarti = false, motion = ctx.get('rw_kainchi_motion') !== 'off';
    var media = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    var toggle = ctx.$('motion-toggle');
    function external(id, url) {
      var a = ctx.$(id); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    }
    external('chalisa-link', 'https://nkbashram.org/hanuman-chalisa');
    external('trust-info', 'https://shreekainchimandirtrust.org/contact');
    external('trust-updates', 'https://shreekainchimandirtrust.org/events');
    external('trust-video', 'https://www.youtube.com/@SHREEKAINCHIMANDIRTRUST');
    external('media-trust', 'https://www.youtube.com/@SHREEKAINCHIMANDIRTRUST');
    external('media-story', 'https://www.youtube.com/watch?v=FgA0SjKnM0g');
    external('media-darshan', 'https://www.youtube.com/watch?v=5WJAxUc4qnU');
    function renderMotion() {
      var running = motion && !media.matches;
      document.body.classList.toggle('motion-paused', !running);
      toggle.textContent = ctx.t(media.matches ? 'motion_reduced' : running ? 'motion_on' : 'motion_off');
      toggle.setAttribute('aria-pressed', String(running)); toggle.disabled = media.matches;
      ctx.$('diya-toggle').textContent = ctx.t(lit ? 'diya_off' : 'diya_on');
      ctx.$('diya-toggle').setAttribute('aria-pressed', String(lit));
      ctx.$('digital-diya').classList.toggle('lit', lit);
      ctx.$('incense-toggle').textContent = ctx.t(incense ? 'incense_off' : 'incense_on');
      ctx.$('incense-toggle').setAttribute('aria-pressed', String(incense));
      ctx.$('agarbatti').classList.toggle('lit', incense);
      var pro = isPro();
      var aartiButton = ctx.$('aarti-toggle');
      aartiButton.disabled = !pro;
      aartiButton.textContent = ctx.t(aarti ? 'aarti_off' : 'aarti_on');
      aartiButton.setAttribute('aria-pressed', String(aarti));
      aartiButton.setAttribute('aria-label', ctx.t('aarti_on'));
      aartiButton.classList.toggle('locked', !pro);
      ctx.$('ritual-stage').classList.toggle('aarti-active', aarti && pro);
      ctx.$('pro-status').textContent = !pro ? ctx.t('pro_locked') : aarti ? ctx.t('pro_unlocked') : '';
    }
    function isPro() {
      var m = root.RoamWiseMembership || root.RWMembership || root.membership || {};
      var user = m.user || root.RoamWiseUser || root.currentUser || {};
      return m.isPro === true || m.plan === 'pro' || m.plan === 'founder' || user.isPro === true || user.plan === 'pro' || user.plan === 'founder' || document.body.getAttribute('data-membership') === 'pro';
    }
    function renderDates() {
      var box = ctx.$('important-dates'); ctx.clear(box);
      ctx.core.importantDates(ctx.today).forEach(function (event) {
        var item = ctx.el('li', null, 'date-event');
        var stamp = ctx.el('time', new Intl.DateTimeFormat(ctx.lang === 'hi' ? 'hi-IN' : 'en-IN', {
          timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: 'numeric'
        }).format(new Date(event.date + 'T12:00:00+05:30'))); stamp.dateTime = event.date;
        item.appendChild(stamp); item.appendChild(ctx.el('span', ctx.t('date_' + event.id), 'event-name'));
        item.appendChild(ctx.el('small', ctx.t('dates_' + event.kind) + ' · ' + ctx.t(event.days ? 'date_days' : 'date_today', { n: event.days }), 'muted'));
        var row = ctx.el('div', null, 'row-actions'), source = ctx.el('a', ctx.t('date_source'), 'text-link');
        source.href = event.source; source.target = '_blank'; source.rel = 'noopener noreferrer'; row.appendChild(source);
        if (event.days <= ctx.cfg.maxAdvanceDays) {
          var choose = ctx.el('button', ctx.t('date_plan'), 'quiet'); choose.type = 'button';
          choose.addEventListener('click', function () {
            ctx.$('plan-date').value = event.date; ctx.$('plan-date').dispatchEvent(new Event('input'));
            root.location.hash = '#plan';
          }); row.appendChild(choose);
        }
        item.appendChild(row); box.appendChild(item);
      });
      ctx.$('timings-freshness').textContent = ctx.t(ctx.today > '2026-11-08' ? 'timings_old' : 'timings_checked');
    }
    toggle.addEventListener('click', function () { motion = !motion; ctx.set('rw_kainchi_motion', motion ? 'on' : 'off'); renderMotion(); });
    if (media.addEventListener) media.addEventListener('change', renderMotion);
    ctx.$('diya-toggle').addEventListener('click', function () { lit = !lit; renderMotion(); });
    ctx.$('incense-toggle').addEventListener('click', function () { incense = !incense; renderMotion(); });
    ctx.$('aarti-toggle').addEventListener('click', function () { if (!isPro()) { renderMotion(); return; } aarti = !aarti; renderMotion(); });
    ctx.onLang(function () { renderMotion(); renderDates(); });
  };
})(window);
