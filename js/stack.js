// WHAT WE DO, the stack of cards (css/lab.css). The stacking itself is plain CSS (position: sticky); this
// only feeds each card two numbers while the section is on screen:
//   --enter  0 → 1  as the card rises from the bottom of the screen to where it sticks (Girgit climbs in)
//   --cover  0 → 1  as the next card slides over it (it shrinks back, tilts and darkens)
// Nothing is locked or pinned, and with reduced motion this does nothing.

const section = document.querySelector('.sk');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduce) {
  const cards = [...section.querySelectorAll('.sk-card')];
  const inners = cards.map((c) => c.querySelector('.sk-in'));
  const last = cards.map(() => ({ enter: -1, cover: -1 }));
  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  let sticks = [], raf = 0, live = false;

  // Where each card sticks, in px from the top of the screen (the css top, resolved).
  const measure = () => { sticks = cards.map((c) => parseFloat(getComputedStyle(c).top) || 0); };

  const tick = () => {
    raf = 0;
    const vh = innerHeight;
    const rects = cards.map((c) => c.getBoundingClientRect());
    cards.forEach((c, k) => {
      const r = rects[k];
      const enter = clamp((vh - r.top) / Math.max(1, vh - sticks[k]));
      let cover = 0;
      const n = rects[k + 1];
      if (n) cover = clamp((r.bottom - n.top) / Math.max(1, r.bottom - sticks[k + 1]));
      const e = Math.round(enter * 1000) / 1000, v = Math.round(cover * 1000) / 1000;
      if (e !== last[k].enter) { last[k].enter = e; inners[k].style.setProperty('--enter', e); }
      if (v !== last[k].cover) { last[k].cover = v; inners[k].style.setProperty('--cover', v); }
    });
  };
  const ask = () => { if (live && !raf) raf = requestAnimationFrame(tick); };

  new IntersectionObserver(([en]) => { live = en.isIntersecting; if (live) { measure(); ask(); } }, { rootMargin: '20% 0px' }).observe(section);
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', () => { measure(); ask(); });
  measure(); tick();
}
