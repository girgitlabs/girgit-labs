// ABOUT: the intro collage in parallax (css/about.css). Each layer has a depth (--d); this sets
// --sy (0 to 1 as the intro scrolls away) and --mx/--my (the pointer over the page, -1 to 1).
// It only works while the intro is on screen. Reduced motion: the collage stays still.

const box = document.querySelector('[data-px]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (box && !reduce) {
  const hero = box.closest('section') || box;
  let raf = 0, live = true, px = 0, py = 0;
  const draw = () => {
    raf = 0;
    const r = hero.getBoundingClientRect();
    const sy = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
    box.style.setProperty('--sy', sy.toFixed(3));
    box.style.setProperty('--mx', px.toFixed(3));
    box.style.setProperty('--my', py.toFixed(3));
  };
  const ask = () => { if (live && !raf) raf = requestAnimationFrame(draw); };
  addEventListener('scroll', ask, { passive: true });
  if (matchMedia('(hover: hover)').matches) {
    addEventListener('pointermove', (e) => { px = (e.clientX / innerWidth) * 2 - 1; py = (e.clientY / innerHeight) * 2 - 1; ask(); }, { passive: true });
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { live = en.isIntersecting; if (live) ask(); }).observe(hero);
  draw();
}
