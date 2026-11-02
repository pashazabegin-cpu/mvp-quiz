/**
 * Кадр макета 1440×900 (как на MVP): интерфейс экранов масштабируется так, чтобы кадр
 * целиком влез в экран, а по ширине тянется сетка 14 колонок (--col в tokens.css).
 * Выставляет на <html>: --ui-s (масштаб), --ui-w/--ui-h (размер экрана в px макета),
 * --hero-cover (масштаб фона 1600×900 «по cover»).
 * На вертикальных экранах (тот же запрос, что на MVP) — кадр 375 по ширине.
 */
export const MOBILE_QUERY = '(max-aspect-ratio: 4/5)';

const listeners: Array<() => void> = [];

/** Подписка на пересчёт масштаба (ресайз, поворот экрана) */
export const onStageFit = (fn: () => void) => listeners.push(fn);

export function initStage() {
  const root = document.documentElement;
  const mobile = window.matchMedia(MOBILE_QUERY);

  const fit = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const s = mobile.matches ? w / 375 : Math.min(w / 1440, h / 900);
    const cover = Math.max(w / 1600, h / 900);
    root.style.setProperty('--ui-s', s.toFixed(4));
    root.style.setProperty('--ui-w', `${(w / s).toFixed(2)}px`);
    root.style.setProperty('--ui-h', `${(h / s).toFixed(2)}px`);
    root.style.setProperty('--hero-cover', cover.toFixed(4));
    root.classList.toggle('is-mobile', mobile.matches);
    listeners.forEach((fn) => fn());
  };

  fit();
  window.addEventListener('resize', fit);
  mobile.addEventListener('change', fit);
}

/** Текущий масштаб кадра (px макета → px экрана) */
export const stageScale = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-s')) || 1;
