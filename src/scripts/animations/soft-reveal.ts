/**
 * Мобильная раскладка: одно спокойное появление вместо всех эффектов текста.
 * Элемент целиком мягко проявляется и чуть поднимается, когда входит на экран, — один раз,
 * по времени, а не по скроллу. Без плашек по строкам, разбивки на строки и слова и закрашивания:
 * на телефоне это лишнее движение, которое отвлекает от чтения и нагружает скролл.
 *
 * Заменяет на мобильном: [data-split] (плашка, reveal.ts), [data-lines] / [data-rise] (строки из-под маски,
 * text-reveal.ts), [data-reveal] / [data-stagger] (reveal.ts) и закрашивание по словам (magic-text.ts)
 * у текста «Что мы придумали?» и «Спортивного квиза».
 */
import { gsap } from 'gsap';
import { enterObserver } from './text-reveal';

export const SOFT_REVEAL = {
  duration: 0.6,
  ease: 'power2.out',
  /** подъём, px экрана */
  rise: 14,
  /** шаг между элементами, вошедшими на экран вместе, с (не больше maxSteps шагов) */
  stagger: 0.07,
  maxSteps: 4,
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
  const els = gsap.utils.toArray<HTMLElement>(selector);
  if (!els.length) return;
  gsap.set(els, { autoAlpha: 0, y: SOFT_REVEAL.rise });
  const io = enterObserver((list) =>
    list.forEach((el, i) =>
      gsap.to(el, {
        autoAlpha: 1,
        y: 0,
        duration: SOFT_REVEAL.duration,
        ease: SOFT_REVEAL.ease,
        delay: Math.min(i, SOFT_REVEAL.maxSteps) * SOFT_REVEAL.stagger,
      }),
    ),
  );
  els.forEach((el) => io.observe(el));
}
