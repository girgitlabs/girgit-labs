// Motion with energy, layered on the existing reveals.
// - Letters: the headings already rise word by word (site.js, s5.js, eyes.js split them into words).
//   Each word is split once more into letters, so the letters spring up one after another with a small
//   turn and overshoot, and ripple when the heading is hovered.
// - Cards you can almost hold: framed cards lean toward the pointer in 3D (on top of their lift).
// All of it is off with reduced motion; the tilt is off on touch screens.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduce) {
  // Runs after the word splitters have done their work.
  setTimeout(() => {
    const words = document.querySelectorAll('[data-split] .w > span, .s5-statement .sw > span, .eyes-cover .ew > span, .lab-title .lab-w > span, .lab-head .lab-w > span');
    const count = new Map();
    for (const w of words) {
      if (w.children.length) continue;
      const head = w.closest('h1, h2, h3, p');
      if (head && !head.hasAttribute('aria-label')) head.setAttribute('aria-label', head.textContent.replace(/\s+/g, ' ').trim());
      let n = count.get(head) || 0;
      const text = w.textContent; w.textContent = '';
      for (const c of text) {
        const s = document.createElement('span');
        s.className = 'ch'; s.textContent = c; s.style.setProperty('--ci', n++); s.setAttribute('aria-hidden', 'true');
        w.append(s);
      }
      count.set(head, n);
      head?.classList.add('has-ch');
    }
  }, 0);

  if (matchMedia('(hover: hover)').matches) {
    for (const card of document.querySelectorAll('.pl-card, .st-fit-card, .st-dict-card')) {
      card.classList.add('is-tilt');
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        const mag = Math.min(1, Math.hypot(x, y) * 2) * 7;
        card.style.setProperty('--ra', `${(-y).toFixed(3)} ${x.toFixed(3)} 0 ${mag.toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => card.style.setProperty('--ra', '0 0 1 0deg'));
    }
  }
}

// His turret eye: it opens when it comes into view, then swivels toward the pointer inside its socket
// (a chameleon's eye turns on its own, independently of the other).
for (const eye of document.querySelectorAll('[data-turret]')) {
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { eye.classList.add('is-open'); o.disconnect(); } }, { threshold: 0.4 }).observe(eye);
  } else eye.classList.add('is-open');
  if (reduce || !matchMedia('(pointer: fine)').matches) continue;
  const img = eye.querySelector('img');
  let raf = 0, px = 0, py = 0;
  addEventListener('pointermove', (ev) => {
    px = ev.clientX; py = ev.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = eye.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 400);
      img.style.translate = `${(dx / d * 9 * k).toFixed(2)}% ${(dy / d * 9 * k).toFixed(2)}%`;
    });
  }, { passive: true });
}

// The silhouette behind "How we work" drifts slower than the page, so it reads as far away.
for (const sil of document.querySelectorAll('[data-sil]')) {
  if (reduce) break;
  const sec = sil.parentElement;
  let raf = 0;
  const move = () => {
    raf = 0;
    const r = sec.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    sil.style.setProperty('--sy', `${(r.top * -0.18).toFixed(1)}px`);
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(move); }, { passive: true });
  move();
}

// His eye in the head behind "How we work", a chameleon's turret. The whole cone of rings leans toward what
// he looks at (css: each ring follows by its own share, the pupil most), so it reads as one round eye turning.
// With a mouse he watches the pointer, and keeps watching it as the page scrolls under it. When the pointer
// is still for a moment, or on a touch screen, he looks around on his own, in quick jumps the way a chameleon
// does. He blinks now and then, the whole eye closing into its fold of skin, sometimes twice.
const hwEye = document.querySelector('.hw-head-eye');
if (hwEye && !reduce) {
  const rim = hwEye.querySelector('.hw-lid') || hwEye;
  const REACH = 40;   // in the drawing's units: how far the pupil leans at most (the rings follow in step)
  let px = null, py = null, movedAt = -Infinity, raf = 0;
  const onScreen = (r) => r.bottom > -200 && r.top < innerHeight + 200;
  const gaze = (x, y) => {
    hwEye.style.setProperty('--ex', `${x.toFixed(1)}px`);
    hwEye.style.setProperty('--ey', `${y.toFixed(1)}px`);
  };
  // Look at a point on screen: the lean grows with distance, full once the point is a little way off.
  const look = () => {
    raf = 0;
    if (px === null) return;
    const r = rim.getBoundingClientRect();
    if (!onScreen(r)) return;
    const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / Math.max(240, r.width * 1.3)) * REACH;
    gaze(dx / d * k, dy / d * k);
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(look); };
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;   // a finger is not something to watch; he looks around instead
    px = e.clientX; py = e.clientY; movedAt = performance.now(); queue();
  }, { passive: true });
  addEventListener('scroll', () => { if (performance.now() - movedAt < 2500) queue(); }, { passive: true });

  // On his own: a new spot every second or three, sometimes far, sometimes a small shift.
  const wander = () => {
    if (!document.hidden && performance.now() - movedAt > 2500 && onScreen(rim.getBoundingClientRect())) {
      const a = Math.random() * Math.PI * 2, k = (0.3 + Math.random() * 0.7) * REACH;
      gaze(Math.cos(a) * k, Math.sin(a) * k * 0.8);
    }
    setTimeout(wander, 1100 + Math.random() * 1900);
  };
  setTimeout(wander, 1500);

  const blink = (twice) => {
    hwEye.classList.add('is-blink');
    setTimeout(() => {
      hwEye.classList.remove('is-blink');
      if (twice) setTimeout(() => blink(false), 220);
    }, 150);
  };
  const blinks = () => {
    if (!document.hidden && onScreen(rim.getBoundingClientRect())) blink(Math.random() < 0.25);
    setTimeout(blinks, 3200 + Math.random() * 3600);
  };
  setTimeout(blinks, 2400);
}
