// SECTION 02 — the Adaptation Laboratory: the page side of js/lab-scene.js.
// One pinned ScrollTrigger maps vertical scroll to progress p; every frame is drawn from p,
// so scrubbing back reverses it exactly. Girgit is the 2D vector rig in js/girgit.js (the
// interim for a rigged 3D model): real leg IK and walk cycle, not a moving still.
// Reduced motion or no GSAP: no pin, one composed still and the five capabilities as a list.
import { layout, rockMarkup, frame, sceneDefs, plan, GROUND } from './lab-scene.js';

const lab = document.querySelector('.lab');
if (lab) init();

function init() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsap = window.gsap, ST = window.ScrollTrigger;
  const svg = lab.querySelector('.lab-world');
  const cam = svg.querySelector('.lab-cam');
  const rocksG = svg.querySelector('.lab-rocks');
  const live = svg.querySelector('.lab-live');
  const floor = svg.querySelector('.lab-floor');
  const ticks = [...lab.querySelectorAll('.lab-progress li')];
  svg.querySelector('.lab-defs').innerHTML = sceneDefs();

  let L, last = -1;
  const build = () => {
    const r = svg.getBoundingClientRect();
    L = layout(Math.max(0.4, (r.width || 1600) / (r.height || 900)));
    rocksG.innerHTML = L.rocks.map(rockMarkup).join('');
    floor.setAttribute('x', String(-L.W));
    floor.setAttribute('width', String(L.end + L.W * 2));
    floor.setAttribute('y', String(GROUND));
    last = -1;
  };

  const draw = (p) => {
    if (Math.abs(p - last) < 0.0004) return;
    last = p;
    const f = frame(L, p);
    live.innerHTML = f.markup;
    svg.setAttribute('viewBox', `${f.camera.toFixed(1)} 0 ${L.W.toFixed(1)} 1000`);
    // Copy: the intro line until Girgit nears the first rock; then each capability as he arrives.
    const s = f.state;
    const cap = s.phase === 'react' || (s.phase === 'walk' && s.leave > 0.8) ? s.rock : -1;
    const intro = s.phase === 'intro' || (s.rock === 0 && s.phase === 'walk' && s.leave < 0.55);
    lab.dataset.cap = intro ? 'intro' : String(cap);
    ticks.forEach((t, i) => t.classList.toggle('is-on', i <= cap || (s.rock > i)));
  };

  build();

  if (reduce || !gsap || !ST) {
    // A composed still: the whole landscape, Girgit settled on the last rock.
    lab.classList.add('lab--still');
    const f = frame(L, 1);
    live.innerHTML = f.markup;
    svg.setAttribute('viewBox', `${(L.rocks[0].x0 - 200).toFixed(1)} 0 ${(L.rocks[4].x1 - L.rocks[0].x0 + 400).toFixed(1)} 1000`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');
    lab.dataset.cap = 'all';
    return;
  }

  gsap.registerPlugin(ST);
  const state = { p: 0 };
  const navH = () => document.querySelector('.nav')?.offsetHeight || 0;
  gsap.to(state, {
    p: 1, ease: 'none',
    onUpdate: () => draw(state.p),
    scrollTrigger: {
      trigger: lab,
      start: () => `top ${navH()}`,
      // Long enough to read five capabilities, short enough not to feel like a chore.
      end: () => `+=${Math.round(innerHeight * (innerWidth < 761 ? 3.2 : 4.2))}`,
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefresh: () => { build(); draw(state.p); },
    },
  });
  draw(0);

  // Progress ticks double as shortcuts: jump to the moment Girgit settles on that rock.
  ticks.forEach((t, i) => t.querySelector('button')?.addEventListener('click', () => {
    const tr = ST.getAll().find((x) => x.pin === lab);
    if (!tr) return;
    let lo = 0, hi = 1;                       // the first p where rock i's reaction is under way
    for (let n = 0; n < 24; n++) { const mid = (lo + hi) / 2; const s = plan(L, mid); (s.rock > i || (s.rock === i && s.phase === 'react' && s.r > 0.6)) ? (hi = mid) : (lo = mid); }
    scrollTo({ top: tr.start + (tr.end - tr.start) * hi, behavior: 'smooth' });
  }));
}
