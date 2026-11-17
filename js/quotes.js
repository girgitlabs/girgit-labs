// IN THEIR WORDS. The quotes share one stage; each takes the whole card in its client's colour, and the
// next opens over it through a circle from the middle, like an eye opening. Scrolling does not change
// them: the arrows do (and the numbers, the left/right keys while the section has focus, and a sideways
// swipe). From the last quote, "next" goes back round to the first.
// Every card keeps its "Draft" tag until the client signs off its wording (see the note in index.html).
// Reduced motion or no JS: the quotes as a list.

const sec = document.querySelector('.tq-sec');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (sec && !reduce) {
  const list = sec.querySelector('.tq-list'), cards = [...list.children];
  if (cards.length > 1) {
    sec.classList.add('tqx');
    const pad = (k) => String(k + 1).padStart(2, '0');

    // The controls: previous, the numbers, next.
    const nav = document.createElement('div');
    nav.className = 'tqx-nav';
    nav.setAttribute('role', 'group');
    nav.setAttribute('aria-label', 'Quotes');
    nav.innerHTML = `
      <button type="button" class="tqx-arrow" data-dir="-1" aria-label="Previous quote"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
      <p class="tqx-count">${cards.map((_, k) => `<button type="button" aria-label="Quote ${k + 1} of ${cards.length}">${pad(k)}</button>`).join('')}</p>
      <button type="button" class="tqx-arrow" data-dir="1" aria-label="Next quote"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>`;
    list.append(nav);
    const nums = [...nav.querySelectorAll('.tqx-count button')];
    const live = document.createElement('p');
    live.className = 'sr-only'; live.setAttribute('aria-live', 'polite');
    sec.append(live);

    let beat = -1;
    const set = (b, announce) => {
      b = (b + cards.length) % cards.length;
      if (b === beat) return;
      beat = b;
      cards.forEach((c, k) => {
        c.classList.toggle('is-open', k <= b); c.classList.toggle('is-on', k === b);
        c.toggleAttribute('inert', k !== b);                     // only the quote on show can be reached
      });
      nums.forEach((n, k) => { n.classList.toggle('is-on', k === b); n.toggleAttribute('aria-current', k === b); });
      if (announce) live.textContent = `Quote ${b + 1} of ${cards.length}`;
    };
    set(0);

    nav.addEventListener('click', (e) => {
      const arrow = e.target.closest('.tqx-arrow'), num = e.target.closest('.tqx-count button');
      if (arrow) set(beat + Number(arrow.dataset.dir), true);
      else if (num) set(nums.indexOf(num), true);
    });
    sec.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea')) return;
      if (e.key === 'ArrowRight') { set(beat + 1, true); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { set(beat - 1, true); e.preventDefault(); }
    });
    // A sideways swipe on the card (a vertical one still scrolls the page).
    let sx = null, sy = null;
    list.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    list.addEventListener('touchend', (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) set(beat + (dx < 0 ? 1 : -1), true);
    }, { passive: true });
  }
}
