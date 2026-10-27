// SECTION 01 — the split-screen hero.
// Left: an SVG collage choreographed with GSAP. Right: Girgit observes.
// Girgit is a STILL 3D render: only the pupils are live (vector pupils clipped to the
// render's own eye whites), plus breathing and small whole-figure turns. It is not a
// rigged model, so there is no limb, head-bone or tail animation here.
//
// Timeline: 0–0.7s establish both worlds · 0.7–1.5s the chaos intensifies while Girgit
// watches · 1.5–2s everything resolves into a composed poster · ~2s an acid wipe reveals
// YOU MISSED IT. / WE DIDN'T. · then a calm idle and a scroll hand-off to Section 02.

const hero = document.querySelector('.sh');
if (hero) init();

function init() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsap = window.gsap;
  const el = (n) => hero.querySelector(`[data-el="${n}"]`);
  const figure = hero.querySelector('[data-figure]');
  const stage = hero.querySelector('.sh-stage');
  const lines = [...hero.querySelectorAll('.sh-line')];
  const wipe = hero.querySelector('.sh-wipe');
  const eyes = [...hero.querySelectorAll('.sh-eye')].map((e) => ({ node: e, pupil: e.querySelector('.sh-pupil'), far: e.dataset.eye === 'far' }));
  const [near, far] = eyes;
  const setState = (s) => { hero.dataset.state = s; };

  /* ---------- Eyes: each pupil moves on its own ---------- */
  const look = (eye, nx, ny) => {
    const m = eye.far ? 24 : 30;                       // % of the eye box the pupil may travel
    eye.pupil.style.setProperty('--px', `${(nx * m).toFixed(1)}%`);
    eye.pupil.style.setProperty('--py', `${(ny * m).toFixed(1)}%`);
  };
  const lookAt = (eye, x, y) => {
    const r = eye.node.getBoundingClientRect();
    const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / 260);
    look(eye, (dx / d) * k, (dy / d) * k);
  };
  const lookAtEl = (eye, node) => {
    if (!node) return;
    const r = node.getBoundingClientRect();
    lookAt(eye, r.left + r.width / 2, r.top + r.height / 2);
  };
  const turn = (deg) => figure.style.setProperty('--turn', `${deg}deg`);

  /* ---------- Idle: calm chaos, an observer that keeps watching ---------- */
  const idleTweens = [];
  let pointer = null, saccade = 0;
  function startIdle() {
    setState('idle');
    if (gsap && !reduce) {
      idleTweens.push(
        gsap.to(el('checker'), { rotation: '+=5', duration: 7, yoyo: true, repeat: -1, ease: 'sine.inOut' }),
        gsap.to(el('pink'), { scale: 1.035, duration: 2.8, yoyo: true, repeat: -1, ease: 'sine.inOut' }),
        gsap.to(el('eye'), { rotation: 360, duration: 48, repeat: -1, ease: 'none' }),
        gsap.to(el('ring'), { y: -14, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' }),
      );
    }
    if (reduce) return;
    addEventListener('pointermove', (e) => { pointer = { x: e.clientX, y: e.clientY }; }, { passive: true });
    // One shared loop: the near eye follows the pointer (or glances at the collage);
    // the far eye scans on its own rhythm. Paused while the hero is off screen.
    const targets = ['pink', 'arrow', 'blue', 'scales', 'checker', 'ring'];
    let t0 = performance.now(), running = true, raf = 0;
    const tick = (now) => {
      if (!running) return;
      if (pointer) {
        lookAt(near, pointer.x, pointer.y);
        const r = hero.getBoundingClientRect();
        turn(Math.max(-3, Math.min(3, ((pointer.x - (r.left + r.width * 0.75)) / r.width) * 6)));
      } else if (now - t0 > 1700) {
        lookAtEl(near, el(targets[Math.floor(now / 1700) % targets.length]));
        t0 = now;
      }
      if (now > saccade) {
        saccade = now + 700 + ((now * 7) % 1600);    // deterministic, uneven rhythm
        look(far, ((now * 13) % 200) / 100 - 1, ((now * 29) % 140) / 100 - 0.7);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        running = en.isIntersecting;
        idleTweens.forEach((tw) => (running ? tw.resume() : tw.pause()));
        if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
      }).observe(hero);
    }
  }

  /* ---------- No GSAP or reduced motion: the composed final state, still ---------- */
  if (reduce || !gsap) {
    look(near, -0.5, 0.05);
    look(far, -0.4, 0.1);
    startIdle();
    return;
  }

  /* ---------- The two-second reveal ---------- */
  const all = ['checker', 'blue', 'hazard', 'pink', 'scales', 'dots', 'arrow', 'eye', 'marks', 'ring', 'pupil'].map(el);
  gsap.set(all, { transformOrigin: '50% 50%' });
  gsap.set(wipe, { scaleX: 0 });          // explicit start, so the wipe can never flash in early
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

  // 0–0.7s: establish both worlds.
  tl.from(el('checker'), { x: -320, rotation: -25, duration: 0.55 }, 0)
    .from(el('blue'), { y: -720, duration: 0.5 }, 0.05)
    .from(el('pink'), { scale: 0, duration: 0.6, ease: 'back.out(2)' }, 0.1)
    .from(el('hazard'), { x: 720, duration: 0.45 }, 0.2)
    .from(el('eye'), { scale: 0, rotation: -90, duration: 0.5, ease: 'back.out(1.6)' }, 0.25)
    .from(el('scales'), { x: 300, y: 220, duration: 0.5 }, 0.3)
    .from(el('arrow'), { x: -280, duration: 0.4 }, 0.35)
    .from([el('dots'), el('marks'), el('ring')], { opacity: 0, scale: 0.4, duration: 0.35, stagger: 0.06 }, 0.4)
    .from(stage, { y: 40, opacity: 0, duration: 0.6, ease: 'power3.out' }, 0)
    .call(() => { look(near, -0.8, 0); look(far, -0.6, -0.2); }, null, 0.3);

  // 0.7–1.5s: the chaos intensifies; Girgit's eyes dart after it, independently.
  tl.to(el('pink'), { scale: 1.25, duration: 0.18, yoyo: true, repeat: 3, ease: 'power2.inOut' }, 0.7)
    .to(el('checker'), { rotation: '+=24', x: 60, duration: 0.8, ease: 'power1.inOut' }, 0.7)
    .to(el('blue'), { x: -150, duration: 0.25, yoyo: true, repeat: 2, ease: 'power3.inOut' }, 0.72)
    .to(el('arrow'), { x: 72, duration: 0.12, yoyo: true, repeat: 5, ease: 'power2.out' }, 0.75)
    .to(el('hazard'), { x: -130, rotation: 6, duration: 0.7, ease: 'none' }, 0.7)
    .to(el('eye'), { rotation: 200, duration: 0.8, ease: 'power2.inOut' }, 0.7)
    .to(el('pupil'), { x: 40, y: -22, duration: 0.1, yoyo: true, repeat: 5, ease: 'power2.inOut' }, 0.8)
    .to(el('scales'), { x: -80, y: -40, rotation: -12, duration: 0.35, yoyo: true, repeat: 1, ease: 'power2.inOut' }, 0.8)
    .to(el('ring'), { x: 200, y: -250, scale: 1.6, duration: 0.6, ease: 'power2.inOut' }, 0.8)
    .to(el('dots'), { x: 120, y: 330, duration: 0.5, ease: 'power3.inOut' }, 0.85);
  [[0.75, near, 'pink'], [0.8, far, 'checker'], [0.95, near, 'arrow'], [1.05, far, 'ring'],
   [1.15, near, 'blue'], [1.25, far, 'eye'], [1.32, near, 'scales']].forEach(([t, eye, n]) => tl.call(() => lookAtEl(eye, el(n)), null, t));
  tl.call(() => turn(-3), null, 0.9);

  // 1.5–2s: everything snaps back into the composed poster; the observer settles.
  tl.to(all, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: 0.42, stagger: 0.02 }, 1.5)
    .call(() => { look(near, -0.35, 0.1); look(far, -0.25, 0.15); turn(0); }, null, 1.6)
    .call(() => setState('title'), null, 1.85);

  // ~2s: a sharp acid wipe across both worlds reveals the headline.
  tl.to(wipe, { scaleX: 1, transformOrigin: 'left center', duration: 0.2, ease: 'power4.in' }, 1.95)
    .set(lines, { visibility: 'visible' }, 2.15)
    .to(wipe, { scaleX: 0, transformOrigin: 'right center', duration: 0.26, ease: 'power4.out' }, 2.15)
    .call(startIdle, null, 2.45);

  /* ---------- Scroll hand-off: the chaos folds away, Girgit walks off left into Section 02 ---------- */
  const ST = window.ScrollTrigger;
  if (ST) {
    gsap.registerPlugin(ST);
    gsap.matchMedia().add('(min-width: 761px)', () => {
      const out = gsap.timeline({
        scrollTrigger: { trigger: hero, start: () => `top ${hero.offsetTop}`, end: 'bottom top', scrub: 0.6 },
      });
      out.to('.sh-title', { yPercent: -70, opacity: 0, ease: 'none', duration: 0.4 }, 0)
        .to('.sh-scroll', { opacity: 0, duration: 0.2 }, 0)
        .to(hero, { '--split': '0%', ease: 'none', duration: 1 }, 0)
        .to(stage, { xPercent: -55, yPercent: 14, scale: 0.84, ease: 'none', duration: 1 }, 0);
      return () => out.kill();
    });
  }
}
