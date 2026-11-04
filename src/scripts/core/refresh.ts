import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Пересчитать триггеры один раз после серии изменений высоты блоков (fitFlow, картинки) */
let timer = 0;
export const refreshSoon = () => {
  clearTimeout(timer);
  timer = window.setTimeout(() => ScrollTrigger.refresh(), 120);
};
