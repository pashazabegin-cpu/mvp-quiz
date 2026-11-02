import { gsap } from 'gsap';

/**
 * Параллакс от скролла: [data-parallax="0.3"].
 * Число — скорость: 0.3 едет медленнее страницы, отрицательное — навстречу.
 */
export function initParallax() {
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    const speed = parseFloat(el.dataset.parallax ?? '') || 0.2;
    const distance = () => speed * window.innerHeight * 0.5;
    gsap.fromTo(
      el,
      { y: () => -distance() },
      {
        y: () => distance(),
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      },
    );
  });
}
