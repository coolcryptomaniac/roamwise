const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('audio focus stops the previous owner before granting a new owner', () => {
  const stopped = [];
  const context = {
    window: { dispatchEvent() {} },
    document: { addEventListener() {} },
    CustomEvent: class CustomEvent {},
  };
  vm.runInNewContext(read('js/audio/focus.js'), context);
  const focus = context.window.RWAudioFocus;
  focus.claim('first', () => stopped.push('first'));
  focus.claim('second', () => stopped.push('second'));
  assert.deepEqual(stopped, ['first']);
  assert.equal(focus.current(), 'second');
});

test('all one-shot cue names reuse one audio element and replace prior playback', () => {
  let now = 1000;
  const instances = [];
  class MockAudio {
    constructor() {
      this.paused = true;
      this.pauseCount = 0;
      this.src = '';
      this.listeners = {};
      instances.push(this);
    }
    canPlayType() { return ''; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    pause() { this.paused = true; this.pauseCount += 1; }
    play() { this.paused = false; return Promise.resolve(); }
    load() {}
  }
  const context = {
    window: { Audio: MockAudio },
    localStorage: { getItem() { return null; } },
    Date: { now: () => now },
    Number,
    isFinite,
    Math,
    Promise,
  };
  vm.runInNewContext(read('js/audio/cues.js'), context);
  assert.equal(context.rwPlayCue('tap_feedback'), true);
  now += 500;
  assert.equal(context.rwPlayCue('success_feedback'), true);
  assert.equal(instances.length, 1);
  assert.ok(instances[0].pauseCount >= 2);
  assert.match(instances[0].src, /success-sting-5s\.mp3$/);
});
