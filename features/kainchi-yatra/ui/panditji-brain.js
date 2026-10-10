/* Panditji's on-device brain: mood from the clock, reactions to pokes and ritual phases, and a small keyword Q&A.
   Rule-based and offline by design (strict page CSP). Practical questions are pointed at official notices, never answered with invented facts. */
(function (root) {
  'use strict';
  var DEFER = { plan: '#plan', call112: 'tel:112', call108: 'tel:108' };
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[^a-z0-9ऀ-ॿ ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function find(text, intents) {
    var q = norm(text), best = null, top = 0;
    function score(it) { var n = 0; it.words.forEach(function (w) { var k = norm(w), hit = /^[a-z0-9 ]+$/.test(k) ? new RegExp('(^| )' + k).test(q) : q.indexOf(k) >= 0; if (hit) n += k.length; }); return n; }
    if (score(intents[0])) return intents[0];
    intents.forEach(function (it) { var n = score(it); if (n > top) { top = n; best = it; } });
    return best;
  }
  function moodNow() {
    var h = new Date().getHours();
    if (h >= 22 || h < 4) return { kind: 'night', sway: 0.6, breath: 0.8, blink: 0.7, sleepy: 1 };
    if (h < 9) return { kind: 'morning', sway: 1.1, breath: 1, blink: 1.1, sleepy: 0 };
    return { kind: h < 17 ? 'day' : 'eve', sway: 1, breath: 1, blink: 1, sleepy: 0 };
  }
  root.RWKainchiUI.panditjiBrain = function (ctx, scene) {
    var data = root.RWKainchiPandit, fig = scene.querySelector('.pandit-figure'), api = fig && fig.panditji, mood = moodNow(), memory = {}, phaseSeen = '', idleTimer = 0, idles = 0, spoken = false, ui = {};
    function S() { return data[ctx.lang] || data.en; }
    function pick(list, key) {
      var i = Math.floor(Math.random() * list.length);
      if (list.length > 1 && memory[key] === i) i = (i + 1) % list.length;
      memory[key] = i; return list[i];
    }
    function target(name) {
      if (name === 'notices') return root.document.getElementById('today') ? '#today' : '#sources';
      if (name === 'rates') return root.document.getElementById('help') ? '#help' : '#sources';
      return DEFER[name];
    }
    function show(text, acts) {
      ctx.clear(ui.bubble); ui.bubble.appendChild(document.createTextNode(text));
      if (acts && acts.length) {
        var row = ctx.el('span', null, 'pandit-acts');
        acts.forEach(function (name) { var a = ctx.el('a', S()['act_' + name], 'text-link'); a.href = target(name); row.appendChild(a); });
        ui.bubble.appendChild(row);
      }
      if (api) api.talkUntil = root.performance.now() + Math.min(3600, 500 + text.length * 40);
    }
    function emote(kind) {
      if (!api) return;
      var st = api.rig.state;
      if (kind === 'laugh') { st.jaw.v += 7; api.rig.impulse('face'); }
      else if (kind === 'pranam') { api.bow = 0.5; root.setTimeout(function () { api.bow = 0; }, 1400); }
      else if (kind === 'bless') { api.bow = 0.5; api.rig.spawn(12, 390, 330, 120, 160); root.setTimeout(function () { api.bow = 0; }, 1600); }
      else if (kind === 'yawn') { st.jaw.v += 9; st.pitch.v += 1.2; }
    }
    function arm() {
      root.clearTimeout(idleTimer);
      if (!fig || fig.getAttribute('data-mode') !== 'live' || idles >= 3) return;
      idleTimer = root.setTimeout(function () {
        if (document.hidden) { arm(); return; }
        idles += 1;
        if (mood.sleepy && idles === 1) { show(S().yawn); emote('yawn'); } else show(pick(S().idle, 'idle'));
        arm();
      }, idles ? 90000 : 45000);
    }
    function reply(text) {
      var s = S(), it = text.trim() ? find(text, data.intents) : null, id = it ? it.id : 'fallback';
      if (!text.trim()) id = 'empty';
      show(id === 'joke' ? pick(s.jokes, 'jokes') : pick(s['r_' + id], id), it && it.acts);
      if (id === 'joke') emote('laugh'); else if (id === 'blessing') emote('bless'); else if (id === 'hello' || id === 'thanks' || id === 'bye') emote('pranam');
      spoken = true; arm();
    }
    function build() {
      var panel = ctx.el('div', null, 'pandit-ask'), form = ctx.el('form', null, 'pandit-ask-form'), label = ctx.el('label'), chips = ctx.el('div', null, 'pandit-chips');
      ui.panel = panel; ui.bubble = ctx.el('p', null, 'pandit-bubble'); ui.bubble.setAttribute('role', 'status'); ui.bubble.setAttribute('aria-live', 'polite');
      ui.title = ctx.el('h4', null, 'pandit-ask-title'); ui.label = ctx.el('span'); ui.input = ctx.el('input'); ui.input.type = 'text'; ui.input.maxLength = 80; ui.input.autocomplete = 'off';
      ui.send = ctx.el('button'); ui.send.type = 'submit'; ui.note = ctx.el('p', null, 'muted small'); ui.chips = [];
      label.appendChild(ui.label); label.appendChild(ui.input); form.appendChild(label); form.appendChild(ui.send);
      data.chips.forEach(function (id) { var b = ctx.el('button', null, 'quiet'); b.type = 'button'; b.addEventListener('click', function () { reply(id); }); ui.chips.push(b); chips.appendChild(b); });
      form.addEventListener('submit', function (e) { e.preventDefault(); reply(ui.input.value.slice(0, 80)); ui.input.value = ''; });
      [ui.title, ui.bubble, form, chips, ui.note].forEach(function (n) { panel.appendChild(n); });
    }
    function labels() {
      var s = S(); ui.title.textContent = s.ui_title; ui.label.textContent = s.ui_label; ui.input.placeholder = s.ui_placeholder; ui.send.textContent = s.ui_send; ui.note.textContent = s.ui_note;
      ui.chips.forEach(function (b, i) { b.textContent = s['chip_' + data.chips[i]]; });
      if (!spoken) show(s['greet_' + mood.kind]);
    }
    function sync(phase, active, done) {
      var key = active ? phase : '';
      if (key && key !== phaseSeen && S()['phase_' + key]) { show(S()['phase_' + key]); spoken = true; arm(); }
      if (done && phaseSeen !== 'done') { show(pick(S().r_blessing, 'blessing')); emote('bless'); phaseSeen = 'done'; return; }
      if (!done) phaseSeen = key;
    }
    build(); labels(); ctx.onLang(labels);
    if (api) { api.style = { sway: mood.sway, breath: mood.breath, blink: mood.blink, sleepy: mood.sleepy }; api.talkUntil = 0; }
    if (fig) fig.addEventListener('panditpoke', function (e) { var r = e.detail.region; show(pick(S()['poke_' + r], 'poke_' + r)); spoken = true; if (r === 'face') emote('laugh'); arm(); });
    return { panel: ui.panel, sync: sync, reply: reply };
  };
})(window);
