/**
 * Прелоадер с MVP: Lottie крутится, пока грузятся шрифты и видео первого экрана.
 * Уходит, только доиграв текущий цикл, чтобы анимация не обрывалась на середине.
 */
import lottie from 'lottie-web/build/player/lottie_light';
import preloaderData from '../../assets/preloader.json';
import { MOBILE_QUERY } from '../core/stage';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function videoReady(video: HTMLVideoElement | null, timeout: number): Promise<void> {
  if (!video || video.readyState >= 3) return Promise.resolve();
  return Promise.race([
    new Promise<void>((resolve) => video.addEventListener('canplay', () => resolve(), { once: true })),
    wait(timeout),
  ]);
}

/** Ждёт загрузку и конец цикла анимации. Возвращает функцию, которая убирает прелоадер из DOM. */
export async function runPreloader(el: HTMLElement | null, firstVideo: HTMLVideoElement | null): Promise<() => void> {
  const fonts = document.fonts?.ready ?? Promise.resolve();
  if (!el) {
    await Promise.all([fonts, videoReady(firstVideo, 4000)]);
    return () => {};
  }

  const holder = el.querySelector<HTMLElement>('[data-lottie]');
  const anim = holder
    ? lottie.loadAnimation({
        container: holder,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: structuredClone(preloaderData),
        rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
      })
    : null;

  // минимум один полный цикл анимации (2 с), максимум ~6 с ожидания видео (на телефоне ~3,5 с:
  // в энергосбережении iOS видео до касания не грузится, а под ним всё равно стоит постер)
  await Promise.all([fonts, videoReady(firstVideo, window.matchMedia(MOBILE_QUERY).matches ? 3500 : 6000), wait(1900)]);

  if (anim && !anim.isPaused) {
    await Promise.race([new Promise<void>((resolve) => anim.addEventListener('loopComplete', () => resolve())), wait(2200)]);
    anim.pause();
  }

  return () => {
    anim?.destroy();
    el.remove();
  };
}
