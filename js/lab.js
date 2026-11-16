// SECTION 03: what we do. The section sticks under the nav inside a sized track, and scroll drives one
// continuous film of Girgit crossing five rocks. On each rock he shows one capability: the still of
// that rock is the base, and a close-up clip of him (cut from a crop of that same still, so its
// first and last frames match it) plays over exactly his spot. Between rocks the full-frame walk clips
// carry him on. Every piece starts and ends on the same frame as its neighbour, so the joins are not
// seen. The camera (a translate on the film) keeps him at one spot beside the copy.
// Reduced motion, no JS or a clip that fails: the five stills with their copy.
import { TRACKS, TRACK_FPS } from './lab-track.js';

const lab = document.querySelector('.lab');

const CLIP = 8 - 1 / 24;          // every clip is 8 s; stop one frame short of the end
const RATIO = 1280 / 576;         // the film: the clips' top 80% (the bottom strip is cropped away)
// Where each rock's close-up sits in the film (fractions of its width and height), and where Girgit
// stands on that rock (the same position the walk clips' tracks measure, so the camera never jumps).
const ROCKS = {
  1: { x: -0.1359, y: 0.3109, w: 0.5814, h: 0.7324, girgit: 0.175 },
  2: { x: 0.0283, y: 0.2856, w: 0.5814, h: 0.7324, girgit: 0.34 },
  3: { x: 0.2108, y: 0.2604, w: 0.5814, h: 0.7324, girgit: 0.528 },
  4: { x: 0.3852, y: 0.3044, w: 0.5814, h: 0.7324, girgit: 0.701 },
  5: { x: 0.5363, y: 0.3475, w: 0.5814, h: 0.7324, girgit: 0.844 },
};
// rock: a close-up over that rock's still. clip alone: a full-frame walk between rocks.
// cap: the capability on screen; walks keep the last one up, then announce the next.
const SEGMENTS = [
  { rock: 1, units: 1.6, hold: true, cap: 'intro' },
  { rock: 1, clip: 'ov-branding-2', units: 7, cap: 0 },
  { clip: 'rock1-rock2', units: 2.4, walk: [0, 1] },
  { rock: 2, clip: 'ov-uiux', units: 6.5, cap: 1 },
  { clip: 'rock2-rock3', units: 2.4, walk: [1, 2] },
  { rock: 3, clip: 'ov-website-3', units: 6.5, cap: 2 },
  { clip: 'rock3-rock4', units: 2.4, walk: [2, 3] },
  { rock: 4, clip: 'ov-app-5', units: 6.5, cap: 3 },
  { clip: 'rock4-rock5', units: 2.4, walk: [3, 4] },
  { clip: 'motion-burst', units: 7, cap: 4 },                   // full frame: he bursts into pieces and comes back
  { rock: 5, units: 1.2, hold: true, cap: 4 },
];
const TOTAL = SEGMENTS.reduce((a, s) => a + s.units, 0);
const SCREENS_PER_UNIT = 0.11;    // about five and a half screens for the whole journey

function init() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const film = lab.querySelector('.lab-film');
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

  if (reduce) return still();

  /* ---------- The track: as tall as the scroll the journey needs; the section sticks inside it ---------- */
  const track = document.createElement('div');
  track.className = 'lab-track';
  lab.before(track); track.append(lab);
  const navH = () => document.querySelector('.nav')?.offsetHeight || 0;
  // On phones the journey is a little shorter (about four screens instead of five and a half).
  const distance = () => Math.round(innerHeight * TOTAL * (narrow.matches ? 0.085 : SCREENS_PER_UNIT));
  const sizeTrack = () => { track.style.height = `${lab.offsetHeight + distance()}px`; };

  /* ---------- The layers: the five rock stills, then the full-frame clips, then the close-ups ---------- */
  const stills = {};
  for (const n of Object.keys(ROCKS)) {
    const img = new Image();
    img.className = 'lab-still'; img.alt = ''; img.decoding = 'async';
    img.src = `assets/img/lab/still-${n}.webp`;
    film.append(img);
    stills[n] = img;
  }
  const videos = {};
  let failed = false;
  // The clips (about 12 MB) wait until the page has loaded and gone idle, or until the section is near,
  // whichever comes first, so they never compete with the first paint.
  let queue = new Promise((go) => {
    let done = false; const start = () => { if (!done) { done = true; go(); } };
    const idle = () => (window.requestIdleCallback ? requestIdleCallback(start, { timeout: 2500 }) : setTimeout(start, 1200));
    if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true });
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { start(); io.disconnect(); } }, { rootMargin: '120% 0px' });
      io.observe(lab);
    }
  });
  const fail = () => { if (failed) return; failed = true; track.before(lab); track.remove(); still(); };
  for (const s of SEGMENTS) {
    if (!s.clip || videos[s.clip]) continue;
    const v = document.createElement('video');
    Object.assign(v, { muted: true, playsInline: true, preload: 'auto', disablePictureInPicture: true });
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    if (s.rock) {
      // A close-up sits exactly over its patch of the rock's still, its edges feathered into it.
      const r = ROCKS[s.rock];
      v.className = 'lab-close';
      Object.assign(v.style, { left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` });
      if (s.clip === 'ov-motion') v.classList.add('lab-close--wide');   // the burst travels further
    } else v.className = 'lab-full';
    // Scrolling up rewinds a clip, which needs the frames behind the playhead; streamed in ranges they may
    // not be buffered, and the clip stalls instead of reversing. So each clip is fetched whole, in story
    // order, and played from memory: seeks either way are then instant. A failed fetch falls back to streaming.
    const url = `assets/video/caps/${s.clip}.mp4`;
    queue = queue.then(() => fetch(url)).then((r) => (r.ok ? r.blob() : Promise.reject(new Error(r.status))))
      .then((blob) => { v.src = URL.createObjectURL(blob); }, () => { v.src = url; });
    // iOS paints seeked frames only after a play: a silent play/pause primes each clip.
    v.addEventListener('loadeddata', () => { v.play()?.then(() => v.pause()).catch(() => {}); }, { once: true });
    v.addEventListener('error', fail, { once: true });
    film.append(v);
    const st = { el: v, target: 0, seeking: false };
    v.addEventListener('seeked', () => { st.seeking = false; seek(s.clip, st.target); });
    v.addEventListener('loadedmetadata', () => seek(s.clip, st.target));
    videos[s.clip] = st;
  }
  const seek = (name, t) => {
    const s = videos[name], v = s.el;
    s.target = Math.round(t * 24) / 24;
    if (s.seeking || v.readyState < 1 || Math.abs(v.currentTime - s.target) < 1 / 96) return;
    s.seeking = true;
    if (v.fastSeek) v.fastSeek(s.target); else v.currentTime = s.target;
  };
  const girgitX = (s, t) => {
    const tr = s.clip && TRACKS[s.clip];
    if (!tr) return ROCKS[s.rock].girgit;
    const f = Math.min(tr.length - 1, Math.max(0, t * TRACK_FPS)), i = Math.floor(f), k = f - i;
    return tr[i] + (tr[Math.min(i + 1, tr.length - 1)] - tr[i]) * k;
  };

  /* ---------- Camera: the film is larger than the stage and pans to keep Girgit beside the copy ---------- */
  const narrow = matchMedia('(max-width: 760px)');
  let box = { w: 0, h: 0, fw: 0, fh: 0 }, camX = null;
  const measure = () => {
    const w = lab.clientWidth, h = lab.clientHeight;
    const fw = narrow.matches ? w * 2 : Math.max(w * 1.55, h * RATIO * 1.02);
    box = { w, h, fw, fh: fw / RATIO };
    film.style.width = `${fw}px`; film.style.height = `${box.fh}px`;
    sizeTrack();
  };
  const place = (gx, snap) => {
    const want = box.w * (narrow.matches ? 0.5 : 0.69) - gx * box.fw;   // where Girgit sits on screen
    camX = camX == null || snap ? want : camX + (want - camX) * 0.18;
    const y = box.h * (narrow.matches ? 0.42 : 0.9) - box.fh * 0.88;    // the rocks end at 88% of the film (on phones a little higher, clear of the caption)
    film.style.transform = `translate3d(${camX.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  };

  /* ---------- Scroll → moment ---------- */
  const at = (p) => {
    let u = p * TOTAL;
    for (const s of SEGMENTS) { if (u <= s.units || s === SEGMENTS.at(-1)) return { s, k: Math.min(1, Math.max(0, u / s.units)) }; u -= s.units; }
  };
  const progress = () => {
    const r = track.getBoundingClientRect(), span = r.height - lab.offsetHeight;
    return span > 0 ? Math.min(1, Math.max(0, (navH() - r.top) / span)) : 0;
  };
  // Show exactly what this segment needs: its rock's still (under a close-up or a hold), or a full clip.
  // A clip is only revealed once its frame is the one it should show; until then the previous picture
  // stays up, so a clip parked on a stale frame (say, a walk still at its far end) is never seen.
  // The neighbours are already cued to their joining frame (cue, below), so a clip only has to be near
  // its target to be safe to show; and never wait more than a few frames, so fast scrolling cannot stall.
  let shown = null, waitingFor = null, waitingSince = 0;
  const ready = (name, t) => { const v = videos[name]?.el; return !!v && v.readyState >= 2 && Math.abs(v.currentTime - t) < 0.5; };
  const show = (s, t) => {
    const clip = s.hold ? null : s.clip;
    const key = `${s.rock || ''}|${clip || ''}`;
    if (key === shown) return;
    if (waitingFor !== key) { waitingFor = key; waitingSince = performance.now(); }
    if (clip && !ready(clip, t) && performance.now() - waitingSince < 120) return;
    shown = key;
    for (const [n, img] of Object.entries(stills)) img.classList.toggle('is-on', Number(n) === s.rock);
    for (const [n, v] of Object.entries(videos)) v.el.classList.toggle('is-on', n === clip);
  };
  // The clips either side of the current one wait on the exact frame where they join it: the next one
  // on its first frame, the previous one on its last. Crossing a join, scrolling either way, is then instant.
  const cue = (i) => {
    const prev = SEGMENTS[i - 1], next = SEGMENTS[i + 1];
    if (next?.clip && next.clip !== SEGMENTS[i].clip) seek(next.clip, 0);
    if (prev?.clip && prev.clip !== SEGMENTS[i].clip && !prev.hold) seek(prev.clip, CLIP);
  };
  let p = null, lastCap = null;
  const frame = () => {
    const target = progress();
    p = p == null ? target : p + (target - p) * 0.14;              // a little glide after the wheel stops
    if (Math.abs(target - p) < 0.00005) p = target;
    const { s, k } = at(p);
    const t = s.hold ? 0 : CLIP * k;
    if (s.clip && !s.hold) seek(s.clip, t);
    show(s, t);
    cue(SEGMENTS.indexOf(s));
    place(girgitX(s.hold ? { rock: s.rock } : s, t));
    const cap = String(s.walk ? (k < 0.5 ? s.walk[0] : s.walk[1]) : s.cap);
    if (cap !== lastCap) {
      lab.dataset.cap = cap; lastCap = cap;
      ticks.forEach((li, i) => {
        const cur = cap !== 'intro' && i === Number(cap);
        li.classList.toggle('is-on', cap !== 'intro' && i <= Number(cap));
        li.classList.toggle('is-current', cur);
        li.classList.toggle('is-done', cap !== 'intro' && i < Number(cap));
        li.querySelector('button')?.toggleAttribute('aria-current', cur);
      });
    }
    requestAnimationFrame(frame);
  };
  measure();
  place(ROCKS[1].girgit, true);
  // Re-fit whenever the section's own size settles or changes (fonts, the URL bar, a resize).
  new ResizeObserver(() => { measure(); if (p != null) { const { s, k } = at(p); place(girgitX(s.hold ? { rock: s.rock } : s, CLIP * k), true); } }).observe(lab);
  requestAnimationFrame(frame);

  // Progress ticks double as shortcuts: land mid-way through each transformation.
  ticks.forEach((li, i) => li.querySelector('button')?.addEventListener('click', () => {
    let u = 0;
    for (const s of SEGMENTS) { if (s.cap === i && !s.hold) { u += s.units * 0.55; break; } u += s.units; }
    const top = track.getBoundingClientRect().top + scrollY - navH();
    scrollTo({ top: top + (track.offsetHeight - lab.offsetHeight) * (u / TOTAL), behavior: 'smooth' });
  }));
}

if (lab) init();
