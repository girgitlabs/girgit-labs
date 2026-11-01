// SECTION 05 — small, hand-made motion, all from the chameleon idea (watch, adapt, catch).
// - The statement's words rise; "No boring solutions." flushes through colours and settles (CSS).
// - Service rows: their rules draw in, their colour squares pop, in sequence (CSS, indexed here).
// - Each work placeholder has one flat eye that follows the pointer and blinks now and then.
// - Girgit, at the invitation, flicks his tongue at "Start a project" when it's hovered or focused.
// Everything is off with reduced motion.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- The statement: one box per word so each can rise; the second line changes colour ---------- */
const statement = $('.s5-statement');
if (statement) {
  let i = 0;
  const wrap = (node, shift) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType !== 3) { wrap(child, true); continue; }
      const frag = document.createDocumentFragment();
      for (const part of child.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (!part.trim()) { frag.append(part); continue; }
        const box = document.createElement('span'), w = document.createElement('span');
        box.className = shift ? 'sw sw--shift' : 'sw'; w.textContent = part; w.style.setProperty('--i', i++);
        box.append(w); frag.append(box);
      }
      child.replaceWith(frag);
    }
  };
  wrap(statement, false);
  const reveal = () => statement.classList.add('is-in');
  if (reduce || !('IntersectionObserver' in window)) reveal();
  else new IntersectionObserver(([e], o) => { if (e.isIntersecting) { reveal(); o.disconnect(); } }, { threshold: 0.35 }).observe(statement);
}

/* ---------- Services: index the rows so their rules and squares arrive one after another ---------- */
$$('.svc').forEach((row, k) => row.style.setProperty('--row', k));

/* ---------- Placeholders: an eye in each, watching the pointer ---------- */
const IRIS = ['#FF168C', '#173BFF', '#43FF18', '#FFE500'];
const eyes = $$('.work-media:not(.work-media--real)').map((media, k) => {
  const host = document.createElement('span');
  host.className = 'work-eye';
  host.setAttribute('aria-hidden', 'true');
  host.style.setProperty('--blink', `${6 + ((k * 7) % 5)}s`); host.style.setProperty('--blink-delay', `${-k * 1.7}s`);
  host.innerHTML = `<svg viewBox="0 0 120 70" focusable="false">
      <clipPath id="we-${k}"><path d="M6 35 Q60 -6 114 35 Q60 76 6 35Z"/></clipPath>
      <g clip-path="url(#we-${k})">
        <rect width="120" height="70" fill="#FFFFFF"/>
        <g class="work-eye-iris"><circle cx="60" cy="35" r="19" fill="${IRIS[k % IRIS.length]}" stroke="#111" stroke-width="4"/><circle cx="60" cy="35" r="8.5" fill="#111"/><circle cx="54" cy="29" r="3.5" fill="#fff"/></g>
        <rect class="work-eye-lid" width="120" height="70" fill="#E9E1D0"/>
      </g>
      <path d="M6 35 Q60 -6 114 35 Q60 76 6 35Z" fill="none" stroke="#111" stroke-width="5" stroke-linejoin="round"/>
    </svg>`;
  media.prepend(host);
  return host.querySelector('.work-eye-iris');
});
if (!reduce && eyes.length) {
  let queued = false, px = 0, py = 0;
  const aim = () => {
    queued = false;
    for (const iris of eyes) {
      const r = iris.ownerSVGElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) continue;
      const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 320);
      iris.style.transform = `translate(${(dx / d * 16 * k).toFixed(1)}px, ${(dy / d * 7 * k).toFixed(1)}px)`;
    }
  };
  addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; if (!queued) { queued = true; requestAnimationFrame(aim); } }, { passive: true });
}

/* ---------- The invitation: Girgit's tongue shoots out to the button ----------
   Modelled on a real chameleon's: a fleshy tongue, thick where it leaves the mouth and tapering,
   ending in a bulbous sticky club. Clay shading to match Girgit: shadow inside the mouth, a moist
   highlight along the top, a soft shadow under it, a glossy tip. It shoots out with a little
   elastic overshoot, the club squashes on the button, then it reels back in, sagging slightly. */
const panel = $('.cta-panel'), girgit = $('.cta-girgit:not(.cta-girgit--open)'), target = $('.cta [data-open-form]');
if (panel && girgit && target && !reduce) {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs = {}) => { const n = document.createElementNS(NS, name); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
  const svg = el('svg', { class: 'cta-tongue', 'aria-hidden': 'true' });
  // Built as real SVG elements (not an HTML string), so names like feDropShadow keep their case everywhere.
  const stops = (grad, list) => { for (const [o, c] of list) grad.append(el('stop', { offset: o, 'stop-color': c })); return grad; };
  const defs = el('defs');
  defs.append(
    stops(el('linearGradient', { id: 'tg-flesh', gradientUnits: 'userSpaceOnUse' }), [['0', '#4A1424'], ['0.1', '#8E3A50'], ['0.3', '#C25C72'], ['1', '#D7798C']]),
    stops(el('radialGradient', { id: 'tg-club', cx: '0.38', cy: '0.32', r: '0.75' }), [['0', '#F1AABA'], ['0.5', '#D57A8E'], ['1', '#9A4258']]),
  );
  const shadow = el('filter', { id: 'tg-shadow', x: '-20%', y: '-20%', width: '140%', height: '160%' });
  shadow.append(el('feDropShadow', { dx: '0', dy: '4', stdDeviation: '3', 'flood-color': '#000', 'flood-opacity': '0.35' }));
  defs.append(shadow);
  const g = el('g', { filter: 'url(#tg-shadow)' });
  const spine = el('path', { class: 'cta-tongue-spine', fill: 'none', stroke: 'none' });        // the centre line (for reference)
  const body = el('path', { class: 'cta-tongue-body', fill: 'url(#tg-flesh)' });
  const under = el('path', { class: 'cta-tongue-under', fill: 'none', stroke: '#7E3446', 'stroke-width': '2.6', 'stroke-linecap': 'round', opacity: '0.5' });
  const sheen = el('path', { class: 'cta-tongue-sheen', fill: 'none', stroke: '#F6C9D3', 'stroke-width': '2.6', 'stroke-linecap': 'round', opacity: '0.5' });
  const throat = el('ellipse', { class: 'cta-tongue-throat', fill: '#3A0F1C' });               // the base, rounded into his mouth
  const club = el('g', { class: 'cta-tongue-club' });
  club.append(
    el('ellipse', { rx: '1', ry: '0.86', fill: 'url(#tg-club)', stroke: '#7E3446', 'stroke-width': '0.08' }),
    el('ellipse', { cx: '0.24', rx: '0.42', ry: '0.5', fill: '#9A4258', opacity: '0.45' }),                 // the sticky pad
    el('ellipse', { cx: '-0.34', cy: '-0.36', rx: '0.3', ry: '0.18', fill: '#FFFFFF', opacity: '0.6', transform: 'rotate(-25)' }),   // moist gloss
  );
  g.append(spine, throat, body, under, sheen, club);
  svg.append(defs, g);
  ($('.cta-girgit--open') || girgit).after(svg);
  const flesh = defs.querySelector('#tg-flesh');

  // The tongue leaves his open mouth: 80, 456 in girgit-cta-open.webp, which is aligned to the
  // closed image (1443 x 780, facing left as drawn, never flipped).
  const MOUTH = [80 / 1443, 456 / 780];
  const f = (n) => n.toFixed(1);
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  // Draw the tongue from mouth m reaching fraction k of the way to target t (k > 1 overshoots a
  // touch), sagging by `sag` of its length, with the club squashed by `squash` (0 = round).
  let unit = 1;                                                                    // 1 = Girgit drawn 520px wide
  function draw(m, t, k, sag, squash) {
    const E = [m[0] + (t[0] - m[0]) * k, m[1] + (t[1] - m[1]) * k];
    const len = Math.hypot(E[0] - m[0], E[1] - m[1]);
    if (len < 2) { svg.style.opacity = '0'; return; }
    // Sag: the middle drops (screen-down) by a share of the length.
    const C = [(m[0] + E[0]) / 2, (m[1] + E[1]) / 2 + len * sag];
    const Q = (s) => [(1 - s) * (1 - s) * m[0] + 2 * (1 - s) * s * C[0] + s * s * E[0], (1 - s) * (1 - s) * m[1] + 2 * (1 - s) * s * C[1] + s * s * E[1]];
    const D = (s) => { const dx = 2 * (1 - s) * (C[0] - m[0]) + 2 * s * (E[0] - C[0]), dy = 2 * (1 - s) * (C[1] - m[1]) + 2 * s * (E[1] - C[1]), l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
    // Width: thick and fleshy at the mouth, tapering, then flaring a little into the club.
    const W = (s) => unit * (30 - 14 * smooth(0, 0.6, s) + 4 * smooth(0.8, 1, s));
    const L = [], R = [], top = [], bot = [], N = 26;
    for (let i = 0; i <= N; i++) {
      const s = i / N, [x, y] = Q(s), [dx, dy] = D(s);
      let px = -dy, py = dx; if (py > 0) { px = -px; py = -py; }                   // normal pointing up: the lit side
      const w = W(s) / 2;
      L.push(`${f(x + px * w)} ${f(y + py * w)}`); R.push(`${f(x - px * w)} ${f(y - py * w)}`);
      if (s > 0.06 && s < 0.9) { top.push(`${f(x + px * w * 0.55)} ${f(y + py * w * 0.55)}`); bot.push(`${f(x - px * w * 0.7)} ${f(y - py * w * 0.7)}`); }
    }
    body.setAttribute('d', `M${L.join('L')}L${R.reverse().join('L')}Z`);
    sheen.setAttribute('d', top.length ? `M${top.join('L')}` : '');
    under.setAttribute('d', bot.length ? `M${bot.join('L')}` : '');
    spine.setAttribute('d', `M${f(m[0])} ${f(m[1])} Q${f(C[0])} ${f(C[1])} ${f(E[0])} ${f(E[1])}`);
    flesh.setAttribute('x1', f(m[0])); flesh.setAttribute('y1', f(m[1])); flesh.setAttribute('x2', f(E[0])); flesh.setAttribute('y2', f(E[1]));
    const [dx, dy] = D(1), ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const r = 21 * unit;
    club.setAttribute('transform', `translate(${f(E[0])} ${f(E[1])}) rotate(${f(ang)}) scale(${f(r * (1 - 0.22 * squash))} ${f(r * (1 + 0.18 * squash))})`);
    const [d0x, d0y] = D(0);
    throat.setAttribute('cx', f(m[0] - d0x * 4 * unit)); throat.setAttribute('cy', f(m[1] - d0y * 4 * unit));
    throat.setAttribute('rx', f(17 * unit)); throat.setAttribute('ry', f(13 * unit));
    throat.setAttribute('transform', `rotate(${f(Math.atan2(d0y, d0x) * 180 / Math.PI)} ${f(m[0])} ${f(m[1])})`);
    svg.style.opacity = '1';
  }

  let busy = false, last = -Infinity;                                              // no flick yet
  const flick = () => {
    const now = performance.now();
    if (busy || now - last < 1400) return;
    busy = true; last = now;
    const p = panel.getBoundingClientRect(), gr = girgit.getBoundingClientRect(), b = target.getBoundingClientRect();
    const m = [gr.left - p.left + MOUTH[0] * gr.width, gr.top - p.top + MOUTH[1] * gr.height];
    unit = gr.width / 520;
    const t = [b.right - p.left - 8, b.top - p.top + b.height / 2];                 // the button's right edge
    svg.dataset.from = `${f(m[0])},${f(m[1])}`; svg.dataset.to = `${f(t[0])},${f(t[1])}`;
    const OUT = 170, HOLD = 150, BACK = 300;
    let start = null;                                                                // timed from the first frame
    const step = (now2) => {
      if (start === null) start = now2;
      const e = now2 - start;
      let k, sag, squash = 0;
      if (e < OUT) {                                                                  // shoots out, a touch past, springs back
        const x = e / OUT;
        k = 1 - Math.pow(1 - x, 3) + Math.sin(Math.PI * x) * 0.05;
        sag = 0.04;
      } else if (e < OUT + HOLD) {                                                    // stuck: the club squashes, then recovers
        const x = (e - OUT) / HOLD;
        k = 1 + Math.sin(Math.PI * x) * 0.012; sag = 0.04 + 0.03 * x;
        squash = Math.sin(Math.PI * Math.min(1, x * 1.6)) * (1 - x * 0.5);
      } else {                                                                        // reels back in, sagging under its weight
        const x = Math.min(1, (e - OUT - HOLD) / BACK);
        k = 1 - x * x * (3 - 2 * x); sag = 0.07 + 0.1 * Math.sin(Math.PI * x);
      }
      draw(m, t, Math.max(0, k), sag, squash);
      if (e >= OUT && e < OUT + 40) target.classList.add('is-caught');                // the button gets a little tug
      if (e < OUT + HOLD + BACK) requestAnimationFrame(step);
      else { busy = false; target.classList.remove('is-caught'); svg.style.opacity = '0'; panel.classList.remove('is-flicking'); }   // and closes
    };
    panel.classList.add('is-flicking');                                              // mouth opens
    requestAnimationFrame(step);
  };
  target.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') flick(); });
  target.addEventListener('focus', flick);
}
