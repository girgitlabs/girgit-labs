// Small, hand-made motion, from the chameleon idea (watch, adapt, catch).
// - How we work: the statement's words rise; "No boring solutions." flushes through colours (CSS).
// Everything is off with reduced motion.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);

/* ---------- The statement: one box per word so each can rise; the second line changes colour ---------- */
const statement = $('.s5-statement');
if (statement) {
  let i = 0;
  const wrap = (node, shift) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType !== 3) { wrap(child, true); continue; }
      const frag = document.createDocumentFragment();
      for (const part of child.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (!part.trim()) { frag.append(part); continue; }
        const box = document.createElement('span'), w = document.createElement('span');
        box.className = shift ? 'sw sw--shift' : 'sw'; w.textContent = part; w.style.setProperty('--i', i++);
        box.append(w); frag.append(box);
      }
      child.replaceWith(frag);
    }
  };
  wrap(statement, false);
  const reveal = () => statement.classList.add('is-in');
  if (reduce || !('IntersectionObserver' in window)) reveal();
  else new IntersectionObserver(([e], o) => { if (e.isIntersecting) { reveal(); o.disconnect(); } }, { threshold: 0.35 }).observe(statement);
}
