/**
 * «Жидкое стекло» для плашек поверх живой страницы (меню) — перенесено с проекта AIR (линза курсора).
 * Фон под плашкой проходит через SVG-фильтр: размытие и насыщенность (матовое стекло),
 * затем у края картинка подтягивается снаружи и чуть расслаивается по цветам — как у толстого стекла.
 * Работает только в Chromium (backdrop-filter: url()); в остальных браузерах — обычное размытие из CSS.
 *
 * Разметка: [data-glass] — плашка, внутри [data-glass-lens] — слой с фильтром (стили — Nav.astro).
 */

/** матовость, px размытия */
const FROST = 10;
const SATURATE = 1.5;
/** ширина фаски у края, px */
const BEVEL = 18;
/** плавный сдвиг по всей фаске и резкий у самого края, px */
const REFRACTION = 6;
const BEVEL_DEPTH = 26;
/** расслоение цветов: красный отстаёт, синий опережает */
const ABERRATION = 0.15;
/** насколько далеко край берёт картинку снаружи плашки — на столько слой с фильтром шире её */
const REACH = Math.ceil((REFRACTION + BEVEL_DEPTH) * (1 + ABERRATION));

const isChromium = () =>
  (navigator as { userAgentData?: { brands?: { brand: string }[] } }).userAgentData?.brands?.some((b) => b.brand === 'Chromium') ?? false;

export function initLiquidGlass() {
  if (!isChromium()) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  document.body.append(svg);

  document.querySelectorAll<HTMLElement>('[data-glass]').forEach((host, n) => {
    const lens = host.querySelector<HTMLElement>('[data-glass-lens]');
    if (!lens) return;
    const id = `liquid-glass-${n}`;
    const channel = (name: string, matrix: string) => `
      <feDisplacementMap in="frost" in2="map" xChannelSelector="R" yChannelSelector="G" result="${name}d" />
      <feColorMatrix in="${name}d" type="matrix" values="${matrix}" result="${name}" />`;
    const filter = document.createElementNS(ns, 'filter');
    filter.id = id;
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    filter.setAttribute('x', '0');
    filter.setAttribute('y', '0');
    filter.setAttribute('width', '1');
    filter.setAttribute('height', '1');
    filter.innerHTML = `
      <feGaussianBlur in="SourceGraphic" stdDeviation="${FROST}" edgeMode="duplicate" result="blur" />
      <feColorMatrix in="blur" type="saturate" values="${SATURATE}" result="frost" />
      <feImage preserveAspectRatio="none" x="${REACH}" y="${REACH}" result="map" />
      ${channel('r', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0')}
      ${channel('g', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0')}
      ${channel('b', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0')}
      <feComposite in="r" in2="g" operator="arithmetic" k2="1" k3="1" result="rg" />
      <feComposite in="rg" in2="b" operator="arithmetic" k2="1" k3="1" />`;
    svg.append(filter);

    const image = filter.querySelector('feImage')!;
    const maps = filter.querySelectorAll('feDisplacementMap');
    const full = 2 * (REFRACTION + BEVEL_DEPTH); // значение карты 0…1 ↔ сдвиг ±full / 2
    maps.forEach((map, i) => map.setAttribute('scale', String(full * [1 - ABERRATION, 1, 1 + ABERRATION][i])));

    let size = '';
    const fit = () => {
      const w = Math.round(host.offsetWidth);
      const h = Math.round(host.offsetHeight);
      if (!w || !h || size === `${w}x${h}`) return;
      size = `${w}x${h}`;
      image.setAttribute('width', String(w));
      image.setAttribute('height', String(h));
      image.setAttribute('href', pillMap(w, h));
    };

    host.style.setProperty('--glass-reach', String(REACH));
    lens.style.backdropFilter = `url(#${id})`;
    host.classList.add('is-refracting');
    fit();
    new ResizeObserver(fit).observe(host);
  });
}

/**
 * Карта сдвига для плашки-«пилюли» w×h (R = x, G = y, 0.5 — на месте), профиль как у liquidGL:
 * edge = 1 − smoothstep(0, BEVEL, глубина от края); сдвиг = edge·REFRACTION + edge¹⁰·BEVEL_DEPTH, наружу по нормали.
 */
function pillMap(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
    return t * t * (3 - 2 * t);
  };
  const max = REFRACTION + BEVEL_DEPTH;
  const r = h / 2;
  const straight = w / 2 - r; // половина прямого участка
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - w / 2;
      const py = y + 0.5 - h / 2;
      // нормаль и глубина от края «пилюли»: на скруглениях — от центра дуги, на прямых — вертикально
      const qx = Math.abs(px) - straight;
      let nx = 0;
      let ny = Math.sign(py);
      let depth = r - Math.abs(py);
      if (qx > 0) {
        const len = Math.hypot(qx, py) || 1;
        nx = (Math.sign(px) * qx) / len;
        ny = py / len;
        depth = r - len;
      }
      const edge = 1 - smooth(0, BEVEL, Math.max(depth, 0));
      const push = (edge * REFRACTION + Math.pow(edge, 10) * BEVEL_DEPTH) / max;
      const i = (y * w + x) * 4;
      img.data[i] = Math.round(127.5 + 127.5 * nx * push);
      img.data[i + 1] = Math.round(127.5 + 127.5 * ny * push);
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}
