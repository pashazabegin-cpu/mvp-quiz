import { ScrollTrigger } from 'gsap/ScrollTrigger';

const DIGITS = '0123456789';
const LETTERS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ';

const randomFrom = (set: string) => set[Math.floor(Math.random() * set.length)];

/** «Табло»: символы перебираются и встают на место слева направо. Разделители не трогаем. */
export function scramble(el: HTMLElement, duration = 900) {
  const final = el.dataset.text ?? el.textContent ?? '';
  el.dataset.text = final;
  el.setAttribute('aria-label', final);
  const start = performance.now();

  const frame = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    const settled = Math.floor(progress * final.length);
    el.textContent = [...final]
      .map((ch, i) => {
        if (i < settled) return ch;
        if (/\d/.test(ch)) return randomFrom(DIGITS);
        if (/[а-яё]/i.test(ch)) {
          const r = randomFrom(LETTERS);
          return ch === ch.toLowerCase() ? r.toLowerCase() : r;
        }
        return ch;
      })
      .join('');
    if (progress < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** [data-scramble] — эффект табло при появлении элемента на экране */
export function initScramble() {
  document.querySelectorAll<HTMLElement>('[data-scramble]').forEach((el) => {
    const delay = el.closest('[data-hero]') ? 700 : 150; // на первом экране ждём интро
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => setTimeout(() => scramble(el), delay),
    });
  });
}
