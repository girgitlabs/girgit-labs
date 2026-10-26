// Style board v2: places the art, drives the accent switch, the colour-changing
// chameleon, eyes that follow the cursor, and the draggable sticker pile.
import { ACCENTS, BODIES, INK, PIXELS, SCRIBBLES, badge, chameleon, sticker } from '../js/art.js';

const STICKERS = [
  { t: ['#web', 'design'], x: 4, y: 22, r: -6 },
  { t: ['#branding &', 'identity'], x: 21, y: 8, r: 4 },
  { t: ['#digital', 'products'], x: 43, y: 18, r: -3 },
  { t: ['#ux audits'], x: 64, y: 6, r: 6 },
  { t: ['#video &', 'motion'], x: 2, y: 56, r: 5 },
  { t: ['#app &', 'interface'], x: 22, y: 48, r: -5 },
  { t: ['#ai-enabled', 'experiences'], x: 42, y: 56, r: 3 },
  { t: ['#frontend'], x: 66, y: 44, r: -4 },
  { t: ['#graphic', 'design'], x: 62, y: 70, r: 5 },
];
const BODY_CYCLE = ['ink', 'lime', 'sun', 'coral', 'camo'];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let accent = 'lime';

function paint() {
  const a = ACCENTS[accent].hex;
  document.documentElement.style.setProperty('--accent', a);
  document.querySelectorAll('[data-scribble]').forEach((el) => {
    el.innerHTML = SCRIBBLES[el.dataset.scribble](a, Number(el.dataset.seed) || 3);
  });
  document.querySelectorAll('[data-cham]').forEach((el) => {
    el.innerHTML = chameleon({ body: el.dataset.body || 'ink', state: el.dataset.cham, eyeGlow: a });
  });

  const pile = document.querySelector('[data-pile]');
  pile.querySelectorAll('.s, .badge').forEach((n) => n.remove());
  STICKERS.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = 's';
    Object.assign(d.style, { left: `${s.x}%`, top: `${s.y}%`, width: `${s.t[0].length * 1.45 + 6}%`, transform: `rotate(${s.r}deg)`, zIndex: i + 1 });
    d.innerHTML = sticker(s.t, { fill: i === 3 ? a : '#FFFFFF' });
    pile.append(d);
  });
  const b = document.createElement('div');
  b.className = 's badge';
  Object.assign(b.style, { right: '1%', top: '30%', width: '120px', zIndex: 15 });
  b.innerHTML = badge(['GIRGIT', 'LABS'], a);
  pile.append(b);
  const sleeper = pile.querySelector('.sleeper');
  Object.assign(sleeper.style, { left: '6%', top: '-1%' });

  const kit = document.querySelector('[data-kit]');
  kit.innerHTML = [
    ['default', 'hero'], ['found', 'found it'], ['sleep', 'on the stickers'], ['glow', 'finale', true],
  ].map(([s, cap, dark]) => `<figure class="${dark ? 'dark' : ''}">${chameleon({ state: s, eyeGlow: a })}<figcaption>${cap}</figcaption></figure>`).join('')
    + ['lime', 'sun', 'coral', 'camo'].map((k) => `<figure>${chameleon({ body: k })}<figcaption>skin: ${k}</figcaption></figure>`).join('')
    + Object.keys(SCRIBBLES).map((k, i) => `<figure>${SCRIBBLES[k](i % 2 ? INK : a)}<figcaption>${k}</figcaption></figure>`).join('')
    + Object.keys(PIXELS).map((k) => `<figure><div style="padding:1rem 2rem">${PIXELS[k]()}</div><figcaption>pixel ${k}</figcaption></figure>`).join('')
    + `<figure>${badge(['GIRGIT', 'LABS'], a)}<figcaption>badge</figcaption></figure>`;
}

document.querySelectorAll('[data-accent]').forEach((btn) => btn.addEventListener('click', () => {
  accent = btn.dataset.accent;
  document.querySelectorAll('[data-accent]').forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
  paint();
}));

// Click the hero chameleon: it changes colour.
const hero = document.querySelector('.viewfinder .cham');
let n = 0;
hero.addEventListener('click', () => {
  hero.dataset.body = BODY_CYCLE[++n % BODY_CYCLE.length];
  hero.innerHTML = chameleon({ body: hero.dataset.body, eyeGlow: ACCENTS[accent].hex });
});

// Eyes follow the cursor (each pupil moves within its eye).
if (!reduce) {
  addEventListener('pointermove', (e) => {
    document.querySelectorAll('.pupil').forEach((p) => {
      const svg = p.ownerSVGElement, r = svg.getBoundingClientRect();
      const k = r.width / 420;
      const ex = r.left + Number(p.dataset.cx) * k, ey = r.top + Number(p.dataset.cy) * k;
      const dx = e.clientX - ex, dy = e.clientY - ey, d = Math.hypot(dx, dy) || 1;
      const m = Math.min(1, d / 300) * 10;
      p.setAttribute('transform', `translate(${((dx / d) * m).toFixed(1)} ${((dy / d) * m).toFixed(1)})`);
    });
  });
}

// Drag the stickers around the pile.
const pile = document.querySelector('[data-pile]');
let drag = null, top = 50;
pile.addEventListener('pointerdown', (e) => {
  const s = e.target.closest('.s');
  if (!s) return;
  const r = s.getBoundingClientRect();
  drag = { s, dx: e.clientX - r.left, dy: e.clientY - r.top };
  s.style.zIndex = ++top;
  s.setPointerCapture(e.pointerId);
});
pile.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const pr = pile.getBoundingClientRect();
  Object.assign(drag.s.style, { left: `${e.clientX - pr.left - drag.dx}px`, top: `${e.clientY - pr.top - drag.dy}px`, right: 'auto' });
});
pile.addEventListener('pointerup', () => { drag = null; });

paint();
