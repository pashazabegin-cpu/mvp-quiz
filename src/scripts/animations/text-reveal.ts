/**
 * Появление обычного текста и плашек — эффект из описания «Программы» (как тексты на MVP):
 * строки по очереди поднимаются из-под маски. Один модуль на весь лендинг, все настройки — в TEXT_REVEAL.
 *
 * [data-lines] — абзац или подзаголовок: режется на строки (SplitText, пересобирается при ресайзе),
 *                строки поднимаются лесенкой
 * [data-rise]  — плашка целиком (время, теги): поднимается из-под маски на свою высоту
 *
 * Срабатывает по реальному появлению на экране (IntersectionObserver), а не по позиции скролла, —
 * поэтому работает и в «гармошке» на закреплённых экранах, где пункты двигает скрипт.
 * Что появилось одновременно, идёт сверху вниз с шагом itemStagger. Один раз.
 * При «уменьшить движение» модуль не запускается и текст виден сразу (скрыт только под .js-motion).
 *
 * Другие эффекты текста: заголовки с плашкой — [data-split] в reveal.ts, первый экран — mvp-reveal.ts,
 * описания «Программы» — program.ts; длительность и кривая строк у них тоже отсюда.
 */
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { MOBILE_QUERY } from '../core/stage';

export const TEXT_REVEAL = {
  duration: 0.85,
  ease: 'power3.out',
  /** между строками одного абзаца, с */
  lineStagger: 0.08,
  /** между элементами, появившимися вместе (время → тег → заголовок → текст), с */
  itemStagger: 0.1,
  /** элемент появляется, когда его верх поднялся выше этой доли высоты экрана */
  enterAt: 0.88,
  /** где строка ждёт появления, % своей высоты: ниже запаса маски (.tl-mask), чтобы ничего не выглядывало */
  hidden: 120,
  /** мобильная раскладка: чуть быстрее, лесенки короче */
  mobile: { duration: 0.7, lineStagger: 0.06, itemStagger: 0.07 },
};

/**
 * Переносы, скрытые в этой раскладке (br-d на мобильном, br-m на десктопе), убираем до разбивки:
 * SplitText считает концом строки любой <br>, даже невидимый. Раскладка за время жизни страницы
 * не меняется (при переходе через границу страница перезагружается — main.ts).
 */
export const dropHiddenBreaks = (el: HTMLElement) =>
  el.querySelectorAll('br').forEach((br) => getComputedStyle(br).display === 'none' && br.remove());

/** класс строки; обёртки-маски получают «tl-mask» (запас под кратку и хвосты букв — в global.css) */
export const LINE_CLASS = 'tl';

/** IntersectionObserver, который срабатывает на линии TEXT_REVEAL.enterAt (общий для всех эффектов текста) */
export const enterObserver = (onEnter: (els: HTMLElement[]) => void) => {
  const top = (el: Element) => el.getBoundingClientRect().top;
  const io = new IntersectionObserver(
    (entries) => {
      const els = entries
        .filter((e) => e.isIntersecting)
        .map((e) => e.target as HTMLElement)
        .sort((a, b) => top(a) - top(b));
      els.forEach((el) => io.unobserve(el));
      if (els.length) onEnter(els);
    },
    { rootMargin: `0px 0px ${Math.round(-(1 - TEXT_REVEAL.enterAt) * 100)}% 0px` },
  );
  return io;
};

export function initTextReveal() {
  const texts = Array.from(document.querySelectorAll<HTMLElement>('[data-lines]'));
  const blocks = Array.from(document.querySelectorAll<HTMLElement>('[data-rise]'));
  if (!texts.length && !blocks.length) return;

  const mobile = window.matchMedia(MOBILE_QUERY);
  const config = () => (mobile.matches ? { ...TEXT_REVEAL, ...TEXT_REVEAL.mobile } : TEXT_REVEAL);
  const shown = new WeakSet<HTMLElement>();
  const lines = new WeakMap<HTMLElement, HTMLElement[]>();

  texts.forEach((el) => {
    dropHiddenBreaks(el);
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: LINE_CLASS,
      autoSplit: true,
      // при пересборке строк (ресайз, поворот) уже показанный текст остаётся на месте
      onSplit(self) {
        lines.set(el, self.lines as HTMLElement[]);
        gsap.set(self.lines, { yPercent: shown.has(el) ? 0 : TEXT_REVEAL.hidden });
        gsap.set(el, { visibility: 'visible' });
      },
    });
  });
  // yPercent и clip-path двигаются синхронно — нижняя кромка стоит на месте, как у маски
  gsap.set(blocks, { yPercent: 100, clipPath: 'inset(0% 0% 100% 0%)', visibility: 'visible' });

  const reveal = (el: HTMLElement, delay: number) => {
    const { duration, ease, lineStagger } = config();
    shown.add(el);
    if (el.hasAttribute('data-rise')) {
      gsap.to(el, { yPercent: 0, clipPath: 'inset(0% 0% 0% 0%)', duration, ease, delay, clearProps: 'clipPath' });
    } else {
      gsap.to(lines.get(el) ?? [], { yPercent: 0, duration, ease, stagger: lineStagger, delay });
    }
  };

  const io = enterObserver((els) => {
    const { itemStagger } = config();
    els.forEach((el, i) => reveal(el, i * itemStagger));
  });
  [...texts, ...blocks].forEach((el) => io.observe(el));
}
