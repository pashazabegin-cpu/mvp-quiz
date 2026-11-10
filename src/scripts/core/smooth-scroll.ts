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
  // ScrollTrigger обновляется сразу в том же кадре, что и скролл: параллакс и закрепления не отстают от страницы
  lenis.on('scroll', ScrollTrigger.update);
  // свой цикл кадров, а не тикер GSAP: время берём из requestAnimationFrame (см. frameClock)
  const clock = frameClock();
  const loop = (frameTime: number) => {
    lenis.raf(clock(frameTime));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  gsap.ticker.lagSmoothing(0);
  // для отладки в dev: window.lenis.scrollTo(y, { immediate: true })
  if (import.meta.env.DEV) (window as unknown as { lenis: Lenis }).lenis = lenis;
  instance = lenis;
  return lenis;
}

/**
 * Время для Lenis ровными шагами кадра экрана. Шаг скролла пропорционален времени, поэтому любая дрожь времени —
 * это рывок страницы, а сильнее всего — параллакса, который едет быстрее неё.
 *
 * Источник — метка кадра из requestAnimationFrame: у всех обработчиков одного кадра она одна и привязана к частоте
 * экрана, даже если скрипт кадра запустился с опозданием. Тикер GSAP для этого не годится: он отдаёт момент, когда
 * код реально начал выполняться. Кадр, начатый на 9+ мс позже, засчитывался за два шага — страница и фото
 * прыгали вперёд на целый кадр (шаг 15 → 27 → 12 px), это и были рывки в «Локации».
 *
 * Шаг кадра — медиана последних промежутков (подстраивается под 60 и 120 Гц), мелкая дрожь меток (±1 мс)
 * округляется, по-настоящему пропущенный кадр засчитывается целым числом шагов.
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
