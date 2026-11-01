// SECTION 02 — the Adaptation Laboratory.
// One scrubbed ScrollTrigger (the section sticks inside a sized track) plays a stitched film (assets/video/lab*.mp4, cut from the supplied
// clips): Girgit crosses five rocks and transforms on each. It opens on the film's first frame,
// Girgit on rock 1, under the intro line. On narrow screens the frame is wider than the
// screen, so the "camera" pans to follow Girgit, using a position track measured from the film.
// Reduced motion, no GSAP or a video error: the five rock stills with their copy, no scroll scene.
import { TRACK, TRACK_FPS } from './lab-track.js';

const lab = document.querySelector('.lab');

// Film timeline (seconds), from the stitch in the asset pipeline. Each capability's transform
// clip, and the walks between rocks. cap: which capability the moment belongs to.
// Clips meet in 0.6s dissolves; each boundary sits mid-dissolve. Branding is the supplied
// rock1-rock2 walk with the brand skin painted onto Girgit in the asset pipeline (the supplied
// Branding clip turned him into a different, realistic chameleon). weight: scroll per second.
const DURATION = 59.75;
const SEGMENTS = [
  { from: 0, to: 2.8, cap: 0, weight: 1.6 }, // Branding: the skin sweeps on, on rock 1 (lingers)
  { from: 2.8, to: 7.7, cap: 0 },            // … he carries it across and sheds it on rock 2
  { from: 7.7, to: 15.1, cap: 1 },           // UI/UX and product design
  { from: 15.1, to: 22.5, walk: [1, 2] },
  { from: 22.5, to: 29.9, cap: 2 },          // Website design and development
  { from: 29.9, to: 37.28, walk: [2, 3] },
  { from: 37.28, to: 44.68, cap: 3 },        // App design
  { from: 44.68, to: 52.06, walk: [3, 4] },
  { from: 52.06, to: DURATION, cap: 4 },     // Motion and creative experimentation
];
const WALK_WEIGHT = 0.55;                // walks scroll past faster than the transformations
// Scroll units to hold the opening frame under the intro line before the film starts moving.
const INTRO = 3.2;
const OUTRO = 0.8;                       // hold the last frame so the final copy can be read

function init() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsap = window.gsap, ST = window.ScrollTrigger;
  const stage = lab.querySelector('.lab-stage');
  const film = lab.querySelector('.lab-film');
  const video = lab.querySelector('.lab-video');
  const ticks = [...lab.querySelectorAll('.lab-progress li')];
  const still = () => { lab.classList.add('lab--still'); lab.dataset.cap = 'all'; };

  // Headline words each get a clipped box, so they can rise into place one after another
  // whenever their caption appears (lab.css). Only text nodes are split; markup is kept.
  for (const h of lab.querySelectorAll('.lab-title, .lab-head')) {
    let i = 0;
    const walk = (node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType !== 3) { walk(child); continue; }
        const frag = document.createDocumentFragment();
        for (const part of child.textContent.split(/(\s+)/)) {
          if (!part) continue;
          if (!part.trim()) { frag.append(part); continue; }
          const box = document.createElement('span'), w = document.createElement('span');
          box.className = 'lab-w'; w.textContent = part; w.style.setProperty('--i', i++);
          box.append(w); frag.append(box);
        }
        child.replaceWith(frag);
      }
    };
    walk(h);
  }

  if (reduce || !gsap || !ST) return still();

  const narrow = matchMedia('(max-width: 760px)');
  video.src = narrow.matches ? 'assets/video/lab-m.mp4' : 'assets/video/lab.mp4';
  video.addEventListener('error', () => {                 // the film failed: drop the scroll scene, show the stills
    const track = lab.parentElement?.classList.contains('lab-track') ? lab.parentElement : null;
    ST.getAll().filter((t) => t.trigger === lab || t.trigger === track).forEach((t) => t.kill(true));
    if (track) { track.before(lab); track.remove(); }
    still(); ST.refresh();
  }, { once: true });
  // iOS only paints seeked frames once the video has played: a silent play/pause primes it.
  video.addEventListener('loadeddata', () => { video.play()?.then(() => video.pause()).catch(() => {}); }, { once: true });

  /* ---------- Scroll units → moments ---------- */
  const units = SEGMENTS.map((s) => (s.to - s.from) * (s.weight ?? (s.walk ? WALK_WEIGHT : 1)));
  const introTotal = INTRO;
  const total = introTotal + units.reduce((a, b) => a + b, 0) + OUTRO;

  // Rocks 1–2 sit on the left of the frame, 3–5 from the middle rightwards: the caption goes
  // on the other side (wide screens).
  const sideOf = (rock) => (rock <= 1 ? 'right' : 'left');
  // u: 0..total scroll units → { t: film time, cap, done, side }
  function moment(u) {
    if (u < introTotal) return { t: 0, cap: 'intro', done: -1, side: 'right' };
    let rest = u - introTotal;
    for (let i = 0; i < SEGMENTS.length; i++) {
      const s = SEGMENTS[i];
      if (rest <= units[i] || i === SEGMENTS.length - 1) {
        const k = Math.min(1, rest / units[i]);
        const t = s.from + (s.to - s.from) * k;
        if (s.cap != null) return { t, cap: String(s.cap), done: s.cap, side: sideOf(s.cap) };
        // Walking: the last capability stays up for a moment, then the next one is announced.
        const cap = k < 0.35 ? s.walk[0] : k > 0.65 ? s.walk[1] : -1;
        return { t, cap: String(cap), done: s.walk[0], side: sideOf(k < 0.5 ? s.walk[0] : s.walk[1]) };
      }
      rest -= units[i];
    }
  }

  /* ---------- Camera: fit the frame, pan to follow Girgit where it is cropped ---------- */
  const RATIO = 1440 / 630;
  let box = { w: 0, h: 0, fw: 0, fh: 0 };
  const measure = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    let fw = Math.max(w, h * RATIO);
    if (w / h < 1.2) fw = Math.min(fw, w * 2.3);            // phones: keep Girgit large but not huge
    box = { w, h, fw, fh: fw / RATIO };
    film.style.width = `${fw}px`;
    film.style.height = `${box.fh}px`;
  };
  const girgitX = (t) => {
    const f = Math.min(TRACK.length - 1, Math.max(0, t * TRACK_FPS));
    const i = Math.floor(f), k = f - i;
    return TRACK[i] + ((TRACK[Math.min(i + 1, TRACK.length - 1)] ?? TRACK[i]) - TRACK[i]) * k;
  };
  // Wide screens: the caption overlays the side of the film Girgit isn't on (by the rock he's
  // on), so it never covers him. It switches sides with a quick fade.
  const overlay = lab.querySelector('.lab-bar');
  let side = null, flipTimer = 0;
  const setSide = (next) => {
    if (next === side) return;
    if (side === null) { side = next; lab.dataset.side = next; return; }
    side = next;
    clearTimeout(flipTimer);
    overlay.classList.add('is-flipping');
    flipTimer = setTimeout(() => { lab.dataset.side = side; overlay.classList.remove('is-flipping'); }, 220);
  };
  const place = (t) => {
    const x = Math.min(0, Math.max(box.w - box.fw, box.w / 2 - girgitX(t) * box.fw));
    const y = (box.h - box.fh) * (box.fh > box.h ? 1 : 0.5);   // too tall: crop the sky, never the rocks
    film.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  };

  /* ---------- Seeking ----------
     The film has a keyframe every 6 frames and no reordered frames, so any frame decodes
     quickly and seeking backwards costs about the same as forwards. One seek in flight; when it lands, chase
     the latest target. The camera pans from the frame actually on screen, so Girgit and
     the camera never drift apart while a seek is pending. */
  let target = 0, seeking = false, shownT = 0;
  const toFrame = (t) => Math.round(t * 24) / 24;
  const seek = (t) => {
    target = toFrame(t);
    if (seeking || video.readyState < 1 || Math.abs(video.currentTime - target) < 1 / 96) return;
    seeking = true;
    if (video.fastSeek) video.fastSeek(target); else video.currentTime = target;
  };
  const landed = () => {
    seeking = false;
    shownT = video.currentTime;
    if (lab.dataset.cap !== 'intro') place(shownT);
    if (Math.abs(video.currentTime - target) >= 1 / 96) seek(target);
  };
  video.addEventListener('seeked', landed);
  video.addEventListener('loadedmetadata', () => seek(target));

  let lastCap = null;
  const draw = (u) => {
    const m = moment(u);
    seek(Math.min(m.t, DURATION - 0.05));
    if (m.cap === 'intro') place(0);
    if (m.cap !== lastCap) { lab.dataset.cap = m.cap; lastCap = m.cap; }
    setSide(m.side);
    ticks.forEach((li, i) => li.classList.toggle('is-on', i <= m.done));
  };

  /* ---------- The track: a container as tall as the scroll the film needs; the section sticks
     inside it (CSS sticky, like the eye wall). No pin spacer, so nothing can leave a blank gap,
     and the track carries the film's floor colour underneath. ---------- */
  gsap.registerPlugin(ST);
  const navH = () => document.querySelector('.nav')?.offsetHeight || 0;
  // About 0.075 screen heights per scroll unit (0.06 on phones): the journey is ~4 screens on desktop.
  const distance = () => Math.round(window.innerHeight * total * (narrow.matches ? 0.06 : 0.075));
  const track = document.createElement('div');
  track.className = 'lab-track';
  lab.before(track); track.append(lab);
  const sizeTrack = () => { track.style.height = `${lab.offsetHeight + distance()}px`; };
  sizeTrack();
  ST.addEventListener('refreshInit', sizeTrack);

  /* ---------- Arrival: as the section scrolls up, the film opens out to full-bleed ---------- */
  const arrive = { trigger: lab, start: 'top bottom', end: () => `top ${navH()}`, scrub: true };
  gsap.timeline({ scrollTrigger: { ...arrive, onUpdate: (self) => lab.classList.toggle('is-in', self.progress > 0.55) } })
    .fromTo(stage, { clipPath: 'inset(9% 6% 0% 6% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none' }, 0)
    .fromTo(video, { scale: 1.12, transformOrigin: '50% 100%' }, { scale: 1, ease: 'none' }, 0)
    .fromTo(lab.querySelector('.lab-texts'), { y: 48, opacity: 0 }, { y: 0, opacity: 1, ease: 'power2.out', duration: 0.5 }, 0.5);

  /* ---------- Scroll drives the film while the section is stuck in its track ---------- */
  const state = { u: 0 };
  const tween = gsap.to(state, {
    u: total, ease: 'none',
    onUpdate: () => draw(state.u),
    scrollTrigger: {
      trigger: track,
      start: () => `top ${navH()}`,
      end: () => `+=${distance()}`,
      scrub: 1.1,             // a little inertia: the film glides after the wheel stops
      invalidateOnRefresh: true,
      onRefresh: () => { measure(); draw(state.u); place(shownT); },
    },
  });
  measure();
  draw(0);
  addEventListener('resize', () => { sizeTrack(); measure(); draw(state.u); place(shownT); }, { passive: true });

  // Progress ticks double as shortcuts to each transformation.
  ticks.forEach((li, i) => li.querySelector('button')?.addEventListener('click', () => {
    const tr = tween.scrollTrigger;
    let u = introTotal;
    for (let j = 0; j < SEGMENTS.length; j++) { if (SEGMENTS[j].cap === i) break; u += units[j]; }
    u += units[SEGMENTS.findIndex((s) => s.cap === i)] * 0.55;   // land mid-transformation
    scrollTo({ top: tr.start + (tr.end - tr.start) * (u / total), behavior: 'smooth' });
  }));
}

if (lab) init();   // last, so the timeline constants above exist
