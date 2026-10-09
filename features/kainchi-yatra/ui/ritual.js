/* One shared, visitor-initiated player. Local voice only; cancellation-safe and text-only fallback. */
(function (root) {
  'use strict';
  root.RWKainchiUI.createRitual = function (ctx, isPro) {
    var players = [], active = null, timer = null, utterance = null, token = 0;
    function localVoice(lang) {
      if (!root.speechSynthesis || !root.SpeechSynthesisUtterance) return null;
      try { return root.speechSynthesis.getVoices().filter(function (v) { return v.localService === true && v.lang.toLowerCase().split('-')[0] === lang.split('-')[0]; })[0] || null; }
      catch (e) { return null; }
    }
    function cancel() {
      token += 1; root.clearTimeout(timer); timer = null;
      if (utterance && root.speechSynthesis) { utterance.onend = null; utterance.onerror = null; root.speechSynthesis.cancel(); }
      utterance = null;
    }
    function render(p) {
      p.startButton.disabled = !isPro(); p.voice.disabled = !isPro();
      p.startButton.textContent = ctx.t('ritual_play'); p.pauseButton.textContent = ctx.t(p.paused ? 'ritual_resume' : 'ritual_pause');
      p.stopButton.textContent = ctx.t('ritual_stop'); p.nextButton.textContent = ctx.t('ritual_next'); p.voiceLabel.textContent = ctx.t('ritual_voice');
      p.pauseButton.disabled = !p.running || !isPro(); p.nextButton.disabled = !p.running || !isPro(); p.stopButton.disabled = !p.running;
      p.badge.textContent = ctx.t('ritual_badge'); p.heading.textContent = ctx.t('ritual_h');
      p.note.textContent = ctx.t('ritual_note'); p.voiceNote.textContent = ctx.t('ritual_voice_note'); p.summary.textContent = ctx.t('ritual_script');
      p.source.textContent = ctx.t('ritual_source'); p.plate.textContent = ctx.t('ritual_plate');
      var s = p.steps[p.index];
      p.progress.textContent = p.status ? ctx.t(p.status) : ctx.t('ritual_progress', { n: p.index + 1, total: p.steps.length, title: s.title });
      p.caption.textContent = s.text; p.caption.lang = s.lang;
      p.scene.setAttribute('data-phase', p.completed ? 'prasad' : s.id);
      p.plate.hidden = !p.completed && s.id !== 'prasad' && s.id !== 'blessing';
      p.scene.classList.toggle('ritual-running', p.running && !p.paused);
      p.scene.classList.toggle('ritual-speaking', !!utterance && active === p && !p.paused);
      Array.from(p.script.children).forEach(function (li, i) { li.classList.toggle('active', i === p.index); if (i === p.index) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    }
    function stop() {
      cancel();
      if (active) { active.running = false; active.paused = false; active.status = 'ritual_stopped'; render(active); }
      active = null;
    }
    function advance(p) {
      if (active !== p || !p.running || p.paused) return;
      if (!isPro()) { stop(); return; }
      cancel(); p.index += 1;
      if (p.index >= p.steps.length) {
        p.index = p.steps.length - 1; p.running = false; p.completed = true; p.status = 'ritual_complete'; render(p); active = null; return;
      }
      run(p);
    }
    function run(p) {
      if (!isPro()) { stop(); return; }
      var s = p.steps[p.index]; p.status = ''; render(p);
      var runToken = token;
      if (!p.voice.checked) {
        timer = root.setTimeout(function () { if (token === runToken) advance(p); }, Math.min(12000, Math.max(4500, s.text.length * 90)));
        return;
      }
      var voice = localVoice(s.lang);
      if (!voice) { p.paused = true; p.status = 'ritual_no_voice'; render(p); return; }
      try {
        utterance = new root.SpeechSynthesisUtterance(s.text); utterance.voice = voice; utterance.lang = s.lang; utterance.rate = .82;
        utterance.onend = function () { if (token === runToken) advance(p); };
        utterance.onerror = function () { if (token !== runToken) return; cancel(); p.paused = true; p.status = 'ritual_voice_failed'; render(p); };
        root.speechSynthesis.speak(utterance); render(p);
        timer = root.setTimeout(function () { if (token !== runToken) return; cancel(); p.paused = true; p.status = 'ritual_voice_failed'; render(p); }, 45000);
      } catch (e) { cancel(); p.paused = true; p.status = 'ritual_voice_failed'; render(p); }
    }
    function start(p) {
      if (!isPro()) { render(p); return; }
      stop(); active = p; p.index = 0; p.running = true; p.paused = false; p.completed = false; p.status = ''; run(p);
      p.heading.focus({ preventScroll: true });
      if (p.heading.scrollIntoView) p.heading.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }
    function scene() {
      var box = ctx.el('div', null, 'ritual-scene'), avatar = ctx.el('img', null, 'ritual-avatar');
      box.setAttribute('aria-hidden', 'true'); avatar.src = '../features/kainchi-yatra/ui/art/digital-panditji.webp'; avatar.alt = ''; avatar.width = 768; avatar.height = 802; avatar.loading = 'lazy'; box.appendChild(avatar);
      var petals = ctx.el('div', null, 'ritual-petals');
      for (var i = 0; i < 8; i += 1) petals.appendChild(ctx.el('i')); box.appendChild(petals);
      var smoke = ctx.el('div', null, 'ritual-smoke');
      for (var j = 0; j < 3; j += 1) smoke.appendChild(ctx.el('i')); box.appendChild(smoke);
      box.appendChild(ctx.el('div', null, 'ritual-incense')); box.appendChild(ctx.el('div', null, 'ritual-dhoop'));
      var tray = ctx.el('div', null, 'ritual-thali');
      for (var k = 0; k < 5; k += 1) tray.appendChild(ctx.el('i', null, 'ritual-wick')); box.appendChild(tray);
      var prasad = ctx.el('div', null, 'ritual-prasad');
      for (var l = 0; l < 3; l += 1) prasad.appendChild(ctx.el('i')); box.appendChild(prasad); return box;
    }
    function mount(host, kind, options) {
      players = players.filter(function (p) { return p.kind !== kind; });
      var p = { kind: kind, options: options, steps: ctx.core.ritualScript(ctx.lang, options), index: 0, running: false, paused: false, completed: false, status: '' };
      var box = ctx.el('div', null, 'ritual-player'); box.id = kind + '-ritual';
      p.badge = ctx.el('p', null, 'eyebrow'); p.heading = ctx.el('h3'); p.note = ctx.el('p', null, 'muted small');
      p.heading.id = kind + '-ritual-heading'; p.heading.tabIndex = -1; box.setAttribute('aria-labelledby', p.heading.id);
      box.appendChild(p.badge); box.appendChild(p.heading); box.appendChild(p.note);
      var layout = ctx.el('div', null, 'ritual-layout'); p.scene = scene(); layout.appendChild(p.scene);
      var reading = ctx.el('div', null, 'ritual-reading'); p.progress = ctx.el('p', null, 'ritual-progress'); p.progress.setAttribute('role', 'status'); p.progress.setAttribute('aria-live', 'polite');
      p.caption = ctx.el('p', null, 'ritual-caption'); reading.appendChild(p.progress); reading.appendChild(p.caption);
      p.plate = ctx.el('p', null, 'muted small'); reading.appendChild(p.plate);
      var actions = ctx.el('div', null, 'ritual-actions');
      ['start', 'pause', 'next', 'stop'].forEach(function (id) { var b = ctx.el('button', null, id === 'start' ? '' : 'quiet'); b.type = 'button'; b.setAttribute('data-ritual-action', id); p[id + 'Button'] = b; actions.appendChild(b); });
      reading.appendChild(actions); var label = ctx.el('label', null, 'check ritual-voice'); p.voice = ctx.el('input'); p.voice.type = 'checkbox'; p.voice.setAttribute('data-ritual-action', 'voice'); p.voiceLabel = ctx.el('span'); label.appendChild(p.voice); label.appendChild(p.voiceLabel); reading.appendChild(label);
      p.voiceNote = ctx.el('p', null, 'muted small'); reading.appendChild(p.voiceNote); layout.appendChild(reading); box.appendChild(layout);
      var details = ctx.el('details'); p.summary = ctx.el('summary'); details.appendChild(p.summary); p.script = ctx.el('ol', null, 'ritual-script'); details.appendChild(p.script); box.appendChild(details);
      p.source = ctx.el('a', null, 'text-link small'); p.source.href = 'https://www.drikpanchang.com/lyrics/aarti/lord-hanuman/shree-hanuman-aarti.html'; p.source.target = '_blank'; p.source.rel = 'noopener noreferrer'; box.appendChild(p.source);
      function rebuild() { p.steps = ctx.core.ritualScript(ctx.lang, options); ctx.clear(p.script); p.steps.forEach(function (s) { var li = ctx.el('li'); li.appendChild(ctx.el('strong', s.title)); li.appendChild(ctx.el('p', s.text)); p.script.appendChild(li); }); }
      rebuild(); players.push(p); host.appendChild(box);
      p.startButton.addEventListener('click', function () { start(p); });
      p.stopButton.addEventListener('click', stop);
      p.pauseButton.addEventListener('click', function () { if (active !== p) return; cancel(); p.paused = !p.paused; if (p.paused) render(p); else run(p); });
      p.nextButton.addEventListener('click', function () { if (active !== p || !isPro()) return; p.paused = false; advance(p); });
      p.voice.addEventListener('change', function () { if (active !== p || !p.running) return; cancel(); p.paused = false; run(p); });
      p.start = function () { start(p); }; p.rebuild = rebuild; render(p); return p;
    }
    ctx.onLang(function () { stop(); players.forEach(function (p) { p.rebuild(); render(p); }); });
    root.addEventListener('hashchange', function () { if (root.location.hash !== '#bhakti') stop(); });
    root.addEventListener('pagehide', stop);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
    root.addEventListener('storage', function () { if (!isPro()) stop(); players.forEach(render); });
    return { mount: mount, stop: stop };
  };
})(window);
