// FOOTER BANNER — a framed, flat-vector scene that closes the page: cyan sky, eye tiles from the eye
// wall, the hero's pink dot and arrow, with the full Girgit Labs logo (icon + wordmark, dark) at the
// centre. Thick black outlines and flat colour, the same language as the hero collage and the eye wall.
// bannerMarkup() is pure (Node render checks draw the same thing); the page part makes the eyes
// follow the pointer and pops the pieces in when the footer is seen.
import { tile, PAL } from './eye-tiles.js?v=3.1.0';

export const VIEW = { w: 1600, h: 420 };
const INK = '#111111';
const f = (n) => (Math.round(n * 10) / 10).toString();

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
  // Eye tiles (from the wall), the hero's pink dot and arrow.
  s += eyeTile(190, 150, 120, -9, 3, 14) + eyeTile(310, 268, 96, 7, 11, 15) + eyeTile(1405, 140, 124, 10, 6, 16) + eyeTile(1280, 262, 92, -6, 17, 17);
  s += `<g class="fb-piece" style="--i:18" transform="translate(330 70)"><circle r="26" fill="${PAL.pink}" stroke="${INK}" stroke-width="5"/></g>`;
  s += `<g class="fb-piece" style="--i:19" transform="translate(1100 300) rotate(-162)"><path d="M0 -24 L70 0 L0 24 L16 0Z" fill="${PAL.yellow}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/></g>`;
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
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { banner.classList.add('is-in'); o.disconnect(); } }, { threshold: 0.25 }).observe(banner);
  } else banner.classList.add('is-in');
  // The eyes follow the pointer, each from where it sits. Cached on scroll/resize for 120fps smoothness.
  if (!reduce) {
    const eyes = [...host.querySelectorAll('[data-eye]')];
    let queued = false, px = 0, py = 0, eyeData = [];
    const measureEyes = () => {
      eyeData = eyes.map((e) => {
        const r = e.parentNode.getBoundingClientRect?.() || e.getBoundingClientRect();
        return { el: e, cx: r.left + r.width / 2, cy: r.top + r.height / 2, travel: +e.dataset.travel };
      });
    };
    measureEyes();
    addEventListener('resize', measureEyes, { passive: true });
    addEventListener('scroll', measureEyes, { passive: true });

    const aim = () => {
      queued = false;
      for (let i = 0; i < eyeData.length; i++) {
        const item = eyeData[i];
        const dx = px - item.cx, dy = py - item.cy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260) * item.travel;
        item.el.setAttribute('transform', `translate(${f(dx / d * k)} ${f(dy / d * k)})`);
      }
    };
    addEventListener('pointermove', (ev) => { px = ev.clientX; py = ev.clientY; if (!queued) { queued = true; requestAnimationFrame(aim); } }, { passive: true });
  }
}
