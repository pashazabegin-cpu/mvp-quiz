/**
 * Точка входа всех скриптов страницы.
 *
 * Порядок: кадр 1440×900 → прелоадер и интро первого экрана (как на MVP) →
 * закреплённые экраны сверху вниз (их эффекты привязаны к скроллу) → остальные анимации.
 * Анимации прототипных блоков подключаются data-атрибутами (таблица в README.md).
 * Если пользователь включил «уменьшить движение», остаются закреплённые экраны (их ведёт сам скролл)
 * и базовое поведение — без прелоадера, плавного скролла и эффектов под курсор.
 *
 * Мобильная раскладка — облегчённая: родной скролл телефона (без Lenis), никаких эффектов,
 * привязанных к каждому пикселю скролла (параллакс, закрашивание по словам, уход первого экрана),
 * весь текст появляется одним спокойным эффектом (animations/soft-reveal.ts).
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
import { initFinale } from './sections/finale';
import { initLocationMap } from './sections/location';
import { initStoryBg } from './sections/story-bg';
import { initReveals } from './animations/reveal';
import { SOFT_REVEAL_TARGETS, initSoftReveal } from './animations/soft-reveal';
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
import { initSnow } from './effects/snow';
import { initHoloTicket } from './effects/holo-ticket';

gsap.registerPlugin(ScrollTrigger, SplitText);

const motion = !reducedMotion;
/** мобильная раскладка: раскладка за время жизни страницы не меняется (при смене — перезагрузка ниже) */
const mobile = window.matchMedia(MOBILE_QUERY).matches;

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
if (!mobile) run('nav', initNav); // на мобильном нижнего меню нет (Nav.astro)
run('rail', initRail);
run('accordion', () => initAccordion(motion));
run('shader', () => initShaderBackgrounds(motion));

// плавный скролл — только на десктопе: на телефоне родной скролл с инерцией и так плавный,
// а лишний слой между пальцем и страницей даёт рывки
const lenis = motion && !mobile ? run('smooth-scroll', initSmoothScroll) : null;
lenis?.stop(); // скролл открывается, когда уходит прелоадер
// высота страницы меняется при пересчёте триггеров (закрепления, высота низа страницы) — Lenis узнаёт об этом сразу
if (lenis) ScrollTrigger.addEventListener('refresh', () => lenis.resize());
// на мобильном то же самое без Lenis: пока виден прелоадер, страница не прокручивается (global.css)
const root = document.documentElement;
if (motion && mobile) root.classList.add('is-scroll-locked');
const unlockScroll = () => {
  lenis?.start();
  root.classList.remove('is-scroll-locked');
};

// блоки низа страницы (снег, билет) есть только в десктопной раскладке
if (motion && !mobile) {
  run('snow', initSnow);
  run('holo-ticket', initHoloTicket);
}
if (!mobile) run('map', initLocationMap);

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
  if (!mobile) run('finale', () => initFinale(motion));
  if (motion && mobile) {
    run('soft-reveal', () => initSoftReveal(), showText(SOFT_REVEAL_TARGETS));
  } else if (motion) {
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
initHero({ motion, onReady: unlockScroll }).catch((error) => {
  console.error('[hero]', error);
  document.querySelector('[data-preloader]')?.remove();
  showText('[data-anim], [data-anim] *')();
  unlockScroll();
});

document.documentElement.classList.add('motion-ready');
