// Girgit's tongue as a reusable part, built into
// any positioned container. A real chameleon's tongue is ballistic: it shoots out at about 2.5 times
// its body length in well under a tenth of a second, the sticky club wraps the prey, and the
// accelerator muscle reels it back. So: fast out, a short stick, a slower pull home.
//
//   const t = makeTongue(host, 'eat');            // host is position: relative / fixed
//   await t.shoot(mouth, target, { onStick, onPull(pos, x) });   // points in host pixels

const NS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}) => { const n = document.createElementNS(NS, name); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
const f = (n) => n.toFixed(1);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function makeTongue(host, id) {
  const svg = el('svg', { class: 'tongue', 'aria-hidden': 'true' });
  const stops = (grad, list) => { for (const [o, c] of list) grad.append(el('stop', { offset: o, 'stop-color': c })); return grad; };
  const defs = el('defs');
  const flesh = stops(el('linearGradient', { id: `${id}-flesh`, gradientUnits: 'userSpaceOnUse' }), [['0', '#4A1424'], ['0.1', '#8E3A50'], ['0.3', '#C25C72'], ['1', '#D7798C']]);
  defs.append(flesh, stops(el('radialGradient', { id: `${id}-club`, cx: '0.38', cy: '0.32', r: '0.75' }), [['0', '#F1AABA'], ['0.5', '#D57A8E'], ['1', '#9A4258']]));
  const shadow = el('filter', { id: `${id}-shadow`, x: '-20%', y: '-20%', width: '140%', height: '160%' });
  shadow.append(el('feDropShadow', { dx: '0', dy: '4', stdDeviation: '3', 'flood-color': '#000', 'flood-opacity': '0.3' }));
  defs.append(shadow);
  const g = el('g', { filter: `url(#${id}-shadow)` });
  const body = el('path', { fill: `url(#${id}-flesh)` });
  const under = el('path', { fill: 'none', stroke: '#7E3446', 'stroke-width': '2.6', 'stroke-linecap': 'round', opacity: '0.5' });
  const sheen = el('path', { fill: 'none', stroke: '#F6C9D3', 'stroke-width': '2.6', 'stroke-linecap': 'round', opacity: '0.5' });
  const club = el('g');
  club.append(
    el('ellipse', { rx: '1', ry: '0.86', fill: `url(#${id}-club)`, stroke: '#7E3446', 'stroke-width': '0.08' }),
    el('ellipse', { cx: '0.24', rx: '0.42', ry: '0.5', fill: '#9A4258', opacity: '0.45' }),
    el('ellipse', { cx: '-0.34', cy: '-0.36', rx: '0.3', ry: '0.18', fill: '#FFFFFF', opacity: '0.6', transform: 'rotate(-25)' }),
  );
  g.append(body, under, sheen, club);
  svg.append(defs, g);
  host.append(svg);

  let unit = 1;
  // Draw from mouth m reaching fraction k of the way to t, sagging by `sag` of its length.
  function draw(m, t, k, sag, squash) {
    const E = [m[0] + (t[0] - m[0]) * k, m[1] + (t[1] - m[1]) * k];
    const len = Math.hypot(E[0] - m[0], E[1] - m[1]);
    if (len < 2) { svg.style.opacity = '0'; return E; }
    const C = [(m[0] + E[0]) / 2, (m[1] + E[1]) / 2 + len * sag];
    const Q = (s) => [(1 - s) ** 2 * m[0] + 2 * (1 - s) * s * C[0] + s * s * E[0], (1 - s) ** 2 * m[1] + 2 * (1 - s) * s * C[1] + s * s * E[1]];
    const D = (s) => { const dx = 2 * (1 - s) * (C[0] - m[0]) + 2 * s * (E[0] - C[0]), dy = 2 * (1 - s) * (C[1] - m[1]) + 2 * s * (E[1] - C[1]), l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
    const W = (s) => unit * (30 - 14 * smooth(0, 0.6, s) + 4 * smooth(0.8, 1, s));
    const L = [], R = [], top = [], bot = [], N = 24;
    for (let i = 0; i <= N; i++) {
      const s = i / N, [x, y] = Q(s), [dx, dy] = D(s);
      let px = -dy, py = dx; if (py > 0) { px = -px; py = -py; }
      const w = W(s) / 2;
      L.push(`${f(x + px * w)} ${f(y + py * w)}`); R.push(`${f(x - px * w)} ${f(y - py * w)}`);
      if (s > 0.06 && s < 0.9) { top.push(`${f(x + px * w * 0.55)} ${f(y + py * w * 0.55)}`); bot.push(`${f(x - px * w * 0.7)} ${f(y - py * w * 0.7)}`); }
    }
    body.setAttribute('d', `M${L.join('L')}L${R.reverse().join('L')}Z`);
    sheen.setAttribute('d', top.length ? `M${top.join('L')}` : '');
    under.setAttribute('d', bot.length ? `M${bot.join('L')}` : '');
    flesh.setAttribute('x1', f(m[0])); flesh.setAttribute('y1', f(m[1])); flesh.setAttribute('x2', f(E[0])); flesh.setAttribute('y2', f(E[1]));
    const [dx, dy] = D(1), ang = Math.atan2(dy, dx) * 180 / Math.PI, r = 21 * unit;
    club.setAttribute('transform', `translate(${f(E[0])} ${f(E[1])}) rotate(${f(ang)}) scale(${f(r * (1 - 0.22 * squash))} ${f(r * (1 + 0.18 * squash))})`);
    svg.style.opacity = '1';
    return E;
  }

  let busy = false;
  function shoot(m, t, { scale = 1, onStick, onPull, out = 150, hold = 110, back = 320 } = {}) {
    if (busy) return Promise.resolve(false);
    busy = true; unit = scale;
    return new Promise((done) => {
      let start = null, stuck = false;
      const step = (now) => {
        if (start === null) start = now;
        const e = now - start;
        let k, sag, squash = 0, x = 0;
        if (e < out) { x = e / out; k = 1 - (1 - x) ** 3 + Math.sin(Math.PI * x) * 0.05; sag = 0.03; }
        else if (e < out + hold) {
          x = (e - out) / hold; k = 1; sag = 0.03 + 0.03 * x; squash = Math.sin(Math.PI * Math.min(1, x * 1.6)) * (1 - x * 0.5);
          if (!stuck) { stuck = true; onStick?.(); }
        } else {
          x = Math.min(1, (e - out - hold) / back); k = 1 - x * x * (3 - 2 * x); sag = 0.06 + 0.1 * Math.sin(Math.PI * x);
        }
        const tip = draw(m, t, Math.max(0, k), sag, squash);
        if (e >= out + hold) onPull?.(tip, x);
        if (e < out + hold + back) requestAnimationFrame(step);
        else { svg.style.opacity = '0'; busy = false; done(true); }
      };
      requestAnimationFrame(step);
    });
  }
  return { svg, shoot, get busy() { return busy; } };
}
