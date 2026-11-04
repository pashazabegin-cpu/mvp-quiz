/**
 * Точка входа всех скриптов страницы.
 *
 * Порядок: кадр 1440×900 → прелоадер и интро первого экрана (как на MVP) →
 * закреплённые экраны сверху вниз (их эффекты привязаны к скроллу) → остальные анимации.
 * Анимации прототипных блоков подключаются data-атрибутами (таблица в README.md).
 * Если пользователь включил «уменьшить движение», остаются закреплённые экраны (их ведёт сам скролл)
 * и базовое поведение — без прелоадера, плавного скролла и эффектов под курсор.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import { finePointer, reducedMotion } from './core/env';
import { MOBILE_QUERY, initStage } from './core/stage';
import { initSmoothScroll } from './core/smooth-scroll';
import { initHero } from './sections/hero';
import { initIntro } from './sections/intro';
import { initProgram } from './sections/program';
import { initSchedule } from './sections/schedule';
import { initLogoSpin } from './sections/logo-spin';
import { initTalks } from './sections/talks';
import { initQuiz } from './sections/quiz';
import { initStoryBg } from './sections/story-bg';
import { initReveals } from './animations/reveal';
import { initTextReveal } from './animations/text-reveal';
import { initParallax } from './animations/parallax';
import { initTimeline } from './animations/timeline';
import { initStickyList } from './animations/sticky-list';
import { initScramble } from './animations/scramble';
import { initTilt } from './interactions/tilt';
import { initSpotlight } from './interactions/spotlight';
import { initMagnetic } from './interactions/magnetic';
import { initRepel } from './interactions/repel';
import { initMouseDepth } from './interactions/mouse-depth';
import { initNav } from './ui/nav';
import { initRail } from './ui/rail';
import { initAccordion } from './ui/accordion';
import { initAnnotations } from './ui/annotations';
import { initShaderBackgrounds } from './effects/shader-background';
import { initLiquidGlass } from './effects/liquid-glass';
import { initSnow } from './effects/snow';

gsap.registerPlugin(ScrollTrigger, SplitText);

const motion = !reducedMotion;

// экраны закреплены и ведутся скроллом — после перезагрузки всегда начинаем с обложки
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

initStage();

// мобильная и десктопная раскладки устроены по-разному (закрепления, эффекты) —
// при переходе через границу (поворот планшета, сужение окна) просто перезапускаем страницу
window.matchMedia(MOBILE_QUERY).addEventListener('change', () => location.reload());
// на телефоне панель браузера прячется и появляется при скролле — триггеры от этого не пересчитываем
ScrollTrigger.config({ ignoreMobileResize: true });

/**
 * Запуск модуля: если он упадёт (баг, особенность браузера), остальные всё равно стартуют,
 * а ошибка видна в консоли с именем модуля. fallback — что сделать вместо него (например, показать текст).
 */
function run<T>(name: string, init: () => T, fallback?: () => void): T | undefined {
  try {
    return init();
  } catch (error) {
    console.error(`[${name}]`, error);
    fallback?.();
    return undefined;
  }
}
/** если модуль появления не запустился, текст не должен остаться скрытым (.js-motion в global.css) */
const showText = (selector: string) => () => gsap.set(selector, { visibility: 'visible', opacity: 1 });

// Базовое поведение — работает всегда
run('annotations', initAnnotations);
run('nav', initNav);
run('rail', initRail);
run('accordion', () => initAccordion(motion));
run('shader', () => initShaderBackgrounds(motion));
run('glass', initLiquidGlass);

const lenis = motion ? run('smooth-scroll', initSmoothScroll) : null;
lenis?.stop(); // скролл открывается, когда уходит прелоадер

if (motion) run('snow', initSnow);

// Эффекты под курсор — только для мыши/тачпада
if (motion && finePointer) {
  run('tilt', initTilt);
  run('spotlight', initSpotlight);
  run('magnetic', initMagnetic);
  run('repel', initRepel);
  run('mouse-depth', initMouseDepth);
}

// Текст режем на строки и слова только после загрузки шрифтов, иначе переносы посчитаются неверно
const fontsReady = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
fontsReady.then(() => {
  // закреплённые экраны — строго сверху вниз
  const pins = [run('intro', initIntro), run('program', () => initProgram(motion)), run('schedule', initSchedule)];
  run('story-bg', () => initStoryBg(pins));
  run('logo-spin', initLogoSpin);
  run('talks', initTalks);
  run('quiz', () => initQuiz(motion));
  if (motion) {
    run('reveals', initReveals, showText('[data-split], [data-reveal], [data-stagger] > *'));
    run('text-reveal', initTextReveal, showText('[data-lines], [data-rise]'));
    run('parallax', initParallax);
    run('timeline', initTimeline);
    run('sticky-list', initStickyList);
    run('scramble', initScramble);
  }
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
});

// первый экран: если интро сломается, прелоадер уходит и скролл открывается — страница не «зависает»
initHero({ motion, onReady: () => lenis?.start() }).catch((error) => {
  console.error('[hero]', error);
  document.querySelector('[data-preloader]')?.remove();
  showText('[data-anim], [data-anim] *')();
  lenis?.start();
});

document.documentElement.classList.add('motion-ready');
