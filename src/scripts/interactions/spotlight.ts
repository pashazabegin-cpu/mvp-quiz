/**
 * Пишет координаты курсора в CSS-переменные элемента:
 * --mx / --my — в пикселях (для radial-gradient), --gx — в процентах по ширине (для бликов).
 * [data-spotlight] — плюс готовое пятно света (стиль в global.css)
 * [data-pointer]   — только переменные, визуал задаёт сам компонент (сетка партнёров)
 */
export function initSpotlight() {
  document.querySelectorAll<HTMLElement>('[data-spotlight], [data-pointer]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
      el.style.setProperty('--gx', `${(x / r.width) * 100}%`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.removeProperty('--mx');
      el.style.removeProperty('--my');
    });
  });
}
