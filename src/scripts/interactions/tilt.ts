import { gsap } from 'gsap';

/**
 * 3D-наклон карточки за курсором: [data-tilt] или [data-tilt="5"] (макс. угол в градусах, по умолчанию 8).
 */
export function initTilt() {
  gsap.utils.toArray<HTMLElement>('[data-tilt]').forEach((el) => {
    const max = parseFloat(el.dataset.tilt ?? '') || 8;
    gsap.set(el, { transformPerspective: 1000 });
    const rotateX = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
    const rotateY = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      rotateY(px * max * 2);
      rotateX(-py * max * 2);
    });
    el.addEventListener('pointerleave', () => {
      rotateX(0);
      rotateY(0);
    });
  });
}
