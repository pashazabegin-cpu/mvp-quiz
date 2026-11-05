/**
 * Мобильная раскладка: одно спокойное появление вместо всех эффектов текста.
 * Элемент целиком мягко проявляется, когда входит на экран, — один раз и только прозрачностью:
 * ничего не сдвигается, поэтому под пальцем ничего не «прыгает». Анимацию ведёт сам браузер
 * (CSS-переход в global.css, класс .soft → .is-shown), а не скрипт по кадрам, — она плавная, даже когда
 * телефон в энергосбережении и скрипты на странице идут вполсилы.
 * Без плашек по строкам, разбивки на строки и слова и закрашивания.
 *
 * Заменяет на мобильном: [data-split] (плашка, reveal.ts), [data-lines] / [data-rise] (строки из-под маски,
 * text-reveal.ts), [data-reveal] / [data-stagger] (reveal.ts) и закрашивание по словам (magic-text.ts)
 * у текста «Что мы придумали?» и «Спортивного квиза».
 */
export const SOFT_REVEAL = {
  /** шаг между элементами, вошедшими на экран вместе, с (не больше maxSteps шагов) */
  stagger: 0.06,
  maxSteps: 3,
  /** элемент проявляется, как только его верх поднялся над нижними 4% экрана */
  margin: '0px 0px -4% 0px',
};

export const SOFT_REVEAL_TARGETS = [
  '[data-split]',
  '[data-lines]',
  '[data-rise]',
  '[data-reveal]',
  '[data-stagger] > *',
  '[data-intro-lead] > p',
  '[data-quiz-step]',
  '[data-quiz-lead] > p',
].join(', ');

export function initSoftReveal(selector = SOFT_REVEAL_TARGETS) {
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (!els.length) return;
  els.forEach((el) => el.classList.add('soft'));

  const io = new IntersectionObserver(
    (entries) => {
      const shown = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
      shown.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      shown.forEach((el, i) => {
        io.unobserve(el);
        el.style.setProperty('--soft-delay', `${Math.min(i, SOFT_REVEAL.maxSteps) * SOFT_REVEAL.stagger}s`);
        el.classList.add('is-shown');
      });
    },
    { rootMargin: SOFT_REVEAL.margin },
  );
  els.forEach((el) => io.observe(el));
}
