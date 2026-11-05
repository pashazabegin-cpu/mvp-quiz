/**
 * «Что будет?» — три пункта дня на одном закреплённом экране.
 * Скролл ведёт состояние s от 0 до 2 (с удержанием на каждом пункте):
 *   заголовки пунктов всегда на экране — активный белый, соседний 20%, дальний 5% (в обе стороны);
 *   на десктопе список сдвигается на шаг (--step), чтобы активный стоял на одной линии;
 *   иконка посередине перетекает в следующую (WebGL, effects/icon-morph.ts);
 *   номер и описание справа сменяются как тексты на MVP — строки из-под маски.
 * Мобильный — облегчённый (initMobile): экран закреплён CSS sticky (Program.astro), скролл только
 * выбирает текущий пункт, а яркость пунктов, картинка и описание сменяются плавно сами.
 * Заголовки пунктов — кнопки: клик докручивает экран до своего пункта (например, из «Спортивного квиза»
 * сразу к «Кибермейджору»), по пути проигрываются те же переходы.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { IconMorph } from '../effects/icon-morph';
import { MOBILE_QUERY, onStageFit } from '../core/stage';
import { scrollToY } from '../core/smooth-scroll';
import { TEXT_REVEAL, dropHiddenBreaks } from '../animations/text-reveal';

/** яркость пункта по расстоянию до активного, как в макете: 100% → 20% → 5% */
const itemOpacity = (d: number) => (d < 1 ? gsap.utils.interpolate(1, 0.2, d) : gsap.utils.interpolate(0.2, 0.05, Math.min(1, d - 1)));

export function initProgram(motion: boolean): ScrollTrigger | undefined {
  const section = document.querySelector<HTMLElement>('[data-program]');
  if (!section) return;
  if (window.matchMedia(MOBILE_QUERY).matches) return initMobile(section);

  const list = section.querySelector<HTMLElement>('[data-program-list]')!;
  const items = Array.from(section.querySelectorAll<HTMLElement>('[data-program-item]'));
  const buttons = items.map((el) => el.querySelector<HTMLButtonElement>('button'));
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

  // номер и описание: строки из-под маски, как на MVP. Переносы, скрытые в этой раскладке,
  // убираем до разбивки — SplitText считает любой <br> концом строки
  infos.forEach(dropHiddenBreaks);
  const splits = infos.map((el) => SplitText.create(el.querySelectorAll('[data-step-lines]'), { type: 'lines', mask: 'lines', linesClass: 'tl' }));
  splits.forEach((sp, i) => gsap.set(sp.lines, { yPercent: i === 0 ? 0 : TEXT_REVEAL.hidden }));
  section.classList.add('is-ready');
  let active = 0;
  const show = (i: number) => {
    if (i === active) return;
    const dir = i > active ? 1 : -1;
    gsap.to(splits[active].lines, { yPercent: -TEXT_REVEAL.hidden * dir, duration: 0.45, ease: 'power2.in', stagger: 0.04, overwrite: true });
    gsap.fromTo(splits[i].lines, { yPercent: TEXT_REVEAL.hidden * dir }, { yPercent: 0, duration: TEXT_REVEAL.duration, ease: TEXT_REVEAL.ease, stagger: TEXT_REVEAL.lineStagger, delay: 0.2, overwrite: true });
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
      // пройденные пункты не гаснут, а тоже тускнеют
      el.style.opacity = String(itemOpacity(Math.abs(j - s)));
      const current = j === Math.round(s);
      el.classList.toggle('is-active', current);
      buttons[j]?.toggleAttribute('aria-current', current);
    });
    if (morph) morph.set(seg, k);
    else imgs.forEach((img, j) => (img.style.opacity = String(gsap.utils.clamp(0, 1, 1 - Math.abs(j - s) * 1.6))));
    show(Math.round(s));
  };

  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: `+=${100 * n}%`,
    pin: true,
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => render(self.progress),
  });
  render(0);

  // клик по пункту: скролл к месту закрепления, где этот пункт стоит (середина его удержания;
  // крайние — чуть внутрь закрепления, чтобы экран не отпустило)
  buttons.forEach((btn, i) =>
    btn?.addEventListener('click', () => {
      const y = st.start + ((st.end - st.start) * i) / (n - 1);
      scrollToY(gsap.utils.clamp(st.start + 2, st.end - 2, y));
    }),
  );
  return st;
}

/**
 * Мобильный: экран «прилипает» к верху сам (position: sticky у .program внутри дорожки .program-track),
 * поэтому не дёргается ни на входе, ни на выходе. Дорожка делится на равные трети — в каждой свой пункт.
 * Скрипт только переключает пункт (классы и яркость), когда скролл переходит в другую треть; яркость пунктов,
 * картинка и описание сменяются CSS-переходами (Program.astro) — их ведёт браузер, а не скрипт по кадрам.
 * Каждый пиксель скролла ничего не перерисовывает.
 */
function initMobile(section: HTMLElement) {
  const track = section.closest<HTMLElement>('[data-program-track]') ?? section;
  const items = Array.from(section.querySelectorAll<HTMLElement>('[data-program-item]'));
  const buttons = items.map((el) => el.querySelector<HTMLButtonElement>('button'));
  const infos = Array.from(section.querySelectorAll<HTMLElement>('[data-program-info]'));
  const imgs = Array.from(section.querySelectorAll<HTMLImageElement>('[data-program-img]'));
  const n = items.length;

  let active = -1;
  const select = (i: number) => {
    if (i === active) return;
    active = i;
    items.forEach((el, j) => {
      el.style.opacity = String(itemOpacity(Math.abs(j - i)));
      el.classList.toggle('is-active', j === i);
      buttons[j]?.toggleAttribute('aria-current', j === i);
    });
    imgs.forEach((img, j) => (img.style.opacity = j === i ? '1' : '0'));
    // старое описание быстро гаснет, новое проявляется следом — тексты не наслаиваются
    infos.forEach((el, j) => el.classList.toggle('is-current', j === i));
  };
  const pick = (progress: number) => select(Math.min(n - 1, Math.floor(progress * n)));

  const st = ScrollTrigger.create({
    trigger: track,
    start: 'top top',
    // «прилипание» длится, пока дорожка не кончится под экраном
    end: () => `+=${Math.max(1, track.offsetHeight - section.offsetHeight)}`,
    invalidateOnRefresh: true,
    onUpdate: (self) => pick(self.progress),
    onRefresh: (self) => pick(self.progress),
  });
  pick(0);
  section.classList.add('is-ready');

  // клик по пункту: скролл в середину его трети дорожки
  buttons.forEach((btn, i) =>
    btn?.addEventListener('click', () => scrollToY(st.start + ((st.end - st.start) * (i + 0.5)) / n)),
  );
  return st;
}
