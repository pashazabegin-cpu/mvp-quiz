/**
 * «Как всё пройдёт?» — вся программа дня на одном закреплённом экране:
 * заголовок слева стоит, пункты справа едут вверх «гармошкой» (каждый с отставанием от предыдущего)
 * и проявляются по мере подъёма.
 * Фон-градиент сдвигается вместе с остальными экранами (story-bg.ts).
 */
import { gsap } from 'gsap';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import { stageScale } from '../core/stage';

export function initSchedule(): ScrollTrigger | undefined {
  const section = document.querySelector<HTMLElement>('[data-schedule]');
  if (!section) return;
  const list = section.querySelector<HTMLElement>('[data-schedule-list]')!;
  const items = Array.from(list.children) as HTMLElement[];

  // сколько списку уехать (px макета), чтобы его низ встал на 140 px выше низа экрана
  const travel = () => {
    const uiH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-h')) || 900;
    return Math.max(0, list.offsetTop + list.offsetHeight - (uiH - 140));
  };

  // «Гармошка»: скролл двигает не список целиком, а каждый пункт — и каждый следующий догоняет
  // чуть медленнее предыдущего, так что при прокрутке пункты расходятся, на остановке собираются
  const scroll = { y: 0 };
  const movers = items.map((el, i) => gsap.quickTo(el, 'y', { duration: 1 + i * 0.4, ease: 'power3.out' }));

  /** нижняя полоса экрана (px макета), в которой пункты проявляются (сама прозрачность — маской в Schedule.astro) */
  const EDGE = 300;
  const edge = (top: number) => gsap.utils.clamp(0, 1, (window.innerHeight - top) / (EDGE * stageScale()));

  // скролл задаёт цель; лёгкий доезд снизу — по положению без отставания, чтобы не было обратной связи
  const update = () => {
    const s = stageScale();
    items.forEach((el, i) => {
      const top = el.getBoundingClientRect().top + (scroll.y - Number(gsap.getProperty(el, 'y'))) * s;
      movers[i](scroll.y + (1 - edge(top)) * 40);
    });
  };


  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${travel() * stageScale() + window.innerHeight * 0.35}`,
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: update,
      onRefresh: update,
    },
  });
  tl.fromTo(scroll, { y: 0 }, { y: () => -travel(), duration: 1 }).to({}, { duration: 0.25 });
  update();
  return tl.scrollTrigger;
}
