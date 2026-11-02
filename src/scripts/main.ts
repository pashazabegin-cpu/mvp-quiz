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
import { initStage } from './core/stage';
import { initSmoothScroll } from './core/smooth-scroll';
import { initHero } from './sections/hero';
import { initIntro } from './sections/intro';
import { initProgram } from './sections/program';
import { initSchedule } from './sections/schedule';
import { initStoryBg } from './sections/story-bg';
import { initReveals } from './animations/reveal';
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

// Базовое поведение — работает всегда
initAnnotations();
initNav();
initRail();
initAccordion(motion);
initShaderBackgrounds(motion);
initLiquidGlass();

const lenis = motion ? initSmoothScroll() : null;
lenis?.stop(); // скролл открывается, когда уходит прелоадер

if (motion) initSnow();

// Эффекты под курсор — только для мыши/тачпада
if (motion && finePointer) {
  initTilt();
  initSpotlight();
  initMagnetic();
  initRepel();
  initMouseDepth();
}

// Текст режем на строки и слова только после загрузки шрифтов, иначе переносы посчитаются неверно
const fontsReady = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
fontsReady.then(() => {
  // закреплённые экраны — строго сверху вниз
  const pins = [initIntro(), initProgram(motion), initSchedule()];
  initStoryBg(pins);
  if (motion) {
    initReveals();
    initParallax();
    initTimeline();
    initStickyList();
    initScramble();
  }
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
});

initHero({ motion, onReady: () => lenis?.start() });

document.documentElement.classList.add('motion-ready');
