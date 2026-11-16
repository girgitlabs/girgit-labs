// SECTION 04 — the eye wall. Square tiles fill the screen (columns adapt to the width, every tile
// stays square); each holds a flat eye from js/eye-tiles.js. Pupils move by CSS (eight look paths,
// varied durations and offsets), so there is no per-eye script loop. One small controller adds the
// occasional glance toward the pointer. Off screen, every animation is paused.
// Scroll: the wall is sticky; scrolling shatters it (a GSAP timeline, driven by the section's live
// position on screen), then SECTION 05's ivory panel rises over it and its headline rises word by word.
import { tile, tileMarkup } from './eye-tiles.js?v=3.1.0';

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
    tiles.forEach((t, i) => t.style.setProperty('--rowf', (Math.floor(i / cols) / rows).toFixed(3)));
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

  /* ---------- Depth: the rows flip up as the wall arrives; the wall leans toward the pointer ---------- */
  let inRaf = 0, inLast = '';
  const arrive = () => {
    inRaf = 0;
    const vh = window.innerHeight, nav = document.querySelector('.nav')?.offsetHeight || 0;
    const top = section.getBoundingClientRect().top;
    if (top > vh * 1.2 || top < -vh) return;                                  // far away: nothing to do
    const v = Math.min(1, Math.max(0, (vh - top) / Math.max(1, vh - nav))).toFixed(2);
    if (v !== inLast) { inLast = v; grid.style.setProperty('--in', v); }
  };
  if (!reduce) {
    addEventListener('scroll', () => { if (!inRaf) inRaf = requestAnimationFrame(arrive); }, { passive: true }); arrive();
    stick.addEventListener('pointermove', (e) => {
      const r = stick.getBoundingClientRect();
      grid.style.setProperty('--ty', `${(((e.clientX - r.left) / r.width - 0.5) * 7).toFixed(2)}deg`);
      grid.style.setProperty('--tx', `${(-((e.clientY - r.top) / r.height - 0.5) * 5).toFixed(2)}deg`);
    }, { passive: true });
    stick.addEventListener('pointerleave', () => { grid.style.removeProperty('--tx'); grid.style.removeProperty('--ty'); });
  } else grid.style.setProperty('--in', '1');

  /* ---------- Click an eye: it flips over and comes back as a different one (a chameleon changing) ---------- */
  let flips = 0, progress = 0;
  grid.addEventListener('click', (e) => {
    const t = e.target.closest('.eye');
    if (!t || t.classList.contains('is-flip') || progress > 0.03) return;
    const fresh = document.createElement('div');
    fresh.innerHTML = tileMarkup(tile(1000 + Math.floor(Math.random() * 100000), cols, []));
    const n = fresh.firstElementChild;
    t.classList.add('is-flip');
    setTimeout(() => {
      for (const prop of [...n.style]) t.style.setProperty(prop, n.style.getPropertyValue(prop));
      t.className = `${n.className} is-flip`;
      t.innerHTML = n.innerHTML;
    }, 260);
    setTimeout(() => t.classList.remove('is-flip'), 540);
    flips += 1;
    if (flips === 10) document.dispatchEvent(new CustomEvent('girgit:toast', { detail: 'Ten eyes changed. Now you know how Girgit feels.' }));
  });

  /* ---------- SECTION 05's headline: word by word ---------- */
  const title = cover.querySelector('.eyes-title');
  const sub = cover.querySelector('.eyes-sub');
  const gsapReady = window.gsap && window.ScrollTrigger && !reduce;
  let centre = null;
  if (gsapReady) {
    // The line belongs to the wall: it opens out of the centre, where every eye has just looked.
    centre = document.createElement('div'); centre.className = 'eyes-centre';
    stick.append(centre); centre.append(title); if (sub) centre.append(sub);
    const copy = cover.querySelector('.ec-copy');
    if (copy && !copy.children.length) { copy.hidden = true; cover.querySelector('.ec-grid')?.classList.add('is-solo'); }
  } else {
    title.innerHTML = title.textContent.trim().split(/\s+/).map((w, i) => `<span class="ew"><span style="--i:${i}">${w}</span></span>`).join(' ');
  }

  /* ---------- Scroll: every eye looks to one point, and the eye opens ----------
     While the wall is stuck under the nav, scrolling pulls every tile in to the centre (the outermost
     travel furthest and arrive last, shrinking and turning), so the wall funnels into one green pupil.
     The pupil pulses, then dilates until the screen is ivory: the eye opening. The ivory panel then
     rises over that same ivory, so the change of tone has no edge. Scrubbed both ways. */
  const gsap = window.gsap, ST = window.ScrollTrigger;
  const navH = () => document.querySelector('.nav')?.offsetHeight || 0;
  if (gsapReady) {
    gsap.registerPlugin(ST);
    let tl = null;
    // The shatter's progress is read from where the section actually is on screen, every scroll:
    // 0 until its top reaches the nav, 1 after 0.9 of a screen more. No positions are cached, so
    // nothing that changes the page's height above it can make the wall look already broken.
    let target = 0, shown = 0, raf = 0;
    const measure = () => {
      // Done by the time the panel's top reaches the bottom of the screen.
      const len = Math.max(1, cover.offsetTop + navH() - window.innerHeight);
      target = Math.min(1, Math.max(0, (navH() - section.getBoundingClientRect().top) / len));
    };
    const glide = () => {                                    // a little inertia, like a scrub
      shown += (target - shown) * 0.16;
      if (Math.abs(target - shown) < 0.0008) shown = target;
      tl?.progress(shown); progress = shown;
      grid.classList.toggle('is-moving', shown > 0.005 && shown < 0.55);   // light tiles while they fly
      raf = shown === target ? 0 : requestAnimationFrame(glide);
    };
    const onScroll = () => { measure(); if (!raf) raf = requestAnimationFrame(glide); };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    makeShatter = () => {
      if (tl) { tl.kill(); gsap.set(tiles, { clearProps: 'transform,opacity' }); }
      const W = stick.clientWidth || window.innerWidth, H = stick.clientHeight || window.innerHeight;
      const size = W / cols, cx = W / 2, cy = H / 2;
      const far = Math.hypot(W / 2, H / 2) || 1;
      tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      tl.to({}, { duration: 0.03 });                                              // a breath before it starts
      tiles.forEach((t, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const x = (col + 0.5) * size, y = (row + 0.5) * size;
        const d = Math.min(1, Math.hypot(x - cx, y - cy) / far);
        const h1 = ((i * 2654435761) >>> 0) / 4294967296, h2 = ((i * 40503 + 7) % 997) / 997;
        tl.to(t, {
          x: cx - x, y: cy - y, scale: 0.05, rotation: (h2 - 0.5) * 160, opacity: 0,
          duration: 0.22 + d * 0.14, ease: 'power2.in',
        }, 0.03 + (1 - d) * 0.06 + h1 * 0.04);
      });
      // Where they land: a green pupil. It pulses once, narrows into a closed lid as wide as the line,
      // and the line opens out of it like an eye. It holds to be read, then an ivory iris dilates from
      // the centre to fill the screen, and the panel rises over that same ivory.
      // Sizes are animated for real (width, height, a clip circle), never by scaling a small element up,
      // so every edge stays sharp at any size.
      const wide = Math.max(18, title.offsetWidth);
      const fill = Math.hypot(W, H) * 0.56;
      const at = (w, h) => ({ width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2 });
      tl.fromTo(dot, { ...at(0, 0), opacity: 0 }, { ...at(18, 18), opacity: 1, duration: 0.04, ease: 'back.out(3)' }, 0.40);
      tl.to(dot, { ...at(29, 29), duration: 0.04, ease: 'sine.out' }, 0.45);
      tl.to(dot, { ...at(18, 18), duration: 0.03, ease: 'sine.in' }, 0.49);
      tl.to(dot, { ...at(wide, 3.2), duration: 0.05, ease: 'power3.inOut' }, 0.53);
      tl.fromTo(title, { opacity: 0, clipPath: 'inset(50% 0% 50% 0%)', scale: 1.03 }, { opacity: 1, clipPath: 'inset(-20% -6% -20% -6%)', scale: 1, duration: 0.07, ease: 'power3.out' }, 0.57);
      tl.to(dot, { opacity: 0, duration: 0.04 }, 0.58);
      if (sub) tl.fromTo(sub, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.06, ease: 'power2.out' }, 0.64);
      tl.to(centre.children, { opacity: 0, scale: 0.97, duration: 0.06, ease: 'power2.in' }, 0.82);
      tl.fromTo(iris, { clipPath: 'circle(0px at 50% 50%)', opacity: 1 }, { clipPath: `circle(${fill.toFixed(0)}px at 50% 50%)`, duration: 0.16, ease: 'power2.inOut' }, 0.82);
      tl.to({}, { duration: 0.02 });                                              // the screen holds, ivory
      measure(); shown = target; tl.progress(shown);                             // start where the page is
    };
    gsap.set(grid, { yPercent: 0 });
    const dot = document.createElement('span'); dot.className = 'eyes-dot'; dot.setAttribute('aria-hidden', 'true'); stick.append(dot);
    const iris = document.createElement('span'); iris.className = 'eyes-iris'; iris.setAttribute('aria-hidden', 'true'); stick.append(iris);
    makeShatter();
    ST.create({ trigger: cover, start: 'top 55%', onEnter: () => cover.classList.add('is-in'), onLeaveBack: () => cover.classList.remove('is-in') });
  } else if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { if (en.isIntersecting) cover.classList.add('is-in'); }, { threshold: 0.3 }).observe(cover);
  } else cover.classList.add('is-in');
}
