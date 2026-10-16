/* Girgit Labs — the film
   One continuous 12-second shot pinned behind the page. Scrolling moves through it:
   each section owns a stretch of film (data-film="start,end", in seconds), and the
   page scroll between section tops is mapped onto that stretch.

   Contrast: two layers sit between the film and the text.
   - .film__veil: a constant wash, darker on the left where the copy sits.
   - .film__dim: follows the film's own brightness (measured per frame, below), so
     the bright moments (sunrise, the forest vista) are held down automatically.
   Text blocks that need more help sit on frosted .glass panels.

   Reduced motion: the film doesn't scrub; each section shows its own still moment. */
(() => {
  'use strict';

  const video = document.querySelector('.film__video');
  if (!video) return;
  const film = video.closest('.film');
  const dimEl = film.querySelector('.film__dim');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const portrait = window.matchMedia('(max-aspect-ratio: 4/5)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // Mean brightness of the left 42% of the frame (0–255), sampled 6 times a second.
  // Measured from the source film; the left side is where the copy sits.
  const LEFT_LUMA = [27,31,33,37,38,42,43,53,58,67,75,82,89,93,96,99,105,115,126,134,132,121,101,84,73,72,73,83,96,104,103,103,96,91,82,76,72,69,67,65,65,67,65,63,59,50,47,50,49,49,55,59,65,71,74,76,78,78,76,73,69,62,56,49,43,37,32,26,23,21,20,18];
  const lumaAt = (t) => { const i = clamp(t * 6, 0, LEFT_LUMA.length - 1), a = Math.floor(i), b = Math.min(a + 1, LEFT_LUMA.length - 1); return LEFT_LUMA[a] + (LEFT_LUMA[b] - LEFT_LUMA[a]) * (i - a); };

  /* ---------- Source: landscape or portrait crop ---------- */
  const pickSource = () => {
    const want = portrait.matches ? video.dataset.srcPortrait : video.dataset.src;
    if (video.dataset.current === want) return;
    video.dataset.current = want;
    video.poster = portrait.matches ? video.dataset.posterPortrait : 'assets/video/poster.jpg';
    video.src = want;
    video.load();
  };
  pickSource();
  portrait.addEventListener('change', pickSource);

  let duration = 12;
  video.addEventListener('loadedmetadata', () => { duration = video.duration || 12; });
  video.addEventListener('loadeddata', () => film.classList.add('is-ready'));

  // iOS only paints seeks once the video has been "played" by a gesture
  const unlock = () => {
    const p = video.play();
    if (p && p.then) p.then(() => video.pause()).catch(() => {});
    ['touchstart', 'pointerdown', 'keydown'].forEach((e) => window.removeEventListener(e, unlock));
  };
  ['touchstart', 'pointerdown', 'keydown'].forEach((e) => window.addEventListener(e, unlock, { passive: true }));

  /* ---------- Scroll → film time ---------- */
  const sections = [...document.querySelectorAll('[data-film]')].map((el) => {
    const [a, b] = el.dataset.film.split(',').map(Number);
    return { el, a, b };
  });
  let anchors = [];   // [{ y, t }]: page position → film time
  const measure = () => {
    const vh = window.innerHeight;
    anchors = sections.map((s) => ({ y: s.el.getBoundingClientRect().top + window.scrollY, t: s.a }));
    anchors[0].y = 0;
    const last = sections[sections.length - 1];
    const endY = last.el.getBoundingClientRect().bottom + window.scrollY - vh;   // the film ends as the last section's bottom reaches the viewport bottom
    anchors.push({ y: Math.max(endY, anchors[anchors.length - 1].y + 1), t: last.b });
  };
  const timeFor = (y) => {
    if (y <= anchors[0].y) return anchors[0].t;
    for (let i = 1; i < anchors.length; i++) {
      if (y <= anchors[i].y) { const A = anchors[i - 1], B = anchors[i]; return A.t + (B.t - A.t) * ((y - A.y) / (B.y - A.y)); }
    }
    return anchors[anchors.length - 1].t;
  };
  const stillFor = (y) => {           // reduced motion: the middle of the section you're in
    let s = sections[0];
    sections.forEach((x) => { if (x.el.getBoundingClientRect().top < window.innerHeight * 0.5) s = x; });
    return (s.a + s.b) / 2;
  };

  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);

  /* ---------- Hero parallax ----------
     While the hero is pinned, its layers drift up at different rates and fade,
     and the film pushes in slightly, like the camera leaning forward. */
  const hero = document.querySelector('.hero');
  const layers = [...document.querySelectorAll('[data-parallax]')].map((el) => ({ el, k: parseFloat(el.dataset.parallax) || 0 }));
  let heroSpan = 1, py = 0;
  const measureHero = () => { if (hero) heroSpan = Math.max(1, hero.offsetHeight - window.innerHeight); };
  measureHero();
  window.addEventListener('resize', measureHero);
  const parallax = (y) => {
    if (reduce || !hero) return;
    py += (y - py) * 0.18;                                  // a touch of inertia
    const p = clamp(py / heroSpan, 0, 1.4);
    const vh = window.innerHeight;
    layers.forEach(({ el, k }) => {
      el.style.transform = `translate3d(0, ${(-py * k).toFixed(1)}px, 0)`;
      el.style.opacity = clamp(1 - (py * (0.6 + k)) / (vh * 0.95), 0, 1).toFixed(3);
    });
    video.style.transform = `scale(${(1.08 - 0.08 * clamp(p, 0, 1)).toFixed(4)})`;
  };

  /* ---------- Loop: ease toward the scroll position ---------- */
  let shown = 0;
  const frame = () => {
    const y = window.scrollY;
    const target = clamp(reduce ? stillFor(y) : timeFor(y), 0, duration - 0.05);
    shown = reduce ? target : shown + (target - shown) * 0.14;
    if (video.readyState >= 2 && !video.seeking && Math.abs(video.currentTime - shown) > 1 / 60) {
      video.currentTime = shown;
    }
    // keep the copy readable: hold bright moments down
    const l = lumaAt(shown);
    dimEl.style.opacity = clamp(0.12 + (l - 35) / 150, 0.12, 0.62).toFixed(3);
    parallax(y);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
