import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Аккордеон на нативных <details> внутри [data-accordion] с плавной высотой.
 * data-accordion="single" — открыт только один пункт: открывая новый, закрываем предыдущий.
 * Без анимаций (или без JS) работает как обычный <details>.
 */
export function initAccordion(animate: boolean) {
  if (!animate) return;
  document.querySelectorAll<HTMLElement>('[data-accordion]').forEach((root) => {
    const single = root.dataset.accordion === 'single';
    const items = Array.from(root.querySelectorAll<HTMLDetailsElement>('details'));
    const bodyOf = (item: HTMLDetailsElement) => item.querySelector('summary')?.nextElementSibling as HTMLElement | null;

    const close = (item: HTMLDetailsElement) => {
      const body = bodyOf(item);
      if (!body) return;
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
    };

    items.forEach((item) => {
      const summary = item.querySelector('summary');
      const body = bodyOf(item);
      if (!summary || !body) return;

      summary.addEventListener('click', (e) => {
        e.preventDefault();
        if (item.open) {
          close(item);
        } else {
          if (single) items.filter((other) => other !== item && other.open).forEach(close);
          item.open = true;
          gsap.fromTo(body, { height: 0 }, { height: 'auto', duration: 0.6, ease: 'expo.out', onComplete: () => ScrollTrigger.refresh() });
        }
      });
    });
  });
}
