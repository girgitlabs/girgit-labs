// Girgit Labs site v2: every section's interaction and scroll animation.
import { ACCENTS, BODIES, chameleon, PIXELS, SCRIBBLES, sticker, badge } from './art.js';

document.documentElement.classList.add('js');   // reveal animations only hide content once JS is running
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ACCENT = ACCENTS.lime.hex;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const onView = (els, fn, opts = { rootMargin: '0px 0px -12% 0px' }) => {
  if (!('IntersectionObserver' in window)) { els.forEach(fn); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }), opts);
  els.forEach((el) => io.observe(el));
};

/* ---------- Art everywhere ---------- */
function drawCham(el, opts = {}) {
  el.innerHTML = chameleon({ body: el.dataset.body || 'ink', state: el.dataset.cham, eyeGlow: ACCENT, ...opts });
}
$$('[data-cham]').forEach((el) => drawCham(el));
$$('[data-scribble]').forEach((el) => { el.innerHTML = SCRIBBLES[el.dataset.scribble](el.dataset.color || '#1C1A17', Number(el.dataset.seed) || 3); });
onView($$('[data-scribble]'), (el) => el.classList.add('draw'));
onView($$('[data-reveal]'), (el) => el.classList.add('in-view'));

/* ---------- Eyes follow the pointer, everywhere ---------- */
let pointer = null, queued = false;
function aimEyes() {
  if (!pointer || reduce) return;
  for (const p of $$('.pupil')) {
    const r = p.ownerSVGElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) continue;
    const k = r.width / 420;
    const flip = getComputedStyle(p.ownerSVGElement.parentElement).transform.startsWith('matrix(-1') ? -1 : 1;
    const dx = (pointer.x - (r.left + Number(p.dataset.cx) * k)) * flip, dy = pointer.y - (r.top + Number(p.dataset.cy) * k);
    const d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 320) * 11;
    p.setAttribute('transform', `translate(${((dx / d) * m).toFixed(1)} ${((dy / d) * m).toFixed(1)})`);
  }
}
addEventListener('pointermove', (e) => {
  pointer = { x: e.clientX, y: e.clientY };
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; aimEyes(); });
}, { passive: true });

/* ---------- Nav: background once scrolled, active section ---------- */
const nav = $('.nav');
addEventListener('scroll', () => nav.classList.toggle('is-scrolled', scrollY > 8), { passive: true });
if ('IntersectionObserver' in window) {
  const pills = $$('.nav-links .pill');
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    const pill = pills.find((p) => p.getAttribute('href') === `#${e.target.id}`);
    pill?.classList.toggle('is-active', e.isIntersecting);
  }), { rootMargin: '-45% 0px -50% 0px' });
  pills.forEach((p) => { const s = $(p.getAttribute('href')); if (s) io.observe(s); });
}

/* ---------- 1. Hero: the 3D chameleon changes colour and turns to look at you ---------- */
// Two renders (ink, lime); the other skins are the lime render with a hue shift.
const SKINS = [
  { src: 'assets/img/cham-hero.webp', filter: '', flower: ACCENT, name: 'ink black' },
  { src: 'assets/img/cham-lime.webp', filter: '', flower: BODIES.lime[2], name: 'lime' },
  { src: 'assets/img/cham-lime.webp', filter: 'hue-rotate(-40deg) saturate(1.25)', flower: BODIES.sun[1], name: 'sun yellow' },
  { src: 'assets/img/cham-lime.webp', filter: 'hue-rotate(-78deg) saturate(1.5)', flower: BODIES.coral[1], name: 'coral' },
  { src: 'assets/img/cham-lime.webp', filter: 'hue-rotate(75deg) saturate(1.1)', flower: '#1F9E8F', name: 'teal' },
];
{
  const img = $('[data-hero-cham]'), mascot = $('.mascot'), hint = $('.mascot-hint'), status = $('[data-colour-status]');
  const flowers = $$('[data-hero-flower]');
  let skin = 0;
  new Image().src = SKINS[1].src;                // preload the second render
  const drawFlowers = (colour) => flowers.forEach((el) => {
    el.classList.remove('draw');
    el.innerHTML = SCRIBBLES.flower(colour, Number(el.dataset.seed));
    void el.offsetWidth;
    el.classList.add('draw');
  });
  mascot.addEventListener('click', () => {
    skin = (skin + 1) % SKINS.length;
    img.src = SKINS[skin].src;
    img.style.filter = SKINS[skin].filter;
    drawFlowers(SKINS[skin].flower);
    status.textContent = `The chameleon is ${SKINS[skin].name}.`;
    hint.classList.add('is-gone');
    if (!reduce) { mascot.classList.remove('is-changing'); void mascot.offsetWidth; mascot.classList.add('is-changing'); }
  });
  // It turns its head toward the cursor.
  if (!reduce) {
    addEventListener('pointermove', (e) => {
      const r = img.getBoundingClientRect();
      if (r.bottom < 0) return;
      const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth, dy = (e.clientY - (r.top + r.height * 0.3)) / innerHeight;
      img.style.setProperty('--look', `rotate(${(dx * 10).toFixed(2)}deg) translate(${(dx * 14).toFixed(1)}px, ${(dy * 8).toFixed(1)}px)`);
    }, { passive: true });
  }
  drawFlowers(SKINS[0].flower);
}

/* ---------- Hindi words swap to English (hover, focus, tap) ---------- */
for (const el of $$('.hi')) {
  const hi = el.textContent, en = el.dataset.en;
  const measure = () => {
    el.style.minWidth = '';
    const a = el.getBoundingClientRect().width;
    el.textContent = en; el.classList.add('is-en');
    const b = el.getBoundingClientRect().width;
    el.textContent = hi; el.classList.remove('is-en');
    el.style.minWidth = `${Math.max(a, b)}px`;
  };
  document.fonts?.ready.then(measure);
  const show = (on) => { el.textContent = on ? en : hi; el.classList.toggle('is-en', on); };
  el.setAttribute('aria-label', `${hi}, Hindi for ${en}`);
  el.addEventListener('mouseenter', () => show(true));
  el.addEventListener('mouseleave', () => show(false));
  el.addEventListener('focus', () => show(true));
  el.addEventListener('blur', () => show(false));
  el.addEventListener('click', () => show(!el.classList.contains('is-en')));
}

/* ---------- 2. Sticker pile: drop in, grab, throw; the chameleon moves when disturbed ---------- */
{
  const pile = $('[data-pile]');
  const sleeper = $('.pile-sleeper');
  const LIST = [
    [['#web', 'design'], 3, 20, -6], [['#branding &', 'identity'], 21, 6, 4], [['#digital', 'products'], 44, 16, -3],
    [['#ux audits'], 66, 4, 6], [['#video &', 'motion'], 1, 54, 5], [['#app &', 'interface'], 22, 46, -5],
    [['#ai-enabled', 'experiences'], 42, 56, 3], [['#frontend'], 67, 40, -4], [['#graphic', 'design'], 64, 70, 5],
  ];
  const stickers = LIST.map(([t, x, y, r], i) => {
    const el = document.createElement('div');
    el.className = 'sticker';
    el.innerHTML = sticker(t, { fill: i === 3 ? ACCENT : '#FFFFFF' });
    Object.assign(el.style, { left: `${x}%`, top: `${y}%`, width: `${Math.max(t[0].length, t[1]?.length || 0) * 1.5 + 7}%`, zIndex: i + 1 });
    el.dataset.r = r;
    el.style.transform = `rotate(${r}deg)`;
    el.setAttribute('aria-hidden', 'true');
    pile.append(el);
    return el;
  });
  const seal = document.createElement('div');
  seal.className = 'sticker';
  seal.innerHTML = badge(['GIRGIT', 'LABS'], ACCENT);
  Object.assign(seal.style, { right: '0', top: '26%', width: 'clamp(90px, 11vw, 130px)', zIndex: 12 });
  seal.dataset.r = 0;
  seal.setAttribute('aria-hidden', 'true');
  pile.append(seal);

  let home = stickers[0];
  const seat = (target) => {
    home = target;
    const pr = pile.getBoundingClientRect(), r = target.getBoundingClientRect();
    sleeper.style.left = `${r.left - pr.left + r.width * 0.12}px`;
    sleeper.style.top = `${r.top - pr.top - sleeper.offsetHeight * 0.62}px`;
  };
  addEventListener('resize', () => seat(home));
  onView([pile], () => {
    [...stickers, seal].forEach((s, i) => { s.style.animationDelay = `${i * 70}ms`; s.classList.add('is-dropping'); });
    setTimeout(() => seat(home), 50);
  });
  setTimeout(() => seat(home), 300);

  // Drag and throw (with a little inertia when motion is allowed).
  let top = 50;
  for (const s of [...stickers, seal]) {
    let drag = null;
    s.addEventListener('pointerdown', (e) => {
      s.classList.remove('is-dropping');
      const pr = pile.getBoundingClientRect(), r = s.getBoundingClientRect();
      drag = { ox: e.clientX - r.left, oy: e.clientY - r.top, lx: e.clientX, ly: e.clientY, vx: 0, vy: 0, pr };
      s.style.zIndex = ++top;
      s.setPointerCapture(e.pointerId);
      if (s === home) {                            // its bed moved: wake up and climb to another sticker
        sleeper.src = 'assets/img/cham-hero.webp';           // awake
        sleeper.classList.add('is-awake');
        const next = stickers.filter((x) => x !== s)[Math.floor(Math.random() * (stickers.length - 1))];
        setTimeout(() => { seat(next); next.style.zIndex = ++top; sleeper.style.zIndex = top + 1; }, 250);
        setTimeout(() => { sleeper.src = 'assets/img/cham-sleep.webp'; sleeper.classList.remove('is-awake'); }, 1400);
      }
    });
    s.addEventListener('pointermove', (e) => {
      if (!drag) return;
      drag.vx = e.clientX - drag.lx; drag.vy = e.clientY - drag.ly; drag.lx = e.clientX; drag.ly = e.clientY;
      Object.assign(s.style, { left: `${e.clientX - drag.pr.left - drag.ox}px`, top: `${e.clientY - drag.pr.top - drag.oy}px`, right: 'auto' });
      s.style.transform = `rotate(${Number(s.dataset.r) + drag.vx * 0.8}deg)`;
    });
    s.addEventListener('pointerup', () => {
      if (!drag) return;
      let { vx, vy } = drag;
      drag = null;
      if (reduce) { s.style.transform = `rotate(${s.dataset.r}deg)`; return; }
      const fly = () => {
        vx *= 0.9; vy *= 0.9;
        const pr = pile.getBoundingClientRect();
        let x = s.offsetLeft + vx, y = s.offsetTop + vy;
        if (x < -40 || x > pr.width - s.offsetWidth + 40) { vx *= -0.6; x = Math.min(Math.max(x, -40), pr.width - s.offsetWidth + 40); }
        if (y < -20 || y > pr.height - s.offsetHeight + 20) { vy *= -0.6; y = Math.min(Math.max(y, -20), pr.height - s.offsetHeight + 20); }
        Object.assign(s.style, { left: `${x}px`, top: `${y}px` });
        s.style.transform = `rotate(${Number(s.dataset.r) + vx * 0.8}deg)`;
        if (Math.abs(vx) + Math.abs(vy) > 0.5) requestAnimationFrame(fly);
        else s.style.transform = `rotate(${s.dataset.r}deg)`;
      };
      requestAnimationFrame(fly);
    });
  }
}

/* ---------- 3. The walker on the dictionary window changes colour each lap ---------- */
{
  const walker = $('.window-walker');
  const cycle = ['ink', 'lime', 'sun', 'coral', 'camo'];
  let i = 0;
  walker?.addEventListener('animationiteration', () => { walker.dataset.body = cycle[++i % cycle.length]; drawCham(walker); });
}

/* ---------- 6. How we work: the chameleon walks the week as you scroll ---------- */
{
  const week = $('.week'), walker = $('.week-walker'), cards = $$('.card');
  if (week && walker) {
    const update = () => {
      const r = week.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
      walker.style.left = `${p * 100}%`;
      cards.forEach((c, k) => {
        const at = (k + 0.5) / cards.length;
        c.classList.toggle('is-stamped', p >= at - 0.06);
      });
    };
    let q = false;
    addEventListener('scroll', () => { if (q) return; q = true; requestAnimationFrame(() => { q = false; update(); }); }, { passive: true });
    update();
  }
}

/* ---------- 7. Who we're for: click to stamp ---------- */
for (const b of $$('.who-list button')) {
  b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', () => {
    const on = !b.classList.contains('is-stamped');
    b.classList.toggle('is-stamped', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

/* ---------- 8. Finale: the badge opens the contact card; the chameleon watches ---------- */
{
  const card = $('[data-form-card]'), heading = $('#form-title'), opener = $('[data-open-form]');
  const openCard = () => {
    card.hidden = false;
    heading.focus({ preventScroll: true });
    card.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  };
  opener.addEventListener('click', openCard);
  const close = () => { card.hidden = true; opener.focus(); };

  // Any render marked data-look turns its head toward the cursor (like the hero).
  if (!reduce) {
    const lookers = $$('[data-look]');
    addEventListener('pointermove', (e) => {
      for (const img of lookers) {
        const r = img.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth, dy = (e.clientY - (r.top + r.height * 0.3)) / innerHeight;
        img.style.setProperty('--look', `rotate(${(dx * 10).toFixed(2)}deg) translate(${(dx * 14).toFixed(1)}px, ${(dy * 8).toFixed(1)}px)`);
      }
    }, { passive: true });
  }
  $('[data-close-form]').addEventListener('click', close);
  card.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // Copy email
  for (const b of $$('[data-copy]')) {
    b.addEventListener('click', async () => {
      const out = b.parentElement.querySelector('.copied');
      try { await navigator.clipboard.writeText(b.dataset.copy); out.textContent = 'copied'; setTimeout(() => { out.textContent = ''; }, 1800); }
      catch { location.href = `mailto:${b.dataset.copy}`; }
    });
  }

  // Contact form → /api/contact (the existing Cloudflare function).
  const form = $('.form'), status = $('.form-status'), submit = form.querySelector('[type="submit"]');
  const fallback = (lead) => {
    status.textContent = `${lead} Email us instead: `;
    status.append(Object.assign(document.createElement('a'), { href: 'mailto:hello@girgitlabs.com', textContent: 'hello@girgitlabs.com' }));
  };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const bad = [];
    if (!data.name?.trim()) bad.push('name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email || '')) bad.push('email');
    if (!data.build) bad.push('build');
    if ((data.message || '').trim().length < 10) bad.push('message');
    $$('[name]', form).forEach((el) => el.removeAttribute('aria-invalid'));
    bad.forEach((n) => form.elements[n].setAttribute('aria-invalid', 'true'));
    if (bad.length) { status.textContent = 'Check the highlighted fields. The message needs at least 10 characters.'; form.elements[bad[0]].focus(); return; }
    submit.disabled = true;
    status.textContent = 'Sending…';
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) { form.reset(); status.textContent = "Sent. You'll hear back within one working day, from the person who'd run the project."; }
      else if (res.status === 400 && body.fields) { body.fields.forEach((n) => form.elements[n]?.setAttribute('aria-invalid', 'true')); status.textContent = 'Check the highlighted fields.'; }
      else fallback("We couldn't send that just now.");
    } catch { fallback("We couldn't send that just now."); }
    finally { submit.disabled = false; }
  });
}

/* =====================================================================
   v2.1: hero hunt, appearing animations, footer, ambient motion
   ===================================================================== */

/* ---------- Pixel art slots ---------- */
$$('[data-pixel]').forEach((el) => { el.innerHTML = PIXELS[el.dataset.pixel](); });

/* ---------- Hero: "you missed it. we didn't." Find the three hidden things ---------- */
{
  const spots = $$('.spot'), out = $('[data-hero-hunt]');
  let found = 0;
  for (const s of spots) {
    s.addEventListener('click', () => {
      if (s.classList.contains('is-found')) return;
      s.classList.add('is-found');
      s.setAttribute('aria-label', `Found: ${s.dataset.spot}`);
      found++;
      if (found < spots.length) {
        out.textContent = `( found ${found} / ${spots.length}: ${s.dataset.spot}. keep looking. )`;
      } else {
        out.textContent = "( all 3. you didn't miss a thing. we'd hire you. actually, hire us. )";
        out.classList.add('is-done');
      }
    });
  }
}

/* ---------- Appearing: split headings into words, index staggered children ---------- */
for (const h of $$('[data-split]')) {
  let i = 0;
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement('span');
          w.className = 'w';
          const inner = document.createElement('span');
          inner.textContent = part;
          inner.style.setProperty('--i', i++);
          w.append(inner);
          frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
    }
  };
  walk(h);
  h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
}
$$('[data-stagger]').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));
onView($$('[data-split], [data-write], [data-stagger], .footer-mark'), (el) => el.classList.add('in-view'));

/* ---------- Footer: Mumbai's local time ---------- */
{
  const clock = $('[data-clock]');
  const tick = () => {
    clock.textContent = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date());
  };
  if (clock) { tick(); setInterval(tick, 30000); }
}

/* ---------- Ambient: parallax, magnetic buttons, cursor, ticker direction ---------- */
if (!reduce) {
  // Parallax: elements drift against the scroll by their factor.
  const par = $$('[data-parallax]');
  let lastY = scrollY, q = false;
  const ticker = $('.ticker');
  const onScroll = () => {
    for (const el of par) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      const off = (r.top + r.height / 2 - innerHeight / 2) * Number(el.dataset.parallax);
      el.style.translate = `0 ${off.toFixed(1)}px`;   // translate, so float animations (transform) still run
    }
    ticker?.classList.toggle('is-reversed', scrollY < lastY);
    lastY = scrollY;
  };
  addEventListener('scroll', () => { if (q) return; q = true; requestAnimationFrame(() => { q = false; onScroll(); }); }, { passive: true });
  onScroll();

  // Magnetic buttons pull toward the cursor.
  if (matchMedia('(pointer: fine)').matches) {
    for (const el of $$('.magnetic')) {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.28).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * 0.38).toFixed(1)}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    }

    // Cursor: a ring that grows into a label over things you can play with.
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.append(cursor);
    const LABELS = { click: 'click', drag: 'drag', copy: 'copy', talk: 'hi!', up: 'up' };
    addEventListener('pointermove', (e) => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      const t = e.target.closest?.('[data-cursor], .sticker');
      const label = t ? (t.classList.contains('sticker') ? 'drag' : LABELS[t.dataset.cursor]) : '';
      cursor.textContent = label || '';
      cursor.classList.toggle('has-label', !!label);
      cursor.classList.toggle('on-dark', !!e.target.closest?.('.finale, .ticker'));
    }, { passive: true });
  }

}
