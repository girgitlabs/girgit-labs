// SEVEN DAYS, SCOPE TO LIVE, as the tongue's journey, in a zig-zag. The four steps pin to the screen,
// stepping up and down (css: SEVEN DAYS ... in a zig-zag), and Girgit's tongue (he is just off the left
// edge) zig-zags from one stop to the next as you scroll: each step lights up in its colour as the sticky
// tip reaches it, and at day seven the tip lands on "LIVE." and it pops. The tongue is the fastest thing a
// chameleon has: the right body part for a seven-day promise.
// Reduced motion or no JS: the four steps as they are, all lit.

const week = document.querySelector('.hw-week');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (week && !reduce) {
  const steps = [...week.querySelectorAll('.hw-step')];
  const list = week.querySelector('.hw-steps');
  week.classList.add('wk');
  const stick = document.createElement('div'); stick.className = 'wk-stick';
  [...week.children].forEach((c) => stick.append(c));
  week.append(stick);
  // Each stop: its dot, and its words in one block (so the words can sit above or below the dot).
  steps.forEach((s) => {
    const text = document.createElement('div'); text.className = 'wk-text';
    s.querySelectorAll(':scope > .hw-tag, :scope > p').forEach((el) => text.append(el));
    const d = document.createElement('span'); d.className = 'wk-dot'; d.setAttribute('aria-hidden', 'true');
    s.append(d, text);
  });

  // The tongue. Not a line on a chart: one soft, elastic curve that swings through the stops, thick and
  // dark at the base (his mouth, just off the left edge), thinning and paler toward the sticky club at the
  // tip, with a wet sheen along its top. It is drawn as a filled outline so it can taper, and when you
  // scroll it ripples, the ripple running along it and settling once you stop.
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'wk-tongue'); svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<defs><linearGradient id="wk-flesh" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#7E2F45"/><stop offset="0.3" stop-color="#B9566D"/><stop offset="1" stop-color="#E98FA5"/></linearGradient>
    <radialGradient id="wk-club" cx="0.38" cy="0.32" r="0.78"><stop offset="0" stop-color="#F9C4D0"/><stop offset="0.5" stop-color="#DC7F94"/><stop offset="1" stop-color="#93394F"/></radialGradient></defs>
    <path class="wk-body" fill="url(#wk-flesh)"/>
    <path class="wk-sheen" fill="none" stroke="#FBE0E7" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
    <g class="wk-club"><circle r="1" fill="url(#wk-club)"/><circle r="1" fill="none" stroke="#7E2F45" stroke-width="0.08" opacity="0.6"/><ellipse cx="-0.32" cy="-0.36" rx="0.32" ry="0.18" fill="#fff" opacity="0.65"/></g>`;
  list.append(svg);
  const body = svg.querySelector('.wk-body'), sheen = svg.querySelector('.wk-sheen'), club = svg.querySelector('.wk-club');

  // The route: in from off the left edge, a little below the first stop (so it rises into it), then a smooth
  // curve through every stop (Catmull-Rom, drawn as Bezier segments). It is sampled every few pixels:
  // path[i] = [x, y, length so far]; at[k] is how far along the route stop k sits; total is the whole length.
  let path = [], at = [], total = 1, W = 0, th = 12, raf = 0, reach = -1, drawn = 0;
  const bez = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };
  const measure = () => {
    const lr = list.getBoundingClientRect();
    W = lr.width;
    th = Math.max(10, Math.min(20, W * 0.013));
    const dots = steps.map((s) => { const r = s.querySelector('.wk-dot').getBoundingClientRect(); return [r.left - lr.left + r.width / 2, r.top - lr.top + r.height / 2]; });
    const pts = [[-innerWidth * 0.08, dots[0][1] + th * 2.5], ...dots];
    path = [[pts[0][0], pts[0][1], 0]]; at = [];
    let len = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const T = 0.9 / 6;   // how loose the curve is between stops: soft, but it still meets each one squarely
      const c1 = [p1[0] + (p2[0] - p0[0]) * T, p1[1] + (p2[1] - p0[1]) * T], c2 = [p2[0] - (p3[0] - p1[0]) * T, p2[1] - (p3[1] - p1[1]) * T];
      const n = Math.max(12, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 5));
      for (let j = 1; j <= n; j++) {
        const t = j / n, x = bez(p1[0], c1[0], c2[0], p2[0], t), y = bez(p1[1], c1[1], c2[1], p2[1], t);
        const prev = path[path.length - 1];
        len += Math.hypot(x - prev[0], y - prev[1]);
        path.push([x, y, len]);
      }
      at.push(len);
    }
    total = Math.max(1, len);
    svg.setAttribute('viewBox', `0 0 ${W} ${lr.height}`); svg.style.height = `${lr.height}px`;
    tick();
  };

  // The ripple: kicked by how fast you scroll, it runs along the tongue and dies away.
  let amp = 0, phase = 0, lastP = 0, lastT = performance.now(), lastST = performance.now(), wobbling = 0;
  const draw = () => {
    if (path.length < 2) return;
    // The samples up to the tip, the last one cut exactly at the tip.
    const pts = [];
    for (let i = 0; i < path.length && path[i][2] <= drawn; i++) pts.push(path[i]);
    const nxt = path[pts.length];
    if (nxt && pts.length) {
      const a = pts[pts.length - 1], t = (drawn - a[2]) / Math.max(0.001, nxt[2] - a[2]);
      pts.push([a[0] + (nxt[0] - a[0]) * t, a[1] + (nxt[1] - a[1]) * t, drawn]);
    }
    if (pts.length < 2) { body.setAttribute('d', ''); sheen.setAttribute('d', ''); club.setAttribute('opacity', '0'); return; }
    club.setAttribute('opacity', '1');
    const L = [], R = [], S = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const nx = -dy, ny = dx;                                     // the side normal (below, when heading right)
      const f = pts[i][2] / Math.max(1, drawn);                    // 0 at his mouth, 1 at the tip
      const w = th * (1.35 - 0.6 * f);                             // it tapers toward the tip
      const r = amp * Math.sin(pts[i][2] * 0.03 - phase) * Math.sin(Math.PI * f);   // the ripple, still at both ends
      const x = pts[i][0] + nx * r, y = pts[i][1] + ny * r;
      L.push(`${(x - nx * w / 2).toFixed(1)} ${(y - ny * w / 2).toFixed(1)}`);
      R.push(`${(x + nx * w / 2).toFixed(1)} ${(y + ny * w / 2).toFixed(1)}`);
      if (pts[i][2] < drawn - th * 1.6) S.push(`${(x - nx * w * 0.24).toFixed(1)} ${(y - ny * w * 0.24).toFixed(1)}`);
      if (i === pts.length - 1) club.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(th * 1.3).toFixed(2)})`);
    }
    body.setAttribute('d', `M${L.join(' L')} L${R.reverse().join(' L')} Z`);
    sheen.setAttribute('d', S.length > 1 ? `M${S.join(' L')}` : '');
    sheen.setAttribute('stroke-width', (th * 0.17).toFixed(1));
  };
  const wobble = (now) => {
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    phase += dt * 9;
    amp *= Math.pow(0.04, dt);                                     // dies away in about a second
    draw();
    wobbling = amp > 0.15 ? requestAnimationFrame(wobble) : 0;
    if (!wobbling) { amp = 0; draw(); }
  };

  const tick = () => {
    raf = 0;
    if (path.length < 2) return;
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16 || 68;
    const r = week.getBoundingClientRect(), span = week.offsetHeight - stick.offsetHeight;
    // On phones nothing is pinned (css), so progress is read against the screen instead: the stops light up
    // one after another as they scroll into view, and LIVE. pops when you actually reach it.
    const flat = span < 2;
    const p = flat
      ? Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / Math.max(1, week.offsetHeight)))
      : Math.min(1, Math.max(0, (navH - r.top) / Math.max(1, span)));
    // It lands a little before the end of the scroll, so LIVE. has a moment to itself.
    drawn = total * (p < 0.92 ? p / 0.92 : 1);
    // A flick of the scroll sets it rippling; the faster the flick, the bigger (never more than half its width).
    const now = performance.now(), v = Math.abs(p - lastP) / Math.max(0.008, (now - lastST) / 1000);
    lastP = p; lastST = now;
    if (!flat) amp = Math.min(th * 0.55, Math.max(amp, v * th * 0.5));   // no ripple while the tongue is hidden
    if (amp > 0.15 && !wobbling) { lastT = now; wobbling = requestAnimationFrame(wobble); }
    draw();
    const n = at.filter((a) => drawn >= a - 2).length - 1;
    if (n !== reach) { reach = n; steps.forEach((s, k) => s.classList.toggle('is-on', k <= n)); week.classList.toggle('is-live', n >= steps.length - 1); }
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
  new ResizeObserver(measure).observe(list);
  document.fonts?.ready.then(measure);
  measure();
}
