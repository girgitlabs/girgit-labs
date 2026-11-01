// FOOTER BANNER — a framed, flat-vector scene that closes the page: cyan sky, a target-eye sun, leaves
// in the jungle's greens, eye tiles from the eye wall, the hero's pink dot and arrow, sparkles and
// waves, with the full Girgit Labs logo (icon + wordmark, dark) at the centre. Thick black outlines and
// flat colour, the same language as the hero collage and the eye wall.
// bannerMarkup() is pure (Node render checks draw the same thing); the page part makes the eyes
// follow the pointer and pops the pieces in when the footer is seen.
import { tile, PAL } from './eye-tiles.js';

export const VIEW = { w: 1600, h: 420 };
const INK = '#111111';
const f = (n) => (Math.round(n * 10) / 10).toString();

// A flat leaf with a midrib, pointing along +x from its stem at (0, 0).
const leaf = (x, y, len, rot, fill, i) => {
  const w = len * 0.36;
  return `<g class="fb-piece fb-leaf" style="--i:${i}" transform="translate(${f(x)} ${f(y)}) rotate(${rot})"><g class="fb-sway">
    <path d="M0 0 C ${f(len * 0.25)} ${f(-w)}, ${f(len * 0.75)} ${f(-w)}, ${len} 0 C ${f(len * 0.75)} ${f(w)}, ${f(len * 0.25)} ${f(w)}, 0 0Z" fill="${fill}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M${f(len * 0.06)} 0 L${f(len * 0.88)} 0" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    ${[0.3, 0.5, 0.7].map((t) => `<path d="M${f(len * t)} 0 L${f(len * (t + 0.12))} ${f(-w * 0.55)} M${f(len * t)} 0 L${f(len * (t + 0.12))} ${f(w * 0.55)}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`).join('')}
  </g></g>`;
};
const sparkle = (x, y, r, fill, i) => `<path class="fb-piece fb-spark" style="--i:${i}" transform="translate(${x} ${y})" d="M0 ${-r} C ${f(r * 0.12)} ${f(-r * 0.2)} ${f(r * 0.2)} ${f(-r * 0.12)} ${r} 0 C ${f(r * 0.2)} ${f(r * 0.12)} ${f(r * 0.12)} ${f(r * 0.2)} 0 ${r} C ${f(-r * 0.12)} ${f(r * 0.2)} ${f(-r * 0.2)} ${f(r * 0.12)} ${-r} 0 C ${f(-r * 0.2)} ${f(-r * 0.12)} ${f(-r * 0.12)} ${f(-r * 0.2)} 0 ${-r}Z" fill="${fill}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;

// One eye tile from the eye wall, drawn as a square with a live iris (data-eye).
const eyeTile = (x, y, size, rot, n, i) => {
  const t = tile(n, 5, []), b = t.ball, ir = b.iris;
  const clip = b.shape === 'almond' ? '<path d="M8 50 Q50 8 92 50 Q50 92 8 50Z"/>' : `<circle cx="${b.cx}" cy="${b.cy}" r="${b.r}"/>`;
  return `<g class="fb-piece fb-tile" style="--i:${i}" transform="translate(${x} ${y}) rotate(${rot})">
    <svg x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" viewBox="0 0 100 100" overflow="visible">
      <rect width="100" height="100" fill="${t.bg}" stroke="${INK}" stroke-width="5"/>${t.art}
      <clipPath id="fb-c${n}">${clip}</clipPath>
      <g clip-path="url(#fb-c${n})"><g class="fb-iris" data-eye="1" data-cx="${b.cx}" data-cy="${b.cy}" data-travel="${(b.shape === 'almond' ? b.ry : b.r) - ir}">
        <svg x="${b.cx - ir}" y="${b.cy - ir}" width="${ir * 2}" height="${ir * 2}" ${t.iris.slice(4)}
      </g></g>
    </svg></g>`;
};

/** The whole scene. `logo` = { icon: <svg…>, word: <svg…> } markup, recoloured by the caller. */
export function bannerMarkup(logo) {
  const { w: W, h: H } = VIEW;
  let s = `<rect width="${W}" height="${H}" fill="${PAL.cyan}"/>`;
  // Sun: a target eye, low in the sky.
  s += `<g class="fb-piece fb-sun" style="--i:2" transform="translate(1262 88) scale(0.86)">
    <circle r="64" fill="${PAL.yellow}" stroke="${INK}" stroke-width="5"/><circle r="46" fill="none" stroke="${INK}" stroke-width="4"/>
    <circle r="30" fill="${PAL.white}" stroke="${INK}" stroke-width="4"/>
    <g class="fb-iris" data-eye="1" data-cx="0" data-cy="0" data-travel="14" data-abs="1"><circle r="14" fill="${INK}"/><circle cx="-5" cy="-5" r="4" fill="${PAL.white}"/></g></g>`;
  // Hills of leaves on both sides (behind the tiles).
  const L = [
    [-10, 300, 230, -38, '#1E6B3B'], [40, 420, 260, -62, '#5D6B2A'], [150, 410, 200, -95, PAL.acid], [-30, 150, 200, 8, '#9BC23C'],
    [1610, 300, 230, -142, '#1E6B3B'], [1560, 420, 260, -118, '#5D6B2A'], [1450, 410, 200, -85, PAL.acid], [1630, 150, 200, 172, '#9BC23C'],
    [330, 430, 150, -70, '#1E6B3B'], [1270, 430, 150, -110, '#9BC23C'],
  ];
  s += L.map(([x, y, len, rot, fill], k) => leaf(x, y, len, rot, fill, 3 + k)).join('');
  // Waves along the bottom.
  let waves = '';
  for (let row = 0; row < 3; row++) {
    const y = 360 + row * 22;
    let d = `M0 ${y}`;
    for (let x = 0; x < W; x += 40) d += ` q 10 -10 20 0 t 20 0`;
    waves += `<path d="${d}" fill="none" stroke="${row % 2 ? PAL.ivory : INK}" stroke-width="4" stroke-linecap="round"/>`;
  }
  s += `<g class="fb-piece fb-sea" style="--i:1"><rect y="342" width="${W}" height="${H - 342}" fill="${PAL.blue}"/>${waves}<path d="M0 342 H${W}" stroke="${INK}" stroke-width="5"/></g>`;
  // Eye tiles (from the wall), the hero's pink dot and arrow, sparkles.
  s += eyeTile(190, 150, 120, -9, 3, 14) + eyeTile(310, 268, 96, 7, 11, 15) + eyeTile(1405, 140, 124, 10, 6, 16) + eyeTile(1280, 262, 92, -6, 17, 17);
  s += `<g class="fb-piece" style="--i:18" transform="translate(330 70)"><circle r="26" fill="${PAL.pink}" stroke="${INK}" stroke-width="5"/></g>`;
  s += `<g class="fb-piece" style="--i:19" transform="translate(1100 300) rotate(-162)"><path d="M0 -24 L70 0 L0 24 L16 0Z" fill="${PAL.yellow}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/></g>`;
  s += sparkle(1210, 330, 18, PAL.ivory, 20) + sparkle(470, 300, 14, PAL.ivory, 21) + sparkle(1520, 40, 16, PAL.yellow, 22) + sparkle(70, 40, 13, PAL.ivory, 23);
  // The logo: icon + wordmark, ivory with a black sticker shadow, centred.
  const h = 168, iw = h * 728 / 966, ww = h * 658.03 / 176, gap = 38, total = iw + gap + ww, x0 = (W - total) / 2, y0 = Math.round((342 - h) / 2);
  const place = (svg, x, wd) => svg.replace(/^<svg[^>]*?viewBox="([^"]+)"[^>]*>/, (m, vb) => `<svg x="${f(x)}" y="${y0}" width="${f(wd)}" height="${h}" viewBox="${vb}">`);
  // The logo as it is: solid black, no outline or shadow, so the serif reads cleanly on the sky.
  const dark = (svg) => svg.replace(/fill="currentColor"/g, `fill="${INK}"`);
  s += `<g class="fb-piece fb-logo" style="--i:0">${place(dark(logo.icon), x0, iw)}${place(dark(logo.word), x0 + iw + gap, ww)}</g>`;
  return s;
}

/* ---------- The page ---------- */
const host = typeof document !== 'undefined' && document.querySelector('.fb-scene');
if (host) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icon = document.querySelector('#fb-icon-src').innerHTML.trim(), word = document.querySelector('#fb-word-src').innerHTML.trim();
  host.innerHTML = bannerMarkup({ icon, word });
  const banner = host.closest('.fb');
  if ('IntersectionObserver' in window) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { banner.classList.add('is-in'); o.disconnect(); } }, { threshold: 0.25 }).observe(banner);
  else banner.classList.add('is-in');
  // The eyes follow the pointer, each from where it sits.
  if (!reduce) {
    const eyes = [...host.querySelectorAll('[data-eye]')];
    let queued = false, px = 0, py = 0;
    const aim = () => {
      queued = false;
      for (const e of eyes) {
        const r = e.parentNode.getBoundingClientRect?.() || e.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260) * +e.dataset.travel;
        e.setAttribute('transform', `translate(${f(dx / d * k)} ${f(dy / d * k)})`);
      }
    };
    addEventListener('pointermove', (ev) => { px = ev.clientX; py = ev.clientY; if (!queued) { queued = true; requestAnimationFrame(aim); } }, { passive: true });
  }
}
