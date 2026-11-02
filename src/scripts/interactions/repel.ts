import { gsap } from 'gsap';

/**
 * Дочерние элементы [data-repel] разбегаются от курсора и возвращаются на место.
 * [data-repel="200"] — радиус реакции в px (по умолчанию 160).
 */
export function initRepel() {
  gsap.utils.toArray<HTMLElement>('[data-repel]').forEach((group) => {
    const radius = parseFloat(group.dataset.repel ?? '') || 160;
    const force = 42;
    const area = group.parentElement ?? group; // реагируем чуть раньше, чем курсор коснётся чипа
    const items = Array.from(group.children as HTMLCollectionOf<HTMLElement>).map((el) => ({
      el,
      x: gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3' }),
      y: gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3' }),
    }));

    area.addEventListener('pointermove', (e) => {
      items.forEach(({ el, x, y }) => {
        const r = el.getBoundingClientRect();
        // центр элемента в его исходной позиции (без текущего смещения)
        const cx = r.left + r.width / 2 - Number(gsap.getProperty(el, 'x'));
        const cy = r.top + r.height / 2 - Number(gsap.getProperty(el, 'y'));
        const dx = cx - e.clientX;
        const dy = cy - e.clientY;
        const dist = Math.hypot(dx, dy) || 1;
        const push = dist < radius ? (1 - dist / radius) * force : 0;
        x((dx / dist) * push);
        y((dy / dist) * push);
      });
    });
    area.addEventListener('pointerleave', () => {
      items.forEach(({ x, y }) => {
        x(0);
        y(0);
      });
    });
  });
}
