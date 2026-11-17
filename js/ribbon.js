// The ribbon between the hero and the work: two tapes crossed over the seam between the two sections,
// an acid one and a black one, the words running opposite ways on each. They react to the scroll:
// scrolling speeds them up, and scrolling back up turns them round. Reduced motion: they hold still.
// Without JS the plain ticker band in the markup stays as it is.

const band = document.querySelector('.wv-band-wrap');
if (band) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const words = [...band.querySelectorAll('.ticker-track span')].map((s) => s.textContent.trim()).filter((t) => t && t !== '✦');
  const unique = [...new Set(words)];

  const tape = (cls, list) => {
    const el = document.createElement('div');
    el.className = `tape ${cls}`;
    const track = document.createElement('div');
    track.className = 'tape-track';
    // Two identical halves, so moving the track by exactly one half loops without a seam.
    const half = () => {
      const h = document.createElement('div'); h.className = 'tape-half';
      // Enough words to fill the widest screens.
      for (let r = 0; r < 3; r++) for (const w of list) {
        const s = document.createElement('span'); s.textContent = w; h.append(s);
        const star = document.createElement('span'); star.className = 'tape-star'; star.textContent = '✦'; h.append(star);
      }
      return h;
    };
    track.append(half(), half());
    el.append(track);
    return { el, track };
  };
  const a = tape('tape--a', unique);
  const b = tape('tape--b', [...unique].reverse());
  band.className = 'tapes';
  band.replaceChildren(b.el, a.el);

  if (!reduce) {
    const SPEED = 60;   // px per second at rest
    const anims = [];
    const start = () => {
      anims.forEach((x) => x.cancel()); anims.length = 0;
      for (const [t, dir] of [[a, -1], [b, 1]]) {
        const w = t.track.firstElementChild.getBoundingClientRect().width || 1200;
        const from = dir < 0 ? 0 : -w, to = dir < 0 ? -w : 0;
        anims.push(t.track.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], { duration: (w / SPEED) * 1000, iterations: Infinity }));
      }
    };
    start();
    document.fonts?.ready.then(start);
    addEventListener('resize', () => { clearTimeout(start.t); start.t = setTimeout(start, 200); }, { passive: true });

    // Scroll: a burst of speed that eases back to rest; scrolling up runs them backwards.
    let lastY = scrollY, lastT = performance.now(), boost = 0, dir = 1, raf = 0, visible = true;
    const settle = () => {
      boost *= 0.92;
      if (boost < 0.02) boost = 0;
      const rate = dir * (1 + boost);
      anims.forEach((x) => { x.playbackRate = rate; });
      raf = boost > 0 ? requestAnimationFrame(settle) : 0;
    };
    addEventListener('scroll', () => {
      if (!visible) { lastY = scrollY; return; }
      const now = performance.now(), dy = scrollY - lastY, dt = Math.max(16, now - lastT);
      lastY = scrollY; lastT = now;
      if (Math.abs(dy) < 1) return;
      dir = dy > 0 ? 1 : -1;
      boost = Math.min(5, boost + (Math.abs(dy) / dt) * 0.9);
      if (!raf) raf = requestAnimationFrame(settle);
    }, { passive: true });
    // Off screen: paused.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        anims.forEach((x) => (visible ? x.play() : x.pause()));
      }, { rootMargin: '120px 0px' }).observe(band);
    }
  }
}
