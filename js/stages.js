// Scroll locks for the scenes that play in stages. Inside a scene, one scroll gesture (a wheel notch or
// flick, a swipe, an arrow / Page / Space key) moves exactly one stage: the page glides to that stage's
// position, input is held while it glides and for a short fixed pause after, and then the next scroll
// moves the next stage. Past the first or last stage, scrolling is normal again.
// A scene registers its stages with registerStages(() => [scrollY of each stage, in order]); positions
// are asked for fresh on every gesture, so nothing goes stale when the page above changes height.
// Reduced motion: no locks (the scenes show their still versions anyway).

// Scenes registered under the same group name are one run of stages, however far apart they are.
const providers = [];
export const registerStages = (fn, group) => { providers.push({ fn, group: group || Symbol('scene') }); };

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const zones = () => {
  const groups = new Map();
  for (const { fn, group } of providers) {
    let l = [];
    try { l = fn() || []; } catch { l = []; }
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(...l.map(Math.round));
  }
  return [...groups.values()].filter((l) => l.length).map((l) => l.sort((a, b) => a - b));
};

// While a glide runs, input is held. After it lands there is one short, fixed pause (COOL), and then the
// next scroll moves the next stage. The pause is not extended by more scrolling: keeping the wheel going
// steps through the stages one after another, instead of holding the page still until the wheel stops
// (which read as "stuck"). It is just long enough that one flick of a trackpad does not skip a stage.
let locked = false, until = 0, tween = 0;
const COOL = 260;
const held = () => locked || performance.now() < until;

// The target is looked up again on every frame (target()), so if anything on the page shifts while the
// glide runs (an image arriving, a scene re-measuring), it still lands exactly on the stage.
const glide = (target) => {
  cancelAnimationFrame(tween);
  const from = scrollY, t0 = performance.now();
  const dur = Math.min(850, Math.max(480, Math.abs(target() - from) * 0.6));
  const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  locked = true;
  const step = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    window.scrollTo({ top: from + (target() - from) * ease(k), behavior: 'instant' });
    if (k < 1) { tween = requestAnimationFrame(step); return; }
    locked = false; until = performance.now() + COOL;
  };
  tween = requestAnimationFrame(step);
};

// One gesture in direction dir (1 down, -1 up). Returns true if it was taken (the page should not scroll).
const gesture = (dir) => {
  const y = scrollY, near = innerHeight * 0.5, T = 12;      // T: how close counts as "on" a stage
  const all = zones();
  // Glide to stage i of zone zi, its position looked up fresh each frame.
  const go = (zi, i) => { const fallback = all[zi][i]; glide(() => zones()[zi]?.[i] ?? fallback); return true; };
  for (let zi = 0; zi < all.length; zi++) {
    const z = all[zi], last = z.length - 1;
    // Arriving: within half a screen of a run's first stage going down (or its last going up), land on it
    // exactly, rather than letting the wheel overshoot into the scene.
    if (dir > 0 && y < z[0] - T && z[0] - y <= near) return go(zi, 0);
    if (dir < 0 && y > z[last] + T && y - z[last] <= near) return go(zi, last);
    if (y < z[0] - T || y > z[last] + T) continue;             // not in this scene
    const i = dir > 0 ? z.findIndex((s) => s > y + T) : z.findLastIndex((s) => s < y - T);
    if (i === -1) return false;                                // past the first or last stage: let it go
    return go(zi, i);
  }
  return false;
};

if (!reduce) {
  addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;                                     // pinch-zoom
    if (held()) { e.preventDefault(); return; }
    if (Math.abs(e.deltaY) < 4 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (gesture(Math.sign(e.deltaY))) e.preventDefault();
  }, { passive: false });

  const KEYS = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 };
  addEventListener('keydown', (e) => {
    const dir = KEYS[e.key];
    if (!dir || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest?.('input, textarea, select, [contenteditable], button')) return;
    const d = e.key === ' ' && e.shiftKey ? -1 : dir;
    if (held()) { e.preventDefault(); return; }
    if (gesture(d)) e.preventDefault();
  });

  // Touch: a swipe of more than 40px is one gesture; while it is being decided, the page does not move.
  let ty = null, taken = false;
  addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; taken = false; }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (ty === null) return;
    if (locked || taken) { e.preventDefault(); return; }
    const dy = ty - e.touches[0].clientY;
    if (Math.abs(dy) < 40) {
      // Inside a scene, hold the page still until the swipe is long enough to count.
      const y = scrollY;
      if (zones().some((z) => y >= z[0] - 12 && y <= z.at(-1) + 12)) e.preventDefault();
      return;
    }
    if (gesture(Math.sign(dy))) { taken = true; e.preventDefault(); }
  }, { passive: false });
  addEventListener('touchend', () => { ty = null; }, { passive: true });
}
