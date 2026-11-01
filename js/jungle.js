// SECTION 03 — the jungle scene: layout and markup from the supplied clay renders (no DOM, so
// Node render checks draw the same thing). Scene units are the jungle plate's own pixels
// (2000 x 1116); the looping jungle video (assets/video/jungle.mp4) has the same framing.

export const VIEW = { w: 2000, h: 1116 };
const IMG = 'assets/img/hide/';
const f = (n) => (Math.round(n * 10) / 10).toString();

/* ---------- Girgit: girgit-camo.webp (1443 x 780), cut above the clay foliage he stood in ---------- */
export const GIRGIT = {
  src: `${IMG}girgit-camo.webp`, w: 1443, h: 780,
  neck: [1000, 430],                        // head pivot
  tailBase: [330, 560],
  eyeNear: { x: 1175, y: 309, iris: 40, pupil: 17, travel: 20 },
  eyeFar: { x: 1421, y: 301, rx: 12, ry: 18, prx: 5, pry: 8, travel: 5 },
};

/* ---------- Where he hides: on the branches, with the leaves that cover him there ---------- */
// x: centre of his feet line, y: the branch top, w: his drawn width. Leaves: file, centre, rotation, scale.
export const SPOTS = [
  {
    id: 'a', x: 1150, y: 706, w: 560,
    leaves: [['leaf-10', 930, 722, -12, 0.7], ['leaf-08', 1090, 724, -8, 0.7], ['leaf-04', 1262, 748, 18, 0.62], ['leaf-03', 1170, 652, -14, 0.45]],
  },
  {
    id: 'b', x: 1760, y: 566, w: 470,
    leaves: [['leaf-09', 1582, 566, -25, 0.75], ['leaf-02', 1800, 614, 12, 0.55], ['leaf-05', 1950, 580, 20, 0.7]],
  },
  {
    id: 'c', x: 1700, y: 296, w: 330,
    leaves: [['leaf-01', 1640, 322, -20, 0.42], ['leaf-08', 1782, 302, 15, 0.55], ['leaf-05', 1872, 292, -10, 0.5]],
  },
];
export const LEAF_SIZE = {
  'leaf-01': [581, 494], 'leaf-02': [487, 464], 'leaf-03': [670, 314], 'leaf-04': [416, 383], 'leaf-05': [198, 230],
  'leaf-06': [522, 573], 'leaf-07': [544, 575], 'leaf-08': [166, 214], 'leaf-09': [223, 285], 'leaf-10': [362, 339],
};

/** Girgit's placement for a position {x, y, w}: his image sits with its bottom edge on the branch. */
export const placeOf = (p) => { const s = p.w / GIRGIT.w; return { s, left: p.x - p.w / 2, top: p.y + 8 - GIRGIT.h * s }; };
export const eyeAt = (p) => { const { s, left, top } = placeOf(p); return [left + GIRGIT.eyeNear.x * s, top + GIRGIT.eyeNear.y * s]; };

export function leavesMarkup() {
  return SPOTS.map((sp) => sp.leaves.map(([file, x, y, rot, sc]) => {
    const [w, h] = LEAF_SIZE[file];
    return `<g class="leaf" data-spot="${sp.id}" transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})"><g class="lean"><g class="sway">
      <image href="${IMG}${file}.webp" x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}"/></g></g></g>`;
  }).join('')).join('');
}

/** Girgit in image units (the caller scales and places him). Head and tail are soft-edged copies of
 *  the same image so they can turn and sway; his eyes are live, outside the camouflage filter. */
export function girgitMarkup() {
  const g = GIRGIT, img = (mask) => `<image href="${g.src}" width="${g.w}" height="${g.h}" ${mask ? `mask="url(#${mask})"` : ''}/>`;
  const n = g.eyeNear, fa = g.eyeFar;
  return `<defs>
      <linearGradient id="hg-headfade" gradientUnits="userSpaceOnUse" x1="925" x2="1010" y1="0" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>
      <mask id="hg-head" maskUnits="userSpaceOnUse" x="0" y="0" width="${g.w}" height="${g.h}"><rect width="${g.w}" height="${g.h}" fill="url(#hg-headfade)"/></mask>
      <linearGradient id="hg-tailfade" gradientUnits="userSpaceOnUse" x1="290" x2="380" y1="0" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
      <mask id="hg-tail" maskUnits="userSpaceOnUse" x="0" y="0" width="${g.w}" height="${g.h}"><rect y="440" width="${g.w}" height="${g.h - 440}" fill="url(#hg-tailfade)"/></mask>
      <filter id="hg-camo" color-interpolation-filters="sRGB"><feColorMatrix class="hg-matrix" type="matrix" values="${camoMatrix(1)}"/></filter>
      <radialGradient id="hg-glowgrad"><stop offset="0.35" stop-color="#FFE500" stop-opacity="0.75"/><stop offset="1" stop-color="#FFE500" stop-opacity="0"/></radialGradient>
      <radialGradient id="hg-iris" cx="0.42" cy="0.38" r="0.7"><stop offset="0" stop-color="#FFF27A"/><stop offset="0.55" stop-color="#E9C81F"/><stop offset="1" stop-color="#8E7006"/></radialGradient>
    </defs>
    <g class="hg-skin" filter="url(#hg-camo)">${img('')}<g class="hg-tail">${img('hg-tail')}</g></g>
    <g class="hg-head">
      <g filter="url(#hg-camo)">${img('hg-head')}</g>
      <circle class="hg-shine" cx="${n.x}" cy="${n.y}" r="${n.iris * 2}" fill="url(#hg-glowgrad)"/><circle class="hg-shine" cx="${fa.x}" cy="${fa.y}" r="${fa.ry * 2}" fill="url(#hg-glowgrad)"/>
      <circle class="hg-glow" cx="${n.x}" cy="${n.y}" r="${n.iris * 2.4}" fill="url(#hg-glowgrad)"/>
      <circle class="hg-glow" cx="${fa.x}" cy="${fa.y}" r="${fa.ry * 2.6}" fill="url(#hg-glowgrad)"/>
      <g class="hg-eye" transform="translate(${n.x} ${n.y})"><g class="hg-iris">
        <circle r="${n.iris}" fill="url(#hg-iris)"/><circle r="${n.iris}" fill="none" stroke="#2E3A12" stroke-width="2.5" opacity="0.7"/>
        <circle class="hg-pupil" r="${n.pupil}" fill="#0A0A06"/><circle cx="-11" cy="-12" r="6" fill="#fff" opacity="0.85"/>
      </g></g>
      <g class="hg-eye" transform="translate(${fa.x} ${fa.y})"><g class="hg-iris">
        <ellipse rx="${fa.rx}" ry="${fa.ry}" fill="url(#hg-iris)"/><ellipse class="hg-pupil" rx="${fa.prx}" ry="${fa.pry}" fill="#0A0A06"/>
      </g></g>
    </g>`;
}

/* ---------- Camouflage: a colour matrix from his own clay green (0) to the shadowed foliage (1) ---------- */
const ID = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
// Rows R, G, B, A (each: from R, G, B, A, offset). His clay green -> the jungle's shadowed mid-green.
const CAMO = [0.42, 0.04, 0, 0, 0, 0.06, 0.55, 0, 0, 0, 0.004, 0.05, 0.42, 0, 0, 0, 0, 0, 1, 0];
export function camoMatrix(c) { return ID.map((v, i) => (v + (CAMO[i] - v) * c).toFixed(3)).join(' '); }
