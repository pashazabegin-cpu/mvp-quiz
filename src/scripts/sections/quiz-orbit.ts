/**
 * Орбита иконок вокруг плашки «Спортивного квиза» (референс — карусель-цилиндр dialkit.dev).
 *
 * Иконки стоят на окружности в горизонтальной плоскости, через равные углы
 * (360° / 24: 12 иконок, каждая дважды — копии напротив друг друга) и в одинаковых рамках.
 * Всё остальное — перспектива:
 *   положение — проекция кольца радиуса R камерой на расстоянии D = K·R почти на уровне кольца:
 *     иконки идут почти по прямой, к краям сходятся плотнее;
 *   размер — перспектива камеры, стоящей вплотную к передней иконке (SIZE_K): самая крупная —
 *     по центру, уже соседние заметно меньше, следующие — меньше вдвое.
 * Передняя половина орбиты — поверх плашки и текста, задняя — за плашкой (её не рисуем).
 *
 * Движение от скролла (параллакс в двух направлениях):
 *   по горизонтали — скролл прокручивает орбиту (вниз — иконки уходят влево), плюс медленное собственное вращение;
 *   по вертикали — пока читаешь «Настраиваемся / Играем / Кайфуем», кольцо стоит ниже них, на начале текста;
 *     когда доскролливаешь до текста, кольцо поднимается на место пунктов и текст открывается.
 * Положение плавно догоняет цель — без рывков от колёсика и пальца. Вне экрана не считается.
 * При «уменьшить движение» кольцо стоит на месте.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOBILE_QUERY, onStageFit, stageScale } from '../core/stage';

type Config = {
  /** камера для положения: D = K·R (меньше — сильнее сходятся к краям) */
  k: number;
  /** расстояние между центральной иконкой и соседней, px макета (задаёт радиус кольца) */
  spacing: number;
  /** провисание передней дуги (центр против краёв), px макета: маленькое — траектория почти прямая */
  dip: number;
  /** зазор между низом пунктов и верхом центральной иконки в нижнем положении, px макета */
  gap: number;
  /** собственное вращение — секунд на оборот */
  period: number;
  /** горизонтальный параллакс: радиан на 1 px макета скролла */
  scroll: number;
};

const DESKTOP: Config = { k: 2, spacing: 250, dip: 30, gap: 15, period: 90, scroll: 0.001 };
const MOBILE: Config = { k: 2, spacing: 105, dip: 10, gap: 10, period: 90, scroll: 0.0022 };
/** перспектива размера: камера вплотную к передней иконке — соседние ≈ 0.75 от центральной, следующие ≈ 0.43 */
const SIZE_K = 0.1;
/** как быстро кольцо догоняет скролл (1/с) */
const FOLLOW = 8;

const smoothstep = (p: number) => p * p * (3 - 2 * p);

export function initQuizOrbit(motion: boolean) {
  const section = document.querySelector<HTMLElement>('[data-quiz]');
  const ui = section?.querySelector<HTMLElement>('[data-quiz-ui]');
  const steps = section?.querySelector<HTMLElement>('[data-quiz-steps]');
  const lead = section?.querySelector<HTMLElement>('[data-quiz-lead]');
  if (!section || !ui || !steps || !lead) return;
  const cfg = window.matchMedia(MOBILE_QUERY).matches ? MOBILE : DESKTOP;

  const items = Array.from(section.querySelectorAll<HTMLElement>('[data-orbit-item]'));
  const n = items.length;
  if (!n) return;
  const step = (Math.PI * 2) / n;

  let box = 280; // сторона рамки передней иконки, px макета
  let cx = 720; // центр кольца по горизонтали
  let R = 1000;
  let D = 1000;
  let tilt = 0;
  // вертикаль (px макета от верха блока): low — под пунктами, high — на месте пунктов;
  // stepsMid / leadMid — середины пунктов и текста, по ним считаем, где мы читаем
  let low = 800;
  let high = 550;
  let stepsMid = 550;
  let leadMid = 1030;

  const measure = () => {
    box = items[0].offsetWidth;
    cx = ui.offsetWidth / 2;
    // радиус — из шага у центра: sin(шаг) · масштаб перспективы соседней иконки
    const s1 = cfg.k / (cfg.k + 1 - Math.cos(step));
    R = cfg.spacing / (Math.sin(step) * s1);
    D = cfg.k * R;
    tilt = cfg.dip / R;
    stepsMid = steps.offsetTop + steps.offsetHeight / 2;
    leadMid = lead.offsetTop + lead.offsetHeight / 2;
    high = stepsMid;
    low = steps.offsetTop + steps.offsetHeight + cfg.gap + box / 2;
  };

  // угол орбиты: иконка i стоит на angle + i·step, 0 — спереди по центру. Посередине пути
  // по центру кубок (5-й в списке), слева мяч, шуба, шар, маска, справа оливье, перчатки, шпроты
  const START = -4 * step;
  let angle = START;
  let ringY = low;

  const render = () => {
    for (let i = 0; i < n; i++) {
      const t = angle + i * step;
      const sin = Math.sin(t);
      const cos = Math.cos(t);
      const s = D / (D + R * (1 - cos));
      const size = SIZE_K / (SIZE_K + 1 - cos);
      const x = cx + R * sin * s;
      const y = ringY - cfg.dip + R * cos * tilt * s;
      const half = (box * size) / 2;
      // не рисуем: задняя половина (за плашкой) и всё, что за краем кадра
      const hidden = cos <= 0 || x + half < 0 || x - half > cx * 2;
      const el = items[i];
      el.style.visibility = hidden ? 'hidden' : 'visible';
      if (hidden) continue;
      el.style.zIndex = String(4 + Math.round(cos * 40));
      el.style.transform = `translate3d(${(x - box / 2).toFixed(2)}px, ${(y - box / 2).toFixed(2)}px, 0) scale(${size.toFixed(4)})`;
    }
  };

  // скролл (px страницы), при котором посередине экрана пункты (from) и текст (to)
  let from = 0;
  let to = 1;
  const measureScroll = () => {
    const top = section.getBoundingClientRect().top + window.scrollY;
    const s = stageScale();
    from = top + stepsMid * s - window.innerHeight / 2;
    to = top + leadMid * s - window.innerHeight / 2;
  };
  /** 0 — читаем пункты (кольцо внизу), 1 — читаем текст (кольцо наверху) */
  const progress = () => smoothstep(gsap.utils.clamp(0, 1, (window.scrollY - from) / (to - from)));

  const fit = () => {
    measure();
    measureScroll();
    ringY = gsap.utils.interpolate(low, high, progress());
    render();
  };
  fit();
  onStageFit(fit);
  if (!motion) return;

  const spin = (Math.PI * 2) / cfg.period;
  let time = 0; // секунды собственного вращения
  const middle = () => (from + to) / 2;
  const targetAngle = () => START - time * spin - ((window.scrollY - middle()) / stageScale()) * cfg.scroll;
  const targetY = () => gsap.utils.interpolate(low, high, progress());

  const tick = (_t: number, deltaMs: number) => {
    const dt = Math.min(deltaMs, 64) / 1000;
    time += dt;
    const follow = 1 - Math.exp(-dt * FOLLOW);
    angle += (targetAngle() - angle) * follow;
    ringY += (targetY() - ringY) * follow;
    render();
  };

  // считаем, только пока блок на экране; при входе — сразу на месте, без докрутки
  let running = false;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting === running) return;
    running = entry.isIntersecting;
    if (running) {
      measureScroll();
      angle = targetAngle();
      ringY = targetY();
      gsap.ticker.add(tick);
    } else gsap.ticker.remove(tick);
  }).observe(section);
  // закрепления выше меняют высоту страницы — после пересчёта триггеров уточняем точки скролла
  ScrollTrigger.addEventListener('refresh', measureScroll);
}
