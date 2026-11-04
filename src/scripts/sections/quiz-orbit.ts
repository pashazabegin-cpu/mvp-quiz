/**
 * Карусель иконок «Спортивного квиза» (референс — карусель-цилиндр dialkit.dev).
 *
 * ГЛАВНЫЕ УСЛОВИЯ (от заказчика):
 *   1. Расстояния между иконками ОДИНАКОВЫЕ: между краями соседних иконок всегда один и тот же зазор
 *      (GAP), при любом размере и в любой момент движения. Это важнее всего.
 *   2. Карусель идёт на всю ширину экрана и уходит за оба края; лента замкнута — крутится без конца.
 *   3. Перспектива: по центру самая крупная иконка, к краям плавно меньше (SHRINK); все на одной прямой.
 *   4. По бокам — лёгкая хроматическая аберрация только на иконках карусели: синяя кромка к центру,
 *      бирюзовая — наружу; по центру её нет, к краям чуть сильнее (ABERRATION).
 *
 * Как устроено: лента из 24 мест (12 иконок по два раза), p — текущий сдвиг ленты в «иконках».
 * У каждой иконки o = её место − p (0 — ровно по центру). Размер рамки — BOX·f(o), f = 1/√(1 + SHRINK·o²);
 * видимая ширина — с учётом пропорций картинки (data-ratio), поэтому зазор считается по видимым краям.
 * Раскладка — цепочкой от центра: две иконки по бокам от центра стоят на отрезке «пол-ширины + зазор +
 * пол-ширины» пропорционально дробной части p, дальше каждая следующая — вплотную через GAP.
 * Так зазоры равны всегда, а при движении ничего не прыгает.
 *
 * Движение от скролла:
 *   по горизонтали — скролл прокручивает ленту (вниз — иконки уходят влево), плюс медленное собственное движение;
 *   по вертикали — два состояния из макета: при входе в блок (верх плашки в ARRIVE от верха экрана) лента стоит
 *   под темами, на начале текста; через TRAVEL px скролла — поднимается на темы и открывает текст.
 * Положение плавно догоняет цель — без рывков от колёсика и пальца. Вне экрана не считается.
 * При «уменьшить движение» лента стоит на месте (в нижнем или верхнем положении — по скроллу при загрузке).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOBILE_QUERY, onStageFit, stageScale } from '../core/stage';

type Config = {
  /** зазор между краями соседних иконок, px макета */
  gap: number;
  /** насколько быстро иконки уменьшаются от центра: соседняя ≈ 1/√(1+SHRINK) от центральной */
  shrink: number;
  /** верх плашки от верха экрана в состоянии «вошли в блок», px макета */
  arrive: number;
  /** сколько px макета скролла от «вошли в блок» до «дошли до текста» */
  travel: number;
  /** нижнее положение: центр ленты ниже верха текста на столько px макета */
  low: number;
  /** верхнее положение: центр ленты ниже середины тем на столько px макета */
  high: number;
  /** собственное движение — секунд на одну иконку */
  pace: number;
  /** горизонтальный параллакс: иконок на 1 px макета скролла */
  scroll: number;
  /** сдвиг цветных кромок у края экрана, px макета */
  aberration: number;
};

// положения — по кадрам 4204:4529 / 4204:4575; перспектива мягче макета (по просьбе заказчика):
// соседняя ≈ 0.83 от центральной, дальше 0.6, 0.44, 0.35
const DESKTOP: Config = { gap: 40, shrink: 0.45, arrive: 43, travel: 495, low: 18, high: 16, pace: 3.5, scroll: 0.004, aberration: 7 };
const MOBILE: Config = { gap: 16, shrink: 0.45, arrive: 20, travel: 340, low: 10, high: 4, pace: 3.5, scroll: 0.009, aberration: 3 };
/** аберрация: с какого места от центра начинается и где выходит на полную (в иконках) */
const ABERRATION = { from: 0.8, full: 3.5 };
/** цвета кромок: к центру — синий, наружу — бирюзовый */
const FRINGE = { inner: 'rgb(37 99 255 / 0.75)', outer: 'rgb(56 232 222 / 0.7)' };
/** до скольких мест от центра раскладываем ленту (дальше — точно за краем экрана) */
const REACH = 9;
/** как быстро лента догоняет скролл (1/с) */
const FOLLOW = 8;

const smoothstep = (p: number) => p * p * (3 - 2 * p);

export function initQuizOrbit(motion: boolean) {
  const section = document.querySelector<HTMLElement>('[data-quiz]');
  const ui = section?.querySelector<HTMLElement>('[data-quiz-ui]');
  const plate = section?.querySelector<HTMLElement>('.quiz__plate');
  const topics = section?.querySelector<HTMLElement>('[data-quiz-topics]');
  const lead = section?.querySelector<HTMLElement>('[data-quiz-lead]');
  if (!section || !ui || !plate || !topics || !lead) return;
  const cfg = window.matchMedia(MOBILE_QUERY).matches ? MOBILE : DESKTOP;

  const items = Array.from(section.querySelectorAll<HTMLElement>('[data-orbit-item]'));
  const n = items.length;
  if (!n) return;
  // доля рамки, которую занимает картинка по ширине (узкая бутылка — меньше, широкий свисток — вся рамка)
  const fill = items.map((el) => Math.min(1, Number(el.dataset.ratio) || 1));

  let box = 260; // сторона рамки центральной иконки, px макета
  let cx = 720; // центр ленты по горизонтали
  let low = 860;
  let high = 658;

  const measure = () => {
    box = items[0].offsetWidth;
    cx = ui.offsetWidth / 2;
    high = topics.offsetTop + topics.offsetHeight / 2 + cfg.high;
    low = lead.offsetTop + cfg.low;
  };

  const scaleAt = (o: number) => 1 / Math.sqrt(1 + cfg.shrink * o * o);
  // p = 4 — по центру кубок (5-й в списке), как в макете
  const START = 4;
  let p = START;
  let ringY = low;

  // раскладка: место каждой иконки относительно центра, затем цепочка через одинаковый зазор
  const offs = new Array<number>(n);
  const xs = new Array<number>(n);
  const sizes = new Array<number>(n);
  const order: number[] = [];
  const fringe = new Array<string>(n).fill('');
  const render = () => {
    for (let i = 0; i < n; i++) {
      // место относительно центра в диапазоне [−n/2, n/2)
      offs[i] = ((((i - p) % n) + n * 1.5) % n) - n / 2;
      sizes[i] = scaleAt(offs[i]);
    }
    order.length = 0;
    for (let i = 0; i < n; i++) if (Math.abs(offs[i]) <= REACH) order.push(i);
    order.sort((a, b) => offs[a] - offs[b]);
    const width = (i: number) => box * sizes[i] * fill[i];

    // пара вокруг центра: левая (o ∈ (−1, 0]) и правая (o ∈ (0, 1])
    let k = order.findIndex((i) => offs[i] > 0);
    if (k <= 0) k = 1;
    const left = order[k - 1];
    const right = order[k];
    const span = width(left) / 2 + cfg.gap + width(right) / 2;
    xs[left] = cx + offs[left] * span;
    xs[right] = xs[left] + span;
    for (let j = k + 1; j < order.length; j++) {
      const a = order[j - 1];
      const b = order[j];
      xs[b] = xs[a] + width(a) / 2 + cfg.gap + width(b) / 2;
    }
    for (let j = k - 2; j >= 0; j--) {
      const a = order[j + 1];
      const b = order[j];
      xs[b] = xs[a] - width(a) / 2 - cfg.gap - width(b) / 2;
    }

    const visible = new Set(order);
    for (let i = 0; i < n; i++) {
      const el = items[i];
      const half = width(i) / 2;
      const hidden = !visible.has(i) || xs[i] + half < 0 || xs[i] - half > cx * 2;
      el.style.visibility = hidden ? 'hidden' : 'visible';
      if (hidden) continue;
      el.style.zIndex = String(40 - Math.round(Math.abs(offs[i]) * 3));
      const s = sizes[i];
      el.style.transform = `translate3d(${(xs[i] - box / 2).toFixed(2)}px, ${(ringY - box / 2).toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
      // аберрация: цветные копии силуэта (drop-shadow) по бокам; шаг 0.5 px — фильтр перерисовывается редко
      const k = smoothstep(gsap.utils.clamp(0, 1, (Math.abs(offs[i]) - ABERRATION.from) / (ABERRATION.full - ABERRATION.from)));
      // сдвиг в px рамки (до масштаба), с шагом 0.5 — строка фильтра меняется только на этих шагах
      const shift = Math.round(((cfg.aberration * k) / s) * 2) / 2;
      const dir = xs[i] < cx ? -1 : 1; // наружу
      const value = shift ? `drop-shadow(${-dir * shift}px 0 0 ${FRINGE.inner}) drop-shadow(${dir * shift}px 0 0 ${FRINGE.outer})` : '';
      if (value !== fringe[i]) {
        fringe[i] = value;
        el.style.filter = value;
      }
    }
  };

  // скролл (px страницы) двух состояний: «вошли в блок» и «дошли до текста»
  let from = 0;
  let to = 1;
  const measureScroll = () => {
    const s = stageScale();
    from = section.getBoundingClientRect().top + window.scrollY + (plate.offsetTop - cfg.arrive) * s;
    to = from + cfg.travel * s;
  };
  /** 0 — вошли в блок (лента внизу), 1 — дошли до текста (лента на темах) */
  const progress = () => smoothstep(gsap.utils.clamp(0, 1, (window.scrollY - from) / (to - from)));
  const targetY = () => gsap.utils.interpolate(low, high, progress());

  const fit = () => {
    measure();
    measureScroll();
    ringY = targetY();
    render();
  };
  fit();
  onStageFit(fit);
  if (!motion) return;

  let time = 0; // секунды собственного движения
  // при входе в блок по центру кубок; дальше лента идёт сама и от скролла
  const targetP = () => START + time / cfg.pace + ((window.scrollY - from) / stageScale()) * cfg.scroll;

  const tick = (_t: number, deltaMs: number) => {
    const dt = Math.min(deltaMs, 64) / 1000;
    time += dt;
    const follow = 1 - Math.exp(-dt * FOLLOW);
    p += (targetP() - p) * follow;
    ringY += (targetY() - ringY) * follow;
    render();
  };

  // считаем, только пока блок на экране; при входе — сразу на месте, без докрутки
  let running = false;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting === running) return;
    running = entry.isIntersecting;
    if (running) {
      measure();
      measureScroll();
      p = targetP();
      ringY = targetY();
      gsap.ticker.add(tick);
    } else gsap.ticker.remove(tick);
  }).observe(section);
  // закрепления выше и перенос строк меняют высоты — после пересчёта триггеров уточняем точки
  ScrollTrigger.addEventListener('refresh', () => {
    measure();
    measureScroll();
  });
}
