/**
 * Программа MVP Talks — белый закреплённый экран: заголовок и сессии едут вверх «гармошкой»
 * (animations/lag-list.ts). В конце последняя сессия встаёт над нижней полосой проявления.
 */
import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import { pinLagList } from '../animations/lag-list';

export function initTalks(): ScrollTrigger | undefined {
  const section = document.querySelector<HTMLElement>('[data-talks]');
  if (!section) return;
  return pinLagList(section, section.querySelector<HTMLElement>('[data-talks-list]')!, { bottom: 240 });
}
