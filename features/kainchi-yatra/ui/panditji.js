/* Panditji's living portrait. The AI-created photo is a deformable mesh moved by panditji-physics.js: breathing, blinking, head turns,
   swaying beard and mala, speech-driven jaw. WebGL when the device has it; the plain photo otherwise. No video, no network, no lip-sync claim. */
(function (root) {
  'use strict';
  var W = 768, H = 802, SRC = '../features/kainchi-yatra/ui/art/digital-panditji.webp';
  var XS = [0, 100, 200, 262, 300, 330, 350, 362, 375, 388, 402, 416, 430, 445, 470, 500, 560, 650, 768];
  var YS = [0, 40, 80, 120, 140, 148, 155, 162, 170, 185, 205, 213, 220, 232, 250, 270, 290, 310, 350, 400, 450, 500, 560, 620, 700, 802];
  var VS = 'attribute vec2 p;attribute vec2 u;varying vec2 v;void main(){v=u;gl_Position=vec4(p.x/768.0*2.0-1.0,1.0-p.y/802.0*2.0,0.0,1.0);}';
  var FS = 'precision mediump float;varying vec2 v;uniform sampler2D t;void main(){gl_FragColor=texture2D(t,v);}';
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function shader(gl, type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
  function region(x, y) {
    if (y < 215 && Math.abs(x - 390) < 135) return 'face';
    if (y <= 300 && Math.abs(x - 388) < 80) return 'beard';
    if (y > 270 && y < 445 && (Math.abs(x - 335) < 20 || Math.abs(x - 430) < 18)) return 'mala';
    if (y > 305 && y < 495 && x > 330 && x < 450) return 'hands';
    if (y >= 495 && y < 605 && x > 325 && x < 465) return 'mala';
    return 'body';
  }
  function mesh(gl, prog) {
    var nx = XS.length, ny = YS.length, rest = new Float32Array(nx * ny * 2), uv = new Float32Array(nx * ny * 2), idx = [], i, j, k = 0;
    for (j = 0; j < ny; j += 1) for (i = 0; i < nx; i += 1) { rest[k] = XS[i]; rest[k + 1] = YS[j]; uv[k] = XS[i] / W; uv[k + 1] = YS[j] / H; k += 2; }
    for (j = 0; j < ny - 1; j += 1) for (i = 0; i < nx - 1; i += 1) { k = j * nx + i; idx.push(k, k + 1, k + nx, k + 1, k + nx + 1, k + nx); }
    var pos = new Float32Array(rest), pb = gl.createBuffer(), ub = gl.createBuffer(), ib = gl.createBuffer(), loc;
    gl.bindBuffer(gl.ARRAY_BUFFER, ub); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW); loc = gl.getAttribLocation(prog, 'u'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, pb); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW); loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    return { rest: rest, pos: pos, buffer: pb, count: idx.length };
  }
  function initGL(canvas, img) {
    var gl = canvas.getContext && canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return null;
    var vs = shader(gl, gl.VERTEX_SHADER, VS), fs = shader(gl, gl.FRAGMENT_SHADER, FS), prog = gl.createProgram(), tex = gl.createTexture();
    if (!vs || !fs) return null;
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog); gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    var m = mesh(gl, prog); gl.clearColor(0, 0, 0, 0);
    return { gl: gl, m: m };
  }
  root.RWKainchiUI.panditji = function () {
    var fig = document.createElement('div'), img = document.createElement('img'), rig = root.RWKainchiUI.panditRig(), api, tmp = [0, 0];
    var view = null, fx = null, fxc = null, canvas = null, running = false, raf = 0, last = 0, seen = false, ptr = { x: 0, y: 0, at: -1e9, down: false };
    fig.className = 'pandit-figure'; fig.setAttribute('data-mode', 'static'); img.className = 'pandit-photo'; img.src = SRC; img.alt = ''; img.width = W; img.height = H;
    img.loading = 'lazy'; img.decoding = 'async'; fig.appendChild(img);
    function reduced() { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) || document.body.classList.contains('motion-paused'); }
    function fit() {
      var d = Math.min(2, root.devicePixelRatio || 1), w = Math.max(2, Math.round(fig.clientWidth * d)), h = Math.round(w * H / W);
      if (canvas.width !== w) { canvas.width = w; canvas.height = h; fxc.width = w; fxc.height = h; view.gl.viewport(0, 0, w, h); }
      return w / W;
    }
    function drawFx(k) {
      var m = rig.mouth(), i, p;
      fx.clearRect(0, 0, fxc.width, fxc.height);
      if (m.open > 0.06) {
        rig.displace(m.x, 218, tmp); fx.fillStyle = 'rgba(58,18,24,.92)'; fx.beginPath();
        fx.ellipse(m.x * k, (214.5 + tmp[1] * 0.5 + m.open * 2) * k, (12 + 6 * m.open) * k, (0.6 + 4.8 * m.open) * k, 0, 0, 6.2832); fx.fill();
      }
      for (i = 0; i < rig.petals.length; i += 1) {
        p = rig.petals[i]; fx.save(); fx.translate(p.x * k, p.y * k); fx.rotate(p.r); fx.globalAlpha = Math.min(1, p.age * 2.5, (p.life - p.age) * 1.2);
        fx.fillStyle = p.c; fx.beginPath(); fx.ellipse(0, 0, p.sz * k, p.sz * 0.55 * k, 0, 0, 6.2832); fx.fill(); fx.restore();
      }
    }
    function render() {
      var gl = view.gl, m = view.m, k = fit(), i;
      for (i = 0; i < m.rest.length; i += 2) { rig.displace(m.rest[i], m.rest[i + 1], tmp); m.pos[i] = m.rest[i] + tmp[0]; m.pos[i + 1] = m.rest[i + 1] + tmp[1]; }
      gl.clear(gl.COLOR_BUFFER_BIT); gl.bindBuffer(gl.ARRAY_BUFFER, m.buffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, m.pos);
      gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_SHORT, 0); drawFx(k);
    }
    function frame(ts) {
      if (!running) return;
      raf = root.requestAnimationFrame(frame);
      if (reduced() || document.hidden) { last = ts; return; }
      var dt = Math.min(0.05, (ts - last) / 1000), r = fig.getBoundingClientRect(), scene = fig.parentNode, now = root.performance.now();
      last = ts;
      rig.update(dt, {
        gx: clamp((ptr.x - (r.left + r.width / 2)) / (root.innerWidth / 2), -1, 1), gy: clamp((ptr.y - (r.top + r.height / 4)) / (root.innerHeight / 2), -1, 1),
        attn: ptr.down ? 1 : clamp(1 - (now - ptr.at) / 4000, 0, 1), speaking: (!!scene && scene.classList.contains('ritual-speaking')) || now < api.talkUntil,
        running: !!scene && scene.classList.contains('ritual-running'), phase: scene ? scene.getAttribute('data-phase') : '', style: api.style, bow: api.bow
      });
      render();
    }
    function onMove(e) { ptr.x = e.clientX; ptr.y = e.clientY; ptr.at = root.performance.now(); }
    function run(on) {
      if (on === running || !view) return;
      running = on;
      if (on) { last = root.performance.now(); raf = root.requestAnimationFrame(frame); document.addEventListener('pointermove', onMove, { passive: true }); }
      else { root.cancelAnimationFrame(raf); document.removeEventListener('pointermove', onMove); }
    }
    function setup() {
      if (view || !img.naturalWidth || root.RWKainchiUI.panditjiNoGL) return;
      canvas = document.createElement('canvas'); canvas.className = 'pandit-gl'; view = initGL(canvas, img);
      if (!view) { view = null; return; }
      fxc = document.createElement('canvas'); fxc.className = 'pandit-fx'; fx = fxc.getContext('2d');
      canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); run(false); fig.setAttribute('data-mode', 'static'); }, false);
      fig.appendChild(canvas); fig.appendChild(fxc); fig.setAttribute('data-mode', 'live'); render(); run(seen);
    }
    function poke(kind) {
      rig.impulse(kind); fig.classList.add('pandit-poked'); root.setTimeout(function () { fig.classList.remove('pandit-poked'); }, 650);
      fig.dispatchEvent(new root.CustomEvent('panditpoke', { detail: { region: kind } }));
    }
    fig.addEventListener('pointerdown', function (e) {
      var r = fig.getBoundingClientRect(); ptr.down = true; ptr.x = e.clientX; ptr.y = e.clientY; ptr.at = root.performance.now();
      root.setTimeout(function () { ptr.down = false; }, 900); poke(region((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H));
    });
    img.addEventListener('load', setup);
    if (root.IntersectionObserver) {
      new root.IntersectionObserver(function (entries) { seen = entries[entries.length - 1].isIntersecting; if (seen && img.complete) setup(); run(seen && !!view); }, { rootMargin: '120px' }).observe(fig);
    } else { seen = true; if (img.complete) setup(); }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) last = root.performance.now(); });
    api = { rig: rig, poke: poke, style: { sway: 1, breath: 1, blink: 1, sleepy: 0 }, bow: 0, talkUntil: 0, region: region };
    fig.panditji = api;
    return fig;
  };
})(window);
