/**
 * «Как всё пройдёт?» — вся программа дня на одном закреплённом экране:
 * заголовок слева стоит, список справа прокручивается, пункты проявляются по мере подъёма.
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

  const fade = () => {
    const vh = window.innerHeight;
    items.forEach((el) => {
      const r = el.getBoundingClientRect();
      const vis = gsap.utils.clamp(0, 1, (vh * 0.98 - r.top) / (vh * 0.3));
      el.style.opacity = String(0.12 + 0.88 * vis);
      el.style.transform = `translateY(${((1 - vis) * 24).toFixed(1)}px)`;
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
      onUpdate: fade,
      onRefresh: fade,
    },
  });
  tl.fromTo(list, { y: 0 }, { y: () => -travel(), duration: 1 }).to({}, { duration: 0.25 });
  fade();
  return tl.scrollTrigger;
}
