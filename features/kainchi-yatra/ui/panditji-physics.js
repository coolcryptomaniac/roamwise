/* Panditji's body rig: damped springs, lagging pendulums and a marigold petal pool. Pure maths, no DOM, no network.
   Coordinates are pixels of art/digital-panditji.webp (768x802). displace() tells the mesh renderer where each point moves. */
(function (root) {
  'use strict';
  var PX = 390, PY = 285;
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function sm(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function gs(x, c, s) { var d = (x - c) / s; return Math.exp(-d * d); }
  function Spring(w, z) { this.w = w; this.z = z; this.x = 0; this.v = 0; this.t = 0; }
  Spring.prototype.step = function (dt) {
    var n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n, i;
    for (i = 0; i < n; i += 1) { this.v += (this.w * this.w * (this.t - this.x) - 2 * this.z * this.w * this.v) * h; this.x += this.v * h; }
  };
  var BOW = { welcome: 0.5, sankalp: 0.25, invocation: 0.45, shanti: 0.4, blessing: 0.6, prasad: 0.2 };
  var COLORS = ['#f6a823', '#f9c74f', '#e8761d', '#ffd166'];
  root.RWKainchiUI.panditRig = function (random) {
    var rnd = random || Math.random, clock = 0, blinkAt = 1.4, blinkEnd = 0, prev = { roll: 0, sway: 0, jaw: 0 }, emitAcc = 0, lastPhase = '';
    var s = {
      roll: new Spring(8, 0.34), yaw: new Spring(6, 0.7), pitch: new Spring(9, 0.45), jaw: new Spring(40, 0.8), lid: new Spring(60, 0.9),
      sway: new Spring(2.4, 0.4), bow: new Spring(4.5, 0.55), beard: new Spring(12, 0.16), malaL: new Spring(7, 0.12), malaR: new Spring(8, 0.12),
      loop: new Spring(6, 0.14), tassel: new Spring(9, 0.1), flutter: new Spring(3, 0.3), breath: 0
    };
    var petals = [];
    function spawn(n, x, y, spread, lift) {
      var i, p;
      for (i = 0; i < n && petals.length < 40; i += 1) {
        p = { x: x + (rnd() - 0.5) * spread, y: y, vx: (rnd() - 0.5) * 90, vy: -(lift || 40) * (0.5 + rnd()), r: rnd() * 6.28, vr: (rnd() - 0.5) * 6, sz: 5 + rnd() * 4, age: 0, life: 4 + rnd() * 2, ph: rnd() * 6.28, c: COLORS[Math.floor(rnd() * COLORS.length)] };
        petals.push(p);
      }
    }
    function updatePetals(dt) {
      var i, p;
      for (i = petals.length - 1; i >= 0; i -= 1) {
        p = petals[i]; p.age += dt; p.vy += 150 * dt; p.vx += Math.sin(p.age * 3.6 + p.ph) * 70 * dt; p.vx *= 1 - 0.9 * dt; p.vy *= 1 - 0.5 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        if (p.age > p.life || p.y > 830) petals.splice(i, 1);
      }
    }
    function update(dt, inp) {
      dt = clamp(dt, 0, 0.05); clock += dt;
      var st = inp.style || {}, k = st.sway == null ? 1 : st.sway, gx = inp.gx || 0, gy = inp.gy || 0, at = inp.attn || 0, phase = inp.running ? inp.phase || '' : '';
      var talk = inp.speaking ? 0.5 + 0.5 * Math.sin(clock * 14 + 2 * Math.sin(clock * 3.3)) : 0;
      talk = talk > 0.35 ? talk : 0; s.breath = Math.sin(clock * 6.283 * 0.22 * (st.breath || 1));
      s.sway.t = k * (0.5 * Math.sin(clock * 0.47) + 0.25 * Math.sin(clock * 0.91 + 1.3));
      s.roll.t = 0.02 * s.sway.x + 0.04 * gx * at; s.yaw.t = gx * at * 0.9 + 0.12 * Math.sin(clock * 0.31) * (1 - at);
      s.pitch.t = gy * at * 0.6 + 0.1 * talk + (phase === 'blessing' ? 0.25 * Math.max(0, Math.sin(clock * 1.7)) : 0);
      s.bow.t = (BOW[phase] || 0) * (0.6 + 0.4 * Math.sin(clock * 0.8)) + (inp.speaking ? 0.08 : 0) + (inp.bow || 0);
      s.jaw.t = talk * 0.85 + (st.sleepy ? 0 : 0.02); s.flutter.t = 0.5 * Math.sin(clock * 1.1) + 0.3 * Math.sin(clock * 2.3 + 0.7);
      if (clock >= blinkAt) { s.lid.t = 1; blinkEnd = clock + (st.sleepy ? 0.28 : 0.11); blinkAt = clock + (2 + rnd() * 4.5) / (st.blink || 1); }
      if (s.lid.t === 1 && clock >= blinkEnd) s.lid.t = st.sleepy ? 0.35 : 0;
      s.roll.step(dt); s.yaw.step(dt); s.pitch.step(dt); s.jaw.step(dt); s.lid.step(dt); s.sway.step(dt); s.bow.step(dt); s.flutter.step(dt);
      s.beard.t = 0.05 * Math.sin(clock * 1.3) * k; s.beard.v -= (s.roll.v - prev.roll) * 6 + (s.sway.v - prev.sway) * 5; s.beard.v += (s.jaw.v - prev.jaw) * 0.12 * (rnd() - 0.5);
      s.malaL.v -= (s.sway.v - prev.sway) * 12; s.malaR.v -= (s.sway.v - prev.sway) * 12; s.loop.v -= (s.sway.v - prev.sway) * 9; s.tassel.v -= (s.sway.v - prev.sway) * 14;
      s.malaL.t = s.malaR.t = s.loop.t = s.tassel.t = 0;
      ['beard', 'malaL', 'malaR', 'loop', 'tassel'].forEach(function (n) { s[n].step(dt); s[n].x = clamp(s[n].x, -1.6, 1.6); });
      prev.roll = s.roll.v; prev.sway = s.sway.v; prev.jaw = s.jaw.v;
      if (phase !== lastPhase) { if (phase === 'blessing') spawn(14, PX, 330, 120, 160); lastPhase = phase; }
      if (phase === 'flowers' || phase === 'blessing') { emitAcc += dt * (phase === 'flowers' ? 5 : 2); while (emitAcc >= 1) { emitAcc -= 1; spawn(1, PX + (rnd() - 0.5) * 60, 330, 40, 140); } }
      updatePetals(dt);
    }
    function impulse(kind) {
      var sign = rnd() < 0.5 ? -1 : 1;
      if (kind === 'face') { s.roll.v += sign * (2 + rnd()); s.yaw.v += sign * 1.2; s.jaw.v += 6; s.lid.x = 0.6; spawn(6, PX, 260, 80, 120); }
      else if (kind === 'beard') { s.beard.v += sign * 16; s.roll.v += sign * 0.8; }
      else if (kind === 'mala') { s.malaL.v += sign * 14; s.malaR.v -= sign * 12; s.loop.v += sign * 10; s.tassel.v += sign * 16; }
      else if (kind === 'hands') { s.bow.v += 2.2; spawn(8, PX, 340, 60, 150); }
      else { s.sway.v += sign * 2.4; s.flutter.v += sign * 4; }
    }
    function displace(x, y, out) {
      var wt = Math.pow(clamp((720 - y) / 470, 0, 1), 1.25), dx = s.sway.x * 9 * wt + s.flutter.x * 3 * (gs(x, 290, 35) + gs(x, 470, 35)) * sm(480, 780, y), dy = 0;
      dy -= s.breath * 2.2 * sm(255, 330, y) * (1 - sm(560, 700, y)); dy += s.bow.x * 14 * wt;
      var hw = (1 - sm(235, 300, y)) * (1 - sm(125, 195, Math.abs(x - PX)) * sm(205, 255, y));
      if (hw > 0) {
        var rx = x - PX, ry = y - PY, c = Math.cos(s.roll.x), sn = Math.sin(s.roll.x), face = gs(x, 392, 80) * gs(y, 175, 100);
        dx += hw * (rx * (c - 1) - ry * sn + s.yaw.x * 10 * face); dy += hw * (rx * sn + ry * (c - 1) + s.pitch.x * 6 + s.pitch.x * (y - PY) * 0.03);
      }
      var cx = 1 - sm(40, 85, Math.abs(x - 388));
      dy += s.jaw.x * 9 * sm(212, 226, y) * (1 - sm(240, 300, y)) * cx;
      dy += (155 - y) * s.lid.x * 0.92 * Math.max(gs(x, 362, 32), gs(x, 425, 32)) * gs(y, 155, 10);
      dx += s.beard.x * 9 * sm(222, 296, y) * (1 - sm(296, 312, y)) * cx;
      var ms = sm(268, 290, y) * (1 - sm(470, 500, y)) * clamp((y - 268) / 210, 0, 1);
      dx += s.malaL.x * 7 * gs(x, 335, 16) * ms + s.malaR.x * 7 * gs(x, 430, 14) * ms;
      dx += s.loop.x * 8 * gs(x, 395, 70) * sm(470, 520, y) * (1 - sm(570, 600, y)) * clamp((y - 470) / 120, 0, 1);
      dx += s.tassel.x * 10 * gs(x, 343, 14) * sm(535, 550, y) * (1 - sm(588, 600, y)) * clamp((y - 540) / 45, 0, 1);
      out[0] = dx; out[1] = dy; return out;
    }
    function mouth() { return { x: 386, y: 216, open: clamp(s.jaw.x, 0, 1) }; }
    return { update: update, displace: displace, impulse: impulse, mouth: mouth, spawn: spawn, petals: petals, state: s };
  };
})(window);
