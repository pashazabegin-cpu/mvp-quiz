/**
 * «Программа» — три пункта дня на одном закреплённом экране.
 * Скролл ведёт состояние s от 0 до 2 (с удержанием на каждом пункте):
 *   список слева едет вверх на шаг (--step), активный пункт белый, следующие — 5%, пройденные гаснут;
 *   иконка посередине перетекает в следующую (WebGL, effects/icon-morph.ts);
 *   номер и описание справа сменяются как тексты на MVP — строки из-под маски.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { IconMorph } from '../effects/icon-morph';
import { onStageFit } from '../core/stage';
import { TEXT_REVEAL } from '../animations/text-reveal';

export function initProgram(motion: boolean): ScrollTrigger | undefined {
  const section = document.querySelector<HTMLElement>('[data-program]');
  if (!section) return;
  const list = section.querySelector<HTMLElement>('[data-program-list]')!;
  const items = Array.from(section.querySelectorAll<HTMLElement>('[data-program-item]'));
  const infos = Array.from(section.querySelectorAll<HTMLElement>('[data-program-info]'));
  const imgs = Array.from(section.querySelectorAll<HTMLImageElement>('[data-program-img]'));
  const canvas = section.querySelector<HTMLCanvasElement>('[data-icon-morph]');
  const float = section.querySelector<HTMLElement>('[data-program-float]');
  const n = items.length;

  const morph = canvas ? IconMorph.create(canvas, imgs.map((i) => i.currentSrc || i.src), [0.192, 0.659, 0.953]) : null;
  if (morph) {
    section.classList.add('is-gl');
    onStageFit(() => morph.resize());
  }

  // иконка «дышит» на месте
  if (motion && float) gsap.to(float, { y: -12, rotation: 1.5, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  // номер и описание: строки из-под маски, как на MVP. Переносы, скрытые в этой раскладке
  // (br-d на мобильном), убираем до разбивки — SplitText считает любой <br> концом строки
  infos.forEach((el) => el.querySelectorAll('br').forEach((br) => getComputedStyle(br).display === 'none' && br.remove()));
  const splits = infos.map((el) => SplitText.create(el.querySelectorAll('[data-step-lines]'), { type: 'lines', mask: 'lines', linesClass: 'tl' }));
  splits.forEach((sp, i) => gsap.set(sp.lines, { yPercent: i === 0 ? 0 : 105 }));
  section.classList.add('is-ready');
  let active = 0;
  const show = (i: number) => {
    if (i === active) return;
    const dir = i > active ? 1 : -1;
    gsap.to(splits[active].lines, { yPercent: -105 * dir, duration: 0.45, ease: 'power2.in', stagger: 0.04, overwrite: true });
    gsap.fromTo(splits[i].lines, { yPercent: 105 * dir }, { yPercent: 0, duration: TEXT_REVEAL.duration, ease: TEXT_REVEAL.ease, stagger: TEXT_REVEAL.lineStagger, delay: 0.2, overwrite: true });
    active = i;
  };

  const ease = gsap.parseEase('power2.inOut');
  const step = () => parseFloat(getComputedStyle(list).getPropertyValue('--step')) || 82;

  const render = (t: number) => {
    const raw = t * (n - 1);
    const seg = Math.min(Math.floor(raw), n - 2);
    // удержание: первые и последние ~20% шага пункт стоит на месте
    const k = ease(gsap.utils.clamp(0, 1, (raw - seg - 0.22) / 0.56));
    const s = seg + k;
    gsap.set(list, { y: -s * step() });
    items.forEach((el, j) => {
      const d = j - s;
      // как в макете: следующий пункт — 20%, дальше — 5%
      const after = d < 1 ? gsap.utils.interpolate(1, 0.2, d) : gsap.utils.interpolate(0.2, 0.05, Math.min(1, d - 1));
      el.style.opacity = String(d < 0 ? gsap.utils.clamp(0, 1, 1 + d * 2.2) : after);
    });
    if (morph) morph.set(seg, k);
    else imgs.forEach((img, j) => (img.style.opacity = String(gsap.utils.clamp(0, 1, 1 - Math.abs(j - s) * 1.6))));
    show(Math.round(s));
  };

  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: `+=${n * 100}%`,
    pin: true,
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => render(self.progress),
  });
  render(0);
  return st;
}
