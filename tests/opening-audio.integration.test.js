const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('cinematic opening has no loading photo dependency', () => {
  const opening = read('platform-v5/atlas-shinobi.js');
  assert.doesNotMatch(opening, /roamwise-opening-poster|rw-poster|<img/i);
  assert.match(opening, /CSS fallback/);
  assert.equal(fs.existsSync(path.join(root, 'assets', 'roamwise-opening-poster.png')), false);
});

test('audio loads before the cinematic opener and gates its animation', () => {
  const config = read('rw-config.js');
  const focusIndex = config.indexOf("load('js/audio/focus.js', true)");
  const audioIndex = config.indexOf("load('platform-v5/audio-only.js', true)");
  const openingIndex = config.indexOf("load('platform-v5/atlas-shinobi.js', true)");
  assert.ok(focusIndex > -1 && audioIndex > focusIndex && openingIndex > audioIndex);

  const opening = read('platform-v5/atlas-shinobi.js');
  assert.match(opening, /Tap to begin with sound/);
  assert.match(opening, /beginVisual\(true\)/);
  assert.doesNotMatch(opening, /Promise\.resolve\(RWAudio\.play\(\)\)/);
  assert.match(opening, /webkit-playsinline/);
  assert.match(opening, /rw-started/);
  assert.match(opening, /closeTimer = setTimeout\(close/);
  const beginVisual = opening.slice(opening.indexOf('function beginVisual'), opening.indexOf('function startExperience'));
  assert.match(beginVisual, /var videoPlay = video\.play\(\)/);
  assert.doesNotMatch(beginVisual, /if \(videoReady\)/);

  assert.match(opening, /localStorage\.setItem\('rw_opening','1'\)/);
});

test('settings and offline shell include the new audio engine', () => {
  const audio = read('platform-v5/audio-only.js');
  assert.match(audio, /#settingsOverlay \.modal-body/);
  assert.match(audio, /id=\"rwAudioToggle\"/);
  assert.match(audio, /id=\"rwAudioVolume\"/);

  const worker = read('sw.js');
  assert.match(worker, /rw-v118-mobile-audio-fresh/);
  assert.match(worker, /js\/audio\/focus\.js/);
  assert.match(worker, /platform-v5\/audio-only\.js/);
  assert.match(worker, /platform-v5\/atlas-shinobi\.js/);
});

test('deploy freshness is network-first for code and reloads on a new controller', () => {
  const worker = read('sw.js');
  const freshness = read('js/runtime/freshness.js');
  assert.match(worker, /var isCode =/);
  assert.match(worker, /fetch\(req, \{ cache: 'no-store' \}\)/);
  assert.match(freshness, /updateViaCache: 'none'/);
  assert.match(freshness, /controllerchange/);
  assert.match(freshness, /window\.location\.reload\(\)/);
});

test('mobile composer and search controls cannot overlap or widen the page', () => {
  const html = read('index.html');
  const css = read('mobile-stability.css');
  assert.match(html, /class="copilot-compose"/);
  assert.match(html, /class="copilot-actions"/);
  assert.match(css, /grid-template-areas:/);
  assert.match(css, /"models actions"/);
  assert.match(css, /#ssInput[\s\S]*min-width: 0/);
  assert.match(css, /@media \(max-width: 540px\)[\s\S]*\.xp-chip/);
});

test('the corrupt pseudo-MP3 is gone and the ambient bed plays a real uploaded asset', () => {
  assert.equal(fs.existsSync(path.join(root, 'assets', 'audio', 'rave-to-hell-theme-10s.mp3')), false);
  const audio = read('platform-v5/audio-only.js');
  /* The synthesized Web Audio oscillator/noise generator (and its unwanted
     looping chime) was removed in favor of real, licensed ambient playback
     from assets/audio/ambient-theme-30s.{mp3,ogg} — see the header comment
     in audio-only.js for why. Assert the real-file path is present and the
     synthesized generator is gone. */
  assert.match(audio, /ambient-theme-30s/);
  assert.doesNotMatch(audio, /createOscillator|createBufferSource|createBiquadFilter|AudioContext/);
  assert.match(audio, /new AudioCtor\(\)|window\.Audio/);

  /* Still gated by the same single Settings mute switch and volume state. */
  assert.match(audio, /rw_audio_enabled/);
  assert.match(audio, /rw_audio_volume/);
  assert.match(audio, /state\.enabled/);
  assert.match(audio, /normalizedVolume|audioEl\.volume/);
});
