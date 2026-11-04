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
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // для отладки в dev: window.lenis.scrollTo(y, { immediate: true })
  if (import.meta.env.DEV) (window as unknown as { lenis: Lenis }).lenis = lenis;
  instance = lenis;
  return lenis;
}

/** Плавно прокрутить страницу к y (px): через Lenis, если он запущен, иначе — силами браузера */
export function scrollToY(y: number, duration = 1.2) {
  if (instance) instance.scrollTo(y, { duration });
  else window.scrollTo({ top: y, behavior: reducedMotion ? 'auto' : 'smooth' });
}
