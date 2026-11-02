import { gsap } from 'gsap';

/**
 * Горизонтальная лента [data-rail]: нативный скролл (тачпад, свайп),
 * перетаскивание мышью с инерцией, стрелки [data-rail-prev]/[data-rail-next]
 * и прогресс [data-rail-progress] (CSS-переменная --p).
 */
export function initRail() {
  document.querySelectorAll<HTMLElement>('[data-rail]').forEach((rail) => {
    const section = rail.closest('section') ?? document;
    const prev = section.querySelector<HTMLButtonElement>('[data-rail-prev]');
    const next = section.querySelector<HTMLButtonElement>('[data-rail-next]');
    const progress = section.querySelector<HTMLElement>('[data-rail-progress]');
    const gap = 16;
    const step = () => ((rail.querySelector('li')?.getBoundingClientRect().width ?? 280) + gap) * 2;

    prev?.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    next?.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));

    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const visible = rail.clientWidth / rail.scrollWidth;
      const p = max > 0 ? rail.scrollLeft / max : 1;
      progress?.style.setProperty('--p', String(visible + (1 - visible) * p));
      if (prev) prev.disabled = rail.scrollLeft <= 2;
      if (next) next.disabled = rail.scrollLeft >= max - 2;
    };
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

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
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) {
        moved = true;
        rail.classList.add('is-dragging');
      }
      if (!moved) return;
      rail.scrollLeft = startLeft - dx;
      const now = performance.now();
      velocity = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX;
      lastT = now;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      gsap.to(rail, {
        scrollLeft: rail.scrollLeft - velocity * 320, // инерция после отпускания
        duration: 0.9,
        ease: 'power3.out',
        onComplete: () => rail.classList.remove('is-dragging'),
      });
    });
    // не даём клику сработать после перетаскивания
    rail.addEventListener('click', (e) => moved && e.preventDefault(), true);
    rail.addEventListener('dragstart', (e) => e.preventDefault());
  });
}
