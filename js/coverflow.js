// THE WORK: "Different every time. That is the point." A cover flow of the projects, built from the project
// list in the page (which stays as the content, and as what shows without JS). One cover per project: a real
// shot from the project, full bleed (assets/work/covers/, cropped from each project's own images).
//
// The section is the chameleon. As a project comes to the centre, the whole section takes on that client's
// colour (the --brand on its list item), and the caption names the colour like a paint chip: none of these
// looks are ours. The open slot is forest, and its chip is empty: your colour goes there.
//
// The centre card faces you; the others fan out on either side along an arc, like a hand of cards. Drag or
// swipe, scroll sideways, use the arrows, the arrow keys or the index under the caption; a side cover comes
// to the centre when clicked; the centre cover opens its case study. Motion is a spring that settles, never
// snaps. It loops. While it is on screen and nobody touches it, it moves on by itself, and the index fills
// for the time left on the current project. Reduced motion: no autoplay, no spring, the colour changes at once.

const list = document.querySelector('#work .pl');
const section = list && list.closest('section');
const COVER = {
  'work/clay-and-glaze/': 'assets/work/covers/cover-clay-and-glaze-v2.webp',
  'work/ld-screw/': 'assets/work/covers/cover-ld-screw-v2.webp',
  'work/moshi/': 'assets/work/covers/cover-moshi-v2.webp',
  '#talk': 'assets/work/covers/cover-open-slot-v2.webp',
};
const OPEN_BG = '#142118';   // the open slot: forest, the studio's own colour, until it is yours
const DWELL = 4200;          // how long each project stays when the flow moves on by itself
const IDLE = 8000;           // how long after a touch before it starts moving on again

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const lum = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

if (list && section) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [...list.querySelectorAll('.pl-card')].map((a) => ({
    href: a.getAttribute('href'),
    n: a.querySelector('.pl-n')?.textContent || '',
    cat: a.querySelector('.pl-cat')?.textContent || '',
    name: a.querySelector('.pl-name')?.textContent || '',
    line: a.querySelector('.pl-line')?.textContent || '',
    open: a.classList.contains('pl-card--next'),
    bg: (a.style.getPropertyValue('--brand').trim() || OPEN_BG).toUpperCase(),
  })).filter((it) => COVER[it.href]);

  if (items.length > 1) {
    const N = items.length;
    const M = N * Math.max(2, Math.ceil(8 / N));   // enough covers to loop, always a whole number of sets

    const root = document.createElement('div');
    root.className = 'cf';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carousel');
    root.setAttribute('aria-label', 'Selected work');
    root.style.setProperty('--cf-dwell', `${DWELL}ms`);
    root.innerHTML = `
      <div class="cf-stage" tabindex="0" aria-label="Use the left and right arrow keys to move through the work">
        ${Array.from({ length: M }, (_, k) => { const it = items[k % N]; return `
          <a class="cf-cover" href="${esc(it.href)}" data-k="${k}" aria-label="${esc(it.name)}" tabindex="-1" draggable="false"${k >= N ? ' aria-hidden="true"' : ''}>
            <img src="${COVER[it.href]}" width="1200" height="1200" alt="" loading="lazy" decoding="async" draggable="false">
          </a>`; }).join('')}
      </div>
      <button class="cf-arrow cf-prev" type="button" aria-label="Previous project"><span aria-hidden="true">←</span></button>
      <button class="cf-arrow cf-next" type="button" aria-label="Next project"><span aria-hidden="true">→</span></button>
      <div class="cf-caption" aria-live="off"></div>
      <div class="cf-index" style="--n:${N}">
        ${items.map((it, n) => `<button class="cf-tab" type="button" data-n="${n}" aria-current="false" aria-label="Show ${esc(it.open ? 'the open slot' : it.name)}"><b>${esc(it.n)}</b><span>${esc(it.open ? 'Your project' : it.name)}</span></button>`).join('')}
      </div>`;
    list.before(root);
    list.classList.add('is-flowed');

    // The colour lives on its own layer under the section, so the page's light/dark blend (js/tone.js) is untouched.
    const wash = document.createElement('div');
    wash.className = 'cf-wash';
    wash.setAttribute('aria-hidden', 'true');
    section.prepend(wash);
    section.classList.add('is-flow');

    const stage = root.querySelector('.cf-stage');
    const covers = [...root.querySelectorAll('.cf-cover')];
    const caption = root.querySelector('.cf-caption');
    const tabs = [...root.querySelectorAll('.cf-tab')];
    const wrap = (v, n) => ((v % n) + n) % n;
    let pos = 0, vel = 0, target = 0, S = 300, raf = 0, shown = -1, shownAt = 0, visible = false, touchedAt = -Infinity, auto = false;

    const measure = () => { S = covers[0].offsetWidth || stage.clientHeight * 0.8; place(); };

    const cap = (it) => `
      <p class="cf-id"><span>${esc(it.n)}</span><span>${esc(it.cat)}</span>${it.open
        ? '<span class="cf-chip is-open"><i></i>Your colour</span>'
        : `<span class="cf-chip" style="--chip:${esc(it.bg)}"><i></i><span class="sr-only">Their colour: </span>${esc(it.bg)}</span>`}</p>
      <h3 class="cf-name">${esc(it.name)}</h3>
      <p class="cf-line">${esc(it.line)}</p>
      ${it.open ? '<a class="btn btn--primary cf-go" href="#talk">Start a project</a>' : `<a class="btn btn--ghost cf-go" href="${esc(it.href)}">Read the case study</a>`}`;

    // A project arrives at the centre: the section changes colour, the caption and the index follow.
    const show = (k) => {
      shown = k; shownAt = performance.now();
      const it = items[k];
      section.style.setProperty('--cf-bg', it.bg);
      section.style.setProperty('--cf-ink', lum(it.bg) > 0.6 ? '#111111' : '#F4EFE5');
      caption.innerHTML = cap(it);
      caption.classList.remove('is-in'); void caption.offsetWidth; caption.classList.add('is-in');
      tabs.forEach((t, n) => t.setAttribute('aria-current', n === k ? 'true' : 'false'));
      if (auto) { root.classList.remove('is-auto'); void root.offsetWidth; root.classList.add('is-auto'); }
    };

    // Where a card sits for a given offset from the centre (o, in cards; fractional while moving): a fanned
    // hand. The centre card faces you; the others fan out along an arc, a little smaller, tilted and dimmer,
    // each one fully visible, so the deck always reads as a set.
    const place = () => {
      const STEP = S * 0.74;
      covers.forEach((c, k) => {
        const o = wrap(k - pos + M / 2, M) - M / 2, a = Math.abs(o), sg = Math.sign(o), near = Math.min(1, a);
        // The centre card lifts a little toward you; the side cards step back, smaller and clearly dimmer,
        // so the one in focus is unmistakable while the rest still read as the set.
        const x = o * STEP * (1 - Math.min(a, 3) * 0.06);
        const y = Math.pow(a, 1.7) * S * 0.07 - (1 - near) * S * 0.02;
        const z = -a * S * 0.22 + (1 - near) * S * 0.04;
        const rz = o * 5.5, ry = -sg * near * 12, sc = 1 - Math.min(a, 3) * 0.17;
        c.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) rotate(${rz.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        c.style.zIndex = String(100 - Math.round(a * 10));
        c.style.filter = a > 0.02 ? `brightness(${(1 - near * 0.42).toFixed(3)}) saturate(${(1 - near * 0.45).toFixed(3)})` : '';
        c.style.opacity = a > 2.7 ? '0' : a > 2 ? String((2.7 - a) / 0.7) : '1';
        c.classList.toggle('is-centre', a < 0.5);
        c.tabIndex = a < 0.5 ? 0 : -1;
      });
      const k = wrap(Math.round(pos), N);
      if (k !== shown) show(k);
    };

    // A spring toward the target: quick to leave, soft to land.
    let dragging = false;
    const run = () => {
      if (raf) return;
      let t0 = performance.now();
      const step = (now) => {
        const h = Math.min(0.032, (now - t0) / 1000); t0 = now;
        if (!dragging) {
          const k = 170, d = 2 * Math.sqrt(k) * 0.86;
          vel += (-k * (pos - target) - d * vel) * h; pos += vel * h;
        }
        place();
        if (!dragging && Math.abs(pos - target) < 0.0005 && Math.abs(vel) < 0.0005) { pos = target; vel = 0; place(); raf = 0; return; }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const go = (k) => { target = k; if (reduce) { pos = target; place(); } else run(); };

    // Moving on by itself, and the index line that shows it, stop the moment someone takes over; and the
    // caption is only announced to screen readers when it changes because of them, not every few seconds.
    const setAuto = (on) => {
      if (on === auto) return;
      auto = on;
      root.classList.toggle('is-auto', on);
      if (on) { shownAt = performance.now(); caption.setAttribute('aria-live', 'off'); }
    };
    const touch = () => { touchedAt = performance.now(); setAuto(false); caption.setAttribute('aria-live', 'polite'); };

    root.querySelector('.cf-prev').addEventListener('click', () => { touch(); go(target - 1); });
    root.querySelector('.cf-next').addEventListener('click', () => { touch(); go(target + 1); });
    tabs.forEach((t) => t.addEventListener('click', () => {
      touch();
      const half = Math.floor(N / 2);
      go(target + wrap(Number(t.dataset.n) - wrap(Math.round(target), N) + half, N) - half);   // the short way round
    }));
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); touch(); go(target + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); touch(); go(target - 1); }
    });

    // Drag and swipe: the flow follows the finger, then flicks on with the release speed.
    let startX = 0, startPos = 0, moved = 0, lastX = 0, lastT = 0, flick = 0;
    stage.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      touch();
      dragging = true; moved = 0; startX = lastX = e.clientX; lastT = performance.now(); startPos = pos; flick = 0;
      stage.setPointerCapture(e.pointerId); stage.classList.add('is-dragging'); run();
    });
    stage.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const now = performance.now(), dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      pos = startPos - dx / (S * 0.55);
      flick = (e.clientX - lastX) / Math.max(1, now - lastT); lastX = e.clientX; lastT = now;
    });
    const release = (e) => {
      if (!dragging) return;
      dragging = false; stage.classList.remove('is-dragging'); touch();
      if (moved <= 6 && e && e.type === 'pointerup') {
        // A tap: a side cover comes to the centre; the centre cover opens its case study.
        const hit = document.elementsFromPoint(e.clientX, e.clientY).find((el) => el.classList?.contains('cf-cover'));
        if (hit) {
          const k = Number(hit.dataset.k), o = Math.round(wrap(k - pos + M / 2, M) - M / 2);
          if (o === 0) { location.href = hit.getAttribute('href'); return; }
          target = Math.round(pos) + o; vel = 0; run(); return;
        }
      }
      target = Math.round(pos - flick * 0.9); vel = 0; run();
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    // Mouse and touch go through the tap above; a click from the keyboard (Enter) opens the centre cover.
    covers.forEach((c) => c.addEventListener('click', (e) => { if (e.detail !== 0) e.preventDefault(); }));
    // Sideways scrolling (trackpads) moves the flow; up and down still scroll the page.
    let wheelAcc = 0;
    stage.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault(); touch();
      wheelAcc += e.deltaX;
      if (Math.abs(wheelAcc) > 60) { go(target + Math.sign(wheelAcc)); wheelAcc = 0; }
    }, { passive: false });

    // On its own, while on screen and untouched: each project stays DWELL, then the next comes in.
    if (!reduce) setInterval(() => {
      const now = performance.now();
      const can = visible && !document.hidden && !dragging && now - touchedAt > IDLE;
      setAuto(can);
      if (can && now - shownAt >= DWELL) go(target + 1);
    }, 200);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.5 }).observe(stage);
      // The first time it comes into view, the flow opens like an eye (css: .cf.is-open).
      new IntersectionObserver(([e], o) => { if (e.isIntersecting) { root.classList.add('is-open'); o.disconnect(); } }, { threshold: 0.25 }).observe(root);
    } else root.classList.add('is-open');

    new ResizeObserver(measure).observe(stage);
    measure();
  }
}
