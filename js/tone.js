// Light and dark, by scroll. Where an ivory section meets a forest one, the colour blends as you scroll
// instead of meeting at an edge. The page has one background colour, on <html>; the plain sections are
// transparent over it, and as a section whose tone differs from the one before rises through the screen
// (its top from 75% to 30% of the height), the page colour eases from one to the other.
// Sections that paint their own world (the hero, what we do, the eye wall and its panel) keep their
// backgrounds and still count as stops, so the colour under them is already right when they leave.

const STOPS = [
  { sel: '#work', clear: true },
  { sel: '#looking' },
  { sel: '#looking .eyes-cover' },
  { sel: '#what', c: '#F4EFE5' },                // the film paints its own warm backdrop
  { sel: '#words', clear: true },
  { sel: '#approach', clear: true },
  { sel: '#who', clear: true },
  { sel: '#talk', clear: true },
  { sel: '.ft', clear: true },
];

const parse = (c) => (c.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
const items = STOPS.map((s) => {
  const el = document.querySelector(s.sel);
  return el && { el, clear: s.clear, c: s.c ? parse(s.c.replace(/^#(..)(..)(..)$/, (m, r, g, b) => `${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(b, 16)}`)) : parse(getComputedStyle(el).backgroundColor) };
}).filter(Boolean);

if (items.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const root = document.documentElement, paper = document.querySelector('.paper');
  const start = parse(getComputedStyle(root).backgroundColor);
  for (const it of items) if (it.clear) it.el.classList.add('tone-clear');
  root.classList.add('has-tone');
  const ease = (t) => t * t * (3 - 2 * t);
  const lum = (c) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  let raf = 0, last = '';
  const paint = () => {
    raf = 0;
    const vh = innerHeight;
    let col = items[0].el.getBoundingClientRect().top > vh * 0.75 ? start : items[0].c.slice();
    for (let i = 1; i < items.length; i++) {
      const top = items[i].el.getBoundingClientRect().top;
      const t = ease(Math.min(1, Math.max(0, (vh * 0.75 - top) / (vh * 0.45))));
      if (t === 0) break;                                   // the rest are further down
      col = col.map((v, k) => v + (items[i].c[k] - v) * t);
    }
    const css = `rgb(${col.map(Math.round).join(' ')})`;
    if (css === last) return;
    last = css;
    root.style.backgroundColor = css;
    if (paper) paper.style.opacity = Math.max(0, Math.min(1, (lum(col) - 0.2) / 0.7)).toFixed(3);   // the paper grain fades on dark
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(paint); };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue, { passive: true });
  paint();
}
