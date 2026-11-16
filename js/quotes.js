// IN THEIR WORDS, as a scene. The quotes pin to the screen; each one takes the whole stage in its client's
// colour, and the next opens over it through a circle from the middle, like an eye opening. Scroll drives it.
// Every card keeps its "Draft" tag until the client signs off its wording (see the note in index.html).
// Reduced motion or no JS: the quotes as a list.

const sec = document.querySelector('.tq-sec');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (sec && !reduce) {
  const stage = sec.querySelector('.tq-stage'), list = sec.querySelector('.tq-list'), cards = [...list.children];
  if (cards.length > 1) {
    sec.classList.add('tqx');
    stage.style.setProperty('--n', cards.length);
    const count = document.createElement('p'); count.className = 'tqx-count'; count.setAttribute('aria-hidden', 'true');
    count.innerHTML = cards.map((_, k) => `<span>${String(k + 1).padStart(2, '0')}</span>`).join('');
    list.append(count);
    let beat = -1, raf = 0;
    const set = (b) => {
      if (b === beat) return;
      beat = b;
      cards.forEach((c, k) => { c.classList.toggle('is-open', k <= b); c.classList.toggle('is-on', k === b); });
      [...count.children].forEach((s, k) => s.classList.toggle('is-on', k === b));
    };
    const tick = () => {
      raf = 0;
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16 || 68;
      const r = stage.getBoundingClientRect(), span = stage.offsetHeight - list.offsetHeight;
      const p = Math.min(0.999, Math.max(0, (navH - r.top) / Math.max(1, span)));
      set(Math.floor(p * cards.length));
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
    addEventListener('resize', tick);
    tick();
  }
}
