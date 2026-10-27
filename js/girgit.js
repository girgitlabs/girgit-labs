// Girgit as a layered 2D vector rig: the interim for a rigged 3D model.
// Real joints, not a faked still: four two-segment legs solved with IK so feet plant
// on the ground, a diagonal walk cycle, body bob, an independent head and eyes, a
// swaying spiral tail, and swappable skins. Side view, facing right.
//
// Everything is pure: girgitMarkup(state) returns an SVG <g> string for one pose, so the
// same code drives the page (re-rendered per frame) and Node render checks.
// Local coordinates: origin on the ground under the body; ~220 units long.

export const PALETTE = {
  ivory: '#F4EFE5', black: '#111111', forest: '#142118', olive: '#6E7B3B', sage: '#B5BEA0',
  pink: '#FF168C', blue: '#173BFF', acid: '#43FF18', yellow: '#FFE500',
};

const BODY = 'M -78 -50 C -82 -94 -30 -116 20 -108 C 46 -104 62 -90 66 -70 C 70 -46 56 -32 30 -28 C 0 -24 -40 -24 -62 -30 C -74 -34 -78 -42 -78 -50 Z';
const HEAD = 'M 30 -98 C 28 -136 58 -156 86 -150 C 106 -146 116 -126 114 -108 C 126 -102 134 -90 130 -80 C 124 -70 106 -66 88 -68 C 66 -70 40 -76 32 -86 Z';
const NECK = [50, -82];
const TAIL_BASE = [-74, -48];
const HIPS = { nf: [36, -38], ff: [26, -40], nb: [-50, -38], fb: [-58, -40] };   // near/far, front/back
const UPPER = 30, LOWER = 30;

// Diagonal gait: near-front with far-back, far-front with near-back.
const PHASE = { nf: 0, fb: 0.04, ff: 0.5, nb: 0.54 };
const STRIDE = 44;           // how far a foot travels per cycle (local units)
const STANCE = 0.62;         // fraction of the cycle a foot is on the ground

/** Distance walked → cycle phase. Feet travel exactly STRIDE per cycle, so they never skate. */
export const phaseFor = (distance) => (((distance / STRIDE) % 1) + 1) % 1;

const fmt = (n) => (Math.round(n * 10) / 10).toString();

// Two-bone IK in 2D. bend: +1 knee forward (back legs), -1 knee backward (front legs).
function ik([hx, hy], [fx, fy], bend) {
  let dx = fx - hx, dy = fy - hy;
  let d = Math.hypot(dx, dy);
  const max = UPPER + LOWER - 0.5;
  if (d > max) { fx = hx + (dx / d) * max; fy = hy + (dy / d) * max; dx = fx - hx; dy = fy - hy; d = max; }
  const a = Math.atan2(dy, dx);
  const cos = Math.max(-1, Math.min(1, (UPPER * UPPER + d * d - LOWER * LOWER) / (2 * UPPER * d)));
  const k = a - bend * Math.acos(cos);
  return { knee: [hx + Math.cos(k) * UPPER, hy + Math.sin(k) * UPPER], foot: [fx, fy] };
}

// Foot position for a leg at walk phase t (0..1). walking=0 stands still.
function footAt(leg, t, walking, lift) {
  const [hx] = HIPS[leg];
  const home = hx + (leg.endsWith('f') ? 10 : -6);
  if (!walking) return [home, 0];
  const p = (((t + PHASE[leg]) % 1) + 1) % 1;
  if (p < STANCE) {                                   // on the ground, sliding back under the body
    const s = p / STANCE;
    return [home + STRIDE / 2 - s * STRIDE, 0];
  }
  const s = (p - STANCE) / (1 - STANCE);             // swinging forward in an arc
  return [home - STRIDE / 2 + s * STRIDE, -Math.sin(Math.PI * s) * lift];
}

function leg(id, t, walking, colour, w1, w2, lift) {
  const bend = id.endsWith('f') ? -1 : 1;
  const { knee, foot } = ik(HIPS[id], footAt(id, t, walking, lift), bend);
  const [hx, hy] = HIPS[id];
  const toe = (dx, rot) => `<ellipse cx="${fmt(foot[0] + dx)}" cy="${fmt(foot[1] - 4)}" rx="8" ry="5" transform="rotate(${rot} ${fmt(foot[0] + dx)} ${fmt(foot[1] - 4)})" fill="${colour}"/>`;
  return `<g class="leg leg--${id}">
    <path d="M ${fmt(hx)} ${fmt(hy)} L ${fmt(knee[0])} ${fmt(knee[1])}" stroke="${colour}" stroke-width="${w1}" stroke-linecap="round"/>
    <path d="M ${fmt(knee[0])} ${fmt(knee[1])} L ${fmt(foot[0])} ${fmt(foot[1] - 4)}" stroke="${colour}" stroke-width="${w2}" stroke-linecap="round"/>
    ${toe(-6, -20)}${toe(6, 20)}</g>`;
}

/** Shared <defs>: gradients and the capability skins. Include once per <svg>. */
export function girgitDefs(p = 'g') {
  const c = PALETTE;
  return `<defs>
    <radialGradient id="${p}-ink" cx="35%" cy="25%" r="85%"><stop offset="0" stop-color="#3A3732"/><stop offset="0.5" stop-color="#16150F"/><stop offset="1" stop-color="#050505"/></radialGradient>
    <radialGradient id="${p}-eye" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#FFFEF9"/><stop offset="0.6" stop-color="#F0E8D8"/><stop offset="1" stop-color="#C9BDA7"/></radialGradient>
    <pattern id="${p}-brand" width="36" height="36" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="${c.pink}"/><rect x="18" width="18" height="18" fill="${c.blue}"/><rect y="18" width="18" height="18" fill="${c.yellow}"/><rect x="18" y="18" width="18" height="18" fill="${c.acid}"/><rect width="9" height="9" fill="${c.black}"/><rect x="9" y="9" width="9" height="9" fill="${c.ivory}"/></pattern>
    <pattern id="${p}-grid" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${c.ivory}"/><path d="M14 0H0V14" fill="none" stroke="${c.black}" stroke-width="1.6"/></pattern>
    <pattern id="${p}-modular" width="48" height="32" patternUnits="userSpaceOnUse"><rect width="48" height="32" fill="${c.sage}"/><rect x="2" y="2" width="20" height="28" fill="${c.olive}"/><rect x="24" y="2" width="22" height="12" fill="${c.ivory}"/><rect x="24" y="16" width="22" height="14" fill="${c.forest}"/></pattern>
    <pattern id="${p}-pulse" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="${c.black}"/><circle cx="12" cy="12" r="6" fill="${c.pink}"/></pattern>
  </defs>`;
}

/**
 * One pose as an SVG group string.
 * state: { t (walk phase), walking (0..1), skin ('ink'|'brand'|'grid'|'modular'|'pulse'),
 *          skinMix (0..1), look: [nx, ny] near eye, lookFar: [nx, ny], head (deg),
 *          tail (deg), breathe (0..1), lift, opacity, prefix }
 */
export function girgitMarkup(s = {}) {
  const p = s.prefix || 'g';
  const t = s.t || 0, walking = s.walking ?? 0, lift = s.lift ?? 18;
  const bob = walking ? Math.cos(t * Math.PI * 4) * 2.4 : Math.sin((s.breathe || 0) * Math.PI * 2) * 1.2;
  const tail = (s.tail || 0) + (walking ? Math.sin(t * Math.PI * 2) * 5 : 0);
  const head = (s.head || 0) + (walking ? Math.sin(t * Math.PI * 4 + 1) * -1.6 : 0);
  const [nx, ny] = s.look || [0.3, 0];
  const [fx, fy] = s.lookFar || [0.2, -0.1];
  const skinFill = s.skin && s.skin !== 'ink' ? `url(#${p}-${s.skin})` : null;
  const mix = skinFill ? (s.skinMix ?? 1) : 0;
  const inkFill = `url(#${p}-ink)`;
  const body = (fill, op = 1) => `<path d="${BODY}" fill="${fill}" ${op < 1 ? `opacity="${fmt(op)}"` : ''}/>`;
  const headShape = (fill, op = 1) => `<path d="${HEAD}" fill="${fill}" ${op < 1 ? `opacity="${fmt(op)}"` : ''}/>`;
  const outline = skinFill && mix > 0 ? `<path d="${BODY}" fill="none" stroke="${PALETTE.black}" stroke-width="${fmt(3 * mix)}"/>` : '';

  return `<g class="girgit" ${s.opacity != null ? `opacity="${fmt(s.opacity)}"` : ''}>
  <ellipse cx="0" cy="2" rx="${fmt(86 - Math.abs(bob) * 2)}" ry="9" fill="#142118" opacity="0.18"/>
  <g transform="translate(0 ${fmt(bob)})">
    <g class="tail" transform="rotate(${fmt(tail)} ${TAIL_BASE[0]} ${TAIL_BASE[1]})">
      <path d="M -72 -46 C -102 -44 -122 -28 -122 -6 C -122 16 -102 28 -84 22 C -68 17 -66 -2 -80 -6 C -90 -9 -96 2 -88 6" fill="none" stroke="#050505" stroke-width="17" stroke-linecap="round"/>
      <path d="M -72 -46 C -102 -44 -122 -28 -122 -6 C -122 16 -102 28 -84 22 C -68 17 -66 -2 -80 -6 C -90 -9 -96 2 -88 6" fill="none" stroke="${skinFill && mix > 0.5 ? skinFill : '#1F1D19'}" stroke-width="12" stroke-linecap="round"/>
    </g>
    ${leg('ff', t, walking, '#2C2924', 13, 11, lift)}${leg('fb', t, walking, '#2C2924', 13, 11, lift)}
    ${body(inkFill)}${skinFill ? body(skinFill, mix) : ''}${outline}
    <path d="M -50 -40 C -20 -30 20 -30 50 -40" fill="none" stroke="#3B3833" stroke-width="10" stroke-linecap="round" opacity="${fmt(0.8 * (1 - mix))}"/>
    <path d="M -46 -92 C -20 -104 14 -106 40 -98" fill="none" stroke="#FFFFFF" stroke-opacity="${fmt(0.22 * (1 - mix))}" stroke-width="7" stroke-linecap="round"/>
    ${leg('nb', t, walking, '#0D0D0C', 15, 13, lift)}${leg('nf', t, walking, '#0D0D0C', 15, 13, lift)}
    <g class="head" transform="rotate(${fmt(head)} ${NECK[0]} ${NECK[1]})">
      <circle cx="${fmt(112 + fx * 3)}" cy="-114" r="12" fill="url(#${p}-eye)" stroke="#050505" stroke-width="3"/>
      <circle cx="${fmt(114 + fx * 5)}" cy="${fmt(-114 + fy * 4)}" r="4.5" fill="#080808"/>
      ${headShape(inkFill)}${skinFill ? headShape(skinFill, mix) : ''}
      <path d="M 50 -132 C 64 -146 84 -148 98 -142" fill="none" stroke="#FFFFFF" stroke-opacity="${fmt(0.25 * (1 - mix))}" stroke-width="6" stroke-linecap="round"/>
      <path d="M 128 -80 C 114 -70 100 -68 88 -71" fill="none" stroke="#050505" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="92" cy="-100" r="24" fill="url(#${p}-eye)" stroke="#050505" stroke-width="5"/>
      <circle cx="${fmt(92 + nx * 11)}" cy="${fmt(-100 + ny * 11)}" r="8.5" fill="#080808"/>
      <ellipse cx="84" cy="-109" rx="4.5" ry="3.2" fill="#FFFFFF" opacity="0.9"/>
    </g>
  </g>
</g>`;
}
