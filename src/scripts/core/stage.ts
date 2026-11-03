/**
 * Кадр макета 1440×900 (как на MVP): интерфейс экранов масштабируется так, чтобы кадр
 * целиком влез в экран, а по ширине тянется сетка 14 колонок (--col в tokens.css).
 * Выставляет на <html>: --ui-s (масштаб), --ui-w/--ui-h (размер экрана в px макета),
 * --hero-cover (масштаб фона 1600×900 «по cover»).
 *
 * Экран не шире своей высоты (телефоны, планшеты вертикально, узкие окна) — мобильный макет
 * (Figma: секция «Квизмас · Mobile 375»): кадр 375 по ширине, но не меньше MOBILE_MIN_H по высоте
 * и не крупнее MOBILE_MAX_S — на планшете колонка шире, а шрифт не раздувается.
 * Этот же запрос — в @media всех экранов.
 *
 * Высота — «малая» (100svh, с панелями браузера), как у экранов (.stage): на телефоне панель
 * прячется и появляется при прокрутке, и если бы кадр считался от текущей высоты,
 * вёрстка масштабировалась бы на ходу. Пересчёт — только когда меняется ширина или малая высота (поворот).
 */
export const MOBILE_QUERY = '(max-aspect-ratio: 1/1)';
/** высота мобильной композиции, которая обязана влезть в экран (самый высокий — «Что мы придумали?» с головами) */
const MOBILE_MIN_H = 700;
const MOBILE_MAX_S = 1.5;

const listeners: Array<() => void> = [];

/** Подписка на пересчёт масштаба (ресайз, поворот экрана) */
export const onStageFit = (fn: () => void) => listeners.push(fn);

export function initStage() {
  const root = document.documentElement;
  const mobile = window.matchMedia(MOBILE_QUERY);

  // малая высота экрана: пробный блок высотой 100svh (без поддержки svh — обычная высота окна)
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);

  let last = '';
  const fit = () => {
    const w = window.innerWidth;
    const h = probe.offsetHeight || window.innerHeight;
    const key = `${w}x${h}x${mobile.matches}`;
    if (key === last) return;
    last = key;
    const s = mobile.matches ? Math.min(w / 375, h / MOBILE_MIN_H, MOBILE_MAX_S) : Math.min(w / 1440, h / 900);
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
/** Высота экрана в px макета (малая — без учёта спрятанной панели браузера) */
export const stageHeight = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-h')) || 900;
