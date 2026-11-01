// SECTION 04 — the eye wall. Square tiles fill the screen (columns adapt to the width, every tile
// stays square); each holds a flat eye from js/eye-tiles.js. Pupils move by CSS (eight look paths,
// varied durations and offsets), so there is no per-eye script loop. One small controller adds the
// occasional glance toward the pointer. Off screen, every animation is paused.
// Scroll: the wall is sticky; scrolling shatters it (GSAP, scrubbed), then SECTION 05's ivory panel
// scrolls up over the empty dark and its headline rises word by word.
import { tile, tileMarkup } from './eye-tiles.js';

const section = document.querySelector('.eyes');
if (section) init();

function init() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stick = section.querySelector('.eyes-stick');
  const grid = section.querySelector('.eyes-grid');
  const cover = section.querySelector('.eyes-cover');

  /* ---------- Build: enough square tiles to cover the screen, plus the rows the drift reveals ---------- */
  let cols = 0, rows = 0, tiles = [];
  const build = () => {
    const w = stick.clientWidth || window.innerWidth, h = stick.clientHeight || window.innerHeight;
    const target = w <= 760 ? 96 : Math.min(170, Math.max(120, w / 12));
    const c = Math.max(4, Math.round(w / target));
    const r = Math.ceil((h * 1.3) / (w / c)) + 1;
    if (c === cols && r <= rows) return;
    cols = c; rows = r;
    const taken = [];
    grid.style.setProperty('--cols', cols);
    grid.innerHTML = Array.from({ length: cols * rows }, (_, i) => tileMarkup(tile(i, cols, taken))).join('');
    tiles = [...grid.children];
  };
  build();
  let resizeT = 0;
  addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { const before = tiles; build(); if (tiles !== before) makeShatter?.(); }, 200); }, { passive: true });
  let makeShatter = null;

  /* ---------- Pause everything off screen ---------- */
  let visible = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; section.classList.toggle('is-off', !visible); }).observe(stick);
  } else visible = true;

  /* ---------- The occasional glance toward the pointer: a few eyes at a time, never all ---------- */
  if (!reduce) {
    let pending = false, px = 0, py = 0, bucket = -1;
    const glance = () => {
      pending = false;
      const now = performance.now(), b = Math.floor(now / 350);
      if (b === bucket || !visible) return;
      bucket = b;
      tiles.forEach((t, i) => {
        if (t.classList.contains('is-aim')) return;
        const h = ((i * 2654435761 + b * 40503) >>> 0) % 1000;   // deterministic: ~7% of eyes per beat
        if (h > 70) return;
        const r = t.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1;
        t.style.setProperty('--ax', `${(dx / d * 16).toFixed(1)}%`);
        t.style.setProperty('--ay', `${(dy / d * 16).toFixed(1)}%`);
        t.classList.add('is-aim');
        setTimeout(() => { t.classList.remove('is-aim'); t.style.removeProperty('--ax'); t.style.removeProperty('--ay'); }, 1200 + (h * 13) % 900);
      });
    };
    stick.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; if (!pending) { pending = true; requestAnimationFrame(glance); } }, { passive: true });
  }

  /* ---------- SECTION 05's headline: word by word ---------- */
  const title = cover.querySelector('.eyes-title');
  title.innerHTML = title.textContent.trim().split(/\s+/).map((w, i) => `<span class="ew"><span style="--i:${i}">${w}</span></span>`).join(' ');

  /* ---------- Scroll: the wall shatters, then Section 05's panel rises in ----------
     While the wall is stuck under the nav, scrolling first cracks it (the tiles pull apart, black
     seams open between them), then breaks it: tiles fly outward from the centre, spinning and
     falling, the nearest first, like glass. The ivory panel rises over the last of them.
     Every tile's flight is fixed by its index (deterministic), and the whole thing is scrubbed:
     scroll back and the wall reassembles. */
  const gsap = window.gsap, ST = window.ScrollTrigger;
  const navH = () => document.querySelector('.nav')?.offsetHeight || 0;
  if (gsap && ST && !reduce) {
    gsap.registerPlugin(ST);
    let tl = null;
    makeShatter = () => {
      if (tl) { tl.scrollTrigger?.kill(); tl.kill(); gsap.set(tiles, { clearProps: 'transform,opacity' }); }
      const W = stick.clientWidth || window.innerWidth, H = stick.clientHeight || window.innerHeight;
      const size = W / cols, cx = W / 2, cy = H * 0.45;
      const far = Math.hypot(W / 2, H * 0.6);
      tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section, start: () => `top ${navH()}`,
          end: () => `+=${Math.round((stick.clientHeight || window.innerHeight) * 0.9)}`,
          scrub: 0.7, invalidateOnRefresh: true,
        },
      });
      tiles.forEach((t, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const x = (col + 0.5) * size, y = (row + 0.5) * size;
        const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1;
        const h1 = ((i * 2654435761) >>> 0) / 4294967296, h2 = ((i * 40503 + 7) % 997) / 997, h3 = ((i * 69069 + 3) % 991) / 991;
        const start = 0.18 + (d / far) * 0.32 + h1 * 0.08;                       // the centre breaks first
        // Crack: each tile shrinks a little and twists, opening seams across the wall.
        tl.to(t, { scale: 0.9, rotation: (h2 - 0.5) * 8, x: dx / d * 6, y: dy / d * 6, duration: 0.16, ease: 'power1.out' }, h1 * 0.06);
        // Break: out from the centre, spinning, falling under gravity, fading.
        tl.to(t, {
          x: dx / d * (size * (2.2 + h2 * 3)), y: dy / d * (size * (1.6 + h3 * 2)) + H * (0.55 + h1 * 0.5),
          rotation: (h2 - 0.5) * 540, scale: 0.35 + h3 * 0.35, opacity: 0,
          duration: 0.42, ease: 'power2.in',
        }, start);
      });
      tl.to({}, { duration: 0.06 });                                              // a beat of empty dark
    };
    gsap.set(grid, { yPercent: 0 });
    makeShatter();
    ST.create({ trigger: cover, start: 'top 55%', onEnter: () => cover.classList.add('is-in'), onLeaveBack: () => cover.classList.remove('is-in') });
  } else if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { if (en.isIntersecting) cover.classList.add('is-in'); }, { threshold: 0.3 }).observe(cover);
  } else cover.classList.add('is-in');
}
