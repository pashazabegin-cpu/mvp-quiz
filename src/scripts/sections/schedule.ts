/**
 * «Как всё пройдёт?» — вся программа дня на одном закреплённом экране:
 * заголовок слева стоит, пункты справа едут вверх «гармошкой» (animations/lag-list.ts);
 * в мобильной раскладке заголовок над списком и уезжает вместе с ним.
 * Фон-градиент сдвигается вместе с остальными экранами (story-bg.ts).
 */
import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import { pinLagList } from '../animations/lag-list';

export function initSchedule(): ScrollTrigger | undefined {
  const section = document.querySelector<HTMLElement>('[data-schedule]');
  if (!section) return;
  const head = Array.from(section.querySelectorAll<HTMLElement>('[data-schedule-head]'));
  return pinLagList(section, section.querySelector<HTMLElement>('[data-schedule-list]')!, { head });
}
