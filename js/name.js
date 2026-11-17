// THE NAME, as a page of a dictionary instead of a card. The entry for गिरगिट pins to the screen and its
// three meanings play out one after another as you scroll, each one acted by the word itself:
//   1. "A chameleon."                        the word, still, in forest green
//   2. "Someone who will not stay the same."  the word will not stay the same: it changes its skin
//   3. "Attention." (our meaning)             the word goes still again, back in forest green
// The page: a running head with the count, the headword huge on the left, the whole entry on the right with
// the current meaning in full ink and a rail that fills as you scroll (css: THE NAME, as a dictionary page).
// Reduced motion or no JS: the entry as it is, all three meanings in a list.

import { registerStages } from './stages.js?v=1.3.0';

const card = document.querySelector('.ec-dict');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (card && !reduce) {
  const head = card.querySelector('.st-dict-head'), defs = card.querySelector('.st-dict-defs'), word = card.querySelector('.st-dict-word');
  const items = [...defs.children];
  const pad = (n) => String(n).padStart(2, '0');
  card.classList.add('nm');
  const stage = document.createElement('div'); stage.className = 'nm-stage';
  const top = document.createElement('p'); top.className = 'nm-top'; top.setAttribute('aria-hidden', 'true');
  top.innerHTML = `<span>The name</span><span class="nm-of"><b>01</b> / ${pad(items.length)}</span>`;
  const now = top.querySelector('.nm-of b');
  stage.append(top, head, defs);
  card.append(stage);


  let beat = -1;
  const set = (b) => {
    if (b === beat) return;
    beat = b; card.dataset.beat = String(b);
    items.forEach((li, k) => { li.classList.toggle('is-on', k === b); li.classList.toggle('is-past', k < b); });
    now.textContent = pad(b + 1);
  };
  let raf = 0;
  const tick = () => {
    raf = 0;
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16 || 68;
    const r = card.getBoundingClientRect(), span = card.offsetHeight - stage.offsetHeight;
    const p = Math.min(1, Math.max(0, (navH - r.top) / Math.max(1, span)));
    defs.style.setProperty('--nm-p', p.toFixed(4));   // the rail beside the meanings fills as you scroll
    set(p < 0.3 ? 0 : p < 0.62 ? 1 : 2);
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
  addEventListener('resize', tick);
  tick();

  // Scroll locks (js/stages.js): one gesture per meaning, each landing well inside its beat.
  registerStages(() => {
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16 || 68;
    const top = card.getBoundingClientRect().top + window.scrollY, span = card.offsetHeight - stage.offsetHeight;
    return [0.02, 0.46, 0.84].map((p) => top - navH + p * span);
  }, 'looking');   // one run with the eye wall above it (js/eyes.js)
}
