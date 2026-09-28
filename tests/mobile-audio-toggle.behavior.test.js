const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '..', 'platform-v5', 'audio-only.js'), 'utf8');

test('quick sound toggle can mute and unmute repeatedly on mobile browsers', async () => {
  const values = new Map(), attrs = {}, classes = new Set();
  const button = {
    textContent: '', title: '',
    classList: { toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); } },
    setAttribute(name, value) { attrs[name] = value; }
  };
  const document = {
    readyState: 'complete',
    getElementById(id) { return id === 'rwAudioQuickToggle' ? button : null; },
    querySelector() { return null; }, addEventListener() {}
  };
  const window = { dispatchEvent() {} };
  class CustomEvent { constructor(type, init) { this.type = type; this.detail = init.detail; } }
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
  vm.runInNewContext(source, { window, document, localStorage, CustomEvent });
  assert.equal(button.textContent, '🔊');
  await window.rwToggleAudioQuick();
  assert.equal(window.RWAudio.isEnabled(), false);
  assert.equal(button.textContent, '🔇');
  assert.equal(attrs['aria-pressed'], 'true');
  assert.match(button.title, /muted/i);
  await window.rwToggleAudioQuick();
  assert.equal(window.RWAudio.isEnabled(), true);
  assert.equal(button.textContent, '🔊');
  assert.equal(attrs['aria-pressed'], 'false');
  assert.match(button.title, /tap to mute/i);
  await window.rwToggleAudioQuick();
  assert.equal(window.RWAudio.isEnabled(), false);
  assert.equal(button.textContent, '🔇');
});
