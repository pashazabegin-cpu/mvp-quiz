/**
 * «Спортивный квиз»: карусель иконок (quiz-orbit.ts) и текст.
 *   «Настраиваемся • Играем • Кайфуем» — строка собирается по скроллу целиком, слева направо:
 *   пункт поднимается и из 15% становится белым, следом точка-разделитель «выпрыгивает» из нуля,
 *   за ней следующий пункт — уже собравшиеся части остаются, как шаги вечера;
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

  // строка пунктов: слова и точки по порядку, как стоят в разметке
  const line = section.querySelector<HTMLElement>('[data-quiz-steps]');
  const parts = line ? (Array.from(line.children) as HTMLElement[]) : [];
  if (line && parts.length) {
    const tl = gsap.timeline({
      defaults: { duration: 1 },
      scrollTrigger: { trigger: line, start: 'top 88%', end: 'bottom 45%', scrub: 0.6 },
    });
    parts.forEach((el, i) => {
      const at = i * 0.6; // соседние части чуть перекрываются — строка собирается непрерывно
      if (el.hasAttribute('data-quiz-step')) {
        tl.fromTo(el, { opacity: 0.15, y: 40 }, { opacity: 1, y: 0, ease: 'power2.out' }, at);
      } else {
        tl.fromTo(el, { opacity: 0, scale: 0, y: 40 }, { opacity: 1, scale: 1, y: 0, ease: 'back.out(3)' }, at);
      }
    });
  }

  const lead = section.querySelector<HTMLElement>('[data-quiz-lead]');
  if (lead) initMagicText(lead, { start: 'top 85%', end: 'bottom 50%' });
}
