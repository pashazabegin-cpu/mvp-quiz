/**
 * Закрашивание текста по словам (эффект MagicText из HextaUI): слово видно на 20%
 * и проявляется до 100% строго по очереди, каждое на своём отрезке скролла.
 * Используют «Что мы придумали?» (intro.ts) и текст «Спортивного квиза» (quiz.ts).
 */
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

type Range = {
  /** начало — по умолчанию когда верх текста въезжает на 90% высоты экрана */
  start?: ScrollTrigger.Vars['start'];
  /** конец: позиция ScrollTrigger или функция, возвращающая скролл в px */
  end: ScrollTrigger.Vars['end'];
};

export function initMagicText(el: HTMLElement, { start = 'top 90%', end }: Range) {
  const { words } = SplitText.create(el, { type: 'words', wordsClass: 'w' });
  gsap.set(words, { opacity: 0.2 });
  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: el, start, end, scrub: true, invalidateOnRefresh: true },
    })
    .to(words, { opacity: 1, duration: 1, stagger: 1 }); // stagger = длительность: отрезки слов не перекрываются
}
