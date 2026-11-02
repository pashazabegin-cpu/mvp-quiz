import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Список с закреплённым заголовком.
 * [data-sticky-list]     — секция
 * [data-sticky-item]     — карточки; та, что напротив середины экрана, получает .is-current
 * [data-sticky-counter]  — номер текущей карточки «03 / 06»
 * [data-sticky-progress] — полоса, заполняется по мере прокрутки списка
 */
export function initStickyList() {
  document.querySelectorAll<HTMLElement>('[data-sticky-list]').forEach((root) => {
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-sticky-item]'));
    const list = items[0]?.parentElement;
    if (!list) return;
    const counter = root.querySelector<HTMLElement>('[data-sticky-counter]');
    const progress = root.querySelector<HTMLElement>('[data-sticky-progress]');
    const total = String(items.length).padStart(2, '0');

    const setCurrent = (index: number) => {
      items.forEach((item, i) => item.classList.toggle('is-current', i === index));
      if (counter) counter.textContent = `${String(index + 1).padStart(2, '0')} / ${total}`;
    };

    items.forEach((item, i) => {
      ScrollTrigger.create({
        trigger: item,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => self.isActive && setCurrent(i),
      });
    });

    if (progress) {
      gsap.fromTo(
        progress,
        { scaleX: 0 },
        { scaleX: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 55%', end: 'bottom 55%', scrub: true } },
      );
    }
    setCurrent(0);
  });
}
