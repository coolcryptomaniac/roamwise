/* Shared destination planner. No booking, personal-data upload or inferred live conditions. */
(function (root) {
  'use strict';
  var data = root.RWPilgrimage, ctx = root.RWKainchiUI.createContext(), core = ctx.core;
  var site = data.sites.find(function (s) { return s.id === document.body.dataset.site; });
  function t(key) { return data.strings[ctx.lang][key]; }
  function pick(value) { return value[ctx.lang]; }
  function el(tag, text, cls) { return ctx.el(tag, text, cls); }
  function link(text, href, cls) { var a = el('a', text, cls || 'text-link'); a.href = href; if (href.startsWith('https:')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } return a; }
  function translate() {
    document.querySelectorAll('[data-p]').forEach(function (n) { n.textContent = t(n.dataset.p); });
    document.querySelectorAll('[data-site-copy]').forEach(function (n) { if (site) n.textContent = pick(site[n.dataset.siteCopy]); });
  }
  function directory() {
    var box = ctx.$('journey-list'); ctx.clear(box);
    data.sites.forEach(function (s) {
      var a = link('', '../' + s.id + '/', 'journey-card'); a.appendChild(el('span', s.symbol, 'journey-symbol')); a.appendChild(el('h3', pick(s.name))); a.appendChild(el('p', pick(s.intro), 'muted')); a.appendChild(el('strong', t('go'))); box.appendChild(a);
    });
    var kainchi = link('', '../kainchi/', 'journey-card'); kainchi.appendChild(el('span', 'ॐ', 'journey-symbol')); kainchi.appendChild(el('h3', ctx.lang === 'hi' ? 'कैंची धाम' : 'Kainchi Dham')); kainchi.appendChild(el('p', ctx.lang === 'hi' ? 'महाराज जी का परिचय, दैनिक स्रोत और हनुमान आरती।' : 'Maharaj Ji’s story, dated source updates and Hanuman aarti.', 'muted')); kainchi.appendChild(el('strong', t('go'))); box.appendChild(kainchi);
  }
  ctx.onLang(function () { translate(); directory(); });
  document.querySelectorAll('[data-lang]').forEach(function (b) { b.addEventListener('click', function () { ctx.setLang(b.dataset.lang); }); });
  ctx.setLang(ctx.get(ctx.cfg.langKey) || (/^hi/.test(root.navigator.language) ? 'hi' : 'en'));
  if (!site) return;
  var placeSelect = ctx.$('visit-shrine'), date = ctx.$('visit-date'), group = ctx.$('visit-group'), origin = ctx.$('visit-origin');
  date.value = ctx.today; date.min = ctx.today;
  var ritualOptions = { mantra: site.places[0].mantra }, currentCustom = null;
  function renderPlaces() {
    var selected = placeSelect.value; ctx.clear(placeSelect);
    site.places.forEach(function (p, i) { var o = el('option', pick(p)); o.value = String(i); placeSelect.appendChild(o); });
    placeSelect.value = selected || '0'; origin.placeholder = t('origin_hint');
  }
  function selectedPlace() { return site.places[Number(placeSelect.value)] || site.places[0]; }
  function plan() {
    var value = date.value, count = Number(group.value), parsed = core.parseDate(value), valid = parsed && value >= ctx.today && Number.isInteger(count) && count >= 1 && count <= 60;
    var map = new URL('https://www.google.com/maps/dir/'); map.searchParams.set('api', '1'); map.searchParams.set('destination', selectedPlace().en);
    if (origin.value.trim()) map.searchParams.set('origin', origin.value.trim().slice(0, 120)); ctx.$('visit-map').href = map.href;
    var status = ctx.$('calendar-note'); status.textContent = valid ? t(parsed.dow === 0 || parsed.dow === 6 ? 'weekend' : 'weekday') : t('invalid'); status.classList.toggle('bad', !valid);
    var message = pick(site.name) + ' · ' + selectedPlace().en + '\n' + value + ' · ' + count + ' ' + t('group') + '\n' + t('share_note') + '\nhttps://roamwise.co.in/' + site.id + '/';
    var share = ctx.$('visit-share'); share.hidden = !valid; share.href = 'https://wa.me/?text=' + encodeURIComponent(message);
    ritualOptions.mantra = selectedPlace().mantra; standard.rebuild();
    var checked = Date.parse(data.checked + 'T00:00:00+05:30'); ctx.$('source-age').textContent = t(Date.now() - checked > 30 * 86400000 ? 'source_old' : 'source_note');
  }
  function checklist() {
    var box = ctx.$('visit-checks'), previous = Array.from(box.querySelectorAll('input')).map(function (n) { return n.checked; }); ctx.clear(box);
    t('checks').forEach(function (text, i) { var label = el('label', null, 'check'); var input = el('input'); input.type = 'checkbox'; input.checked = !!previous[i]; label.appendChild(input); label.appendChild(el('span', text)); box.appendChild(label); });
  }
  function sources() {
    var box = ctx.$('source-links'); ctx.clear(box); site.sources.forEach(function (s) { box.appendChild(link(s[0] + ' ↗', s[1], 'source-card')); });
  }
  core.ritualScript = function (lang, options) {
    var o = options || {}, say = function (key, vars) { return core.t(lang, key, vars); };
    var mantra = data.mantras[o.mantra] || data.mantras.shanti, steps = [];
    function step(id, text, hindi) { steps.push({ id: id, title: say('ritual_' + id), text: text || say('ritual_' + id + '_text'), lang: hindi || lang === 'hi' ? 'hi-IN' : 'en-IN' }); }
    step('welcome'); step('sankalp', o.name ? say('ritual_custom_text', { name: o.name, people: o.wellwishers || say('ritual_everyone'), intention: say('pooja_intention_' + o.intent) }) : null);
    step('invocation', mantra, true); step('flowers'); step('dhoop'); step('diya');
    step('mantra', mantra, true); step('aarti', mantra + ' ' + mantra + ' ' + mantra, true);
    step('prasad'); step('shanti', say('mantra_sarve') + ' ॐ शान्तिः शान्तिः शान्तिः।', true); step('blessing'); return steps;
  };
  core.strings.en.ritual_source = data.strings.en.complete_source; core.strings.hi.ritual_source = data.strings.hi.complete_source;
  ctx.ritualSource = site.sources[0][1];
  var ritual = root.RWKainchiUI.createRitual(ctx, root.RWKainchiUI.isBhaktiPro), standard = ritual.mount(ctx.$('standard-session'), 'standard', ritualOptions);
  function access() {
    var pro = root.RWKainchiUI.isBhaktiPro(); ctx.$('devotion-lock').textContent = pro ? '' : t('lock');
    ctx.$('standard-begin').disabled = !pro; ctx.$('custom-begin').disabled = !pro;
  }
  ctx.$('standard-begin').addEventListener('click', function () { if (!root.RWKainchiUI.isBhaktiPro()) return; root.location.hash = '#bhakti'; standard.start(); });
  ctx.$('custom-form').addEventListener('submit', function (event) {
    event.preventDefault(); if (!root.RWKainchiUI.isBhaktiPro()) return;
    var name = ctx.$('custom-name').value.trim().slice(0, 60); if (!name) { ctx.$('custom-name').reportValidity(); return; }
    ritual.stop(); ctx.clear(ctx.$('custom-session'));
    currentCustom = ritual.mount(ctx.$('custom-session'), 'custom', { name: name, wellwishers: ctx.$('custom-people').value.trim().slice(0, 180), intent: ctx.$('custom-intention').value, mantra: selectedPlace().mantra });
    root.location.hash = '#bhakti'; currentCustom.start();
  });
  [date, group, origin, placeSelect].forEach(function (n) { n.addEventListener('input', function () { ritual.stop(); plan(); }); });
  ctx.$('visit-print').addEventListener('click', function () { root.print(); });
  ctx.onLang(function () { renderPlaces(); checklist(); sources(); access(); plan(); core.strings[ctx.lang].ritual_source = t('complete_source'); });
  root.addEventListener('storage', access); root.addEventListener('focus', access);
  var motion = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function renderMotion() { document.body.classList.toggle('motion-paused', !!motion && motion.matches); }
  if (motion && motion.addEventListener) motion.addEventListener('change', renderMotion); renderMotion();
  renderPlaces(); checklist(); sources(); access(); plan();
})(window);
