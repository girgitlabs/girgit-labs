// SECTION 03 — the Hidden Girgit. The supplied clay jungle (a looping video, its still as the
// poster) with Girgit, the supplied clay render, camouflaged inside it. At first only his two
// yellow eyes stand out, and a soft torchlight follows the pointer through the dark leaves.
//
// As the visitor searches, Girgit reacts, everything eased: each eye drifts on its own, the head
// turns a little, and when the pointer comes close he ducks behind the leaves, slips (almost
// invisible) through the foliage to another hiding spot and rises again behind the leaves there.
// After about two seconds of real searching (sooner near him), a tap on him, or the button, he's
// found, in stages: his eyes flash, the leaves part one after another, his colour warms back with
// a small lift, he turns to you, and YOU FOUND US. rises word by word. No step needs a precise
// pointer: the button and the time-based reveal always work, and a hint appears if he isn't found.
import { VIEW, SPOTS, GIRGIT, placeOf, eyeAt, leavesMarkup, girgitMarkup, camoMatrix } from './jungle.js';

const section = document.querySelector('.hide');
if (section) init();

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);   // smooth in and out
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const approach = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));

function init() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = section.querySelector('.hide-stage');
  const video = section.querySelector('.hide-video');
  const svg = section.querySelector('.hide-scene');
  const hint = section.querySelector('.hide-hint');
  const button = section.querySelector('.hide-btn');
  const light = section.querySelector('.hide-light');
  svg.querySelector('.hide-front').innerHTML = leavesMarkup();
  const holder = svg.querySelector('.hide-girgit');
  holder.innerHTML = `<g class="hg-pos">${girgitMarkup()}</g>`;
  const pos = holder.querySelector('.hg-pos');
  const head = holder.querySelector('.hg-head');
  const tail = holder.querySelector('.hg-tail');
  const matrix = holder.querySelector('.hg-matrix');
  const [nearIris, farIris] = holder.querySelectorAll('.hg-iris');
  const leaves = [...svg.querySelectorAll('.leaf')];
  section.classList.add('is-live');
  // play() returns a promise in modern browsers and nothing in some older ones.
  const playVideo = () => { try { video.play?.()?.catch?.(() => {}); } catch { /* autoplay blocked: the poster stays */ } };
  if (reduce) { video.removeAttribute('autoplay'); video.pause?.(); } else playVideo();

  // The headline rises word by word on reveal (lab.css-style clipped boxes, in hide.css).
  const title = section.querySelector('.hide-title');
  title.innerHTML = title.textContent.trim().split(/\s+/).map((w, i) => `<span class="hw"><span style="--i:${i}">${w}</span></span>`).join(' ');

  /* ---------- Camera: the stage covers the section; on narrow screens it pans to follow him ---------- */
  const RATIO = VIEW.w / VIEW.h;
  let box = { w: 0, h: 0, fw: 0, fh: 0 }, camX = null;
  const measure = () => {
    const w = section.clientWidth, h = section.clientHeight;
    const fw = Math.max(w, h * RATIO);
    box = { w, h, fw, fh: fw / RATIO };
    stage.style.width = `${fw}px`; stage.style.height = `${box.fh}px`;
  };

  /* ---------- State ---------- */
  const DUCK = 0.24;                                      // how far he sinks behind the leaves (of his height)
  let spot = 0, from = { ...SPOTS[0] }, to = { ...SPOTS[0] }, moveT = 1, plan = null, cool = 0;
  let cur = { x: SPOTS[0].x, y: SPOTS[0].y, w: SPOTS[0].w }, sink = 0, fade = 1;
  let camo = 1, headRot = 0, pop = 1;
  let pointer = null, lastMove = 0, searched = 0, found = false, foundAt = 0, taps = 0, visibleFor = 0, hinted = false, searchStart = 0;
  const leafAt = leaves.map((l) => l.getAttribute('transform').match(/[-\d.]+/g).slice(0, 2).map(Number)), stirred = new Map();
  let farLook = [0, 0], farNext = 0, nearLook = [0.4, 0.05], near = [0.4, 0.05], far = [0, 0];
  let lightPos = null, lightOn = 0, lightTarget = 0;
  const setSpotLeaves = () => leaves.forEach((l) => l.classList.toggle('conceal', !found && l.dataset.spot === SPOTS[spot].id));
  setSpotLeaves();

  const toScene = (cx, cy) => {
    const r = stage.getBoundingClientRect();
    return [(cx - r.left) / (r.width || 1) * VIEW.w, (cy - r.top) / (r.height || 1) * VIEW.h];
  };
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const scale = () => cur.w / SPOTS[0].w;                 // 1 at the nearest spot

  /* ---------- Leaves: one soft, settling wobble when disturbed ---------- */
  function rustle(leaf, delay = 0) {
    if (reduce) return;
    leaf.style.setProperty('--rd', `${delay}ms`);
    leaf.classList.remove('rustle'); void leaf.getBoundingClientRect(); leaf.classList.add('rustle');
  }
  const spotLeaves = (i) => leaves.filter((l) => l.dataset.spot === SPOTS[i].id);

  /* ---------- Hiding: duck behind the leaves, slip through, rise at the farthest spot ---------- */
  function hideFrom(p) {
    if (found || moveT < 1 || cool > 0) return;
    let best = spot, farthest = -1;
    SPOTS.forEach((s, i) => { if (i !== spot && dist(eyeAt(s), p) > farthest) { farthest = dist(eyeAt(s), p); best = i; } });
    spotLeaves(spot).forEach((l, i) => rustle(l, i * 60));                 // leaving: the leaves stir over him
    const travel = 1.8 + dist([cur.x, cur.y], [SPOTS[best].x, SPOTS[best].y]) / 800;   // unhurried: he slips, never darts
    plan = { duck: 0.55, travel, rise: 0.7, total: 0.55 + travel + 0.7, arrived: false };
    spot = best; from = { ...cur }; to = { x: SPOTS[best].x, y: SPOTS[best].y, w: SPOTS[best].w }; moveT = reduce ? 1 : 0;
    if (reduce) cur = { ...to };
    setSpotLeaves();
  }

  /* ---------- Found, in stages (the CSS carries the staggered timing) ---------- */
  function reveal(how) {
    if (found) return;
    found = true; foundAt = performance.now(); pop = 0;
    section.dataset.state = 'found';
    section.classList.remove('is-hinting');
    section.classList.add('is-flash'); setTimeout(() => section.classList.remove('is-flash'), 900);
    spotLeaves(spot).forEach((l, i) => { l.style.setProperty('--pd', `${150 + i * 90}ms`); l.classList.add('part'); });
    leaves.forEach((l) => l.classList.remove('conceal'));
    const secs = searchStart ? (performance.now() - searchStart) / 1000 : 0;
    hint.textContent = how === 'button' ? 'There he is.' : secs > 0.5 ? `Found him in ${secs.toFixed(1)} seconds. Sharp eyes.` : 'There he is. You found him.';
    button.textContent = 'Hide him again';
    try { window.posthog?.capture('chameleon_found', { method: how, seconds_to_find: Number(secs.toFixed(1)) }); } catch (_) {}
  }
  function hideAgain() {
    found = false; searched = 0; taps = 0; searchStart = 0; pop = 1;
    section.dataset.state = 'search';
    leaves.forEach((l) => l.classList.remove('part'));
    hint.textContent = 'Somewhere in here is Girgit. Look for two yellow eyes.';
    button.textContent = 'Show me Girgit';
    hideFrom(pointer || eyeAt(cur));
    setSpotLeaves();
  }
  button.addEventListener('click', () => (found ? hideAgain() : reveal('button')));

  /* ---------- Input: moving the pointer is searching; a tap searches where it lands ---------- */
  section.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const p = toScene(e.clientX, e.clientY), now = performance.now();
    lightTarget = found || reduce ? 0 : 1;
    const r = section.getBoundingClientRect();
    if (!lightPos) lightPos = [e.clientX - r.left, e.clientY - r.top];
    light.dataset.x = e.clientX - r.left; light.dataset.y = e.clientY - r.top;
    if (pointer && dist(p, pointer) > 3) {
      const dt = Math.min(0.1, (now - lastMove) / 1000);
      const d = dist(p, eyeAt(cur));
      searched += dt * (d < 300 * scale() ? 2 : 1);           // real searching; twice as fast near him
      if (d < 360 * scale()) hideFrom(p);
    }
    if (!searchStart && !found) searchStart = now;
    // The leaves the cursor brushes past stir (each at most once a second).
    if (!reduce) leafAt.forEach(([lx, ly], i) => { if (Math.hypot(lx - p[0], ly - p[1]) < 170 && now - (stirred.get(i) || 0) > 1000) { stirred.set(i, now); rustle(leaves[i]); } });
    pointer = p; lastMove = now;
    if (!found && searched >= 2) reveal('search');
  });
  section.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a')) return;
    const p = toScene(e.clientX, e.clientY);
    pointer = p; lastMove = performance.now();
    if (found) return;
    const { s, left, top } = placeOf(cur);
    const onHim = p[0] > left && p[0] < left + GIRGIT.w * s && p[1] > top && p[1] < top + GIRGIT.h * s;
    if (onHim || dist(p, eyeAt(cur)) < 220 * scale()) return reveal('tap');
    leaves.map((l) => [l, l.getAttribute('transform').match(/[-\d.]+/g).map(Number)])
      .filter(([, [lx, ly]]) => Math.hypot(lx - p[0], ly - p[1]) < 340)
      .forEach(([l, [lx, ly]], i) => rustle(l, Math.hypot(lx - p[0], ly - p[1]) * 0.6 + i * 20));   // a ripple out from the tap
    taps++; searched += 0.7;
    if (taps >= 3 || searched >= 2) reveal('tap');
  });
  section.addEventListener('pointerleave', () => { pointer = null; lightTarget = 0; });

  /* ---------- The loop: everything eased ---------- */
  let running = false, raf = 0, last = 0, drawnCamo = -1;
  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    visibleFor += dt;
    if (!found && !hinted && visibleFor > 9) {              // not found yet: a nudge, and his eyes glint
      hinted = true; section.classList.add('is-hinting');
      hint.textContent = "He's close. Two yellow eyes. Or press the button.";
    }

    // Moving: duck (sink + fade into the foliage), slip across, rise behind the new leaves.
    if (moveT < 1 && plan) {
      moveT = Math.min(1, moveT + dt / plan.total);
      const t = moveT * plan.total, { duck, travel, rise } = plan;
      if (t < duck) { const k = ease(t / duck); sink = DUCK * k; fade = 1 - 0.82 * k; }
      else if (t < duck + travel) {
        const k = ease((t - duck) / travel);
        cur = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, w: from.w + (to.w - from.w) * k };
        sink = DUCK; fade = 0.18;
      } else {
        if (!plan.arrived) { plan.arrived = true; spotLeaves(spot).forEach((l, i) => rustle(l, i * 70)); }
        const k = easeOut((t - duck - travel) / rise); cur = { ...to }; sink = DUCK * (1 - k); fade = 0.18 + 0.82 * k;
      }
      if (moveT >= 1) { cool = 2.4; sink = 0; fade = 1; }
    } else cool = Math.max(0, cool - dt);

    // Found: a small lift (springs up, settles) as the colour comes back.
    if (found) pop = Math.min(1, pop + dt / 0.9);
    const lift = found ? Math.sin(Math.PI * easeOut(pop)) * 0.035 : 0;
    const pl = placeOf(cur), s = pl.s * (1 + lift);
    const hgt = GIRGIT.h * pl.s;
    const left = cur.x - (GIRGIT.w * s) / 2, top = pl.top + hgt * sink - (GIRGIT.h * s - hgt) - lift * 60;   // grows from his feet
    pos.setAttribute('transform', `translate(${left.toFixed(1)} ${top.toFixed(1)}) scale(${s.toFixed(4)})`);
    pos.setAttribute('opacity', fade.toFixed(3));

    // Eyes: the near one drifts after the pointer, the far one after its own slow saccades; both eased.
    const ew = eyeAt(cur);
    if (pointer) { const dx = pointer[0] - ew[0], dy = pointer[1] - ew[1], d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 400); nearLook = [dx / d * k, dy / d * k]; }
    if (found && now - foundAt < 1400) nearLook = [-0.15, 0.08];            // found: he turns to look at you
    if (now > farNext) { farNext = now + 1200 + ((now * 7) % 1800); farLook = [((now * 13) % 160) / 100 - 0.8, ((now * 29) % 120) / 100 - 0.6]; }
    near = [approach(near[0], nearLook[0], 9, dt), approach(near[1], nearLook[1], 9, dt)];
    far = [approach(far[0], farLook[0], 5, dt), approach(far[1], farLook[1], 5, dt)];
    const n = GIRGIT.eyeNear, fa = GIRGIT.eyeFar;
    nearIris.setAttribute('transform', `translate(${(near[0] * n.travel).toFixed(2)} ${(near[1] * n.travel).toFixed(2)})`);
    farIris.setAttribute('transform', `translate(${(far[0] * fa.travel).toFixed(2)} ${(far[1] * fa.travel).toFixed(2)})`);
    // Head: a small, eased turn toward what he's watching; the tail sways slowly.
    const headTarget = found ? -2.5 : Math.max(-4, Math.min(4, near[1] * 4 - near[0] * 1.5));
    headRot = approach(headRot, headTarget, 3, dt);
    head.setAttribute('transform', `rotate(${headRot.toFixed(2)} ${GIRGIT.neck[0]} ${GIRGIT.neck[1]})`);
    tail.setAttribute('transform', `rotate(${(reduce ? 0 : Math.sin(now / 1400) * 2).toFixed(2)} ${GIRGIT.tailBase[0]} ${GIRGIT.tailBase[1]})`);
    // Camouflage: matched to the foliage while hidden; found, he warms back a touch brighter than life.
    camo = approach(camo, found ? -0.18 : 1, found ? 2.2 : 3, dt);
    if (Math.abs(camo - drawnCamo) > 0.003) { matrix.setAttribute('values', camoMatrix(camo)); drawnCamo = camo; }
    // Torchlight: follows the pointer softly; opens out when he's found.
    if (lightPos && light.dataset.x) {
      lightPos = [approach(lightPos[0], +light.dataset.x, 7, dt), approach(lightPos[1], +light.dataset.y, 7, dt)];
      light.style.setProperty('--lx', `${lightPos[0].toFixed(0)}px`); light.style.setProperty('--ly', `${lightPos[1].toFixed(0)}px`);
    }
    lightOn = approach(lightOn, found ? 0 : lightTarget, 3, dt);
    light.style.opacity = lightOn.toFixed(3);
    // Camera: only where the frame is wider than the section (phones), keep him in view.
    const want = Math.min(0, Math.max(box.w - box.fw, box.w * 0.5 - ew[0] / VIEW.w * box.fw));
    camX = camX === null || reduce ? want : approach(camX, want, 2.2, dt);
    stage.style.transform = `translate3d(${camX.toFixed(1)}px, ${((box.h - box.fh) / 2).toFixed(1)}px, 0)`;
    raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); if (!reduce) playVideo(); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); video.pause?.(); };
  measure();
  addEventListener('resize', measure, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop()), { threshold: 0.15 }).observe(section);
  else start();
}
