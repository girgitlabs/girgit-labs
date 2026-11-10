// WHAT WE DO: a scroll-driven turntable, after the "rotating flavour slider" pattern, in the site's parts.
// The stage sticks under the nav while the page scrolls through a track five screens tall; the scroll
// scrubs one continuous position p (0..4). From p, every frame: the disc turns and the next frame of
// Girgit's lab film fades over the current one (each frame is counter-rotated, so whichever one is
// showing comes to rest upright), the stage colour blends between the two services, the yellow marker
// slides round the ring of names, the copy rises out as the next one rises in, the corner props drift
// out and back. Letting go eases to the nearest service. Writes only transform, opacity and colour.
// Ring names, arrows and Left/Right keys jump the page to a service; the scroll then drives the morph.
// No GSAP (or no JS): the CSS shows the five services as a plain list. Reduced motion: nothing turns
// or drifts and there is no snapping; the cross-fades still follow the scroll.

const section = document.querySelector('.wd');

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
// Angle of each name on the ring, degrees clockwise from the top, centred.
const ringAngles = (n, gap = 33, maxSpan = 140) => {
  if (n < 2) return n === 1 ? [0] : [];
  const step = Math.min(gap, maxSpan / (n - 1));
  return Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * step);
};
const positionAt = (progress, n) => clamp(progress, 0, 1) * Math.max(0, n - 1);
const lerpAt = (values, p) => {
  const i = clamp(Math.floor(p), 0, values.length - 1), j = Math.min(i + 1, values.length - 1);
  return values[i] + (values[j] - values[i]) * (p - i);
};
const photoOpacity = (i, p) => { const base = Math.floor(p); return i === base ? 1 : i === base + 1 ? p - base : 0; };
const scrollFor = (i, n, start, end) => (n > 1 ? start + ((end - start) * i) / (n - 1) : start);

const TURN = 40;              // degrees the disc turns per service
const SCROLL_PER = 0.8;       // page scroll per service, in stage heights
const ALTS = [
  'Girgit in a checkerboard skin, on the first rock',
  'Girgit as a glowing wireframe, on the second rock',
  'Girgit surrounded by floating web pages, on the third rock',
  'Girgit beside a phone and app screens, on the fourth rock',
  'Girgit breaking into a cloud of floating shapes, on the last rock',
];

function init() {
  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;                 // the plain list stays
  gsap.registerPlugin(ScrollTrigger);

  const track = section.querySelector('.wd-track');
  const root = section.querySelector('.wd-root');
  const disc = section.querySelector('.wd-disc');
  const dot = section.querySelector('.wd-dot');
  const photos = [...disc.querySelectorAll('img')];
  const texts = [...section.querySelectorAll('.wd-txt')];
  const names = [...section.querySelectorAll('.wd-ring text')];
  const decors = texts.map((_, i) => ['l', 'r'].map((s) => section.querySelector(`.wd-decor[data-i="${i}"][data-side="${s}"]`)));
  const now = section.querySelector('.wd-now');
  const live = section.querySelector('.wd-sr');
  const index = [...section.querySelectorAll('.wd-index button')];   // all five services, the active one big
  const segs = [...section.querySelectorAll('.wd-segs i')];          // the progress bar
  const n = texts.length;
  const angles = ringAngles(n);
  const colors = texts.map((t) => t.dataset.color);
  const mixers = colors.map((c, i) => gsap.utils.interpolate(c, colors[Math.min(i + 1, n - 1)]));
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  let still = mq.matches, active = 0;

  section.classList.add('is-live');
  track.style.setProperty('--wd-len', 1 + (n - 1) * SCROLL_PER);
  photos.forEach((ph, i) => { ph.style.setProperty('--r', `${-i * TURN}deg`); ph.loading = 'eager'; });

  const show = (i) => {
    active = i;
    texts.forEach((t, k) => t.setAttribute('aria-hidden', String(k !== i)));
    names.forEach((t, k) => t.setAttribute('aria-pressed', String(k === i)));
    index.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    photos.forEach((ph, k) => { ph.alt = k === i ? ALTS[k] : ''; });
    now.textContent = String(i + 1).padStart(2, '0');
    live.textContent = `${i + 1} of ${n}: ${texts[i].querySelector('.wd-svc').textContent.replace(/^\s*\d+\s*/, '')}`;
    try { window.posthog?.capture('what_we_do_service', { index: i }); } catch { /* fine */ }
  };

  const apply = (p) => {
    const base = clamp(Math.floor(p), 0, n - 1);
    root.style.backgroundColor = mixers[base](p - base);
    disc.style.transform = `rotate(${still ? 0 : p * TURN}deg)`;
    dot.style.transform = `rotate(${lerpAt(angles, p)}deg)`;
    for (let i = 0; i < n; i++) {
      const d = p - i, near = Math.max(0, 1 - Math.abs(d));
      photos[i].style.opacity = String(photoOpacity(i, p));
      const tx = texts[i];
      tx.style.opacity = String(Math.max(0, 1 - Math.abs(d) * 1.6));
      tx.style.transform = still ? 'none' : `translateY(calc(var(--u) * ${(-d * 1.6).toFixed(3)}))`;
      tx.style.visibility = Math.abs(d) < 0.7 ? 'visible' : 'hidden';
      names[i].style.opacity = String(0.55 + 0.45 * near);
      index[i]?.style.setProperty('--near', near.toFixed(3));
      segs[i]?.style.setProperty('--f', clamp(p - i + 1, 0, 1).toFixed(3));
      const t = clamp(d, -1, 1), a = Math.abs(t);
      const [l, r] = decors[i];
      if (l) {
        l.style.opacity = String(1 - a);
        l.style.transform = still ? 'none' : `translate(calc(var(--u) * ${-5 * a}), calc(var(--u) * ${-5 * a})) rotate(${-28 * t}deg) scale(${1 - 0.2 * a})`;
      }
      if (r) {
        r.style.opacity = String(1 - a);
        r.style.transform = still ? 'none' : `translate(calc(var(--u) * ${5 * a}), calc(var(--u) * ${-5 * a})) rotate(${28 * t}deg) scale(${1 - 0.2 * a})`;
      }
    }
    const k = Math.round(p);
    if (k !== active) show(k);
  };

  const navH = () => document.querySelector('.nav')?.getBoundingClientRect().height || 0;
  const st = ScrollTrigger.create({
    trigger: track,
    start: () => `top ${navH()}px`,
    end: 'bottom bottom',
    snap: still || n < 2 ? undefined : { snapTo: 1 / (n - 1), duration: { min: 0.25, max: 0.7 }, delay: 0.08, ease: 'power2.inOut' },
    invalidateOnRefresh: true,
    onUpdate: (self) => apply(positionAt(self.progress, n)),
    onRefresh: (self) => apply(positionAt(self.progress, n)),
  });
  apply(positionAt(st.progress, n));
  mq.addEventListener?.('change', () => { still = mq.matches; apply(positionAt(st.progress, n)); });

  // Jump the page to a service; the scroll then drives the morph.
  const go = (i) => {
    const to = clamp(i, 0, n - 1);
    window.scrollTo({ top: scrollFor(to, n, st.start, st.end), behavior: still ? 'auto' : 'smooth' });
  };
  root.addEventListener('keydown', (e) => {
    if (e.target !== root && !e.target.closest('.wd-ring')) return;
    if (e.key === 'ArrowRight') go(active + 1);
    else if (e.key === 'ArrowLeft') go(active - 1);
    else return;
    e.preventDefault();
  });
  names.forEach((t, i) => {
    t.addEventListener('click', () => go(i));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); e.stopPropagation(); go(i);
    });
  });
  index.forEach((b, i) => b.addEventListener('click', () => go(i)));
  section.querySelector('.wd-nav[data-dir="prev"]').addEventListener('click', () => go(active - 1));
  section.querySelector('.wd-nav[data-dir="next"]').addEventListener('click', () => go(active + 1));
}

if (section) init();
