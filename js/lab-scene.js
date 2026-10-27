// SECTION 02 — the Adaptation Laboratory: pure scene logic (no DOM).
// World units: the viewport is 1000 tall; the ground is at y = GROUND. Every frame is a
// pure function of scroll progress p (0..1), so scrubbing back reverses it exactly, and
// Node render checks can draw any moment.
import { PALETTE as C, girgitDefs, girgitMarkup, phaseFor } from './girgit.js';

export const GROUND = 820;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const fmt = (n) => (Math.round(n * 10) / 10).toString();
const sc = (n) => Math.max(0.001, Math.round(n * 1000) / 1000).toString();     // scales keep precision and never hit 0

export const ROCKS = [
  { key: 'brand', label: 'Branding', head: 'We find your kind of different.', copy: 'Distinctive identities built around what makes you different.', tone: '#DCD1BD', h: 300, seed: 3 },
  { key: 'ux', label: 'UI/UX and product design', head: 'Make it make sense.', copy: 'Thoughtful experiences that turn complexity into clarity.', tone: '#C9CDB4', h: 390, seed: 7 },
  { key: 'web', label: 'Website design and development', head: 'Built to move ideas forward.', copy: 'Digital experiences that combine strong design with purposeful execution.', tone: '#D8CDB8', h: 270, seed: 11 },
  { key: 'app', label: 'App design', head: 'Less friction. More flow.', copy: 'Products shaped around real people and real behaviour.', tone: '#C6CBB2', h: 360, seed: 17 },
  { key: 'motion', label: 'Motion and creative experimentation', head: 'Ideas with a pulse.', copy: 'Motion and experimentation that make ideas impossible to ignore.', tone: '#D9CEBA', h: 320, seed: 23 },
];

function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
function mixHex(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

// A seeded, angular ramp profile: [u, v] pairs from the floor (0,0) to the top (1,1),
// with ledges and steep breaks, so each rock has its own irregular climb.
function profile(rand) {
  const out = [[0, 0]];
  let u = 0, v = 0;
  while (u < 0.82) {
    u = Math.min(0.9, u + 0.14 + rand() * 0.16);
    v = Math.min(0.94, v + (rand() < 0.3 ? 0.04 : 0.16 + rand() * 0.22));   // sometimes a ledge
    out.push([u, v]);
  }
  out.push([1, 1]);
  return out;
}
const along = (prof, u) => {
  for (let j = 1; j < prof.length; j++) if (u <= prof[j][0]) { const [u0, v0] = prof[j - 1], [u1, v1] = prof[j]; return v0 + (v1 - v0) * ((u - u0) / (u1 - u0 || 1)); }
  return 1;
};

/** Layout for a viewport aspect (width/height). k scales rocks and Girgit on narrow screens. */
export function layout(aspect) {
  const W = 1000 * aspect;
  const k = Math.min(1, Math.max(0.62, W / 1500));
  const spacing = Math.max(1000 * k, W * 0.62);
  const start = W * 0.55;                                   // negative space on the left first
  const rocks = ROCKS.map((r, i) => {
    // Ramps about as wide as the rock is tall, so the climb reads as a climb, not a wall.
    const rand = rng(r.seed * 97);
    const h = r.h * k, top = (130 + rand() * 50) * k, cx = start + spacing * (i + 0.5);
    const rl = h * (1.0 + rand() * 0.3), rr = h * (1.05 + rand() * 0.35);
    return { ...r, i, cx, h, tl: cx - top / 2, tr: cx + top / 2, x0: cx - top / 2 - rl, x1: cx + top / 2 + rr, pl: profile(rand), pr: profile(rand) };
  });
  const end = rocks[4].x1 + W * 0.5;
  return { W, k, rocks, end, scale: 1.25 * k };
}

/** Height of one rock's walkable surface at world x. */
export function rockHeight(r, x) {
  if (x < r.x0 || x > r.x1) return 0;
  if (x >= r.tl && x <= r.tr) return r.h;
  return x < r.tl ? r.h * along(r.pl, (x - r.x0) / (r.tl - r.x0)) : r.h * along(r.pr, (r.x1 - x) / (r.x1 - r.tr));
}
/** Height of the walkable surface at world x (the highest rock there). */
export const surface = (L, x) => L.rocks.reduce((h, r) => Math.max(h, rockHeight(r, x)), 0);

// Scroll plan: intro walk-in, then for each rock an approach (walk) and a dwell (react).
const INTRO = 0.07, APPROACH = 0.11, DWELL = 0.068;
export function plan(L, p) {
  const stops = L.rocks.map((r) => r.cx);
  if (p < INTRO) return { phase: 'intro', x: lerp(-260, stops[0] - L.W * 0.42, p / INTRO), walking: 1, rock: -1, r: 0, prev: -1 };
  let q = p - INTRO;
  for (let i = 0; i < 5; i++) {
    const from = i === 0 ? stops[0] - L.W * 0.42 : stops[i - 1];
    if (q < APPROACH) {
      const s = q / APPROACH;
      return { phase: 'walk', x: lerp(from, stops[i], s), walking: Math.min(1, s * 10, (1 - s) * 10), rock: i, r: 0, prev: i - 1, leave: s };
    }
    q -= APPROACH;
    if (q < DWELL || i === 4) return { phase: 'react', x: stops[i], walking: 0, rock: i, r: Math.min(1, q / DWELL), prev: i - 1, leave: 1 };
    q -= DWELL;
  }
  return { phase: 'react', x: stops[4], walking: 0, rock: 4, r: 1, prev: 3, leave: 1 };
}

/* ---------- Rocks: faceted, sculptural, lit from the upper left ---------- */
// The silhouette is the walkable surface itself, so feet meet the rock that is drawn.
// Each facet gets a fake depth (silhouette at the back plane, interior bulging toward the
// viewer) and is shaded from its true 3D normal: real faceting, not random tints.
const LIGHT = (() => { const v = [-0.55, -0.7, 0.45], d = Math.hypot(...v); return v.map((c) => c / d); })();
export function rockMarkup(r) {
  const rand = rng(r.seed), y0 = GROUND, H = r.h, w = r.x1 - r.x0;
  const S = [];
  r.pl.forEach(([u]) => { const x = lerp(r.x0, r.tl, u); S.push([x, y0 - rockHeight(r, x)]); });
  S.push([lerp(r.tl, r.tr, 0.5), y0 - H]);
  [...r.pr].reverse().forEach(([u]) => { const x = lerp(r.x1, r.tr, u); S.push([x, y0 - rockHeight(r, x)]); });
  const base = [r.cx + w * 0.04, y0];
  const I = S.map(([x, y], j) => {
    const edge = j === 0 || j === S.length - 1;
    const t = 0.42 + rand() * 0.12;
    return edge ? [x, y, 0] : [lerp(x, base[0], t) + (rand() - 0.5) * 30, lerp(y, base[1], t) - rand() * 20, H * (0.45 + rand() * 0.35)];
  });
  const S3 = S.map(([x, y]) => [x, y, 0]);
  const B = S.map((_, j) => [lerp(r.x0 + w * 0.08, r.x1 - w * 0.06, j / (S.length - 1)) + (rand() - 0.5) * 20, y0, H * (0.15 + rand() * 0.2)]);
  const tone = (A, B, Cc) => {
    const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], v = [Cc[0] - A[0], Cc[1] - A[1], Cc[2] - A[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (n[2] < 0) n = n.map((c) => -c);
    const d = Math.hypot(...n) || 1, lit = (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / d;   // -1..1
    const light = mixHex(r.tone, '#FFFFFF', 0.6), shade = mixHex(r.tone, C.olive, 0.6), dark = mixHex(r.tone, C.forest, 0.7);
    return lit > 0.55 ? mixHex(r.tone, light, (lit - 0.55) / 0.45) : lit > 0.15 ? mixHex(shade, r.tone, (lit - 0.15) / 0.4) : mixHex(dark, shade, Math.max(0, (lit + 0.3) / 0.45));
  };
  const tri = (A, B, Cc) => { const col = tone(A, B, Cc); return `<path d="M${fmt(A[0])} ${fmt(A[1])}L${fmt(B[0])} ${fmt(B[1])}L${fmt(Cc[0])} ${fmt(Cc[1])}Z" fill="${col}" stroke="${col}" stroke-width="1.2" stroke-linejoin="round"/>`; };
  let facets = '';
  for (let j = 0; j < S.length - 1; j++) {
    facets += tri(S3[j], S3[j + 1], I[j]) + tri(S3[j + 1], I[j + 1], I[j]);   // outer band
    facets += tri(I[j], I[j + 1], B[j]) + tri(I[j + 1], B[j + 1], B[j]);     // lower band down to the floor
  }
  const sil = S.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L');
  const lip = `<path d="M${fmt(r.tl)} ${fmt(y0 - H)}H${fmt(r.tr)}" stroke="${mixHex(r.tone, '#FFFFFF', 0.75)}" stroke-width="4" stroke-linecap="round"/>`;
  return `<g class="rock" data-rock="${r.i}"><ellipse cx="${fmt(r.cx + w * 0.06)}" cy="${y0 + 4}" rx="${fmt(w * 0.56)}" ry="18" fill="${C.forest}" opacity="0.16"/>
    <path d="M${sil}Z" fill="${tone([0, 0, 0], [1, 0, 0], [0, 1, 0])}"/>${facets}${lip}<path d="M${sil}Z" fill="none" stroke="${C.forest}" stroke-opacity="0.25" stroke-width="2" stroke-linejoin="round"/></g>`;
}

/* ---------- The five reactions (each a pure function of r, around the rock top) ---------- */
const pop = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2));   // back-out

function brand(ax, ay, r, k) {
  const shapes = [
    [`<circle r="46" fill="${C.pink}"/>`, -230, -150, 0.15], [`<rect x="-38" y="-38" width="76" height="76" fill="${C.blue}"/>`, 210, -190, 0.22],
    [`<path d="M-44 36L0 -44L44 36Z" fill="${C.yellow}" stroke="${C.black}" stroke-width="4"/>`, -150, -300, 0.29],
    [`<circle r="34" fill="none" stroke="${C.acid}" stroke-width="16"/>`, 260, -40, 0.36],
    [`<g><rect x="-40" y="-40" width="80" height="80" fill="${C.ivory}" stroke="${C.black}" stroke-width="4"/><path d="M-40 -40h40v40h-40zM0 0h40v40h-40z" fill="${C.black}"/></g>`, 40, -330, 0.43],
  ];
  return shapes.map(([s, dx, dy, at]) => {
    const t = pop(smooth(at, at + 0.3, r));
    const nx = dx < 0 && k < 0.8 ? dx * 0.6 : dx;                     // narrow screens: keep the left props in frame
    return t > 0.01 ? `<g transform="translate(${fmt(ax + nx * k)} ${fmt(ay + dy * k)}) scale(${sc(t * k)}) rotate(${fmt((1 - t) * -40)})">${s}</g>` : '';
  }).join('');
}

function ux(ax, ay, r, k) {
  // 12 body fragments fly out (r .1–.45), then settle into an ordered UI grid (r .45–.85).
  let out = '';
  const rand = rng(41);
  for (let j = 0; j < 12; j++) {
    const bx = ax + (rand() - 0.5) * 140 * k, by = ay - (40 + rand() * 90) * k;               // on the body
    const sx = ax + (rand() - 0.5) * 520 * k, sy = ay - (60 + rand() * 340) * k;              // scattered
    const gx = ax + 150 * k + (j % 3) * 62 * k, gy = ay - 330 * k + Math.floor(j / 3) * 62 * k; // the grid
    const a = smooth(0.08, 0.45, r), b = smooth(0.45, 0.85, r);
    const x = lerp(lerp(bx, sx, a), gx, b), y = lerp(lerp(by, sy, a), gy, b);
    const vis = smooth(0.06, 0.14, r);
    if (vis <= 0) continue;
    const fill = [C.black, C.ivory, C.blue, C.black][j % 4];
    out += `<rect x="${fmt(x - 26 * k)}" y="${fmt(y - 26 * k)}" width="${fmt(52 * k)}" height="${fmt(52 * k)}" rx="${fmt(6 * k)}" fill="${fill}" stroke="${C.black}" stroke-width="3" opacity="${fmt(vis)}" transform="rotate(${fmt((1 - b) * a * (j * 37 % 90 - 45))} ${fmt(x)} ${fmt(y)})"/>`;
  }
  // An interaction path draws itself through the grid.
  const path = smooth(0.7, 1, r);
  if (path > 0) {
    const x0 = ax + 150 * k, y0 = ay - 330 * k, s = 62 * k;
    const d = `M${fmt(x0)} ${fmt(y0)}L${fmt(x0 + 2 * s)} ${fmt(y0)}L${fmt(x0 + 2 * s)} ${fmt(y0 + s)}L${fmt(x0)} ${fmt(y0 + s * 2)}L${fmt(x0 + 2 * s)} ${fmt(y0 + 3 * s)}`;
    out += `<path d="${d}" fill="none" stroke="${C.acid}" stroke-width="${fmt(7 * k)}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${fmt(1 - path)}"/>`;
  }
  return out;
}

function web(ax, ay, r, k) {
  // Blocks drop in and align into a page structure: nav, hero, three columns.
  const blocks = [
    [0, 0, 300, 34, C.black], [0, 46, 300, 110, C.olive], [0, 168, 92, 120, C.sage], [104, 168, 92, 120, C.ivory], [208, 168, 92, 120, C.forest],
  ];
  const ox = ax + 160 * k, oy = ay - 360 * k;
  return blocks.map(([x, y, w, h, fill], j) => {
    const t = smooth(0.1 + j * 0.1, 0.4 + j * 0.1, r);
    if (t <= 0) return '';
    const drop = (1 - pop(t)) * -240 * k;
    return `<rect x="${fmt(ox + x * k)}" y="${fmt(oy + y * k + drop)}" width="${fmt(w * k)}" height="${fmt(h * k)}" fill="${fill}" stroke="${C.black}" stroke-width="3" opacity="${fmt(Math.min(1, t * 3))}"/>`;
  }).join('') + (r > 0.85 ? `<path d="M${fmt(ox - 12 * k)} ${fmt(oy - 12 * k)}H${fmt(ox + 312 * k)}" stroke="${C.acid}" stroke-width="${fmt(5 * k)}" opacity="${fmt(smooth(0.85, 1, r))}"/>` : '');
}

export const APP_ITEMS = 5;
function appItems(ax, ay, r, k) {
  // Disconnected interface pieces drift; Girgit's eyes check each; they line up into a flow.
  const items = [
    [`<rect x="-34" y="-22" width="68" height="44" rx="10" fill="${C.ivory}" stroke="${C.black}" stroke-width="4"/><rect x="-22" y="-8" width="44" height="6" rx="3" fill="${C.black}"/>`, -260, -260],
    [`<rect x="-30" y="-16" width="60" height="32" rx="16" fill="${C.black}"/><circle cx="12" r="11" fill="${C.acid}"/>`, 230, -300],
    [`<path d="M-34 -24h68v38h-40l-14 14v-14h-14z" fill="${C.pink}" stroke="${C.black}" stroke-width="4"/>`, -180, -90],
    [`<rect x="-36" y="-18" width="72" height="36" rx="18" fill="${C.blue}"/><path d="M-10 0h20" stroke="${C.ivory}" stroke-width="5"/>`, 280, -140],
    [`<circle r="24" fill="${C.yellow}" stroke="${C.black}" stroke-width="4"/>`, -40, -360],
  ];
  const flowX = ax + 200 * k, flowY0 = ay - 380 * k, gap = 70 * k;
  const b = smooth(0.55, 0.9, r);
  let out = '';
  items.forEach(([s, dx, dy], j) => {
    const a = smooth(0.05 + j * 0.05, 0.2 + j * 0.05, r);
    if (a <= 0) return;
    const drift = Math.sin(j * 1.7 + r * 6) * 10 * k * (1 - b);
    const x = lerp(ax + dx * k, flowX, b), y = lerp(ay + dy * k + drift, flowY0 + j * gap, b);
    out += `<g transform="translate(${fmt(x)} ${fmt(y)}) scale(${sc(k * pop(a))})">${s}</g>`;
  });
  if (b > 0.05) {
    for (let j = 0; j < items.length - 1; j++) {
      const y1 = flowY0 + j * gap + 26 * k, y2 = flowY0 + (j + 1) * gap - 26 * k;
      out += `<path d="M${fmt(flowX)} ${fmt(y1)}V${fmt(y2)}" stroke="${C.black}" stroke-width="${fmt(4 * k)}" opacity="${fmt(b)}" marker-end="url(#lab-arrow)"/>`;
    }
  }
  return { markup: out, items, flowX, flowY0, gap, b };
}

function motion(ax, ay, r, k, ghost) {
  // A trail of forms disperses (r .1–.5), then reassembles into a deliberate stack (r .5–1).
  const forms = [
    [`<circle r="30" fill="${C.pink}"/>`, 0], [`<rect x="-26" y="-26" width="52" height="52" fill="${C.blue}"/>`, 1],
    [`<path d="M-30 24L0 -30L30 24Z" fill="${C.yellow}"/>`, 2], [`<circle r="22" fill="none" stroke="${C.acid}" stroke-width="12"/>`, 3],
    [`<rect x="-34" y="-10" width="68" height="20" fill="${C.black}"/>`, 4], [`<circle r="14" fill="${C.black}"/>`, 5],
  ];
  const a = smooth(0.08, 0.5, r), b = smooth(0.5, 0.92, r);
  let out = '';
  // Ghost frames of Girgit trail behind and fade as the composition resolves.
  for (let g = 1; g <= 3; g++) {
    const op = 0.85 * (1 - g / 4.5) * a * (1 - b);
    if (op > 0.01) out += `<g transform="translate(${fmt(ax - g * 80 * k * a)} ${fmt(ay - g * 6 * a)}) scale(${sc(1.25 * k)})" opacity="${fmt(op)}" filter="url(#lab-tint-${g})">${ghost}</g>`;
  }
  forms.forEach(([s, j]) => {
    const ang = (j / forms.length) * Math.PI * 2;
    const sx = ax - 120 * k + Math.cos(ang) * 260 * k, sy = ay - 200 * k + Math.sin(ang) * 170 * k;
    const fx = ax + 220 * k + (j % 2) * 50 * k, fy = ay - 120 * k - j * 46 * k;
    const x = lerp(lerp(ax - 40 * k, sx, a), fx, b), y = lerp(lerp(ay - 80 * k, sy, a), fy, b);
    if (a > 0.01) out += `<g transform="translate(${fmt(x)} ${fmt(y)}) rotate(${fmt((1 - b) * a * 140 * (j % 2 ? 1 : -1))}) scale(${sc(k)})">${s}</g>`;
  });
  return out;
}

const SKIN = { brand: 'brand', ux: 'grid', web: 'modular', app: 'ink', motion: 'pulse' };

/** Everything that moves, for progress p: Girgit + the active reaction, in world coordinates. */
export function frame(L, p) {
  const s = plan(L, p);
  const x = s.x, y = GROUND - surface(L, x);
  const slope = Math.atan2(surface(L, x + 40 * L.k) - surface(L, x - 40 * L.k), 80 * L.k) * -57.3;
  const rock = L.rocks[s.rock];
  // Skin: the active rock's skin while reacting; it fades back to ink as Girgit walks on.
  let skin = 'ink', mix = 0;
  if (s.phase === 'react') { skin = SKIN[rock.key]; mix = smooth(0.08, 0.5, s.r); }
  else if (s.prev >= 0) { skin = SKIN[L.rocks[s.prev].key]; mix = 1 - smooth(0, 0.3, s.leave); }
  if (skin === 'ink') mix = 0;

  const ax = rock ? rock.cx : x, ay = rock ? GROUND - rock.h : y;
  let props = '', look = [0.5, 0.1], lookFar = [0.2, -0.2], head = 0, girgitOpacity = 1;
  if (s.phase === 'react') {
    const key = rock.key, r = s.r;
    if (key === 'brand') { props = brand(ax, ay, r, L.k); look = [-0.6 + r * 1.2, -0.6]; lookFar = [0.8, -0.5]; head = -6 * Math.sin(r * Math.PI); }
    if (key === 'ux') { props = ux(ax, ay, r, L.k); girgitOpacity = 1 - smooth(0.08, 0.22, r) + smooth(0.75, 0.95, r); look = [0.8, -0.7]; }
    if (key === 'web') { props = web(ax, ay, r, L.k); look = [0.9, -0.6]; lookFar = [0.9, -0.2]; head = -4; }
    if (key === 'app') {
      const A = appItems(ax, ay, r, L.k); props = A.markup;
      // The independent eyes track different pieces as they arrive.
      const near = Math.min(4, Math.floor(r * 5)), far = (near + 2) % 5;
      const aim = (j) => { const [, dx, dy] = A.items[j]; const d = Math.hypot(dx, dy + 120) || 1; return [dx / d, (dy + 120) / d]; };
      look = A.b > 0.5 ? [0.9, -0.6] : aim(near); lookFar = A.b > 0.5 ? [0.9, -0.4] : aim(far);
      head = -5 * Math.sin(r * Math.PI);
    }
    if (key === 'motion') {
      props = motion(ax, ay, r, L.k, girgitMarkup({ skin: 'pulse', skinMix: 1, prefix: 'lab' }));
      look = [0.7, -0.3];
    }
  }
  const t = phaseFor(x / L.scale);
  const girgit = girgitMarkup({ t, walking: s.walking, skin, skinMix: mix, look, lookFar, head, tail: s.phase === 'react' ? Math.sin(s.r * Math.PI * 3) * 8 : 0, breathe: p * 9, opacity: girgitOpacity, prefix: 'lab' });
  return {
    state: s, x, y,
    markup: `${props}<g transform="translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(Math.max(-26, Math.min(26, slope * 0.6)))}) scale(${sc(L.scale)})">${girgit}</g>`,
    camera: Math.max(0, Math.min(L.end - L.W, x - L.W * 0.3)),
  };
}

export const sceneDefs = () => `${girgitDefs('lab')}<defs>${[C.pink, C.blue, C.acid].map((c, i) => `<filter id="lab-tint-${i + 1}" x="-10%" y="-10%" width="120%" height="120%"><feFlood flood-color="${c}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`).join('')}<marker id="lab-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="${C.black}"/></marker></defs>`;
