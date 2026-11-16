// EYE TILES ELSEWHERE. The eye wall's tiles (js/eye-tiles.js, styled by css/eyes.css) as small framed
// clusters in the sections that ask for attention: peeking over the work, beside the client quotes, on
// the open slot, over who we're for. Each tile keeps its own wandering glance and blink; on top of that,
// when the pointer comes near a cluster, its eyes all turn to look at it (on touch screens: at the tap,
// for a moment). A cluster marked data-asleep keeps its lids shut.
// Markup: <span class="eye-cluster" data-eye-tiles="3" data-seed="101" [data-cols="2"] [data-asleep]>.
import { tile, tileMarkup } from './eye-tiles.js?v=3.1.0';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clusters = [];

for (const host of document.querySelectorAll('[data-eye-tiles]')) {
  const n = Number(host.dataset.eyeTiles) || 3, seed = Number(host.dataset.seed) || 1;
  const cols = Number(host.dataset.cols) || n, taken = [];
  host.style.setProperty('--cols', cols);
  host.innerHTML = Array.from({ length: n }, (_, k) => {
    const t = tile(seed + k, cols, taken);
    if (host.hasAttribute('data-asleep')) t.blink = t.blink || 7;      // a lid to keep shut (and a slow blink once awake)
    return tileMarkup(t);
  }).join('');
  const item = { host, tiles: [...host.children], visible: false, aimed: false };
  clusters.push(item);
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { item.visible = e.isIntersecting; }).observe(host);
  else item.visible = true;
}

if (clusters.length && !reduce) {
  let raf = 0, px = 0, py = 0, touchUntil = 0;
  const look = () => {
    raf = 0;
    const now = performance.now();
    for (const c of clusters) {
      if (!c.visible || c.host.hasAttribute('data-asleep')) continue;
      const r = c.host.getBoundingClientRect();
      const near = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2)) < Math.max(420, r.width * 2.5);
      const on = near && (touchUntil === 0 || now < touchUntil);
      for (const t of c.tiles) {
        if (!on) { t.style.removeProperty('--ax'); t.style.removeProperty('--ay'); continue; }
        const tr = t.getBoundingClientRect();
        const dx = px - (tr.left + tr.width / 2), dy = py - (tr.top + tr.height / 2), d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / (tr.width * 1.5)) * 18;                  // up to 18% of the eyeball
        t.style.setProperty('--ax', `${((dx / d) * k).toFixed(1)}%`);
        t.style.setProperty('--ay', `${((dy / d) * k).toFixed(1)}%`);
      }
    }
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(look); };
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; px = e.clientX; py = e.clientY; touchUntil = 0; queue(); }, { passive: true });
  addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    px = e.clientX; py = e.clientY; touchUntil = performance.now() + 1600;
    queue(); setTimeout(queue, 1650);                                     // then let them wander again
  }, { passive: true });
  addEventListener('scroll', () => { if (touchUntil === 0) queue(); }, { passive: true });
}
