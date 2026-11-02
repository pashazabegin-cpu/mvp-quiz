import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Кнопка «Разметка»: показывает/прячет слой прототипа и запоминает выбор. */
export function initAnnotations() {
  const button = document.querySelector<HTMLButtonElement>('[data-anno-toggle]');
  if (!button) return;
  const root = document.documentElement;
  const sync = () => button.setAttribute('aria-pressed', String(root.classList.contains('annotations')));

  button.addEventListener('click', () => {
    const on = root.classList.toggle('annotations');
    try {
      localStorage.setItem('quizmas:annotations', on ? '1' : '0');
    } catch {
      /* приватный режим — просто не запоминаем */
    }
    sync();
    ScrollTrigger.refresh();
  });
  sync();
}
