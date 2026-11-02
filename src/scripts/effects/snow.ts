/**
 * Снег на <canvas data-snow> поверх секции. Снежинки разлетаются от курсора.
 * data-snow-density="0.5" — плотность (по умолчанию 1).
 * Вне экрана анимация на паузе.
 */

type Flake = {
  x: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
  /** смещение от курсора, затухает со временем */
  ox: number;
  oy: number;
};

const REPEL_RADIUS = 120;

class Snow {
  private ctx: CanvasRenderingContext2D;
  private flakes: Flake[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;
  private mouse: { x: number; y: number } | null = null;
  private visible = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    const host = canvas.parentElement ?? canvas;
    const density = parseFloat(canvas.dataset.snowDensity ?? '') || 1;

    host.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    });
    host.addEventListener('pointerleave', () => (this.mouse = null));

    new ResizeObserver(() => this.resize(density)).observe(canvas);
    new IntersectionObserver(([entry]) => (this.visible = entry.isIntersecting)).observe(canvas);
    this.resize(density);
    requestAnimationFrame(this.loop);
  }

  private resize(density: number) {
    this.dpr = Math.min(window.devicePixelRatio, 2);
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    const count = Math.round(((this.width * this.height) / 9000) * density);
    this.flakes = Array.from({ length: count }, () => this.createFlake(Math.random() * this.height));
  }

  private createFlake(y: number): Flake {
    const r = Math.random() * 2.2 + 0.6;
    return { x: Math.random() * this.width, y, r, speed: r * 0.35 + 0.2, phase: Math.random() * Math.PI * 2, ox: 0, oy: 0 };
  }

  private loop = (time: number) => {
    requestAnimationFrame(this.loop);
    if (!this.visible) return;
    const { ctx, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    for (const f of this.flakes) {
      f.y += f.speed;
      f.x += Math.sin(time * 0.001 + f.phase) * 0.3;

      if (this.mouse) {
        const dx = f.x + f.ox - this.mouse.x;
        const dy = f.y + f.oy - this.mouse.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < REPEL_RADIUS) {
          const push = (1 - dist / REPEL_RADIUS) * 4;
          f.ox += (dx / dist) * push;
          f.oy += (dy / dist) * push;
        }
      }
      f.ox *= 0.95;
      f.oy *= 0.95;

      if (f.y - f.r > this.height) Object.assign(f, this.createFlake(-f.r));

      ctx.globalAlpha = 0.25 + f.r * 0.22;
      ctx.beginPath();
      ctx.arc(f.x + f.ox, f.y + f.oy, f.r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
  };
}

export function initSnow() {
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-snow]').forEach((canvas) => new Snow(canvas));
}
