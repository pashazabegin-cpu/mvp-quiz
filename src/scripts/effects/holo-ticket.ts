/**
 * Голографический билет (механика эффекта Holographic Card: holoCard.html; цвета и ламинация — в Tickets.astro).
 * [data-holo-stage] — зона, где следим за курсором (весь блок), [data-holo] — сама карточка.
 * Карточка поворачивается за курсором (наклон считается по всему блоку). --mx/--my — положение курсора на самом билете:
 * за ним идёт круг света, навстречу плывут пятна и полосы цвета, край загорается со стороны света (--la).
 * --shine — сила света, --react — реакция текста (стили — Tickets.astro).
 * Без курсора билет не замирает: чуть покачивается, и свет медленно плывёт по поверхности.
 * Угол меньше, чем в исходном эффекте: билет в 2.4 раза шире карточки, иначе края слишком наезжают на камеру.
 * Вне экрана цикл на паузе. Переворот по клику из эффекта не взят: на билете кнопка, а оборота в макете нет.
 */
const TILT = 24;
const EASE = 0.12;
const SHINE_ACTIVE = 1;
const SHINE_IDLE = 0.55;
const SCALE_ACTIVE = 1.02;
/** при какой силе фольги текст начинает реагировать (в покое реакция едва заметна) */
const REACT_FROM = 0.45;
/** пропорции билета 1124×455: чтобы угол на свет считался в настоящих пикселях, а не в процентах */
const ASPECT = 1124 / 455;

export function initHoloTicket() {
  const stage = document.querySelector<HTMLElement>('[data-holo-stage]');
  const card = stage?.querySelector<HTMLElement>('[data-holo]');
  if (!stage || !card) return;

  /** текущее состояние: повороты, положение фольги в %, сила фольги, масштаб */
  const now = { rx: 0, ry: 0, mx: 50, my: 50, shine: SHINE_IDLE, scale: 1 };
  const target = { ...now };
  let active = false;
  let raf = 0;

  const frame = (time: number) => {
    raf = requestAnimationFrame(frame);
    if (!active) {
      const t = time / 1000;
      target.rx = Math.sin(t * 0.45) * 2.2;
      target.ry = Math.cos(t * 0.33) * 3.5;
      target.mx = 50 + Math.sin(t * 0.31) * 42;
      target.my = 50 + Math.cos(t * 0.23) * 42;
      target.shine = SHINE_IDLE;
      target.scale = 1;
    }
    for (const key of Object.keys(now) as Array<keyof typeof now>) now[key] += (target[key] - now[key]) * EASE;
    card.style.transform = `rotateX(${now.rx.toFixed(3)}deg) rotateY(${now.ry.toFixed(3)}deg) scale(${now.scale.toFixed(4)})`;
    card.style.setProperty('--mx', `${now.mx.toFixed(2)}%`);
    card.style.setProperty('--my', `${now.my.toFixed(2)}%`);
    // откуда свет: 0 — слева, 1 — справа; --la — направление на свет от центра билета (угол CSS-градиента, 0 — вверх)
    card.style.setProperty('--lx', Math.min(1, Math.max(0, now.mx / 100)).toFixed(3));
    const la = (Math.atan2((now.mx - 50) * ASPECT, -(now.my - 50)) * 180) / Math.PI;
    card.style.setProperty('--la', la.toFixed(1));
    // точка на краю в сторону света: луч из центра до границы билета
    const dx = (now.mx - 50) * ASPECT;
    const dy = now.my - 50;
    const reach = Math.max(Math.abs(dx) / (50 * ASPECT), Math.abs(dy) / 50) || 1;
    card.style.setProperty('--ex', `${(50 + dx / ASPECT / reach).toFixed(2)}%`);
    card.style.setProperty('--ey', `${(50 + dy / reach).toFixed(2)}%`);
    card.style.setProperty('--shine', now.shine.toFixed(3));
    card.style.setProperty('--react', Math.max(0, (now.shine - REACT_FROM) / (SHINE_ACTIVE - REACT_FROM)).toFixed(3));
  };

  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = stage.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    active = true;
    target.rx = (0.5 - py) * TILT;
    target.ry = (px - 0.5) * TILT;
    // свет — точно под курсором: координаты считаем от самого билета, за его краем он просто уходит
    const box = (card.parentElement ?? card).getBoundingClientRect();
    target.mx = ((e.clientX - box.left) / box.width) * 100;
    target.my = ((e.clientY - box.top) / box.height) * 100;
    target.shine = SHINE_ACTIVE;
    target.scale = SCALE_ACTIVE;
  });
  stage.addEventListener('pointerleave', () => (active = false));

  new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(raf);
    if (entry.isIntersecting) raf = requestAnimationFrame(frame);
  }).observe(stage);
}
