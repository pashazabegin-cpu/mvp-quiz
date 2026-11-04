/**
 * Программа MVP Talks — на десктопе белый закреплённый экран: заголовок и сессии едут вверх «гармошкой»
 * (animations/lag-list.ts), в конце последняя сессия встаёт над нижней полосой проявления.
 * На мобильном — обычный поток без закрепления (высота блока — fitFlow).
 */
import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import { pinLagList } from '../animations/lag-list';
import { MOBILE_QUERY, fitFlow } from '../core/stage';
import { refreshSoon } from '../core/refresh';

export function initTalks(): ScrollTrigger | undefined {
  const section = document.querySelector<HTMLElement>('[data-talks]');
  if (!section) return;
  if (window.matchMedia(MOBILE_QUERY).matches) {
    fitFlow(section, refreshSoon);
    return;
  }
  return pinLagList(section, section.querySelector<HTMLElement>('[data-talks-list]')!, { bottom: 240 });
}
