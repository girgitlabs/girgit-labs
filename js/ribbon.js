// The hero's ribbon as a wavy marquee: a thick black ribbon that undulates like something alive, with
// the words riding along its middle. One SVG: the ribbon is a stroked path, the words follow the same
// path (textPath), and both are redrawn each frame from a moving sine wave. Reduced motion: still.

const band = document.querySelector('.hx-band');
if (band) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const words = [...band.querySelectorAll('.ticker-track span')].map((s) => s.textContent.trim()).filter((t) => t && t !== '✦');
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'wv'); svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<path class="wv-band" id="wv-path" fill="none"/>
    <text class="wv-text"><textPath href="#wv-path" startOffset="0"></textPath></text>`;
  band.replaceChildren(svg);
  band.classList.add('is-wavy');
  const path = svg.querySelector('.wv-band'), tp = svg.querySelector('textPath');
  // the words, three times over, with an acid star between each
  const run = Array.from({ length: 3 }, () => words).flat();
  const gap = '   ';
  tp.innerHTML = run.map((w) => `${w.toUpperCase()}${gap}<tspan class="wv-star">✦</tspan>${gap}`).join('');

  let W = 0, H = 0, len = 1, cycle = 1, offset = 0, t = 0, last = performance.now(), visible = true;
  const shape = (phase) => {
    // a gentle wave, two crests across the width, slightly bigger in the middle
    const pts = [], n = 48, amp = H * 0.26, mid = H / 2, pad = 30;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = -pad + u * (W + pad * 2);
      const env = 0.65 + 0.35 * Math.sin(u * Math.PI);
      pts.push([x, mid + Math.sin(u * Math.PI * 4 + phase) * amp * env]);
    }
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      d += ` Q${x0.toFixed(1)} ${y0.toFixed(1)} ${((x0 + x1) / 2).toFixed(1)} ${((y0 + y1) / 2).toFixed(1)}`;
    }
    return d + ` L${pts[n][0].toFixed(1)} ${pts[n][1].toFixed(1)}`;
  };
  const size = () => {
    W = band.clientWidth; H = band.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    path.setAttribute('d', shape(t));
    len = path.getTotalLength();
    cycle = tp.getComputedTextLength() / 3 || 600;                 // one set of the words
  };
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible || document.hidden) return;
    t += dt * 1.1;                                                 // the wave travels
    offset -= dt * 70;                                             // the words travel along it
    if (offset < -cycle) offset += cycle;
    path.setAttribute('d', shape(t));
    tp.setAttribute('startOffset', offset.toFixed(1));
  };
  new ResizeObserver(size).observe(band);
  document.fonts?.ready.then(size);
  size();
  if (!reduce) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(band);
    requestAnimationFrame(frame);
  }
}
