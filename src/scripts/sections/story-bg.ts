/**
 * Общий фон экранов «Что мы придумали?» → «Программа» → «Как всё пройдёт?» — градиент из макета
 * (чёрный → синий → чёрный), прилипший к экрану. «Камера» — какая строка длинного кадра макета
 * сейчас у верха экрана; между закреплениями она едет плавно, после расписания — вместе со страницей.
 *
 * Десктоп (кадр «2», Rectangle 5879: 3622 px от y 43): кадр 1440×900 стоит по центру экрана;
 *   у его верха интро — 60, программа — 868 (+100 за закрепление), расписание — 1611 и дальше со списком.
 * Мобильный («2 · mobile»: градиент 3246 px от y −72): кадр интро 688 и блок программы — по центру
 *   экрана, шапка расписания — у верха (дата 1419 на 40 px от верха).
 * Высота градиента для каждой раскладки — в Story.astro.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOBILE_QUERY, stageScale } from '../core/stage';

/** строка макета у верха экрана для каждого закрепления; h — высота экрана в px макета */
const LAYOUTS = {
  desktop: {
    gradTop: 43,
    intro: (h: number) => 60 - (h - 900) / 2,
    program: (h: number) => 868 - (h - 900) / 2,
    drift: 100,
    schedule: (h: number) => 1611 - (h - 900) / 2,
  },
  mobile: {
    gradTop: -72,
    intro: (h: number) => 344 - h / 2,
    program: (h: number) => 1020.5 - h / 2,
    drift: 60,
    schedule: () => 1379,
  },
};

type Pin = ScrollTrigger | undefined;

export function initStoryBg([intro, program, schedule]: Pin[]) {
  const grad = document.querySelector<HTMLElement>('[data-story-grad]');
  if (!grad) return;
  const setY = gsap.quickSetter(grad, 'y', 'px');
  const mobile = window.matchMedia(MOBILE_QUERY);
  let layout = LAYOUTS.desktop;

  // опорные точки [scrollY, строка у верха экрана]; пересчитываются после закреплений
  let keys: Array<[number, number]> = [];
  const build = () => {
    layout = mobile.matches ? LAYOUTS.mobile : LAYOUTS.desktop;
    const s = stageScale();
    const h = window.innerHeight / s;
    keys = [];
    if (intro) keys.push([intro.start, layout.intro(h)], [intro.end, layout.intro(h)]);
    if (program) keys.push([program.start, layout.program(h)], [program.end, layout.program(h) + layout.drift]);
    if (schedule) keys.push([schedule.start, layout.schedule(h)], [schedule.end, layout.schedule(h) + (schedule.end - schedule.start) / s]);
  };

  const camera = (y: number, s: number) => {
    if (!keys.length || y <= keys[0][0]) return keys[0]?.[1] ?? 0;
    for (let i = 1; i < keys.length; i++) {
      const [y1, c1] = keys[i];
      if (y > y1) continue;
      const [y0, c0] = keys[i - 1];
      return y1 > y0 ? c0 + ((c1 - c0) * (y - y0)) / (y1 - y0) : c1;
    }
    // после расписания фон уезжает вместе со страницей — снизу в него входит чёрный верх блока с логотипом
    const [yl, cl] = keys[keys.length - 1];
    return cl + (y - yl) / s;
  };

  const update = () => {
    const s = stageScale();
    setY((layout.gradTop - camera(window.scrollY, s)) * s);
  };

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: update,
    onRefresh: () => {
      build();
      update();
    },
  });
}
