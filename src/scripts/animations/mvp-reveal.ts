/**
 * Появление текстов первого экрана — те же приёмы и тайминги, что на MVP (src/hero/reveal.ts).
 * Тип задаётся атрибутом data-anim:
 *   tag   — плашка с датой: шторкой слева направо
 *   parts — логотип: поднимается из-под «маски»
 *   lines — абзац: построчно из-под маски (SplitText)
 *   btn   — кнопка: подъём с небольшим масштабом
 */
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { TEXT_REVEAL } from './text-reveal';

const splits = new WeakMap<HTMLElement, SplitText>();

const items = (root: ParentNode) => Array.from(root.querySelectorAll<HTMLElement>('[data-anim]'));

/** Разбить абзацы на строки один раз (после загрузки шрифтов). */
export function prepareLines(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-anim="lines"]').forEach((el) => {
    if (!splits.has(el)) splits.set(el, new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'tl' }));
  });
}

/** Мгновенно спрятать тексты (перед появлением). */
export function resetUI(root: ParentNode) {
  items(root).forEach((el) => {
    gsap.set(el, { autoAlpha: 1, y: 0 });
    switch (el.dataset.anim) {
      case 'tag':
        gsap.set(el.children, { clipPath: 'inset(0% 100% 0% 0%)' });
        break;
      case 'parts':
        gsap.set(el.children, { yPercent: 100, clipPath: 'inset(0% 0% 100% 0%)' });
        break;
      case 'lines': {
        const split = splits.get(el);
        if (split) gsap.set(split.lines, { yPercent: 105 });
        break;
      }
      case 'btn':
        gsap.set(el, { autoAlpha: 0, y: 24, scale: 0.94 });
        break;
    }
  });
}

export function revealUI(root: ParentNode): gsap.core.Timeline {
  const tl = gsap.timeline();
  items(root).forEach((el, i) => {
    const at = i * 0.1;
    switch (el.dataset.anim) {
      case 'tag':
        tl.to(el.children, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'power3.inOut', stagger: 0.1 }, at);
        break;
      case 'parts':
        // yPercent и clip-path двигаются синхронно → нижняя кромка стоит на месте, как у маски
        tl.to(el.children, { yPercent: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power3.out', stagger: 0.07 }, at);
        break;
      case 'lines': {
        const split = splits.get(el);
        if (split) tl.to(split.lines, { yPercent: 0, duration: TEXT_REVEAL.duration, ease: TEXT_REVEAL.ease, stagger: TEXT_REVEAL.lineStagger }, at);
        break;
      }
      case 'btn':
        tl.to(el, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: 'expo.out', clearProps: 'transform' }, at);
        break;
    }
  });
  return tl;
}
