// music/viz.js - the visualiser and the drifting lamp-light dust.
// YouTube's player does not let a page read its audio, so the motion is SYNTHESISED: a steady beat and moving bands that
// follow play and pause and take the colours of the current album. It is a light show, not a waveform.
const reduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountViz(canvas) {
  const ctx = canvas.getContext('2d');
  const st = { mode: 'bars', playing: false, energy: 0.16, seed: 1, c1: '#d9b469', c2: '#fff0c2', visible: true, w: 0, h: 0, dpr: 1, peaks: new Float32Array(64), raf: 0 };
  function size() { st.dpr = Math.min(2, window.devicePixelRatio || 1); st.w = canvas.clientWidth; st.h = canvas.clientHeight; canvas.width = Math.max(1, st.w * st.dpr); canvas.height = Math.max(1, st.h * st.dpr); ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0); }
  new ResizeObserver(size).observe(canvas); size();
  new IntersectionObserver((e) => { st.visible = e[0].isIntersecting; kick(); }).observe(canvas);

  const bpm = () => 92 + (st.seed % 36);
  const beat = (t) => Math.pow(Math.max(0, Math.sin(Math.PI * t * bpm() / 60)), 7);
  const band = (i, n, t) => { const e = 1 - (i / n) * 0.5; return Math.min(1, e * (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * (1.1 + i * 0.41) + i * 1.9 + st.seed)))) ; };
  const grad = (y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, st.c2); g.addColorStop(1, st.c1); return g; };

  function bars(t, b) {
    const n = Math.max(24, Math.min(64, Math.floor(st.w / 12))), gap = 3, bw = (st.w - gap * (n - 1)) / n, base = st.h * 0.72;
    ctx.fillStyle = grad(0, base);
    for (let i = 0; i < n; i++) {
      const v = band(i, n, t) * (0.5 + 0.5 * b) * st.energy, h = Math.max(3, v * base * 0.95), x = i * (bw + gap);
      st.peaks[i] = Math.max(h, st.peaks[i] - 0.9);
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.roundRect(x, base - h, bw, h, bw / 2); ctx.fill();
      ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.roundRect(x, base + 2, bw, h * 0.45, bw / 2); ctx.fill();
      ctx.globalAlpha = 0.9; ctx.fillStyle = st.c2; ctx.fillRect(x, base - st.peaks[i] - 4, bw, 2); ctx.fillStyle = grad(0, base);
    }
    ctx.globalAlpha = 1;
  }
  function wave(t, b) {
    const mid = st.h / 2;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      for (let x = 0; x <= st.w; x += 4) {
        const p = x / st.w, env = Math.sin(Math.PI * p), a = st.energy * (st.h * 0.34) * (0.45 + 0.55 * b) * env;
        const y = mid + Math.sin(p * (6 + k * 2.3) + t * (1.6 + k * 0.7) + st.seed * k) * a + Math.sin(p * 17 - t * 2.4) * a * 0.18;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineWidth = 3 - k * 0.6; ctx.strokeStyle = k === 1 ? st.c2 : st.c1; ctx.globalAlpha = 1 - k * 0.28; ctx.shadowColor = st.c1; ctx.shadowBlur = 14; ctx.stroke();
    }
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
  function ridge(t, b) {
    const g = ctx.createRadialGradient(st.w * 0.7, st.h * 0.42, 4, st.w * 0.7, st.h * 0.42, st.h * (0.5 + 0.35 * st.energy * (0.6 + b * 0.4)));
    g.addColorStop(0, st.c2); g.addColorStop(0.35, st.c1 + '99'); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(0, 0, st.w, st.h);
    ctx.fillStyle = st.c2;
    for (let i = 0; i < 26; i++) { const x = (i * 97.3 + st.seed * 13) % st.w, y = (i * 53.1) % (st.h * 0.5), tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.9 + i)); ctx.globalAlpha = tw * 0.8; ctx.fillRect(x, y, 1.6, 1.6); }
    ctx.globalAlpha = 1;
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath(); ctx.moveTo(0, st.h);
      for (let x = 0; x <= st.w; x += 6) {
        const p = x / st.w, h = st.h * (0.34 + layer * 0.12) + Math.sin(p * (5 + layer * 2) + st.seed + layer) * st.h * 0.1 + Math.sin(p * 13 + layer * 3) * st.h * 0.04 - st.energy * b * st.h * 0.025 * (3 - layer);
        ctx.lineTo(x, st.h - h);
      }
      ctx.lineTo(st.w, st.h); ctx.closePath();
      ctx.fillStyle = ['#2a1a2e', '#1c1220', '#120b16'][layer]; ctx.fill();
      ctx.strokeStyle = st.c1; ctx.globalAlpha = 0.35 - layer * 0.08; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
    }
  }
  const modes = { bars, wave, ridge };

  function frame(now) {
    st.raf = 0;
    const t = now / 1000;
    st.energy += ((st.playing ? 1 : 0.16) - st.energy) * 0.06;
    ctx.clearRect(0, 0, st.w, st.h);
    (modes[st.mode] || bars)(t, beat(t));
    if (st.visible && !document.hidden && !reduce() && (st.playing || st.energy > 0.165 || st.mode === 'ridge')) st.raf = requestAnimationFrame(frame);
  }
  function kick() { if (!st.raf && st.visible) st.raf = requestAnimationFrame(frame); }
  document.addEventListener('visibilitychange', kick);
  kick();
  return {
    setMode(m) { if (modes[m]) { st.mode = m; kick(); } },
    setPlaying(p) { st.playing = !!p; kick(); },
    setPalette(c1, c2, seed) { st.c1 = c1; st.c2 = c2; st.seed = seed || 1; kick(); },
    get mode() { return st.mode; },
  };
}

/* Warm motes drifting in lamp light behind the stage. Quicker while music plays. */
export function mountDust(canvas) {
  const ctx = canvas.getContext('2d'); let w = 0, h = 0, speed = 0.3, raf = 0, visible = true;
  const motes = Array.from({ length: 46 }, (_, i) => ({ x: (i * 211) % 1000 / 1000, y: (i * 137) % 1000 / 1000, r: 0.6 + (i % 5) * 0.45, s: 0.2 + (i % 7) * 0.09, p: i }));
  function size() { const d = Math.min(2, window.devicePixelRatio || 1); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
  new ResizeObserver(size).observe(canvas); size();
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; kick(); }).observe(canvas);
  function frame(now) {
    raf = 0; ctx.clearRect(0, 0, w, h);
    for (const m of motes) {
      m.y -= m.s * speed * 0.0009 * 16; if (m.y < -0.02) m.y = 1.02;
      const x = (m.x + Math.sin(now / 2600 + m.p) * 0.012) * w, y = m.y * h, a = 0.25 + 0.35 * Math.abs(Math.sin(now / 1800 + m.p));
      ctx.beginPath(); ctx.fillStyle = 'rgba(255,226,160,' + a.toFixed(2) + ')'; ctx.shadowColor = 'rgba(255,200,110,.8)'; ctx.shadowBlur = 8; ctx.arc(x, y, m.r, 0, 6.283); ctx.fill();
    }
    if (visible && !document.hidden && !reduce()) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }
  document.addEventListener('visibilitychange', kick); kick();
  return { setPlaying(p) { speed = p ? 1.6 : 0.3; } };
}
