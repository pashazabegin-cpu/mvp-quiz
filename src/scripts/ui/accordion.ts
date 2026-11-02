import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Аккордеон на нативных <details> внутри [data-accordion] с плавной высотой.
 * Без анимаций (или без JS) работает как обычный <details>.
 */
export function initAccordion(animate: boolean) {
  if (!animate) return;
  document.querySelectorAll<HTMLElement>('[data-accordion]').forEach((root) => {
    root.querySelectorAll<HTMLDetailsElement>('details').forEach((item) => {
      const summary = item.querySelector('summary');
      const body = summary?.nextElementSibling as HTMLElement | null;
      if (!summary || !body) return;

      summary.addEventListener('click', (e) => {
        e.preventDefault();
        if (item.open) {
          item.classList.add('is-closing');
          gsap.to(body, {
            height: 0,
            duration: 0.45,
            ease: 'expo.inOut',
            onComplete: () => {
              item.open = false;
              item.classList.remove('is-closing');
              gsap.set(body, { clearProps: 'height' });
              ScrollTrigger.refresh();
            },
          });
        } else {
          item.open = true;
          gsap.fromTo(body, { height: 0 }, { height: 'auto', duration: 0.6, ease: 'expo.out', onComplete: () => ScrollTrigger.refresh() });
        }
      });
    });
  });
}
