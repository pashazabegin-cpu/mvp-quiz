import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Таймлайн расписания: линия [data-timeline-fill] заполняется по скроллу,
 * пункты [data-tl-item] получают класс .is-active, когда линия до них доходит.
 */
export function initTimeline() {
  document.querySelectorAll<HTMLElement>('[data-timeline]').forEach((timeline) => {
    const fill = timeline.querySelector('[data-timeline-fill]');
    gsap.fromTo(
      fill,
      { scaleY: 0 },
      { scaleY: 1, ease: 'none', scrollTrigger: { trigger: timeline, start: 'top 60%', end: 'bottom 60%', scrub: true } },
    );
    timeline.querySelectorAll<HTMLElement>('[data-tl-item]').forEach((item) => {
      ScrollTrigger.create({ trigger: item, start: 'top 60%', toggleClass: { targets: item, className: 'is-active' } });
    });
  });
}
