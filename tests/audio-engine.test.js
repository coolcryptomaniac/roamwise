const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

class MockAudio {
  constructor() {
    this.paused = true;
    this.loop = false;
    this.preload = '';
    this.src = '';
    this.volume = 1;
    this.currentTime = 0;
  }
  canPlayType() { return ''; } /* pretend no ogg support so tests exercise the .mp3 fallback path */
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
}

function loadEngine(saved = {}) {
  const storage = new Map(Object.entries(saved));
  const documentListeners = new Map();
  const document = {
    hidden: false,
    readyState: 'complete',
    addEventListener(name, fn) { documentListeners.set(name, fn); },
    removeEventListener() {},
    getElementById() { return null; },
    querySelector() { return null; },
    createElement() { throw new Error('Settings should not mount without its host'); }
  };
  const window = {
    Audio: MockAudio,
    addEventListener() {},
    dispatchEvent() {}
  };
  const context = {
    window,
    document,
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, String(value)); }
    },
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init.detail; } },
    Promise,
    Math,
    Number,
    isFinite,
    setInterval() { return 1; },
    clearInterval() {},
    setTimeout(fn) { fn(); return 1; }
  };
  const source = fs.readFileSync(path.join(__dirname, '..', 'platform-v5', 'audio-only.js'), 'utf8');
  vm.runInNewContext(source, context, { filename: 'audio-only.js' });
  return { api: window.RWAudio, storage, documentListeners };
}

test('audio is on by default and starts the persistent engine', async () => {
  const { api } = loadEngine();
  assert.equal(api.isEnabled(), true);
  assert.equal(await api.play(), true);
  assert.equal(api.isPlaying(), true);
  assert.equal(api.getState().blocked, false);
});

test('mute and volume persist and unmute resumes audio', async () => {
  const { api, storage } = loadEngine();
  await api.setEnabled(false);
  assert.equal(api.isEnabled(), false);
  assert.equal(api.isPlaying(), false);
  assert.equal(storage.get('rw_audio_enabled'), '0');

  assert.equal(api.setVolume(0.4), 0.4);
  assert.equal(storage.get('rw_audio_volume'), '0.4');

  assert.equal(await api.setEnabled(true), true);
  assert.equal(api.isPlaying(), true);
  assert.equal(storage.get('rw_audio_enabled'), '1');
});

test('saved mute preference is honoured on the next visit', () => {
  const { api } = loadEngine({ rw_audio_enabled: '0', rw_audio_volume: '0.15' });
  assert.equal(api.isEnabled(), false);
  assert.equal(api.isPlaying(), false);
  assert.equal(api.getVolume(), 0.15);
});
