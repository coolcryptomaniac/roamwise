/* Kala in 3D. Loaded on demand (ES module). three.js (MIT) + TalkingHead (MIT) + a CC0 human avatar, all self-hosted in /vendor/kala3d.
   Real skeleton with idle breathing, blinking, eye contact, hand gestures and a physics ponytail (spring dynamics).
   Lip-sync is driven from the text while the browser's own voice speaks. Nothing is uploaded. Original virtual guide, not a real person. */
import * as THREE from 'three';
import { TalkingHead } from '/vendor/kala3d/talkinghead/talkinghead.mjs';

const AVATAR = '/assets/kala3d/kala.glb';
const DEVA = { 'अ':'a','आ':'aa','इ':'i','ई':'ee','उ':'u','ऊ':'oo','ए':'e','ऐ':'ai','ओ':'o','औ':'au','ा':'aa','ि':'i','ी':'ee','ु':'u','ू':'oo','े':'e','ै':'ai','ो':'o','ौ':'au','ं':'n','ँ':'n','ः':'h','क':'k','ख':'kh','ग':'g','घ':'gh','च':'ch','छ':'chh','ज':'j','झ':'jh','ट':'t','ठ':'th','ड':'d','ढ':'dh','त':'t','थ':'th','द':'d','ध':'dh','न':'n','प':'p','फ':'f','ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','व':'v','श':'sh','ष':'sh','स':'s','ह':'h','ण':'n','ड़':'r','ढ़':'rh' };
const MATRA = /[ा-ौ्]/;
export function latin(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '्') continue;
    out += DEVA[c] !== undefined ? DEVA[c] : c;
    if (/[क-ह]/.test(c) && !MATRA.test(s[i + 1] || '') && i < s.length - 1) out += 'a';
  }
  return out;
}
const clean = (t) => latin(String(t)).replace(/[^A-Za-z' ]+/g, ' ').replace(/\s+/g, ' ').trim();

let head = null, scene = null, easel = null, suit = null, tex = null, ready = false, timer = null, boundary = false;
const API = {};

function silent(sec) { const ctx = head.audioCtx, sr = ctx.sampleRate; return ctx.createBuffer(1, Math.max(1, Math.floor(sr * sec)), sr); }

function buildEasel() {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.78, 0.03), new THREE.MeshStandardMaterial({ color: 0x1b1710, roughness: .6 }));
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85, emissive: 0x111111 });
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.7), mat); pic.position.z = 0.0165; pic.name = 'kalaPic';
  const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0x4a3426 })), leg2 = leg1.clone();
  leg1.position.set(-0.22, -0.78, -0.04); leg1.rotation.z = 0.06; leg2.position.set(0.22, -0.78, -0.04); leg2.rotation.z = -0.06;
  g.add(frame, pic, leg1, leg2);
  g.scale.setScalar(.85); g.position.set(-0.44, 1.15, 0.05); g.rotation.y = 0.35;
  return g;
}
function placeholder() { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, '#3a2358'); gr.addColorStop(1, '#0b1020'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256); x.fillStyle = '#e8ba6c'; x.font = '150px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ॐ', 128, 140); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

API.start = async function (node, onprogress) {
  head = new TalkingHead(node, {
    lipsyncModules: ['en'], cameraView: 'mid', cameraRotateEnable: false, cameraPanEnable: false, cameraZoomEnable: false,
    avatarMood: 'happy', avatarIdleEyeContact: 0.55, avatarIdleHeadMove: 0.6, avatarSpeakingEyeContact: 0.8, avatarSpeakingHeadMove: 0.6,
    modelFPS: 30, modelPixelRatio: Math.min(window.devicePixelRatio || 1, 1.5)
  });
  await head.showAvatar({
    url: AVATAR, body: 'F', avatarMood: 'happy', lipsyncLang: 'en',
    baseline: { headRotateX: -0.01, eyeBlinkLeft: 0.05, eyeBlinkRight: 0.05 },
    modelDynamicBones: [
      { bone: 'Ponytail1', type: 'mix2', stiffness: 100, damping: 4, limits: [null, null, [null, 0.02], null], pivot: true },
      { bone: 'Ponytail2', type: 'mix2', stiffness: 150, damping: 4, limits: [null, null, [null, 0.01], null] },
      { bone: 'Ponytail3', type: 'mix2', stiffness: 200, damping: 4, limits: [null, null, [null, 0.01], null] }
    ]
  }, onprogress);
  scene = head.scene; easel = buildEasel(); scene.add(easel);
  head.armature.traverse(o => { if (o.isMesh && /casualsuit/i.test(o.name)) suit = o; });
  head.setView('mid', { cameraX: 0.12, cameraY: 0.02, cameraDistance: 0.45 });
  const vis = new IntersectionObserver(es => { if (!head) return; es[0].isIntersecting ? head.start() : head.stop(); }); vis.observe(node);
  node.addEventListener('pointermove', (e) => { if (ready && !API._t) { API._t = setTimeout(() => { API._t = 0; }, 120); try { head.lookAt(e.clientX, e.clientY, 600); } catch (x) {} } });
  // Safety net: if any bone ever becomes non-finite (it would make her invisible), recover by restarting the pose system.
  setInterval(() => {
    if (!ready || !head.armature) return; let bad = false;
    head.armature.traverse(o => { if (o.isBone && !bad && (!isFinite(o.position.x + o.position.y + o.position.z + o.quaternion.x + o.quaternion.w))) bad = true; });
    if (bad) { try { head.stopSpeaking(); head.stop(); head.armature.traverse(o => { if (o.isBone && o.userData && o.userData.rest) {} }); head.start(); } catch (e) {} API.faults = (API.faults || 0) + 1; }
  }, 2000);
  ready = true; return true;
};

API.ready = () => ready;
// The avatar's clothing texture is a printed t-shirt and jeans. Flatten it to soft grey shading (folds kept, print removed) so one
// colour can tint the whole outfit to match the painting. Real sarees or gowns need separate clothing meshes (see NOTICE.md).
let suitReady = false;
function flattenSuit() {
  if (suitReady || !suit || !suit.material || !suit.material.map || !suit.material.map.image) return;
  const m = suit.material = suit.material.clone(), img = m.map.image, n = 1024, c = document.createElement('canvas'); c.width = c.height = n;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0, n, n); const id = x.getImageData(0, 0, n, n), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const l = .3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2], v = Math.max(0, Math.min(255, 205 + (l - 128) * .4)); d[i] = d[i + 1] = d[i + 2] = v; }
  x.putImageData(id, 0, 0); const t = new THREE.CanvasTexture(c); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.wrapS = m.map.wrapS; t.wrapT = m.map.wrapT; t.anisotropy = 4;
  m.map = t; m.needsUpdate = true; suitReady = true;
}
API.dress = function (hex) { flattenSuit(); if (suit && suit.material) suit.material.color.set(hex); };
API.setPainting = function (imgUrl, hex, greet) {
  if (!ready) return;
  const pic = easel.getObjectByName('kalaPic'), apply = (t) => { t.colorSpace = THREE.SRGBColorSpace; if (tex && tex !== t) tex.dispose(); tex = t; pic.material.map = t; pic.material.needsUpdate = true; };
  if (imgUrl) new THREE.TextureLoader().load(imgUrl, apply, undefined, () => apply(placeholder())); else apply(placeholder());
  if (hex) API.dress(hex);
  clearTimeout(API._g);
  API._g = setTimeout(() => { // let the pose system settle first; firing a gesture and an emoji in the same frame at load corrupts the hips
    try { head.playGesture(greet ? 'namaste' : 'side', greet ? 2.5 : 3, !greet); } catch (e) {}
    if (greet) setTimeout(() => { try { head.speakEmoji('🙏'); } catch (e) {} }, 400);
  }, greet ? 1500 : 250);
};
function speakTimed(words, totalMs) {
  const clean_ = words.filter(Boolean); if (!clean_.length) return;
  const per = totalMs / clean_.length;
  head.speakAudio({ audio: silent(totalMs / 1000 + .05), words: clean_, wtimes: clean_.map((_, i) => i * per), wdurations: clean_.map(() => per * .92) }, { lipsyncLang: 'en', isRaw: true });
}
// One sentence: estimate its length from characters and the speech rate, then lip-sync it.
API.sentence = function (text, rate) {
  if (!ready) return; boundary = false; try { head.stopSpeaking(); } catch (e) {}
  const w = clean(text).split(' '), ms = Math.max(500, clean(text).length / (13.5 * (rate || .94)) * 1000);
  speakTimed(w, ms);
  if (Math.random() < .55) { try { head.playGesture(['handup', 'index', 'side'][Math.floor(Math.random() * 3)], 2, Math.random() < .5); } catch (e) {} }
};
// If the browser reports real word boundaries, re-sync lips word by word.
API.word = function (raw) {
  if (!ready) return; const w = clean(raw); if (!w) return; boundary = true;
  try { head.stopSpeaking(); } catch (e) {}
  speakTimed([w], Math.max(160, w.length * 75));
};
API.stopTalk = function () { if (ready) { try { head.stopSpeaking(); } catch (e) {} } };
API.stop = function () { if (head) { try { head.stop(); } catch (e) {} } };
API.start_ = function () { if (head) { try { head.start(); } catch (e) {} } };
API.dispose = function () { if (head) { try { head.dispose(); } catch (e) {} } head = null; ready = false; };
API.debug = () => ({ head, THREE });
window.RWKala3D = API;
export default API;
