import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
  return lenis;
}
