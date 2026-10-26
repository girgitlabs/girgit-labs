/* Girgit Labs — the chameleon button
   On hover, the label eases left and a small chameleon slides in from the right
   edge. Its tongue sticks to the cursor wherever it is in the button (over the
   label too) and follows it. On leave the tongue snaps back and it slips away;
   on click it gulps. Keyboard focus: the tongue sticks to the end of the label.
   Applies to every primary button (.btn--sand). Touch and reduced motion keep
   the plain button. */
(() => {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover)').matches) return;
  const NS = 'http://www.w3.org/2000/svg';
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // a small chameleon, facing left, peeking in over the right edge (viewBox 40×40)
  const BODY = `
    <path class="bc-skin" d="M6.2 22.4C7.6 17 12.6 12.4 19 11.3L28.8 3.6C30.4 2.4 32.4 3.1 33 5L35.6 12.2C38.3 13.6 42 14.4 54 14.6V34C44 33.4 35.6 31.6 31.2 30.1C28.6 31.5 24.4 31.9 20.4 31.2C14.4 30.1 8.8 27.6 6.2 22.4Z"/>
    <path class="bc-crest" d="M20.5 11.2L29.2 4.6M24 11.6L30.8 6.4" />
    <path class="bc-mouth" d="M6.8 22.6C10.6 24.6 14.8 25.4 19.4 25"/>
    <path class="bc-skin" d="M29.6 28.4C28.8 31.4 27.6 33.8 25.8 35.6L23 36.4C22.2 36.7 21.9 37.8 22.6 38.3C23.4 38.8 25 38.6 26.2 38.1L27.9 39C28.8 39.4 29.7 38.4 29.2 37.6L30.2 34.6C31.4 32.8 32.6 30.8 33.4 28.8Z"/>
    <circle class="bc-eye" cx="19.2" cy="17.4" r="5.6"/>
    <circle class="bc-eye-ring" cx="19.2" cy="17.4" r="3.6"/>
    <g class="bc-pupil"><circle cx="19.2" cy="17.4" r="1.9"/><circle class="bc-glint" cx="18.5" cy="16.7" r=".6"/></g>`;
  const MOUTH = { x: 7, y: 22.8 };
  const EYE = { x: 19.2, y: 17.4 };

  const enhance = (btn) => {
    if (btn.classList.contains('btn--cham')) return;
    // wrap the label so it can ease aside for the chameleon
    let label = btn.querySelector('.btn__label');
    if (!label) {
      label = document.createElement('span');
      label.className = 'btn__label';
      [...btn.childNodes].forEach((n) => label.append(n));
      btn.append(label);
    }
    btn.classList.add('btn--cham');
    const stage = document.createElement('span');
    stage.className = 'btn-cham';
    stage.setAttribute('aria-hidden', 'true');
    stage.innerHTML = `<svg class="btn-cham__tongue" xmlns="${NS}"><path/><circle r="3.4"/></svg><svg class="btn-cham__body" viewBox="0 0 40 40" xmlns="${NS}">${BODY}</svg>`;
    btn.append(stage);
    const tongueSvg = stage.querySelector('.btn-cham__tongue');
    const tonguePath = tongueSvg.querySelector('path');
    const tip = tongueSvg.querySelector('circle');
    const body = stage.querySelector('.btn-cham__body');
    const pupil = body.querySelector('.bc-pupil');

    let state = 'idle', raf = 0, ext = 0, tx = 0, ty = 0, aimX = 0, aimY = 0, since = 0, gulp = 0;
    const labelEnd = () => {
      const r = btn.getBoundingClientRect(), lr = label.getBoundingClientRect();
      return { x: lr.right - r.left - 2, y: lr.top - r.top + lr.height * 0.55 };
    };
    const mouth = () => {
      const r = btn.getBoundingClientRect(), b = body.getBoundingClientRect();
      const s = b.width / 40;
      return { x: b.left - r.left + MOUTH.x * s, y: b.top - r.top + MOUTH.y * s, s };
    };

    const frame = (now) => {
      raf = 0;
      const r = btn.getBoundingClientRect();
      tongueSvg.setAttribute('viewBox', `0 0 ${r.width.toFixed(1)} ${r.height.toFixed(1)}`);
      const m = mouth();
      const out = state === 'on' && now - since > 260;         // wait for it to arrive
      if (gulp) { ext = lerp(ext, 0, 0.45); if (ext < 0.02) gulp = 0; }
      else ext = lerp(ext, out ? 1 : 0, out ? 0.22 : 0.4);
      // the tip sticks to the aim point, with a little lag
      aimX = clamp(aimX, 6, m.x - 4); aimY = clamp(aimY, 6, r.height - 6);
      tx = lerp(tx, aimX, 0.3); ty = lerp(ty, aimY, 0.3);
      const ex = lerp(m.x, tx, ext), ey = lerp(m.y, ty, ext);
      const sag = Math.min(8, Math.abs(m.x - ex) * 0.06) * Math.sin(ext * Math.PI * 0.5);
      tonguePath.setAttribute('d', `M${m.x.toFixed(1)} ${m.y.toFixed(1)}Q${((m.x + ex) / 2).toFixed(1)} ${((m.y + ey) / 2 + sag).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`);
      tonguePath.style.strokeWidth = (2.6 * m.s).toFixed(2);
      tip.setAttribute('cx', ex.toFixed(1)); tip.setAttribute('cy', ey.toFixed(1));
      tip.setAttribute('r', (ext > 0.05 ? 3.3 * m.s : 0).toFixed(2));
      tongueSvg.style.opacity = ext > 0.02 ? 1 : 0;
      // the eye follows the tip
      const b = body.getBoundingClientRect(), s = b.width / 40;
      const exl = b.left - r.left + EYE.x * s, eyl = b.top - r.top + EYE.y * s;
      const dx = ex - exl, dy = ey - eyl, d = Math.hypot(dx, dy) || 1;
      pupil.setAttribute('transform', `translate(${((dx / d) * 1.5).toFixed(2)} ${((dy / d) * 1.5).toFixed(2)})`);
      if (state !== 'idle' || ext > 0.02) raf = requestAnimationFrame(frame);
    };
    const run = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const on = (x, y) => {
      if (state !== 'on') { state = 'on'; since = performance.now(); const m0 = labelEnd(); tx = m0.x; ty = m0.y; }
      aimX = x; aimY = y;
      btn.classList.add('is-cham');
      run();
    };
    const off = () => { state = 'idle'; btn.classList.remove('is-cham'); run(); };

    btn.addEventListener('pointerenter', (e) => { const r = btn.getBoundingClientRect(); on(e.clientX - r.left, e.clientY - r.top); });
    btn.addEventListener('pointermove', (e) => { if (state !== 'on') return; const r = btn.getBoundingClientRect(); aimX = e.clientX - r.left; aimY = e.clientY - r.top; });
    btn.addEventListener('pointerleave', off);
    btn.addEventListener('focus', () => { if (!btn.matches(':focus-visible')) return; const p = labelEnd(); on(p.x, p.y); });
    btn.addEventListener('blur', off);
    btn.addEventListener('pointerdown', () => { if (state === 'on') { gulp = 1; btn.classList.add('is-gulp'); setTimeout(() => btn.classList.remove('is-gulp'), 320); run(); } });
  };

  const init = () => document.querySelectorAll('.btn--sand').forEach(enhance);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
