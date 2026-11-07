/**
 * Низ страницы (Finale.astro): высота кадра, движение эллипсов, глубина фото, появление партнёров.
 *
 * Эллипсы не стоят на месте. Каждый движется двумя способами, которые складываются:
 *   от скролла — обёртка едет со своей скоростью (параллакс), в середине экрана стоит как в макете;
 *   сам — круглые плывут по большому кругу (поворот вокруг смещённого центра), вытянутый покачивается.
 * Сама анимация — на картинке, скролл — на обёртке, поэтому они не мешают друг другу.
 *
 * Фото в «Локации» — та же глубина, что в «Что мы придумали?» (sections/intro.ts): фото движется со своей
 * скоростью по data-depth, чуть растёт, приближаясь к камере, и разлетается от центра к краям.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fitFlow, stageHeight } from '../core/stage';
import { refreshSoon } from '../core/refresh';

/** те же настройки глубины, что в intro.ts */
const SPEED = 420;
const DOLLY = 0.05;
const SPREAD = 0.08;

export function initFinale(motion: boolean) {
  const section = document.querySelector<HTMLElement>('[data-finale]');
  if (!section) return;
  // кадр масштабируется transform'ом — высоту блока ставим сами (и пересчитываем, когда открывается FAQ)
  fitFlow(section, refreshSoon);
  if (!motion) return;
  initGlows(section);
  initPhotos(section);
  initPartners(section);
}

function initGlows(section: HTMLElement) {
  const idle: gsap.core.Tween[] = [];

  section.querySelectorAll<HTMLElement>('[data-glow]').forEach((glow) => {
    const img = glow.querySelector('img');
    if (!img) return;
    const speed = Number(glow.dataset.speed) || 0;
    const orbit = Number(glow.dataset.orbit) || 0;
    const sway = Number(glow.dataset.sway) || 0;
    const period = Number(glow.dataset.period) || 0;

    gsap.fromTo(
      glow,
      { y: speed },
      { y: -speed, ease: 'none', scrollTrigger: { trigger: glow, start: 'top bottom', end: 'bottom top', scrub: 1, invalidateOnRefresh: true } },
    );

    if (sway && period) {
      idle.push(gsap.fromTo(img, { rotation: -sway }, { rotation: sway, duration: period / 2, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true }));
    } else if (orbit && period) {
      // центр поворота смещён на orbit px от центра картинки — эллипс идёт по кругу такого радиуса
      const ox = 50 + (orbit / img.width) * 100;
      const oy = 50 - (orbit / img.height) * 100;
      gsap.set(img, { transformOrigin: `${ox}% ${oy}%` });
      idle.push(gsap.to(img, { rotation: 'reverse' in glow.dataset ? -360 : 360, duration: period, ease: 'none', repeat: -1, paused: true }));
    }
  });

  // вне экрана эллипсы не крутятся
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => idle.forEach((tween) => (self.isActive ? tween.play() : tween.pause())),
  });
}

function initPhotos(section: HTMLElement) {
  section.querySelectorAll<HTMLElement>('[data-depth]').forEach((el) => {
    const z = Number(el.dataset.depth) || 1;
    const parent = el.offsetParent as HTMLElement | null;
    // сколько экранов скролла проходит от входа фото в кадр до середины экрана
    const reach = () => (window.innerHeight + el.getBoundingClientRect().height) / (2 * window.innerHeight);
    const distance = () => reach() * SPEED * z * (stageHeight() / 900);
    const scale = () => reach() * DOLLY * z;
    const sideways = () => {
      const center = (parent?.offsetWidth ?? 1440) / 2;
      return (el.offsetLeft + el.offsetWidth / 2 - center) * reach() * (DOLLY + SPREAD) * z;
    };
    gsap.fromTo(
      el,
      { y: () => distance(), x: () => -sideways(), scale: () => 1 - scale() },
      {
        y: () => -distance(),
        x: () => sideways(),
        scale: () => 1 + scale(),
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      },
    );
  });
}

/**
 * Партнёры проявляются одной прозрачностью самих логотипов и подписей: transform на родителях
 * отрезал бы их от фона и сломал смешивание (Partners.astro).
 */
function initPartners(section: HTMLElement) {
  const list = section.querySelector<HTMLElement>('[data-partners]');
  if (!list) return;
  const parts = Array.from(list.querySelectorAll<HTMLElement>('.partner__logo:not(.partner__logo--white), .partner__role'));
  parts.forEach((el) => {
    const opacity = getComputedStyle(el).opacity;
    gsap.fromTo(
      el,
      { opacity: 0 },
      {
        opacity,
        duration: 1.1,
        ease: 'power2.out',
        delay: (Array.from(list.children).indexOf(el.parentElement as HTMLElement) % 4) * 0.08,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      },
    );
  });
}
