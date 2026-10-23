// music/carousel.js - 3D album carousel with a real flick: the albums follow your finger, keep their momentum
// when you let go, and settle on the nearest album. Tap a side album to bring it forward, tap the centre album
// to play or pause, press and hold it to switch shuffle. Arrow keys and a sideways trackpad scroll also work.
import { coverOf, spineStyle, esc } from './shelf-core.mjs';

const STEP = 118;      /* pixels of drag that move the carousel by one album */
const HOLD_MS = 520;   /* press and hold on the centre album */

export function mountCarousel(root, { onChange, onActivate, onHold }) {
  let items = [], idx = 0, playing = false, cards = [];
  root.innerHTML = '<div class="mc-track"></div><div class="mu-arm" aria-hidden="true"></div>';
  const track = root.firstChild;

  function build() {
    track.innerHTML = items.map((r, i) => {
      const s = spineStyle(r), art = coverOf(r);
      return '<button type="button" class="mc-card" data-i="' + i + '" aria-label="' + esc(r.title) + '" style="--a:' + s.from + ';--b:' + s.to + '">'
        + '<span class="mc-disc" style="--cover:url(\'' + art + '\')"></span><span class="mc-art' + (r.art ? ' sq' : '') + '" style="--img:url(\'' + art + '\')"></span><span class="mc-gloss"></span></button>';
    }).join('');
    cards = [...track.children]; layout(0);
  }
  /* frac: a fractional offset in albums while a finger is dragging (0 when settled). */
  function layout(frac) {
    cards.forEach((c, i) => {
      const d = i - idx - frac, a = Math.abs(d), vis = a <= 3.2, side = Math.max(-1, Math.min(1, d));
      c.style.transform = 'translateX(' + (d * 62) + '%) translateZ(' + (-Math.min(a, 3) * 130) + 'px) rotateY(' + (-side * 46) + 'deg) scale(' + (1 - Math.min(a, 3) * 0.05) + ')';
      c.style.zIndex = String(10 - Math.round(a)); c.style.opacity = vis ? String(Math.max(0, 1 - a * 0.2)) : '0'; c.style.pointerEvents = vis ? 'auto' : 'none';
      const on = i === idx;
      c.classList.toggle('on', on); c.classList.toggle('spin', on && playing); c.tabIndex = on ? 0 : -1;
      c.setAttribute('aria-current', on ? 'true' : 'false');
    });
  }
  function select(i, silent) {
    const n = Math.max(0, Math.min(items.length - 1, i));
    if (n === idx && cards.length) { layout(0); return; }
    idx = n; layout(0); if (!silent && onChange) onChange(items[idx], idx);
  }

  /* ---- finger / mouse: follow, then glide ---- */
  let g = null;
  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    g = { x: e.clientX, id: e.pointerId, moved: false, held: false, samples: [{ x: e.clientX, t: performance.now() }], timer: 0, card: e.target.closest('.mc-card') };
    if (g.card && Number(g.card.dataset.i) === idx && onHold) g.timer = setTimeout(() => { if (g && !g.moved) { g.held = true; try { navigator.vibrate && navigator.vibrate(18); } catch (x) { /* no haptics */ } onHold(items[idx], idx); } }, HOLD_MS);
  });
  root.addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x;
    if (!g.moved && Math.abs(dx) > 8) { g.moved = true; clearTimeout(g.timer); root.classList.add('drag'); try { root.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } }
    if (!g.moved) return;
    const now = performance.now(); g.samples.push({ x: e.clientX, t: now }); while (g.samples.length > 2 && now - g.samples[0].t > 90) g.samples.shift();
    /* resist at the two ends so it feels like a physical shelf */
    let frac = -dx / STEP; const lo = -idx, hi = items.length - 1 - idx;
    if (frac < lo) frac = lo + (frac - lo) * 0.3; else if (frac > hi) frac = hi + (frac - hi) * 0.3;
    layout(frac);
  });
  function release(e) {
    if (!g || (e && e.pointerId !== g.id)) return;
    const cur = g; g = null; clearTimeout(cur.timer); root.classList.remove('drag');
    if (cur.held) return;
    if (!cur.moved) {
      if (!cur.card) return;
      const i = Number(cur.card.dataset.i);
      if (i === idx) { if (onActivate) onActivate(items[idx], idx); } else select(i);
      return;
    }
    const s = cur.samples, a = s[0], b = s[s.length - 1], v = b.t > a.t ? (b.x - a.x) / (b.t - a.t) : 0; /* px per ms */
    const dx = (e ? e.clientX : b.x) - cur.x;
    const travel = -(dx + v * 220) / STEP;                     /* where the albums would glide to */
    select(idx + Math.round(Math.max(-6, Math.min(6, travel))));
    layout(0);
  }
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);
  root.addEventListener('contextmenu', (e) => { if (g && g.held) e.preventDefault(); });

  /* ---- trackpad sideways scroll ---- */
  let wheelAt = 0;
  root.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) || Math.abs(e.deltaX) < 12) return;
    e.preventDefault();
    const now = performance.now(); if (now - wheelAt < 260) return; wheelAt = now;
    select(idx + (e.deltaX > 0 ? 1 : -1));
  }, { passive: false });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { select(idx - 1); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { select(idx + 1); e.preventDefault(); }
    else if ((e.key === 'Enter' || e.key === ' ') && onActivate && items[idx]) { onActivate(items[idx], idx); e.preventDefault(); }
  });

  return {
    setItems(list, startId) { items = list; idx = Math.max(0, list.findIndex((r) => r.id === startId)); build(); },
    select, get index() { return idx; },
    setPlaying(p) { playing = !!p; layout(0); },
    focus() { root.focus(); },
  };
}
