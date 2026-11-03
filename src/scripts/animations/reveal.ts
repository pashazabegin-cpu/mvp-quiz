import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { enterObserver } from './text-reveal';

/** плашка на строке заголовка: время каждой половины, сдвиг между строками */
const WIPE = { duration: 0.85, stagger: 0.1, ease: 'power4.inOut' };

/**
 * Появление при скролле.
 * [data-split]   — главный заголовок: по каждой строке пробегает голубая плашка (Block Reveal) —
 *                  растёт слева и закрывает строку, текст под ней появляется, плашка уходит вправо;
 *                  data-split="dark" — тёмно-синяя плашка (подзаголовки-лейблы)
 * [data-reveal]  — блок всплывает снизу
 * [data-stagger] — дочерние элементы всплывают лесенкой
 * Начальные (скрытые) состояния заданы в global.css под классом .js-motion.
 */
export function initReveals() {
  // запуск — когда заголовок появился на экране (как у обычного текста, text-reveal.ts):
  // работает и на закреплённых экранах; после показа пересборка строк (ресайз, панель Safari)
  // оставляет заголовок видимым, а не прячет его заново
  const shown = new WeakSet<HTMLElement>();
  const wipes = new WeakMap<HTMLElement, gsap.core.Timeline>();
  const io = enterObserver((els) =>
    els.forEach((el, i) => {
      shown.add(el);
      wipes.get(el)?.delay(i * WIPE.stagger).play();
    }),
  );

  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    io.observe(el);
    SplitText.create(el, {
      type: 'lines',
      autoSplit: true, // пересобирает строки при ресайзе; разметку ниже SplitText откатывает сам
      onSplit(self) {
        gsap.set(el, { visibility: 'visible' });
        // каждая строка — в обёртке по ширине текста, с плашкой поверх
        const align = getComputedStyle(el).textAlign;
        const lines = self.lines as HTMLElement[];
        const blocks = lines.map((line) => {
          const wrap = document.createElement('div');
          wrap.className = 'wipe';
          if (align === 'center') wrap.style.marginInline = 'auto';
          else if (align === 'right' || align === 'end') wrap.style.marginLeft = 'auto';
          line.before(wrap);
          const block = document.createElement('span');
          block.className = el.dataset.split === 'dark' ? 'wipe__block wipe__block--dark' : 'wipe__block';
          wrap.append(line, block);
          return block;
        });

        wipes.get(el)?.kill();
        if (shown.has(el)) {
          gsap.set(blocks, { scaleX: 0 });
          return;
        }
        gsap.set(lines, { opacity: 0 });
        const tl = gsap.timeline({ paused: true });
        lines.forEach((line, i) => {
          const at = i * WIPE.stagger;
          tl.fromTo(blocks[i], { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: WIPE.duration, ease: WIPE.ease }, at)
            .set(line, { opacity: 1 }, at + WIPE.duration)
            .set(blocks[i], { transformOrigin: 'right center' }, at + WIPE.duration)
            .to(blocks[i], { scaleX: 0, duration: WIPE.duration, ease: WIPE.ease }, at + WIPE.duration);
        });
        wipes.set(el, tl);
      },
    });
  });

  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.to(el, {
      autoAlpha: 1,
      y: 0,
      duration: 0.9,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((group) => {
    gsap.to(group.children, {
      autoAlpha: 1,
      y: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.07,
      scrollTrigger: { trigger: group, start: 'top 88%', once: true },
    });
  });
}
