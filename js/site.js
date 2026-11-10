// Girgit Labs: the home page's shared behaviour, and every section's script.
import './home.js';          // Hero: the colour flood, the scrambling word, Girgit in the clashing colour
import './what.js';          // What we do: the scroll-driven turntable
import './eyes.js';          // The eye wall, and the panel (with the name) that rises over it
import './eye-cluster.js';   // The eye wall's tiles, in small clusters beside the quotes and the fits
import './how.js';           // How we work: the week's eyes wake up, Girgit arrives at "Live"
import './s5.js';            // The statement's words, and Girgit's tongue on "Start a project"
import './footer-banner.js'; // Footer: the framed banner with the logo
import './analytics.js';     // PostHog custom analytics

document.documentElement.classList.add('js');   // reveal animations only hide content once JS is running

// Scroll scenes measure where their sections sit once, at load. Anything that changes the page's
// height afterwards (fonts arriving, a late image) would leave them firing early, so re-measure
// whenever the height changes.
if (window.ScrollTrigger && 'ResizeObserver' in window) {
  let h = 0, t = 0;
  new ResizeObserver(() => {
    const now = document.documentElement.scrollHeight;
    if (Math.abs(now - h) < 2) return;
    h = now; clearTimeout(t); t = setTimeout(() => window.ScrollTrigger.refresh(), 150);
  }).observe(document.body);
  document.fonts?.ready.then(() => window.ScrollTrigger.refresh());
}
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const onView = (els, fn, opts = { rootMargin: '0px 0px -12% 0px' }) => {
  if (!('IntersectionObserver' in window)) { els.forEach(fn); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }), opts);
  els.forEach((el) => io.observe(el));
};

/* ---------- Reveal on scroll ---------- */
onView($$('[data-reveal]'), (el) => el.classList.add('in-view'));

/* ---------- Nav: shadow once scrolled, the active section's link ---------- */
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
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(!el.classList.contains('is-en')); } });
}

/* ---------- Let's talk: the contact card, copy email, the form ---------- */
{
  const card = $('[data-form-card]'), heading = $('#form-title'), opener = $('[data-open-form]');
  const openCard = () => {
    card.hidden = false;
    heading.focus({ preventScroll: true });
    card.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  };
  opener.addEventListener('click', openCard);
  const close = () => { card.hidden = true; opener.focus(); };
  $('[data-close-form]').addEventListener('click', close);
  card.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // Copy email
  // On success the button pops into a "Copied!" pill, a toast rises above it and sparks burst out
  // (no sparks with reduced motion); the status line tells screen readers. All of it resets after 2.2s.
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const SPARKS = ['#43FF18', '#FFE500', '#FF168C', '#173BFF', '#F4EFE5'];
  const burst = (b) => {
    if (calm.matches) return;
    const x = b.offsetLeft + b.offsetWidth / 2, y = b.offsetTop + b.offsetHeight / 2;
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('span'), a = (i / 12) * Math.PI * 2 + Math.random() * 0.4, r = 34 + Math.random() * 30;
      s.className = 'copy-spark'; s.setAttribute('aria-hidden', 'true');
      s.style.cssText = `left:${x}px;top:${y}px;--c:${SPARKS[i % SPARKS.length]};--dx:${(Math.cos(a) * r).toFixed(1)}px;--dy:${(Math.sin(a) * r).toFixed(1)}px`;
      b.parentElement.append(s);
      setTimeout(() => s.remove(), 700);
    }
  };
  for (const b of $$('[data-copy]')) {
    const label = b.textContent;
    let timer = 0, toast = null;
    b.addEventListener('click', async () => {
      const out = b.parentElement.querySelector('.copied');
      try { await navigator.clipboard.writeText(b.dataset.copy); }
      catch { location.href = `mailto:${b.dataset.copy}`; return; }
      clearTimeout(timer); toast?.remove();
      b.classList.remove('is-copied'); void b.offsetWidth; b.classList.add('is-copied');
      b.textContent = '✓ Copied!';
      if (out) out.textContent = 'Email copied to clipboard';
      toast = document.createElement('span');
      toast.className = 'copy-toast'; toast.setAttribute('aria-hidden', 'true');
      const addr = document.createElement('b'); addr.textContent = b.dataset.copy;
      toast.append('On your clipboard: ', addr);
      b.parentElement.append(toast);
      burst(b);
      timer = setTimeout(() => { b.classList.remove('is-copied'); b.textContent = label; if (out) out.textContent = ''; toast?.remove(); toast = null; }, 2200);
    });
  }

  // Contact form → /api/contact (the existing Cloudflare function).
  const form = $('.form'), status = $('.form-status'), submit = form.querySelector('[type="submit"]');
  const fallback = (lead) => {
    status.textContent = `${lead} Email us instead: `;
    status.append(Object.assign(document.createElement('a'), { href: 'mailto:connect@girgitlabs.design', textContent: 'connect@girgitlabs.design' }));
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
      let sent = false;
      try {
        const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.ok) sent = true;
      } catch (_) {}

      if (!sent) {
        // Direct fallback to Google Sheet Web App
        await fetch('https://script.google.com/macros/s/AKfycbymkJKr1Bw5KVpv3fVP9xoklhghi2_jFRkjgGaXcjLjsOynV8jG0GOLg9Nf0aZvrzBk/exec', {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        sent = true;
      }

      if (sent) {
        form.reset();
        status.textContent = "Sent. You'll hear back within one working day, from the person who'd run the project.";
        try { window.posthog?.capture('contact_form_submitted', { build: data.build }); } catch (_) {}
      } else {
        fallback("We couldn't send that just now.");
      }
    } catch { fallback("We couldn't send that just now."); }
    finally { submit.disabled = false; }
  });
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
onView($$('[data-split], [data-stagger], .deco'), (el) => el.classList.add('in-view'));

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
  // Parallax: elements drift against the scroll by their factor. Phones: no scroll-linked drift.
  const par = matchMedia('(min-width: 761px)').matches ? $$('[data-parallax]') : [];
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

  if (matchMedia('(pointer: fine)').matches) {
    // Magnetic buttons pull toward the cursor.
    for (const el of $$('.magnetic')) {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.28).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * 0.38).toFixed(1)}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    }

    // Cursor: a ring that grows into a label over things marked data-cursor.
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.append(cursor);
    const LABELS = { click: 'click', drag: 'drag', copy: 'copy', talk: 'hi!', up: 'up' };
    addEventListener('pointermove', (e) => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      const t = e.target.closest?.('[data-cursor]');
      const label = t ? LABELS[t.dataset.cursor] : '';
      cursor.textContent = label || '';
      cursor.classList.toggle('has-label', !!label);
      cursor.classList.toggle('on-dark', !!e.target.closest?.('.ticker'));
    }, { passive: true });
  }
}
