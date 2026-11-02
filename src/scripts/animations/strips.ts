/**
 * Переход «полосами» с MVP: одна маска clip-path: polygon() из N наклонных полос.
 * Так прелоадер уходит, открывая первый экран.
 */

/** Видимая часть каждой полосы: [начало, конец] в долях ширины полосы (0…1). */
export type StripSpan = [number, number];

export function stripsPolygon(width: number, height: number, spans: StripSpan[], angleDeg: number): string {
  // горизонтальный сдвиг верха/низа полосы относительно её середины
  const shift = (height / 2) * Math.tan((angleDeg * Math.PI) / 180);
  const reach = Math.abs(shift);
  const stripWidth = (width + 2 * reach) / spans.length;
  const points: string[] = [];

  spans.forEach(([from, to], i) => {
    if (to - from <= 0.0005) return;
    const start = -reach + i * stripWidth;
    // полпикселя внахлёст, чтобы между соседними полосами не было шва
    const a = start + from * stripWidth - 0.5;
    const b = start + to * stripWidth + 0.5;
    points.push(
      `${(a - shift).toFixed(1)}px ${height}px`,
      `${(a + shift).toFixed(1)}px 0px`,
      `${(b + shift).toFixed(1)}px 0px`,
      `${(b - shift).toFixed(1)}px ${height}px`,
    );
  });

  return points.length ? `polygon(${points.join(',')})` : 'polygon(0 0, 0 0, 0 0)';
}

/** Полосы закрываются слева направо: прогресс 0…1 каждой полосы → видимый отрезок */
export const hideSpans = (progress: number[]): StripSpan[] => progress.map((p) => [p, 1]);
