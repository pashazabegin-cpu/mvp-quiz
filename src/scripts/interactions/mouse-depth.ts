import { gsap } from 'gsap';

/**
 * Параллакс от курсора: слои [data-depth="1.5"] смещаются за мышью.
 * Чем больше число, тем сильнее (слой «ближе» к зрителю).
 */
export function initMouseDepth() {
  const layers = gsap.utils.toArray<HTMLElement>('[data-depth]').map((el) => ({
    depth: parseFloat(el.dataset.depth ?? '') || 1,
    x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3' }),
    y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3' }),
  }));
  if (!layers.length) return;

  window.addEventListener(
    'pointermove',
    (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      layers.forEach((l) => {
        l.x(nx * l.depth * 40);
        l.y(ny * l.depth * 40);
      });
    },
    { passive: true },
  );
}
