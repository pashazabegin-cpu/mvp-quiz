import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './env';

let instance: Lenis | null = null;

/**
 * Плавный инерционный скролл (Lenis), синхронизированный со ScrollTrigger.
 * anchors: true — ссылки вида href="#quiz" тоже скроллят плавно.
 */
export function initSmoothScroll() {
  const lenis = new Lenis({ lerp: 0.1, anchors: true, allowNestedScroll: true });
  lenis.on('scroll', ScrollTrigger.update);
  const clock = frameClock();
  gsap.ticker.add((time) => lenis.raf(clock(time * 1000)));
  gsap.ticker.lagSmoothing(0);
  // для отладки в dev: window.lenis.scrollTo(y, { immediate: true })
  if (import.meta.env.DEV) (window as unknown as { lenis: Lenis }).lenis = lenis;
  instance = lenis;
  return lenis;
}

/**
 * Время для Lenis ровными шагами кадра экрана. Тикер отдаёт момент, когда кадр начал считаться, а не когда он
 * покажется, — с дрожью в 1–2 мс. Шаг скролла пропорционален времени и скакал вместе с ней (26, 30, 27 px за кадр),
 * хотя экран показывает кадры строго через равные промежутки — страница и особенно параллакс подёргивались.
 * Шаг кадра — медиана последних промежутков (подстраивается под 60 и 120 Гц), пропущенный кадр — целое число шагов.
 */
function frameClock() {
  const recent: number[] = [];
  let last = 0;
  let clock = 0;
  return (now: number) => {
    if (!last) {
      last = clock = now;
      return clock;
    }
    const dt = now - last;
    last = now;
    recent.push(dt);
    if (recent.length > 15) recent.shift();
    const period = [...recent].sort((a, b) => a - b)[recent.length >> 1];
    clock += period > 0 ? Math.max(1, Math.round(dt / period)) * period : dt;
    return clock;
  };
}

/** Плавно прокрутить страницу к y (px): через Lenis, если он запущен, иначе — силами браузера */
export function scrollToY(y: number, duration = 1.2) {
  if (instance) instance.scrollTo(y, { duration });
  else window.scrollTo({ top: y, behavior: reducedMotion ? 'auto' : 'smooth' });
}
