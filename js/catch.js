// "Got an idea? Make it real." as a game of catch. Ideas drift around the panel like flies: a brand, a
// website, an app, a launch film... Every few seconds Girgit's tongue shoots in from just off the edge of
// the panel, sticks to one and reels it in; a moment later a new one drifts back. Click an idea and the
// tongue catches that one for you, then the project form opens with it already chosen.
// So that they read as things to press, not decoration: a question sits above them ("What are you making?
// Pick one."), each idea carries a + like an add button, and the one under the pointer or in focus stops
// drifting and fills with its colour.
// Reduced motion: the ideas sit still, and a click still opens the form with the idea chosen.
import { makeTongue } from './tongue.js?v=3.1.0';

const panel = document.querySelector('.cta-panel');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const IDEAS = [
  { t: 'a brand', v: 'Brand identity', c: '#FF168C' },
  { t: 'a website', v: 'Website', c: '#43FF18' },
  { t: 'an app', v: 'App & interface', c: '#173BFF' },
  { t: 'a launch film', v: 'Video & motion', c: '#FFE500' },
  { t: 'a new product', v: 'Digital product / UX', c: '#9DB4FF' },
  { t: 'that 3 a.m. idea', v: 'Not sure yet', c: '#F4EFE5' },
];

if (panel) {
  panel.classList.add('ci');
  const field = document.createElement('div'); field.className = 'ci-field';
  const ask = document.createElement('p'); ask.className = 'ci-ask';
  ask.innerHTML = '<strong>What are you making? Pick one.</strong><span>He catches it, and the form opens with it filled in.</span>';
  field.append(ask);
  panel.append(field);
  const tongue = makeTongue(panel, 'ci');
  tongue.svg.classList.add('ci-tongue');

  const chips = IDEAS.map((idea, k) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn btn--ghost ci-chip';
    b.style.setProperty('--c', idea.c);
    // The + on its colour needs ink that reads: black on the light colours, ivory on the blue.
    const n = parseInt(idea.c.slice(1), 16), lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    b.style.setProperty('--ink', lum > 0.5 ? '#111111' : '#F4EFE5');
    b.innerHTML = `<i aria-hidden="true"></i>${idea.t}<b aria-hidden="true">+</b>`;
    b.setAttribute('aria-label', `Start a project for ${idea.t}`);
    field.append(b);
    const c = { el: b, idea, k, x: 0, y: 0, seed: Math.random() * 100, gone: false, held: false, still: false };
    // Under the pointer or in focus, it holds still so it is easy to press.
    const hold = (on) => { c.still = on; b.classList.toggle('is-hover', on); };
    b.addEventListener('pointerenter', () => hold(true));
    b.addEventListener('pointerleave', () => hold(false));
    b.addEventListener('focus', () => hold(true));
    b.addEventListener('blur', () => hold(false));
    return c;
  });

  let W = 0, H = 0, FX = 0, FY = 0, FW = 0, FH = 0, TOP = 0;
  const box = () => {
    W = panel.clientWidth; H = panel.clientHeight;
    const f = field.getBoundingClientRect(), p = panel.getBoundingClientRect();
    FX = f.left - p.left; FY = f.top - p.top; FW = f.width; FH = f.height;
    TOP = ask.offsetHeight + 16;   // the ideas drift below the question
  };
  new ResizeObserver(box).observe(panel); box();

  // Each idea wanders around its own home, slowly, like a fly that cannot decide.
  // On a wide panel: two loose columns. On a phone the ideas are too wide to sit two abreast, so they take
  // one row each, stepping left and right down the field, and drift less, so none ever overlaps another.
  const narrow = () => FW < 520;
  const home = (c) => {
    if (narrow()) {
      const w = c.el.offsetWidth, rows = chips.length;
      const x = c.k % 2 ? FX + FW - w / 2 - 6 : FX + w / 2 + 6;
      return [x, FY + TOP + (FH - TOP) * ((c.k + 0.5) / rows)];
    }
    const cols = 2, rows = Math.ceil(chips.length / cols);
    const col = c.k % cols, row = Math.floor(c.k / cols);
    return [FX + FW * ((col + 0.5) / cols), FY + TOP + (FH - TOP) * ((row + 0.5) / rows)];
  };
  const place = (now) => {
    const t = now / 1000;
    for (const c of chips) {
      if (c.held || c.gone || c.still) continue;
      const [hx, hy] = home(c), m = reduce ? 0 : 1, dx = narrow() ? 6 : 26, dy = narrow() ? 3 : 16;
      c.x = hx + Math.sin(t * 0.7 + c.seed) * dx * m + Math.sin(t * 1.9 + c.seed * 2) * (dx / 4) * m;
      c.y = hy + Math.cos(t * 0.9 + c.seed * 1.3) * dy * m;
      c.el.style.translate = `${(c.x - FX - c.el.offsetWidth / 2).toFixed(1)}px ${(c.y - FY - c.el.offsetHeight / 2).toFixed(1)}px`;
    }
  };

  // The tongue comes from his mouth, just past the right edge of the panel (on phones, the bottom edge).
  const mouth = () => (W > 760 ? [W + 12, H * 0.58] : [W * 0.5, H + 14]);
  const catchIt = (c, then) => {
    if (tongue.busy || c.gone) return;
    c.held = true;
    tongue.shoot(mouth(), [c.x, c.y], {
      scale: W > 760 ? 0.85 : 0.7, out: 170, hold: 120, back: 420,
      onStick: () => c.el.classList.add('is-caught'),
      onPull: (tip) => { c.el.style.translate = `${(tip[0] - FX - c.el.offsetWidth / 2).toFixed(1)}px ${(tip[1] - FY - c.el.offsetHeight / 2).toFixed(1)}px`; },
    }).then(() => {
      c.gone = true; c.held = false; c.el.classList.add('is-gone'); c.el.classList.remove('is-caught');
      then?.();
      setTimeout(() => { c.gone = false; c.el.classList.remove('is-gone'); }, 1600);   // a new one drifts back
    });
  };

  const openWith = (idea) => {
    const sel = document.querySelector('.form select[name="build"]');
    document.querySelector('[data-open-form]')?.click();
    if (sel) { sel.value = idea.v; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  };
  for (const c of chips) c.el.addEventListener('click', () => {
    if (reduce || tongue.busy) { openWith(c.idea); return; }
    catchIt(c, () => openWith(c.idea));
  });

  let visible = false, hovering = false, lastCatch = 0;
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.3 }).observe(panel);
  else visible = true;
  panel.addEventListener('pointerenter', () => { hovering = true; });
  // On a touch screen there is no hover, so a touch on the panel holds the automatic catch off for a few
  // seconds: he never snatches the idea you were about to tap.
  panel.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') lastCatch = performance.now() + 4000; }, { passive: true });
  panel.addEventListener('pointerleave', () => { hovering = false; });
  addEventListener('scroll', () => { const r = panel.getBoundingClientRect(); visible = r.top < innerHeight * 0.85 && r.bottom > innerHeight * 0.15; }, { passive: true });

  const loop = (now) => {
    requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    place(now);
    // on its own every three and a half seconds, but never while someone is choosing
    if (!reduce && !hovering && now - lastCatch > 3500 && !tongue.busy) {
      const free = chips.filter((c) => !c.gone && !c.held);
      if (free.length) { lastCatch = now; catchIt(free[(Math.random() * free.length) | 0]); }
    }
  };
  requestAnimationFrame(loop);
}
