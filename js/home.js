// HOME, the hero: "WE DESIGN ___." For each word, Girgit becomes the thing itself, in clay: he paints
// himself into a brush (brands), sits on a cursor (websites), clicks together from parts (products), steps
// out of a phone (apps), breaks into motion (films).
// Every change lands as a splatter of ink: the next state (its colour, its word, its Girgit, drawn on one
// canvas) shows through blots, drips and flying droplets that grow and run together until they cover the hero.
// Every 3 seconds the next state lands on its own as a splash of paint. It runs only while the hero is on
// screen and the tab is visible, and waits while someone is painting. Reduced motion: no painting; a click or a dot changes the state at once.
// No JS: the first state, still.

const hero = document.querySelector('.hx');

// [word, background, ink, Girgit]. Each background is the palette colour that makes that scene pop.
const IMG = (n) => `assets/img/clay/hero-${n}.webp`;
const STATES = [
  ['websites.', '#173BFF', '#F4EFE5', IMG('websites-v2')],   // blue: the ivory cursor and green Girgit pop
  ['brands.', '#FFE500', '#111111', IMG('brands-v2')],     // yellow: the pink paint pops (the handle fades out at the top)
  ['products.', '#FF168C', '#111111', IMG('products-v2')],   // pink: the blue and ivory parts pop
  ['apps.', '#43FF18', '#111111', IMG('apps-v2')],           // acid: the blue phone pops
  ['films.', '#111111', '#F4EFE5', IMG('films-v2')],         // black: the glowing pieces pop
];
// The header sits on the hero in the hero's ink, so it never fights the colour behind it.
const navInk = (ink) => { const r = document.documentElement.style; r.setProperty('--nav-ink', ink); r.setProperty('--nav-inv', ink === '#111111' ? '0' : '0.95'); };
// What the line under the word says, for each thing he becomes.
const SUBS = [
  'Fast, clear websites built around your idea. <strong>Live in seven days.</strong>',
  'Brands people remember. <strong>Built from what makes you different.</strong>',
  'Products shaped around the people who use them. <strong>Nothing out of place.</strong>',
  'Apps that feel right in the hand. <strong>Every tap answered.</strong>',
  'Motion and film that stop the scroll. <strong>Every frame on purpose.</strong>',
];
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+?!';
const SIZE = [1, 1.3, 1, 1, 1];   // the paintbrush scene is tall and slim: it stands a little larger

if (hero) {
  const frame = hero.querySelector('.hx-frame') || hero;
  const word = hero.querySelector('.hx-word');
  const sub = hero.querySelector('.hx-sub');
  // The word always fits the frame: each word gets the biggest size (up to the design size) at which it
  // sits inside the frame with a margin, so a long one (PRODUCTS.) never bleeds off the edge.
  const fitCv = document.createElement('canvas').getContext('2d');
  const fitSize = (text) => {
    const base = innerWidth < 900 ? innerWidth * 0.18 : Math.min(innerWidth * 0.195, innerHeight * 0.40);
    const cs = word ? getComputedStyle(word) : null, ls = cs ? parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize) || -0.055 : -0.055;
    fitCv.font = `900 ${base}px Satoshi, system-ui, sans-serif`;
    const w = fitCv.measureText(text.toUpperCase()).width + ls * base * text.length;
    const room = (frame.clientWidth || innerWidth) * 0.92;
    return Math.floor(Math.min(base, base * room / Math.max(1, w)));
  };
  const fitWord = (text) => { if (word) word.style.fontSize = `${fitSize(text)}px`; };
  // The line changes with the word: the old one lifts away, the new one settles in.
  let subT = 0;
  const setSub = (k, quiet) => {
    if (!sub || sub.dataset.k === String(k)) return;
    sub.dataset.k = String(k);
    if (quiet || matchMedia('(prefers-reduced-motion: reduce)').matches) { sub.innerHTML = SUBS[k]; return; }
    clearTimeout(subT); sub.classList.add('is-out');
    subT = setTimeout(() => { sub.innerHTML = SUBS[k]; sub.classList.remove('is-out'); }, 320);
  };
  const dots = [...hero.querySelectorAll('.hx-dots button')];
  const girgit = hero.querySelector('.hx-girgit');
  const skin = hero.querySelector('.hx-skin');
  const cv = hero.querySelector('.hx-paint');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = cv && cv.getContext ? cv.getContext('2d') : null;
  const pics = STATES.map((s) => { const im = new Image(); im.decoding = 'async'; im.src = s[3]; return im; });   // ready before they are needed

  let i = 0, target = 1, visible = true, flooding = null, scrambleRaf = 0;
  let W = 0, H = 0, DPR = 1, layer = null, mask = null, mctx = null, grid = null, painted = 0, last = null;
  const GX = 32, GY = 18;

  const scramble = (text) => {
    cancelAnimationFrame(scrambleRaf);
    if (reduce || !word) { if (word) word.textContent = text; return; }
    const start = performance.now(), DUR = 420;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / DUR), settled = Math.floor(k * text.length);
      word.textContent = text.slice(0, settled) + [...text.slice(settled)].map((c) => (c === '.' ? '.' : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
      if (k < 1) scrambleRaf = requestAnimationFrame(tick);
    };
    scrambleRaf = requestAnimationFrame(tick);
  };

  const mark = (k) => dots.forEach((d, n) => { d.classList.toggle('is-on', n === k); d.setAttribute('aria-pressed', String(n === k)); });

  // Make state k the hero, in the DOM.
  const become = (k, quiet) => {
    const s = STATES[k];
    i = k; target = (k + 1) % STATES.length;
    hero.style.setProperty('--bg', s[1]);
    hero.style.setProperty('--fg', s[2]); navInk(s[2]); fitWord(s[0]);
    hero.dataset.state = String(k); document.documentElement.dataset.hero = String(k); setSub(k, quiet);
    if (skin) skin.src = s[3];
    if (girgit) girgit.querySelector('.hx-gbody').style.scale = String(SIZE[k]);
    if (word) { if (quiet) { cancelAnimationFrame(scrambleRaf); word.textContent = s[0]; } else scramble(s[0]); }
    mark(k);
  };

  if (!ctx || reduce) {
    // No canvas or reduced motion: a click or a dot changes the state at once.
    hero.addEventListener('click', (e) => { if (e.target.closest('a, .hx-band, .hx-dots')) return; become((i + 1) % STATES.length); });
    dots.forEach((d, k) => d.addEventListener('click', (e) => { e.stopPropagation(); become(k); }));
  } else {

    /* ---- the next state, drawn once per size: its colour, its word where the word sits, its Girgit where he stands ---- */
    const compose = () => {
      if (!W || !H) return;
      const s = STATES[target], pic = pics[target], fr = frame.getBoundingClientRect();
      layer = layer || document.createElement('canvas');
      layer.width = Math.round(W * DPR); layer.height = Math.round(H * DPR);
      const g = layer.getContext('2d');
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      g.fillStyle = s[1]; g.fillRect(0, 0, W, H);
      if (word) {
        const r = word.getBoundingClientRect(), cs = getComputedStyle(word), fs = fitSize(s[0]);
        g.font = `900 ${fs}px Satoshi, system-ui, sans-serif`;
        if ('letterSpacing' in g) g.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
        g.fillStyle = s[2]; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        const text = s[0].toUpperCase(), m = g.measureText(text);
        const asc = m.fontBoundingBoxAscent || fs * 0.8, desc = m.fontBoundingBoxDescent || fs * 0.2;
        const lh = fs * 0.8;
        const y = r.top - fr.top + r.height / 2 - lh / 2 + (lh - (asc + desc)) / 2 + asc;   // centred where the word sits
        g.fillText(text, r.left - fr.left + r.width / 2, y);
      }
      if (girgit && pic.complete && pic.naturalWidth) {
        const g0 = girgit.getBoundingClientRect(), sz = SIZE[target];
        const b = { width: g0.width * sz, height: g0.height * sz }, x = g0.left - fr.left + (g0.width - b.width) / 2, y = g0.bottom - fr.top - b.height;
        const glow = g.createRadialGradient(x + b.width / 2, y + b.height * 0.58, 0, x + b.width / 2, y + b.height * 0.58, b.width * 0.48);
        glow.addColorStop(0, 'rgba(255,255,255,0.34)'); glow.addColorStop(0.55, 'rgba(255,255,255,0.12)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = glow; g.fillRect(x - b.width * 0.1, y - b.height * 0.1, b.width * 1.2, b.height * 1.2);
        g.filter = 'drop-shadow(0 26px 22px rgba(0,0,0,0.28))';
        g.drawImage(pic, x, y, b.width, b.height);
        g.filter = 'none';
      }
    };
    const clearMask = () => { if (mctx) mctx.clearRect(0, 0, mask.width, mask.height); grid = new Uint8Array(GX * GY); painted = 0; last = null; };
    const size = () => {
      W = frame.clientWidth; H = frame.clientHeight; DPR = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      mask = mask || document.createElement('canvas'); mask.width = Math.ceil(W / 2); mask.height = Math.ceil(H / 2); mctx = mask.getContext('2d');
      clearMask(); compose(); draw();
    };

    /* ---- the paint: a soft core with ragged bristles, so the edge reads as paint, not a circle ---- */
    const stamp = (x, y, r) => {
      const mx = x / 2, my = y / 2, mr = r / 2;
      mctx.fillStyle = '#000';
      mctx.beginPath(); mctx.arc(mx, my, mr * 0.8, 0, 7); mctx.fill();
      for (let n = 0; n < 9; n++) {
        const a = Math.random() * 6.283, d = mr * (0.55 + Math.random() * 0.5);
        mctx.beginPath(); mctx.arc(mx + Math.cos(a) * d, my + Math.sin(a) * d, mr * (0.12 + Math.random() * 0.22), 0, 7); mctx.fill();
      }
      const gx0 = Math.max(0, Math.floor((x - r) / W * GX)), gx1 = Math.min(GX - 1, Math.floor((x + r) / W * GX));
      const gy0 = Math.max(0, Math.floor((y - r) / H * GY)), gy1 = Math.min(GY - 1, Math.floor((y + r) / H * GY));
      for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) if (!grid[gy * GX + gx]) { grid[gy * GX + gx] = 1; painted++; }
    };

    // Enough paint (or a click, or a dot): the rest floods out from that point, still as paint.
    const flood = (x, y, by) => {
      if (flooding) return;
      compose();   // drawn now, from where everything stands this moment (never mid entrance animation), so the hand-off is exact
      flooding = { x, y, t0: performance.now(), R: Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) * 1.15 };
      if (word) scramble(STATES[target][0]);
      try { window.posthog?.capture('hero_colour', { to: STATES[target][0], by }); } catch { /* fine */ }
    };
    const finish = async () => {
      const k = target;
      become(k, true);
      if (skin && skin.decode) { try { await skin.decode(); } catch { /* fine */ } }
      flooding = null; changedAt = performance.now(); clearMask(); compose(); draw();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (!layer || (!painted && !flooding)) return;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(layer, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0, cv.width, cv.height);
      ctx.globalCompositeOperation = 'source-over';
    };


    /* ---- every 3 seconds, the next state lands as a splash of paint ---- */
    // A splash: a few big blots thrown from one point, droplets flying further out, then the blots
    // grow and run together until the next state covers the hero. Pauses while someone is painting.
    const EVERY = 3000;
    let changedAt = performance.now();
    const splash = () => {
      const fr = girgit ? girgit.getBoundingClientRect() : null, f = frame.getBoundingClientRect();
      const cx = fr ? fr.left - f.left + fr.width * (0.3 + Math.random() * 0.4) : W * 0.5;
      const cy = fr ? fr.top - f.top + fr.height * (0.35 + Math.random() * 0.3) : H * 0.5;
      const blots = [], drops = [];
      for (let n = 0; n < 7; n++) { const a = Math.random() * 6.283, d = (0.12 + Math.random() * 0.3) * Math.min(W, H), sz = 0.5 + Math.random() * 0.7; blots.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.8, s: sz, drip: sz > 0.8 ? H * (0.08 + Math.random() * 0.14) : 0, dx: (Math.random() - 0.5) * 6 }); }
      for (let n = 0; n < 26; n++) { const a = Math.random() * 6.283, d = (0.3 + Math.random() * 0.55) * Math.max(W, H) * 0.6; drops.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.7, s: 0.15 + Math.random() * 0.35, a }); }
      flood(cx, cy, 'auto');
      if (flooding) { flooding.blots = blots; flooding.drops = drops; flooding.splash = true; }
    };
    const auto = (now) => {
      if (flooding || reduce || !visible || document.hidden) { if (!flooding) changedAt = Math.max(changedAt, now - EVERY + 600); return; }
      if (now - changedAt >= EVERY) splash();
    };

    const tick = (now) => {
      requestAnimationFrame(tick);
      if (flooding) {
        const F = flooding, dur = F.splash ? 900 : 820;
        const p = Math.min(1, (now - F.t0) / dur), e = 1 - Math.pow(1 - p, 3);
        if (!F.inked && p > 0.45) { F.inked = true; hero.style.setProperty('--fg', STATES[target][2]); navInk(STATES[target][2]); hero.dataset.state = String(target); document.documentElement.dataset.hero = String(target); setSub(target); }   // the ink turns as the paint lands
        if (F.splash) {
          // the throw: blots and droplets appear in the first third, then everything swells until it joins
          const base = Math.min(W, H) * 0.09, throwP = Math.min(1, p / 0.3), grow = Math.max(0, (p - 0.2) / 0.8);
          stamp(F.x, F.y, base * 1.6 * (0.6 + throwP) + F.R * Math.pow(grow, 1.6));
          for (const b of F.blots) stamp(b.x, b.y, base * b.s * (0.4 + throwP) + F.R * 0.7 * Math.pow(grow, 1.8));
          for (const b of F.blots) if (b.drip && throwP > 0.5) {   // ink runs down from the bigger blots
            const run = Math.min(1, (p - 0.15) / 0.5) * b.drip;
            for (let t = 0; t <= 1; t += 0.2) stamp(b.x + b.dx * t, b.y + run * t, base * b.s * 0.32 * (1 - t * 0.4));
          }
          for (const d of F.drops) if (throwP > 0.2) {
            stamp(d.x, d.y, base * d.s * Math.min(1, throwP * 1.4) + F.R * 0.5 * Math.pow(grow, 2.2));
            if (p < 0.35) stamp(d.x - Math.cos(d.a) * base * 0.5, d.y - Math.sin(d.a) * base * 0.5, base * d.s * 0.5);   // a short tail, thrown outward
          }
        } else {
          const r = F.R * e;
          for (let n = 0; n < 12; n++) { const a = n / 12 * 6.283 + p * 2; stamp(F.x + Math.cos(a) * r * 0.55, F.y + Math.sin(a) * r * 0.55, r * 0.6); }
          stamp(F.x, F.y, r);
        }
        draw();
        if (p >= 1 && !F.done) { F.done = true; finish(); }
        return;
      }
      auto(now);
    };

    become(0, true);
    new ResizeObserver(() => { fitWord(STATES[i][0]); size(); }).observe(frame);
    pics.forEach((p) => p.addEventListener('load', compose));
    document.fonts?.ready.then(() => { compose(); draw(); });
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.2 }).observe(hero);
  }
  setTimeout(() => hero.classList.add('is-ready'), 1700);
}
