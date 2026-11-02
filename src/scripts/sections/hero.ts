/**
 * Первый экран: прелоадер → интро как на MVP → уход при скролле.
 *   прелоадер закрывается наклонными полосами (10 полос, 16.76°)
 *   видео приближается с 1.22 до 1 (2.4 с), тексты появляются (mvp-reveal), шапка опускается сверху
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { runPreloader } from '../ui/preloader';
import { hideSpans, stripsPolygon } from '../animations/strips';
import { prepareLines, resetUI, revealUI } from '../animations/mvp-reveal';

const STRIPS = 10;
const ANGLE = 16.76;

export async function initHero(opts: { motion: boolean; onReady?: () => void }) {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const preloader = document.querySelector<HTMLElement>('[data-preloader]');
  if (!hero) {
    preloader?.remove();
    opts.onReady?.();
    return;
  }
  const video = hero.querySelector<HTMLVideoElement>('[data-hero-video]');
  const zoom = hero.querySelector<HTMLElement>('[data-hero-zoom]');
  const ui = hero.querySelector<HTMLElement>('[data-hero-ui]')!;

  // меню появляется, когда обложка уезжает
  ScrollTrigger.create({
    trigger: hero,
    start: 'bottom 75%',
    onEnter: () => document.documentElement.classList.add('is-past-hero'),
    onLeaveBack: () => document.documentElement.classList.remove('is-past-hero'),
  });

  if (!opts.motion) {
    preloader?.remove();
    opts.onReady?.();
    return;
  }

  const removePreloader = await runPreloader(preloader, video);
  prepareLines(ui);
  resetUI(ui);
  document.documentElement.classList.add('is-loaded');

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (preloader) {
    const strips = Array.from({ length: STRIPS }, () => ({ p: 0 }));
    const render = () => {
      preloader.style.clipPath = stripsPolygon(window.innerWidth, window.innerHeight, hideSpans(strips.map((s) => s.p)), ANGLE);
    };
    tl.to(strips, { p: 1, duration: 0.8, ease: 'power3.inOut', stagger: 0.05, onUpdate: render, onComplete: removePreloader }, 0);
  }
  tl.fromTo(zoom, { scale: 1.22 }, { scale: 1, duration: 2.4 }, 0);
  tl.call(() => void revealUI(ui), [], 0.45);
  tl.from(ui.querySelectorAll('[data-intro]'), { autoAlpha: 0, y: -16, duration: 1.2, stagger: 0.07, clearProps: 'transform,opacity,visibility' }, 0.55);
  tl.call(() => opts.onReady?.(), [], 0.6);

  // уход при скролле: видео отстаёт, тексты уезжают вверх и гаснут, низ уходит в чёрный следующего экрана
  const scrub = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
  gsap.to(zoom, { yPercent: 14, ease: 'none', scrollTrigger: scrub });
  gsap.to(ui, { yPercent: -10, autoAlpha: 0, ease: 'none', scrollTrigger: { ...scrub, end: 'bottom 25%' } });
  gsap.to(hero.querySelector('[data-hero-fade]'), { opacity: 1, ease: 'none', scrollTrigger: { ...scrub, end: 'bottom 55%' } });
}
