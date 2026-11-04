/**
 * Орбита иконок вокруг плашки «Спортивного квиза» (референс — карусель-цилиндр dialkit.dev).
 *
 * Иконки стоят на окружности в горизонтальной плоскости через центр плашки, через равные углы
 * (360° / 26: 13 иконок, каждая дважды — копии напротив друг друга) и в одинаковых рамках.
 * Всё остальное — перспектива:
 *   положение — проекция кольца радиуса R камерой на расстоянии D = K·R, чуть сверху:
 *     передняя дуга провисает «улыбкой», к краям иконки сходятся и уходят за край кадра;
 *   размер — перспектива камеры, стоящей вплотную к передней иконке (SIZE_K): самая крупная —
 *     по центру, уже соседние заметно меньше, следующие — меньше вдвое.
 * Передняя половина орбиты — поверх плашки и текста, задняя — за плашкой (её не рисуем: иконки там крошечные,
 * а край кольца уходит за край кадра).
 *
 * Движение: орбита медленно крутится сама и ещё прокручивается скроллом, как горизонтальный параллакс
 * (вниз — иконки уходят влево, вверх — обратно). Угол плавно догоняет цель — без рывков от колёсика
 * и пальца. Вне экрана не считается. При «уменьшить движение» — стоит на месте.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOBILE_QUERY, onStageFit, stageScale } from '../core/stage';

type Config = {
  /** камера для положения: D = K·R (меньше — сильнее сходятся к краям) */
  k: number;
  /** насколько край кольца выходит за половину кадра, px макета (задаёт R, а с ним шаг между иконками) */
  reach: number;
  /** провисание передней дуги (центр против краёв), px макета */
  dip: number;
  /** центр передней иконки от верха блока, px макета */
  y: number;
  /** собственное вращение — секунд на оборот */
  period: number;
  /** параллакс: радиан на 1 px макета скролла */
  scroll: number;
};

// на 1440: R ≈ 1360, шаг у центра ≈ 320; на мобильном кольцо шире экрана — видно 3 иконки и 2 по краям
// камера заметно сверху (dip) — по дуге видно, что иконки идут по кругу
const DESKTOP: Config = { k: 2, reach: 240, dip: 300, y: 790, period: 90, scroll: 0.0008 };
const MOBILE: Config = { k: 2, reach: 250, dip: 100, y: 445, period: 90, scroll: 0.0016 };
/** перспектива размера: камера вплотную к передней иконке — соседние ≈ 0.77 от центральной, следующие ≈ 0.47 */
const SIZE_K = 0.1;
/** как быстро угол догоняет скролл (1/с) */
const FOLLOW = 8;

export function initQuizOrbit(motion: boolean) {
  const section = document.querySelector<HTMLElement>('[data-quiz]');
  const ui = section?.querySelector<HTMLElement>('[data-quiz-ui]');
  if (!section || !ui) return;
  const mobile = window.matchMedia(MOBILE_QUERY).matches;
  const cfg = mobile ? MOBILE : DESKTOP;

  const items = Array.from(section.querySelectorAll<HTMLElement>('[data-orbit-item]'));
  const n = items.length;
  if (!n) return;
  const step = (Math.PI * 2) / n;

  let box = 300; // сторона рамки передней иконки, px макета
  let cx = 720; // центр орбиты по горизонтали
  let R = 1000;
  let D = 1000;
  let tilt = 0;

  const measure = () => {
    box = items[0].offsetWidth;
    const half = ui.offsetWidth / 2;
    cx = half;
    // край кольца на экране: max(sinθ · K/(K + 1 − cosθ)) при cosθ = 1/(K + 1)
    const c = 1 / (cfg.k + 1);
    const extent = (Math.sqrt(1 - c * c) * cfg.k) / (cfg.k + 1 - c);
    R = (half + cfg.reach) / extent;
    D = cfg.k * R;
    tilt = cfg.dip / R;
  };

  // угол орбиты: иконка i стоит на angle + i·step, 0 — спереди по центру. Когда кольцо посередине экрана,
  // стоит как в макете: по центру кубок (5-й в списке), слева мяч, шуба, шар, маска, справа оливье, перчатки, шпроты
  const START = -4 * step;
  let angle = START;

  const render = () => {
    for (let i = 0; i < n; i++) {
      const t = angle + i * step;
      const sin = Math.sin(t);
      const cos = Math.cos(t);
      const s = D / (D + R * (1 - cos));
      const size = SIZE_K / (SIZE_K + 1 - cos);
      const x = cx + R * sin * s;
      const y = cfg.y - cfg.dip + R * cos * tilt * s;
      const front = cos > 0;
      const half = (box * size) / 2;
      // не рисуем: задняя половина (за плашкой) и всё, что за краем кадра
      const hidden = !front || x + half < 0 || x - half > cx * 2;
      const el = items[i];
      el.style.visibility = hidden ? 'hidden' : 'visible';
      if (hidden) continue;
      el.style.zIndex = String(4 + Math.round(cos * 40));
      el.style.transform = `translate3d(${(x - box / 2).toFixed(2)}px, ${(y - box / 2).toFixed(2)}px, 0) scale(${size.toFixed(4)})`;
    }
  };

  // скролл, при котором кольцо посередине экрана (px страницы)
  let middle = 0;
  const measureScroll = () => {
    middle = section.getBoundingClientRect().top + window.scrollY + cfg.y * stageScale() - window.innerHeight / 2;
  };

  measure();
  measureScroll();
  render();
  onStageFit(() => {
    measure();
    measureScroll();
    render();
  });
  if (!motion) return;

  const spin = (Math.PI * 2) / cfg.period;
  let time = 0; // секунды собственного вращения
  const target = () => START - time * spin - ((window.scrollY - middle) / stageScale()) * cfg.scroll;

  const tick = (_t: number, deltaMs: number) => {
    const dt = Math.min(deltaMs, 64) / 1000;
    time += dt;
    angle += (target() - angle) * (1 - Math.exp(-dt * FOLLOW));
    render();
  };

  // считаем, только пока блок на экране; при входе — сразу на месте, без докрутки
  let running = false;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting === running) return;
    running = entry.isIntersecting;
    if (running) {
      measureScroll();
      angle = target();
      gsap.ticker.add(tick);
    } else gsap.ticker.remove(tick);
  }).observe(section);
  // закрепления выше меняют высоту страницы — после пересчёта триггеров уточняем середину
  ScrollTrigger.addEventListener('refresh', measureScroll);
}
