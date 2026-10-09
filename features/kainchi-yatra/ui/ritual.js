/* Shared visitor-initiated player; explicit voice consent and cancellation-safe speech events. */
(function (root) {
  'use strict';
  root.RWKainchiUI.createRitual = function (ctx, isPro) {
    var players = [], active = null, timer = null, utterance = null, token = 0, speaking = false;
    function refreshVoices(p) {
      ['hi', 'en'].forEach(function (lang) {
        var select = p[lang + 'Voice'], previous = select.value; ctx.clear(select);
        var auto = ctx.el('option', ctx.t('ritual_voice_auto')); auto.value = ''; select.appendChild(auto);
        root.RWKainchiUI.ritualVoices(lang + '-IN', p.provider.checked).forEach(function (v) {
          var o = ctx.el('option', (v.name || v.lang) + ' · ' + ctx.t(v.localService === true ? 'ritual_voice_local' : 'ritual_voice_provider'));
          o.value = root.RWKainchiUI.voiceId(v); select.appendChild(o);
        }); select.value = previous; if (select.selectedIndex < 0) select.value = '';
      });
    }
    function pickVoice(p, lang) {
      var voices = root.RWKainchiUI.ritualVoices(lang, p.provider.checked), selected = p[lang.split('-')[0] + 'Voice'].value;
      return voices.find(function (v) { return root.RWKainchiUI.voiceId(v) === selected; }) || voices[0] || null;
    }
    function cancel() {
      token += 1; root.clearTimeout(timer); timer = null;
      if (utterance && root.speechSynthesis) { utterance.onstart = null; utterance.onboundary = null; utterance.onend = null; utterance.onerror = null; try { root.speechSynthesis.cancel(); } catch (e) { /* stopped locally */ } }
      utterance = null; speaking = false;
    }
    function render(p) {
      p.startButton.disabled = !isPro(); p.voice.disabled = !isPro();
      p.startButton.textContent = ctx.t('ritual_play'); p.pauseButton.textContent = ctx.t(p.paused ? 'ritual_resume' : 'ritual_pause');
      p.stopButton.textContent = ctx.t('ritual_stop'); p.nextButton.textContent = ctx.t('ritual_next'); p.voiceLabel.textContent = ctx.t('ritual_voice');
      p.pauseButton.disabled = !p.running || !isPro(); p.nextButton.disabled = !p.running || !isPro(); p.stopButton.disabled = !p.running;
      p.badge.textContent = ctx.t('ritual_badge'); p.heading.textContent = ctx.t('ritual_h');
      p.note.textContent = ctx.t('ritual_note'); p.voiceNote.textContent = ctx.t('ritual_voice_note'); p.summary.textContent = ctx.t('ritual_script');
      p.source.textContent = ctx.t('ritual_source'); p.plate.textContent = ctx.t('ritual_plate');
      p.providerLabel.textContent = ctx.t('ritual_provider'); p.hiLabel.textContent = ctx.t('ritual_hi_voice'); p.enLabel.textContent = ctx.t('ritual_en_voice');
      p.speedLabel.textContent = ctx.t('ritual_speed'); p.testButton.textContent = ctx.t('ritual_test'); p.retryButton.textContent = ctx.t('ritual_retry'); p.browser.textContent = ctx.t('ritual_browser');
      [p.provider, p.hiVoice, p.enVoice, p.speed, p.testButton, p.retryButton].forEach(function (n) { n.disabled = !isPro(); });
      var s = p.steps[p.index];
      p.progress.textContent = p.status ? ctx.t(p.status) : ctx.t('ritual_progress', { n: p.index + 1, total: p.steps.length, title: s.title });
      p.caption.textContent = s.text; p.caption.lang = s.lang;
      if (p.testing) { p.caption.textContent = 'ॐ शान्तिः शान्तिः शान्तिः। आपका स्वागत है।'; p.caption.lang = 'hi-IN'; }
      p.scene.setAttribute('data-phase', p.completed ? 'prasad' : s.id);
      p.plate.hidden = !p.completed && s.id !== 'prasad' && s.id !== 'blessing';
      p.scene.classList.toggle('ritual-running', p.running && !p.paused);
      p.scene.classList.toggle('ritual-speaking', speaking && active === p && !p.paused);
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
      cancel(); p.testing = false; p.index += 1;
      if (p.index >= p.steps.length) {
        p.index = p.steps.length - 1; p.running = false; p.completed = true; p.status = 'ritual_complete'; render(p); active = null; return;
      }
      run(p);
    }
    function run(p) {
      if (!isPro()) { stop(); return; }
      var s = p.testing ? { text: 'ॐ शान्तिः शान्तिः शान्तिः। आपका स्वागत है।', lang: 'hi-IN' } : p.steps[p.index]; p.status = ''; render(p);
      var runToken = token;
      if (!p.voice.checked && !p.testing) {
        timer = root.setTimeout(function () { if (token === runToken) advance(p); }, Math.min(12000, Math.max(4500, s.text.length * 90)));
        return;
      }
      var voice = pickVoice(p, s.lang);
      if (!voice) { p.paused = true; p.status = p.provider.checked ? 'ritual_no_provider_voice' : 'ritual_no_voice'; render(p); return; }
      try {
        utterance = new root.SpeechSynthesisUtterance(s.text); utterance.voice = voice; utterance.lang = s.lang; utterance.rate = Number(p.speed.value); utterance.pitch = 1; utterance.volume = 1;
        function watchdog(ms) { root.clearTimeout(timer); timer = root.setTimeout(function () { if (token !== runToken) return; cancel(); p.paused = true; p.status = 'ritual_voice_failed'; render(p); }, ms); }
        utterance.onstart = function () { if (token !== runToken || active !== p) return; speaking = true; p.status = ''; render(p); watchdog(90000); };
        utterance.onboundary = function (event) {
          if (token !== runToken || !speaking || p.testing || event.name !== 'word') return;
          var startIndex = Math.max(0, Math.min(s.text.length, event.charIndex || 0)), end = s.text.indexOf(' ', startIndex); if (end < 0) end = s.text.length;
          ctx.clear(p.caption); p.caption.appendChild(document.createTextNode(s.text.slice(0, startIndex))); p.caption.appendChild(ctx.el('mark', s.text.slice(startIndex, end))); p.caption.appendChild(document.createTextNode(s.text.slice(end)));
        };
        utterance.onend = function () {
          if (token !== runToken) return;
          if (p.testing) { cancel(); p.testing = false; p.running = false; p.status = 'ritual_test_done'; render(p); active = null; }
          else advance(p);
        };
        utterance.onerror = function () { if (token !== runToken) return; cancel(); p.paused = true; p.status = 'ritual_voice_failed'; render(p); };
        p.status = 'ritual_voice_wait'; render(p); watchdog(10000); if (root.speechSynthesis.resume) root.speechSynthesis.resume(); root.speechSynthesis.speak(utterance);
      } catch (e) { cancel(); p.paused = true; p.status = 'ritual_voice_failed'; render(p); }
    }
    function start(p, testing) {
      if (!isPro()) { render(p); return; }
      stop(); active = p; p.index = 0; p.testing = !!testing; p.running = true; p.paused = false; p.completed = false; p.status = ''; refreshVoices(p); run(p);
      p.heading.focus({ preventScroll: true });
      if (p.heading.scrollIntoView) p.heading.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }
    function scene() {
      var box = ctx.el('div', null, 'ritual-scene');
      box.setAttribute('aria-hidden', 'true'); box.appendChild(root.RWKainchiUI.panditji());
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
      var voices = ctx.el('fieldset', null, 'ritual-voice-settings');
      var consent = ctx.el('label', null, 'check'); p.provider = ctx.el('input'); p.provider.type = 'checkbox'; p.provider.setAttribute('data-ritual-action', 'provider'); p.providerLabel = ctx.el('span'); consent.appendChild(p.provider); consent.appendChild(p.providerLabel); voices.appendChild(consent);
      ['hi', 'en'].forEach(function (lang) { var label = ctx.el('label'); p[lang + 'Label'] = ctx.el('span'); p[lang + 'Voice'] = ctx.el('select'); p[lang + 'Voice'].setAttribute('data-ritual-action', lang + '-voice'); label.appendChild(p[lang + 'Label']); label.appendChild(p[lang + 'Voice']); voices.appendChild(label); });
      var speed = ctx.el('label'); p.speedLabel = ctx.el('span'); p.speed = ctx.el('select'); speed.appendChild(p.speedLabel); speed.appendChild(p.speed);
      [.85, 1, 1.1].forEach(function (v) { var o = ctx.el('option', String(v) + '×'); o.value = String(v); p.speed.appendChild(o); }); voices.appendChild(speed);
      var voiceActions = ctx.el('div', null, 'ritual-actions'); ['test', 'retry'].forEach(function (id) { var b = ctx.el('button', null, 'quiet'); b.type = 'button'; b.setAttribute('data-ritual-action', id); p[id + 'Button'] = b; voiceActions.appendChild(b); }); voices.appendChild(voiceActions);
      p.browser = ctx.el('a', null, 'text-link small'); p.browser.href = root.location.href.split('#')[0] + '#bhakti'; p.browser.target = '_blank'; p.browser.rel = 'noopener noreferrer'; voices.appendChild(p.browser); reading.appendChild(voices);
      var details = ctx.el('details'); p.summary = ctx.el('summary'); details.appendChild(p.summary); p.script = ctx.el('ol', null, 'ritual-script'); details.appendChild(p.script); box.appendChild(details);
      p.source = ctx.el('a', null, 'text-link small'); p.source.href = ctx.ritualSource || 'https://www.drikpanchang.com/lyrics/aarti/lord-hanuman/shree-hanuman-aarti.html'; p.source.target = '_blank'; p.source.rel = 'noopener noreferrer'; box.appendChild(p.source);
      function rebuild() { p.steps = ctx.core.ritualScript(ctx.lang, options); ctx.clear(p.script); p.steps.forEach(function (s) { var li = ctx.el('li'); li.appendChild(ctx.el('strong', s.title)); li.appendChild(ctx.el('p', s.text)); p.script.appendChild(li); }); }
      rebuild(); refreshVoices(p); players.push(p); host.appendChild(box);
      p.startButton.addEventListener('click', function () { start(p); });
      p.stopButton.addEventListener('click', stop);
      p.pauseButton.addEventListener('click', function () { if (active !== p) return; cancel(); p.paused = !p.paused; if (p.paused) render(p); else run(p); });
      p.nextButton.addEventListener('click', function () { if (active !== p || !isPro()) return; p.paused = false; advance(p); });
      p.voice.addEventListener('change', function () { if (active !== p || !p.running) return; cancel(); p.paused = false; run(p); });
      p.provider.addEventListener('change', function () { if (active === p) { cancel(); p.paused = true; p.status = 'ritual_voice_ready'; } refreshVoices(p); render(p); });
      [p.hiVoice, p.enVoice, p.speed].forEach(function (n) { n.addEventListener('change', function () { if (active !== p) return; cancel(); p.paused = true; render(p); }); });
      p.testButton.addEventListener('click', function () { start(p, true); });
      p.retryButton.addEventListener('click', function () { if (!isPro()) return; refreshVoices(p); if (active === p && p.running) { cancel(); p.paused = false; run(p); } else { p.status = 'ritual_voice_ready'; render(p); } });
      p.start = function () { start(p); }; p.rebuild = function () { rebuild(); render(p); }; render(p); return p;
    }
    if (root.speechSynthesis && root.speechSynthesis.addEventListener) root.speechSynthesis.addEventListener('voiceschanged', function () { players.forEach(refreshVoices); });
    ctx.onLang(function () { stop(); players.forEach(function (p) { p.rebuild(); refreshVoices(p); render(p); }); });
    root.addEventListener('hashchange', function () { if (root.location.hash !== '#bhakti') stop(); });
    root.addEventListener('pagehide', stop);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
    root.addEventListener('storage', function () { if (!isPro()) stop(); players.forEach(render); });
    return { mount: mount, stop: stop };
  };
})(window);
