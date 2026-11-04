/**
 * Орбита иконок вокруг плашки «Спортивного квиза» (референс — карусель-цилиндр dialkit.dev).
 *
 * Иконки стоят на окружности радиуса R в горизонтальной плоскости через центр плашки,
 * через равные углы (360° / 28) и в одинаковых рамках — разницу в размере и яркости даёт только
 * перспектива: камера на расстоянии D = K·R от ближней точки орбиты (масштаб = D / глубина)
 * и чуть сверху, поэтому передняя дуга провисает «улыбкой», а дальние иконки выше и меньше.
 * Положение считается по этой перспективе, а размер и яркость — по её степени (масштаб^SIZE_POW):
 * иконки к краям уменьшаются заметнее, но не налезают друг на друга у края кольца.
 * Передняя половина орбиты — поверх плашки и текста, задняя — за плашкой (видна только по краям).
 *
 * Скорость: постоянное вращение + разгон от скорости скролла (вниз — вперёд, вверх — назад),
 * после остановки скролла плавно возвращается к обычной. Цикл бесконечный.
 * Вне экрана не считается. При «уменьшить движение» — стоит на месте.
 */
import { gsap } from 'gsap';
import { MOBILE_QUERY, onStageFit } from '../core/stage';

type Config = {
  /** камера: D = K·R (меньше — сильнее перспектива и плотнее иконки у краёв кольца) */
  k: number;
  /** насколько крайняя видимая точка орбиты выходит за половину кадра, px макета */
  reach: number;
  /** провисание передней дуги (центр против краёв), px макета */
  dip: number;
  /** центр передней иконки от верха блока, px макета */
  y: number;
  /** обычная скорость — секунд на оборот */
  period: number;
  /** разгон: рад/с на 1 px/с скорости скролла */
  boost: number;
};

// край кольца уходит за край кадра: на 1440 — R ≈ 1100, шаг у центра ≈ 245 (как в макете);
// на мобильном кольцо шире экрана (как в макете: видно 3 иконки целиком и 2 по краям)
const DESKTOP: Config = { k: 2, reach: 58, dip: 64, y: 756, period: 70, boost: 0.0005 };
const MOBILE: Config = { k: 2, reach: 150, dip: 24, y: 426, period: 60, boost: 0.0004 };
/** размер и яркость иконки — масштаб перспективы в этой степени */
const SIZE_POW = 3;
/** предел скорости, рад/с — чтобы на резком скролле иконки не превращались в мельтешение */
const MAX_SPEED = 3;
/** выше этой скорости скролла (px/с) разгон не растёт */
const MAX_SCROLL = 5000;
/** край плашки от края кадра, px макета (на мобильном плашка во всю ширину) */
const PLATE_INSET = { desktop: 60, mobile: 0 };

export function initQuizOrbit(motion: boolean) {
  const section = document.querySelector<HTMLElement>('[data-quiz]');
  const ui = section?.querySelector<HTMLElement>('[data-quiz-ui]');
  if (!section || !ui) return;
  const mobile = window.matchMedia(MOBILE_QUERY).matches;
  const cfg = mobile ? MOBILE : DESKTOP;
  const inset = mobile ? PLATE_INSET.mobile : PLATE_INSET.desktop;

  const items = Array.from(section.querySelectorAll<HTMLElement>('[data-orbit-item]'));
  const n = items.length;
  if (!n) return;
  const step = (Math.PI * 2) / n;

  let box = 230; // сторона рамки иконки, px макета
  let cx = 720; // центр орбиты по горизонтали
  let R = 1000;
  let D = 1000;
  let tilt = 0;
  let plateHalf = 660;

  const measure = () => {
    box = items[0].offsetWidth;
    const half = ui.offsetWidth / 2;
    cx = half;
    plateHalf = half - inset;
    // крайняя видимая точка орбиты: max(sinθ · K/(K + 1 − cosθ)) при cosθ = 1/(K + 1)
    const c = 1 / (cfg.k + 1);
    const extent = (Math.sqrt(1 - c * c) * cfg.k) / (cfg.k + 1 - c);
    R = (half + cfg.reach) / extent;
    D = cfg.k * R;
    tilt = cfg.dip / R;
  };

  // угол орбиты: иконка i стоит на angle + i·step, 0 — спереди по центру. Старт как в макете:
  // по центру кубок (5-й в списке), слева от него мяч, шуба, шар, маска, справа — оливье, перчатки, шпроты
  let angle = -4 * step;

  const render = () => {
    for (let i = 0; i < n; i++) {
      const t = angle + i * step;
      const sin = Math.sin(t);
      const cos = Math.cos(t);
      const s = D / (D + R * (1 - cos));
      const size = s ** SIZE_POW;
      const x = cx + R * sin * s;
      const y = cfg.y - cfg.dip + R * cos * tilt * s;
      const front = cos > 0;
      const half = (box * size) / 2;
      // не рисуем: за краем кадра или за плашкой и целиком закрыта ею
      const hidden = x + half < 0 || x - half > cx * 2 || (!front && Math.abs(x - cx) + half < plateHalf);
      const el = items[i];
      el.style.visibility = hidden ? 'hidden' : '';
      if (hidden) continue;
      // яркость по глубине: передняя — 100%, к краям тускнеет, сзади — едва видна
      el.style.opacity = String(0.25 + 0.75 * size);
      el.style.zIndex = front ? String(4 + Math.round(cos * 40)) : '1';
      el.style.transform = `translate3d(${(x - box / 2).toFixed(2)}px, ${(y - box / 2).toFixed(2)}px, 0) scale(${size.toFixed(4)})`;
    }
  };

  measure();
  render();
  onStageFit(() => {
    measure();
    render();
  });
  if (!motion) return;

  const base = (Math.PI * 2) / cfg.period;
  let speed = base;
  let lastY = window.scrollY;
  let velocity = 0; // сглаженная скорость скролла, px/с

  const tick = (_time: number, deltaMs: number) => {
    const dt = Math.min(deltaMs, 64) / 1000;
    if (!dt) return;
    const y = window.scrollY;
    // прыжок скролла (якорь, перезагрузка) не должен раскручивать орбиту до упора
    const raw = gsap.utils.clamp(-MAX_SCROLL, MAX_SCROLL, (y - lastY) / dt);
    lastY = y;
    // скорость скролла сглаживаем — разгон и торможение плавные, без рывков от отдельных кадров
    velocity += (raw - velocity) * (1 - Math.exp(-dt * 6));
    const target = gsap.utils.clamp(-MAX_SPEED, MAX_SPEED, base + velocity * cfg.boost);
    speed += (target - speed) * (1 - Math.exp(-dt * 3));
    angle = (angle + speed * dt) % (Math.PI * 2);
    render();
  };

  // считаем, только пока блок на экране
  let running = false;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting === running) return;
    running = entry.isIntersecting;
    if (running) {
      lastY = window.scrollY;
      gsap.ticker.add(tick);
    } else gsap.ticker.remove(tick);
  }).observe(section);
}
