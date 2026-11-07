/**
 * Снег на <canvas data-snow> позади блока. data-snow-density="0.5" — плотность (по умолчанию 1).
 * Границы и растворение задаёт CSS-маска на самом canvas (Tickets.astro, Footer.astro).
 *
 * Снег в несколько планов, как при съёмке с малой глубиной резкости:
 *   дальний — мелкие редкие точки, отстают от страницы при скролле;
 *   средний — основная масса;
 *   ближний — крупные мягкие пятна не в фокусе, летят быстрее и обгоняют страницу;
 *   снежинки — те же кристаллы, что в «Что мы придумали?», медленно поворачиваются.
 * Общий ветер с редкими порывами сносит всех сразу, снежинки разлетаются от курсора,
 * а планы чуть смещаются за мышью. Вне экрана на паузе. Canvas считается в экранных px:
 * он лежит в масштабируемом кадре, поэтому размер берём из getBoundingClientRect.
 */
import { withBase } from '../../lib/paths';

type Plane = {
  /** доля от всех снежинок */
  share: number;
  /** размер: радиус, px */
  size: [number, number];
  /** скорость падения, px/с */
  speed: [number, number];
  alpha: [number, number];
  /** амплитуда покачивания, px/с */
  sway: number;
  /** какая часть скролла добавляется к движению: меньше нуля — отстаёт от страницы, больше — обгоняет */
  scroll: number;
  /** смещение за мышью, px */
  mouse: number;
  /** мягкий ли край: 0 — чёткая точка, 1 — пятно не в фокусе */
  soft: number;
  crystal?: boolean;
};

const PLANES: Plane[] = [
  { share: 0.5, size: [0.5, 1.1], speed: [16, 26], alpha: [0.25, 0.5], sway: 7, scroll: -0.28, mouse: 4, soft: 0.25 },
  { share: 0.36, size: [1.1, 2.3], speed: [30, 50], alpha: [0.45, 0.85], sway: 16, scroll: 0.04, mouse: 12, soft: 0.45 },
  { share: 0.1, size: [4, 8.5], speed: [70, 105], alpha: [0.1, 0.24], sway: 30, scroll: 0.45, mouse: 34, soft: 1 },
  { share: 0.04, size: [6, 13], speed: [34, 56], alpha: [0.35, 0.7], sway: 20, scroll: 0.2, mouse: 20, soft: 0, crystal: true },
];

const REPEL_RADIUS = 130;
const MAX_FLAKES = 340;
const CRYSTALS = [1, 2, 3, 5, 7, 8];

type Flake = {
  plane: Plane;
  x: number;
  y: number;
  r: number;
  speed: number;
  alpha: number;
  phase: number;
  /** частота покачивания */
  freq: number;
  sprite: CanvasImageSource | null;
  angle: number;
  spin: number;
  /** смещение от курсора, затухает со временем */
  ox: number;
  oy: number;
};

const random = ([a, b]: [number, number]) => a + Math.random() * (b - a);

/** заранее отрисованное круглое пятно: drawImage в разы дешевле градиента на каждую снежинку */
function dotSprite(soft: number) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgb(255 255 255 / 1)');
  g.addColorStop(Math.max(0.05, 0.85 - soft * 0.8), 'rgb(255 255 255 / 1)');
  g.addColorStop(1, 'rgb(255 255 255 / 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

/** кристалл из макета, перекрашенный в белый */
function crystalSprites() {
  const sprites: HTMLCanvasElement[] = [];
  CRYSTALS.forEach((n) => {
    const img = new Image();
    img.onload = () => {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, size, size);
      sprites.push(canvas);
    };
    img.src = withBase(`/media/intro/snow-${n}.svg`);
  });
  return sprites;
}

class Snow {
  private ctx: CanvasRenderingContext2D;
  private flakes: Flake[] = [];
  private dots = new Map<number, HTMLCanvasElement>();
  private crystals = crystalSprites();
  private width = 0;
  private height = 0;
  private dpr = 1;
  private cursor: { x: number; y: number } | null = null;
  /** положение мыши −1…1 с плавным догоном: сдвигает планы */
  private lookX = 0;
  private lookTarget = 0;
  private raf = 0;
  private last = 0;
  private lastScroll = window.scrollY;

  constructor(
    private canvas: HTMLCanvasElement,
    private density: number,
  ) {
    this.ctx = canvas.getContext('2d')!;
    PLANES.forEach((p) => this.dots.has(p.soft) || this.dots.set(p.soft, dotSprite(p.soft)));

    const host = canvas.parentElement ?? canvas;
    host.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.cursor = { x: e.clientX - r.left, y: e.clientY - r.top };
      this.lookTarget = r.width ? (this.cursor.x / r.width) * 2 - 1 : 0;
    });
    host.addEventListener('pointerleave', () => {
      this.cursor = null;
      this.lookTarget = 0;
    });

    new ResizeObserver(() => this.resize()).observe(canvas);
    window.addEventListener('resize', () => this.resize());
    new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(this.raf);
      if (entry.isIntersecting) {
        this.last = 0;
        this.lastScroll = window.scrollY;
        this.raf = requestAnimationFrame(this.loop);
      }
    }).observe(canvas);
    this.resize();
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    if (Math.abs(r.width - this.width) < 1 && Math.abs(r.height - this.height) < 1) return;
    this.dpr = Math.min(window.devicePixelRatio, 2);
    this.width = r.width;
    this.height = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    const count = Math.min(MAX_FLAKES, Math.round(((r.width * r.height) / 9000) * this.density));
    this.flakes = [];
    PLANES.forEach((plane) => {
      const n = Math.round(count * plane.share);
      for (let i = 0; i < n; i++) this.flakes.push(this.create(plane, Math.random() * this.height));
    });
  }

  private create(plane: Plane, y: number): Flake {
    return {
      plane,
      x: Math.random() * this.width,
      y,
      r: random(plane.size),
      speed: random(plane.speed),
      alpha: random(plane.alpha),
      phase: Math.random() * Math.PI * 2,
      freq: 0.4 + Math.random() * 0.8,
      sprite: null,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.9,
      ox: 0,
      oy: 0,
    };
  }

  /** ветер: медленно меняется, изредка налетает порыв */
  private wind(t: number) {
    const gust = Math.pow(Math.max(0, Math.sin(t * 0.09)), 12) * 70;
    return Math.sin(t * 0.17) * 12 + Math.sin(t * 0.41 + 1.7) * 6 + gust;
  }

  private loop = (time: number) => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = this.last ? Math.min(0.05, (time - this.last) / 1000) : 0.016;
    this.last = time;
    const t = time / 1000;
    const { ctx, dpr, width, height, cursor } = this;
    const wind = this.wind(t);
    const scrolled = window.scrollY - this.lastScroll;
    this.lastScroll = window.scrollY;
    this.lookX += (this.lookTarget - this.lookX) * 0.04;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    for (const f of this.flakes) {
      const { plane } = f;
      // чем ближе план, тем сильнее его сносит ветром
      f.y += f.speed * dt - scrolled * plane.scroll;
      f.x += (Math.sin(t * f.freq + f.phase) * plane.sway + wind * (0.35 + plane.mouse / 34)) * dt;
      f.angle += f.spin * dt;

      if (cursor) {
        const dx = f.x + f.ox - cursor.x;
        const dy = f.y + f.oy - cursor.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < REPEL_RADIUS) {
          const push = (1 - dist / REPEL_RADIUS) * 3.2;
          f.ox += (dx / dist) * push;
          f.oy += (dy / dist) * push;
        }
      }
      f.ox *= 0.94;
      f.oy *= 0.94;

      const size = f.r * 2;
      // вышла за край — возвращается с другой стороны. Именно остатком от деления, а не в одну точку:
      // при резком прыжке скролла (ссылка в меню) иначе все снежинки разом выстроились бы в линию
      if (f.y > height + size || f.y < -size) {
        const span = height + size * 2;
        f.y = (((f.y + size) % span) + span) % span - size;
        f.x = Math.random() * width;
        f.sprite = null;
      }
      if (f.x > width + size) f.x = -size;
      else if (f.x < -size) f.x = width + size;

      if (plane.crystal) {
        if (!this.crystals.length) continue;
        f.sprite ??= this.crystals[Math.floor(Math.random() * this.crystals.length)];
      }
      const sprite = f.sprite ?? this.dots.get(plane.soft)!;
      const x = f.x + f.ox - this.lookX * plane.mouse;
      const y = f.y + f.oy;

      ctx.globalAlpha = f.alpha;
      if (plane.crystal) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(f.angle);
        ctx.drawImage(sprite, -f.r, -f.r, size, size);
        ctx.restore();
      } else {
        ctx.drawImage(sprite, x - f.r, y - f.r, size, size);
      }
    }
    ctx.globalAlpha = 1;
  };
}

export function initSnow() {
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-snow]').forEach((canvas) => {
    new Snow(canvas, parseFloat(canvas.dataset.snowDensity ?? '') || 1);
  });
}
