// SECTION 01 — the hero, Girgit's living skin. One WebGL fragment shader draws the whole hero as
// chameleon skin: a hex field of domed scales (varied sizes, a glint, dark seams), blotched in the
// current palette. The headline is written by the skin: each scale samples a mask of the real h1 at
// its centre and flushes the palette's light colour inside the letters. Moving the pointer sends
// colour waves (turquoise, blue, an orange core) rippling out through the scales, the way a real
// chameleon's chromatophores do; a click washes the whole skin into the next palette, spreading from
// the click. Scrolling pulls the camera back: the scales shrink and dim while the photo of Girgit
// mid colour-change comes in as a match cut, from close on his flank out to the whole animal.
// The scales are generated, not drawn; Girgit himself only appears as the supplied image.
// No WebGL, a shader that fails, or no JS: the still CSS version with the headline as plain text.
// Reduced motion: one still frame of the skin (with the headline), no waves, no pull-back.

const hero = document.querySelector('.sk');

// Palettes: [deep, mid, letters], in 0..1 RGB.
const PALETTES = [
  [[0.07, 0.30, 0.16], [0.16, 0.55, 0.22], [0.86, 0.95, 0.20]],      // green, the skin at rest
  [[0.04, 0.18, 0.30], [0.08, 0.42, 0.55], [0.60, 0.97, 0.90]],      // teal
  [[0.35, 0.12, 0.04], [0.75, 0.38, 0.08], [1.00, 0.88, 0.35]],      // amber
  [[0.14, 0.06, 0.30], [0.38, 0.18, 0.62], [1.00, 0.58, 0.86]],      // violet
];
const PULSES = 8;

const VERT = 'attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }';
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;            // canvas size (device px)
uniform float uTime;          // seconds
uniform float uR;             // scale radius (device px)
uniform float uDpr;           // device pixels per CSS px
uniform vec3 uMouse;          // pointer x, y (device px, from the top left) and how present it is (0..1)
uniform vec3 uPulse[${PULSES}];        // wave origins: x, y, start time (start < 0: unused)
uniform sampler2D uText;      // the headline mask (white inside the letters)
uniform vec3 uFrom[3];        // the palette before the last wash
uniform vec3 uTo[3];          // the palette after it
uniform vec3 uWash;           // where and when the wash started
uniform float uDim;           // 0..1 as the camera pulls back

float sq(float x) { return x * x; }       // not pow(x, 2.0): pow is undefined for negative x
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);

  // The nearest scale: a pointy-top hex grid in axial coordinates, rounded in cube space.
  float q = (0.5773503 * p.x - 0.3333333 * p.y) / uR;
  float r = (0.6666667 * p.y) / uR;
  vec3 c = vec3(q, -q - r, r);
  vec3 rc = floor(c + 0.5);
  vec3 d = abs(rc - c);
  if (d.x > d.y && d.x > d.z) rc.x = -rc.y - rc.z;
  else if (d.y > d.z) rc.y = -rc.x - rc.z;
  else rc.z = -rc.x - rc.y;
  vec2 id = rc.xz;
  vec2 cen = vec2(uR * 1.7320508 * (rc.x + rc.z * 0.5), uR * 1.5 * rc.z);
  float n = hash(id), n2 = hash(id.yx + 7.0);

  // The palette: a wash spreads out from where it started.
  float inWash = step(distance(cen, uWash.xy), (uTime - uWash.z) * uRes.x * 0.9);
  vec3 deep = mix(uFrom[0], uTo[0], inWash);
  vec3 mid = mix(uFrom[1], uTo[1], inWash);
  vec3 lit = mix(uFrom[2], uTo[2], inWash);

  // The skin's own pattern: big soft blotches that drift very slowly, and a rare bright fleck.
  float blot = vnoise(cen / (uR * 18.0) + uTime * 0.02) * 0.65 + vnoise(cen / (uR * 7.0) + 3.1) * 0.35;
  vec3 col = mix(deep, mid, blot);
  col = mix(col, lit * 0.8 + mid * 0.2, step(0.985, n));
  float txt = step(0.5, texture2D(uText, cen / uRes).r) * (1.0 - smoothstep(0.0, 0.5, uDim));   // the letters fade as the camera pulls back
  col = mix(col, lit * (0.92 + 0.08 * n), txt);

  // Colour waves: rings that travel out from each origin and fade, with an orange core.
  vec3 turq = vec3(0.10, 0.75, 0.72), blue = vec3(0.13, 0.35, 0.95), orange = vec3(1.0, 0.52, 0.12);
  float k = 0.0; vec3 wave = turq;
  for (int i = 0; i < ${PULSES}; i++) {
    vec3 pu = uPulse[i];
    float age = uTime - pu.z;
    if (pu.z < 0.0 || age > 3.0) continue;
    float dist = distance(cen, pu.xy);
    float ring = exp(-sq((dist - age * 360.0 * uDpr) / (34.0 * uDpr))) * exp(-age * 1.1);
    float core = exp(-sq(dist / (48.0 * uDpr))) * exp(-age * 2.5);
    float kk = clamp(ring + core, 0.0, 1.0);
    if (kk > k) { k = kk; wave = mix(mix(turq, blue, step(0.5, n) * step(0.45, ring)), orange, clamp(core * 1.6, 0.0, 1.0)); }
  }
  // The pointer's own glow, wherever it is.
  float md = distance(cen, uMouse.xy);
  float glow = exp(-sq(md / (72.0 * uDpr))) * uMouse.z;
  if (glow > k) { k = glow; wave = mix(turq, orange, exp(-sq(md / (28.0 * uDpr)))); }
  col = mix(col, wave, k * mix(1.0, 0.35, txt));

  // Each scale: a dome of varied size, a glint up and to the left, dark seams between scales.
  float dd = distance(p, cen) / uR / (0.78 + 0.3 * n2);
  float shade = 1.12 - 0.5 * min(dd * dd, 1.0);
  vec2 g = (p - cen) / uR + vec2(0.32, 0.36);
  float spec = exp(-dot(g, g) / 0.035) * 0.28;
  float seam = clamp((dd - 0.86) / 0.16, 0.0, 1.0);
  vec3 o = mix(col * shade + spec, vec3(0.02, 0.07, 0.04), seam);
  vec2 v = p / uRes - 0.5;
  o *= (1.0 - 0.6 * dot(v, v)) * (1.0 - uDim * 0.65);
  gl_FragColor = vec4(clamp(o, 0.0, 1.0), 1.0);
}`;

function init() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = hero.querySelector('.sk-canvas');
  const track = hero.closest('.sk-track');
  const title = hero.querySelector('.sk-title');
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (!gl) return;                                                        // the still CSS version stays

  /* ---------- The shader program ---------- */
  const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : (console.warn('skin shader:', gl.getShaderInfoLog(s)), null); };
  const vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn('skin program:', gl.getProgramInfoLog(prog)); return; }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);    // one triangle covers the screen
  const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const u = { res: U('uRes'), time: U('uTime'), r: U('uR'), dpr: U('uDpr'), mouse: U('uMouse'), pulse: U('uPulse'), text: U('uText'), from: U('uFrom'), to: U('uTo'), wash: U('uWash'), dim: U('uDim') };

  /* ---------- The headline mask: the real h1, drawn where it sits ---------- */
  const mask = document.createElement('canvas'), mctx = mask.getContext('2d');
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const drawMask = () => {
    const h = hero.getBoundingClientRect();
    mask.width = Math.max(1, Math.round(h.width)); mask.height = Math.max(1, Math.round(h.height));
    mctx.fillStyle = '#000'; mctx.fillRect(0, 0, mask.width, mask.height); mctx.fillStyle = '#fff';
    for (const line of title.children) {
      const r = line.getBoundingClientRect(), cs = getComputedStyle(line), text = line.textContent.toUpperCase();
      mctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      if ('letterSpacing' in mctx) mctx.letterSpacing = cs.letterSpacing;
      const m = mctx.measureText(text);
      mctx.fillText(text, r.left - h.left, r.top - h.top + (r.height + m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
    }
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
  };

  /* ---------- State ---------- */
  let dpr = 1, reveal = 0;
  const start = performance.now(), mouse = [0, 0, 0];
  let mouseTarget = 0, pal = 0, from = PALETTES[0], to = PALETTES[0], wash = [0, 0, -100];
  const pulses = Array.from({ length: PULSES }, () => [0, 0, -1]);
  let nextPulse = 0, lastPulse = { x: -1e4, y: -1e4, t: -1 };
  const now = () => (performance.now() - start) / 1000;
  const size = () => {
    const r = hero.getBoundingClientRect();
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    drawMask();
  };
  const pulse = (x, y) => { pulses[nextPulse] = [x * dpr, y * dpr, now()]; nextPulse = (nextPulse + 1) % PULSES; };

  const draw = () => {
    const t = now();
    if (t - wash[2] > 3) from = to;                                        // the last wash has covered the skin
    mouse[2] += (mouseTarget - mouse[2]) * 0.12;
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.time, t);
    gl.uniform1f(u.r, (window.innerWidth < 760 ? 6 : 7.5) * dpr * (1 - 0.62 * reveal));
    gl.uniform1f(u.dpr, dpr);
    gl.uniform3f(u.mouse, mouse[0], mouse[1], mouse[2]);
    gl.uniform3fv(u.pulse, new Float32Array(pulses.flat()));
    gl.uniform3fv(u.from, new Float32Array(from.flat()));
    gl.uniform3fv(u.to, new Float32Array(to.flat()));
    gl.uniform3f(u.wash, wash[0], wash[1], wash[2]);
    gl.uniform1f(u.dim, reveal);
    gl.uniform1i(u.text, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  size();
  addEventListener('resize', () => { size(); if (reduce) draw(); }, { passive: true });
  document.fonts?.ready.then(() => { drawMask(); if (reduce) draw(); });
  draw();
  hero.classList.add('has-skin');
  if (reduce) return;                                                     // one still frame; no waves, no pull-back

  /* ---------- The pointer: a glow that follows it, waves as it travels, a wash on click ---------- */
  const local = (e) => { const r = hero.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  hero.addEventListener('pointermove', (e) => {
    const [x, y] = local(e), t = now();
    mouse[0] = x * dpr; mouse[1] = y * dpr; mouseTarget = 1;
    if (Math.hypot(x - lastPulse.x, y - lastPulse.y) > 110 && t - lastPulse.t > 0.18) { pulse(x, y); lastPulse = { x, y, t }; }
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { mouseTarget = 0; });
  hero.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) return;
    const [x, y] = local(e);
    pulse(x, y);
    from = to; pal = (pal + 1) % PALETTES.length; to = PALETTES[pal]; wash = [x * dpr, y * dpr, now()];
    try { window.posthog?.capture('hero_skin_washed', { palette: pal }); } catch { /* fine */ }
  });

  /* ---------- Scroll: the camera pulls back; the match cut reveals whose skin it is ----------
     reveal 0..1 over the track. The photo fades in early, while it is still zoomed 4x onto his flank
     (which reads as more of the same skin), then pulls back to the whole animal; his shadow and the
     caption arrive at the end. */
  track?.classList.add('is-live');
  const navH = () => document.querySelector('.nav')?.offsetHeight || 0;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const onScroll = () => {
    const r = track.getBoundingClientRect(), span = Math.max(1, r.height - hero.offsetHeight);
    const p = clamp01((navH() - r.top) / span);
    reveal = p < 0.12 ? 0 : clamp01((p - 0.12) / 0.7);
    const set = (k, v) => hero.style.setProperty(k, v.toFixed(3));
    set('--reveal', reveal);
    set('--zoom', 4 - 3 * easeOut(reveal));
    set('--fade', clamp01((reveal - 0.04) / 0.3));
    set('--cap', clamp01((reveal - 0.8) / 0.2));
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- The loop: only while the hero is on screen and the tab is visible ---------- */
  let visible = true, raf = 0;
  const loop = () => { draw(); raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0; };
  const wake = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake(); }).observe(hero);
  document.addEventListener('visibilitychange', wake);
  wake();
}

if (hero) init();   // last, so the shaders and palettes above exist
