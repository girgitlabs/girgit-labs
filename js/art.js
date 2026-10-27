// Girgit Labs graphics kit, v2 (after a closer read of the references).
// - Mascot: a softly lit, ink-black chameleon with a huge white eye, no outline,
//   in the spirit of Lumen Cat's glossy cat (and the ink chameleon in our logo).
// - Doodles: loose, gestural marker scribbles that don't close, generated with jitter.
// - Stickers: white pills, thick ink outline, wide type, packed and overlapping.
// Every function returns an SVG string (works in the browser and in Node).

export const INK = '#1C1A17';
export const PAPER = '#F7F3EC';
export const ACCENTS = {
  lime: { name: 'Chameleon lime', hex: '#C6F135' },
  sun: { name: 'Sun yellow', hex: '#FFD23F' },
  coral: { name: 'Hot coral', hex: '#FF5A36' },
};
// Body tones for the mascot: [highlight, mid, shadow].
export const BODIES = {
  ink: ['#4A453E', '#1C1A17', '#050504'],
  lime: ['#E4FF8A', '#B5E02A', '#6E8F0B'],
  sun: ['#FFE98A', '#F6C21E', '#B98700'],
  coral: ['#FF9B80', '#F2552F', '#A8300F'],
  camo: ['#EEE8DD', '#CFC6B5', '#9C9282'],
};

let uid = 0;
const id = (p) => `${p}${++uid}`;

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function rng(seed) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

const BODY = 'M122,186 C118,150 160,104 222,100 C240,99 252,102 260,108 C256,86 270,62 294,60 C310,60 320,94 328,114 C346,120 360,134 368,148 C372,156 366,166 356,168 C336,176 312,186 290,190 C276,194 262,200 248,206 C214,220 160,218 132,204 C126,200 123,194 122,186 Z';

/**
 * The mascot, side view facing right, viewBox 0 0 420 300.
 * body: key of BODIES. state: 'default' | 'found' | 'sleep' | 'glow'
 */
export function chameleon({ body = 'ink', state = 'default', eyeGlow = ACCENTS.lime.hex } = {}) {
  const [hi, mid, lo] = BODIES[body];
  const g = id('g'), sh = id('s'), eyeG = id('e'), soft = id('b'), clip = id('c'), glow = id('gl');
  const tube = (d, w) => `<path d="${d}" fill="none" stroke="url(#${g})" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const glowing = state === 'glow';

  const eye = state === 'sleep' || state === 'blink'
    ? `<circle cx="316" cy="136" r="38" fill="url(#${g})"/>
       <path d="M294,140 C306,152 328,152 340,140" fill="none" stroke="${glowing ? eyeGlow : '#000'}" stroke-width="5" stroke-linecap="round" opacity="0.7"/>`
    : `<circle cx="316" cy="136" r="${state === 'found' ? 44 : 40}" fill="url(#${g})"/>
       <circle cx="320" cy="134" r="${state === 'found' ? 34 : 30}" fill="${glowing ? eyeGlow : `url(#${eyeG})`}" ${glowing ? `filter="url(#${glow})"` : ''}/>
       <g class="pupil" data-cx="320" data-cy="134"><circle cx="323" cy="134" r="${state === 'found' ? 9 : 14}" fill="#080807"/>
       <ellipse cx="329" cy="127" rx="5" ry="4" fill="#fff"/></g>
       <circle cx="324" cy="144" r="2" fill="#fff" opacity="0.7"/>`;

  const extras = state === 'found'
    ? `<path d="M352,72 L362,46 M378,84 L400,66 M330,62 L328,36" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`
    : state === 'sleep'
      ? `<path d="M356,86 h16 l-16,18 h16 M382,58 h12 l-12,14 h12" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
      : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 300" role="img" aria-label="Girgit chameleon">
  <defs>
    <radialGradient id="${g}" cx="38%" cy="28%" r="80%"><stop offset="0" stop-color="${hi}"/><stop offset="0.45" stop-color="${mid}"/><stop offset="1" stop-color="${lo}"/></radialGradient>
    <radialGradient id="${eyeG}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#F1EDE6"/><stop offset="1" stop-color="#C9C2B6"/></radialGradient>
    <radialGradient id="${sh}"><stop offset="0" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <filter id="${soft}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="${glow}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="${clip}"><path d="${BODY}"/></clipPath>
  </defs>
  <ellipse cx="210" cy="272" rx="170" ry="16" fill="url(#${sh})"/>
  ${tube('M238,204 L228,236 L242,258', 20)} ${tube('M140,204 L128,234 L140,254', 20)}
  ${tube('M136,196 C108,206 80,206 68,224 C54,244 64,270 88,272 C110,274 120,254 110,240', 28)}
  ${tube('M110,240 C102,229 86,234 88,246 C89,254 98,254 99,248', 15)}
  <path d="${BODY}" fill="url(#${g})"/>
  <g clip-path="url(#${clip})">
    <path d="M150,212 C200,224 240,216 280,200" fill="none" stroke="${lo}" stroke-width="22" opacity="0.5" filter="url(#${soft})"/>
    <path d="M170,118 C200,104 236,104 256,114" fill="none" stroke="#fff" stroke-opacity="0.28" stroke-width="10" stroke-linecap="round" filter="url(#${soft})"/>
    <path d="M276,74 C286,66 298,66 304,72" fill="none" stroke="#fff" stroke-opacity="0.3" stroke-width="7" stroke-linecap="round" filter="url(#${soft})"/>
  </g>
  <path d="M366,166 C350,178 326,184 304,182 C299,180 297,176 300,172" fill="none" stroke="${lo}" stroke-width="4" stroke-linecap="round"/>
  ${tube('M258,200 L272,232 L258,256', 22)} ${tube('M160,206 L150,236 L164,258', 22)}
  ${tube('M258,256 L242,264 M258,256 L274,264', 13)} ${tube('M164,258 L148,266 M164,258 L180,266', 13)}
  ${eye}
  ${extras}
</svg>`;
}

/* ---------- Loose marker scribbles ---------- */
// A wobbly polyline through points, drawn twice slightly offset, like a real marker.
function marker(points, color, width, seed = 1) {
  const r = rng(seed);
  const d = (pts) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L');
  const jitter = (pts, a) => pts.map(([x, y]) => [x + (r() - 0.5) * a, y + (r() - 0.5) * a]);
  // pathLength="1" lets CSS draw any stroke in with stroke-dashoffset 1 → 0.
  return `<path class="stroke" pathLength="1" d="${d(jitter(points, 2.5))}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>
          <path class="stroke" pathLength="1" d="${d(jitter(points, 4))}" fill="none" stroke="${color}" stroke-width="${width * 0.45}" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>`;
}

const wrap = (inner, vb = 200) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}">${inner}</svg>`;

export const SCRIBBLES = {
  // Five loose petals that overshoot and don't close, like Lumen Cat's yellow flowers.
  flower: (c, seed = 3) => {
    const r = rng(seed), pts = [];
    for (let t = 0; t <= Math.PI * 2 * 1.06; t += 0.05) {
      const rad = 34 + 58 * Math.abs(Math.sin(2.5 * t)) + (r() - 0.5) * 6;
      pts.push([100 + Math.cos(t) * rad, 100 + Math.sin(t) * rad]);
    }
    const centre = [];
    for (let t = 0; t <= Math.PI * 2.3; t += 0.25) centre.push([100 + Math.cos(t) * 14, 100 + Math.sin(t) * 13]);
    return wrap(marker(pts, c, 9, seed) + marker(centre, c, 7, seed + 1));
  },
  star: (c, seed = 5) => {
    const pts = [];
    for (let k = 0; k <= 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5, rad = k % 2 ? 30 : 86;
      pts.push([100 + Math.cos(a) * rad, 100 + Math.sin(a) * rad]);
    }
    return wrap(marker(pts, c, 8, seed));
  },
  swirl: (c, seed = 7) => {
    const pts = [];
    for (let t = 0; t < Math.PI * 4.2; t += 0.08) { const rad = 8 + t * 6.5; pts.push([100 + Math.cos(t) * rad, 100 + Math.sin(t) * rad]); }
    return wrap(marker(pts, c, 8, seed));
  },
  underline: (c, seed = 9) => {
    const pts = [];
    for (let x = 12; x <= 188; x += 4) pts.push([x, 104 + Math.sin(x / 14) * 9]);
    return wrap(marker(pts, c, 8, seed));
  },
  arrow: (c, seed = 11) => {
    const pts = [];
    for (let t = 0; t <= 1; t += 0.03) pts.push([20 + t * 150, 150 - Math.sin(t * Math.PI) * 90 + t * 10]);
    return wrap(marker(pts, c, 7, seed) + marker([[140, 140], [172, 158], [160, 122]], c, 7, seed + 2));
  },
  leaf: (c, seed = 17) => {
    const outline = [], rib = [];
    for (let t = 0; t <= Math.PI * 2.05; t += 0.08) outline.push([100 + Math.sin(t) * 46 * Math.abs(Math.sin(t / 2) + 0.15), 186 - (1 - Math.cos(t)) * 84]);
    for (let y = 182; y >= 34; y -= 12) rib.push([100 + Math.sin(y / 30) * 2, y]);
    return wrap(marker(outline, c, 7, seed) + marker(rib, c, 5, seed + 1));
  },
  // Three heads: "a small senior team".
  team: (c, seed = 19) => {
    let inner = '';
    [[50, 92, 26], [100, 74, 30], [150, 92, 26]].forEach(([x, y, r], k) => {
      const head = [], body = [];
      for (let t = 0; t <= Math.PI * 2.1; t += 0.2) head.push([x + Math.cos(t) * r * 0.6, y + Math.sin(t) * r * 0.6]);
      for (let t = Math.PI; t <= Math.PI * 2; t += 0.15) body.push([x + Math.cos(t) * r, y + r * 2.4 + Math.sin(t) * r * 1.1]);
      inner += marker(head, c, 6, seed + k) + marker(body, c, 6, seed + k + 9);
    });
    return wrap(inner);
  },
  // One unbroken line ending in an arrow: "no handoff".
  line: (c, seed = 23) => {
    const pts = [];
    for (let x = 14; x <= 170; x += 5) pts.push([x, 100 + Math.sin(x / 22) * 18]);
    return wrap(marker(pts, c, 7, seed) + marker([[150, 76], [178, 98], [150, 122]], c, 7, seed + 1));
  },
  // An hourglass, already run out: "the slow part happens first".
  hourglass: (c, seed = 29) => wrap(
    marker([[52, 22], [148, 22], [104, 98], [148, 178], [52, 178], [96, 98], [52, 22]], c, 7, seed)
    + marker([[64, 168], [100, 140], [136, 168], [64, 168]], c, 6, seed + 1)
    + marker([[40, 18], [160, 18]], c, 8, seed + 2) + marker([[40, 182], [160, 182]], c, 8, seed + 3),
  ),
  burst: (c, seed = 13) => {
    let inner = '';
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      inner += marker([[100 + Math.cos(a) * 34, 100 + Math.sin(a) * 34], [100 + Math.cos(a) * 88, 100 + Math.sin(a) * 88]], c, 7, seed + k);
    }
    return wrap(inner);
  },
};

/* ---------- Stickers ---------- */
// White pill with a thick ink outline and wide type; one or two lines, rotated.
export function sticker(lines, { fill = '#FFFFFF', tilt = 0, size = 26 } = {}) {
  const rows = [].concat(lines);
  const w = Math.max(...rows.map((l) => l.length)) * size * 0.78 + 56;
  const h = rows.length * size * 1.05 + 30;
  const text = rows.map((l, i) => `<text x="${w / 2 + 6}" y="${22 + size * 0.86 + i * size * 1.05}" text-anchor="middle" font-family="Unbounded, 'Arial Black', sans-serif" font-weight="800" font-size="${size}" fill="${INK}" letter-spacing="-0.5">${esc(l)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w + 12} ${h + 12}" style="transform:rotate(${tilt}deg)">
    <rect x="6" y="6" width="${w}" height="${h}" rx="${Math.min(h / 2, 34)}" fill="${fill}" stroke="${INK}" stroke-width="5"/>${text}</svg>`;
}

// Round scalloped badge (like Lumen Cat's yellow seal), with two short lines.
export function badge(lines, fill) {
  let d = '';
  for (let k = 0; k <= 48; k++) {
    const a = (k / 48) * Math.PI * 2, rad = k % 2 ? 88 : 96;
    d += `${k ? 'L' : 'M'}${(100 + Math.cos(a) * rad).toFixed(1)},${(100 + Math.sin(a) * rad).toFixed(1)}`;
  }
  const t = [].concat(lines).map((l, i, a) => `<text x="100" y="${100 + (i - (a.length - 1) / 2) * 30 + 10}" text-anchor="middle" font-family="Unbounded, 'Arial Black', sans-serif" font-weight="800" font-size="26" fill="${INK}">${esc(l)}</text>`).join('');
  return wrap(`<path d="${d}Z" fill="${fill}" stroke="${INK}" stroke-width="5"/><circle cx="100" cy="100" r="70" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="4 5"/>${t}`);
}

/* ---------- Pixel accents ---------- */
const pixel = (rows, size = 10) => {
  const h = rows.length, w = rows[0].length;
  let r = '';
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const fill = ch === '#' ? INK : ch === 'o' ? PAPER : ch === '+' ? 'var(--accent, #C6F135)' : null;
    if (fill) r += `<rect x="${x * size}" y="${y * size}" width="${size}" height="${size}" fill="${fill}"/>`;
  }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w * size} ${h * size}" shape-rendering="crispEdges">${r}</svg>`;
};

export const PIXELS = {
  eye: () => pixel(['..####..', '.#++++#.', '#++##++#', '#+#o##+#', '#+####+#', '#++##++#', '.#++++#.', '..####..']),
  cursor: () => pixel(['#.......', '##......', '#o#.....', '#oo#....', '#ooo#...', '#oooo#..', '#oo###..', '#.#o#...', '...#o#..', '....#...']),
  sparkle: () => pixel(['...#...', '...#...', '..#+#..', '##+++##', '..#+#..', '...#...', '...#...']),
  check: () => pixel(['.......#', '......##', '#....##.', '##..##..', '.####...', '..##....']),
};
