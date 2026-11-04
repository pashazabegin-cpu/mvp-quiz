/**
 * «Как всё пройдёт?» — на десктопе вся программа дня на одном закреплённом экране:
 * заголовок слева стоит, пункты справа едут вверх «гармошкой» (animations/lag-list.ts).
 * На мобильном — без закрепления, обычным потоком (высота блока — fitFlow).
 * Фон-градиент сдвигается вместе с остальными экранами (story-bg.ts) — для него возвращаем триггер блока.
 */
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { pinLagList } from '../animations/lag-list';
import { MOBILE_QUERY, fitFlow } from '../core/stage';
import { refreshSoon } from '../core/refresh';

export function initSchedule(): ScrollTrigger | undefined {
  const section = document.querySelector<HTMLElement>('[data-schedule]');
  if (!section) return;
  if (window.matchMedia(MOBILE_QUERY).matches) {
    fitFlow(section, refreshSoon);
    return ScrollTrigger.create({ trigger: section, start: 'top top', end: 'bottom top' });
  }
  return pinLagList(section, section.querySelector<HTMLElement>('[data-schedule-list]')!);
}
