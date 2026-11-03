/**
 * «Гармошка» на закреплённом экране: список едет вверх вместе со скроллом, но не целиком — каждый пункт
 * догоняет чуть медленнее предыдущего, так что при прокрутке пункты расходятся, на остановке собираются.
 * Входя в нижнюю полосу экрана, пункт слегка доезжает вверх (саму прозрачность там даёт маска в CSS).
 * Используют «Как всё пройдёт?» (schedule.ts) и «Программа MVP Talks» (talks.ts).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { stageScale } from '../core/stage';

type Options = {
  /** где встаёт низ списка в конце (px макета от низа экрана) */
  bottom?: number;
  /** сколько экран ещё стоит после того, как список доехал (доля высоты экрана) */
  hold?: number;
};

/** нижняя полоса экрана (px макета), в которой пункты доезжают вверх */
const EDGE = 300;
const RISE = 40;

export function pinLagList(section: HTMLElement, list: HTMLElement, { bottom = 140, hold = 0.35 }: Options = {}) {
  const items = Array.from(list.children) as HTMLElement[];

  // сколько списку уехать (px макета), чтобы его низ встал на `bottom` выше низа экрана
  let travel = 0;
  const measure = () => {
    const uiH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-h')) || 900;
    travel = Math.max(0, list.offsetTop + list.offsetHeight - (uiH - bottom));
    return travel;
  };

  let y = 0; // сдвиг списка по скроллу, px макета
  const movers = items.map((el, i) => gsap.quickTo(el, 'y', { duration: 1 + i * 0.4, ease: 'power3.out' }));
  const edge = (top: number) => gsap.utils.clamp(0, 1, (window.innerHeight - top) / (EDGE * stageScale()));

  // скролл задаёт цель; доезд снизу — по положению без отставания, чтобы не было обратной связи
  const update = (self: ScrollTrigger) => {
    const s = stageScale();
    y = -gsap.utils.clamp(0, travel, (self.scroll() - self.start) / s);
    items.forEach((el, i) => {
      const top = el.getBoundingClientRect().top + (y - Number(gsap.getProperty(el, 'y'))) * s;
      movers[i](y + (1 - edge(top)) * RISE);
    });
  };

  return ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${measure() * stageScale() + window.innerHeight * hold}`,
    pin: true,
    invalidateOnRefresh: true,
    onUpdate: update,
    onRefresh: update,
  });
}
