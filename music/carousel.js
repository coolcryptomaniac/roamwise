// music/carousel.js - 3D album carousel: drag, swipe, arrow keys, click a side album to bring it forward.
// The centre album shows a vinyl record sliding out of its sleeve; it spins while music plays.
import { coverOf, spineStyle } from './shelf-core.mjs';

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function mountCarousel(root, { onChange, onActivate }) {
  let items = [], idx = 0, playing = false, cards = [];
  root.innerHTML = '<div class="mc-track"></div><div class="mu-arm" aria-hidden="true"></div>';
  const track = root.firstChild;

  function build() {
    track.innerHTML = items.map((r, i) => {
      const s = spineStyle(r);
      return '<button type="button" class="mc-card" data-i="' + i + '" aria-label="' + esc(r.title) + '" style="--a:' + s.from + ';--b:' + s.to + '">'
        + '<span class="mc-disc" style="--cover:url(\'' + coverOf(r) + '\')"></span><span class="mc-art' + (r.art ? ' sq' : '') + '" style="--img:url(\'' + coverOf(r) + '\')"></span><span class="mc-gloss"></span></button>';
    }).join('');
    cards = [...track.children]; layout();
  }
  function layout() {
    cards.forEach((c, i) => {
      const d = i - idx, a = Math.abs(d), vis = a <= 3;
      c.style.transform = 'translateX(' + (d * 62) + '%) translateZ(' + (-a * 130) + 'px) rotateY(' + (-Math.sign(d) * Math.min(a, 1) * 46) + 'deg) scale(' + (1 - Math.min(a, 3) * 0.05) + ')';
      c.style.zIndex = 10 - a; c.style.opacity = vis ? 1 - a * 0.2 : 0; c.style.pointerEvents = vis ? 'auto' : 'none';
      c.classList.toggle('on', d === 0); c.classList.toggle('spin', d === 0 && playing); c.tabIndex = d === 0 ? 0 : -1;
      c.setAttribute('aria-current', d === 0 ? 'true' : 'false');
    });
  }
  function select(i, silent) {
    const n = Math.max(0, Math.min(items.length - 1, i));
    if (n === idx && cards.length) { layout(); return; }
    idx = n; layout(); if (!silent && onChange) onChange(items[idx], idx);
  }

  let down = null;
  root.addEventListener('pointerdown', (e) => { down = { x: e.clientX, t: performance.now(), moved: false }; });
  root.addEventListener('pointermove', (e) => { if (down && Math.abs(e.clientX - down.x) > 8) down.moved = true; });
  root.addEventListener('pointerup', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x, moved = down.moved; down = null;
    if (moved && Math.abs(dx) > 36) { select(idx + (dx < 0 ? 1 : -1)); return; }
    if (moved) return;
    const c = e.target.closest('.mc-card'); if (!c) return;
    const i = Number(c.dataset.i);
    if (i === idx) { if (onActivate) onActivate(items[idx], idx); } else select(i);
  });
  root.addEventListener('pointercancel', () => { down = null; });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { select(idx - 1); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { select(idx + 1); e.preventDefault(); }
    else if ((e.key === 'Enter' || e.key === ' ') && onActivate && items[idx]) { onActivate(items[idx], idx); e.preventDefault(); }
  });

  return {
    setItems(list, startId) { items = list; idx = Math.max(0, list.findIndex((r) => r.id === startId)); build(); },
    select, get index() { return idx; },
    setPlaying(p) { playing = !!p; layout(); },
    focus() { root.focus(); },
  };
}
