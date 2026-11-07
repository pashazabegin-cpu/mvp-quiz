/**
 * Живая карта в блоке «Локация»: Яндекс Карты JS API v3 со стилем из data/map-style.json.
 * Загружается, когда блок подъезжает к экрану. Пока нет ключа (content.ts → location.mapApiKey) или если API
 * не загрузился, остаётся картинка из макета с меткой по центру — блок не ломается.
 * Колесо мыши карта не забирает (нет scrollZoom): оно листает страницу.
 */

type YMapsApi = {
  ready: Promise<void>;
  YMap: new (el: HTMLElement, props: object, children?: unknown[]) => { addChild(child: unknown): void };
  YMapDefaultSchemeLayer: new (props: object) => unknown;
  YMapDefaultFeaturesLayer: new (props: object) => unknown;
  YMapMarker: new (props: object, el: HTMLElement) => unknown;
};

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`не загрузился ${src}`));
    document.head.append(script);
  });

export function initLocationMap() {
  const box = document.querySelector<HTMLElement>('[data-map]');
  const canvas = box?.querySelector<HTMLElement>('[data-map-canvas]');
  const pin = box?.querySelector<HTMLElement>('[data-map-pin]');
  const key = box?.dataset.mapKey;
  if (!box || !canvas || !pin || !key) return;

  const center = (box.dataset.mapCenter ?? '').split(',').map(Number);
  const zoom = Number(box.dataset.mapZoom) || 16;

  const start = async () => {
    await loadScript(`https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(key)}&lang=ru_RU`);
    const ymaps3 = (window as unknown as { ymaps3: YMapsApi }).ymaps3;
    await ymaps3.ready;
    const { default: customization } = await import('../../data/map-style.json');
    const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = ymaps3;
    const map = new YMap(
      canvas,
      {
        location: { center, zoom },
        mode: 'vector',
        // таскать, вращать и наклонять правой кнопкой мыши, на тачпаде — щипком; масштаб двойным кликом
        behaviors: ['drag', 'mouseRotate', 'mouseTilt', 'pinchZoom', 'pinchRotate', 'panTilt', 'dblClick'],
      },
      [new YMapDefaultSchemeLayer({ customization }), new YMapDefaultFeaturesLayer({})],
    );
    map.addChild(new YMapMarker({ coordinates: center, zIndex: 10 }, pin));
    // картинка уходит, когда карта успела отрисоваться
    window.setTimeout(() => box.classList.add('is-live'), 700);
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      start().catch((error) => console.error('[map]', error));
    },
    { rootMargin: '100% 0px' },
  );
  io.observe(box);
}
