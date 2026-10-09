const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const repo = path.resolve(__dirname, '../../..');
const base = path.join(repo, 'kainchi/');
const html = fs.readFileSync(base + 'index.html', 'utf8');
function boot(opts = {}) {
  const dom = new JSDOM(html, { url: 'https://roamwise.co.in/kainchi/', runScripts: 'outside-only' });
  const w = dom.window;
  Object.defineProperty(w.navigator, 'language', { value: opts.lang || 'en-IN' });
  if (opts.reduced) w.matchMedia = () => ({ matches: true, addEventListener() {} });
  w.fetch = async (url, options) => {
    assert.equal(url, '../features/kainchi-yatra/data/daily.json');
    assert.equal(options.credentials, 'omit');
    return { ok: true, text: async () => fs.readFileSync(path.join(repo, 'features/kainchi-yatra/data/daily.json'), 'utf8') };
  };
  w.setInterval = () => 0;
  w.print = () => {};
  if (opts.pro) w.localStorage.setItem('rwPro', '1');
  if (opts.speech) {
    w.SpeechSynthesisUtterance = function (text) { this.text = text; };
    w.speechSynthesis = opts.speech;
  }
  if (opts.saved) w.localStorage.setItem('rw_kainchi_passes_v1', opts.saved);
  if (opts.blocked) Object.defineProperty(w, 'localStorage', { get() { throw new Error('blocked'); } });
  for (const tag of w.document.querySelectorAll('script[src]')) w.eval(fs.readFileSync(path.resolve(base, tag.getAttribute('src')), 'utf8'));
  return dom;
}
const $ = (d, id) => d.window.document.getElementById(id);
test('page has strict CSP and no inline script/style', () => {
  assert.match(html, /connect-src 'self'/);
  assert.doesNotMatch(html, /<script(?![^>]*src=)/);
  assert.doesNotMatch(html, /\sstyle=|\sonclick=/);
});
test('renders English, honest empty states, nearby places', () => {
  const d = boot();
  assert.ok($(d, 'plan-level').textContent.length > 0);
  assert.match($(d, 'rate-list').textContent, /./);
  assert.equal($(d, 'rate-list').querySelectorAll('.rate').length, 0);
  assert.ok($(d, 'alt-list').children.length >= 5);
  assert.equal($(d, 'emerg-amb').getAttribute('href'), 'tel:108');
});
test('Hindi toggle translates and persists', () => {
  const d = boot();
  d.window.document.querySelector('[data-lang="hi"]').click();
  assert.equal(d.window.document.documentElement.lang, 'hi');
  assert.match($(d, 'h1' ) ? '' : d.window.document.querySelector('h1').textContent, /[ऀ-ॿ]/);
  assert.equal(d.window.localStorage.getItem('rw_kainchi_lang_v1'), 'hi');
  assert.equal(boot({ lang: 'hi-IN' }).window.document.documentElement.lang, 'hi');
});
test('pass is made, not saved unless opted in, and can be deleted', () => {
  const d = boot(), doc = d.window.document;
  $(d, 'pass-leader').value = 'Asha'; $(d, 'pass-size').value = '3';
  $(d, 'pass-form').dispatchEvent(new d.window.Event('submit', { cancelable: true }));
  assert.equal(doc.querySelectorAll('#pass-list .pass').length, 1);
  assert.equal(d.window.localStorage.getItem('rw_kainchi_passes_v1'), null);
  $(d, 'pass-remember').checked = true; $(d, 'pass-remember').dispatchEvent(new d.window.Event('change'));
  assert.match(d.window.localStorage.getItem('rw_kainchi_passes_v1'), /KDY-/);
  doc.querySelector('#pass-list .pass button.quiet').click();
  assert.equal(doc.querySelectorAll('#pass-list .pass').length, 0);
});
test('invalid pass shows a localised error', () => {
  const d = boot();
  $(d, 'pass-leader').value = ''; $(d, 'pass-size').value = '3';
  $(d, 'pass-form').dispatchEvent(new d.window.Event('submit', { cancelable: true }));
  assert.match($(d, 'pass-message').className, /bad/);
});
test('report builds a mailto link; ambulance shows emergency call-out', () => {
  const d = boot();
  $(d, 'rep-place').value = 'Bhowali'; $(d, 'rep-amount').value = '3000'; $(d, 'rep-official').value = '2000';
  $(d, 'rep-text').value = 'Driver demanded far more than the posted fare.';
  $(d, 'report-form').dispatchEvent(new d.window.Event('submit', { cancelable: true }));
  assert.equal($(d, 'report-out').hidden, false);
  assert.match($(d, 'report-mail').getAttribute('href'), /^mailto:support@roamwise\.co\.in/);
  $(d, 'rep-cat').value = 'ambulance'; $(d, 'rep-cat').dispatchEvent(new d.window.Event('change'));
  assert.equal($(d, 'report-emergency').hidden, false);
});
test('works with storage blocked and ignores corrupt stored passes', () => {
  assert.ok(boot({ blocked: true }).window.document.getElementById('plan-level').textContent);
  const d = boot({ saved: '{{bad' });
  assert.equal(d.window.document.querySelectorAll('#pass-list .pass').length, 0);
});
test('tabs support deep links, selection and arrow keys', async () => {
  const d = boot(), w = d.window, doc = w.document;
  assert.equal($(d, 'today').hidden, false);
  assert.equal($(d, 'plan').hidden, true);
  doc.querySelector('#tab-plan').click();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal($(d, 'plan').hidden, false);
  assert.equal($(d, 'today').hidden, true);
  doc.querySelector('#tab-plan').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal($(d, 'bhakti').hidden, false);
  assert.equal(doc.activeElement.id, 'tab-bhakti');
  d.window.close();
});
test('date cards synchronise arrival date and WhatsApp draft without personal data', () => {
  const d = boot();
  const day = $(d, 'week-strip').children[2]; const value = day.dataset.date; day.click();
  assert.equal($(d, 'plan-date').value, value);
  assert.equal($(d, 'pass-date').value, value);
  assert.match(decodeURIComponent($(d, 'share-trip').href), /estimate, not live traffic/);
  assert.ok(decodeURIComponent($(d, 'share-trip').href).includes(value));
  d.window.close();
});
test('official filter does not promote news, failed refresh leaves the planner usable', async () => {
  const d = boot();
  await new Promise(resolve => setTimeout(resolve, 20));
  d.window.document.querySelector('[data-feed-filter="official"]').click();
  assert.equal($(d, 'updates-list').querySelectorAll('.update-card').length, 0);
  assert.match($(d, 'updates-list').textContent, /does not mean the roads are clear/);
  d.window.fetch = async () => { throw new Error('offline'); };
  $(d, 'updates-refresh').click();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.match($(d, 'feed-network').textContent, /Refresh unavailable/);
  assert.ok($(d, 'plan-level').textContent);
  assert.equal($(d, 'updates-refresh').disabled, false);
  d.window.close();
});
test('emergency calls appear before the visitor submits a report', () => {
  const d = boot();
  $(d, 'rep-cat').value = 'ambulance'; $(d, 'rep-cat').dispatchEvent(new d.window.Event('change'));
  assert.equal($(d, 'report-out').hidden, true);
  assert.equal($(d, 'report-emergency').hidden, false);
  assert.equal($(d, 'report-emergency').closest('#report-out'), null);
  assert.equal($(d, 'report-emergency').querySelector('a').href, 'tel:108');
  d.window.close();
});

test('devotional controls are opt-in, pauseable and source linked', () => {
  const d = boot();
  assert.equal($(d, 'digital-diya').classList.contains('lit'), false);
  $(d, 'diya-toggle').click();
  assert.equal($(d, 'digital-diya').classList.contains('lit'), true);
  assert.equal($(d, 'diya-toggle').getAttribute('aria-pressed'), 'true');
  $(d, 'motion-toggle').click();
  assert.equal(d.window.document.body.classList.contains('motion-paused'), true);
  assert.equal(d.window.localStorage.getItem('rw_kainchi_motion'), 'off');
  assert.equal($(d, 'trust-info').href, 'https://shreekainchimandirtrust.org/contact');
  assert.equal(d.window.document.querySelectorAll('audio,iframe').length, 0);
  assert.equal($(d, 'aarti-toggle').disabled, true);
  $(d, 'incense-toggle').click();
  assert.equal($(d, 'agarbatti').classList.contains('lit'), true);
  assert.match($(d, 'media-trust').href, /youtube\.com/);
  d.window.localStorage.setItem('rwPro', '1');
  $(d, 'diya-toggle').click();
  $(d, 'aarti-toggle').click();
  assert.equal($(d, 'aarti-toggle').disabled, false);
  assert.equal($(d, 'ritual-stage').classList.contains('aarti-active'), true);
  $(d, 'pooja-name').value = 'Mohit';
  $(d, 'pooja-wellwishers').value = 'Family';
  $(d, 'pooja-form').dispatchEvent(new d.window.Event('submit', { cancelable: true }));
  assert.equal($(d, 'pooja-result').hidden, false);
  assert.match($(d, 'pooja-result').textContent, /Mohit/);
  d.window.close();
});

test('visitor routes preserve the destination and translate without requesting location', () => {
  const d = boot(), w = d.window;
  const route = () => new URL($(d, 'route-open').href);
  assert.equal(route().searchParams.has('origin'), false);
  $(d, 'route-origin').value = 'kathgodam';
  $(d, 'route-origin').dispatchEvent(new w.Event('change'));
  assert.equal(route().searchParams.get('origin'), 'Kathgodam Railway Station, Uttarakhand');
  assert.equal(route().searchParams.get('destination'), 'Kainchi Dham, Uttarakhand, India');
  w.document.querySelector('[data-lang="hi"]').click();
  assert.equal($(d, 'route-origin').value, 'kathgodam');
  assert.match($(d, 'reach-h').textContent, /कैंची/);
  assert.match($(d, 'baba-photo').alt, /नीम करौली/);
  for (const a of w.document.querySelectorAll('[data-visit-link]')) {
    assert.equal(new URL(a.href).protocol, 'https:');
    assert.match(a.rel, /noopener/);
  }
  $(d, 'tab-reach').click();
  assert.equal($(d, 'reach').hidden, false);
  d.window.close();
});
test('advisory layer is local-only and never pretends to issue permits', () => {
  const d = boot(), doc = d.window.document;
  assert.match($(d, 'advisory').textContent, /not affiliated/i);
  assert.match($(d, 'rules-h').textContent, /cannot switch on/i);
  $(d, 'signal-note').value = 'Queue moving near the bend';
  $(d, 'signal-form').dispatchEvent(new d.window.Event('submit', { cancelable: true }));
  assert.equal($(d, 'signal-list').querySelectorAll('.signal-card').length, 1);
  assert.match(d.window.localStorage.getItem('rw_kainchi_advisory_v1'), /Queue moving/);
  $(d, 'resident-route').value = 'Bhowali to Kainchi'; $(d, 'resident-date').value = '2026-10-12';
  $(d, 'resident-form').dispatchEvent(new d.window.Event('submit', { cancelable: true }));
  assert.match($(d, 'resident-out').textContent, /Bhowali to Kainchi/);
  assert.equal($(d, 'corridor-h').nextElementSibling.textContent.includes('self-direct'), true);
  assert.equal($(d, 'advisory').querySelector('a[href="tel:108"]').getAttribute('href'), 'tel:108');
  assert.equal(doc.querySelectorAll('iframe').length, 0);
  d.window.close();
});

function speech(voices = [{ lang: 'en-IN', localService: true }, { lang: 'hi-IN', localService: true }]) {
  return { spoken: [], cancelled: 0, getVoices() { return voices; }, speak(u) { this.spoken.push(u); }, cancel() { this.cancelled++; } };
}
const action = (d, kind, id) => d.window.document.querySelector('#' + kind + '-ritual [data-ritual-action="' + id + '"]');
function toggleVoice(d, kind, value) {
  const checkbox = action(d, kind, 'voice'); checkbox.checked = value; checkbox.dispatchEvent(new d.window.Event('change'));
}
test('panditji player is Pro gated, silent by default and contains the whole configured aarti', () => {
  const guest = boot();
  assert.equal(action(guest, 'standard', 'start').disabled, true);
  assert.equal($(guest, 'digital-aarti-player').hidden, true);
  guest.window.close();
  const voice = speech(), d = boot({ pro: true, speech: voice });
  $(d, 'aarti-toggle').click();
  assert.equal($(d, 'digital-aarti-player').hidden, false);
  assert.equal(voice.spoken.length, 0);
  assert.equal(action(d, 'standard', 'voice').checked, false);
  assert.equal(d.window.RWKainchiCore.hanumanAarti.length, 12);
  const script = d.window.document.querySelector('#standard-ritual .ritual-script');
  assert.equal(script.children.length, 23);
  assert.match(script.textContent, /कंचन थार कपूर/);
  assert.match(d.window.RWKainchiCore.t('hi', 'mantra_gayatri'), /धियो यो नः प्रचोदयात्/);
  for (const phase of ['sankalp', 'flowers', 'dhoop', 'diya', 'aarti', 'prasad', 'blessing']) {
    assert.ok(d.window.RWKainchiCore.ritualScript('en').some(s => s.id === phase));
  }
  d.window.close();
});
test('local recitation advances, pauses, resumes and ignores callbacks from stopped sessions', () => {
  const voice = speech(), d = boot({ pro: true, speech: voice });
  $(d, 'aarti-toggle').click(); toggleVoice(d, 'standard', true);
  assert.equal(voice.spoken.length, 1);
  const first = voice.spoken[0], late = first.onend;
  action(d, 'standard', 'pause').click();
  assert.equal(voice.cancelled, 1);
  late(); assert.equal(voice.spoken.length, 1);
  action(d, 'standard', 'pause').click();
  assert.equal(voice.spoken.length, 2);
  voice.spoken[1].onend();
  assert.equal(voice.spoken.length, 3);
  assert.match(voice.spoken[2].text, /intention/);
  action(d, 'standard', 'next').click();
  assert.equal(voice.spoken.at(-1).lang, 'hi-IN');
  assert.equal(voice.spoken.at(-1).voice.localService, true);
  const stopped = voice.spoken.at(-1).onend;
  action(d, 'standard', 'stop').click(); stopped();
  assert.equal(action(d, 'standard', 'pause').disabled, true);
  assert.match(d.window.document.querySelector('#standard-ritual .ritual-progress').textContent, /stopped/);
  d.window.close();
});
test('unavailable or remote-only voices never receive names and fail honestly to text mode', () => {
  for (const voices of [[], [{ lang: 'hi-IN', localService: false }, { lang: 'en-IN', localService: false }]]) {
    const voice = speech(voices), d = boot({ pro: true, speech: voice });
    $(d, 'pooja-name').value = 'Private Name';
    $(d, 'pooja-form').dispatchEvent(new d.window.Event('submit', { cancelable: true }));
    toggleVoice(d, 'custom', true);
    assert.equal(voice.spoken.length, 0);
    assert.match(d.window.document.querySelector('#custom-ritual .ritual-progress').textContent, /No local voice/);
    toggleVoice(d, 'custom', false);
    action(d, 'custom', 'next').click();
    assert.match(d.window.document.querySelector('#custom-ritual .ritual-caption').textContent, /Private Name/);
    d.window.close();
  }
});
test('custom aarti safely speaks the named sankalp, chosen mantra and completes symbolic prasad', () => {
  const voice = speech(), d = boot({ pro: true, speech: voice });
  $(d, 'pooja-name').value = '<img src=x onerror=alert(1)>';
  $(d, 'pooja-wellwishers').value = 'Family'; $(d, 'pooja-mantra').value = 'gayatri';
  $(d, 'pooja-form').dispatchEvent(new d.window.Event('submit', { cancelable: true }));
  assert.equal(d.window.document.querySelector('#pooja-result img[src="x"]'), null);
  toggleVoice(d, 'custom', true); voice.spoken.at(-1).onend();
  assert.match(voice.spoken.at(-1).text, /Remembering <img/);
  assert.match(voice.spoken.at(-1).text, /Family/);
  let count = 0;
  while (!action(d, 'custom', 'pause').disabled && count++ < 30) voice.spoken.at(-1).onend();
  assert.equal(count, 22);
  const caption = d.window.document.querySelector('#custom-ritual .ritual-caption');
  assert.match(caption.textContent, /not a promise/);
  assert.equal(d.window.document.querySelector('#custom-ritual .ritual-scene').dataset.phase, 'prasad');
  assert.match(voice.spoken.map(u => u.text).join(' '), /धियो यो नः प्रचोदयात्/);
  assert.doesNotMatch(JSON.stringify(d.window.localStorage), /Family|onerror/);
  d.window.close();
});
test('player switches modes without overlap and stops on language, tab, speech error or Pro loss', () => {
  const voice = speech(), d = boot({ pro: true, speech: voice });
  $(d, 'aarti-toggle').click(); toggleVoice(d, 'standard', true);
  $(d, 'pooja-name').value = 'Mohit'; $(d, 'pooja-form').dispatchEvent(new d.window.Event('submit', { cancelable: true }));
  assert.equal(action(d, 'standard', 'pause').disabled, true);
  toggleVoice(d, 'custom', true); voice.spoken.at(-1).onerror();
  assert.match(d.window.document.querySelector('#custom-ritual .ritual-progress').textContent, /Speech unavailable/);
  d.window.document.querySelector('[data-lang="hi"]').click();
  assert.equal(action(d, 'custom', 'pause').disabled, true);
  assert.match(d.window.document.querySelector('#custom-ritual .ritual-progress').textContent, /रोक दिया/);
  action(d, 'custom', 'start').click();
  d.window.dispatchEvent(new d.window.HashChangeEvent('hashchange'));
  assert.equal(action(d, 'custom', 'pause').disabled, true);
  action(d, 'custom', 'start').click();
  d.window.localStorage.removeItem('rwPro'); d.window.dispatchEvent(new d.window.StorageEvent('storage'));
  assert.equal(action(d, 'custom', 'start').disabled, true);
  assert.equal(action(d, 'custom', 'pause').disabled, true);
  d.window.close();
});
test('speech failures and missing API preserve manual progression and reduced-motion preferences', () => {
  const voice = speech(); voice.speak = () => { throw new Error('device unavailable'); };
  const d = boot({ pro: true, speech: voice, reduced: true });
  $(d, 'aarti-toggle').click(); toggleVoice(d, 'standard', true);
  assert.match(d.window.document.querySelector('#standard-ritual .ritual-progress').textContent, /Speech unavailable/);
  assert.equal(d.window.document.body.classList.contains('motion-paused'), true);
  assert.equal($(d, 'motion-toggle').disabled, true);
  toggleVoice(d, 'standard', false); action(d, 'standard', 'next').click();
  assert.match(d.window.document.querySelector('#standard-ritual .ritual-progress').textContent, /Step 2/);
  d.window.close();
  const noApi = boot({ pro: true }); $(noApi, 'aarti-toggle').click(); toggleVoice(noApi, 'standard', true);
  assert.match(noApi.window.document.querySelector('#standard-ritual .ritual-progress').textContent, /No local voice/);
  noApi.window.close();
});
