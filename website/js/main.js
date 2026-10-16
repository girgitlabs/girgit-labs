/* Girgit Labs — interactions
   Everything here is enhancement: without JS the page still reads in full. */
(() => {
  'use strict';

  // Form endpoint. Defaults to this site's own serverless function, which
  // expects to be reachable at /api/contact (see website/api/contact.js and the
  // Vercel Root Directory note in README.md). Point it at a Formspree or CRM
  // webhook URL instead if you'd rather not run the function.
  // On Netlify, leave empty and the data-netlify attribute handles the form.
  const FORM_ENDPOINT = '/api/contact';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------------- Header ---------------- */
  const header = $('.site-header');
  const onScrollHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  const nav = $('.nav');
  const toggle = $('.nav__toggle');
  const toggleLabel = $('.nav__toggle-label');
  const menuLinks = $$('.nav__list a');
  const backBtn = $('.nav__back');
  const setMenu = (open, { returnFocus = true } = {}) => {
    if (open === nav.classList.contains('is-open')) return;
    nav.classList.toggle('is-open', open);
    header.classList.toggle('is-menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (toggleLabel) toggleLabel.textContent = open ? 'Close' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(() => (backBtn || menuLinks[0]).focus({ preventScroll: true }), 60);
    else if (returnFocus) toggle.focus({ preventScroll: true });
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  menuLinks.forEach((a) => a.addEventListener('click', () => setMenu(false, { returnFocus: false })));
  if (backBtn) backBtn.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', (e) => {
    if (!nav.classList.contains('is-open')) return;
    if (e.key === 'Escape') { setMenu(false); return; }
    if (e.key === 'Tab') {            // keep focus inside the open menu
      const items = [toggle, backBtn, ...menuLinks].filter(Boolean);
      const i = items.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    }
  });

  // Active nav link
  const navLinks = $$('.nav__list a:not(.btn)');
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => sectionIO.observe(s));

  /* ---------------- Hindi words: hover, tap, keyboard ---------------- */
  $$('.hi').forEach((el) => {
    const set = (on) => {
      el.classList.toggle('is-on', on);
      el.setAttribute('aria-pressed', String(on));
      $$('.hi--hint').forEach((h) => h.classList.add('hint-done'));
    };
    el.addEventListener('click', () => set(!el.classList.contains('is-on')));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(!el.classList.contains('is-on')); }
    });
    if (canHover) el.addEventListener('mouseenter', () => $$('.hi--hint').forEach((h) => h.classList.add('hint-done')), { once: true });
  });

  /* ---------------- Reveal on scroll ---------------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el) => revealIO.observe(el));
  document.documentElement.classList.add('js-ready');

  /* ---------------- Scroll-linked scenes ---------------- */
  const hero = $('.hero');
  let scrollRaf = 0;
  const onScrollScenes = () => {
    scrollRaf = 0;
    if (hero) {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--env', clamp(-r.top / (r.height * 0.8), 0, 1).toFixed(3));
    }
  };
  const queueScenes = () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(onScrollScenes); };
  window.addEventListener('scroll', queueScenes, { passive: true });
  window.addEventListener('resize', queueScenes);
  onScrollScenes();

  /* ---------------- Services: highlight the card in view ---------------- */
  const services = $$('.service');
  if (services.length) {
    const serviceIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) services.forEach((s) => s.classList.toggle('is-active', s === en.target)); });
    }, { rootMargin: '-40% 0px -45% 0px' });
    services.forEach((li) => serviceIO.observe(li));
    // the glint on the glass follows the cursor
    services.forEach((li) => li.addEventListener('pointermove', (e) => {
      const r = li.getBoundingClientRect();
      li.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      li.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    }));
  }

  /* ---------------- Work: the strip glides sideways while the section is pinned ---------------- */
  const work = $('.work');
  const track = work && $('.work__track', work);
  if (work && track) {
    if (reduceMotion) work.classList.add('is-static');
    else {
      const fill = $('.work__bar-fill', work);
      const now = $('.work__count-now', work);
      const cards = $$('.wcard:not(.wcard--end)', work);
      let x = 0, raf = 0;
      const update = () => {
        raf = 0;
        const r = work.getBoundingClientRect();
        const span = Math.max(1, r.height - window.innerHeight);
        const p = clamp(-r.top / span, 0, 1);
        const travel = Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
        x = -travel * p;
        track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
        if (fill) fill.style.transform = `scaleX(${p.toFixed(4)})`;
        if (now) now.textContent = String(Math.min(cards.length, 1 + Math.floor(p * cards.length * 0.999))).padStart(2, '0');
      };
      const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
      window.addEventListener('scroll', queue, { passive: true });
      window.addEventListener('resize', queue);
      update();
    }
    $$('.wcard', work).forEach((card) => card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    }));
  }

  /* ---------------- Contact form ---------------- */
  const form = $('.form');
  if (form) {
    const status = $('.form__status', form);
    const btn = $('button[type="submit"]', form);
    const rules = [
      ['f-name', (v) => v.trim() ? '' : 'Please tell us your name.'],
      ['f-email', (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.'],
      ['f-build', (v) => v ? '' : 'Please choose one. “Not sure yet” is fine.'],
      ['f-about', (v) => v.trim().length >= 10 ? '' : 'A sentence or two is plenty.'],
    ];
    const check = (id) => {
      const input = document.getElementById(id);
      const msg = rules.find((r) => r[0] === id)[1](input.value);
      const field = input.closest('.field');
      field.classList.toggle('has-error', !!msg);
      $('.field__error', field).textContent = msg;
      input.setAttribute('aria-invalid', String(!!msg));
      if (msg) input.setAttribute('aria-describedby', id + '-err'); else input.removeAttribute('aria-describedby');
      return !msg;
    };
    rules.forEach(([id]) => {
      const input = document.getElementById(id);
      input.addEventListener('blur', () => { if (input.value) check(id); });
      input.addEventListener('input', () => { if (input.closest('.field').classList.contains('has-error')) check(id); });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ok = rules.map(([id]) => check(id));
      if (ok.includes(false)) {
        document.getElementById(rules[ok.indexOf(false)][0]).focus();
        return;
      }
      btn.disabled = true;
      status.textContent = 'Sending…';
      const data = new FormData(form);
      const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
      try {
        if (FORM_ENDPOINT) {
          const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error(res.status);
        } else if (isLocal) {
          await new Promise((r) => setTimeout(r, 600)); // preview only: nothing is sent
          console.info('[Girgit] Form not connected. Set FORM_ENDPOINT or deploy to Netlify.', Object.fromEntries(data));
        } else {
          const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() });
          if (!res.ok) throw new Error(res.status);
        }
        form.classList.add('is-sent');
        status.textContent = 'Thank you. We’ll read it properly and be in touch soon.';
      } catch (err) {
        btn.disabled = false;
        // 503 = the endpoint exists but no mail provider is configured yet;
        // 502 = the provider refused the send. Both mean "use the address".
        const code = Number(err && err.message);
        status.innerHTML = code >= 500
          ? 'That didn’t go through on our side. Please write to <a href="mailto:hello@girgitlabs.com">hello@girgitlabs.com</a> — it reaches the same people.'
          : 'That didn’t go through. Please try again, or write to <a href="mailto:hello@girgitlabs.com">hello@girgitlabs.com</a>.';
      }
    });
  }
})();
