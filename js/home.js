// HOME, the hero: "WE DESIGN ___." Every few seconds (or on a click or tap anywhere in the hero, or on
// Girgit) the next state takes over: the new colour floods the hero in a circle spreading from Girgit or
// from the click, the text flips to whichever ink reads on it, the word scrambles into the next one,
// Girgit turns the colour that clashes with the background and hops, and the props bounce. On a fine
// pointer, Girgit leans toward it and the props drift with it.
// The cycle runs only while the hero is on screen and the tab is visible. Reduced motion: no cycling, no
// scramble, no flood; a click still changes the state, instantly. No JS: the first state, still.

const hero = document.querySelector('.hx');

// [word, background, ink, Girgit's filter (on his lime render): always the clashing colour]
const STATES = [
  ['websites.', '#43FF18', '#111111', 'hue-rotate(250deg) saturate(1.05)'],                  // acid, Girgit pink
  ['brands.', '#FF168C', '#111111', 'hue-rotate(28deg) saturate(1.35)'],                      // pink, Girgit acid
  ['products.', '#173BFF', '#F4EFE5', 'hue-rotate(-22deg) saturate(1.3) brightness(1.1)'],     // blue, Girgit yellow
  ['apps.', '#FFE500', '#111111', 'hue-rotate(150deg) saturate(1.2) brightness(0.8)'],        // yellow, Girgit blue
  ['films.', '#111111', '#F4EFE5', 'hue-rotate(0deg)'],                                        // black, Girgit lime
];
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+?!';

if (hero) {
  const flood = hero.querySelector('.hx-flood');
  const word = hero.querySelector('.hx-word');
  const now = hero.querySelector('.hx-now');
  const girgit = hero.querySelector('.hx-girgit');
  const stage = hero.querySelector('.hx-stage');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EVERY = 3000;
  let i = 0, timer = 0, visible = true, busy = false, scrambleRaf = 0;

  // The word settles left to right; the letters not yet settled flicker through random glyphs.
  const scramble = (target) => {
    cancelAnimationFrame(scrambleRaf);
    if (reduce) { word.textContent = target; return; }
    const start = performance.now(), DUR = 560;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / DUR), settled = Math.floor(k * target.length);
      word.textContent = target.slice(0, settled) + [...target.slice(settled)].map((c) => (c === '.' ? '.' : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
      if (k < 1) scrambleRaf = requestAnimationFrame(tick);
    };
    scrambleRaf = requestAnimationFrame(tick);
  };

  const paint = (s) => {
    hero.style.setProperty('--bg', s[1]);
    hero.style.setProperty('--fg', s[2]);
    hero.style.setProperty('--gf', s[3]);
  };

  const go = (n, from) => {
    if (busy) return;
    const next = ((n % STATES.length) + STATES.length) % STATES.length, s = STATES[next];
    i = next;
    now.textContent = String(i + 1).padStart(2, '0');
    scramble(s[0]);
    girgit.classList.remove('is-changing'); void girgit.offsetWidth; girgit.classList.add('is-changing');
    hero.classList.remove('is-bumping'); void hero.offsetWidth; hero.classList.add('is-bumping');
    if (reduce || !flood.animate) { paint(s); return; }
    // The flood: a circle of the new colour from the origin until it covers the hero, then it becomes the hero.
    const r = hero.getBoundingClientRect(), g = girgit.getBoundingClientRect();
    const x = from ? from.x - r.left : g.left + g.width / 2 - r.left;
    const y = from ? from.y - r.top : g.top + g.height * 0.45 - r.top;
    const R = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
    busy = true;
    flood.style.background = s[1];
    setTimeout(() => hero.style.setProperty('--fg', s[2]), 260);              // the ink flips as the flood passes
    hero.style.setProperty('--gf', s[3]);
    const anim = flood.animate(
      [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${R}px at ${x}px ${y}px)` }],
      { duration: 720, easing: 'cubic-bezier(0.7, 0, 0.2, 1)', fill: 'forwards' },
    );
    anim.onfinish = () => { paint(s); anim.cancel(); busy = false; };
  };

  const stop = () => { clearInterval(timer); timer = 0; };
  const run = () => {
    stop();
    if (!reduce && visible && !document.hidden) timer = setInterval(() => go(i + 1), EVERY);
  };

  // A click or tap anywhere in the hero that isn't a link: the next colour, from right there.
  hero.addEventListener('click', (e) => {
    if (e.target.closest('a, .hx-ticker')) return;
    const onGirgit = e.target.closest('.hx-girgit');
    go(i + 1, onGirgit || !e.clientX ? null : { x: e.clientX, y: e.clientY });
    hero.classList.add('was-tapped');
    run();
    try { window.posthog?.capture('hero_colour', { to: STATES[i][0], by: onGirgit ? 'girgit' : 'hero' }); } catch { /* fine */ }
  });
  girgit.addEventListener('animationend', () => girgit.classList.remove('is-changing'));
  hero.addEventListener('animationend', (e) => { if (e.animationName === 'hx-bump') hero.classList.remove('is-bumping'); });
  setTimeout(() => hero.classList.add('is-ready'), 1700);

  // Fine pointers: Girgit leans toward the pointer, the props drift with it.
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    let raf = 0;
    hero.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = stage.getBoundingClientRect();
        const px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 0.9)));
        const py = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 0.9)));
        stage.style.setProperty('--px', px.toFixed(3));
        stage.style.setProperty('--py', py.toFixed(3));
      });
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { stage.style.setProperty('--px', 0); stage.style.setProperty('--py', 0); });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }, { threshold: 0.2 }).observe(hero);
  }
  document.addEventListener('visibilitychange', run);
  run();
}
