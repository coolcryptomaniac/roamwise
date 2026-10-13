(function (root) {
  'use strict';
  var api = root.RWBhakti, ctx = root.RWKainchiUI.createContext(), original = ctx.core.ritualScript;
  var selected = api.product(new URLSearchParams(root.location.search).get('product')) || api.products[1], preview = false, player = null, pausedMotion = false;
  function access() { return root.RWKainchiUI.isBhaktiPro() && selected.level <= 2; }
  ctx.core.ritualScript = function (lang, options) { return options && options.preview ? original(lang).slice(0, 1) : api.script(lang, options); };
  ctx.ritualSource = 'https://nkbashram.org/hanuman-chalisa';
  var ritual = root.RWKainchiUI.createRitual(ctx, function () { return preview || access(); });
  function extraVisuals() {
    var scene = ctx.$('studio-player').querySelector('.ritual-scene');
    [['studio-fire', 3], ['studio-lingam', 0], ['studio-water', 0], ['studio-bilva', 3]].forEach(function (pair) {
      var box = ctx.el('div', null, pair[0]); for (var i = 0; i < pair[1]; i += 1) box.appendChild(ctx.el('i')); scene.appendChild(box);
    });
  }
  function prepare(asPreview) {
    ritual.stop(); preview = asPreview === true; ctx.clear(ctx.$('studio-player'));
    ctx.ritualSource = selected.programme === 'parthiv' ? 'https://www.drikpanchang.com/lyrics/aarti/lord-shiva/shiva-aarti.html' :
      selected.programme === 'katha' ? 'https://shreekainchimandirtrust.org/about' : 'https://nkbashram.org/hanuman-chalisa';
    var options = preview ? { preview: true } : { productId: selected.id,
      name: ctx.core.clean(ctx.$('studio-name').value).slice(0, 60), wellwishers: ctx.core.clean(ctx.$('studio-people').value).slice(0, 180),
      intent: ctx.$('studio-intent').value, mantra: ctx.$('studio-mantra').value, count: Number(ctx.$('studio-count').value) };
    player = ritual.mount(ctx.$('studio-player'), 'studio', options); extraVisuals();
    var details = ctx.$('studio-player').querySelector('details'); details.open = !access() && !preview;
    ctx.$('studio-status').textContent = ctx.t(preview ? 'studio_preview_note' : access() ? 'studio_prepared' : 'studio_lock');
    if (preview) player.start();
  }
  function render() {
    ctx.clear(ctx.$('studio-products'));
    api.products.forEach(function (p) {
      var card = ctx.el('article', null, 'studio-product'); card.dataset.selected = String(p.id === selected.id);
      var symbol = ctx.el('span', p.symbol, 'studio-symbol'); symbol.setAttribute('aria-hidden', 'true'); card.appendChild(symbol);
      card.appendChild(ctx.el('span', '₹' + p.price, 'studio-price')); card.appendChild(ctx.el('h3', ctx.lang === 'hi' ? p.hi : p.en));
      card.appendChild(ctx.el('p', ctx.lang === 'hi' ? p.bodyHi : p.bodyEn));
      var button = ctx.el('button', ctx.t(p.id === selected.id ? 'studio_selected' : 'studio_choose'), p.id === selected.id ? '' : 'quiet'); button.type = 'button'; button.dataset.product = p.id; button.setAttribute('aria-pressed', String(p.id === selected.id));
      button.addEventListener('click', function () { selected = p; preview = false; render(); prepare(); root.location.hash = '#bhakti'; ctx.$('studio-selected').scrollIntoView && ctx.$('studio-selected').scrollIntoView({ block: 'nearest' }); });
      card.appendChild(button); ctx.$('studio-products').appendChild(card);
    });
    ctx.$('studio-selected').textContent = (ctx.lang === 'hi' ? selected.hi : selected.en) + ' · ₹' + selected.price + (access() ? ' · ' + ctx.t('studio_included') : '');
    ctx.$('studio-count').disabled = selected.programme !== 'mantra'; ctx.$('studio-mantra').disabled = selected.programme === 'parthiv' || selected.programme === 'yajna';
    ctx.$('studio-motion').textContent = ctx.t(pausedMotion ? 'studio_motion_on' : 'studio_motion');
  }
  ctx.$('studio-form').addEventListener('submit', function (e) { e.preventDefault(); prepare(); });
  ctx.$('studio-preview').addEventListener('click', function () { root.location.hash = '#bhakti'; prepare(true); });
  ctx.$('studio-motion').addEventListener('click', function () { pausedMotion = !pausedMotion; document.body.classList.toggle('motion-paused', pausedMotion); render(); });
  ctx.$('studio-print').addEventListener('click', function () { ctx.$('studio-player').querySelector('details').open = true; root.print(); });
  var audio = null;
  ctx.$('studio-bell').addEventListener('click', function () {
    var Audio = root.AudioContext || root.webkitAudioContext; if (!Audio) return;
    if (!audio) audio = new Audio(); audio.resume();
    [523.25, 1046.5, 1569.75].forEach(function (f, i) { var osc = audio.createOscillator(), gain = audio.createGain(), at = audio.currentTime;
      osc.frequency.value = f; gain.gain.setValueAtTime(.09 / (i + 1), at); gain.gain.exponentialRampToValueAtTime(.001, at + 2.5); osc.connect(gain); gain.connect(audio.destination); osc.start(at); osc.stop(at + 2.6);
    });
  });
  root.addEventListener('pagehide', function () { if (audio) audio.close(); audio = null; });
  document.querySelectorAll('[data-lang]').forEach(function (b) { b.addEventListener('click', function () { ctx.setLang(b.dataset.lang); }); });
  ctx.onLang(function () { preview = false; render(); prepare(); });
  root.addEventListener('storage', function () { ritual.stop(); preview = false; render(); prepare(); });
  ctx.setLang(ctx.get(ctx.cfg.langKey) || (root.navigator.language.indexOf('hi') === 0 ? 'hi' : 'en'));
})(window);
