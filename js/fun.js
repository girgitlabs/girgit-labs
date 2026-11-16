// Small rewards for the curious, all from how a chameleon lives. None of them blocks anything.
// - The fly: once per visit a fly buzzes across the page. Click it and Girgit, hiding just off screen,
//   takes it with his tongue. Catch three. (The count is kept on this device only.)
// - Always watching: leave the tab and the title notices.
// - The Konami code: the whole page changes colour for a few seconds.
// - A note in the console for the people who look under the hood.
// - Other parts of the page can show a message by dispatching 'girgit:toast'.

import { makeTongue } from './tongue.js?v=3.1.0';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

/* ---------- Messages ---------- */
function toast(text, ms = 3600) {
  document.querySelector('.egg-toast')?.remove();
  const t = document.createElement('div');
  t.className = 'egg-toast'; t.setAttribute('role', 'status'); t.textContent = text;
  document.body.append(t);
  if (!reduce) t.animate([{ opacity: 0, translate: '-50% 16px' }, { opacity: 1, translate: '-50% 0' }], { duration: 320, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
  setTimeout(() => t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260 }).finished.then(() => t.remove()), ms);
}
document.addEventListener('girgit:toast', (e) => toast(e.detail));

/* ---------- Always watching ---------- */
const title = document.title;
document.addEventListener('visibilitychange', () => { document.title = document.hidden ? 'Girgit is still looking at you.' : title; });

/* ---------- For the console ---------- */
try {
  console.log('%cGirgit sees you looking under the hood.', 'font: 900 18px Satoshi, system-ui; color: #43FF18; background: #111; padding: 8px 12px; border-radius: 8px;');
  console.log('Curious people make the best work. Say hello: connect@girgitlabs.design');
} catch { /* no console */ }

/* ---------- The Konami code ---------- */
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let k = 0;
addEventListener('keydown', (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  k = key === KONAMI[k] ? k + 1 : (key === KONAMI[0] ? 1 : 0);
  if (k < KONAMI.length) return;
  k = 0;
  document.documentElement.classList.add('is-chameleon');
  toast('You found Girgit’s secret. He changes for no one. Except you.');
  setTimeout(() => document.documentElement.classList.remove('is-chameleon'), 6000);
});

/* ---------- The fly ---------- */
if (!reduce && matchMedia('(pointer: fine)').matches) {
  const GOAL = 3;
  let caught = Number(store.get('girgit-flies')) || 0;
  const layer = document.createElement('div'); layer.className = 'fly-layer'; layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  const tongue = makeTongue(layer, 'fly');

  let fly = null, raf = 0;
  const spawn = () => {
    if (fly || document.hidden) return;
    fly = document.createElement('button');
    fly.className = 'fly'; fly.type = 'button'; fly.setAttribute('aria-label', 'A fly. Catch it?');
    fly.innerHTML = `<svg viewBox="0 0 34 34" aria-hidden="true"><ellipse class="fly-wing" cx="11" cy="11" rx="7" ry="4.5" fill="rgb(200 230 255 / 0.75)" stroke="#111" stroke-width="1.2" transform="rotate(-30 11 11)"/>
      <ellipse class="fly-wing" cx="23" cy="11" rx="7" ry="4.5" fill="rgb(200 230 255 / 0.75)" stroke="#111" stroke-width="1.2" transform="rotate(30 23 11)"/>
      <ellipse cx="17" cy="19" rx="5.5" ry="7.5" fill="#111"/><circle cx="14.5" cy="13" r="2.2" fill="#B3122E"/><circle cx="19.5" cy="13" r="2.2" fill="#B3122E"/></svg>`;
    document.body.append(fly);
    // A wandering path: slow sines on each axis, crossing the screen in about 14 seconds.
    const seed = Math.random() * 100, t0 = performance.now(), fromLeft = Math.random() < 0.5;
    const pos = { x: 0, y: 0 };
    const move = (now) => {
      if (!fly) return;
      const t = (now - t0) / 1000, W = innerWidth, H = innerHeight;
      const along = fromLeft ? -0.1 + t / 14 : 1.1 - t / 14;
      pos.x = along * W + Math.sin(t * 2.3 + seed) * 60;
      pos.y = H * (0.35 + 0.25 * Math.sin(t * 0.7 + seed)) + Math.sin(t * 5.1 + seed) * 24;
      fly.style.transform = `translate(${pos.x}px, ${pos.y}px) rotate(${Math.sin(t * 4 + seed) * 25}deg)`;
      if (along < -0.15 || along > 1.15) { fly.remove(); fly = null; return; }
      raf = requestAnimationFrame(move);
    };
    raf = requestAnimationFrame(move);
    fly.addEventListener('click', () => catchIt(pos), { once: true });
  };

  const catchIt = async (pos) => {
    cancelAnimationFrame(raf);
    const target = fly; fly = null;
    // Girgit is just below the bottom corner furthest from the fly: the tongue comes in from there.
    const fromRight = pos.x < innerWidth / 2;
    const m = [fromRight ? innerWidth + 30 : -30, innerHeight + 30];
    const t = [pos.x + 17, pos.y + 17];
    await tongue.shoot(m, t, {
      scale: 0.75, out: 140, back: 380,
      onPull: (tip) => { target.style.transform = `translate(${tip[0] - 17}px, ${tip[1] - 17}px)`; },
    });
    target.remove();
    caught += 1; store.set('girgit-flies', caught);
    if (caught < GOAL) toast(`Fly caught. ${caught} of ${GOAL}.`);
    else if (caught === GOAL) toast('Three for three. You notice things. We like that in a client.', 5200);
    else toast(`Fly number ${caught}. Girgit is getting spoilt.`);
  };

  // Once per visit, after 25 seconds, and only while the tab is in view: a reward, not a pest.
  let seen = false;
  try { seen = sessionStorage.getItem('girgit-fly') === '1'; } catch { /* private mode */ }
  if (!seen) setTimeout(() => { spawn(); try { sessionStorage.setItem('girgit-fly', '1'); } catch { /* fine */ } }, 25000);
}
