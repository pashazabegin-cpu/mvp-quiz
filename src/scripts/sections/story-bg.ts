/**
 * Общий фон экранов «Что мы придумали?» → «Программа» → «Как всё пройдёт?» — градиент из макета
 * (кадр «2», Rectangle 5879: 3622 px от y 43, чёрный → синий → чёрный), прилипший к экрану.
 * «Камера» — какая строка длинного кадра сейчас у верха кадра 1440×900:
 *   интро — 60, программа — 868 (+100 за закрепление), расписание — 1611 и дальше вместе со списком,
 *   так что к концу расписания фон уходит в чёрный. Между закреплениями камера едет плавно.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { stageScale } from '../core/stage';

const GRAD_TOP = 43;
const CAMERA = { intro: 60, program: 868, programDrift: 100, schedule: 1611 };

type Pin = ScrollTrigger | undefined;

export function initStoryBg([intro, program, schedule]: Pin[]) {
  const grad = document.querySelector<HTMLElement>('[data-story-grad]');
  if (!grad) return;
  const setY = gsap.quickSetter(grad, 'y', 'px');

  // опорные точки [scrollY, камера]; пересчитываются после закреплений
  let keys: Array<[number, number]> = [];
  const build = () => {
    keys = [];
    if (intro) keys.push([intro.start, CAMERA.intro], [intro.end, CAMERA.intro]);
    if (program) keys.push([program.start, CAMERA.program], [program.end, CAMERA.program + CAMERA.programDrift]);
    if (schedule) keys.push([schedule.start, CAMERA.schedule], [schedule.end, CAMERA.schedule + (schedule.end - schedule.start) / stageScale()]);
  };

  const camera = (y: number) => {
    if (!keys.length || y <= keys[0][0]) return keys[0]?.[1] ?? CAMERA.intro;
    for (let i = 1; i < keys.length; i++) {
      const [y1, c1] = keys[i];
      if (y > y1) continue;
      const [y0, c0] = keys[i - 1];
      return y1 > y0 ? c0 + ((c1 - c0) * (y - y0)) / (y1 - y0) : c1;
    }
    return keys[keys.length - 1][1];
  };

  const update = () => {
    const s = stageScale();
    const frameTop = (window.innerHeight - 900 * s) / 2; // верх кадра 1440×900 на экране
    setY(frameTop + (GRAD_TOP - camera(window.scrollY)) * s);
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
