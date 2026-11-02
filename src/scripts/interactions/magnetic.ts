import { gsap } from 'gsap';

/**
 * «Магнитная» кнопка тянется за курсором: [data-magnetic] или [data-magnetic="0.5"] (сила, по умолчанию 0.3).
 */
export function initMagnetic() {
  gsap.utils.toArray<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = parseFloat(el.dataset.magnetic ?? '') || 0.3;
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * strength);
      y((e.clientY - r.top - r.height / 2) * strength);
    });
    el.addEventListener('pointerleave', () => {
      x(0);
      y(0);
    });
  });
}
