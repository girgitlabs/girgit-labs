// Project (case study) pages: gentle reveal-on-scroll, a nav that fills in once scrolled, a full-screen
// image viewer (click any image; arrows, Esc), copy email and the Mumbai clock in the footer, and
// the footer banner. Built to be shared by every project page.
import './footer-banner.js';
import './analytics.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');

/* ---------- Reveal: each block rises in once it's in view ---------- */
// [data-stagger] groups (the shared footer) reveal the same way, children one after another.
$$('[data-stagger]').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));
const reveal = $$('[data-reveal-cs], [data-stagger]');
if (reduce || !('IntersectionObserver' in window)) reveal.forEach((el) => el.classList.add('in-view'));
else {
  const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
  reveal.forEach((el) => io.observe(el));
}

/* ---------- Nav ---------- */
const nav = $('.nav');
addEventListener('scroll', () => nav?.classList.toggle('is-scrolled', scrollY > 8), { passive: true });

/* ---------- Image viewer ---------- */
const box = $('.cs-lightbox'), shots = $$('.cs-zoom');
if (box && shots.length) {
  const img = $('img', box), cap = $('figcaption', box);
  let at = 0;
  const show = (i) => {
    at = (i + shots.length) % shots.length;
    const s = shots[at];
    img.src = s.dataset.full; img.alt = s.dataset.cap; cap.textContent = `${s.dataset.cap}  ·  ${at + 1} / ${shots.length}`;
  };
  shots.forEach((s, i) => s.addEventListener('click', () => { show(i); box.showModal(); }));
  $('.cs-lb-prev', box).addEventListener('click', () => show(at - 1));
  $('.cs-lb-next', box).addEventListener('click', () => show(at + 1));
  $('.cs-lb-close', box).addEventListener('click', () => box.close());
  box.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(at - 1); if (e.key === 'ArrowRight') show(at + 1); });
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });            // click outside the image
  box.addEventListener('close', () => shots[at]?.focus());

  // Phones: swipe sideways to move between images, swipe down to close.
  let sx = 0, sy = 0, swiping = false;
  box.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) { swiping = false; return; }                             // leave pinch-zoom alone
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiping = true;
  }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (!swiping) return;
    swiping = false;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) show(at + (dx < 0 ? 1 : -1));
    else if (dy > 90 && dy > Math.abs(dx) * 1.4) box.close();
  }, { passive: true });
}

/* ---------- Footer: copy email, Mumbai time ---------- */
for (const b of $$('[data-copy]')) {
  b.addEventListener('click', async () => {
    const out = b.parentElement.querySelector('.copied');
    try { await navigator.clipboard.writeText(b.dataset.copy); if (out) { out.textContent = 'copied'; setTimeout(() => { out.textContent = ''; }, 1800); } }
    catch { location.href = `mailto:${b.dataset.copy}`; }
  });
}
const clock = $('[data-clock]');
if (clock) {
  const tick = () => { clock.textContent = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date()); };
  tick(); setInterval(tick, 30000);
}
