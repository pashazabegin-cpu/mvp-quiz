/**
 * Первый экран: прелоадер → интро как на MVP → уход при скролле.
 *   прелоадер закрывается наклонными полосами (10 полос, 16.76°)
 *   видео приближается с 1.22 до 1 (2.4 с), тексты появляются (mvp-reveal), шапка опускается сверху
 * Мобильный — без ухода при скролле (видео и тексты уезжают вместе со страницей, без параллакса).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { runPreloader } from '../ui/preloader';
import { MOBILE_QUERY } from '../core/stage';
import { hideSpans, stripsPolygon } from '../animations/strips';
import { prepareLines, resetUI, revealUI } from '../animations/mvp-reveal';

const STRIPS = 10;
const ANGLE = 16.76;

/** Safari и все браузеры на iPhone (у них движок Safari) */
const isWebKit = /AppleWebKit/i.test(navigator.userAgent) && !/(Chrome|Chromium|Android)/i.test(navigator.userAgent);

/**
 * Фоновое видео должно играть само. Атрибутов autoplay/muted/playsinline телефону бывает мало:
 * iOS в режиме энергосбережения (и встроенные браузеры приложений) не запускает <video> без касания
 * и рисует поверх свою кнопку «play». Поэтому:
 *   1. запускаем сами — сразу, когда кадры загрузились, при возвращении на вкладку и на экран;
 *   2. если Safari отказал (play() отклонён или видео так и стоит), подменяем <video> на <img> с тем же MP4:
 *      Safari умеет проигрывать MP4 в картинке как GIF — само, по кругу и без кнопки
 *      (Apple: «Use MP4 Video Instead of Animated GIFs»). Пока ролик-картинка грузится, виден постер;
 *   3. в остальных браузерах при отказе — запуск на первом касании страницы.
 */
function keepPlaying(video: HTMLVideoElement, hero: HTMLElement) {
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.disablePictureInPicture = true;

  let visible = true;
  let swapped = false;

  const toImage = () => {
    if (swapped || !isWebKit) return;
    swapped = true;
    const holder = video.parentElement!;
    // постер под роликом, а само видео с системной кнопкой прячем сразу
    if (video.poster) holder.style.backgroundImage = `url("${video.poster}")`;
    video.style.visibility = 'hidden';
    video.dispatchEvent(new Event('hero-fallback'));
    const img = new Image();
    img.className = 'hero__video-img';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.addEventListener(
      'load',
      () => {
        video.replaceWith(img);
        video.removeAttribute('src');
        video.load(); // освободить загрузку видео
      },
      { once: true },
    );
    img.src = video.currentSrc || video.src;
  };

  const play = () => {
    if (swapped || !visible || !video.paused || document.hidden) return;
    video.play().catch((error: DOMException) => {
      if (error?.name === 'NotAllowedError') toImage();
    });
  };

  const gestures = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'] as const;
  const onGesture = () => {
    play();
    // касание — разрешение на запуск: дальше видео играет само, слушать больше не нужно
    video.addEventListener('playing', () => gestures.forEach((g) => window.removeEventListener(g, onGesture)), { once: true });
  };
  gestures.forEach((g) => window.addEventListener(g, onGesture, { passive: true }));

  video.addEventListener('loadeddata', play);
  video.addEventListener('canplay', play);
  document.addEventListener('visibilitychange', play);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    play();
  }).observe(hero);
  play();
  // встроенные браузеры бывают и без отказа, просто не запускают: если видео так и стоит — тоже подменяем
  window.setTimeout(() => {
    if (video.paused && visible && !document.hidden) toImage();
  }, 2500);
}

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
  const mobile = window.matchMedia(MOBILE_QUERY).matches;
  if (video) keepPlaying(video, hero);

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
  if (!mobile) tl.fromTo(zoom, { scale: 1.22 }, { scale: 1, duration: 2.4 }, 0);
  // на телефоне тот же наезд ведёт браузер (Web Animations) — не дёргается, если сразу начать листать
  else zoom?.animate([{ transform: 'scale(1.22)' }, { transform: 'scale(1)' }], { duration: 2400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
  tl.call(() => void revealUI(ui), [], 0.45);
  tl.from(ui.querySelectorAll('[data-intro]'), { autoAlpha: 0, y: -16, duration: 1.2, stagger: 0.07, clearProps: 'transform,opacity,visibility' }, 0.55);
  tl.call(() => opts.onReady?.(), [], 0.6);

  // на телефоне экран просто уезжает со страницей: эффекты, привязанные к скроллу, там дёргаются
  if (mobile) return;

  // уход при скролле: видео отстаёт, тексты уезжают вверх и гаснут, низ уходит в чёрный следующего экрана
  const scrub = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
  gsap.to(zoom, { yPercent: 14, ease: 'none', scrollTrigger: scrub });
  gsap.to(ui, { yPercent: -10, autoAlpha: 0, ease: 'none', scrollTrigger: { ...scrub, end: 'bottom 25%' } });
  gsap.to(hero.querySelector('[data-hero-fade]'), { opacity: 1, ease: 'none', scrollTrigger: { ...scrub, end: 'bottom 55%' } });
}
