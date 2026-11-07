import { gsap } from 'gsap';
import { reducedMotion } from '../core/env';
import { stageScale } from '../core/stage';

/**
 * Горизонтальная лента [data-rail]: нативный скролл с прилипанием к карточкам (тачпад, свайп),
 * стрелки [data-rail-prev]/[data-rail-next] — на одну карточку, перетаскивание мышью с докатом до карточки.
 * Лента лежит в масштабируемом кадре: scrollLeft и offsetLeft — в px макета, координаты мыши — экранные
 * (поэтому при перетаскивании делим на масштаб).
 * Секции ставит классы is-scrolled / is-end — по ним показываются фейды по краям.
 */
export function initRail() {
  document.querySelectorAll<HTMLElement>('[data-rail]').forEach((rail) => {
    const section = rail.closest('section');
    const prev = section?.querySelector<HTMLButtonElement>('[data-rail-prev]');
    const next = section?.querySelector<HTMLButtonElement>('[data-rail-next]');
    const items = rail.querySelectorAll<HTMLElement>('li');
    const step = () => (items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : rail.clientWidth);
    const maxScroll = () => rail.scrollWidth - rail.clientWidth;

    const update = () => {
      const max = maxScroll();
      if (prev) prev.disabled = rail.scrollLeft <= 2;
      if (next) next.disabled = rail.scrollLeft >= max - 2;
      section?.classList.toggle('is-scrolled', rail.scrollLeft > 2);
      section?.classList.toggle('is-end', rail.scrollLeft >= max - 2);
    };
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    /** плавно доехать до карточки; прилипание браузера на это время выключено, иначе оно дёргает анимацию */
    const moveTo = (left: number, duration = 0.9) => {
      gsap.killTweensOf(rail);
      rail.classList.add('is-moving');
      gsap.to(rail, {
        scrollLeft: gsap.utils.clamp(0, maxScroll(), left),
        duration: reducedMotion ? 0 : duration,
        ease: 'power3.out',
        onUpdate: update,
        onComplete: () => rail.classList.remove('is-moving', 'is-dragging'),
      });
    };
    const page = (dir: 1 | -1) => moveTo((Math.round(rail.scrollLeft / step()) + dir) * step());
    prev?.addEventListener('click', () => page(-1));
    next?.addEventListener('click', () => page(1));

    // Перетаскивание мышью (на тач-устройствах работает нативный свайп)
    let down = false;
    let moved = false;
    let startX = 0;
    let startLeft = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;

    rail.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true;
      moved = false;
      startX = lastX = e.clientX;
      startLeft = rail.scrollLeft;
      lastT = performance.now();
      velocity = 0;
      gsap.killTweensOf(rail);
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = (e.clientX - startX) / stageScale();
      if (!moved && Math.abs(dx) > 4) {
        moved = true;
        rail.classList.add('is-moving', 'is-dragging');
      }
      if (!moved) return;
      rail.scrollLeft = startLeft - dx;
      const now = performance.now();
      velocity = (e.clientX - lastX) / stageScale() / Math.max(1, now - lastT);
      lastX = e.clientX;
      lastT = now;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      // инерция после отпускания: докатываемся до ближайшей карточки — лента всегда стоит по сетке
      moveTo(Math.round((rail.scrollLeft - velocity * 320) / step()) * step(), 0.8);
    });
    // не даём клику сработать после перетаскивания
    rail.addEventListener('click', (e) => moved && e.preventDefault(), true);
    rail.addEventListener('dragstart', (e) => e.preventDefault());
  });
}
