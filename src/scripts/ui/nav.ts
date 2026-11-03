import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Плавающее меню: подсвечивает раздел, который сейчас на экране,
 * «бегунок» переезжает между пунктами и следует за наведением.
 */
export function initNav() {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!nav) return;
  const wrap = nav.querySelector<HTMLElement>('[data-nav-links]')!;
  const indicator = nav.querySelector<HTMLElement>('[data-nav-indicator]')!;
  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'));
  let active: HTMLAnchorElement | null = null;

  const place = (link: HTMLAnchorElement | null) => {
    if (!link) {
      gsap.to(indicator, { autoAlpha: 0, duration: 0.3 });
      return;
    }
    gsap.to(indicator, { x: link.offsetLeft, width: link.offsetWidth, autoAlpha: 1, duration: 0.6, ease: 'expo.out' });
  };

  const setActive = (link: HTMLAnchorElement | null) => {
    if (link === active) return;
    active = link;
    links.forEach((a) => a.classList.toggle('is-active', a === link));
    place(link);
    // на узком экране докручиваем ленту меню к активному пункту
    if (link && wrap.scrollWidth > wrap.clientWidth) {
      wrap.scrollTo({ left: link.offsetLeft - wrap.clientWidth / 2 + link.offsetWidth / 2, behavior: 'smooth' });
    }
  };

  links.forEach((link) => {
    const section = document.getElementById(link.dataset.navLink ?? '');
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => {
        if (self.isActive) setActive(link);
        else if (active === link) setActive(null);
      },
    });
    link.addEventListener('pointerenter', () => place(link));
  });
  wrap.addEventListener('pointerleave', () => place(active));

  // над белыми участками (data-nav-light) — тёмный текст на светлом стекле. Проверка по положению на экране,
  // а не по триггерам: так верно и для закреплённых экранов (их триггер не знает про собственное закрепление)
  const zones = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-light]'));
  if (zones.length) {
    const check = () => {
      const y = window.innerHeight - 50; // середина меню над низом экрана
      const light = zones.some((zone) => {
        const r = zone.getBoundingClientRect();
        return r.top <= y && r.bottom >= y;
      });
      nav.classList.toggle('nav--light', light);
    };
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    check();
  }
}
