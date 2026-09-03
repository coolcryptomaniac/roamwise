const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function audioParam(initial = 0) {
  return {
    value: initial,
    cancelScheduledValues() {},
    setValueAtTime(value) { this.value = value; },
    linearRampToValueAtTime(value) { this.value = value; },
    exponentialRampToValueAtTime(value) { this.value = value; }
  };
}

class MockNode {
  connect() { return this; }
}

class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.destination = new MockNode();
    this.sampleRate = 8000;
    this.state = 'suspended';
  }
  createGain() { const node = new MockNode(); node.gain = audioParam(); return node; }
  createOscillator() {
    const node = new MockNode();
    node.frequency = audioParam();
    node.detune = audioParam();
    node.start = () => {};
    node.stop = () => {};
    return node;
  }
  createDynamicsCompressor() {
    const node = new MockNode();
    node.threshold = audioParam();
    node.knee = audioParam();
    node.ratio = audioParam();
    node.attack = audioParam();
    node.release = audioParam();
    return node;
  }
  createBuffer(_channels, frames) {
    const data = new Float32Array(frames);
    return { getChannelData: () => data };
  }
  createBufferSource() {
    const node = new MockNode();
    node.start = () => {};
    return node;
  }
  createBiquadFilter() {
    const node = new MockNode();
    node.frequency = audioParam();
    return node;
  }
  resume() { this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
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
    AudioContext: MockAudioContext,
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
