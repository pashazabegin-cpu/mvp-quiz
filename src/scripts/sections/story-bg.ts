/**
 * Общий фон экранов «Что мы придумали?» → «Программа» → «Как всё пройдёт?» — градиент из макета
 * (чёрный → синий → чёрный), прилипший к экрану. «Камера» — какая строка длинного кадра макета
 * сейчас у верха экрана; между закреплениями она едет плавно, после расписания — вместе со страницей.
 *
 * Десктоп (кадр «2», Rectangle 5879: 3622 px от y 43): кадр 1440×900 стоит по центру экрана;
 *   у его верха интро — 60, «Что будет?» — 1089 (+100 за закрепление), расписание — 1777 и дальше со списком.
 * Мобильный — без скрипта: каждый экран несёт свой кусок градиента сам (Story.astro, data-story-row),
 *   фон едет вместе со страницей и не дёргается при скролле пальцем.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOBILE_QUERY, stageHeight, stageScale } from '../core/stage';

/** строка макета у верха экрана для каждого закрепления; h — высота экрана в px макета */
const LAYOUTS = {
  desktop: {
    gradTop: 43,
    intro: (h: number) => 60 - (h - 900) / 2,
    program: (h: number) => 1089 - (h - 900) / 2,
    drift: 100,
    schedule: (h: number) => 1777 - (h - 900) / 2,
  },
};

type Pin = ScrollTrigger | undefined;

export function initStoryBg([intro, program, schedule]: Pin[]) {
  const grad = document.querySelector<HTMLElement>('[data-story-grad]');
  if (!grad || window.matchMedia(MOBILE_QUERY).matches) return;
  const setY = gsap.quickSetter(grad, 'y', 'px');
  const layout = LAYOUTS.desktop;

  // опорные точки [scrollY, строка у верха экрана]; пересчитываются после закреплений
  let keys: Array<[number, number]> = [];
  const build = () => {
    const s = stageScale();
    const h = stageHeight();
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
