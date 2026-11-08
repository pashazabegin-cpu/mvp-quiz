/**
 * Мобильное меню (ui/MobileMenu.astro): кнопка «Меню» на первом экране открывает его, «Закрыть», Esc или пункт — закрывают.
 * Пока меню открыто, страница под ним не прокручивается (.is-menu-open в global.css).
 * Пункт — обычная ссылка на блок: меню закрывается в момент нажатия, и браузер сам переходит к блоку.
 */
export function initMobileMenu() {
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const opener = document.querySelector<HTMLElement>('[data-menu-open]');
  if (!menu || !opener) return;
  const root = document.documentElement;
  const close = menu.querySelector<HTMLElement>('[data-menu-close]');
  menu.hidden = false;

  /** refocus — вернуть фокус на «Меню» (не нужно, когда уходим по ссылке к блоку) */
  const setOpen = (open: boolean, refocus = true) => {
    root.classList.toggle('is-menu-open', open);
    opener.setAttribute('aria-expanded', String(open));
    if (open) close?.focus({ preventScroll: true });
    else if (refocus && menu.contains(document.activeElement)) opener.focus({ preventScroll: true });
  };

  opener.addEventListener('click', () => setOpen(true));
  close?.addEventListener('click', () => setOpen(false));
  menu.querySelectorAll('[data-menu-link]').forEach((link) => link.addEventListener('click', () => setOpen(false, false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('is-menu-open')) setOpen(false);
  });
}
