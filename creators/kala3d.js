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

// A small gold-edged canvas that Kala holds in her right hand (parented to the hand bone after the pose settles).
function buildEasel() {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.78, 0.04), new THREE.MeshStandardMaterial({ color: 0x8a6a2a, roughness: .35, metalness: .6 }));
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85, emissive: 0x111111 });
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.7), mat); pic.position.z = 0.0215; pic.name = 'kalaPic';
  g.add(frame, pic);
  return g;
}
// Both hands grip the canvas edges in front of her chest (arm angles solved offline with a small IK search against the avatar's skeleton).
const R = (x, y, z) => ({ x, y, z });
const HOLD_ARM = {
  'RightArm.rotation': R(1.314, 0.24, -1.009), 'RightForeArm.rotation': R(0.197, 1.245, -0.14), 'RightHand.rotation': R(0.815, -1.002, -0.973),
  'LeftArm.rotation': R(-0.16, 0.509, 2.055), 'LeftForeArm.rotation': R(0.084, -0.341, 0.086), 'LeftHand.rotation': R(-1.423, -1.105, 0.508)
};
for (const S of ['Left', 'Right']) { // fingers curled around the frame edge
  HOLD_ARM[S + 'HandIndex1.rotation'] = R(0.7, 0, 0); HOLD_ARM[S + 'HandIndex2.rotation'] = R(0.9, 0, 0); HOLD_ARM[S + 'HandIndex3.rotation'] = R(0.6, 0, 0);
  HOLD_ARM[S + 'HandMiddle1.rotation'] = R(0.8, 0, 0); HOLD_ARM[S + 'HandMiddle2.rotation'] = R(1.0, 0, 0); HOLD_ARM[S + 'HandMiddle3.rotation'] = R(0.6, 0, 0);
  HOLD_ARM[S + 'HandRing1.rotation'] = R(0.9, 0, 0); HOLD_ARM[S + 'HandRing2.rotation'] = R(1.0, 0, 0); HOLD_ARM[S + 'HandRing3.rotation'] = R(0.6, 0, 0);
  HOLD_ARM[S + 'HandPinky1.rotation'] = R(1.0, 0, 0); HOLD_ARM[S + 'HandPinky2.rotation'] = R(1.0, 0, 0); HOLD_ARM[S + 'HandPinky3.rotation'] = R(0.6, 0, 0);
}
function holdPoses() {
  const side = head.poseTemplates.side.props, shoulderKeys = ['LeftShoulder.rotation', 'RightShoulder.rotation'];
  for (const t of Object.values(head.poseTemplates)) {
    if (!t || !t.props || !t.standing) continue;
    for (const k of shoulderKeys) t.props[k] = JSON.parse(JSON.stringify(side[k]));
    Object.assign(t.props, JSON.parse(JSON.stringify(HOLD_ARM)));
  }
  try { head.setPoseFromTemplate(head.poseTemplates.side, 400); } catch (e) {}
}
// The canvas rides on her chest (spine bone) so it stays put while her hands grip its edges.
function attachToChest() {
  const spine = head.armature.getObjectByName('Spine2'); if (!spine || !easel) return;
  const hips = head.armature.getObjectByName('Hips'), w = new THREE.Vector3(); hips.getWorldPosition(w);
  easel.scale.setScalar(.72); easel.position.set(-0.19, 1.15, 0.33); easel.rotation.set(-0.05, 0.12, 0.02);
  scene.add(easel); easel.updateMatrixWorld(true); spine.attach(easel);
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
    baseline: { headRotateX: -0.01, eyeBlinkLeft: 0.05, eyeBlinkRight: 0.05 }
  }, onprogress);
  scene = head.scene; easel = buildEasel(); head.speakWithHands = function () {}; head.mirrorPose = function (p) { return p; }; try { Object.defineProperty(head, 'poseWeightOnLeft', { get: () => true, set: () => {} }); } catch (e) {} /* poses mirror left/right on every change; keep the holding arm on the right */ setTimeout(holdPoses, 1200); let tries = 0; const wait = setInterval(() => { const v = new THREE.Vector3(); try { head.armature.getObjectByName('RightHand').getWorldPosition(v); } catch (e) {} if ((v.y > 1.1 && v.x < -0.2) || ++tries > 50) { clearInterval(wait); attachToChest(); } }, 300);
  head.armature.traverse(o => { if (o.isMesh && /casualsuit|^outfit$/i.test(o.name)) suit = o; });
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
