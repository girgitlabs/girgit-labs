// HOW WE WORK: the week wakes up. The timeline's markers are eye tiles that start asleep; when the week
// comes into view they open one after another, the rail fills behind them, and at Day 7 ("Live") Girgit
// pops up. Reduced motion or no IntersectionObserver: everything is awake and in place from the start.

const week = document.querySelector('.hw-week');

if (week) {
  const steps = [...week.querySelectorAll('.hw-step')];
  const wake = () => {
    week.classList.add('is-in');
    steps.forEach((s, i) => setTimeout(() => {
      s.classList.add('is-awake');
      s.querySelector('[data-asleep]')?.removeAttribute('data-asleep');
    }, 250 + i * 520));
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    week.classList.add('is-still');
    wake();
  } else {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); wake(); } }, { rootMargin: '0px 0px -25% 0px' });
    io.observe(week.querySelector('.hw-steps'));
  }
}
