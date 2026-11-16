// The footer's "Say hello." comes alive. The letters spring up one after another when it arrives; the "o"
// of hello is his eye (the ringed turret), which follows the pointer and blinks; and any letter you touch
// flushes a colour from the palette and fades back, like chameleon skin. Shared by every page.

const big = document.querySelector('.ft-big');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COLOURS = ['#43FF18', '#FF168C', '#FFE500', '#9DB4FF', '#FF8FC7'];

if (big && !big.dataset.alive) {
  big.dataset.alive = '1';
  const text = big.textContent.trim();                       // "Say hello."
  big.setAttribute('aria-label', text);
  const at = text.toLowerCase().lastIndexOf('o');
  big.innerHTML = [...text].map((ch, k) => {
    // The "o" stays a letter: its bowl is drawn in the headline's own colour, and the eye sits in the
    // counter, a turret of rings that lean in step toward what it looks at (--t), the pupil leaning most.
    if (k === at) return `<span class="hl-ch hl-eye" style="--i:${k}" aria-hidden="true"><svg viewBox="-50 -50 100 100"><circle r="47" class="hl-bowl"/><g class="hl-ball"><circle r="39" class="hl-r0" style="--t:0"/><circle r="31" class="hl-r1" style="--t:0.33"/><circle r="23" class="hl-r0" style="--t:0.66"/><g class="hl-pupil" style="--t:1"><circle r="15" class="hl-iris"/><circle r="8" class="hl-dot"/><circle cx="-4" cy="-4" r="2.6" class="hl-glint"/></g></g></svg></span>`;
    if (ch === ' ') return '<span class="hl-sp" aria-hidden="true"> </span>';
    return `<span class="hl-ch" style="--i:${k}" aria-hidden="true">${ch}</span>`;
  }).join('');

  const go = () => big.classList.add('is-in');
  if (reduce || !('IntersectionObserver' in window)) go();
  else new IntersectionObserver(([e], o) => { if (e.isIntersecting) { go(); o.disconnect(); } }, { threshold: 0.4 }).observe(big);
  // a scroll check too, so it never waits on an observer in a throttled tab
  addEventListener('scroll', () => { if (!big.classList.contains('is-in') && big.getBoundingClientRect().top < innerHeight * 0.85) go(); }, { passive: true });

  // touch a letter: it flushes a colour, then fades back
  if (!reduce) for (const ch of big.querySelectorAll('.hl-ch:not(.hl-eye)')) {
    ch.addEventListener('pointerenter', () => {
      ch.style.color = COLOURS[(Math.random() * COLOURS.length) | 0];
      clearTimeout(ch._t); ch._t = setTimeout(() => { ch.style.color = ''; }, 900);
    });
  }

  // The eye: with a mouse it follows the pointer in quick jumps; when the pointer is still, or on a touch
  // screen, it looks around on its own. It blinks now and then (sometimes twice), the eye closing inside
  // the letter, and it blinks when you touch it.
  const eye = big.querySelector('.hl-eye');
  if (eye && !reduce) {
    const REACH = 12;   // in the drawing's units: the pupil's furthest lean; the rings follow in step, so they stay nested
    let px = 0, py = 0, movedAt = -Infinity, raf = 0;
    const onScreen = () => { const r = eye.getBoundingClientRect(); return r.bottom > -100 && r.top < innerHeight + 100; };
    const gaze = (x, y) => { eye.style.setProperty('--ex', `${x.toFixed(1)}px`); eye.style.setProperty('--ey', `${y.toFixed(1)}px`); };
    const look = () => {
      raf = 0;
      const r = eye.getBoundingClientRect(), dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / Math.max(200, r.width * 3)) * REACH;
      gaze(dx / d * k, dy / d * k);
    };
    addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      px = e.clientX; py = e.clientY; movedAt = performance.now();
      if (!raf) raf = requestAnimationFrame(look);
    }, { passive: true });
    const wander = () => {
      if (!document.hidden && performance.now() - movedAt > 2500 && onScreen()) {
        const a = Math.random() * Math.PI * 2, k = (0.35 + Math.random() * 0.65) * REACH;
        gaze(Math.cos(a) * k, Math.sin(a) * k * 0.8);
      }
      setTimeout(wander, 1100 + Math.random() * 1900);
    };
    setTimeout(wander, 1500);
    const blink = (twice) => {
      eye.classList.add('is-blink');
      setTimeout(() => { eye.classList.remove('is-blink'); if (twice) setTimeout(() => blink(false), 220); }, 150);
    };
    const blinks = () => {
      if (!document.hidden && onScreen()) blink(Math.random() < 0.25);
      setTimeout(blinks, 3000 + Math.random() * 3500);
    };
    setTimeout(blinks, 2600);
    eye.addEventListener('pointerenter', () => blink(false));
  }
}
