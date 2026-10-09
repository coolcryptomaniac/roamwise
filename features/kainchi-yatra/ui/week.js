(function (root) {
  'use strict';
  root.RWKainchiUI.week = function (ctx) {
    var box = ctx.$('week-strip'), input = ctx.$('plan-date');
    function render() {
      ctx.clear(box);
      for (var i = 0; i < 7; i++) {
        var day = ctx.core.addDays(ctx.today, i), result = ctx.core.classify(day);
        var b = ctx.el('button', null, 'day-card'); b.type = 'button'; b.dataset.date = day;
        b.setAttribute('aria-pressed', String(input.value === day));
        b.appendChild(ctx.el('span', new Intl.DateTimeFormat(ctx.lang === 'hi' ? 'hi-IN' : 'en-IN', {
          timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short'
        }).format(new Date(day + 'T12:00:00+05:30'))));
        b.appendChild(ctx.el('b', ctx.t('level_' + result.level), 'level level-' + result.level));
        b.addEventListener('click', function (e) { input.value = e.currentTarget.dataset.date; input.dispatchEvent(new Event('input')); });
        box.appendChild(b);
      }
      var level;
      try { level = ctx.core.classify(input.value).level; } catch (e) { return; }
      ctx.$('share-trip').href = 'https://wa.me/?text=' + encodeURIComponent(ctx.t('share_message', {
        date: input.value, level: ctx.t('level_' + level)
      }) + '\nhttps://roamwise.co.in/kainchi/#today');
    }
    input.addEventListener('input', function () { ctx.$('pass-date').value = input.value; render(); });
    ctx.onLang(render);
  };
})(window);
