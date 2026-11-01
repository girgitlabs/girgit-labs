// SECTION 04 — the eye wall: tile artwork as pure functions (no DOM), so the page and Node render
// checks draw the same thing. Each tile is a square: a colour-blocked background and a flat
// vector eye with thick black outlines (static SVG), plus a moving part (iris + pupil) that the
// page animates with CSS. Every choice comes from a seeded generator, so the wall is the same on
// every visit and in every test.

export const PAL = {
  pink: '#FF168C', orange: '#FF7A1A', yellow: '#FFE500', cyan: '#19D3FF', blue: '#173BFF',
  acid: '#43FF18', black: '#111111', ivory: '#F4EFE5', white: '#FFFFFF',
};
const BG = ['pink', 'orange', 'yellow', 'cyan', 'blue', 'acid', 'black', 'ivory'];
const INK = '#111111';
const K = 5;                                                 // the thick outline (of a 100-unit tile)

export function rng(seed) { let s = (seed * 2654435761) % 2147483647 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const pick = (r, list) => list[Math.floor(r() * list.length)];
const f = (n) => (Math.round(n * 100) / 100).toString();

/* ---------- The seven eye designs. Each returns { art, ball } ----------
   art:  the static SVG (inside a 0..100 viewBox), drawn over the tile's background.
   ball: where the moving iris lives: centre, clip shape and radius (tile units), iris radius. */
const DESIGNS = {
  // A chameleon turret: stacked rings narrowing to the eye.
  turret: (c) => ({
    art: `<circle cx="50" cy="50" r="44" fill="${c.a}" stroke="${INK}" stroke-width="${K}"/>
      <circle cx="50" cy="50" r="34" fill="${c.b}" stroke="${INK}" stroke-width="${K - 1}"/>
      <circle cx="50" cy="50" r="24" fill="${PAL.white}" stroke="${INK}" stroke-width="${K - 1}"/>`,
    ball: { cx: 50, cy: 50, r: 22, shape: 'circle', iris: 12 },
  }),
  // A target: bold alternating bands.
  target: (c) => ({
    art: `<circle cx="50" cy="50" r="44" fill="${c.a}" stroke="${INK}" stroke-width="${K}"/>
      <circle cx="50" cy="50" r="36" fill="none" stroke="${INK}" stroke-width="7"/>
      <circle cx="50" cy="50" r="29" fill="${c.b}"/>
      <circle cx="50" cy="50" r="21" fill="${PAL.white}" stroke="${INK}" stroke-width="${K - 1}"/>`,
    ball: { cx: 50, cy: 50, r: 19, shape: 'circle', iris: 11 },
  }),
  // An almond eye with lashes.
  almond: (c) => ({
    art: `<path d="M8 50 Q50 8 92 50 Q50 92 8 50Z" fill="${PAL.white}" stroke="${INK}" stroke-width="${K + 1}" stroke-linejoin="round"/>
      <path d="M24 30 L18 18 M40 22 L37 9 M60 22 L63 9 M76 30 L82 18" stroke="${INK}" stroke-width="${K}" stroke-linecap="round"/>`,
    ball: { cx: 50, cy: 50, rx: 40, ry: 20, shape: 'almond', iris: 16 },
  }),
  // A ring of dots around the eye.
  dotted: (c, r) => {
    let dots = '';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; dots += `<circle cx="${f(50 + Math.cos(a) * 36)}" cy="${f(50 + Math.sin(a) * 36)}" r="4.4" fill="${c.b}" stroke="${INK}" stroke-width="2.4"/>`; }
    return {
      art: `<circle cx="50" cy="50" r="44" fill="${c.a}" stroke="${INK}" stroke-width="${K}"/>${dots}
        <circle cx="50" cy="50" r="26" fill="${PAL.white}" stroke="${INK}" stroke-width="${K}"/>`,
      ball: { cx: 50, cy: 50, r: 24, shape: 'circle', iris: 13 },
    };
  },
  // A sun: pointed rays around the eye, alternating colours.
  sun: (c) => {
    let rays = '';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, a1 = a - 0.22, a2 = a + 0.22;
      rays += `<path d="M${f(50 + Math.cos(a1) * 28)} ${f(50 + Math.sin(a1) * 28)} L${f(50 + Math.cos(a) * 47)} ${f(50 + Math.sin(a) * 47)} L${f(50 + Math.cos(a2) * 28)} ${f(50 + Math.sin(a2) * 28)}Z" fill="${i % 2 ? c.a : c.b}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    }
    return {
      art: `${rays}<circle cx="50" cy="50" r="28" fill="${PAL.white}" stroke="${INK}" stroke-width="${K}"/>`,
      ball: { cx: 50, cy: 50, r: 26, shape: 'circle', iris: 14 },
    };
  },
  // Wedges: a pinwheel ring.
  wedges: (c) => {
    let w = '';
    for (let i = 0; i < 16; i++) {
      const a1 = (i / 16) * Math.PI * 2, a2 = ((i + 1) / 16) * Math.PI * 2;
      w += `<path d="M50 50 L${f(50 + Math.cos(a1) * 44)} ${f(50 + Math.sin(a1) * 44)} A44 44 0 0 1 ${f(50 + Math.cos(a2) * 44)} ${f(50 + Math.sin(a2) * 44)}Z" fill="${i % 2 ? c.a : c.b}"/>`;
    }
    return {
      art: `${w}<circle cx="50" cy="50" r="44" fill="none" stroke="${INK}" stroke-width="${K}"/>
        <circle cx="50" cy="50" r="25" fill="${PAL.white}" stroke="${INK}" stroke-width="${K}"/>`,
      ball: { cx: 50, cy: 50, r: 23, shape: 'circle', iris: 12 },
    };
  },
  // A soft square eye: a rounded block with a heavy lid line.
  block: (c) => ({
    art: `<rect x="12" y="16" width="76" height="68" rx="20" fill="${c.a}" stroke="${INK}" stroke-width="${K}"/>
      <rect x="22" y="28" width="56" height="46" rx="16" fill="${PAL.white}" stroke="${INK}" stroke-width="${K - 1}"/>
      <path d="M22 34 Q50 18 78 34" fill="none" stroke="${INK}" stroke-width="${K + 1}" stroke-linecap="round"/>`,
    ball: { cx: 50, cy: 51, r: 22, shape: 'circle', iris: 13 },
  }),
};
const DESIGN_NAMES = Object.keys(DESIGNS);
const PUPILS = ['round', 'round', 'round', 'slit', 'bar'];

/** The moving part (iris + pupil), drawn in its own little SVG so the page can move it on the GPU. */
function irisSvg(c, pupil) {
  const p = pupil === 'slit' ? `<ellipse cx="50" cy="50" rx="13" ry="34" fill="${INK}"/>`
    : pupil === 'bar' ? `<rect x="22" y="38" width="56" height="24" rx="12" fill="${INK}"/>`
    : `<circle cx="50" cy="50" r="30" fill="${INK}"/>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle cx="50" cy="50" r="46" fill="${c.iris}" stroke="${INK}" stroke-width="7"/>${p}<circle cx="36" cy="34" r="9" fill="${PAL.white}"/></svg>`;
}

/**
 * Tile i of a grid with `cols` columns. Background never matches the tile above or to the left.
 * Returns everything the page needs: colours, design, the moving part's geometry (as % of the
 * tile), and the motion settings (look path, duration, offset, blink).
 */
export function tile(i, cols, taken = []) {
  const r = rng(i + 7);
  const left = i % cols ? taken[i - 1] : null, up = taken[i - cols] || null;
  let bg; do { bg = pick(r, BG); } while (bg === left || bg === up);
  taken[i] = bg;
  const others = BG.filter((x) => x !== bg && x !== 'black');
  const c = { bg: PAL[bg], a: PAL[pick(r, others)], b: PAL[pick(r, others)], iris: PAL[pick(r, ['yellow', 'acid', 'orange', 'cyan', 'pink', 'blue'])] };
  if (c.b === c.a) c.b = bg === 'ivory' ? PAL.black : PAL.ivory;
  const design = DESIGN_NAMES[Math.floor(r() * DESIGN_NAMES.length)];
  const { art, ball } = DESIGNS[design](c, r);
  // The blink lid takes the colour just around the eye, so a blink reads as an eyelid closing.
  const lid = { turret: c.b, target: c.b, almond: c.bg, dotted: c.a, sun: c.a, wedges: c.a, block: c.a }[design];
  return {
    bg: c.bg, design, art, ball, lid, iris: irisSvg(c, pick(r, PUPILS)),
    look: 1 + Math.floor(r() * 8),                       // which of the 8 look paths
    dur: (5 + r() * 7).toFixed(2),                        // 5–12s per cycle
    delay: (-r() * 12).toFixed(2),                        // start somewhere in the cycle
    blink: r() < 0.32 ? (6 + r() * 7).toFixed(2) : 0,     // about a third of the eyes blink
    blinkDelay: (-r() * 13).toFixed(2),
    rest: [((r() - 0.5) * 0.6).toFixed(2), ((r() - 0.5) * 0.5).toFixed(2)],   // still direction (reduced motion)
  };
}

/** Static markup for one tile; the page wires it up. */
export function tileMarkup(t) {
  const b = t.ball;
  const size = b.shape === 'almond' ? `left:${50 - b.rx}%;top:${50 - b.ry}%;width:${b.rx * 2}%;height:${b.ry * 2}%` : `left:${b.cx - b.r}%;top:${b.cy - b.r}%;width:${b.r * 2}%;height:${b.r * 2}%`;
  const iris = (t.ball.iris * 2) / (b.shape === 'almond' ? b.rx * 2 : b.r * 2) * 100;
  return `<div class="eye eye--${b.shape}" style="--bg:${t.bg};--dur:${t.dur}s;--delay:${t.delay}s;--blink:${t.blink || 0}s;--blink-delay:${t.blinkDelay}s;--rx:${t.rest[0]};--ry:${t.rest[1]};--lid:${t.lid}">
    <svg class="eye-art" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${t.art}</svg>
    <div class="eye-ball" style="${size}">
      <div class="eye-aim"><div class="eye-iris look-${t.look}" style="width:${f(iris)}%">${t.iris}</div></div>
      ${t.blink ? '<i class="eye-lid"></i>' : ''}
    </div>
  </div>`;
}
