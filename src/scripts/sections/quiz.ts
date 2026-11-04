/**
 * «Спортивный квиз»: карусель иконок (quiz-orbit.ts) и текст.
 *   «Настраиваемся • Играем • Кайфуем» — по скроллу загораются по очереди: каждый пункт поднимается
 *   и из 15% становится белым, уже загоревшиеся остаются — как шаги вечера;
 *   темы-плашки поднимаются из-под маски (data-rise, animations/text-reveal.ts);
 *   текст под ними закрашивается по словам, как в «Что мы придумали?» (animations/magic-text.ts).
 * На мобильном содержимое идёт потоком — высоту блока ставит fitFlow.
 */
import { gsap } from 'gsap';
import { initQuizOrbit } from './quiz-orbit';
import { initMagicText } from '../animations/magic-text';
import { MOBILE_QUERY, fitFlow } from '../core/stage';
import { refreshSoon } from '../core/refresh';

export function initQuiz(motion: boolean) {
  const section = document.querySelector<HTMLElement>('[data-quiz]');
  if (!section) return;
  if (window.matchMedia(MOBILE_QUERY).matches) fitFlow(section, refreshSoon);
  initQuizOrbit(motion);
  if (!motion) return;

  const steps = Array.from(section.querySelectorAll<HTMLElement>('[data-quiz-step]'));
  if (steps.length) {
    gsap
      .timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: { trigger: steps[0].parentElement!, start: 'top 85%', end: 'bottom 45%', scrub: 0.6 },
      })
      .fromTo(steps, { opacity: 0.15, y: 40 }, { opacity: 1, y: 0, duration: 1, stagger: 1 });
  }

  const lead = section.querySelector<HTMLElement>('[data-quiz-lead]');
  if (lead) initMagicText(lead, { start: 'top 85%', end: 'bottom 50%' });
}
